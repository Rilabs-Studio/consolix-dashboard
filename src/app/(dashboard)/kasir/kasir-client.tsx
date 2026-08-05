"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { io, type Socket } from "socket.io-client";
import type { Booking, CashShift, ConsoleUnit } from "@/lib/types";
import { CONSOLE_UNIT_STATUS_LABEL, PAYMENT_METHOD_LABEL } from "@/lib/constants";
import { formatRupiah } from "@/lib/utils";
import {
  checkInBooking,
  checkoutSession,
  closeShift,
  extendSession,
  openShift,
  startWalkIn,
  type ActionResult,
} from "@/server/actions/pos";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { SubmitButton } from "@/components/forms/form-controls";

interface BoardBooking {
  id: string;
  code: string;
  status: string;
  startAt: string;
  endAt: string;
  customerName: string | null;
}

const STATUS_TONE: Record<string, "green" | "blue" | "yellow" | "red"> = {
  available: "green",
  in_use: "blue",
  booked: "yellow",
  maintenance: "red",
};

function liveOrigin(): string {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/v1";
  return base.replace(/\/v1\/?$/, "");
}

export function KasirClient({
  initialUnits,
  initialSessions,
  shift,
}: {
  initialUnits: ConsoleUnit[];
  initialSessions: Booking[];
  shift: CashShift | null;
}) {
  const router = useRouter();
  const [units, setUnits] = useState(initialUnits);
  const [sessionByUnit, setSessionByUnit] = useState<Record<string, BoardBooking>>(() =>
    Object.fromEntries(
      initialSessions.map((s) => [
        s.consoleUnitId,
        {
          id: s.id,
          code: s.code,
          status: s.status,
          startAt: s.startAt,
          endAt: s.endAt,
          customerName: s.customerName,
        },
      ])
    )
  );
  const [dialog, setDialog] = useState<
    | { kind: "walkin"; unit: ConsoleUnit }
    | { kind: "checkout"; unit: ConsoleUnit; session: BoardBooking }
    | { kind: "openShift" }
    | { kind: "closeShift" }
    | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const socketRef = useRef<Socket | null>(null);

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
    setSessionByUnit(
      Object.fromEntries(
        initialSessions.map((s) => [
          s.consoleUnitId,
          {
            id: s.id,
            code: s.code,
            status: s.status,
            startAt: s.startAt,
            endAt: s.endAt,
            customerName: s.customerName,
          },
        ])
      )
    );
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

  const totals = shift?.totals;

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
          <CardContent className="flex items-center gap-4 py-3">
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
            <div>
              <Label>Check-in kode QR</Label>
              <Input name="code" placeholder="AB12CD34" className="w-44 uppercase" required />
            </div>
            <SubmitButton>Check-in</SubmitButton>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </form>
        </CardContent>
      </Card>

      {/* Console board */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {units.map((u) => {
          const session = sessionByUnit[u.id];
          return (
            <Card key={u.id}>
              <CardContent className="pt-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-lg font-semibold text-slate-900">{u.code}</p>
                  <Badge tone={STATUS_TONE[u.status]}>{CONSOLE_UNIT_STATUS_LABEL[u.status]}</Badge>
                </div>
                <p className="text-sm text-slate-500">
                  {u.consoleType?.name} · {u.roomType === "vip" ? "VIP" : "Reguler"}
                </p>
                {session ? (
                  <div className="mt-3 space-y-2 text-sm">
                    <p className="font-medium">{session.customerName ?? session.code}</p>
                    <Countdown endAt={session.endAt} overtime={session.status === "overtime"} />
                    <div className="flex gap-2">
                      <form action={submit(extendSession)}>
                        <input type="hidden" name="id" value={session.id} />
                        <input type="hidden" name="addedMinutes" value="30" />
                        <SubmitButton variant="outline" size="sm">+30m</SubmitButton>
                      </form>
                      <Button
                        size="sm"
                        onClick={() => setDialog({ kind: "checkout", unit: u, session })}
                      >
                        Selesai & Bayar
                      </Button>
                    </div>
                  </div>
                ) : (
                  u.status === "available" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3"
                      onClick={() => setDialog({ kind: "walkin", unit: u })}
                    >
                      Mulai Walk-in
                    </Button>
                  )
                )}
              </CardContent>
            </Card>
          );
        })}
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
        open={dialog?.kind === "checkout"}
        onClose={() => setDialog(null)}
        title={dialog?.kind === "checkout" ? `Selesai — Unit ${dialog.unit.code}` : undefined}
      >
        {dialog?.kind === "checkout" && (
          <form action={submit(checkoutSession)} className="space-y-3">
            <input type="hidden" name="id" value={dialog.session.id} />
            <div>
              <Label>Metode pembayaran</Label>
              <Select name="paymentMethod" defaultValue="cash">
                <option value="cash">{PAYMENT_METHOD_LABEL.cash}</option>
                <option value="qris_manual">{PAYMENT_METHOD_LABEL.qris_manual}</option>
              </Select>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <SubmitButton className="w-full">Terima Pembayaran</SubmitButton>
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
    </div>
  );
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

function Countdown({ endAt, overtime }: { endAt: string; overtime: boolean }) {
  const end = useMemo(() => new Date(endAt).getTime(), [endAt]);
  // null until mounted — Date.now() is impure during render (and would break SSR hydration).
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (now === null) return <p className="font-mono text-lg text-slate-400">…</p>;
  const remaining = Math.floor((end - now) / 1000);
  const abs = Math.abs(remaining);
  const label = `${Math.floor(abs / 3600)}:${String(Math.floor((abs % 3600) / 60)).padStart(2, "0")}:${String(abs % 60).padStart(2, "0")}`;
  return (
    <p className={`font-mono text-lg ${remaining < 0 || overtime ? "text-red-600" : "text-slate-900"}`}>
      {remaining < 0 ? `+${label} overtime` : label}
    </p>
  );
}
