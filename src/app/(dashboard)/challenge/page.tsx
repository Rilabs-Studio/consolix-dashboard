import { apiGet } from "@/lib/api-client";
import { formatDateTime } from "@/lib/utils";
import { saveChallenge, deleteChallenge } from "@/server/actions/loyalty";
import { PageHeader } from "@/components/layout/page-header";
import { Table, THead, TBody, TR, TH, TD, EmptyRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { SubmitButton, ConfirmDelete } from "@/components/forms/form-controls";

interface Challenge {
  id: string;
  title: string;
  type: string;
  targetValue: number;
  period: string;
  startAt: string;
  endAt: string;
  rewardPoints: number;
  isActive: boolean;
}
interface Template {
  id: string;
  name: string;
}

const TYPE_LABEL: Record<string, string> = {
  play_hours: "Main N jam",
  booking_count: "Booking N kali",
  spend_amount: "Belanja N rupiah",
  fnb_order: "Pesan FnB N kali",
  checkin_streak: "Streak check-in N hari",
};

export default async function ChallengePage() {
  const [challenges, templates] = await Promise.all([
    apiGet<Challenge[]>("/admin/challenges"),
    apiGet<Template[]>("/admin/voucher-templates"),
  ]);

  return (
    <div>
      <PageHeader title="Challenge" description="Misi berperiode dengan reward poin/XP/voucher." />
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Table>
          <THead>
            <TR>
              <TH>Judul</TH>
              <TH>Tipe</TH>
              <TH>Target</TH>
              <TH>Periode</TH>
              <TH>Reward</TH>
              <TH>Status</TH>
              <TH></TH>
            </TR>
          </THead>
          <TBody>
            {challenges.length === 0 && <EmptyRow colSpan={7} />}
            {challenges.map((c) => (
              <TR key={c.id}>
                <TD data-label="Judul" className="font-medium">{c.title}</TD>
                <TD data-label="Tipe">{TYPE_LABEL[c.type] ?? c.type}</TD>
                <TD data-label="Target">{c.targetValue}</TD>
                <TD data-label="Periode" className="text-sm">
                  {c.period}
                  <p className="text-xs text-slate-400">s/d {formatDateTime(c.endAt)}</p>
                </TD>
                <TD data-label="Reward">{c.rewardPoints} poin</TD>
                <TD data-label="Status">{c.isActive ? <Badge tone="green">Aktif</Badge> : <Badge tone="red">Off</Badge>}</TD>
                <TD>
                  <ConfirmDelete action={deleteChallenge} id={c.id} label={`Hapus ${c.title}?`} />
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
        <Card>
          <CardContent>
            <p className="mb-3 font-medium text-slate-900">Tambah Challenge</p>
            <form action={saveChallenge} className="space-y-3">
              <div>
                <Label>Judul</Label>
                <Input name="title" required />
              </div>
              <div>
                <Label>Deskripsi</Label>
                <Textarea name="description" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Tipe</Label>
                  <Select name="type" defaultValue="play_hours">
                    {Object.entries(TYPE_LABEL).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label>Target</Label>
                  <Input name="targetValue" type="number" min={1} required />
                </div>
                <div>
                  <Label>Periode</Label>
                  <Select name="period" defaultValue="weekly">
                    <option value="daily">Harian</option>
                    <option value="weekly">Mingguan</option>
                    <option value="monthly">Bulanan</option>
                    <option value="custom">Kustom</option>
                  </Select>
                </div>
                <div>
                  <Label>Reward poin</Label>
                  <Input name="rewardPoints" type="number" min={0} defaultValue={100} />
                </div>
                <div>
                  <Label>Mulai</Label>
                  <Input name="startAt" type="datetime-local" required />
                </div>
                <div>
                  <Label>Selesai</Label>
                  <Input name="endAt" type="datetime-local" required />
                </div>
              </div>
              <div>
                <Label>Voucher reward (opsional)</Label>
                <Select name="rewardVoucherTemplateId" defaultValue="">
                  <option value="">— Tanpa voucher —</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </Select>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" name="isActive" defaultChecked className="h-4 w-4 accent-indigo-600" />
                Aktif
              </label>
              <SubmitButton className="w-full">Simpan Challenge</SubmitButton>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
