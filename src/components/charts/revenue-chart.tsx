"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { RevenuePoint } from "@/lib/types";
import { formatRupiah } from "@/lib/utils";

/** Satu peta label untuk Tooltip + Legend agar keduanya tidak bisa berbeda. */
const SERIES_LABEL: Record<string, string> = {
  rental: "Sewa PS",
  fnb: "FnB",
  topup: "Topup",
};

/** Stacked daily revenue bars (rental + FnB + topup). Used by Overview & Keuangan. */
export function RevenueChart({ data }: { data: RevenuePoint[] }) {
  const rows = data.map((d) => ({ ...d, label: d.day.slice(5) }));
  return (
    // Tinggi diatur pembungkusnya supaya chart ikut menyusut bersama viewport.
    <div className="h-56 w-full sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            // 14 label harian saling tindih di 375px — sisakan yang muat saja.
            interval="preserveStartEnd"
            minTickGap={16}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={40}
            tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}rb` : `${v}`)}
          />
          <Tooltip
            formatter={(value, name) => [
              formatRupiah(Number(value)),
              SERIES_LABEL[String(name)] ?? String(name),
            ]}
            labelFormatter={(label) => `Tanggal ${label}`}
          />
          <Legend formatter={(v) => SERIES_LABEL[String(v)] ?? String(v)} />
          <Bar dataKey="rental" stackId="rev" fill="#4f46e5" radius={[0, 0, 0, 0]} />
          <Bar dataKey="fnb" stackId="rev" fill="#06b6d4" radius={[0, 0, 0, 0]} />
          <Bar dataKey="topup" stackId="rev" fill="#f59e0b" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
