"use server";

import { revalidatePath } from "next/cache";
import { ApiError, apiGet, apiPost } from "@/lib/api-client";
import { requireRole } from "@/lib/session";
import { bool, str, strOrUndef } from "@/lib/form";
import {
  backfillSessionSchema,
  cancelSessionSchema,
  saveSessionSchema,
  sessionIdSchema,
  walkInSchema,
} from "@/lib/validations";
import type { SessionBill, TimeBankBalance } from "@/lib/types";

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
  const parsed = walkInSchema.safeParse({
    consoleUnitId: str(fd, "consoleUnitId"),
    durationMinutes: str(fd, "durationMinutes") || 60,
    customerName: strOrUndef(fd, "customerName"),
    userPhone: strOrUndef(fd, "userPhone"),
    useTimeBank: bool(fd, "useTimeBank"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { consoleUnitId, durationMinutes, customerName, userPhone, useTimeBank } = parsed.data;

  // Redeem membakar saldo tabungan waktu si nomor, bukan menagih pembayaran —
  // endpoint dan bentuknya beda dari walk-in biasa.
  if (useTimeBank) {
    return run(() =>
      apiPost("/admin/sessions/redeem", {
        consoleUnitId,
        phone: userPhone,
        durationMinutes,
        ...(customerName ? { customerName } : {}),
      })
    );
  }
  return run(() =>
    apiPost("/admin/sessions/walk-in", {
      consoleUnitId,
      durationMinutes,
      customerName,
      userPhone,
    })
  );
}

export async function pauseSession(fd: FormData): Promise<ActionResult> {
  await requireRole("CASHIER");
  const parsed = sessionIdSchema.safeParse({ id: str(fd, "id") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  return run(() => apiPost(`/admin/sessions/${parsed.data.id}/pause`));
}

export async function resumeSession(fd: FormData): Promise<ActionResult> {
  await requireRole("CASHIER");
  const parsed = sessionIdSchema.safeParse({ id: str(fd, "id") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  return run(() => apiPost(`/admin/sessions/${parsed.data.id}/resume`));
}

/**
 * Selesaikan sesi lebih awal: sisa menit disimpan sebagai tabungan waktu milik
 * nomor HP pelanggan, lalu jam main terpakai + FnB ditagih sekarang.
 */
export async function saveAndEndSession(fd: FormData): Promise<ActionResult> {
  await requireRole("CASHIER");
  const parsed = saveSessionSchema.safeParse({
    id: str(fd, "id"),
    customerPhone: str(fd, "customerPhone"),
    paymentMethod: str(fd, "paymentMethod") || "cash",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  return run(() =>
    apiPost(`/admin/sessions/${parsed.data.id}/save`, {
      phone: parsed.data.customerPhone,
      paymentMethod: parsed.data.paymentMethod,
    })
  );
}

/** Batalkan sesi (sewa tidak ditagih); FnB yang telanjur disajikan tetap dibayar. */
export async function cancelSession(fd: FormData): Promise<ActionResult> {
  await requireRole("CASHIER");
  const parsed = cancelSessionSchema.safeParse({
    id: str(fd, "id"),
    reason: str(fd, "reason"),
    fnbPaymentMethod: strOrUndef(fd, "fnbPaymentMethod"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { id, reason, fnbPaymentMethod } = parsed.data;
  return run(() =>
    apiPost(`/admin/sessions/${id}/cancel`, {
      reason,
      ...(fnbPaymentMethod ? { fnbPaymentMethod } : {}),
    })
  );
}

/**
 * Saldo tabungan waktu sebuah nomor. `null` = nomor belum punya tabungan
 * (404) — bukan error, supaya dialog kasir bisa menampilkan pesan ramah tanpa
 * bergantung pada instance ApiError yang tidak selamat melewati boundary klien.
 */
export async function getTimeBankBalance(phone: string): Promise<TimeBankBalance | null> {
  await requireRole("CASHIER");
  try {
    return await apiGet<TimeBankBalance>("/admin/time-bank", { phone });
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
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
