import { describe, it, expect } from "vitest";
import { formatRupiah } from "@/lib/utils";
import {
  hasRole,
  toAdminRole,
  toApiRole,
  BOOKING_STATUSES,
  BOOKING_STATUS_LABEL,
} from "@/lib/constants";
import { NAV } from "@/components/layout/nav";

describe("utils — formatRupiah", () => {
  it("formats integers as IDR without decimals", () => {
    expect(formatRupiah(850000)).toMatch(/Rp.?850\.000/);
  });
  it("renders dash for null/undefined", () => {
    expect(formatRupiah(null)).toBe("-");
    expect(formatRupiah(undefined)).toBe("-");
  });
});

describe("constants — role hierarchy", () => {
  it("SUPER_ADMIN satisfies all tiers", () => {
    expect(hasRole("SUPER_ADMIN", "ADMIN")).toBe(true);
    expect(hasRole("SUPER_ADMIN", "OPERATOR")).toBe(true);
    expect(hasRole("SUPER_ADMIN", "CASHIER")).toBe(true);
  });
  it("higher tiers satisfy CASHIER", () => {
    expect(hasRole("OPERATOR", "CASHIER")).toBe(true);
    expect(hasRole("ADMIN", "CASHIER")).toBe(true);
  });
  it("CASHIER cannot act above its tier", () => {
    expect(hasRole("CASHIER", "OPERATOR")).toBe(false);
    expect(hasRole("CASHIER", "ADMIN")).toBe(false);
    expect(hasRole("CASHIER", "CASHIER")).toBe(true);
  });
  it("OPERATOR cannot act as ADMIN", () => {
    expect(hasRole("OPERATOR", "ADMIN")).toBe(false);
    expect(hasRole("OPERATOR", "OPERATOR")).toBe(true);
  });
  it("rejects missing/unknown roles", () => {
    expect(hasRole(undefined, "CASHIER")).toBe(false);
    expect(hasRole("GUEST", "CASHIER")).toBe(false);
  });
});

describe("constants — API role mapping", () => {
  it("maps lowercase API roles to uppercase dashboard roles", () => {
    expect(toAdminRole("super_admin")).toBe("SUPER_ADMIN");
    expect(toAdminRole("cashier")).toBe("CASHIER");
  });
  it("falls back to CASHIER (least privilege) for unknown roles", () => {
    expect(toAdminRole(undefined)).toBe("CASHIER");
    expect(toAdminRole("weird")).toBe("CASHIER");
  });
  it("round-trips to API values", () => {
    expect(toApiRole("SUPER_ADMIN")).toBe("super_admin");
    expect(toApiRole("CASHIER")).toBe("cashier");
  });
});

describe("constants — booking statuses (api-contract §5)", () => {
  it("every status has an Indonesian label", () => {
    for (const s of BOOKING_STATUSES) {
      expect(BOOKING_STATUS_LABEL[s]).toBeTruthy();
    }
  });
});

describe("nav — role gating", () => {
  const visibleFor = (role: string) => NAV.filter((n) => hasRole(role, n.minRole));

  it("cashiers only see operational entries", () => {
    const hrefs = visibleFor("CASHIER").map((n) => n.href);
    expect(hrefs).toContain("/kasir");
    expect(hrefs).toContain("/booking");
    expect(hrefs).toContain("/topup");
    expect(hrefs).not.toContain("/keuangan");
    expect(hrefs).not.toContain("/pengaturan/audit-log");
    expect(hrefs).not.toContain("/pengguna");
  });

  it("admins see finance and audit log", () => {
    const hrefs = visibleFor("ADMIN").map((n) => n.href);
    expect(hrefs).toContain("/keuangan");
    expect(hrefs).toContain("/pengaturan/audit-log");
  });
});
