"use server";

import { revalidatePath } from "next/cache";
import { ApiError, apiDelete, apiPost } from "@/lib/api-client";
import { requireRole } from "@/lib/session";
import { str, strOrUndef, bool } from "@/lib/form";
import type { ActionResult } from "./pos";

const num = (fd: FormData, key: string, fallback = 0) => Number(str(fd, key) || fallback);

async function run(action: () => Promise<unknown>): Promise<ActionResult> {
  try {
    await action();
    return {};
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message };
    throw err;
  }
}

export async function saveMerchProduct(fd: FormData): Promise<ActionResult> {
  await requireRole("OPERATOR");
  return run(async () => {
    await apiPost("/admin/merch/products", {
      id: strOrUndef(fd, "id"),
      name: str(fd, "name"),
      description: strOrUndef(fd, "description") ?? "",
      price: num(fd, "price"),
      stock: num(fd, "stock"),
      imageUrl: strOrUndef(fd, "imageUrl") ?? null,
      sortOrder: num(fd, "sortOrder"),
      isActive: bool(fd, "isActive"),
    });
    revalidatePath("/merchandise/produk");
  });
}

export async function deleteMerchProduct(fd: FormData): Promise<void> {
  await requireRole("ADMIN");
  await apiDelete(`/admin/merch/products/${str(fd, "id")}`);
  revalidatePath("/merchandise/produk");
}

export async function completeMerchOrder(fd: FormData): Promise<ActionResult> {
  await requireRole("CASHIER");
  return run(async () => {
    await apiPost(`/admin/merch/orders/${str(fd, "id")}/complete`);
    revalidatePath("/merchandise");
  });
}

export async function cancelMerchOrder(fd: FormData): Promise<ActionResult> {
  await requireRole("CASHIER");
  return run(async () => {
    await apiPost(`/admin/merch/orders/${str(fd, "id")}/cancel`);
    revalidatePath("/merchandise");
  });
}
