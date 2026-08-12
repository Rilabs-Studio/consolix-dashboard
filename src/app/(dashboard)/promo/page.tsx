import { apiGet } from "@/lib/api-client";
import { formatDateTime, formatRupiah } from "@/lib/utils";
import { savePromo, deletePromo } from "@/server/actions/loyalty";
import { PageHeader } from "@/components/layout/page-header";
import { Table, THead, TBody, TR, TH, TD, EmptyRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";
import { SubmitButton, ConfirmDelete } from "@/components/forms/form-controls";
import { ImageUploadInput } from "@/components/forms/image-upload";

interface Promo {
  id: string;
  code: string;
  title: string;
  bannerUrl: string | null;
  discountType: string;
  discountValue: number;
  maxDiscount: number | null;
  minTransaction: number;
  appliesTo: string;
  quota: number | null;
  usedCount: number;
  perUserLimit: number;
  startAt: string;
  endAt: string;
  isActive: boolean;
}

export default async function PromoPage() {
  const promos = await apiGet<Promo[]>("/admin/promos");

  return (
    <div>
      <PageHeader title="Promo" description="Kode promo dengan kuota, limit per user, dan syarat." />
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Table>
          <THead>
            <TR>
              <TH>Kode</TH>
              <TH>Diskon</TH>
              <TH>Kuota</TH>
              <TH>Periode</TH>
              <TH>Status</TH>
              <TH></TH>
            </TR>
          </THead>
          <TBody>
            {promos.length === 0 && <EmptyRow colSpan={6} />}
            {promos.map((p) => (
              <TR key={p.id}>
                <TD data-label="Kode">
                  <div className="flex items-center gap-2">
                    {p.bannerUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.bannerUrl}
                        alt=""
                        className="h-9 w-16 shrink-0 rounded object-cover"
                      />
                    ) : (
                      <div className="h-9 w-16 shrink-0 rounded bg-slate-100" />
                    )}
                    <div>
                      <p className="font-mono font-medium">{p.code}</p>
                      <p className="text-xs text-slate-400">{p.title}</p>
                    </div>
                  </div>
                </TD>
                <TD data-label="Diskon" className="text-sm">
                  {p.discountType === "PERCENT"
                    ? `${p.discountValue}%${p.maxDiscount ? ` (maks ${formatRupiah(p.maxDiscount)})` : ""}`
                    : p.discountType === "FIXED"
                      ? formatRupiah(p.discountValue)
                      : `${p.discountValue} menit gratis`}
                </TD>
                <TD data-label="Kuota">
                  {p.usedCount}/{p.quota ?? "∞"}
                </TD>
                <TD data-label="Periode" className="text-xs">{formatDateTime(p.endAt)}</TD>
                <TD data-label="Status">{p.isActive ? <Badge tone="green">Aktif</Badge> : <Badge tone="red">Off</Badge>}</TD>
                <TD>
                  <ConfirmDelete action={deletePromo} id={p.id} label={`Hapus promo ${p.code}?`} />
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
        <Card>
          <CardContent className="pt-5">
            <p className="mb-3 font-medium text-slate-900">Tambah Promo</p>
            <form action={savePromo} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Kode</Label>
                  <Input name="code" required placeholder="HEMAT10" className="uppercase" />
                </div>
                <div>
                  <Label>Judul</Label>
                  <Input name="title" required />
                </div>
                <div>
                  <Label>Tipe diskon</Label>
                  <Select name="discountType" defaultValue="PERCENT">
                    <option value="PERCENT">Persen</option>
                    <option value="FIXED">Nominal</option>
                    <option value="FREE_MINUTES">Menit gratis</option>
                  </Select>
                </div>
                <div>
                  <Label>Nilai</Label>
                  <Input name="discountValue" type="number" min={1} required />
                </div>
                <div>
                  <Label>Maks diskon (Rp)</Label>
                  <Input name="maxDiscount" type="number" min={0} />
                </div>
                <div>
                  <Label>Min transaksi (Rp)</Label>
                  <Input name="minTransaction" type="number" min={0} defaultValue={0} />
                </div>
                <div>
                  <Label>Berlaku untuk</Label>
                  <Select name="appliesTo" defaultValue="booking">
                    <option value="booking">Booking</option>
                    <option value="fnb">FnB</option>
                    <option value="all">Semua</option>
                  </Select>
                </div>
                <div>
                  <Label>Kuota (kosong = ∞)</Label>
                  <Input name="quota" type="number" min={1} />
                </div>
                <div>
                  <Label>Limit / user</Label>
                  <Input name="perUserLimit" type="number" min={1} defaultValue={1} />
                </div>
                <div>
                  <Label>Mulai</Label>
                  <Input name="startAt" type="datetime-local" required />
                </div>
                <div className="col-span-2">
                  <Label>Berakhir</Label>
                  <Input name="endAt" type="datetime-local" required />
                </div>
              </div>
              <ImageUploadInput
                name="bannerUrl"
                folder="promo-banners"
                label="Banner promo (tampil di app)"
              />
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" name="isActive" defaultChecked className="h-4 w-4 accent-indigo-600" />
                Aktif
              </label>
              <SubmitButton className="w-full">Simpan Promo</SubmitButton>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
