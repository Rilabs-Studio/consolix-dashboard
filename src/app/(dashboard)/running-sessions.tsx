"use client";

import Link from "next/link";
import type { Booking, ConsoleUnit } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  SESSION_CARD_TONE,
  SessionTimer,
  sessionTone,
  useNow,
} from "@/components/session/session-timer";

/**
 * Papan ringkas sesi berjalan untuk Overview — hanya baca, aksinya ada di
 * Kasir. Datanya snapshot dari RSC; yang hidup di sini cuma hitung mundurnya,
 * jadi halaman ini tidak perlu ikut memegang koneksi Socket.IO papan kasir.
 */
export function RunningSessions({
  sessions,
  units,
}: {
  sessions: Booking[];
  units: ConsoleUnit[];
}) {
  const now = useNow();
  const unitById = new Map(units.map((u) => [u.id, u]));

  if (sessions.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 sm:py-10 text-center text-sm text-slate-400">
          Belum ada sesi berjalan.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {sessions.map((s) => {
        const unit = unitById.get(s.consoleUnitId);
        const tone = sessionTone(s.endAt, now, s.pausedAt);
        return (
          <Link key={s.id} href="/kasir" className="block">
            <Card
              className={cn(
                "h-full transition-shadow hover:shadow-md",
                SESSION_CARD_TONE[tone]
              )}
            >
              <CardContent className="flex flex-col gap-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-slate-900">
                      {unit?.displayLabel ?? unit?.code ?? s.code}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {s.customerName ?? s.userName ?? s.code}
                    </p>
                  </div>
                  <Badge tone={s.type === "walk_in" ? "blue" : "purple"} className="shrink-0">
                    {s.type === "walk_in" ? "Walk-in" : "Booking"}
                  </Badge>
                </div>
                <SessionTimer
                  startAt={s.startAt}
                  endAt={s.endAt}
                  now={now}
                  pausedAt={s.pausedAt}
                  size="sm"
                />
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
