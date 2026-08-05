"use server";

import { revalidatePath } from "next/cache";
import { ApiError, apiPost } from "@/lib/api-client";
import { requireRole } from "@/lib/session";
import { cashTopupSchema } from "@/lib/validations";
import { str, strOrUndef } from "@/lib/form";
import type { ActionResult } from "./pos";

export async function approveTopup(fd: FormData) {
  await requireRole("CASHIER");
  await apiPost(`/admin/topups/${str(fd, "id")}/approve`);
  revalidatePath("/topup");
}

export async function rejectTopup(fd: FormData) {
  await requireRole("CASHIER");
  await apiPost(`/admin/topups/${str(fd, "id")}/reject`, { reason: str(fd, "reason") });
  revalidatePath("/topup");
}

export async function cashTopup(fd: FormData): Promise<ActionResult> {
  await requireRole("CASHIER");
  const parsed = cashTopupSchema.safeParse({
    userId: str(fd, "userId"),
    amount: str(fd, "amount"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  try {
    await apiPost("/admin/topups/cash", parsed.data);
    revalidatePath("/topup");
    return {};
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }
}

export async function rejectTopupWithReason(fd: FormData): Promise<ActionResult> {
  await requireRole("CASHIER");
  const reason = strOrUndef(fd, "reason");
  if (!reason) return { error: "Alasan penolakan wajib diisi" };
  try {
    await apiPost(`/admin/topups/${str(fd, "id")}/reject`, { reason });
    revalidatePath("/topup");
    return {};
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }
}
