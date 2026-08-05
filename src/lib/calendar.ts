// Pure calendar-grid math for the booking calendar. Everything operates on
// Jakarta calendar STRINGS ("YYYY-MM" / "YYYY-MM-DD") with Date.UTC-only
// arithmetic — never on server-local Date getters (the classic TZ trap).

export interface MonthGrid {
  /** Monday-first cells: leading/trailing null padding + "YYYY-MM-DD" strings. */
  cells: (string | null)[];
  /** e.g. "Agustus 2026". */
  monthLabel: string;
  prevMonth: string;
  nextMonth: string;
}

export function buildMonthGrid(month: string): MonthGrid {
  const [y, m] = month.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const leading = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7; // Monday-first

  const cells: (string | null)[] = Array<string | null>(leading).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(`${month}-${String(d).padStart(2, "0")}`);
  while (cells.length % 7 !== 0) cells.push(null);

  return {
    cells,
    monthLabel: new Intl.DateTimeFormat("id-ID", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(Date.UTC(y, m - 1, 1))),
    prevMonth: m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`,
    nextMonth: m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`,
  };
}

/** Today's Jakarta calendar date as "YYYY-MM-DD" (en-CA gives ISO order). */
export function jakartaTodayString(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
}

export function currentJakartaMonth(): string {
  return jakartaTodayString().slice(0, 7);
}
