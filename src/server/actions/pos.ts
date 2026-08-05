"use server";

import { revalidatePath } from "next/cache";
import { ApiError, apiPost } from "@/lib/api-client";
import { requireRole } from "@/lib/session";
import { str, strOrUndef } from "@/lib/form";

export interface ActionResult {
  error?: string;
  /** Stable backend error code (envelope `errorCode`) — lets the UI branch on specific failures. */
  errorCode?: string;
}

/** Wraps a POS mutation so the client dialog can show the API's message. */
async function run(action: () => Promise<unknown>): Promise<ActionResult> {
  try {
    await action();
    revalidatePath("/kasir");
    revalidatePath("/booking");
    revalidatePath("/keuangan/tutup-kasir");
    return {};
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }
}

export async function openShift(fd: FormData): Promise<ActionResult> {
  await requireRole("CASHIER");
  return run(() =>
    apiPost("/admin/shifts/open", {
      cashOpening: Number(str(fd, "cashOpening") || 0),
      notes: strOrUndef(fd, "notes"),
    })
  );
}

export async function closeShift(fd: FormData): Promise<ActionResult> {
  await requireRole("CASHIER");
  return run(() =>
    apiPost(`/admin/shifts/${str(fd, "id")}/close`, {
      actualCash: Number(str(fd, "actualCash") || 0),
      notes: strOrUndef(fd, "notes"),
    })
  );
}

export async function startWalkIn(fd: FormData): Promise<ActionResult> {
  await requireRole("CASHIER");
  return run(() =>
    apiPost("/admin/sessions/walk-in", {
      consoleUnitId: str(fd, "consoleUnitId"),
      durationMinutes: Number(str(fd, "durationMinutes") || 60),
      customerName: strOrUndef(fd, "customerName"),
      userPhone: strOrUndef(fd, "userPhone"),
    })
  );
}

export async function checkoutSession(fd: FormData): Promise<ActionResult> {
  await requireRole("CASHIER");
  return run(() =>
    apiPost(`/admin/sessions/${str(fd, "id")}/checkout`, {
      paymentMethod: str(fd, "paymentMethod") || "cash",
    })
  );
}

export async function extendSession(fd: FormData): Promise<ActionResult> {
  await requireRole("CASHIER");
  return run(() =>
    apiPost(`/admin/sessions/${str(fd, "id")}/extend`, {
      addedMinutes: Number(str(fd, "addedMinutes") || 30),
    })
  );
}

export async function checkInBooking(fd: FormData): Promise<ActionResult> {
  await requireRole("CASHIER");
  return run(() => apiPost("/admin/bookings/check-in", { code: str(fd, "code") }));
}

export async function cancelBooking(fd: FormData): Promise<ActionResult> {
  await requireRole("CASHIER");
  return run(() => apiPost(`/admin/bookings/${str(fd, "id")}/cancel`));
}
