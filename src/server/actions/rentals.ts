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

// ---- Catalog ----

export async function saveRentalProduct(fd: FormData): Promise<ActionResult> {
  await requireRole("OPERATOR");
  return run(async () => {
    await apiPost("/admin/rentals/products", {
      id: strOrUndef(fd, "id"),
      name: str(fd, "name"),
      description: strOrUndef(fd, "description") ?? "",
      kind: str(fd, "kind"),
      category: str(fd, "category"),
      pricePerDay: num(fd, "pricePerDay"),
      depositAmount: num(fd, "depositAmount"),
      stock: num(fd, "stock", 1),
      imageUrl: strOrUndef(fd, "imageUrl") ?? null,
      sortOrder: num(fd, "sortOrder"),
      isActive: bool(fd, "isActive"),
    });
    revalidatePath("/sewa/produk");
  });
}

export async function deleteRentalProduct(fd: FormData): Promise<void> {
  await requireRole("ADMIN");
  await apiDelete(`/admin/rentals/products/${str(fd, "id")}`);
  revalidatePath("/sewa/produk");
}

// ---- Orders ----

export async function setRentalStatus(fd: FormData): Promise<ActionResult> {
  await requireRole("CASHIER");
  return run(async () => {
    const collateral = fd.getAll("collateral").map(String).filter(Boolean);
    await apiPost(`/admin/rentals/${str(fd, "id")}/status`, {
      status: str(fd, "status"),
      ...(collateral.length > 0 && { collateralDocuments: collateral }),
      ...(strOrUndef(fd, "collateralNotes") && {
        collateralNotes: str(fd, "collateralNotes"),
      }),
    });
    revalidatePath("/sewa");
  });
}

export async function cancelRental(fd: FormData): Promise<ActionResult> {
  await requireRole("CASHIER");
  return run(async () => {
    await apiPost(`/admin/rentals/${str(fd, "id")}/cancel`);
    revalidatePath("/sewa");
  });
}
