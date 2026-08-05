import { apiGet } from "@/lib/api-client";
import { saveTier, deleteTier } from "@/server/actions/loyalty";
import { PageHeader } from "@/components/layout/page-header";
import { Table, THead, TBody, TR, TH, TD, EmptyRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { SubmitButton, ConfirmDelete } from "@/components/forms/form-controls";

interface Tier {
  id: string;
  name: string;
  minLifetimePoints: number;
  discountPercent: number;
  pointMultiplier: string;
  freeMinutesPerMonth: number;
  color: string;
  sortOrder: number;
}

export default async function TierPage() {
  const tiers = await apiGet<Tier[]>("/admin/member-tiers");

  return (
    <div>
      <PageHeader
        title="Tier Member"
        description="Ambang lifetime points, diskon, dan multiplier poin. Tier dievaluasi otomatis."
      />
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Table>
          <THead>
            <TR>
              <TH>Tier</TH>
              <TH>Min Poin</TH>
              <TH>Diskon</TH>
              <TH>Multiplier</TH>
              <TH>Gratis/bln</TH>
              <TH></TH>
            </TR>
          </THead>
          <TBody>
            {tiers.length === 0 && <EmptyRow colSpan={6} />}
            {tiers.map((t) => (
              <TR key={t.id}>
                <TD>
                  <span className="inline-flex items-center gap-2 font-medium">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: t.color }} />
                    {t.name}
                  </span>
                </TD>
                <TD>{t.minLifetimePoints}</TD>
                <TD>{t.discountPercent}%</TD>
                <TD>×{t.pointMultiplier}</TD>
                <TD>{t.freeMinutesPerMonth}m</TD>
                <TD>
                  <ConfirmDelete action={deleteTier} id={t.id} label={`Hapus tier ${t.name}?`} />
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
        <Card>
          <CardContent className="pt-5">
            <p className="mb-3 font-medium text-slate-900">Tambah Tier</p>
            <form action={saveTier} className="space-y-3">
              <div>
                <Label>Nama</Label>
                <Input name="name" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Min lifetime poin</Label>
                  <Input name="minLifetimePoints" type="number" min={0} required />
                </div>
                <div>
                  <Label>Diskon (%)</Label>
                  <Input name="discountPercent" type="number" min={0} max={50} defaultValue={0} />
                </div>
                <div>
                  <Label>Multiplier poin</Label>
                  <Input name="pointMultiplier" type="number" step="0.05" min={1} defaultValue={1} />
                </div>
                <div>
                  <Label>Menit gratis/bln</Label>
                  <Input name="freeMinutesPerMonth" type="number" min={0} defaultValue={0} />
                </div>
              </div>
              <div>
                <Label>Warna</Label>
                <Input name="color" type="color" defaultValue="#888888" className="h-10" />
              </div>
              <SubmitButton className="w-full">Simpan Tier</SubmitButton>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
