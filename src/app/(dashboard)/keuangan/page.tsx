import Link from "next/link";
import { apiGet } from "@/lib/api-client";
import type { OccupancyRow, PnlReport, RevenuePoint } from "@/lib/types";
import { formatRupiah } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD, EmptyRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { RevenueChart } from "@/components/charts/revenue-chart";

function jakartaToday(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
}

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toLocaleDateString("en-CA", {
    timeZone: "Asia/Jakarta",
  });
}

export default async function KeuanganPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const from = params.from ?? daysAgo(13);
  const to = params.to ?? jakartaToday();

  const [pnl, revenue, occupancy] = await Promise.all([
    apiGet<PnlReport>("/admin/reports/pnl", { from, to }),
    apiGet<RevenuePoint[]>("/admin/reports/revenue", { from, to }),
    apiGet<OccupancyRow[]>("/admin/reports/occupancy", { from, to }),
  ]);

  const pendapatan = [
    { label: "Pendapatan Sewa PS", value: pnl.revenue.rental, tone: "text-slate-900" },
    { label: "Pendapatan FnB", value: pnl.revenue.fnb, tone: "text-slate-900" },
    { label: "Total Pendapatan", value: pnl.revenue.total, tone: "text-slate-900" },
  ];
  const labaRugi = [
    { label: "HPP FnB", value: -pnl.cogs, tone: "text-slate-900" },
    { label: "Laba Kotor", value: pnl.grossProfit, tone: "text-slate-900" },
    { label: "Pengeluaran", value: -pnl.totalExpenses, tone: "text-slate-900" },
    {
      label: "Laba Bersih",
      value: pnl.netProfit,
      tone: pnl.netProfit >= 0 ? "text-emerald-600" : "text-red-600",
    },
  ];

  return (
    <div>
      <PageHeader
        title="Keuangan"
        description="Laporan laba/rugi, pendapatan harian, dan okupansi unit."
      />

      <form className="mb-4 flex flex-wrap items-end gap-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Dari</label>
          <input
            type="date"
            name="from"
            defaultValue={from}
            className="h-10 rounded-md border border-slate-300 bg-white px-2 text-base sm:h-9 sm:text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Sampai</label>
          <input
            type="date"
            name="to"
            defaultValue={to}
            className="h-10 rounded-md border border-slate-300 bg-white px-2 text-base sm:h-9 sm:text-sm"
          />
        </div>
        <Button type="submit" variant="outline">
          Terapkan
        </Button>
        <div className="flex gap-3 sm:ml-auto">
          <Link href="/keuangan/pengeluaran" className="text-sm text-emerald-600 hover:underline">
            Pengeluaran →
          </Link>
          <Link href="/keuangan/tutup-kasir" className="text-sm text-emerald-600 hover:underline">
            Tutup Kasir →
          </Link>
        </div>
      </form>

      <div className="space-y-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Pendapatan
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            {pendapatan.map(({ label, value, tone }) => (
              <Card key={label}>
                <CardContent>
                  <p className="text-sm text-slate-500">{label}</p>
                  <p className={`mt-1 text-xl font-semibold ${tone}`}>{formatRupiah(value)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Laba / Rugi
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {labaRugi.map(({ label, value, tone }) => (
              <Card key={label}>
                <CardContent>
                  <p className="text-sm text-slate-500">{label}</p>
                  <p className={`mt-1 text-xl font-semibold ${tone}`}>{formatRupiah(value)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Pendapatan Harian</CardTitle>
        </CardHeader>
        <CardContent>
          <RevenueChart data={revenue} />
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pengeluaran per Kategori</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <TR>
                  <TH>Kategori</TH>
                  <TH className="text-right">Total</TH>
                </TR>
              </THead>
              <TBody>
                {pnl.expenses.length === 0 && <EmptyRow colSpan={2} />}
                {pnl.expenses.map((e) => (
                  <TR key={e.category}>
                    <TD data-label="Kategori">{e.category}</TD>
                    <TD data-label="Total" className="text-right">{formatRupiah(e.total)}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Okupansi Unit</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <TR>
                  <TH>Unit</TH>
                  <TH className="text-right">Sesi</TH>
                  <TH className="text-right">Jam Terpakai</TH>
                  <TH className="text-right">Okupansi</TH>
                </TR>
              </THead>
              <TBody>
                {occupancy.length === 0 && <EmptyRow colSpan={4} />}
                {occupancy.map((u) => (
                  <TR key={u.unitId}>
                    <TD data-label="Unit" className="font-medium">{u.unitCode}</TD>
                    <TD data-label="Sesi" className="text-right">{u.sessions}</TD>
                    <TD data-label="Jam Terpakai" className="text-right">{(u.usedMinutes / 60).toFixed(1)} jam</TD>
                    <TD data-label="Okupansi" className="text-right">{u.occupancyPercent}%</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
