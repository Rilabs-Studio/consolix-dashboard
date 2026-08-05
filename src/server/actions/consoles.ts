"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ApiError, apiDelete, apiPatch, apiPost } from "@/lib/api-client";
import { requireRole } from "@/lib/session";
import { consoleTypeSchema, consoleUnitSchema, gameSchema } from "@/lib/validations";
import { str, strOrUndef, list } from "@/lib/form";
import type { ActionResult } from "./pos";

// ---- Console types ----

function parseType(fd: FormData) {
  return consoleTypeSchema.parse({
    name: str(fd, "name"),
    basePricePerHour: str(fd, "basePricePerHour"),
    description: strOrUndef(fd, "description"),
    imageUrl: strOrUndef(fd, "imageUrl"),
    sortOrder: str(fd, "sortOrder") || 0,
  });
}

/** Create when `id` is absent, update otherwise (form reuses one action). */
export async function saveConsoleType(fd: FormData) {
  await requireRole("OPERATOR");
  const id = strOrUndef(fd, "id");
  const body = parseType(fd);
  if (id) await apiPatch(`/admin/console-types/${id}`, body);
  else await apiPost("/admin/console-types", body);
  revalidatePath("/konsol/tipe");
  redirect("/konsol/tipe");
}

export async function deleteConsoleType(fd: FormData) {
  await requireRole("ADMIN");
  await apiDelete(`/admin/console-types/${str(fd, "id")}`);
  revalidatePath("/konsol/tipe");
}

// ---- Console units ----

function parseUnit(fd: FormData) {
  return consoleUnitSchema.parse({
    code: str(fd, "code"),
    consoleTypeId: str(fd, "consoleTypeId"),
    roomType: str(fd, "roomType") || "regular",
    displayLabel: str(fd, "displayLabel"),
    rdmsDeviceId: str(fd, "rdmsDeviceId"),
    isActive: strOrUndef(fd, "isActive"), // select "true"/"false" — hanya ada di form edit
    notes: strOrUndef(fd, "notes"),
  });
}

export async function createConsoleUnit(fd: FormData) {
  await requireRole("OPERATOR");
  const unit = await apiPost<{ id: string }>("/admin/console-units", parseUnit(fd));
  revalidatePath("/konsol");
  redirect(`/konsol/${unit.id}`);
}

export async function updateConsoleUnit(fd: FormData) {
  await requireRole("OPERATOR");
  const id = str(fd, "id");
  await apiPatch(`/admin/console-units/${id}`, parseUnit(fd));
  revalidatePath(`/konsol/${id}`);
  redirect("/konsol");
}

export async function setUnitStatus(fd: FormData) {
  await requireRole("OPERATOR");
  const id = str(fd, "id");
  await apiPatch(`/admin/console-units/${id}/status`, { status: str(fd, "status") });
  revalidatePath("/konsol");
  revalidatePath(`/konsol/${id}`);
}

export async function deleteConsoleUnit(fd: FormData): Promise<ActionResult> {
  await requireRole("ADMIN");
  try {
    await apiDelete(`/admin/console-units/${str(fd, "id")}`);
  } catch (e) {
    // e.g. CONSOLE_UNIT_HAS_HISTORY — unit ber-riwayat booking tidak bisa dihapus.
    if (e instanceof ApiError) return { error: e.message, errorCode: e.errorCode };
    throw e;
  }
  revalidatePath("/konsol");
  redirect("/konsol");
}

export async function assignUnitGame(fd: FormData) {
  await requireRole("OPERATOR");
  const unitId = str(fd, "unitId");
  await apiPost(`/admin/console-units/${unitId}/games`, { gameId: str(fd, "gameId") });
  revalidatePath(`/konsol/${unitId}`);
}

export async function unassignUnitGame(fd: FormData) {
  await requireRole("OPERATOR");
  const unitId = str(fd, "unitId");
  await apiDelete(`/admin/console-units/${unitId}/games/${str(fd, "id")}`);
  revalidatePath(`/konsol/${unitId}`);
}

// ---- Games catalog (Mongo) ----

export async function saveGame(fd: FormData) {
  await requireRole("OPERATOR");
  const id = strOrUndef(fd, "id");
  const body = gameSchema.parse({
    title: str(fd, "title"),
    platform: list(fd, "platform"),
    genre: list(fd, "genre"),
    coverUrl: strOrUndef(fd, "coverUrl"),
    description: strOrUndef(fd, "description"),
    minPlayers: str(fd, "minPlayers") || 1,
    maxPlayers: str(fd, "maxPlayers") || 1,
  });
  if (id) await apiPatch(`/admin/games/${id}`, body);
  else await apiPost("/admin/games", body);
  revalidatePath("/konsol/game");
  redirect("/konsol/game");
}

export async function deleteGame(fd: FormData) {
  await requireRole("ADMIN");
  await apiDelete(`/admin/games/${str(fd, "id")}`);
  revalidatePath("/konsol/game");
}
