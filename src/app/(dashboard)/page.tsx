import { redirect } from "next/navigation";
import Link from "next/link";
import { CalendarClock, HandCoins, MonitorPlay, Wallet } from "lucide-react";
import { apiGet } from "@/lib/api-client";
import type { DashboardSummary } from "@/lib/types";
import { formatRupiah } from "@/lib/utils";
import { getCurrentAdmin } from "@/lib/session";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { RevenueChart } from "@/components/charts/revenue-chart";

export default async function OverviewPage() {
  const admin = await getCurrentAdmin();
  if (admin?.role === "CASHIER") redirect("/kasir");

  const summary = await apiGet<DashboardSummary>("/admin/dashboard/summary");

  const kpis = [
    {
      label: "Pendapatan Hari Ini",
      value: formatRupiah(summary.today.total),
      icon: Wallet,
      hint: `Rental ${formatRupiah(summary.today.rental)} · FnB ${formatRupiah(summary.today.fnb)}`,
    },
    {
      label: "Sesi Aktif",
      value: `${summary.activeSessions}`,
      icon: MonitorPlay,
      hint: "Sedang berjalan / overtime",
      href: "/kasir",
    },
    {
      label: "Booking Hari Ini",
      value: `${summary.bookingsToday}`,
      icon: CalendarClock,
      hint: "Semua status",
      href: "/booking",
    },
    {
      label: "Topup Menunggu",
      value: `${summary.pendingTopups}`,
      icon: HandCoins,
      hint: "Perlu approval",
      href: "/topup",
    },
  ];

  return (
    <div>
      <PageHeader
        title={`Halo, ${admin?.name ?? "Admin"}`}
        description="Ringkasan operasional hari ini."
      />
      <div className="mb-3">
        {summary.shiftOpen ? (
          <Badge tone="green">Shift kasir sedang buka</Badge>
        ) : (
          <Badge tone="yellow">Belum ada shift kasir terbuka</Badge>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map(({ label, value, icon: Icon, hint, href }) => {
          const card = (
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardContent className="pt-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-500">{label}</p>
                  <Icon className="h-5 w-5 text-indigo-600" />
                </div>
                <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
                <p className="mt-1 text-xs text-slate-400">{hint}</p>
              </CardContent>
            </Card>
          );
          return href ? (
            <Link key={label} href={href}>
              {card}
            </Link>
          ) : (
            <div key={label}>{card}</div>
          );
        })}
      </div>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Pendapatan 14 Hari Terakhir</CardTitle>
        </CardHeader>
        <CardContent>
          <RevenueChart data={summary.series} />
        </CardContent>
      </Card>
    </div>
  );
}
