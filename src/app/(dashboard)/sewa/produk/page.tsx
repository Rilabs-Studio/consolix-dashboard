import { apiGet } from "@/lib/api-client";
import type { RentalProduct } from "@/lib/types";
import { formatRupiah } from "@/lib/utils";
import { deleteRentalProduct } from "@/server/actions/rentals";
import { PageHeader } from "@/components/layout/page-header";
import { Table, THead, TBody, TR, TH, TD, EmptyRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ConfirmDelete } from "@/components/forms/form-controls";
import { RentalProductForm } from "./product-form";

const CATEGORY_LABEL: Record<string, string> = {
  console: "Konsol",
  tv: "TV",
  controller: "Stik",
  bundle: "Bundling",
};

export default async function SewaProdukPage() {
  const products = await apiGet<RentalProduct[]>("/admin/rentals/products");

  return (
    <div>
      <PageHeader
        title="Produk Sewa"
        description="Paket utama (PS / bundling PS+TV) dan add-on (TV, stik) untuk sewa rumahan."
      />
      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <Table>
          <THead>
            <TR>
              <TH>Produk</TH>
              <TH>Jenis</TH>
              <TH className="text-right">Harga/hari</TH>
              <TH className="text-right">Deposit</TH>
              <TH className="text-right">Stok</TH>
              <TH>Status</TH>
              <TH />
            </TR>
          </THead>
          <TBody>
            {products.length === 0 && <EmptyRow colSpan={7} />}
            {products.map((p) => (
              <TR key={p.id}>
                <TD>
                  <div className="flex items-center gap-2">
                    {p.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.imageUrl}
                        alt=""
                        className="h-9 w-9 shrink-0 rounded object-cover"
                      />
                    ) : (
                      <div className="h-9 w-9 shrink-0 rounded bg-slate-100" />
                    )}
                    <div>
                      <p className="font-medium">{p.name}</p>
                      <p className="max-w-[14rem] truncate text-xs text-slate-400">
                        {p.description}
                      </p>
                    </div>
                  </div>
                </TD>
                <TD>
                  <Badge tone={p.kind === "main" ? "blue" : "default"}>
                    {p.kind === "main" ? "Utama" : "Add-on"}
                  </Badge>
                  <p className="mt-0.5 text-xs text-slate-400">{CATEGORY_LABEL[p.category]}</p>
                </TD>
                <TD className="text-right">{formatRupiah(p.pricePerDay)}</TD>
                <TD className="text-right text-xs">{formatRupiah(p.depositAmount)}</TD>
                <TD className="text-right">{p.stock}</TD>
                <TD>
                  {p.isActive ? <Badge tone="green">Aktif</Badge> : <Badge tone="red">Off</Badge>}
                </TD>
                <TD>
                  <ConfirmDelete
                    action={deleteRentalProduct}
                    id={p.id}
                    label={`Hapus produk ${p.name}?`}
                  />
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
        <RentalProductForm />
      </div>
    </div>
  );
}
