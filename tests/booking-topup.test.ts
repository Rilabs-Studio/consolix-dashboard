import { describe, it, expect, vi, beforeEach } from "vitest";

// Sesi & api-client di-mock (unit test tanpa server) — sesuai pola testing repo.
const mockRole = vi.hoisted(() => ({ value: "CASHIER" }));

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => ({ user: { id: "u1", role: mockRole.value } })),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/api-client", () => {
  class ApiError extends Error {
    constructor(
      message: string,
      readonly status: number,
      readonly errorCode?: string,
    ) {
      super(message);
      this.name = "ApiError";
    }
  }
  return {
    ApiError,
    apiGet: vi.fn(async () => []),
    apiPost: vi.fn(async () => ({})),
    apiPatch: vi.fn(async () => ({})),
  };
});

import { apiGet, apiPost, ApiError } from "@/lib/api-client";
import { buildMonthGrid, currentJakartaMonth, jakartaTodayString } from "@/lib/calendar";
import { cashTopupSchema, consoleUnitSchema } from "@/lib/validations";
import { searchUsers } from "@/server/actions/users";
import { cashTopup } from "@/server/actions/topup";

function fd(entries: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) f.set(k, v);
  return f;
}

beforeEach(() => {
  mockRole.value = "CASHIER";
  vi.mocked(apiPost).mockClear();
  vi.mocked(apiGet).mockClear();
  vi.mocked(apiPost).mockResolvedValue({});
  vi.mocked(apiGet).mockResolvedValue([]);
});

describe("calendar — buildMonthGrid", () => {
  it("Agustus 2026: 5 sel kosong di depan (Sabtu, Monday-first) + 31 hari", () => {
    const grid = buildMonthGrid("2026-08");
    expect(grid.cells.slice(0, 5)).toEqual([null, null, null, null, null]);
    expect(grid.cells[5]).toBe("2026-08-01");
    expect(grid.cells.filter(Boolean)).toHaveLength(31);
    expect(grid.cells.length % 7).toBe(0);
    expect(grid.prevMonth).toBe("2026-07");
    expect(grid.nextMonth).toBe("2026-09");
    expect(grid.monthLabel).toMatch(/Agustus 2026/);
  });

  it("Februari kabisat 2024 punya 29 hari", () => {
    expect(buildMonthGrid("2024-02").cells.filter(Boolean)).toHaveLength(29);
    expect(buildMonthGrid("2023-02").cells.filter(Boolean)).toHaveLength(28);
  });

  it("rollover Desember/Januari", () => {
    expect(buildMonthGrid("2026-12").nextMonth).toBe("2027-01");
    expect(buildMonthGrid("2026-01").prevMonth).toBe("2025-12");
  });

  it("hari ini & bulan Jakarta berformat ISO", () => {
    expect(jakartaTodayString()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(currentJakartaMonth()).toMatch(/^\d{4}-\d{2}$/);
  });
});

describe("validations — cashTopupSchema", () => {
  const validUuid = "6f9619ff-8b86-4d01-b42d-00cf4fc964ff";

  it("menerima userId uuid + nominal wajar", () => {
    const parsed = cashTopupSchema.safeParse({ userId: validUuid, amount: "50000" });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.amount).toBe(50000);
  });

  it("menolak userId kosong / bukan uuid", () => {
    expect(cashTopupSchema.safeParse({ userId: "", amount: "50000" }).success).toBe(false);
    expect(cashTopupSchema.safeParse({ userId: "abc", amount: "50000" }).success).toBe(false);
  });

  it("menolak nominal di luar 10rb–5jt", () => {
    expect(cashTopupSchema.safeParse({ userId: validUuid, amount: "5000" }).success).toBe(false);
    expect(cashTopupSchema.safeParse({ userId: validUuid, amount: "6000000" }).success).toBe(false);
  });
});

describe("validations — consoleUnitSchema (label + RDMS)", () => {
  const base = {
    code: "A1",
    consoleTypeId: "6f9619ff-8b86-4d01-b42d-00cf4fc964ff",
    roomType: "regular",
  };

  it("string kosong valid (artinya hapus nilai)", () => {
    expect(consoleUnitSchema.safeParse({ ...base, displayLabel: "", rdmsDeviceId: "" }).success).toBe(true);
  });

  it("menerima label + device terisi", () => {
    expect(
      consoleUnitSchema.safeParse({ ...base, displayLabel: "TV 01", rdmsDeviceId: "TV-01" }).success
    ).toBe(true);
  });

  it("isActive: select 'true'/'false' di-transform ke boolean, absen = undefined", () => {
    const on = consoleUnitSchema.safeParse({ ...base, displayLabel: "", rdmsDeviceId: "", isActive: "false" });
    expect(on.success).toBe(true);
    if (on.success) expect(on.data.isActive).toBe(false);

    const absent = consoleUnitSchema.safeParse({ ...base, displayLabel: "", rdmsDeviceId: "" });
    expect(absent.success).toBe(true);
    if (absent.success) expect(absent.data.isActive).toBeUndefined();
  });
});

describe("actions — role gating & payload", () => {
  it("searchUsers menolak sesi tanpa role", async () => {
    mockRole.value = "GUEST";
    await expect(searchUsers("budi")).rejects.toThrow("FORBIDDEN");
  });

  it("searchUsers: query <2 karakter tidak memanggil API", async () => {
    expect(await searchUsers("b")).toEqual([]);
    expect(apiGet).not.toHaveBeenCalled();
  });

  it("searchUsers memanggil /admin/users/lookup", async () => {
    await searchUsers("budi");
    expect(apiGet).toHaveBeenCalledWith("/admin/users/lookup", { search: "budi", limit: 10 });
  });

  it("cashTopup mengirim userId + amount ke /admin/topups/cash", async () => {
    const result = await cashTopup(
      fd({ userId: "6f9619ff-8b86-4d01-b42d-00cf4fc964ff", amount: "50000" })
    );
    expect(result.error).toBeUndefined();
    expect(apiPost).toHaveBeenCalledWith("/admin/topups/cash", {
      userId: "6f9619ff-8b86-4d01-b42d-00cf4fc964ff",
      amount: 50000,
    });
  });

  it("cashTopup tanpa member terpilih mengembalikan error inline", async () => {
    const result = await cashTopup(fd({ userId: "", amount: "50000" }));
    expect(result.error).toBe("Pilih member terlebih dulu");
    expect(apiPost).not.toHaveBeenCalled();
  });

  it("cashTopup meneruskan pesan ApiError (mis. shift belum dibuka)", async () => {
    vi.mocked(apiPost).mockRejectedValue(new ApiError("Open a shift first", 422, "NO_OPEN_SHIFT"));
    const result = await cashTopup(
      fd({ userId: "6f9619ff-8b86-4d01-b42d-00cf4fc964ff", amount: "50000" })
    );
    expect(result.error).toBe("Open a shift first");
  });
});
