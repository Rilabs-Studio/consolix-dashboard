"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Satu interval untuk seluruh papan — dipanggil sekali di halaman, lalu `now`
 * diturunkan ke tiap kartu. `null` sampai mounted karena `Date.now()` tidak
 * murni saat render dan akan merusak hidrasi SSR.
 */
export function useNow(): number | null {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    // Tick pertama lewat timeout, bukan langsung di body efek: hidrasi tetap
    // cocok dan jam terisi pada frame berikutnya, bukan menunggu 1 detik.
    const first = setTimeout(() => setNow(Date.now()), 0);
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
  }, []);
  return now;
}

export type SessionTone = "idle" | "running" | "warning" | "expired";

/** Ambang "hampir habis" — sejalan dengan SESSION_WARNING_MINUTES di backend. */
const WARNING_SECONDS = 10 * 60;

export function sessionTone(endAt: string, now: number | null): SessionTone {
  if (now === null) return "idle";
  const remaining = Math.floor((new Date(endAt).getTime() - now) / 1000);
  if (remaining <= 0) return "expired";
  return remaining <= WARNING_SECONDS ? "warning" : "running";
}

const TONE_TEXT: Record<SessionTone, string> = {
  idle: "text-slate-400",
  running: "text-emerald-600",
  warning: "text-amber-600",
  expired: "text-red-600",
};

const TONE_BAR: Record<SessionTone, string> = {
  idle: "bg-slate-300",
  running: "bg-emerald-500",
  warning: "bg-amber-500",
  expired: "bg-red-500",
};

export const SESSION_CARD_TONE: Record<SessionTone, string> = {
  idle: "",
  running: "border-emerald-200",
  warning: "border-amber-300 bg-amber-50/40",
  expired: "border-red-300 bg-red-50/40",
};

function clock(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (x: number) => String(x).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

/**
 * Hitung mundur yang berhenti di nol: sesi memang berhenti di `endAt` dan TV
 * ikut mati, jadi jam yang terus berjalan akan membohongi kasir soal tagihan.
 */
export function SessionTimer({
  startAt,
  endAt,
  now,
  size = "lg",
}: {
  startAt: string;
  endAt: string;
  now: number | null;
  size?: "lg" | "sm";
}) {
  const tone = sessionTone(endAt, now);
  const end = new Date(endAt).getTime();
  const start = new Date(startAt).getTime();
  const remaining = now === null ? 0 : Math.max(0, Math.floor((end - now) / 1000));
  const total = Math.max(1, Math.floor((end - start) / 1000));
  const progress = now === null ? 0 : Math.min(100, Math.max(0, (remaining / total) * 100));

  return (
    <div>
      <p
        className={cn(
          "font-mono font-bold tabular-nums",
          size === "lg" ? "text-3xl" : "text-2xl",
          TONE_TEXT[tone]
        )}
      >
        {now === null ? "--:--:--" : clock(remaining)}
      </p>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className={cn("h-full rounded-full transition-[width] duration-1000", TONE_BAR[tone])}
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="mt-1.5 text-xs text-slate-500">
        {tone === "expired" ? (
          <span className="font-medium text-red-600">Waktu habis — tunggu pembayaran</span>
        ) : (
          <>selesai {new Date(endAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</>
        )}
      </p>
    </div>
  );
}
