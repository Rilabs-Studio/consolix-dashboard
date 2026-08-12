import Link from "next/link";
import { buildMonthGrid } from "@/lib/calendar";
import { cn } from "@/lib/utils";
import { BOOKING_STATUS_LABEL, type BookingStatus } from "@/lib/constants";
import type { CalendarDay } from "@/lib/types";
import { buttonVariants } from "@/components/ui/button";

const WEEKDAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

/** Status → dot color, mirroring the badge tones used on the day panel. */
const DOT_COLOR: Record<string, string> = {
  pending: "bg-amber-400",
  confirmed: "bg-blue-500",
  checked_in: "bg-sky-500",
  in_progress: "bg-emerald-500",
  overtime: "bg-purple-500",
  completed: "bg-slate-400",
  cancelled: "bg-red-400",
  no_show: "bg-red-400",
  expired: "bg-red-400",
};

export function CalendarGrid({
  month,
  days,
  selectedDate,
  today,
}: {
  month: string;
  days: CalendarDay[];
  selectedDate?: string;
  today: string;
}) {
  const { cells, monthLabel, prevMonth, nextMonth } = buildMonthGrid(month);
  const byDate = new Map(days.map((d) => [d.date, d]));
  const statusesInMonth = [...new Set(days.flatMap((d) => Object.keys(d.byStatus)))];

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 sm:p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <Link
          href={`/booking?month=${prevMonth}`}
          aria-label="Bulan sebelumnya"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "px-2 sm:px-3")}
        >
          ‹<span className="hidden sm:ml-1 sm:inline">Sebelumnya</span>
        </Link>
        <p className="min-w-0 truncate text-sm font-semibold text-slate-900">{monthLabel}</p>
        <Link
          href={`/booking?month=${nextMonth}`}
          aria-label="Bulan berikutnya"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "px-2 sm:px-3")}
        >
          <span className="hidden sm:mr-1 sm:inline">Berikutnya</span>›
        </Link>
      </div>

      <div className="grid grid-cols-7 gap-px text-center">
        {WEEKDAYS.map((d) => (
          <div key={d} className="pb-2 text-xs font-medium text-slate-400">
            {d}
          </div>
        ))}
        {cells.map((cell, i) => {
          if (!cell)
            return <div key={`pad-${i}`} className="min-h-14 rounded-md bg-slate-50 sm:min-h-20" />;
          const day = byDate.get(cell);
          const dayNum = Number(cell.slice(8));
          return (
            <Link
              key={cell}
              href={`/booking?month=${month}&date=${cell}`}
              className={cn(
                // Sel ±42px di HP: konten dipadatkan, bukan grid-nya yang diubah —
                // kalender harus tetap terbaca sebagai satu bulan penuh.
                "flex min-h-14 flex-col items-center gap-1 rounded-md border border-transparent p-1 transition hover:border-indigo-200 hover:bg-indigo-50/60 sm:min-h-20 sm:items-start sm:p-1.5 sm:text-left",
                cell === today && "ring-1 ring-indigo-400 ring-inset",
                cell === selectedDate && "border-indigo-300 bg-indigo-50"
              )}
            >
              <span
                className={cn(
                  "text-xs font-medium",
                  cell === today ? "text-indigo-700" : "text-slate-700"
                )}
              >
                {dayNum}
              </span>
              {day && (
                <div className="flex flex-col items-center gap-1 sm:mt-1 sm:items-start sm:space-y-1">
                  {/* Pil "N booking" lebih lebar dari selnya di HP — di sana
                      cukup angkanya saja. */}
                  <span className="inline-block rounded-full bg-indigo-100 px-1.5 py-0.5 text-[11px] leading-none font-semibold text-indigo-700 sm:leading-normal">
                    {day.total}
                    <span className="hidden sm:inline"> booking</span>
                  </span>
                  <span className="flex flex-wrap justify-center gap-0.5 sm:justify-start">
                    {Object.keys(day.byStatus)
                      .slice(0, 3)
                      .map((s) => (
                        <span
                          key={s}
                          className={cn("h-1.5 w-1.5 rounded-full", DOT_COLOR[s] ?? "bg-slate-300")}
                        />
                      ))}
                  </span>
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {statusesInMonth.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-slate-100 pt-3">
          {statusesInMonth.map((s) => (
            <span key={s} className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className={cn("h-1.5 w-1.5 rounded-full", DOT_COLOR[s] ?? "bg-slate-300")} />
              {BOOKING_STATUS_LABEL[s as BookingStatus] ?? s}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
