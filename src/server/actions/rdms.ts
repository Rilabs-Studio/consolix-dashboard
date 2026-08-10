"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { RdmsError, rdmsDelete, rdmsPost, rdmsPut } from "@/lib/rdms";
import { requireRole } from "@/lib/session";
import { bool, str, strOrUndef } from "@/lib/form";
import {
  tvBroadcastSchema,
  tvDeviceSchema,
  tvKioskSchema,
  tvVolumeSchema,
} from "@/lib/validations";
import type { ActionResult } from "./pos";

// Hanya kontrol fisik TV yang tinggal di sini. Siklus hidup sesi (mulai /
// perpanjang / hentikan) sepenuhnya milik NestJS lewat `pos.ts`: booking yang
// memegang jam, tagihan, dan laporan, sementara listener RDMS di backend yang
// menyalakan & mematikan TV. Memanggil /sessions RDMS dari sini akan membuat
// papan Kasir dan TV berbeda waktu — dan sesinya tidak tertagih.
//
// Pola ActionResult seperti pos.ts: error dikembalikan, bukan dilempar.
async function run(action: () => Promise<unknown>): Promise<ActionResult> {
  try {
    await action();
    revalidatePath("/kasir");
    revalidatePath("/perangkat");
    return {};
  } catch (e) {
    if (e instanceof RdmsError) return { error: e.message };
    if (e instanceof z.ZodError) return { error: e.issues[0]?.message ?? "Data tidak valid" };
    throw e;
  }
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

// ---- Kiosk ----
//
// TV terkunci pada app rental selama meja idle agar penyewa tidak bisa keluar
// lewat remote; kunci dilepas sendiri oleh TV selama sesi berjalan supaya
// perpindahan ke input HDMI tidak diblokir. Status kiosk disimpan di TV, bukan
// di server RDMS — jadi tidak ada state yang perlu dibaca balik ke sini.

/** Mengunci kembali bersifat memulihkan proteksi → cukup CASHIER. */
export async function lockTvKiosk(fd: FormData): Promise<ActionResult> {
  await requireRole("CASHIER");
  return run(() => rdmsPost(`/devices/${str(fd, "id")}/kiosk`, { locked: true }));
}

/**
 * Membuka kunci melemahkan proteksi meja (TV bisa dipakai bebas), jadi digating
 * di OPERATOR — sejajar dengan master data perangkat, bukan operasi kasir
 * harian. Kasir yang butuh akses fisik saat maintenance memakai kombinasi
 * tombol di remote (lihat consolix-tv/docs/deployment.md).
 */
export async function unlockTvKiosk(fd: FormData): Promise<ActionResult> {
  await requireRole("OPERATOR");
  return run(() => {
    const v = tvKioskSchema.parse({ durationSeconds: str(fd, "durationSeconds") || 0 });
    return rdmsPost(`/devices/${str(fd, "id")}/kiosk`, {
      locked: false,
      duration_seconds: v.durationSeconds,
    });
  });
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
