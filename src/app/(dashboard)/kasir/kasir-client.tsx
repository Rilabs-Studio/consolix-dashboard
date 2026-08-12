"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { io, type Socket } from "socket.io-client";
import type { Booking, CashShift, ConsoleUnit, TvDevice } from "@/lib/types";
import { CONSOLE_UNIT_STATUS_LABEL } from "@/lib/constants";
import { useRdmsState } from "@/lib/use-rdms-state";
import { formatRupiah } from "@/lib/utils";
import {
  backfillSession,
  checkInBooking,
  closeShift,
  extendSession,
  openShift,
  startWalkIn,
  type ActionResult,
} from "@/server/actions/pos";
import {
  broadcastTv,
  lockTvKiosk,
  setTvMute,
  setTvVolume,
  unlockTvKiosk,
} from "@/server/actions/rdms";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { SubmitButton } from "@/components/forms/form-controls";
import { BillDialog } from "./bill-dialog";
import {
  SESSION_CARD_TONE,
  SessionTimer,
  sessionTone,
  useNow,
} from "@/components/session/session-timer";

interface BoardBooking {
  id: string;
  code: string;
  status: string;
  startAt: string;
  endAt: string;
  customerName: string | null;
}

type Dialog =
  | { kind: "walkin"; unit: ConsoleUnit }
  | { kind: "checkout"; unit: ConsoleUnit; session: BoardBooking }
  | { kind: "extend"; unit: ConsoleUnit; session: BoardBooking }
  | { kind: "openShift" }
  | { kind: "closeShift" }
  | { kind: "backfill" }
  | { kind: "broadcast"; deviceId?: string }
  | { kind: "audio"; deviceId: string }
  | { kind: "kiosk"; deviceId: string }
  | null;

const STATUS_TONE: Record<string, "green" | "blue" | "yellow" | "red"> = {
  available: "green",
  in_use: "blue",
  booked: "yellow",
  maintenance: "red",
};

// Kelipatan 15 menit — di bawah itu backend menolak dengan INVALID_DURATION.
const EXTEND_DURATIONS = [15, 30, 60, 120];
const BROADCAST_SECONDS = [5, 10, 30, 60];

function durationLabel(minutes: number): string {
  return minutes >= 60 ? `${minutes / 60} jam` : `${minutes} menit`;
}

function liveOrigin(): string {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/v1";
  return base.replace(/\/v1\/?$/, "");
}

function toBoardBooking(s: Booking): [string, BoardBooking] {
  return [
    s.consoleUnitId,
    {
      id: s.id,
      code: s.code,
      status: s.status,
      startAt: s.startAt,
      endAt: s.endAt,
      customerName: s.customerName,
    },
  ];
}

export function KasirClient({
  initialUnits,
  initialSessions,
  shift,
  initialDevices,
  canBackfill,
}: {
  initialUnits: ConsoleUnit[];
  initialSessions: Booking[];
  shift: CashShift | null;
  initialDevices: TvDevice[];
  /** Operator+ saja — backdating sesi rawan disalahgunakan. */
  canBackfill: boolean;
}) {
  const router = useRouter();
  const [units, setUnits] = useState(initialUnits);
  const [sessionByUnit, setSessionByUnit] = useState<Record<string, BoardBooking>>(() =>
    Object.fromEntries(initialSessions.map(toBoardBooking))
  );
  const [dialog, setDialog] = useState<Dialog>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const socketRef = useRef<Socket | null>(null);
  // Satu jam untuk seluruh papan, bukan satu interval per kartu.
  const now = useNow();

  // Sisi fisik meja (online/offline, volume) datang dari WebSocket Go RDMS —
  // sumber terpisah dari booking, dijahit ke kartu lewat unit.rdmsDeviceId.
  const { devices, connected, calls, dismissCall } = useRdmsState(initialDevices);
  const deviceById = useMemo(() => new Map(devices.map((d) => [d.id, d])), [devices]);

  // Server props change after router.refresh() — adjust state during render
  // (the React-endorsed alternative to a resync effect).
  const [prevUnits, setPrevUnits] = useState(initialUnits);
  if (prevUnits !== initialUnits) {
    setPrevUnits(initialUnits);
    setUnits(initialUnits);
  }
  const [prevSessions, setPrevSessions] = useState(initialSessions);
  if (prevSessions !== initialSessions) {
    setPrevSessions(initialSessions);
    setSessionByUnit(Object.fromEntries(initialSessions.map(toBoardBooking)));
  }

  // Live board: Socket.IO → patch unit + session state without refetching.
  useEffect(() => {
    const socket = io(`${liveOrigin()}/live`, { transports: ["websocket"] });
    socketRef.current = socket;
    socket.on("connect", () => socket.emit("board:subscribe"));
    socket.on(
      "board:update",
      (data: { unitId: string; unitStatus: ConsoleUnit["status"]; booking?: BoardBooking }) => {
        setUnits((prev) =>
          prev.map((u) => (u.id === data.unitId ? { ...u, status: data.unitStatus } : u))
        );
        if (data.booking) {
          setSessionByUnit((prev) => {
            const next = { ...prev };
            if (["in_progress", "overtime"].includes(data.booking!.status)) {
              next[data.unitId] = data.booking!;
            } else if (next[data.unitId]?.id === data.booking!.id) {
              delete next[data.unitId];
            }
            return next;
          });
        }
      }
    );
    return () => {
      socket.disconnect();
    };
  }, []);

  // Error dari aksi TV muncul di luar dialog — hilangkan sendiri seperti dulu.
  useEffect(() => {
    if (!error || dialog) return;
    const t = setTimeout(() => setError(null), 5000);
    return () => clearTimeout(t);
  }, [error, dialog]);

  const submit = (action: (fd: FormData) => Promise<ActionResult>) => (fd: FormData) => {
    setError(null);
    startTransition(async () => {
      const result = await action(fd);
      if (result.error) {
        setError(result.error);
      } else {
        setDialog(null);
        router.refresh();
      }
    });
  };

  // Dialog menyimpan id perangkat saja; datanya selalu diambil dari state live
  // agar volume/online di dialog tidak basi (WS mengganti array tiap detik).
  const dialogDevice =
    dialog && "deviceId" in dialog && dialog.deviceId
      ? deviceById.get(dialog.deviceId)
      : undefined;

  const totals = shift?.totals;
  const mappedCount = units.filter((u) => u.rdmsDeviceId).length;

  return (
    <div className="space-y-4">
      {/* Shift banner */}
      {shift ? (
        <Card>
          <CardContent className="flex flex-wrap items-center gap-4 py-3 text-sm">
            <Badge tone="green">Shift {shift.code} terbuka</Badge>
            <span>Kas awal {formatRupiah(shift.cashOpening)}</span>
            {totals && (
              <>
                <span>Penjualan rental {formatRupiah(totals.rentalSales)}</span>
                <span className="font-medium">Expected cash {formatRupiah(totals.expectedCash)}</span>
              </>
            )}
            <Button size="sm" variant="outline" className="ml-auto" onClick={() => setDialog({ kind: "closeShift" })}>
              Tutup Shift
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-wrap items-center gap-3 py-3">
            <Badge tone="red">Shift belum dibuka</Badge>
            <span className="text-sm text-slate-500">
              Pembayaran tunai/QRIS butuh shift terbuka.
            </span>
            <Button size="sm" className="ml-auto" onClick={() => setDialog({ kind: "openShift" })}>
              Buka Shift
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Check-in by code */}
      <Card>
        <CardContent className="py-3">
          <form
            action={submit(checkInBooking)}
            className="flex flex-wrap items-end gap-2"
          >
            <div className="min-w-0 flex-1 sm:flex-none">
              <Label>Check-in kode QR</Label>
              <Input name="code" placeholder="AB12CD34" className="uppercase sm:w-44" required />
            </div>
            <SubmitButton>Check-in</SubmitButton>
          </form>
          {canBackfill && (
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
              <span className="text-sm text-slate-500">
                Sesi sudah jalan tapi tidak tercatat?
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setDialog({ kind: "backfill" })}
              >
                Catat Sesi Susulan
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Panggilan dari meja — TV mengirimnya lewat RDMS */}
      {calls.map((c) => (
        <div
          key={c.at}
          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-amber-800"
        >
          <span className="font-medium">
            🔔 Meja <b>{unitLabelForDevice(units, devices, c.deviceId)}</b> memanggil kasir!
          </span>
          <Button size="sm" variant="ghost" onClick={() => dismissCall(c.at)}>
            Selesai
          </Button>
        </div>
      ))}

      {error && !dialog && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Status TV + broadcast massal */}
      {mappedCount > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-500">
            {mappedCount} meja terhubung TV ·{" "}
            <span className={connected ? "text-emerald-600" : "text-red-600"}>
              {connected ? "● terhubung real-time" : "● terputus, mencoba ulang…"}
            </span>
          </p>
          <Button size="sm" variant="outline" onClick={() => setDialog({ kind: "broadcast" })}>
            📢 Broadcast Semua TV
          </Button>
        </div>
      )}

      {/* Console board */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {units.map((u) => (
          <UnitCard
            key={u.id}
            unit={u}
            session={sessionByUnit[u.id]}
            device={u.rdmsDeviceId ? deviceById.get(u.rdmsDeviceId) : undefined}
            now={now}
            onDialog={setDialog}
          />
        ))}
      </div>

      {/* Dialogs */}
      <Modal
        open={dialog?.kind === "walkin"}
        onClose={() => setDialog(null)}
        title={dialog?.kind === "walkin" ? `Walk-in — Unit ${dialog.unit.code}` : undefined}
      >
        {dialog?.kind === "walkin" && (
          <form action={submit(startWalkIn)} className="space-y-3">
            <input type="hidden" name="consoleUnitId" value={dialog.unit.id} />
            <div>
              <Label>Durasi</Label>
              <Select name="durationMinutes" defaultValue="60">
                {[60, 90, 120, 180, 240].map((m) => (
                  <option key={m} value={m}>
                    {m} menit
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Nama pelanggan</Label>
              <Input name="customerName" placeholder="Walk-in" />
            </div>
            <div>
              <Label>No. HP member (opsional — dapat poin)</Label>
              <Input name="userPhone" placeholder="08…" />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <SubmitButton className="w-full">Mulai Sesi</SubmitButton>
          </form>
        )}
      </Modal>

      <Modal
        open={dialog?.kind === "extend"}
        onClose={() => setDialog(null)}
        title={
          dialog?.kind === "extend"
            ? `Perpanjang Waktu — ${dialog.unit.displayLabel ?? dialog.unit.code}`
            : undefined
        }
      >
        {dialog?.kind === "extend" && (
          <form action={submit(extendSession)} className="space-y-3">
            <input type="hidden" name="id" value={dialog.session.id} />
            <div>
              <Label>Tambahan durasi</Label>
              <Select name="addedMinutes" defaultValue="30">
                {EXTEND_DURATIONS.map((m) => (
                  <option key={m} value={m}>
                    {durationLabel(m)}
                  </option>
                ))}
              </Select>
            </div>
            <p className="text-xs text-slate-500">
              Dihitung dari sekarang bila waktunya sudah habis, dan TV dinyalakan lagi.
            </p>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <SubmitButton className="w-full">Perpanjang</SubmitButton>
          </form>
        )}
      </Modal>

      {/* Bill lengkap (jam main + FnB + identitas) → bayar → struk WA/cetak.
          `key` per sesi me-remount dialog sehingga state bill/paid selalu segar. */}
      <BillDialog
        key={dialog?.kind === "checkout" ? dialog.session.id : "closed"}
        open={dialog?.kind === "checkout"}
        sessionId={dialog?.kind === "checkout" ? dialog.session.id : null}
        onClose={() => setDialog(null)}
      />

      <Modal
        open={dialog?.kind === "backfill"}
        onClose={() => setDialog(null)}
        title="Catat Sesi Susulan"
      >
        {dialog?.kind === "backfill" && (
          <form action={submit(backfillSession)} className="space-y-3">
            <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Untuk sesi yang <b>sudah selesai</b> tapi luput dari sistem. Tersimpan langsung
              lunas dan masuk shift yang sedang terbuka. Maksimal 7 hari ke belakang.
            </p>
            <div>
              <Label>Konsol</Label>
              <Select name="consoleUnitId" required defaultValue="">
                <option value="" disabled>
                  — Pilih unit —
                </option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.displayLabel || u.code}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Jam mulai</Label>
                <Input type="datetime-local" name="startAt" required />
              </div>
              <div>
                <Label>Durasi</Label>
                <Select name="durationMinutes" defaultValue="60">
                  {[30, 60, 90, 120, 180, 240].map((m) => (
                    <option key={m} value={m}>
                      {m} menit
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Metode bayar</Label>
                <Select name="paymentMethod" defaultValue="cash">
                  <option value="cash">Tunai</option>
                  <option value="qris_manual">QRIS</option>
                </Select>
              </div>
              <div>
                <Label>Nominal diterima</Label>
                <Input type="number" name="amount" min={0} step={1000} placeholder="Ikuti tarif" />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Nama pelanggan</Label>
                <Input name="customerName" placeholder="Opsional" />
              </div>
              <div>
                <Label>No. HP member</Label>
                <Input name="userPhone" placeholder="Opsional — dapat poin" />
              </div>
            </div>
            <div>
              <Label>Alasan koreksi</Label>
              <Input name="reason" placeholder="Mis. listrik padam, sesi tidak tercatat" required />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <SubmitButton className="w-full">Catat Sesi</SubmitButton>
          </form>
        )}
      </Modal>

      <Modal open={dialog?.kind === "openShift"} onClose={() => setDialog(null)} title="Buka Shift">
        <form action={submit(openShift)} className="space-y-3">
          <div>
            <Label>Kas awal (Rp)</Label>
            <Input name="cashOpening" type="number" min={0} defaultValue={200000} required />
          </div>
          <div>
            <Label>Catatan</Label>
            <Input name="notes" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <SubmitButton className="w-full">Buka Shift</SubmitButton>
        </form>
      </Modal>

      <Modal open={dialog?.kind === "closeShift"} onClose={() => setDialog(null)} title="Tutup Shift">
        {shift && (
          <CloseShiftForm shift={shift} error={error} onSubmit={submit(closeShift)} />
        )}
      </Modal>

      {/* Broadcast — satu TV atau semua */}
      <Modal
        open={dialog?.kind === "broadcast"}
        onClose={() => setDialog(null)}
        title={dialogDevice ? `Kirim Pesan — ${dialogDevice.name}` : "Broadcast ke Semua TV"}
      >
        {dialog?.kind === "broadcast" && (
          <form action={submit(broadcastTv)} className="space-y-3">
            {dialogDevice && <input type="hidden" name="deviceId" value={dialogDevice.id} />}
            <div>
              <Label>Pesan</Label>
              <Input
                name="message"
                placeholder={
                  dialogDevice ? "Tulis pesan untuk pemain…" : "Contoh: Rental tutup 30 menit lagi"
                }
                required
              />
            </div>
            <div>
              <Label>Lama tampil di TV</Label>
              <Select name="durationSeconds" defaultValue="10">
                {BROADCAST_SECONDS.map((s) => (
                  <option key={s} value={s}>
                    {s >= 60 ? `${s / 60} menit` : `${s} detik`}
                  </option>
                ))}
              </Select>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <SubmitButton className="w-full">
              {dialogDevice ? "Kirim" : "Kirim ke Semua"}
            </SubmitButton>
          </form>
        )}
      </Modal>

      {/* Audio */}
      <Modal
        open={dialog?.kind === "audio" && !!dialogDevice}
        onClose={() => setDialog(null)}
        title={dialogDevice ? `Audio — ${dialogDevice.name}` : undefined}
      >
        {dialog?.kind === "audio" && dialogDevice && (
          <AudioControls device={dialogDevice} onError={setError} error={error} />
        )}
      </Modal>

      {/* Kiosk */}
      <Modal
        open={dialog?.kind === "kiosk" && !!dialogDevice}
        onClose={() => setDialog(null)}
        title={dialogDevice ? `Kiosk — ${dialogDevice.name}` : undefined}
      >
        {dialog?.kind === "kiosk" && dialogDevice && (
          <KioskControls device={dialogDevice} onError={setError} error={error} />
        )}
      </Modal>
    </div>
  );
}

/**
 * Kartu meja: satu unit konsol dengan lapisan TV-nya. Tombolnya sengaja grid
 * dua kolom penuh, bukan baris flex — di kolom sempit (4 kartu sejajar) teks
 * "Selesai & Bayar" tidak muat sebaris dan dulu meluber keluar kartu.
 */
function UnitCard({
  unit,
  session,
  device,
  now,
  onDialog,
}: {
  unit: ConsoleUnit;
  session: BoardBooking | undefined;
  device: TvDevice | undefined;
  now: number | null;
  onDialog: (d: Dialog) => void;
}) {
  const tone = session ? sessionTone(session.endAt, now) : "idle";

  return (
    <Card className={cn("flex h-full flex-col overflow-hidden", session && SESSION_CARD_TONE[tone])}>
      <CardContent className="flex flex-1 flex-col gap-3 p-4">
        {/* Judul + status: judul boleh terpotong, badge tidak ikut menyusut */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-slate-900">
              {unit.displayLabel ?? unit.code}
            </p>
            <p className="truncate text-xs text-slate-500">
              {unit.consoleType?.name} · {unit.roomType === "vip" ? "VIP" : "Reguler"}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <Badge tone={STATUS_TONE[unit.status]}>{CONSOLE_UNIT_STATUS_LABEL[unit.status]}</Badge>
            {unit.rdmsDeviceId && (
              <span
                className={cn(
                  "text-[10px] font-medium",
                  device?.online ? "text-emerald-600" : "text-slate-400"
                )}
                title={device?.online ? "TV online" : "TV offline / belum heartbeat"}
              >
                ● TV
              </span>
            )}
          </div>
        </div>

        {session ? (
          <>
            <div>
              <p className="truncate text-sm font-medium text-slate-700">
                {session.customerName ?? session.code}
              </p>
              <div className="mt-2">
                <SessionTimer startAt={session.startAt} endAt={session.endAt} now={now} />
              </div>
            </div>
            <div className="mt-auto grid grid-cols-2 gap-2">
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => onDialog({ kind: "extend", unit, session })}
              >
                Perpanjang
              </Button>
              <Button
                size="sm"
                className="w-full"
                onClick={() => onDialog({ kind: "checkout", unit, session })}
              >
                Bayar
              </Button>
            </div>
          </>
        ) : (
          <div className="mt-auto">
            <p className="py-3 text-center text-sm text-slate-400">
              {unit.status === "maintenance"
                ? "Sedang perbaikan"
                : unit.status === "booked"
                  ? "Menunggu check-in"
                  : "Kosong"}
            </p>
            {unit.status === "available" && (
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => onDialog({ kind: "walkin", unit })}
              >
                Mulai Walk-in
              </Button>
            )}
          </div>
        )}

        {/* Kontrol fisik TV — hanya untuk unit yang termapping */}
        {device && (
          <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
            <Button
              size="sm"
              variant="ghost"
              className="w-full"
              onClick={() => onDialog({ kind: "broadcast", deviceId: device.id })}
            >
              📢 Pesan
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="w-full"
              onClick={() => onDialog({ kind: "audio", deviceId: device.id })}
            >
              {device.muted ? "🔇" : "🔊"} Audio
            </Button>
            {/* Sebaris penuh: label "Kiosk" tidak muat berdampingan di kolom sempit */}
            <Button
              size="sm"
              variant="ghost"
              className="col-span-2 w-full"
              onClick={() => onDialog({ kind: "kiosk", deviceId: device.id })}
            >
              🔒 Kiosk
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/** Nama meja untuk alert panggilan: pakai label unit POS, jatuh ke nama device. */
function unitLabelForDevice(
  units: ConsoleUnit[],
  devices: TvDevice[],
  deviceId: string
): string {
  const unit = units.find((u) => u.rdmsDeviceId === deviceId);
  if (unit) return unit.displayLabel ?? unit.code;
  return devices.find((d) => d.id === deviceId)?.name ?? deviceId;
}

function CloseShiftForm({
  shift,
  error,
  onSubmit,
}: {
  shift: CashShift;
  error: string | null;
  onSubmit: (fd: FormData) => void;
}) {
  const expected = shift.totals?.expectedCash ?? 0;
  const [actual, setActual] = useState(expected);
  const difference = actual - expected;

  return (
    <form action={onSubmit} className="space-y-3">
      <input type="hidden" name="id" value={shift.id} />
      <p className="text-sm text-slate-600">
        Expected cash: <span className="font-semibold">{formatRupiah(expected)}</span>
      </p>
      <div>
        <Label>Kas fisik dihitung (Rp)</Label>
        <Input
          name="actualCash"
          type="number"
          min={0}
          value={actual}
          onChange={(e) => setActual(Number(e.target.value))}
          required
        />
      </div>
      <p className={`text-sm ${difference === 0 ? "text-emerald-600" : "text-red-600"}`}>
        Selisih: {formatRupiah(difference)}
      </p>
      {difference !== 0 && (
        <div>
          <Label>Alasan selisih (wajib)</Label>
          <Input name="notes" required placeholder="mis. uang kembalian kurang" />
        </div>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <SubmitButton className="w-full">Tutup Shift</SubmitButton>
    </form>
  );
}

function AudioControls({
  device,
  error,
  onError,
}: {
  device: TvDevice;
  error: string | null;
  onError: (msg: string | null) => void;
}) {
  const [volume, setVolume] = useState(device.volume);
  const [pending, startTransition] = useTransition();

  const apply = (action: (fd: FormData) => Promise<ActionResult>, fields: Record<string, string>) =>
    startTransition(async () => {
      onError(null);
      const fd = new FormData();
      fd.set("id", device.id);
      for (const [k, v] of Object.entries(fields)) fd.set(k, v);
      const result = await action(fd);
      if (result.error) onError(result.error);
    });

  return (
    <div className="space-y-4">
      <div>
        <Label>Volume: {volume}</Label>
        <input
          type="range"
          min={0}
          max={100}
          value={volume}
          className="w-full accent-emerald-600"
          onChange={(e) => setVolume(Number(e.target.value))}
          onMouseUp={() => apply(setTvVolume, { volume: String(volume) })}
          onTouchEnd={() => apply(setTvVolume, { volume: String(volume) })}
        />
      </div>
      <Button
        variant="outline"
        className="w-full"
        disabled={pending}
        onClick={() => apply(setTvMute, { muted: String(!device.muted) })}
      >
        {device.muted ? "🔇 Muted — klik untuk unmute" : "🔊 Aktif — klik untuk mute"}
      </Button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

/**
 * Kontrol kiosk. TV terkunci pada app rental selama meja idle sehingga penyewa
 * tidak bisa keluar lewat remote; kunci dilepas otomatis selama sesi berjalan
 * agar TV bisa pindah ke input HDMI. Dialog ini untuk maintenance — buka
 * Settings TV, update app, ganti input manual.
 *
 * Status kiosk tidak dibaca dari server (TV yang menyimpannya), jadi tombolnya
 * perintah searah, bukan toggle: tidak ada state yang bisa ditampilkan di sini.
 * Membuka kunci butuh role OPERATOR — kasir akan melihat pesan "FORBIDDEN".
 */
function KioskControls({
  device,
  error,
  onError,
}: {
  device: TvDevice;
  error: string | null;
  onError: (msg: string | null) => void;
}) {
  const [pending, startTransition] = useTransition();

  const apply = (action: (fd: FormData) => Promise<ActionResult>, fields: Record<string, string>) =>
    startTransition(async () => {
      onError(null);
      const fd = new FormData();
      fd.set("id", device.id);
      for (const [k, v] of Object.entries(fields)) fd.set(k, v);
      const result = await action(fd);
      if (result.error) onError(result.error);
    });

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-500">
        Saat terkunci, penyewa tidak bisa keluar dari app rental dengan remote. Kunci dilepas sendiri
        selama sesi berjalan agar TV bisa pindah ke input HDMI.
      </p>
      <Button
        variant="outline"
        className="w-full"
        disabled={pending}
        onClick={() => apply(unlockTvKiosk, { durationSeconds: "300" })}
      >
        🔓 Buka 5 menit (terkunci sendiri setelahnya)
      </Button>
      <Button
        variant="outline"
        className="w-full"
        disabled={pending}
        onClick={() => apply(unlockTvKiosk, { durationSeconds: "0" })}
      >
        🔓 Buka sampai dikunci lagi
      </Button>
      <Button className="w-full" disabled={pending} onClick={() => apply(lockTvKiosk, {})}>
        🔒 Kunci sekarang
      </Button>
      {!device.online && (
        <p className="text-sm text-amber-600">
          TV sedang offline — perintah tidak akan sampai (broker tidak menyimpan command untuk TV
          yang terputus). Kirim ulang setelah TV online.
        </p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

