"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { SubmitButton } from "@/components/forms/form-controls";
import type { ConsoleType, ConsoleUnit, TvDevice } from "@/lib/types";

export function UnitForm({
  action,
  types,
  devices,
  unit,
}: {
  action: (fd: FormData) => Promise<void>;
  types: ConsoleType[];
  devices: TvDevice[];
  unit?: ConsoleUnit;
}) {
  // Mapping lama tetap terlihat walau RDMS sedang down / device sudah dihapus.
  const knownIds = new Set(devices.map((d) => d.id));
  const orphanDeviceId = unit?.rdmsDeviceId && !knownIds.has(unit.rdmsDeviceId) ? unit.rdmsDeviceId : null;

  return (
    <Card>
      <CardContent>
        <form action={action} className="space-y-4">
          {unit && <input type="hidden" name="id" value={unit.id} />}
          <div className="grid max-w-lg gap-4 md:grid-cols-2">
            <div>
              <Label>Kode Unit</Label>
              <Input name="code" required defaultValue={unit?.code} placeholder="A1" />
            </div>
            <div>
              <Label>Tipe Konsol</Label>
              <Select name="consoleTypeId" defaultValue={unit?.consoleTypeId ?? types[0]?.id} required>
                {types.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Ruangan</Label>
              <Select name="roomType" defaultValue={unit?.roomType ?? "regular"}>
                <option value="regular">Reguler</option>
                <option value="vip">VIP</option>
              </Select>
            </div>
            <div>
              <Label>Label Tampilan</Label>
              <Input name="displayLabel" defaultValue={unit?.displayLabel ?? ""} placeholder="TV 01" />
              <p className="mt-1 text-xs text-slate-400">Ditampilkan ke pelanggan; kosongkan untuk memakai kode unit.</p>
            </div>
            {unit && (
              <div>
                <Label>Status Unit</Label>
                <Select name="isActive" defaultValue={unit.isActive ? "true" : "false"}>
                  <option value="true">Aktif</option>
                  <option value="false">Nonaktif</option>
                </Select>
                <p className="mt-1 text-xs text-slate-400">
                  Nonaktif = tersembunyi dari app & tidak bisa dibooking; riwayat tetap utuh.
                </p>
              </div>
            )}
            <div className="md:col-span-2">
              <Label>TV RDMS</Label>
              <Select name="rdmsDeviceId" defaultValue={unit?.rdmsDeviceId ?? ""}>
                <option value="">— Tidak terhubung —</option>
                {orphanDeviceId && <option value={orphanDeviceId}>{orphanDeviceId} (tidak ditemukan di RDMS)</option>}
                {devices.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.id}){d.online ? "" : " — offline"}
                  </option>
                ))}
              </Select>
              <p className="mt-1 text-xs text-slate-400">
                {devices.length === 0 && !orphanDeviceId
                  ? "RDMS tidak terjangkau atau belum ada perangkat — daftar TV kosong."
                  : "Check-in pada unit ini akan otomatis menyalakan sesi di TV terpilih."}
              </p>
            </div>
            <div className="md:col-span-2">
              <Label>Catatan</Label>
              <Textarea name="notes" defaultValue={unit?.notes ?? ""} />
            </div>
          </div>
          <SubmitButton>{unit ? "Simpan Perubahan" : "Buat Unit"}</SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}
