import Link from "next/link";
import { apiGet } from "@/lib/api-client";
import { formatRupiah } from "@/lib/utils";
import { deleteFnbItem, saveFnbItem, adjustFnbStock } from "@/server/actions/fnb";
import { PageHeader } from "@/components/layout/page-header";
import { Table, THead, TBody, TR, TH, TD, EmptyRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { SubmitButton, ConfirmDelete } from "@/components/forms/form-controls";
import { buttonVariants } from "@/components/ui/button";

interface FnbCategory {
  id: string;
  name: string;
}
interface FnbItem {
  id: string;
  categoryId: string;
  category?: { id: string; name: string };
  name: string;
  price: number;
  costPrice: number;
  stock: number;
  isAvailable: boolean;
  description: string | null;
}

export default async function FnbPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const { edit } = await searchParams;
  const [items, categories] = await Promise.all([
    apiGet<FnbItem[]>("/admin/fnb/items"),
    apiGet<FnbCategory[]>("/admin/fnb/categories"),
  ]);
  const editing = edit ? items.find((i) => i.id === edit) : undefined;

  return (
    <div>
      <PageHeader title="FnB" description="Item menu, harga jual + HPP, dan stok." />
      <div className="mb-4 flex flex-wrap gap-2">
        <Link href="/fnb/kategori" className={buttonVariants({ variant: "outline", size: "sm" })}>
          Kategori
        </Link>
        <Link href="/fnb/pesanan" className={buttonVariants({ variant: "outline", size: "sm" })}>
          Pesanan
        </Link>
      </div>
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Table>
          <THead>
            <TR>
              <TH>Nama</TH>
              <TH>Kategori</TH>
              <TH>Harga</TH>
              <TH>HPP</TH>
              <TH>Stok</TH>
              <TH>Status</TH>
              <TH></TH>
            </TR>
          </THead>
          <TBody>
            {items.length === 0 && <EmptyRow colSpan={7} />}
            {items.map((i) => (
              <TR key={i.id}>
                <TD data-label="Nama" className="font-medium">{i.name}</TD>
                <TD data-label="Kategori">{i.category?.name ?? "—"}</TD>
                <TD data-label="Harga">{formatRupiah(i.price)}</TD>
                <TD data-label="HPP" className="text-slate-500">{formatRupiah(i.costPrice)}</TD>
                <TD data-label="Stok">
                  <span className={i.stock <= 5 ? "font-semibold text-red-600" : ""}>{i.stock}</span>
                  {/* Quick stock-in inline */}
                  <form action={adjustFnbStock} className="mt-1 flex items-center gap-1">
                    <input type="hidden" name="id" value={i.id} />
                    <input type="hidden" name="type" value="in" />
                    <Input name="qty" type="number" min={1} placeholder="+qty" className="h-7 w-16 text-xs" />
                    <SubmitButton variant="ghost" size="sm">+</SubmitButton>
                  </form>
                </TD>
                <TD data-label="Status">
                  {i.isAvailable ? <Badge tone="green">Aktif</Badge> : <Badge tone="red">Off</Badge>}
                </TD>
                <TD>
                  <div className="flex items-center gap-1">
                    <Link href={`/fnb?edit=${i.id}`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
                      Ubah
                    </Link>
                    <ConfirmDelete action={deleteFnbItem} id={i.id} label={`Hapus ${i.name}?`} />
                  </div>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
        <Card>
          <CardContent className="pt-5">
            <p className="mb-3 font-medium text-slate-900">{editing ? `Ubah ${editing.name}` : "Tambah Item"}</p>
            <form action={saveFnbItem} className="space-y-3">
              {editing && <input type="hidden" name="id" value={editing.id} />}
              <div>
                <Label>Nama</Label>
                <Input name="name" required defaultValue={editing?.name} />
              </div>
              <div>
                <Label>Kategori</Label>
                <Select name="categoryId" defaultValue={editing?.categoryId ?? categories[0]?.id}>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Harga jual (Rp)</Label>
                  <Input name="price" type="number" min={0} required defaultValue={editing?.price} />
                </div>
                <div>
                  <Label>HPP (Rp)</Label>
                  <Input name="costPrice" type="number" min={0} defaultValue={editing?.costPrice ?? 0} />
                </div>
              </div>
              <div>
                <Label>Deskripsi</Label>
                <Textarea name="description" defaultValue={editing?.description ?? ""} />
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  name="isAvailable"
                  defaultChecked={editing?.isAvailable ?? true}
                  className="h-4 w-4 accent-indigo-600"
                />
                Tersedia untuk dijual
              </label>
              <SubmitButton className="w-full">{editing ? "Simpan" : "Tambah Item"}</SubmitButton>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
