import type { TvDevice, TvPackage } from "@/lib/types";

// Thin wrapper untuk API Go RDMS (../consolix-tv/backend) — timer rental TV,
// MQTT, heartbeat. API ini TIDAK punya auth sendiri: di produksi wajib bind ke
// localhost/jaringan privat, dan setiap pemanggilan dari dashboard harus lewat
// RSC/Server Action yang sudah dijaga requireRole. Jangan panggil dari kode
// client — browser hanya menyentuh WebSocket-nya (NEXT_PUBLIC_RDMS_WS_URL).

const BASE_URL = process.env.RDMS_API_URL ?? "http://localhost:8080";

export class RdmsError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "RdmsError";
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/api/v1${path}`, {
      method,
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
  } catch {
    throw new RdmsError("Server RDMS tidak dapat dihubungi.", 503);
  }

  if (!res.ok) {
    let message = `Request gagal (${res.status})`;
    try {
      const json = (await res.json()) as { error?: string };
      if (json.error) message = json.error;
    } catch {
      // body bukan JSON — pakai pesan default
    }
    throw new RdmsError(message, res.status);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const rdmsGet = <T>(path: string) => request<T>("GET", path);
export const rdmsPost = <T>(path: string, body?: unknown) => request<T>("POST", path, body);
export const rdmsPut = <T>(path: string, body?: unknown) => request<T>("PUT", path, body);
export const rdmsDelete = <T>(path: string) => request<T>("DELETE", path);

// Snapshot untuk initial render RSC — kembalikan [] bila server RDMS mati agar
// halaman tetap tampil; indikator koneksi ditangani hook WebSocket di client.

export async function getTvDevices(): Promise<TvDevice[]> {
  try {
    return (await rdmsGet<TvDevice[] | null>("/devices")) ?? [];
  } catch {
    return [];
  }
}

export async function getTvPackages(): Promise<TvPackage[]> {
  try {
    return (await rdmsGet<TvPackage[] | null>("/packages")) ?? [];
  } catch {
    return [];
  }
}
