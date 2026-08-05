"use server";

import { revalidatePath } from "next/cache";
import { ApiError, apiDelete, apiPost } from "@/lib/api-client";
import { requireRole } from "@/lib/session";
import { str, strOrUndef } from "@/lib/form";
import { broadcastSchema, expenseSchema } from "@/lib/validations";
import type { ActionResult } from "./pos";

async function run(action: () => Promise<unknown>): Promise<ActionResult> {
  try {
    await action();
    return {};
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message };
    throw err;
  }
}

// ---- Pengeluaran ----

export async function createExpense(fd: FormData): Promise<ActionResult> {
  await requireRole("CASHIER");
  return run(async () => {
    const body = expenseSchema.parse({
      date: str(fd, "date"),
      expenseCategoryId: str(fd, "expenseCategoryId"),
      description: str(fd, "description"),
      amount: str(fd, "amount"),
      paymentMethod: str(fd, "paymentMethod"),
      proofUrl: strOrUndef(fd, "proofUrl"),
    });
    await apiPost("/admin/expenses", body);
    revalidatePath("/keuangan/pengeluaran");
  });
}

export async function deleteExpense(fd: FormData): Promise<void> {
  await requireRole("ADMIN");
  await apiDelete(`/admin/expenses/${str(fd, "id")}`);
  revalidatePath("/keuangan/pengeluaran");
}

export async function saveExpenseCategory(fd: FormData): Promise<ActionResult> {
  await requireRole("OPERATOR");
  return run(async () => {
    await apiPost("/admin/expense-categories", {
      id: strOrUndef(fd, "id"),
      name: str(fd, "name"),
      code: str(fd, "code").toUpperCase(),
    });
    revalidatePath("/keuangan/pengeluaran");
  });
}

// ---- Broadcast ----

export async function createBroadcast(fd: FormData): Promise<ActionResult> {
  await requireRole("OPERATOR");
  return run(async () => {
    const body = broadcastSchema.parse({
      title: str(fd, "title"),
      body: str(fd, "body"),
      deepLink: strOrUndef(fd, "deepLink"),
      audienceType: str(fd, "audienceType") || "all",
    });
    const scheduledAt = strOrUndef(fd, "scheduledAt");
    const created = await apiPost<{ id: string }>("/admin/broadcasts", body);
    if (str(fd, "mode") === "schedule" && scheduledAt) {
      await apiPost(`/admin/broadcasts/${created.id}/schedule`, {
        scheduledAt: new Date(scheduledAt).toISOString(),
      });
    } else {
      await apiPost(`/admin/broadcasts/${created.id}/send`);
    }
    revalidatePath("/notifikasi");
  });
}

export async function previewAudience(fd: FormData): Promise<ActionResult & { count?: number }> {
  await requireRole("OPERATOR");
  try {
    const { count } = await apiPost<{ count: number }>("/admin/broadcasts/preview-audience", {
      audienceType: str(fd, "audienceType") || "all",
    });
    return { count };
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message };
    throw err;
  }
}

export async function cancelBroadcast(fd: FormData): Promise<void> {
  await requireRole("OPERATOR");
  await apiPost(`/admin/broadcasts/${str(fd, "id")}/cancel`);
  revalidatePath("/notifikasi");
}

// ---- Rating ----

export async function replyRating(fd: FormData): Promise<ActionResult> {
  await requireRole("OPERATOR");
  return run(async () => {
    await apiPost(`/admin/ratings/${str(fd, "id")}/reply`, { reply: str(fd, "reply") });
    revalidatePath("/konsol/rating");
  });
}

export async function toggleHideRating(fd: FormData): Promise<void> {
  await requireRole("OPERATOR");
  await apiPost(`/admin/ratings/${str(fd, "id")}/hide`, {
    isHidden: str(fd, "isHidden") === "true",
  });
  revalidatePath("/konsol/rating");
}
