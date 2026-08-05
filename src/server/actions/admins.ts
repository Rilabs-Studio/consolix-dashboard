"use server";

import { revalidatePath } from "next/cache";
import { apiDelete, apiPatch, apiPost } from "@/lib/api-client";
import { requireRole } from "@/lib/session";
import { toApiRole, type AdminRole } from "@/lib/constants";
import { adminAccountSchema } from "@/lib/validations";
import { str, bool } from "@/lib/form";

export async function createAdmin(fd: FormData) {
  await requireRole("SUPER_ADMIN");
  const data = adminAccountSchema.parse({
    email: str(fd, "email"),
    name: str(fd, "name"),
    password: str(fd, "password"),
    role: str(fd, "role") as AdminRole,
  });
  await apiPost("/admin/admins", { ...data, role: toApiRole(data.role) });
  revalidatePath("/pengguna/admin");
}

export async function setAdminActive(fd: FormData) {
  await requireRole("SUPER_ADMIN");
  await apiPatch(`/admin/admins/${str(fd, "id")}/active`, { active: bool(fd, "active") });
  revalidatePath("/pengguna/admin");
}

export async function deleteAdmin(fd: FormData) {
  await requireRole("SUPER_ADMIN");
  await apiDelete(`/admin/admins/${str(fd, "id")}`);
  revalidatePath("/pengguna/admin");
}
