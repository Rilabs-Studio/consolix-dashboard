import { apiGet } from "@/lib/api-client";
import type { ConsoleType } from "@/lib/types";
import { formatRupiah } from "@/lib/utils";
import { deleteConsoleType, saveConsoleType } from "@/server/actions/consoles";
import { PageHeader } from "@/components/layout/page-header";
import { Table, THead, TBody, TR, TH, TD, EmptyRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";
import { SubmitButton, ConfirmDelete } from "@/components/forms/form-controls";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";

// `?edit=<id>` prefills the form → the same action updates instead of creating.
export default async function TipeKonsolPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const { edit } = await searchParams;
  const types = await apiGet<ConsoleType[]>("/admin/console-types");
  const editing = edit ? types.find((t) => t.id === edit) : undefined;

  return (
    <div>
      <PageHeader title="Tipe Konsol" description="Tipe + harga dasar per jam." />
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Table>
          <THead>
            <TR>
              <TH>Nama</TH>
              <TH>Harga Dasar/Jam</TH>
              <TH>Urutan</TH>
              <TH>Status</TH>
              <TH></TH>
            </TR>
          </THead>
          <TBody>
            {types.length === 0 && <EmptyRow colSpan={5} />}
            {types.map((t) => (
              <TR key={t.id}>
                <TD data-label="Nama" className="font-medium">{t.name}</TD>
                <TD data-label="Harga Dasar/Jam">{formatRupiah(t.basePricePerHour)}</TD>
                <TD data-label="Urutan">{t.sortOrder}</TD>
                <TD data-label="Status">{t.isActive ? <Badge tone="green">Aktif</Badge> : <Badge tone="red">Nonaktif</Badge>}</TD>
                <TD>
                  <div className="flex items-center gap-1">
                    <Link
                      href={`/konsol/tipe?edit=${t.id}`}
                      className={buttonVariants({ variant: "ghost", size: "sm" })}
                    >
                      Ubah
                    </Link>
                    <ConfirmDelete action={deleteConsoleType} id={t.id} label={`Hapus tipe ${t.name}?`} />
                  </div>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
        <Card>
          <CardContent className="pt-5">
            <p className="mb-3 font-medium text-slate-900">
              {editing ? `Ubah ${editing.name}` : "Tambah Tipe"}
            </p>
            <form action={saveConsoleType} className="space-y-3">
              {editing && <input type="hidden" name="id" value={editing.id} />}
              <div>
                <Label>Nama</Label>
                <Input name="name" required defaultValue={editing?.name} placeholder="PS5" />
              </div>
              <div>
                <Label>Harga dasar / jam (Rp)</Label>
                <Input
                  name="basePricePerHour"
                  type="number"
                  min={1000}
                  required
                  defaultValue={editing?.basePricePerHour}
                />
              </div>
              <div>
                <Label>Urutan</Label>
                <Input name="sortOrder" type="number" min={0} defaultValue={editing?.sortOrder ?? 0} />
              </div>
              <div>
                <Label>Deskripsi</Label>
                <Textarea name="description" defaultValue={editing?.description ?? ""} />
              </div>
              <SubmitButton className="w-full">{editing ? "Simpan" : "Buat Tipe"}</SubmitButton>
              {editing && (
                <Link href="/konsol/tipe" className="block text-center text-sm text-slate-500 underline">
                  Batal ubah
                </Link>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
