import { Star } from "lucide-react";
import { apiGet } from "@/lib/api-client";
import type { ConsoleUnit, RatingAverage, SessionRating } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { Table, THead, TBody, TR, TH, TD, EmptyRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { RatingRowActions } from "./rating-row-actions";

export default async function RatingPage({
  searchParams,
}: {
  searchParams: Promise<{ unitId?: string }>;
}) {
  const { unitId } = await searchParams;
  const [{ rows, averages }, units] = await Promise.all([
    apiGet<{ rows: SessionRating[]; averages: RatingAverage[] }>("/admin/ratings", { unitId }),
    apiGet<ConsoleUnit[]>("/consoles/units"),
  ]);
  const unitCode = (id: string) => units.find((u) => u.id === id)?.code ?? "—";

  return (
    <div>
      <PageHeader
        title="Rating Sesi"
        description="Penilaian pelanggan per unit — balas atau sembunyikan komentar."
      />
      <div className="mb-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {averages.map((a) => {
          const avg = Number(a.avg);
          return (
            <Card key={a.consoleUnitId}>
              <CardContent className="pt-4">
                <p className="text-sm text-slate-500">{unitCode(a.consoleUnitId)}</p>
                <p className="mt-1 flex items-center gap-1 text-xl font-semibold text-slate-900">
                  <Star
                    className={`h-4 w-4 ${avg < 3 ? "text-red-500" : "text-amber-400"}`}
                    fill="currentColor"
                  />
                  {avg.toFixed(1)}
                </p>
                <p className="text-xs text-slate-400">{a.count} penilaian</p>
              </CardContent>
            </Card>
          );
        })}
        {averages.length === 0 && (
          <p className="text-sm text-slate-500 sm:col-span-3">Belum ada rating.</p>
        )}
      </div>
      <Table>
        <THead>
          <TR>
            <TH>Waktu</TH>
            <TH>Unit</TH>
            <TH>Rating</TH>
            <TH>Komentar</TH>
            <TH>Balasan</TH>
            <TH />
          </TR>
        </THead>
        <TBody>
          {rows.length === 0 && <EmptyRow colSpan={6} />}
          {rows.map((r) => (
            <TR key={r.id} className={r.isHidden ? "opacity-50" : undefined}>
              <TD data-label="Waktu" className="whitespace-nowrap">{formatDateTime(r.createdAt)}</TD>
              <TD data-label="Unit" className="font-medium">{unitCode(r.consoleUnitId)}</TD>
              <TD data-label="Rating">
                <Badge tone={r.rating <= 2 ? "red" : r.rating === 3 ? "yellow" : "green"}>
                  ★ {r.rating}
                </Badge>
              </TD>
              <TD data-label="Komentar" className="max-w-sm">
                <p>{r.comment ?? "—"}</p>
                {r.tags.length > 0 && (
                  <p className="mt-0.5 text-xs text-slate-400">{r.tags.join(" · ")}</p>
                )}
              </TD>
              <TD data-label="Balasan" className="max-w-xs text-sm text-slate-600">{r.adminReply ?? "—"}</TD>
              <TD>
                <RatingRowActions id={r.id} isHidden={r.isHidden} hasReply={!!r.adminReply} />
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </div>
  );
}
