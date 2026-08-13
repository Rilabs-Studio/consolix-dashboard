import Link from "next/link";
import { apiGet, apiGetPaged } from "@/lib/api-client";
import type { Booking, CalendarDay, ConsoleUnit } from "@/lib/types";
import { BOOKING_STATUS_LABEL, PAYMENT_METHOD_LABEL } from "@/lib/constants";
import { currentJakartaMonth, jakartaTodayString } from "@/lib/calendar";
import { formatDate, formatRupiah, formatTime } from "@/lib/utils";
import { cancelBooking } from "@/server/actions/pos";

async function cancelBookingVoid(fd: FormData): Promise<void> {
  "use server";
  await cancelBooking(fd);
}
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD, EmptyRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarGrid } from "./calendar-grid";

const TONE: Record<string, "green" | "blue" | "yellow" | "red" | "default" | "purple"> = {
  pending: "yellow",
  confirmed: "blue",
  checked_in: "blue",
  in_progress: "green",
  overtime: "purple",
  completed: "default",
  cancelled: "red",
  no_show: "red",
  expired: "red",
};

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default async function BookingPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; date?: string; page?: string }>;
}) {
  const params = await searchParams;
  const month = params.month && MONTH_RE.test(params.month) ? params.month : currentJakartaMonth();
  const date = params.date && DATE_RE.test(params.date) ? params.date : undefined;
  const today = jakartaTodayString();

  const [days, units, dayResult] = await Promise.all([
    apiGet<CalendarDay[]>("/admin/bookings/calendar", { month }),
    apiGet<ConsoleUnit[]>("/consoles/units"),
    date
      ? apiGetPaged<Booking>("/admin/bookings", { date, page: params.page ?? 1, limit: 50 })
      : Promise.resolve(null),
  ]);
  const unitLabel = (id: string) => {
    const unit = units.find((u) => u.id === id);
    return unit ? (unit.displayLabel ?? unit.code) : "—";
  };
  const monthTotal = days.reduce((sum, d) => sum + d.total, 0);

  return (
    <div>
      <PageHeader
        title="Booking"
        description={`Kalender booking per tanggal — ${monthTotal} booking bulan ini. Klik tanggal untuk melihat daftarnya.`}
      />
      <CalendarGrid month={month} days={days} selectedDate={date} today={today} />

      {date && dayResult && (
        <Card className="mt-6">
          <CardContent>
            <div className="mb-3 flex items-center justify-between">
              <CardTitle>{formatDate(date, { dateStyle: "full" })}</CardTitle>
              <span className="text-sm text-slate-500">
                {dayResult.meta?.totalItems ?? dayResult.items.length} booking
              </span>
            </div>
            <Table>
              <THead>
                <TR>
                  <TH>Jam</TH>
                  <TH>Kode</TH>
                  <TH>Pelanggan</TH>
                  <TH>Unit</TH>
                  <TH>Durasi</TH>
                  <TH>Total</TH>
                  <TH>Bayar</TH>
                  <TH>Status</TH>
                  <TH></TH>
                </TR>
              </THead>
              <TBody>
                {dayResult.items.length === 0 && <EmptyRow colSpan={9} />}
                {dayResult.items.map((b) => (
                  <TR key={b.id}>
                    <TD data-label="Jam" className="whitespace-nowrap">
                      {formatTime(b.startAt)}–{formatTime(b.endAt)}
                    </TD>
                    <TD data-label="Kode" className="font-medium">{b.code}</TD>
                    <TD data-label="Pelanggan">
                      <span className="flex items-center gap-1.5">
                        {b.userName ?? b.customerName ?? "—"}
                        {b.type === "walk_in" ? (
                          <Badge tone="default">Walk-in</Badge>
                        ) : (
                          b.userId && <Badge tone="blue">Member</Badge>
                        )}
                      </span>
                    </TD>
                    <TD data-label="Unit">{unitLabel(b.consoleUnitId)}</TD>
                    <TD data-label="Durasi">{b.durationMinutes}m</TD>
                    <TD data-label="Total">{formatRupiah(b.totalAmount)}</TD>
                    <TD data-label="Bayar">
                      {PAYMENT_METHOD_LABEL[b.paymentMethod]}{" "}
                      {b.paymentStatus === "paid" ? (
                        <Badge tone="green">Lunas</Badge>
                      ) : (
                        <Badge tone="yellow">Belum</Badge>
                      )}
                    </TD>
                    <TD data-label="Status">
                      <Badge tone={TONE[b.status] ?? "default"}>
                        {BOOKING_STATUS_LABEL[b.status]}
                      </Badge>
                    </TD>
                    <TD>
                      {["pending", "confirmed"].includes(b.status) && (
                        <form action={cancelBookingVoid}>
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
            {dayResult.meta && dayResult.meta.totalPages > 1 && (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                <span>
                  Hal {dayResult.meta.page}/{dayResult.meta.totalPages}
                </span>
                {dayResult.meta.hasPrevPage && (
                  <Link
                    href={`/booking?month=${month}&date=${date}&page=${dayResult.meta.page - 1}`}
                    className="underline"
                  >
                    ‹ Sebelumnya
                  </Link>
                )}
                {dayResult.meta.hasNextPage && (
                  <Link
                    href={`/booking?month=${month}&date=${date}&page=${dayResult.meta.page + 1}`}
                    className="underline"
                  >
                    Berikutnya ›
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
      {!date && (
        <p className="mt-4 text-sm text-slate-400">
          Pilih tanggal di kalender untuk melihat siapa saja yang booking pada hari itu.
        </p>
      )}
    </div>
  );
}
