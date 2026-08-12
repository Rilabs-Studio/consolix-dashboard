import { describe, it, expect } from "vitest";
import { NAV, getActiveHref } from "@/components/layout/nav";
import { ADMIN_ROLES, hasRole } from "@/lib/constants";

/**
 * `getActiveHref` diekstrak dari `sidebar.tsx` agar Sidebar (desktop) dan
 * MobileNav (drawer) menyorot entri yang sama persis. Kalau logikanya melenceng,
 * dua navigasi itu diam-diam jadi berbeda — jadi diuji di sini.
 */
describe("nav — getActiveHref", () => {
  it("memilih prefix terpanjang, bukan yang pertama cocok", () => {
    // /fnb dan /fnb/pesanan sama-sama cocok; yang menang harus yang spesifik.
    expect(getActiveHref("/fnb/pesanan")).toBe("/fnb/pesanan");
    expect(getActiveHref("/konsol/tipe")).toBe("/konsol/tipe");
  });

  it("mencocokkan rute anak yang tidak punya entri sendiri ke induknya", () => {
    expect(getActiveHref("/konsol/abc-123")).toBe("/konsol");
    expect(getActiveHref("/event/9/bracket")).toBe("/event");
  });

  it("root hanya aktif pada exact match", () => {
    expect(getActiveHref("/")).toBe("/");
    // Tanpa penanganan khusus, "/" jadi prefix semua rute dan selalu menyala.
    expect(getActiveHref("/kasir")).toBe("/kasir");
  });

  it("tidak salah cocok pada awalan segmen yang mirip", () => {
    // /konsolidasi bukan anak /konsol.
    expect(getActiveHref("/konsolidasi")).toBeNull();
  });

  it("mengembalikan null untuk rute di luar NAV", () => {
    expect(getActiveHref("/tidak-ada")).toBeNull();
  });

  it("hanya mempertimbangkan entri yang terlihat oleh role", () => {
    const kasirNav = NAV.filter((n) => hasRole("CASHIER", n.minRole));
    // /keuangan ber-minRole ADMIN — untuk kasir tidak boleh ada yang menyala.
    expect(getActiveHref("/keuangan", kasirNav)).toBeNull();
    expect(getActiveHref("/kasir", kasirNav)).toBe("/kasir");
  });
});

describe("nav — integritas data", () => {
  it("setiap entri punya minRole yang dikenal", () => {
    for (const item of NAV) {
      expect(ADMIN_ROLES).toContain(item.minRole);
    }
  });

  it("tidak ada href ganda", () => {
    const hrefs = NAV.map((n) => n.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });
});
