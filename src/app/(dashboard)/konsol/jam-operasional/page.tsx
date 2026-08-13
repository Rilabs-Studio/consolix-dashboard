import { apiGet } from "@/lib/api-client";
import type { Holiday, OperatingHourDay, OutletStatus } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { createHoliday, deleteHoliday } from "@/server/actions/schedule";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";
import { SubmitButton, ConfirmDelete } from "@/components/forms/form-controls";
import { Table, THead, TBody, TR, TH, TD, EmptyRow } from "@/components/ui/table";
import { HoursForm } from "./hours-form";

const HOLIDAY_LABEL = { closed: "Tutup", special_hours: "Jam khusus", special_price: "Harga khusus" } as const;

export default async function JamOperasionalPage() {
  const [hoursRes, holidays] = await Promise.all([
    apiGet<{ days: OperatingHourDay[]; status: OutletStatus }>("/operating-hours"),
    apiGet<Holiday[]>("/admin/holidays"),
  ]);
  const { days, status } = hoursRes;

  return (
    <div>
      <PageHeader
        title="Jam Operasional"
        description="closeTime lebih kecil dari openTime berarti tutup lewat tengah malam (mis. 10:00–02:00)."
      />
      <div className="mb-4">
        {status.isOpen ? (
          <Badge tone={status.closingSoon ? "yellow" : "green"}>
            Sedang buka{status.closesAt ? ` · tutup ${status.closesAt}` : ""}
            {status.closingSoon ? " · segera tutup" : ""}
          </Badge>
        ) : (
          <Badge tone="red">Tutup{status.opensAt ? ` · buka ${status.opensAt}` : ""}</Badge>
        )}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <HoursForm days={days} />
        <div className="space-y-6">
          <Table>
            <THead>
              <TR>
                <TH>Tanggal</TH>
                <TH>Nama</TH>
                <TH>Jenis</TH>
                <TH></TH>
              </TR>
            </THead>
            <TBody>
              {holidays.length === 0 && <EmptyRow colSpan={4} label="Belum ada hari libur" />}
              {holidays.map((h) => (
                <TR key={h.id}>
                  <TD data-label="Tanggal">{formatDate(h.date)}</TD>
                  <TD data-label="Nama" className="font-medium">{h.name}</TD>
                  <TD data-label="Jenis">
                    <Badge tone={h.type === "closed" ? "red" : "yellow"}>{HOLIDAY_LABEL[h.type]}</Badge>
                    {h.type === "special_hours" && (
                      <span className="ml-2 text-xs text-slate-500">
                        {h.openTime?.slice(0, 5)}–{h.closeTime?.slice(0, 5)}
                      </span>
                    )}
                  </TD>
                  <TD>
                    <ConfirmDelete action={deleteHoliday} id={h.id} label={`Hapus libur ${h.name}?`} />
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
          <Card>
            <CardContent>
              <p className="mb-3 font-medium text-slate-900">Tambah Hari Libur</p>
              <form action={createHoliday} className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label>Tanggal</Label>
                    <Input name="date" type="date" required />
                  </div>
                  <div>
                    <Label>Jenis</Label>
                    <Select name="type" defaultValue="closed">
                      <option value="closed">Tutup</option>
                      <option value="special_hours">Jam khusus</option>
                      <option value="special_price">Harga khusus</option>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Nama</Label>
                  <Input name="name" required placeholder="HUT RI" />
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <Label>Buka (jam khusus)</Label>
                    <Input name="openTime" type="time" />
                  </div>
                  <div>
                    <Label>Tutup</Label>
                    <Input name="closeTime" type="time" />
                  </div>
                  <div>
                    <Label>Multiplier harga</Label>
                    <Input name="priceMultiplier" type="number" step="0.1" min="0.1" placeholder="1.5" />
                  </div>
                </div>
                <SubmitButton className="w-full">Tambah Libur</SubmitButton>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
