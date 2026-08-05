import { apiGet } from "@/lib/api-client";
import { saveBadge, deleteBadge, adjustPoints } from "@/server/actions/loyalty";
import { PageHeader } from "@/components/layout/page-header";
import { Table, THead, TBody, TR, TH, TD, EmptyRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";
import { SubmitButton, ConfirmDelete } from "@/components/forms/form-controls";

interface Level {
  level: number;
  name: string;
  minXp: number;
  rewardPoints: number;
}
interface Badge {
  id: string;
  code: string;
  name: string;
  description: string;
  criteriaType: string;
  criteriaValue: number;
}

const CRITERIA = [
  ["total_bookings", "Total sesi"],
  ["total_spend", "Total belanja (poin)"],
  ["total_hours", "Total jam"],
  ["streak_days", "Streak check-in"],
  ["challenge_completed", "Challenge selesai"],
  ["manual", "Manual"],
] as const;

async function adjustPointsVoid(fd: FormData): Promise<void> {
  "use server";
  await adjustPoints(fd);
}

export default async function GamifikasiPage() {
  const [levels, badges] = await Promise.all([
    apiGet<Level[]>("/admin/levels"),
    apiGet<Badge[]>("/admin/badges"),
  ]);

  return (
    <div>
      <PageHeader title="Gamifikasi" description="Level, badge, dan penyesuaian poin manual." />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Table>
            <THead>
              <TR>
                <TH>Level</TH>
                <TH>Nama</TH>
                <TH>Min XP</TH>
                <TH>Bonus Poin</TH>
              </TR>
            </THead>
            <TBody>
              {levels.length === 0 && <EmptyRow colSpan={4} />}
              {levels.map((l) => (
                <TR key={l.level}>
                  <TD className="font-medium">Lv {l.level}</TD>
                  <TD>{l.name}</TD>
                  <TD>{l.minXp}</TD>
                  <TD>{l.rewardPoints}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
          <Card>
            <CardContent className="pt-5">
              <p className="mb-1 font-medium text-slate-900">Penyesuaian Poin Manual (admin)</p>
              <p className="mb-3 text-xs text-slate-500">Positif menambah, negatif mengurangi.</p>
              <form action={adjustPointsVoid} className="space-y-3">
                <div>
                  <Label>User ID</Label>
                  <Input name="userId" required placeholder="uuid user (lihat /pengguna)" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Poin (±)</Label>
                    <Input name="points" type="number" required />
                  </div>
                  <div>
                    <Label>Alasan</Label>
                    <Input name="reason" required />
                  </div>
                </div>
                <SubmitButton className="w-full">Terapkan</SubmitButton>
              </form>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Table>
            <THead>
              <TR>
                <TH>Badge</TH>
                <TH>Kriteria</TH>
                <TH></TH>
              </TR>
            </THead>
            <TBody>
              {badges.length === 0 && <EmptyRow colSpan={3} />}
              {badges.map((b) => (
                <TR key={b.id}>
                  <TD>
                    <p className="font-medium">{b.name}</p>
                    <p className="text-xs text-slate-400">{b.description}</p>
                  </TD>
                  <TD className="text-sm">
                    {CRITERIA.find(([k]) => k === b.criteriaType)?.[1] ?? b.criteriaType} ≥ {b.criteriaValue}
                  </TD>
                  <TD>
                    <ConfirmDelete action={deleteBadge} id={b.id} label={`Hapus badge ${b.name}?`} />
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
          <Card>
            <CardContent className="pt-5">
              <p className="mb-3 font-medium text-slate-900">Tambah Badge</p>
              <form action={saveBadge} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Kode</Label>
                    <Input name="code" required placeholder="NIGHT_OWL" />
                  </div>
                  <div>
                    <Label>Nama</Label>
                    <Input name="name" required />
                  </div>
                </div>
                <div>
                  <Label>Deskripsi</Label>
                  <Input name="description" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Kriteria</Label>
                    <Select name="criteriaType" defaultValue="total_bookings">
                      {CRITERIA.map(([k, label]) => (
                        <option key={k} value={k}>
                          {label}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label>Nilai</Label>
                    <Input name="criteriaValue" type="number" min={1} defaultValue={1} />
                  </div>
                </div>
                <SubmitButton className="w-full">Simpan Badge</SubmitButton>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
