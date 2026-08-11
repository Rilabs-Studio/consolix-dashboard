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
  return { ApiError, apiGet: vi.fn(async () => []), apiPost: vi.fn(async () => ({})) };
});

import { apiPost, ApiError } from "@/lib/api-client";
import { backfillSessionSchema, fnbOrderSchema } from "@/lib/validations";
import { createFnbOrder } from "@/server/actions/fnb";
import { backfillSession } from "@/server/actions/pos";

const ITEM_ID = "11111111-1111-4111-8111-111111111111";
const BOOKING_ID = "22222222-2222-4222-8222-222222222222";
const UNIT_ID = "33333333-3333-4333-8333-333333333333";

function fd(entries: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) f.set(k, v);
  return f;
}

const cart = JSON.stringify([{ itemId: ITEM_ID, qty: 2 }]);

beforeEach(() => {
  mockRole.value = "OPERATOR";
  vi.mocked(apiPost).mockClear();
  vi.mocked(apiPost).mockResolvedValue({});
});

describe("fnbOrderSchema", () => {
  it("menerima jual lepas dengan qris_manual", () => {
    const parsed = fnbOrderSchema.safeParse({
      items: [{ itemId: ITEM_ID, qty: 1 }],
      paymentMethod: "qris_manual",
    });
    expect(parsed.success).toBe(true);
  });

  it("menolak keranjang kosong", () => {
    const parsed = fnbOrderSchema.safeParse({ items: [], paymentMethod: "cash" });
    expect(parsed.success).toBe(false);
  });

  it("menolak wallet — saldo hanya bisa didebit pemiliknya lewat app", () => {
    const parsed = fnbOrderSchema.safeParse({
      items: [{ itemId: ITEM_ID, qty: 1 }],
      paymentMethod: "wallet",
    });
    expect(parsed.success).toBe(false);
  });

  it("menolak qty nol", () => {
    const parsed = fnbOrderSchema.safeParse({
      items: [{ itemId: ITEM_ID, qty: 0 }],
      paymentMethod: "cash",
    });
    expect(parsed.success).toBe(false);
  });
});

describe("createFnbOrder", () => {
  it("jual lepas: kirim items + paymentMethod, tanpa bookingId", async () => {
    const result = await createFnbOrder(
      fd({ items: cart, paymentMethod: "qris_manual", customerName: "Budi" })
    );

    expect(result.error).toBeUndefined();
    expect(apiPost).toHaveBeenCalledWith("/admin/fnb/orders", {
      items: [{ itemId: ITEM_ID, qty: 2 }],
      paymentMethod: "qris_manual",
      customerName: "Budi",
    });
  });

  it("tempel ke sesi: bookingId ikut terkirim", async () => {
    await createFnbOrder(fd({ items: cart, paymentMethod: "cash", bookingId: BOOKING_ID }));

    expect(apiPost).toHaveBeenCalledWith(
      "/admin/fnb/orders",
      expect.objectContaining({ bookingId: BOOKING_ID })
    );
  });

  it("keranjang yang bukan JSON tidak melempar, tapi jadi pesan error", async () => {
    const result = await createFnbOrder(fd({ items: "bukan-json", paymentMethod: "cash" }));

    expect(result.error).toBeTruthy();
    expect(apiPost).not.toHaveBeenCalled();
  });

  it("meneruskan pesan ApiError (mis. shift belum dibuka)", async () => {
    vi.mocked(apiPost).mockRejectedValue(new ApiError("Shift belum dibuka", 422, "NO_OPEN_SHIFT"));

    const result = await createFnbOrder(fd({ items: cart, paymentMethod: "cash" }));

    expect(result.error).toBe("Shift belum dibuka");
  });

  it("menolak role di bawah CASHIER", async () => {
    mockRole.value = "GUEST";

    await expect(createFnbOrder(fd({ items: cart, paymentMethod: "cash" }))).rejects.toThrow(
      "FORBIDDEN"
    );
  });
});

describe("backfillSessionSchema", () => {
  const valid = {
    consoleUnitId: UNIT_ID,
    startAt: "2026-08-10T13:00",
    durationMinutes: 60,
    paymentMethod: "cash",
    reason: "Listrik padam",
  };

  it("menerima input lengkap", () => {
    expect(backfillSessionSchema.safeParse(valid).success).toBe(true);
  });

  it("menolak alasan yang terlalu pendek — jejak koreksi harus berarti", () => {
    expect(backfillSessionSchema.safeParse({ ...valid, reason: "lupa" }).success).toBe(false);
  });

  it("menolak konsol kosong", () => {
    expect(backfillSessionSchema.safeParse({ ...valid, consoleUnitId: "" }).success).toBe(false);
  });
});

describe("backfillSession", () => {
  const form = {
    consoleUnitId: UNIT_ID,
    startAt: "2026-08-10T13:00",
    durationMinutes: "60",
    paymentMethod: "cash",
    reason: "Listrik padam, sesi tidak tercatat",
  };

  it("mengubah datetime-local jadi ISO UTC sebelum dikirim", async () => {
    await backfillSession(fd(form));

    expect(apiPost).toHaveBeenCalledWith(
      "/admin/sessions/backfill",
      expect.objectContaining({
        consoleUnitId: UNIT_ID,
        durationMinutes: 60,
        paymentMethod: "cash",
        startAt: new Date("2026-08-10T13:00").toISOString(),
      })
    );
  });

  it("nominal kosong tidak dikirim — backend yang menghitung tarif", async () => {
    await backfillSession(fd(form));

    const body = vi.mocked(apiPost).mock.calls[0][1] as Record<string, unknown>;
    expect(body.amount).toBeUndefined();
  });

  it("meneruskan pesan ApiError (mis. sesi belum selesai)", async () => {
    vi.mocked(apiPost).mockRejectedValue(
      new ApiError("Backfilled session must already be over", 422, "BACKFILL_NOT_PAST")
    );

    const result = await backfillSession(fd(form));

    expect(result.error).toBe("Backfilled session must already be over");
  });

  it("menolak kasir — backdating hanya untuk operator+", async () => {
    mockRole.value = "CASHIER";

    await expect(backfillSession(fd(form))).rejects.toThrow("FORBIDDEN");
    expect(apiPost).not.toHaveBeenCalled();
  });
});
