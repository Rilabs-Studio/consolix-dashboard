"use client";

import { saveOperatingHours } from "@/server/actions/schedule";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/forms/form-controls";
import type { OperatingHourDay } from "@/lib/types";

const DAY_NAMES = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

export function HoursForm({ days }: { days: OperatingHourDay[] }) {
  const byDay = new Map(days.map((d) => [d.dayOfWeek, d]));

  return (
    <Card>
      <CardContent className="pt-5">
        <p className="mb-3 font-medium text-slate-900">Jadwal Mingguan</p>
        <form action={saveOperatingHours} className="space-y-2">
          {/* Header kolom hanya relevan pada tata letak grid (sm ke atas); di HP
              tiap hari jadi kartunya sendiri dengan label melekat. */}
          <div className="hidden text-sm sm:grid sm:grid-cols-[1fr_auto_auto_auto_auto] sm:items-center sm:gap-x-3">
            <span className="text-xs font-semibold text-slate-400 uppercase">Hari</span>
            <span className="text-xs font-semibold text-slate-400 uppercase">Buka</span>
            <span className="text-xs font-semibold text-slate-400 uppercase">Tutup</span>
            <span className="text-xs font-semibold text-slate-400 uppercase">Libur</span>
            <span className="text-xs font-semibold text-slate-400 uppercase">24 jam</span>
          </div>
          <div className="space-y-2 text-sm sm:grid sm:grid-cols-[1fr_auto_auto_auto_auto] sm:items-center sm:gap-x-3 sm:gap-y-2 sm:space-y-0">
            {DAY_NAMES.map((name, day) => (
              <Row key={day} day={day} name={name} row={byDay.get(day)} />
            ))}
          </div>
          <div className="pt-3">
            <SubmitButton className="w-full">Simpan Jadwal</SubmitButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

/**
 * Satu hari. Di bawah `sm` dibungkus jadi kartu (5 track `auto` tidak muat di
 * 375px: dua field jam saja sudah ±224px). Dari `sm` ke atas `display: contents`
 * melarutkan pembungkusnya sehingga sel-selnya kembali menempati grid induk.
 */
function Row({ day, name, row }: { day: number; name: string; row?: OperatingHourDay }) {
  return (
    <div className="rounded-lg border border-slate-200 p-3 sm:contents sm:rounded-none sm:border-0 sm:p-0">
      <span className="mb-2 block font-medium text-slate-700 sm:mb-0">{name}</span>
      <div className="flex items-center gap-2 sm:contents">
        <label className="flex-1 sm:contents">
          <span className="mb-1 block text-xs text-slate-400 sm:hidden">Buka</span>
          <Input
            name={`open_${day}`}
            type="time"
            defaultValue={row?.openTime ?? "10:00"}
            className="sm:w-28"
          />
        </label>
        <label className="flex-1 sm:contents">
          <span className="mb-1 block text-xs text-slate-400 sm:hidden">Tutup</span>
          <Input
            name={`close_${day}`}
            type="time"
            defaultValue={row?.closeTime ?? "02:00"}
            className="sm:w-28"
          />
        </label>
      </div>
      <label className="mt-2 flex items-center gap-2 text-slate-600 sm:mt-0 sm:justify-center">
        <input
          type="checkbox"
          name={`closed_${day}`}
          defaultChecked={row?.isClosed ?? false}
          className="h-4 w-4 accent-indigo-600"
        />
        <span className="sm:hidden">Libur</span>
      </label>
      <label className="mt-1 flex items-center gap-2 text-slate-600 sm:mt-0 sm:justify-center">
        <input
          type="checkbox"
          name={`h24_${day}`}
          defaultChecked={row?.is24Hours ?? false}
          className="h-4 w-4 accent-indigo-600"
        />
        <span className="sm:hidden">24 jam</span>
      </label>
    </div>
  );
}
