import { apiGetPaged } from "@/lib/api-client";
import { TOPUP_STATUS_LABEL, type TopupStatus, type TopupMethod } from "@/lib/constants";
import { formatDateTime, formatRupiah } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { Table, THead, TBody, TR, TH, TD, EmptyRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CashTopupForm } from "./cash-topup-form";
import { TopupRowActions } from "./row-actions";

interface Topup {
  id: string;
  userId: string;
  userName: string | null;
  amount: number;
  method: TopupMethod;
  proofUrl: string | null;
  status: TopupStatus;
  rejectReason: string | null;
  createdAt: string;
}

const METHOD_LABEL: Record<TopupMethod, string> = {
  bank_transfer: "Transfer Bank",
  qris: "QRIS",
  cash_kasir: "Tunai Kasir",
};

export default async function TopupPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const { items: topups } = await apiGetPaged<Topup>("/admin/topups", {
    status: status ?? "pending",
    limit: 50,
  });

  return (
    <div>
      <PageHeader title="Top Up Saldo" description="Verifikasi bukti transfer / QRIS + topup tunai." />
      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        {(["pending", "approved", "rejected"] as const).map((s) => (
          <a
            key={s}
            href={`/topup?status=${s}`}
            className={`rounded-full px-3 py-1 ${
              (status ?? "pending") === s ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"
            }`}
          >
            {TOPUP_STATUS_LABEL[s]}
          </a>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Table>
          <THead>
            <TR>
              <TH>Waktu</TH>
              <TH>Member</TH>
              <TH>Nominal</TH>
              <TH>Metode</TH>
              <TH>Bukti</TH>
              <TH>Status</TH>
              <TH></TH>
            </TR>
          </THead>
          <TBody>
            {topups.length === 0 && <EmptyRow colSpan={7} />}
            {topups.map((t) => (
              <TR key={t.id}>
                <TD data-label="Waktu">{formatDateTime(t.createdAt)}</TD>
                <TD data-label="Member">{t.userName ?? "—"}</TD>
                <TD data-label="Nominal" className="font-medium">{formatRupiah(t.amount)}</TD>
                <TD data-label="Metode">{METHOD_LABEL[t.method]}</TD>
                <TD data-label="Bukti">
                  {t.proofUrl ? (
                    <a href={t.proofUrl} target="_blank" className="text-indigo-600 underline">
                      Lihat bukti
                    </a>
                  ) : (
                    "—"
                  )}
                </TD>
                <TD data-label="Status">
                  <Badge tone={t.status === "approved" ? "green" : t.status === "rejected" ? "red" : "yellow"}>
                    {TOPUP_STATUS_LABEL[t.status]}
                  </Badge>
                  {t.rejectReason && <p className="text-xs text-slate-400">{t.rejectReason}</p>}
                </TD>
                <TD>{t.status === "pending" && <TopupRowActions id={t.id} />}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
        <Card>
          <CardContent>
            <p className="mb-1 font-medium text-slate-900">Topup Tunai di Kasir</p>
            <p className="mb-3 text-xs text-slate-500">
              Langsung masuk saldo & tercatat di shift (butuh shift terbuka).
            </p>
            <CashTopupForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
