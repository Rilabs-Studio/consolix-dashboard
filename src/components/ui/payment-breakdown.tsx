import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRupiah } from "@/lib/utils";

/**
 * Payment breakdown card — lists each fee component (subtotal, ongkir, biaya
 * layanan aplikasi, …) on its own line, then the grand total the user paid.
 * Shared across every order-detail page so the "biaya jasa aplikasi" line reads
 * identically for MiFood, MiMart, MiRide/MiCar, and MiSend.
 */
export function PaymentBreakdown({
  rows,
  total,
  title = "Rincian Pembayaran",
  totalLabel = "Total Dibayar User",
}: {
  rows: { label: string; value: number }[];
  total: number;
  title?: string;
  totalLabel?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="space-y-2 text-sm">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center justify-between">
              <dt className="text-slate-500">{r.label}</dt>
              <dd className="text-slate-800">{formatRupiah(r.value)}</dd>
            </div>
          ))}
          <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-3 text-base font-semibold text-slate-900">
            <dt>{totalLabel}</dt>
            <dd>{formatRupiah(total)}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
