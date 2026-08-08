import { describe, it, expect, vi, beforeEach } from "vitest";

// Sesi & rdms client di-mock (unit test tanpa server) — sesuai pola testing repo.
const mockRole = vi.hoisted(() => ({ value: "CASHIER" }));

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => ({ user: { id: "u1", role: mockRole.value } })),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/rdms", () => {
  class RdmsError extends Error {
    constructor(
      message: string,
      readonly status: number,
    ) {
      super(message);
      this.name = "RdmsError";
    }
  }
  return {
    RdmsError,
    rdmsGet: vi.fn(async () => []),
    rdmsPost: vi.fn(async () => ({})),
    rdmsPut: vi.fn(async () => ({})),
    rdmsDelete: vi.fn(async () => undefined),
    getTvDevices: vi.fn(async () => []),
  };
});

import { RdmsError, rdmsPost } from "@/lib/rdms";
import * as rdmsActions from "@/server/actions/rdms";
import {
  broadcastTv,
  deleteTvDevice,
  registerTvDevice,
  setTvVolume,
} from "@/server/actions/rdms";
import { tvBroadcastSchema, tvDeviceSchema, tvVolumeSchema } from "@/lib/validations";

function fd(entries: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) f.set(k, v);
  return f;
}

beforeEach(() => {
  mockRole.value = "CASHIER";
  vi.mocked(rdmsPost).mockClear();
  vi.mocked(rdmsPost).mockResolvedValue({});
});

describe("validations — RDMS", () => {
  it("tvBroadcastSchema menolak pesan kosong dan mengisi default durasi", () => {
    expect(tvBroadcastSchema.safeParse({ message: "" }).success).toBe(false);
    const parsed = tvBroadcastSchema.parse({ message: "Tutup 30 menit lagi" });
    expect(parsed.durationSeconds).toBe(10);
  });
  it("tvDeviceSchema menolak id kosong", () => {
    expect(tvDeviceSchema.safeParse({ id: "", name: "Meja 1" }).success).toBe(false);
    expect(tvDeviceSchema.safeParse({ id: "TV-01", name: "Meja 1" }).success).toBe(true);
  });
  it("tvVolumeSchema membatasi 0–100", () => {
    expect(tvVolumeSchema.safeParse({ volume: "50" }).success).toBe(true);
    expect(tvVolumeSchema.safeParse({ volume: "101" }).success).toBe(false);
  });
});

describe("actions/rdms — hanya kontrol fisik TV", () => {
  // Siklus hidup sesi milik NestJS (pos.ts). Kalau action ini muncul lagi,
  // papan Kasir dan TV bisa beda waktu dan sesinya tidak tertagih.
  it("tidak lagi mengekspos mulai/perpanjang/hentikan sesi TV", () => {
    expect(rdmsActions).not.toHaveProperty("startTvSession");
    expect(rdmsActions).not.toHaveProperty("extendTvSession");
    expect(rdmsActions).not.toHaveProperty("stopTvSession");
  });

  it("broadcastTv tanpa deviceId menyiarkan ke semua TV", async () => {
    await broadcastTv(fd({ message: "Tutup sebentar lagi", durationSeconds: "30" }));
    expect(rdmsPost).toHaveBeenCalledWith("/broadcast", {
      message: "Tutup sebentar lagi",
      device_id: undefined,
      duration_seconds: 30,
    });
  });

  it("setTvVolume memakai snake_case ke device yang dituju", async () => {
    await setTvVolume(fd({ id: "TV-01", volume: "40" }));
    expect(rdmsPost).toHaveBeenCalledWith("/devices/TV-01/volume", { volume: 40 });
  });

  it("mengembalikan pesan validasi sebagai ActionResult.error, bukan throw", async () => {
    const result = await broadcastTv(fd({ message: "  " }));
    expect(result.error).toBe("Pesan tidak boleh kosong");
    expect(rdmsPost).not.toHaveBeenCalled();
  });

  it("mengembalikan pesan RdmsError apa adanya", async () => {
    vi.mocked(rdmsPost).mockRejectedValueOnce(new RdmsError("Server RDMS tidak dapat dihubungi.", 503));
    const result = await broadcastTv(fd({ message: "Halo", durationSeconds: "10" }));
    expect(result.error).toBe("Server RDMS tidak dapat dihubungi.");
  });
});

describe("actions/rdms — role gating", () => {
  it("CASHIER boleh menyiarkan pesan", async () => {
    const result = await broadcastTv(fd({ message: "Halo", durationSeconds: "10" }));
    expect(result.error).toBeUndefined();
  });
  it("CASHIER ditolak mendaftarkan perangkat (butuh OPERATOR)", async () => {
    await expect(registerTvDevice(fd({ id: "TV-09", name: "Meja 9" }))).rejects.toThrow("FORBIDDEN");
  });
  it("OPERATOR boleh mendaftarkan perangkat", async () => {
    mockRole.value = "OPERATOR";
    const result = await registerTvDevice(fd({ id: "TV-09", name: "Meja 9" }));
    expect(result.error).toBeUndefined();
  });
  it("OPERATOR ditolak menghapus perangkat (butuh ADMIN)", async () => {
    mockRole.value = "OPERATOR";
    await expect(deleteTvDevice(fd({ id: "TV-09" }))).rejects.toThrow("FORBIDDEN");
  });
  it("ADMIN boleh menghapus perangkat", async () => {
    mockRole.value = "ADMIN";
    const result = await deleteTvDevice(fd({ id: "TV-09" }));
    expect(result.error).toBeUndefined();
  });
});
