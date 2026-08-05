"use server";

import { revalidatePath } from "next/cache";
import { ApiError, apiDelete, apiPatch, apiPost } from "@/lib/api-client";
import { requireRole } from "@/lib/session";
import { str, strOrUndef, bool } from "@/lib/form";
import type { ActionResult } from "./pos";

const num = (fd: FormData, key: string, fallback = 0) => Number(str(fd, key) || fallback);

// ---- Member tiers ----

export async function saveTier(fd: FormData) {
  await requireRole("OPERATOR");
  const id = strOrUndef(fd, "id");
  const body = {
    name: str(fd, "name"),
    minLifetimePoints: num(fd, "minLifetimePoints"),
    discountPercent: num(fd, "discountPercent"),
    pointMultiplier: str(fd, "pointMultiplier") || "1",
    freeMinutesPerMonth: num(fd, "freeMinutesPerMonth"),
    color: str(fd, "color") || "#888888",
    sortOrder: num(fd, "sortOrder"),
  };
  if (id) await apiPatch(`/admin/member-tiers/${id}`, body);
  else await apiPost("/admin/member-tiers", body);
  revalidatePath("/member/tier");
}

export async function deleteTier(fd: FormData) {
  await requireRole("ADMIN");
  await apiDelete(`/admin/member-tiers/${str(fd, "id")}`);
  revalidatePath("/member/tier");
}

// ---- Gamification ----

export async function saveBadge(fd: FormData) {
  await requireRole("OPERATOR");
  const id = strOrUndef(fd, "id");
  const body = {
    code: str(fd, "code").toUpperCase(),
    name: str(fd, "name"),
    description: strOrUndef(fd, "description") ?? "",
    criteriaType: str(fd, "criteriaType"),
    criteriaValue: num(fd, "criteriaValue"),
  };
  if (id) await apiPatch(`/admin/badges/${id}`, body);
  else await apiPost("/admin/badges", body);
  revalidatePath("/gamifikasi");
}

export async function deleteBadge(fd: FormData) {
  await requireRole("ADMIN");
  await apiDelete(`/admin/badges/${str(fd, "id")}`);
  revalidatePath("/gamifikasi");
}

export async function adjustPoints(fd: FormData): Promise<ActionResult> {
  await requireRole("ADMIN");
  try {
    await apiPost("/admin/points/adjust", {
      userId: str(fd, "userId"),
      points: num(fd, "points"),
      reason: str(fd, "reason"),
    });
    revalidatePath("/gamifikasi");
    return {};
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }
}

// ---- Challenges ----

export async function saveChallenge(fd: FormData) {
  await requireRole("OPERATOR");
  const id = strOrUndef(fd, "id");
  const body = {
    title: str(fd, "title"),
    description: strOrUndef(fd, "description") ?? "",
    type: str(fd, "type"),
    targetValue: num(fd, "targetValue"),
    period: str(fd, "period") || "weekly",
    startAt: new Date(str(fd, "startAt")).toISOString(),
    endAt: new Date(str(fd, "endAt")).toISOString(),
    rewardPoints: num(fd, "rewardPoints"),
    rewardXp: num(fd, "rewardXp"),
    rewardVoucherTemplateId: strOrUndef(fd, "rewardVoucherTemplateId") || null,
    isActive: bool(fd, "isActive"),
  };
  if (id) await apiPatch(`/admin/challenges/${id}`, body);
  else await apiPost("/admin/challenges", body);
  revalidatePath("/challenge");
}

export async function deleteChallenge(fd: FormData) {
  await requireRole("ADMIN");
  await apiDelete(`/admin/challenges/${str(fd, "id")}`);
  revalidatePath("/challenge");
}

// ---- Promos ----

export async function savePromo(fd: FormData) {
  await requireRole("OPERATOR");
  const id = strOrUndef(fd, "id");
  const body = {
    code: str(fd, "code").toUpperCase(),
    title: str(fd, "title"),
    description: strOrUndef(fd, "description") ?? "",
    bannerUrl: strOrUndef(fd, "bannerUrl") ?? null,
    discountType: str(fd, "discountType"),
    discountValue: num(fd, "discountValue"),
    maxDiscount: strOrUndef(fd, "maxDiscount") ? num(fd, "maxDiscount") : null,
    minTransaction: num(fd, "minTransaction"),
    appliesTo: str(fd, "appliesTo") || "all",
    quota: strOrUndef(fd, "quota") ? num(fd, "quota") : null,
    perUserLimit: num(fd, "perUserLimit", 1),
    startAt: new Date(str(fd, "startAt")).toISOString(),
    endAt: new Date(str(fd, "endAt")).toISOString(),
    isActive: bool(fd, "isActive"),
  };
  if (id) await apiPatch(`/admin/promos/${id}`, body);
  else await apiPost("/admin/promos", body);
  revalidatePath("/promo");
}

export async function deletePromo(fd: FormData) {
  await requireRole("ADMIN");
  await apiDelete(`/admin/promos/${str(fd, "id")}`);
  revalidatePath("/promo");
}

// ---- Vouchers & point shop ----

export async function saveVoucherTemplate(fd: FormData) {
  await requireRole("OPERATOR");
  const id = strOrUndef(fd, "id");
  const body = {
    name: str(fd, "name"),
    discountType: str(fd, "discountType"),
    discountValue: num(fd, "discountValue"),
    maxDiscount: strOrUndef(fd, "maxDiscount") ? num(fd, "maxDiscount") : null,
    minTransaction: num(fd, "minTransaction"),
    appliesTo: str(fd, "appliesTo") || "booking",
    validDays: num(fd, "validDays", 30),
  };
  if (id) await apiPatch(`/admin/voucher-templates/${id}`, body);
  else await apiPost("/admin/voucher-templates", body);
  revalidatePath("/voucher");
}

export async function deleteVoucherTemplate(fd: FormData) {
  await requireRole("ADMIN");
  await apiDelete(`/admin/voucher-templates/${str(fd, "id")}`);
  revalidatePath("/voucher");
}

export async function savePointShopItem(fd: FormData) {
  await requireRole("OPERATOR");
  const id = strOrUndef(fd, "id");
  const body = {
    type: str(fd, "type") || "voucher",
    voucherTemplateId: strOrUndef(fd, "voucherTemplateId") || null,
    name: str(fd, "name"),
    description: strOrUndef(fd, "description") ?? "",
    pointsCost: num(fd, "pointsCost"),
    stock: strOrUndef(fd, "stock") ? num(fd, "stock") : null,
    perUserLimit: strOrUndef(fd, "perUserLimit") ? num(fd, "perUserLimit") : null,
    isActive: bool(fd, "isActive"),
  };
  if (id) await apiPatch(`/admin/point-shop/${id}`, body);
  else await apiPost("/admin/point-shop", body);
  revalidatePath("/voucher/point-shop");
}

export async function deletePointShopItem(fd: FormData) {
  await requireRole("ADMIN");
  await apiDelete(`/admin/point-shop/${str(fd, "id")}`);
  revalidatePath("/voucher/point-shop");
}

// ---- Events ----

export async function saveEvent(fd: FormData) {
  await requireRole("OPERATOR");
  const id = strOrUndef(fd, "id");
  const rewardRaw = strOrUndef(fd, "rewardPoints");
  const body = {
    title: str(fd, "title"),
    description: strOrUndef(fd, "description") ?? "",
    type: str(fd, "type") || "tournament",
    startAt: new Date(str(fd, "startAt")).toISOString(),
    endAt: new Date(str(fd, "endAt")).toISOString(),
    registrationDeadline: new Date(str(fd, "registrationDeadline")).toISOString(),
    quota: strOrUndef(fd, "quota") ? num(fd, "quota") : null,
    entryFeeAmount: num(fd, "entryFeeAmount"),
    entryFeePoints: num(fd, "entryFeePoints"),
    prizePool: strOrUndef(fd, "prizePool") || null,
    rewardPoints: rewardRaw ? JSON.parse(rewardRaw) : null,
    rules: strOrUndef(fd, "rules") || null,
  };
  if (id) await apiPatch(`/admin/events/${id}`, body);
  else await apiPost("/admin/events", body);
  revalidatePath("/event");
}

export async function publishEvent(fd: FormData) {
  await requireRole("OPERATOR");
  await apiPost(`/admin/events/${str(fd, "id")}/publish`);
  revalidatePath("/event");
}

export async function generateBracket(fd: FormData): Promise<ActionResult> {
  await requireRole("OPERATOR");
  try {
    const id = str(fd, "id");
    await apiPost(`/admin/events/${id}/bracket/generate`);
    revalidatePath(`/event/${id}/bracket`);
    return {};
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }
}

export async function resetBracket(fd: FormData): Promise<ActionResult> {
  await requireRole("ADMIN");
  try {
    const id = str(fd, "id");
    await apiPost(`/admin/events/${id}/bracket/reset`);
    revalidatePath(`/event/${id}/bracket`);
    return {};
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }
}

export async function setMatchResult(fd: FormData): Promise<ActionResult> {
  await requireRole("OPERATOR");
  try {
    const eventId = str(fd, "eventId");
    await apiPatch(`/admin/events/${eventId}/matches/${str(fd, "matchId")}`, {
      winnerRegistrationId: str(fd, "winnerRegistrationId"),
      scoreA: strOrUndef(fd, "scoreA") ? num(fd, "scoreA") : undefined,
      scoreB: strOrUndef(fd, "scoreB") ? num(fd, "scoreB") : undefined,
    });
    revalidatePath(`/event/${eventId}/bracket`);
    return {};
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }
}

export async function checkInParticipant(fd: FormData) {
  await requireRole("OPERATOR");
  const eventId = str(fd, "eventId");
  await apiPost(`/admin/events/${eventId}/registrations/${str(fd, "regId")}/check-in`);
  revalidatePath(`/event/${eventId}/bracket`);
}
