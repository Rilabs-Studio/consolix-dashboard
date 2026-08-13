import { apiGet } from "@/lib/api-client";
import type { ConsoleType, PriceRule } from "@/lib/types";
import { formatRupiah } from "@/lib/utils";
import { createPriceRule, deletePriceRule, togglePriceRule } from "@/server/actions/schedule";
import { PageHeader } from "@/components/layout/page-header";
import { Table, THead, TBody, TR, TH, TD, EmptyRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";
import { SubmitButton, ConfirmDelete } from "@/components/forms/form-controls";
import { Button } from "@/components/ui/button";

const DAY_LABEL = { weekday: "Hari kerja", weekend: "Akhir pekan", holiday: "Hari libur" } as const;

export default async function HargaPage() {
  const [rules, types] = await Promise.all([
    apiGet<PriceRule[]>("/admin/price-rules"),
    apiGet<ConsoleType[]>("/admin/console-types"),
  ]);
  const typeName = (id: string | null) => types.find((t) => t.id === id)?.name ?? "Semua tipe";

  return (
    <div>
      <PageHeader
        title="Price Rules"
        description="Happy hour / weekend / libur. Rule dengan priority tertinggi menang; tanpa rule → harga dasar tipe."
      />
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Table>
          <THead>
            <TR>
              <TH>Label</TH>
              <TH>Tipe</TH>
              <TH>Hari</TH>
              <TH>Jam</TH>
              <TH>Harga/Jam</TH>
              <TH>Status</TH>
              <TH></TH>
            </TR>
          </THead>
          <TBody>
            {rules.length === 0 && <EmptyRow colSpan={7} />}
            {rules.map((r) => (
              <TR key={r.id}>
                <TD data-label="Label" className="font-medium">{r.label}</TD>
                <TD data-label="Tipe">{typeName(r.consoleTypeId)}</TD>
                <TD data-label="Hari">{DAY_LABEL[r.dayType]}</TD>
                <TD data-label="Jam">
                  {r.startTime.slice(0, 5)}–{r.endTime.slice(0, 5)}
                </TD>
                <TD data-label="Harga/Jam">{formatRupiah(r.pricePerHour)}</TD>
                <TD data-label="Status">{r.isActive ? <Badge tone="green">Aktif</Badge> : <Badge tone="red">Nonaktif</Badge>}</TD>
                <TD>
                  <div className="flex items-center gap-1">
                    <form action={togglePriceRule}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="isActive" value={r.isActive ? "false" : "true"} />
                      <Button type="submit" variant="ghost" size="sm">
                        {r.isActive ? "Nonaktifkan" : "Aktifkan"}
                      </Button>
                    </form>
                    <ConfirmDelete action={deletePriceRule} id={r.id} label={`Hapus rule "${r.label}"?`} />
                  </div>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
        <Card>
          <CardContent>
            <p className="mb-3 font-medium text-slate-900">Tambah Rule</p>
            <form action={createPriceRule} className="space-y-3">
              <div>
                <Label>Label</Label>
                <Input name="label" required placeholder="Happy Hour Siang" />
              </div>
              <div>
                <Label>Tipe konsol</Label>
                <Select name="consoleTypeId" defaultValue="">
                  <option value="">Semua tipe</option>
                  {types.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Jenis hari</Label>
                <Select name="dayType" defaultValue="weekday">
                  <option value="weekday">Hari kerja</option>
                  <option value="weekend">Akhir pekan</option>
                  <option value="holiday">Hari libur</option>
                </Select>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Mulai</Label>
                  <Input name="startTime" type="time" required defaultValue="10:00" />
                </div>
                <div>
                  <Label>Selesai</Label>
                  <Input name="endTime" type="time" required defaultValue="17:00" />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Harga / jam (Rp)</Label>
                  <Input name="pricePerHour" type="number" min={1000} required />
                </div>
                <div>
                  <Label>Priority</Label>
                  <Input name="priority" type="number" defaultValue={0} />
                </div>
              </div>
              <SubmitButton className="w-full">Buat Rule</SubmitButton>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
