import Link from "next/link";
import { apiGetPaged } from "@/lib/api-client";
import type { RentalOrder } from "@/lib/types";
import { formatDate, formatRupiah } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { Table, THead, TBody, TR, TH, TD, EmptyRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { RentalRowActions } from "./row-actions";

const STATUS_TONE: Record<string, "green" | "blue" | "yellow" | "red" | "default" | "purple"> = {
  pending: "yellow",
  confirmed: "blue",
  out: "purple",
  completed: "green",
  cancelled: "red",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Menunggu Bayar",
  confirmed: "Siap Diserahkan",
  out: "Di Pelanggan",
  completed: "Selesai",
  cancelled: "Batal",
};

export default async function SewaPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const { status, page } = await searchParams;
  const { items: orders } = await apiGetPaged<RentalOrder>("/admin/rentals", {
    status,
    page: page ?? 1,
    limit: 20,
  });

  return (
    <div>
      <PageHeader
        title="Sewa Rumahan"
        description="Sewa PS dibawa pulang — unit saja, add-on TV/stik, atau bundling."
      />
      <div className="mb-4 flex items-end justify-between gap-2">
        <form className="flex items-end gap-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Status</label>
            <select
              name="status"
              defaultValue={status ?? ""}
              className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm"
            >
              <option value="">Semua</option>
              {Object.entries(STATUS_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm hover:bg-slate-50"
          >
            Filter
          </button>
        </form>
        <Link href="/sewa/produk" className="text-sm text-emerald-600 hover:underline">
          Kelola Produk Sewa →
        </Link>
      </div>
      <Table>
        <THead>
          <TR>
            <TH>Order</TH>
            <TH>Item</TH>
            <TH>Periode</TH>
            <TH>Pengiriman</TH>
            <TH className="text-right">Total</TH>
            <TH>Deposit</TH>
            <TH>Status</TH>
            <TH />
          </TR>
        </THead>
        <TBody>
          {orders.length === 0 && <EmptyRow colSpan={8} />}
          {orders.map((o) => (
            <TR key={o.id}>
              <TD>
                <p className="font-mono text-sm font-medium">{o.code}</p>
                <p className="text-xs text-slate-400">
                  {o.paymentStatus === "paid" ? (
                    <span className="text-emerald-600">Lunas ({o.paymentMethod})</span>
                  ) : o.paymentStatus === "refunded" ? (
                    "Direfund"
                  ) : (
                    "Belum bayar — tagih saat serah terima"
                  )}
                </p>
              </TD>
              <TD className="text-sm">
                {o.items.map((i) => (
                  <p key={i.id}>
                    {i.qty > 1 ? `${i.qty}× ` : ""}
                    {i.name}
                  </p>
                ))}
              </TD>
              <TD className="text-xs">
                {formatDate(o.startDate)} – {formatDate(o.endDate)}
                <p className="text-slate-400">{o.durationDays} hari</p>
              </TD>
              <TD className="max-w-[12rem] text-xs">
                {o.deliveryMethod === "pickup" ? (
                  "Ambil di outlet"
                ) : (
                  <>
                    Diantar ({formatRupiah(o.deliveryFee)})
                    <p className="truncate text-slate-400" title={o.deliveryAddress ?? ""}>
                      {o.deliveryAddress}
                    </p>
                  </>
                )}
              </TD>
              <TD className="text-right font-medium">{formatRupiah(o.totalAmount)}</TD>
              <TD className="text-xs">{formatRupiah(o.depositAmount)}</TD>
              <TD>
                <Badge tone={STATUS_TONE[o.status] ?? "default"}>
                  {STATUS_LABEL[o.status] ?? o.status}
                </Badge>
              </TD>
              <TD>
                <RentalRowActions order={o} />
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </div>
  );
}
