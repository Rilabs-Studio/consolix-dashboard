import { apiGet } from "@/lib/api-client";
import type { MerchProduct } from "@/lib/types";
import { formatRupiah } from "@/lib/utils";
import { deleteMerchProduct } from "@/server/actions/merch";
import { PageHeader } from "@/components/layout/page-header";
import { Table, THead, TBody, TR, TH, TD, EmptyRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ConfirmDelete } from "@/components/forms/form-controls";
import { MerchProductForm } from "./product-form";

export default async function MerchProdukPage() {
  const products = await apiGet<MerchProduct[]>("/admin/merch/products");

  return (
    <div>
      <PageHeader
        title="Produk Merchandise"
        description="Katalog merchandise yang bisa dibeli dari app (diambil di outlet)."
      />
      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <Table>
          <THead>
            <TR>
              <TH>Produk</TH>
              <TH className="text-right">Harga</TH>
              <TH className="text-right">Stok</TH>
              <TH>Status</TH>
              <TH />
            </TR>
          </THead>
          <TBody>
            {products.length === 0 && <EmptyRow colSpan={5} />}
            {products.map((p) => (
              <TR key={p.id}>
                <TD data-label="Produk">
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
                      <p className="max-w-[16rem] truncate text-xs text-slate-400">
                        {p.description}
                      </p>
                    </div>
                  </div>
                </TD>
                <TD data-label="Harga" className="text-right">{formatRupiah(p.price)}</TD>
                <TD data-label="Stok" className="text-right">{p.stock}</TD>
                <TD data-label="Status">
                  {p.isActive ? <Badge tone="green">Aktif</Badge> : <Badge tone="red">Off</Badge>}
                </TD>
                <TD>
                  <ConfirmDelete
                    action={deleteMerchProduct}
                    id={p.id}
                    label={`Hapus ${p.name}?`}
                  />
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
        <MerchProductForm />
      </div>
    </div>
  );
}
