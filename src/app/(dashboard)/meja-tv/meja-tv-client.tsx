"use client";

import { useEffect, useState, useTransition } from "react";
import type { TvDevice, TvPackage } from "@/lib/types";
import { useRdmsState } from "@/lib/use-rdms-state";
import { formatRupiah } from "@/lib/utils";
import {
  broadcastTv,
  extendTvSession,
  setTvMute,
  setTvVolume,
  startTvSession,
  stopTvSession,
} from "@/server/actions/rdms";
import type { ActionResult } from "@/server/actions/pos";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { SubmitButton } from "@/components/forms/form-controls";

const DURATIONS = [30, 60, 120, 180];
const EXTEND_DURATIONS = [15, 30, 60, 120];
const BROADCAST_SECONDS = [5, 10, 30, 60];

function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (x: number) => String(x).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

type Dialog =
  | { kind: "start"; deviceId: string }
  | { kind: "extend"; deviceId: string }
  | { kind: "broadcast"; deviceId?: string }
  | { kind: "audio"; deviceId: string }
  | null;

export function MejaTvClient({
  initialDevices,
  packages,
}: {
  initialDevices: TvDevice[];
  packages: TvPackage[];
}) {
  const { devices, connected, calls, dismissCall } = useRdmsState(initialDevices);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Error di luar dialog (stop/volume) hilang sendiri seperti dashboard lama.
  useEffect(() => {
    if (!error || dialog) return;
    const t = setTimeout(() => setError(null), 5000);
    return () => clearTimeout(t);
  }, [error, dialog]);

  const submit = (action: (fd: FormData) => Promise<ActionResult>) => (fd: FormData) => {
    setError(null);
    startTransition(async () => {
      const result = await action(fd);
      if (result.error) setError(result.error);
      else setDialog(null);
    });
  };

  // Dialog menyimpan id saja; data device selalu diambil dari state live agar
  // sisa waktu/sesi di dialog tidak basi (WS mengganti seluruh array tiap detik).
  const dialogDevice = dialog && "deviceId" in dialog && dialog.deviceId
    ? devices.find((d) => d.id === dialog.deviceId)
    : undefined;

  const active = devices.filter((d) => d.session).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          {active}/{devices.length} meja terpakai ·{" "}
          <span className={connected ? "text-emerald-600" : "text-red-600"}>
            {connected ? "● terhubung real-time" : "● terputus, mencoba ulang…"}
          </span>
        </p>
        <Button onClick={() => setDialog({ kind: "broadcast" })}>📢 Broadcast Semua TV</Button>
      </div>

      {error && !dialog && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {calls.map((c) => (
        <div
          key={c.at}
          className="flex items-center justify-between rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-amber-800"
        >
          <span className="font-medium">
            🔔 Meja <b>{devices.find((d) => d.id === c.deviceId)?.name ?? c.deviceId}</b>{" "}
            memanggil kasir!
          </span>
          <Button size="sm" variant="ghost" onClick={() => dismissCall(c.at)}>
            Selesai
          </Button>
        </div>
      ))}

      {devices.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-slate-400">
            Belum ada perangkat. TV muncul otomatis saat mengirim heartbeat, atau daftarkan
            manual di halaman Perangkat TV.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {devices.map((d) => (
            <DeviceCard
              key={d.id}
              device={d}
              onOpen={(kind) => setDialog({ kind, deviceId: d.id })}
              onStop={submit(stopTvSession)}
            />
          ))}
        </div>
      )}

      {/* Mulai sesi */}
      <Modal
        open={dialog?.kind === "start" && !!dialogDevice}
        onClose={() => setDialog(null)}
        title={dialogDevice ? `Mulai Rental — ${dialogDevice.name}` : undefined}
      >
        {dialog?.kind === "start" && dialogDevice && (
          <StartForm
            device={dialogDevice}
            packages={packages}
            error={error}
            onSubmit={submit(startTvSession)}
          />
        )}
      </Modal>

      {/* Perpanjang */}
      <Modal
        open={dialog?.kind === "extend" && !!dialogDevice?.session}
        onClose={() => setDialog(null)}
        title={dialogDevice ? `Perpanjang Waktu — ${dialogDevice.name}` : undefined}
      >
        {dialog?.kind === "extend" && dialogDevice?.session && (
          <form action={submit(extendTvSession)} className="space-y-3">
            <input type="hidden" name="id" value={dialogDevice.session.id} />
            <div>
              <Label>Tambahan durasi</Label>
              <Select name="durationMinutes" defaultValue="30">
                {EXTEND_DURATIONS.map((m) => (
                  <option key={m} value={m}>
                    {m >= 60 ? `${m / 60} jam` : `${m} menit`}
                  </option>
                ))}
              </Select>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <SubmitButton className="w-full">Perpanjang</SubmitButton>
          </form>
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
    </div>
  );
}

function DeviceCard({
  device,
  onOpen,
  onStop,
}: {
  device: TvDevice;
  onOpen: (kind: "start" | "extend" | "broadcast" | "audio") => void;
  onStop: (fd: FormData) => void;
}) {
  const sess = device.session;
  const warning = sess?.warned;

  return (
    <Card
      className={
        sess ? (warning ? "border-amber-400 bg-amber-50/50" : "border-emerald-300 bg-emerald-50/40") : undefined
      }
    >
      <CardContent className="pt-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-semibold text-slate-900">{device.name}</p>
            <p className="text-xs text-slate-400">{device.id}</p>
          </div>
          <Badge tone={device.online ? "green" : "default"}>
            {device.online ? "Online" : "Offline"}
          </Badge>
        </div>

        <div className="my-4 text-center">
          {sess ? (
            <>
              <p
                className={`font-mono text-3xl font-bold tabular-nums ${
                  warning ? "text-amber-600" : "text-emerald-600"
                }`}
              >
                {formatDuration(sess.remaining_seconds)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                selesai {new Date(sess.end_time).toLocaleTimeString("id-ID")}
              </p>
            </>
          ) : (
            <p className="text-2xl font-semibold text-slate-300">Kosong</p>
          )}
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          {sess ? (
            <>
              <Button size="sm" onClick={() => onOpen("extend")}>
                + Extend
              </Button>
              <form
                action={(fd) => {
                  if (!confirm(`Hentikan sesi ${device.name}?`)) return;
                  onStop(fd);
                }}
              >
                <input type="hidden" name="id" value={sess.id} />
                <SubmitButton size="sm" variant="destructive">
                  Stop
                </SubmitButton>
              </form>
            </>
          ) : (
            <Button size="sm" onClick={() => onOpen("start")}>
              ▶ Mulai
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => onOpen("broadcast")} title="Kirim pesan">
            📢
          </Button>
          <Button size="sm" variant="outline" onClick={() => onOpen("audio")} title="Kontrol audio">
            🔊
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function StartForm({
  device,
  packages,
  error,
  onSubmit,
}: {
  device: TvDevice;
  packages: TvPackage[];
  error: string | null;
  onSubmit: (fd: FormData) => void;
}) {
  const [packageId, setPackageId] = useState("");

  return (
    <form action={onSubmit} className="space-y-3">
      <input type="hidden" name="deviceId" value={device.id} />
      <div>
        <Label>Paket</Label>
        <Select name="packageId" value={packageId} onChange={(e) => setPackageId(e.target.value)}>
          <option value="">Tanpa paket (per durasi)</option>
          {packages.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} — {p.duration_minutes} menit · {formatRupiah(p.price)}
            </option>
          ))}
        </Select>
      </div>
      {packageId === "" && (
        <div>
          <Label>Durasi</Label>
          <Select name="durationMinutes" defaultValue="60">
            {DURATIONS.map((m) => (
              <option key={m} value={m}>
                {m >= 60 ? `${m / 60} jam` : `${m} menit`}
              </option>
            ))}
          </Select>
        </div>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <SubmitButton className="w-full">Mulai Sesi</SubmitButton>
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
