import { apiGet } from "@/lib/api-client";
import { deleteFnbCategory, saveFnbCategory } from "@/server/actions/fnb";
import { PageHeader } from "@/components/layout/page-header";
import { Table, THead, TBody, TR, TH, TD, EmptyRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { SubmitButton, ConfirmDelete } from "@/components/forms/form-controls";

interface FnbCategory {
  id: string;
  name: string;
  sortOrder: number;
}

export default async function FnbKategoriPage() {
  const categories = await apiGet<FnbCategory[]>("/admin/fnb/categories");

  return (
    <div>
      <PageHeader title="Kategori FnB" description="Kelompok menu." />
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Table>
          <THead>
            <TR>
              <TH>Nama</TH>
              <TH>Urutan</TH>
              <TH></TH>
            </TR>
          </THead>
          <TBody>
            {categories.length === 0 && <EmptyRow colSpan={3} />}
            {categories.map((c) => (
              <TR key={c.id}>
                <TD className="font-medium">{c.name}</TD>
                <TD>{c.sortOrder}</TD>
                <TD>
                  <ConfirmDelete action={deleteFnbCategory} id={c.id} label={`Hapus kategori ${c.name}?`} />
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
        <Card>
          <CardContent className="pt-5">
            <p className="mb-3 font-medium text-slate-900">Tambah Kategori</p>
            <form action={saveFnbCategory} className="space-y-3">
              <div>
                <Label>Nama</Label>
                <Input name="name" required />
              </div>
              <div>
                <Label>Urutan</Label>
                <Input name="sortOrder" type="number" min={0} defaultValue={0} />
              </div>
              <SubmitButton className="w-full">Tambah</SubmitButton>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
