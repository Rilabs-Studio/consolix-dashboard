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
          <div className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-x-3 gap-y-2 text-sm">
            <span className="text-xs font-semibold uppercase text-slate-400">Hari</span>
            <span className="text-xs font-semibold uppercase text-slate-400">Buka</span>
            <span className="text-xs font-semibold uppercase text-slate-400">Tutup</span>
            <span className="text-xs font-semibold uppercase text-slate-400">Libur</span>
            <span className="text-xs font-semibold uppercase text-slate-400">24 jam</span>
            {DAY_NAMES.map((name, day) => {
              const row = byDay.get(day);
              return (
                <Row key={day} day={day} name={name} row={row} />
              );
            })}
          </div>
          <div className="pt-3">
            <SubmitButton className="w-full">Simpan Jadwal</SubmitButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function Row({ day, name, row }: { day: number; name: string; row?: OperatingHourDay }) {
  return (
    <>
      <span className="font-medium text-slate-700">{name}</span>
      <Input name={`open_${day}`} type="time" defaultValue={row?.openTime ?? "10:00"} className="w-28" />
      <Input name={`close_${day}`} type="time" defaultValue={row?.closeTime ?? "02:00"} className="w-28" />
      <input
        type="checkbox"
        name={`closed_${day}`}
        defaultChecked={row?.isClosed ?? false}
        className="h-4 w-4 accent-indigo-600"
      />
      <input
        type="checkbox"
        name={`h24_${day}`}
        defaultChecked={row?.is24Hours ?? false}
        className="h-4 w-4 accent-indigo-600"
      />
    </>
  );
}
