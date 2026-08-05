import { apiGetPaged, apiGet } from "@/lib/api-client";
import type { CashShift } from "@/lib/types";
import { formatDateTime, formatRupiah } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { Table, THead, TBody, TR, TH, TD, EmptyRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default async function TutupKasirPage() {
  const [current, { items: shifts }] = await Promise.all([
    apiGet<CashShift | null>("/admin/shifts/current"),
    apiGetPaged<CashShift>("/admin/shifts", { limit: 30 }),
  ]);

  return (
    <div>
      <PageHeader
        title="Tutup Kasir"
        description="Rekonsiliasi kas per shift. Penutupan dilakukan dari halaman Kasir."
      />
      {current && (
        <Card className="mb-4">
          <CardContent className="flex flex-wrap items-center gap-4 py-3 text-sm">
            <Badge tone="green">Shift {current.code} sedang berjalan</Badge>
            <span>Kas awal {formatRupiah(current.cashOpening)}</span>
            {current.totals && (
              <>
                <span>Rental {formatRupiah(current.totals.rentalSales)}</span>
                <span>FnB {formatRupiah(current.totals.fnbSales)}</span>
                <span className="font-medium">
                  Expected {formatRupiah(current.totals.expectedCash)}
                </span>
              </>
            )}
          </CardContent>
        </Card>
      )}
      <Table>
        <THead>
          <TR>
            <TH>Shift</TH>
            <TH>Buka</TH>
            <TH>Tutup</TH>
            <TH>Kas Awal</TH>
            <TH>Rental</TH>
            <TH>FnB</TH>
            <TH>Expected</TH>
            <TH>Aktual</TH>
            <TH>Selisih</TH>
          </TR>
        </THead>
        <TBody>
          {shifts.length === 0 && <EmptyRow colSpan={9} />}
          {shifts.map((s) => (
            <TR key={s.id}>
              <TD className="font-medium">
                {s.code}{" "}
                {s.status === "open" ? <Badge tone="green">Buka</Badge> : <Badge>Tutup</Badge>}
              </TD>
              <TD>{formatDateTime(s.openedAt)}</TD>
              <TD>{s.closedAt ? formatDateTime(s.closedAt) : "—"}</TD>
              <TD>{formatRupiah(s.cashOpening)}</TD>
              <TD>{formatRupiah(s.rentalSales)}</TD>
              <TD>{formatRupiah(s.fnbSales)}</TD>
              <TD>{formatRupiah(s.expectedCash)}</TD>
              <TD>{formatRupiah(s.actualCash)}</TD>
              <TD>
                {s.difference == null ? (
                  "—"
                ) : s.difference === 0 ? (
                  <Badge tone="green">Cocok</Badge>
                ) : (
                  <Badge tone="red">{formatRupiah(s.difference)}</Badge>
                )}
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>
      {shifts.some((s) => s.notesClose) && (
        <div className="mt-4 space-y-1 text-sm text-slate-500">
          <p className="font-medium text-slate-700">Catatan selisih:</p>
          {shifts
            .filter((s) => s.notesClose)
            .map((s) => (
              <p key={s.id}>
                <span className="font-medium">{s.code}:</span> {s.notesClose}
              </p>
            ))}
        </div>
      )}
    </div>
  );
}
