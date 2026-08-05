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

/** Stacked daily revenue bars (rental + FnB). Used by Overview & Keuangan. */
export function RevenueChart({ data }: { data: RevenuePoint[] }) {
  const rows = data.map((d) => ({ ...d, label: d.day.slice(5) }));
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
          <YAxis
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={60}
            tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}rb` : `${v}`)}
          />
          <Tooltip
            formatter={(value, name) => [
              formatRupiah(Number(value)),
              name === "rental" ? "Rental" : "FnB",
            ]}
            labelFormatter={(label) => `Tanggal ${label}`}
          />
          <Legend formatter={(v) => (v === "rental" ? "Rental" : "FnB")} />
          <Bar dataKey="rental" stackId="rev" fill="#4f46e5" radius={[0, 0, 0, 0]} />
          <Bar dataKey="fnb" stackId="rev" fill="#06b6d4" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
