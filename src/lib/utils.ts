import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as Indonesian Rupiah. Grouped manually (not Intl currency):
 * server (Node ICU) and browser ICU disagree on the space character after
 * "Rp", which breaks hydration when the text renders in a client component.
 */
export function formatRupiah(value: number | null | undefined): string {
  if (value == null) return "-";
  const grouped = Math.abs(Math.round(value))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${value < 0 ? "-" : ""}Rp ${grouped}`;
}

/** Format a date as a readable Indonesian date, pinned to WIB (Asia/Jakarta). */
export function formatDate(
  value: Date | string | null | undefined,
  opts: Intl.DateTimeFormatOptions = { dateStyle: "medium" }
): string {
  if (!value) return "-";
  const d = typeof value === "string" ? new Date(value) : value;
  // Pin to WIB so Server Components render Jakarta time regardless of server TZ.
  return new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", ...opts }).format(d);
}

export function formatDateTime(value: Date | string | null | undefined): string {
  const formatted = formatDate(value, { dateStyle: "medium", timeStyle: "short" });
  return formatted === "-" ? formatted : `${formatted} WIB`;
}

/** Time-of-day only (HH.mm), pinned to WIB. */
export function formatTime(value: Date | string | null | undefined): string {
  if (!value) return "-";
  return formatDate(value, { timeStyle: "short" });
}

export function discountPercent(price: number, originalPrice?: number | null): number {
  if (!originalPrice || originalPrice <= price) return 0;
  return Math.round(((originalPrice - price) / originalPrice) * 100);
}

/** True when an ISO date string is in the past (kept out of render for purity). */
export function isExpired(value?: string | null): boolean {
  if (!value) return false;
  return new Date(value).getTime() < Date.now();
}
