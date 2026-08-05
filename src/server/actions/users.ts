"use server";

import { revalidatePath } from "next/cache";
import { apiGet, apiPatch } from "@/lib/api-client";
import { requireRole } from "@/lib/session";
import { str, bool } from "@/lib/form";

export async function setUserActive(fd: FormData) {
  await requireRole("ADMIN");
  await apiPatch(`/admin/users/${str(fd, "id")}/active`, { active: bool(fd, "active") });
  revalidatePath("/pengguna");
}

export interface UserLookupItem {
  id: string;
  name: string;
  phone: string | null;
  avatarUrl: string | null;
}

/** Search minimal user data for the cashier picker (name/phone, min 2 chars). */
export async function searchUsers(query: string): Promise<UserLookupItem[]> {
  await requireRole("CASHIER");
  const q = query.trim();
  if (q.length < 2) return [];
  return apiGet<UserLookupItem[]>("/admin/users/lookup", { search: q, limit: 10 });
}
