import Link from "next/link";
import { apiGet } from "@/lib/api-client";
import { formatDate, formatRupiah } from "@/lib/utils";
import { saveVoucherTemplate, deleteVoucherTemplate } from "@/server/actions/loyalty";
import { PageHeader } from "@/components/layout/page-header";
import { Table, THead, TBody, TR, TH, TD, EmptyRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";
import { SubmitButton, ConfirmDelete } from "@/components/forms/form-controls";
import { buttonVariants } from "@/components/ui/button";

interface Template {
  id: string;
  name: string;
  discountType: string;
  discountValue: number;
  maxDiscount: number | null;
  validDays: number;
  source: string;
}
interface Voucher {
  id: string;
  code: string;
  name: string;
  status: string;
  expiresAt: string;
}

export default async function VoucherPage() {
  const [templates, issued] = await Promise.all([
    apiGet<Template[]>("/admin/voucher-templates"),
    apiGet<Voucher[]>("/admin/vouchers"),
  ]);

  return (
    <div>
      <PageHeader title="Voucher" description="Template voucher + voucher terbitan." />
      <div className="mb-4">
        <Link href="/voucher/point-shop" className={buttonVariants({ variant: "outline", size: "sm" })}>
          Kelola Point Shop
        </Link>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Table>
            <THead>
              <TR>
                <TH>Template</TH>
                <TH>Diskon</TH>
                <TH>Masa Berlaku</TH>
                <TH></TH>
              </TR>
            </THead>
            <TBody>
              {templates.length === 0 && <EmptyRow colSpan={4} />}
              {templates.map((t) => (
                <TR key={t.id}>
                  <TD data-label="Template" className="font-medium">{t.name}</TD>
                  <TD data-label="Diskon" className="text-sm">
                    {t.discountType === "PERCENT"
                      ? `${t.discountValue}%${t.maxDiscount ? ` (maks ${formatRupiah(t.maxDiscount)})` : ""}`
                      : t.discountType === "FIXED"
                        ? formatRupiah(t.discountValue)
                        : `${t.discountValue} menit`}
                  </TD>
                  <TD data-label="Masa Berlaku">{t.validDays} hari</TD>
                  <TD>
                    <ConfirmDelete action={deleteVoucherTemplate} id={t.id} label={`Hapus ${t.name}?`} />
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
          <Card>
            <CardContent className="pt-5">
              <p className="mb-3 font-medium text-slate-900">Tambah Template</p>
              <form action={saveVoucherTemplate} className="space-y-3">
                <div>
                  <Label>Nama</Label>
                  <Input name="name" required />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label>Tipe</Label>
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
                    <Label>Berlaku (hari)</Label>
                    <Input name="validDays" type="number" min={1} defaultValue={30} />
                  </div>
                </div>
                <SubmitButton className="w-full">Simpan Template</SubmitButton>
              </form>
            </CardContent>
          </Card>
        </div>
        <Table>
          <THead>
            <TR>
              <TH>Kode</TH>
              <TH>Voucher</TH>
              <TH>Status</TH>
              <TH>Kadaluarsa</TH>
            </TR>
          </THead>
          <TBody>
            {issued.length === 0 && <EmptyRow colSpan={4} label="Belum ada voucher terbit" />}
            {issued.map((v) => (
              <TR key={v.id}>
                <TD data-label="Kode" className="font-mono font-medium">{v.code}</TD>
                <TD data-label="Voucher">{v.name}</TD>
                <TD data-label="Status">
                  <Badge
                    tone={v.status === "active" ? "green" : v.status === "used" ? "blue" : "red"}
                  >
                    {v.status}
                  </Badge>
                </TD>
                <TD data-label="Kadaluarsa">{formatDate(v.expiresAt)}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>
    </div>
  );
}
