"use server";

import { revalidatePath } from "next/cache";
import { ApiError, apiGet, apiPost } from "@/lib/api-client";
import { requireRole } from "@/lib/session";
import { str, strOrUndef } from "@/lib/form";
import { backfillSessionSchema } from "@/lib/validations";
import type { SessionBill } from "@/lib/types";

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

/**
 * Catat sesi yang sudah selesai tapi gagal tercatat (kasir lupa klik, RDMS
 * mati, listrik padam). Operator+ karena backdating rawan disalahgunakan —
 * backend juga menolak role di bawah operator.
 *
 * `startAt` datang dari input `datetime-local` (waktu lokal tanpa zona), jadi
 * dikonversi ke ISO UTC di sini supaya kontraknya sama dengan endpoint lain.
 */
export async function backfillSession(fd: FormData): Promise<ActionResult> {
  await requireRole("OPERATOR");

  const local = str(fd, "startAt");
  const parsed = backfillSessionSchema.safeParse({
    consoleUnitId: str(fd, "consoleUnitId"),
    startAt: local,
    durationMinutes: str(fd, "durationMinutes"),
    paymentMethod: str(fd, "paymentMethod") || "cash",
    amount: strOrUndef(fd, "amount"),
    customerName: strOrUndef(fd, "customerName"),
    userPhone: strOrUndef(fd, "userPhone"),
    reason: str(fd, "reason"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const startAt = new Date(local);
  if (Number.isNaN(startAt.getTime())) return { error: "Jam mulai tidak valid" };

  return run(() =>
    apiPost("/admin/sessions/backfill", { ...parsed.data, startAt: startAt.toISOString() })
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

/** Bill sesi untuk dialog checkout & struk (jam main + FnB + identitas). */
export async function getSessionBill(id: string): Promise<SessionBill> {
  await requireRole("CASHIER");
  return apiGet<SessionBill>(`/admin/sessions/${id}/bill`);
}

export async function checkInBooking(fd: FormData): Promise<ActionResult> {
  await requireRole("CASHIER");
  return run(() => apiPost("/admin/bookings/check-in", { code: str(fd, "code") }));
}

export async function cancelBooking(fd: FormData): Promise<ActionResult> {
  await requireRole("CASHIER");
  return run(() => apiPost(`/admin/bookings/${str(fd, "id")}/cancel`));
}
