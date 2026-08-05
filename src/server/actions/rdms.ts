"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { RdmsError, rdmsDelete, rdmsPost, rdmsPut } from "@/lib/rdms";
import { requireRole } from "@/lib/session";
import { bool, str, strOrUndef } from "@/lib/form";
import {
  tvBroadcastSchema,
  tvDeviceSchema,
  tvSessionExtendSchema,
  tvSessionStartSchema,
  tvVolumeSchema,
} from "@/lib/validations";
import type { ActionResult } from "./pos";

// Mutasi RDMS dipanggil dari dialog client-heavy (meja-tv / perangkat), jadi
// memakai pola ActionResult seperti pos.ts — error dikembalikan, bukan thrown.
// State board tetap di-refresh oleh tick WebSocket ≤1 detik setelah mutasi.
async function run(action: () => Promise<unknown>): Promise<ActionResult> {
  try {
    await action();
    revalidatePath("/meja-tv");
    revalidatePath("/perangkat");
    return {};
  } catch (e) {
    if (e instanceof RdmsError) return { error: e.message };
    if (e instanceof z.ZodError) return { error: e.issues[0]?.message ?? "Data tidak valid" };
    throw e;
  }
}

// ---- Sesi rental ----

export async function startTvSession(fd: FormData): Promise<ActionResult> {
  await requireRole("CASHIER");
  return run(() => {
    const v = tvSessionStartSchema.parse({
      deviceId: str(fd, "deviceId"),
      packageId: strOrUndef(fd, "packageId"),
      durationMinutes: strOrUndef(fd, "durationMinutes"),
    });
    return rdmsPost("/sessions", {
      device_id: v.deviceId,
      package_id: v.packageId,
      // Durasi hanya relevan tanpa paket — paket sudah membawa durasinya sendiri.
      duration_minutes: v.packageId !== undefined ? undefined : v.durationMinutes,
    });
  });
}

export async function extendTvSession(fd: FormData): Promise<ActionResult> {
  await requireRole("CASHIER");
  return run(() => {
    const v = tvSessionExtendSchema.parse({ durationMinutes: str(fd, "durationMinutes") });
    return rdmsPost(`/sessions/${str(fd, "id")}/extend`, { duration_minutes: v.durationMinutes });
  });
}

export async function stopTvSession(fd: FormData): Promise<ActionResult> {
  await requireRole("CASHIER");
  return run(() => rdmsPost(`/sessions/${str(fd, "id")}/stop`));
}

// ---- Broadcast & audio ----

export async function broadcastTv(fd: FormData): Promise<ActionResult> {
  await requireRole("CASHIER");
  return run(() => {
    const v = tvBroadcastSchema.parse({
      message: str(fd, "message").trim(),
      deviceId: strOrUndef(fd, "deviceId"),
      durationSeconds: str(fd, "durationSeconds") || 10,
    });
    return rdmsPost("/broadcast", {
      message: v.message,
      device_id: v.deviceId,
      duration_seconds: v.durationSeconds,
    });
  });
}

export async function setTvVolume(fd: FormData): Promise<ActionResult> {
  await requireRole("CASHIER");
  return run(() => {
    const v = tvVolumeSchema.parse({ volume: str(fd, "volume") });
    return rdmsPost(`/devices/${str(fd, "id")}/volume`, { volume: v.volume });
  });
}

export async function setTvMute(fd: FormData): Promise<ActionResult> {
  await requireRole("CASHIER");
  return run(() => rdmsPost(`/devices/${str(fd, "id")}/mute`, { muted: bool(fd, "muted") }));
}

// ---- Perangkat (master data) ----

export async function registerTvDevice(fd: FormData): Promise<ActionResult> {
  await requireRole("OPERATOR");
  return run(() => {
    const id = str(fd, "id").trim();
    const v = tvDeviceSchema.parse({ id, name: str(fd, "name").trim() || id });
    return rdmsPost("/devices", v);
  });
}

export async function renameTvDevice(fd: FormData): Promise<ActionResult> {
  await requireRole("OPERATOR");
  return run(() => {
    const v = tvDeviceSchema.parse({ id: str(fd, "id"), name: str(fd, "name").trim() });
    return rdmsPut(`/devices/${v.id}`, { name: v.name });
  });
}

export async function deleteTvDevice(fd: FormData): Promise<ActionResult> {
  await requireRole("ADMIN");
  return run(() => rdmsDelete(`/devices/${str(fd, "id")}`));
}
