import * as React from "react";
import { cn } from "@/lib/utils";

const TONE: Record<string, string> = {
  default: "bg-slate-100 text-slate-700",
  green: "bg-emerald-100 text-emerald-700",
  red: "bg-red-100 text-red-700",
  yellow: "bg-amber-100 text-amber-700",
  blue: "bg-blue-100 text-blue-700",
  purple: "bg-purple-100 text-purple-700",
};

export function Badge({
  tone = "default",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: keyof typeof TONE }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        TONE[tone],
        className
      )}
      {...props}
    />
  );
}

// Map status strings to badge tones for consistent coloring.
const STATUS_TONE: Record<string, keyof typeof TONE> = {
  CONFIRMED: "green",
  VERIFIED: "green",
  COMPLETED: "green",
  ARRIVED: "green",
  DELIVERED: "green",
  SUCCESS: "green",
  FAILED: "red",
  REFUNDED: "blue",
  PENDING: "yellow",
  AWAITING_CONFIRMATION: "yellow",
  AWAITING_PAYMENT: "blue",
  PAYMENT_REVIEW: "purple",
  PACKING: "yellow",
  PREPARING: "yellow",
  SEARCHING: "yellow",
  SHIPPED: "blue",
  ON_DELIVERY: "blue",
  DELIVERING: "blue",
  PICKED_UP: "blue",
  PICKING_UP: "blue",
  IN_PROGRESS: "blue",
  IN_TRANSIT: "blue",
  DRIVER_ASSIGNED: "blue",
  DRIVER_ARRIVING: "blue",
  CANCELLED: "red",
  REJECTED: "red",
};

// Normalize API status values (lowercase / camelCase like `onDelivery`,
// `pickedUp`) to the UPPER_SNAKE keys used in STATUS_TONE.
function normalize(status: string): string {
  return status
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .toUpperCase();
}

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const key = normalize(status);
  return <Badge tone={STATUS_TONE[key] ?? "default"}>{label ?? key.replace(/_/g, " ")}</Badge>;
}
