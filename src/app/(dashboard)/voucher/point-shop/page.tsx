import { apiGet } from "@/lib/api-client";
import { savePointShopItem, deletePointShopItem } from "@/server/actions/loyalty";
import { PageHeader } from "@/components/layout/page-header";
import { Table, THead, TBody, TR, TH, TD, EmptyRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";
import { SubmitButton, ConfirmDelete } from "@/components/forms/form-controls";
import { formatDateTime } from "@/lib/utils";

interface ShopItem {
  id: string;
  type: string;
  name: string;
  pointsCost: number;
  stock: number | null;
  perUserLimit: number | null;
  isActive: boolean;
}
interface Template {
  id: string;
  name: string;
}
interface Redemption {
  id: string;
  userId: string;
  pointsSpent: number;
  resultType: string;
  createdAt: string;
}

export default async function PointShopPage() {
  const [items, templates, redemptions] = await Promise.all([
    apiGet<ShopItem[]>("/admin/point-shop"),
    apiGet<Template[]>("/admin/voucher-templates"),
    apiGet<Redemption[]>("/admin/point-shop/redemptions"),
  ]);

  return (
    <div>
      <PageHeader title="Point Shop" description="Katalog penukaran poin (poin butuh sink!)." />
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <Table>
            <THead>
              <TR>
                <TH>Item</TH>
                <TH>Harga Poin</TH>
                <TH>Stok</TH>
                <TH>Limit/User</TH>
                <TH>Status</TH>
                <TH></TH>
              </TR>
            </THead>
            <TBody>
              {items.length === 0 && <EmptyRow colSpan={6} />}
              {items.map((i) => (
                <TR key={i.id}>
                  <TD data-label="Item" className="font-medium">{i.name}</TD>
                  <TD data-label="Harga Poin">{i.pointsCost}</TD>
                  <TD data-label="Stok">{i.stock ?? "∞"}</TD>
                  <TD data-label="Limit/User">{i.perUserLimit ?? "∞"}</TD>
                  <TD data-label="Status">{i.isActive ? <Badge tone="green">Aktif</Badge> : <Badge tone="red">Off</Badge>}</TD>
                  <TD>
                    <ConfirmDelete action={deletePointShopItem} id={i.id} label={`Hapus ${i.name}?`} />
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">Penukaran terbaru</p>
            <Table>
              <THead>
                <TR>
                  <TH>Waktu</TH>
                  <TH>Poin</TH>
                  <TH>Hasil</TH>
                </TR>
              </THead>
              <TBody>
                {redemptions.length === 0 && <EmptyRow colSpan={3} label="Belum ada penukaran" />}
                {redemptions.slice(0, 15).map((r) => (
                  <TR key={r.id}>
                    <TD data-label="Waktu">{formatDateTime(r.createdAt)}</TD>
                    <TD data-label="Poin">-{r.pointsSpent}</TD>
                    <TD data-label="Hasil">{r.resultType}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </div>
        </div>
        <Card>
          <CardContent className="pt-5">
            <p className="mb-3 font-medium text-slate-900">Tambah Item</p>
            <form action={savePointShopItem} className="space-y-3">
              <div>
                <Label>Nama</Label>
                <Input name="name" required />
              </div>
              <div>
                <Label>Jenis</Label>
                <Select name="type" defaultValue="voucher">
                  <option value="voucher">Voucher</option>
                  <option value="fnb_item">Item FnB (ditebus di kasir)</option>
                </Select>
              </div>
              <div>
                <Label>Template voucher</Label>
                <Select name="voucherTemplateId" defaultValue={templates[0]?.id ?? ""}>
                  <option value="">— Tidak ada —</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <Label>Harga poin</Label>
                  <Input name="pointsCost" type="number" min={1} required />
                </div>
                <div>
                  <Label>Stok</Label>
                  <Input name="stock" type="number" min={0} placeholder="∞" />
                </div>
                <div>
                  <Label>Limit/user</Label>
                  <Input name="perUserLimit" type="number" min={1} placeholder="∞" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" name="isActive" defaultChecked className="h-4 w-4 accent-indigo-600" />
                Aktif
              </label>
              <SubmitButton className="w-full">Simpan Item</SubmitButton>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
