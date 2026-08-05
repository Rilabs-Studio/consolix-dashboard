"use server";

import { revalidatePath } from "next/cache";
import { apiDelete, apiPatch, apiPost, apiPut } from "@/lib/api-client";
import { requireRole } from "@/lib/session";
import { holidaySchema, operatingHoursSchema, priceRuleSchema } from "@/lib/validations";
import { str, strOrUndef, bool } from "@/lib/form";

// ---- Operating hours (bulk 7 days; fields suffixed by dayOfWeek) ----

export async function saveOperatingHours(fd: FormData) {
  await requireRole("OPERATOR");
  const days = Array.from({ length: 7 }, (_, day) => ({
    dayOfWeek: day,
    openTime: str(fd, `open_${day}`) || "10:00",
    closeTime: str(fd, `close_${day}`) || "22:00",
    isClosed: bool(fd, `closed_${day}`),
    is24Hours: bool(fd, `h24_${day}`),
  }));
  const parsed = operatingHoursSchema.parse({ days });
  await apiPut("/admin/operating-hours", parsed);
  revalidatePath("/konsol/jam-operasional");
}

// ---- Holidays ----

export async function createHoliday(fd: FormData) {
  await requireRole("OPERATOR");
  const data = holidaySchema.parse({
    date: str(fd, "date"),
    name: str(fd, "name"),
    type: str(fd, "type"),
    openTime: strOrUndef(fd, "openTime"),
    closeTime: strOrUndef(fd, "closeTime"),
    priceMultiplier: strOrUndef(fd, "priceMultiplier"),
  });
  await apiPost("/admin/holidays", data);
  revalidatePath("/konsol/jam-operasional");
}

export async function deleteHoliday(fd: FormData) {
  await requireRole("ADMIN");
  await apiDelete(`/admin/holidays/${str(fd, "id")}`);
  revalidatePath("/konsol/jam-operasional");
}

// ---- Price rules ----

export async function createPriceRule(fd: FormData) {
  await requireRole("OPERATOR");
  const data = priceRuleSchema.parse({
    consoleTypeId: strOrUndef(fd, "consoleTypeId"),
    dayType: str(fd, "dayType"),
    startTime: str(fd, "startTime"),
    endTime: str(fd, "endTime"),
    pricePerHour: str(fd, "pricePerHour"),
    label: str(fd, "label"),
    priority: str(fd, "priority") || 0,
  });
  await apiPost("/admin/price-rules", data);
  revalidatePath("/konsol/harga");
}

export async function togglePriceRule(fd: FormData) {
  await requireRole("OPERATOR");
  await apiPatch(`/admin/price-rules/${str(fd, "id")}`, { isActive: bool(fd, "isActive") });
  revalidatePath("/konsol/harga");
}

export async function deletePriceRule(fd: FormData) {
  await requireRole("ADMIN");
  await apiDelete(`/admin/price-rules/${str(fd, "id")}`);
  revalidatePath("/konsol/harga");
}
