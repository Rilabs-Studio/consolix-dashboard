"use server";

import { revalidatePath } from "next/cache";
import { ApiError, apiDelete, apiPatch, apiPost } from "@/lib/api-client";
import { requireRole } from "@/lib/session";
import { str, strOrUndef, bool } from "@/lib/form";
import { fnbOrderSchema } from "@/lib/validations";
import type { ActionResult } from "./pos";

export async function saveFnbCategory(fd: FormData) {
  await requireRole("OPERATOR");
  const id = strOrUndef(fd, "id");
  const body = { name: str(fd, "name"), sortOrder: Number(str(fd, "sortOrder") || 0) };
  if (id) await apiPatch(`/admin/fnb/categories/${id}`, body);
  else await apiPost("/admin/fnb/categories", body);
  revalidatePath("/fnb/kategori");
}

export async function deleteFnbCategory(fd: FormData) {
  await requireRole("ADMIN");
  await apiDelete(`/admin/fnb/categories/${str(fd, "id")}`);
  revalidatePath("/fnb/kategori");
}

export async function saveFnbItem(fd: FormData) {
  await requireRole("OPERATOR");
  const id = strOrUndef(fd, "id");
  const body = {
    categoryId: str(fd, "categoryId"),
    name: str(fd, "name"),
    price: Number(str(fd, "price") || 0),
    costPrice: Number(str(fd, "costPrice") || 0),
    description: strOrUndef(fd, "description"),
    isAvailable: bool(fd, "isAvailable"),
  };
  if (id) await apiPatch(`/admin/fnb/items/${id}`, body);
  else await apiPost("/admin/fnb/items", body);
  revalidatePath("/fnb");
}

export async function deleteFnbItem(fd: FormData) {
  await requireRole("ADMIN");
  await apiDelete(`/admin/fnb/items/${str(fd, "id")}`);
  revalidatePath("/fnb");
}

export async function adjustFnbStock(fd: FormData) {
  await requireRole("OPERATOR");
  await apiPost(`/admin/fnb/items/${str(fd, "id")}/stock`, {
    type: str(fd, "type"),
    qty: Number(str(fd, "qty") || 0),
    note: strOrUndef(fd, "note"),
  });
  revalidatePath("/fnb");
}

/**
 * Input manual kasir dari layar POS `/fnb/kasir`. Keranjang dikirim sebagai
 * satu field JSON supaya baris-barisnya tetap berpasangan (itemId ↔ qty)
 * tanpa mengandalkan urutan `getAll()`.
 */
export async function createFnbOrder(fd: FormData): Promise<ActionResult> {
  await requireRole("CASHIER");

  let items: unknown = [];
  try {
    items = JSON.parse(str(fd, "items") || "[]");
  } catch {
    return { error: "Keranjang tidak terbaca — muat ulang halaman." };
  }

  const bookingId = strOrUndef(fd, "bookingId");
  const parsed = fnbOrderSchema.safeParse({
    items,
    bookingId,
    paymentMethod: str(fd, "paymentMethod") || "cash",
    customerName: strOrUndef(fd, "customerName"),
    customerPhone: strOrUndef(fd, "customerPhone"),
    notes: strOrUndef(fd, "notes"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    await apiPost("/admin/fnb/orders", parsed.data);
    // Jual lepas menyentuh kas shift; order yang menempel ke sesi mengubah
    // tagihan di papan kasir. Segarkan keduanya.
    revalidatePath("/fnb/kasir");
    revalidatePath("/fnb/pesanan");
    revalidatePath("/kasir");
    revalidatePath("/keuangan/tutup-kasir");
    return {};
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }
}

export async function setFnbOrderStatus(fd: FormData) {
  await requireRole("CASHIER");
  await apiPost(`/admin/fnb/orders/${str(fd, "id")}/status`, { status: str(fd, "status") });
  revalidatePath("/fnb/pesanan");
}

export async function settleFnbOrder(fd: FormData): Promise<ActionResult> {
  await requireRole("CASHIER");
  try {
    await apiPost(`/admin/fnb/orders/${str(fd, "id")}/settle`, {
      paymentMethod: str(fd, "paymentMethod") || "cash",
    });
    revalidatePath("/fnb/pesanan");
    return {};
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }
}
