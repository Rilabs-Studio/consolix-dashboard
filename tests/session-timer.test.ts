import { describe, it, expect } from "vitest";
import { sessionTone } from "@/components/session/session-timer";

// Titik acuan tetap supaya kasusnya deterministik.
const NOW = new Date("2026-08-16T12:00:00Z").getTime();
const iso = (offsetMinutes: number) => new Date(NOW + offsetMinutes * 60_000).toISOString();

describe("sessionTone", () => {
  it("idle sebelum jam klien siap (now null) — aman untuk hidrasi SSR", () => {
    expect(sessionTone(iso(60), null)).toBe("idle");
  });

  it("running saat sisa waktu masih di atas ambang peringatan", () => {
    expect(sessionTone(iso(60), NOW)).toBe("running");
  });

  it("warning saat sisa ≤ 10 menit", () => {
    expect(sessionTone(iso(10), NOW)).toBe("warning");
    expect(sessionTone(iso(1), NOW)).toBe("warning");
  });

  it("expired saat waktunya habis — termasuk tepat di endAt", () => {
    expect(sessionTone(iso(0), NOW)).toBe("expired");
    expect(sessionTone(iso(-30), NOW)).toBe("expired");
  });

  it("paused menang atas semua kondisi waktu — sisa waktunya beku", () => {
    expect(sessionTone(iso(60), NOW, iso(-5))).toBe("paused");
    // Bahkan bila endAt sudah lewat: jeda membekukan sisa, bukan menghabiskannya.
    expect(sessionTone(iso(-30), NOW, iso(-60))).toBe("paused");
  });

  it("paused deterministik dari data — berlaku juga sebelum jam klien siap", () => {
    expect(sessionTone(iso(60), null, iso(-5))).toBe("paused");
  });

  it("pausedAt null/undefined tidak mengubah perilaku lama", () => {
    expect(sessionTone(iso(60), NOW, null)).toBe("running");
    expect(sessionTone(iso(60), NOW, undefined)).toBe("running");
  });
});
