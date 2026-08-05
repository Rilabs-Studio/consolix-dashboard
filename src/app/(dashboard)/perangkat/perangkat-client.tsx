"use client";

import { useState, useTransition } from "react";
import type { TvDevice } from "@/lib/types";
import { useRdmsState } from "@/lib/use-rdms-state";
import { deleteTvDevice, registerTvDevice, renameTvDevice } from "@/server/actions/rdms";
import type { ActionResult } from "@/server/actions/pos";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { EmptyRow, TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { SubmitButton } from "@/components/forms/form-controls";

type Dialog = { kind: "add" } | { kind: "rename"; device: TvDevice } | null;

export function PerangkatClient({ initialDevices }: { initialDevices: TvDevice[] }) {
  const { devices, connected } = useRdmsState(initialDevices);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const submit = (action: (fd: FormData) => Promise<ActionResult>) => (fd: FormData) => {
    setError(null);
    startTransition(async () => {
      const result = await action(fd);
      if (result.error) setError(result.error);
      else setDialog(null);
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          <span className={connected ? "text-emerald-600" : "text-red-600"}>
            {connected ? "● terhubung real-time" : "● terputus, mencoba ulang…"}
          </span>
        </p>
        <Button onClick={() => setDialog({ kind: "add" })}>+ Daftarkan Manual</Button>
      </div>

      {error && !dialog && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <Table>
        <THead>
          <tr>
            <TH>ID</TH>
            <TH>Nama</TH>
            <TH>Status</TH>
            <TH>Versi App</TH>
            <TH>Sesi Aktif</TH>
            <TH className="text-right">Aksi</TH>
          </tr>
        </THead>
        <TBody>
          {devices.length === 0 && <EmptyRow colSpan={6} label="Belum ada perangkat" />}
          {devices.map((d) => (
            <TR key={d.id}>
              <TD className="font-mono">{d.id}</TD>
              <TD>{d.name}</TD>
              <TD>
                <Badge tone={d.online ? "green" : "default"}>
                  {d.online ? "Online" : "Offline"}
                </Badge>
              </TD>
              <TD>{d.version || "—"}</TD>
              <TD>{d.session ? <Badge tone="blue">Berjalan</Badge> : "—"}</TD>
              <TD className="text-right">
                <Button size="sm" variant="ghost" onClick={() => setDialog({ kind: "rename", device: d })}>
                  Ubah Nama
                </Button>
                <form
                  className="inline-block"
                  action={(fd) => {
                    if (!confirm(`Hapus perangkat ${d.name} (${d.id})?`)) return;
                    submit(deleteTvDevice)(fd);
                  }}
                >
                  <input type="hidden" name="id" value={d.id} />
                  <SubmitButton size="sm" variant="ghost" className="text-red-600">
                    Hapus
                  </SubmitButton>
                </form>
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>

      <Modal
        open={dialog?.kind === "add"}
        onClose={() => setDialog(null)}
        title="Daftarkan Perangkat"
      >
        <form action={submit(registerTvDevice)} className="space-y-3">
          <div>
            <Label>ID perangkat</Label>
            <Input name="id" placeholder="mis. TV-01" required />
          </div>
          <div>
            <Label>Nama meja</Label>
            <Input name="name" placeholder="mis. Meja 1" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <SubmitButton className="w-full">Daftarkan</SubmitButton>
        </form>
      </Modal>

      <Modal
        open={dialog?.kind === "rename"}
        onClose={() => setDialog(null)}
        title={dialog?.kind === "rename" ? `Ubah Nama — ${dialog.device.id}` : undefined}
      >
        {dialog?.kind === "rename" && (
          <form action={submit(renameTvDevice)} className="space-y-3">
            <input type="hidden" name="id" value={dialog.device.id} />
            <div>
              <Label>Nama meja</Label>
              <Input name="name" defaultValue={dialog.device.name} required />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <SubmitButton className="w-full">Simpan</SubmitButton>
          </form>
        )}
      </Modal>
    </div>
  );
}
