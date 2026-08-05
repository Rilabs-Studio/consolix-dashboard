import { apiGet } from "@/lib/api-client";
import type { Broadcast } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
import { cancelBroadcast } from "@/server/actions/ops";
import { PageHeader } from "@/components/layout/page-header";
import { Table, THead, TBody, TR, TH, TD, EmptyRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BroadcastForm } from "./broadcast-form";

const STATUS_TONE: Record<string, "green" | "blue" | "yellow" | "red" | "default"> = {
  sent: "green",
  scheduled: "blue",
  sending: "yellow",
  draft: "default",
  failed: "red",
  cancelled: "red",
};

const STATUS_LABEL: Record<string, string> = {
  sent: "Terkirim",
  scheduled: "Terjadwal",
  sending: "Mengirim…",
  draft: "Draft",
  failed: "Gagal",
  cancelled: "Dibatalkan",
};

export default async function NotifikasiPage() {
  const broadcasts = await apiGet<Broadcast[]>("/admin/broadcasts");

  return (
    <div>
      <PageHeader
        title="Notifikasi & Broadcast"
        description="Kirim pesan ke semua user atau segmen tertentu — masuk ke inbox app + push FCM."
      />
      <div className="mb-6">
        <BroadcastForm />
      </div>
      <Table>
        <THead>
          <TR>
            <TH>Judul</TH>
            <TH>Audiens</TH>
            <TH>Status</TH>
            <TH className="text-right">Target</TH>
            <TH className="text-right">Terkirim</TH>
            <TH className="text-right">Gagal</TH>
            <TH>Waktu</TH>
            <TH />
          </TR>
        </THead>
        <TBody>
          {broadcasts.length === 0 && <EmptyRow colSpan={8} />}
          {broadcasts.map((b) => (
            <TR key={b.id}>
              <TD>
                <p className="font-medium text-slate-900">{b.title}</p>
                <p className="max-w-xs truncate text-xs text-slate-500">{b.body}</p>
              </TD>
              <TD>{b.audienceType === "all" ? "Semua user" : b.audienceType}</TD>
              <TD>
                <Badge tone={STATUS_TONE[b.status] ?? "default"}>
                  {STATUS_LABEL[b.status] ?? b.status}
                </Badge>
              </TD>
              <TD className="text-right">{b.totalTargets}</TD>
              <TD className="text-right">{b.sentCount}</TD>
              <TD className="text-right">{b.failedCount}</TD>
              <TD className="text-xs">
                {b.status === "scheduled"
                  ? `Jadwal: ${formatDateTime(b.scheduledAt)}`
                  : formatDateTime(b.sentAt ?? b.createdAt)}
              </TD>
              <TD>
                {(b.status === "draft" || b.status === "scheduled") && (
                  <form action={cancelBroadcast}>
                    <input type="hidden" name="id" value={b.id} />
                    <Button type="submit" variant="ghost" size="sm">
                      Batalkan
                    </Button>
                  </form>
                )}
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </div>
  );
}
