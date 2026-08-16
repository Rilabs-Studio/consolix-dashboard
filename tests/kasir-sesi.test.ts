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
  return { ApiError, apiGet: vi.fn(async () => ({})), apiPost: vi.fn(async () => ({})) };
});

import { apiGet, apiPost, ApiError } from "@/lib/api-client";
import {
  cancelSessionSchema,
  saveSessionSchema,
  sessionIdSchema,
  walkInSchema,
} from "@/lib/validations";
import {
  cancelSession,
  getTimeBankBalance,
  pauseSession,
  resumeSession,
  saveAndEndSession,
  startWalkIn,
} from "@/server/actions/pos";

const UNIT_ID = "33333333-3333-4333-8333-333333333333";
const SESSION_ID = "44444444-4444-4444-8444-444444444444";
const PHONE = "081234567890";

function fd(entries: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) f.set(k, v);
  return f;
}

beforeEach(() => {
  mockRole.value = "CASHIER";
  vi.mocked(apiPost).mockClear();
  vi.mocked(apiPost).mockResolvedValue({});
  vi.mocked(apiGet).mockClear();
  vi.mocked(apiGet).mockResolvedValue({});
});

describe("walkInSchema", () => {
  const base = { consoleUnitId: UNIT_ID, durationMinutes: 60 };

  it("menerima redeem tabungan waktu dengan nomor HP", () => {
    const parsed = walkInSchema.safeParse({
      ...base,
      durationMinutes: 45,
      userPhone: PHONE,
      useTimeBank: true,
    });
    expect(parsed.success).toBe(true);
  });

  it("menolak pakai tabungan tanpa nomor HP — saldonya di-key per nomor", () => {
    const parsed = walkInSchema.safeParse({ ...base, useTimeBank: true });
    expect(parsed.success).toBe(false);
  });

  it("menolak 30 menit tanpa tabungan — sesi berbayar minimal 60 menit", () => {
    const parsed = walkInSchema.safeParse({ ...base, durationMinutes: 30 });
    expect(parsed.success).toBe(false);
  });

  it("menerima 15 menit saat memakai tabungan waktu", () => {
    const parsed = walkInSchema.safeParse({
      ...base,
      durationMinutes: 15,
      userPhone: PHONE,
      useTimeBank: true,
    });
    expect(parsed.success).toBe(true);
  });

  it("menolak durasi di atas 480 menit apa pun modenya", () => {
    const parsed = walkInSchema.safeParse({
      ...base,
      durationMinutes: 540,
      userPhone: PHONE,
      useTimeBank: true,
    });
    expect(parsed.success).toBe(false);
  });
});

describe("saveSessionSchema", () => {
  const valid = { id: SESSION_ID, customerPhone: PHONE, paymentMethod: "cash" };

  it("menerima input lengkap", () => {
    expect(saveSessionSchema.safeParse(valid).success).toBe(true);
  });

  it("menolak nomor HP yang bukan format 08…", () => {
    expect(saveSessionSchema.safeParse({ ...valid, customerPhone: "abc" }).success).toBe(false);
  });

  it("menolak metode wallet — saldo hanya bisa didebit pemiliknya lewat app", () => {
    expect(saveSessionSchema.safeParse({ ...valid, paymentMethod: "wallet" }).success).toBe(false);
  });
});

describe("cancelSessionSchema", () => {
  const valid = { id: SESSION_ID, reason: "Konsol rusak total" };

  it("menerima alasan tanpa metode FnB — tidak semua sesi punya pesanan", () => {
    expect(cancelSessionSchema.safeParse(valid).success).toBe(true);
  });

  it("menolak alasan terlalu pendek — jejak pembatalan harus berarti", () => {
    expect(cancelSessionSchema.safeParse({ ...valid, reason: "ok" }).success).toBe(false);
  });

  it("menerima metode bayar FnB yang valid", () => {
    const parsed = cancelSessionSchema.safeParse({ ...valid, fnbPaymentMethod: "qris_manual" });
    expect(parsed.success).toBe(true);
  });
});

describe("sessionIdSchema", () => {
  it("menerima UUID dan menolak id sembarang", () => {
    expect(sessionIdSchema.safeParse({ id: SESSION_ID }).success).toBe(true);
    expect(sessionIdSchema.safeParse({ id: "bukan-uuid" }).success).toBe(false);
  });
});

describe("pauseSession / resumeSession", () => {
  it("menembak endpoint pause tanpa body", async () => {
    const result = await pauseSession(fd({ id: SESSION_ID }));

    expect(result.error).toBeUndefined();
    expect(apiPost).toHaveBeenCalledWith(`/admin/sessions/${SESSION_ID}/pause`);
  });

  it("menembak endpoint resume tanpa body", async () => {
    await resumeSession(fd({ id: SESSION_ID }));

    expect(apiPost).toHaveBeenCalledWith(`/admin/sessions/${SESSION_ID}/resume`);
  });

  it("menolak role di bawah CASHIER tanpa memanggil API", async () => {
    mockRole.value = "GUEST";

    await expect(pauseSession(fd({ id: SESSION_ID }))).rejects.toThrow("FORBIDDEN");
    expect(apiPost).not.toHaveBeenCalled();
  });
});

describe("saveAndEndSession", () => {
  const form = { id: SESSION_ID, customerPhone: PHONE, paymentMethod: "qris_manual" };

  it("mengirim phone + paymentMethod, id hanya di URL", async () => {
    const result = await saveAndEndSession(fd(form));

    expect(result.error).toBeUndefined();
    expect(apiPost).toHaveBeenCalledWith(`/admin/sessions/${SESSION_ID}/save`, {
      phone: PHONE,
      paymentMethod: "qris_manual",
    });
    const body = vi.mocked(apiPost).mock.calls[0][1] as Record<string, unknown>;
    expect(body.id).toBeUndefined();
  });

  it("meneruskan pesan ApiError (mis. shift belum dibuka)", async () => {
    vi.mocked(apiPost).mockRejectedValue(new ApiError("Shift belum dibuka", 422, "NO_OPEN_SHIFT"));

    const result = await saveAndEndSession(fd(form));

    expect(result.error).toBe("Shift belum dibuka");
  });

  it("menolak role di bawah CASHIER tanpa memanggil API", async () => {
    mockRole.value = "GUEST";

    await expect(saveAndEndSession(fd(form))).rejects.toThrow("FORBIDDEN");
    expect(apiPost).not.toHaveBeenCalled();
  });
});

describe("cancelSession", () => {
  const form = { id: SESSION_ID, reason: "Stik bermasalah, pelanggan pindah" };

  it("mengirim alasan saja bila tidak ada tagihan FnB", async () => {
    const result = await cancelSession(fd(form));

    expect(result.error).toBeUndefined();
    expect(apiPost).toHaveBeenCalledWith(`/admin/sessions/${SESSION_ID}/cancel`, {
      reason: form.reason,
    });
  });

  it("menyertakan fnbPaymentMethod bila FnB harus dibayar", async () => {
    await cancelSession(fd({ ...form, fnbPaymentMethod: "cash" }));

    expect(apiPost).toHaveBeenCalledWith(`/admin/sessions/${SESSION_ID}/cancel`, {
      reason: form.reason,
      fnbPaymentMethod: "cash",
    });
  });

  it("meneruskan pesan ApiError", async () => {
    vi.mocked(apiPost).mockRejectedValue(new ApiError("Sesi sudah selesai", 422, "NOT_ACTIVE"));

    const result = await cancelSession(fd(form));

    expect(result.error).toBe("Sesi sudah selesai");
  });

  it("menolak role di bawah CASHIER tanpa memanggil API", async () => {
    mockRole.value = "GUEST";

    await expect(cancelSession(fd(form))).rejects.toThrow("FORBIDDEN");
    expect(apiPost).not.toHaveBeenCalled();
  });
});

describe("startWalkIn (redeem tabungan waktu)", () => {
  it("useTimeBank → endpoint redeem dengan phone, bukan walk-in", async () => {
    await startWalkIn(
      fd({
        consoleUnitId: UNIT_ID,
        durationMinutes: "30",
        userPhone: PHONE,
        useTimeBank: "true",
        customerName: "Budi",
      })
    );

    expect(apiPost).toHaveBeenCalledWith("/admin/sessions/redeem", {
      consoleUnitId: UNIT_ID,
      phone: PHONE,
      durationMinutes: 30,
      customerName: "Budi",
    });
  });

  it("tanpa useTimeBank → endpoint walk-in lama", async () => {
    await startWalkIn(fd({ consoleUnitId: UNIT_ID, durationMinutes: "60" }));

    expect(apiPost).toHaveBeenCalledWith(
      "/admin/sessions/walk-in",
      expect.objectContaining({ consoleUnitId: UNIT_ID, durationMinutes: 60 })
    );
  });
});

describe("getTimeBankBalance", () => {
  it("mengambil saldo lewat query phone", async () => {
    vi.mocked(apiGet).mockResolvedValue({
      account: { phone: PHONE, userId: null, balanceMinutes: 45 },
      entries: [],
    });

    const result = await getTimeBankBalance(PHONE);

    expect(apiGet).toHaveBeenCalledWith("/admin/time-bank", { phone: PHONE });
    expect(result?.account.balanceMinutes).toBe(45);
  });

  it("404 = belum punya tabungan → null, bukan error", async () => {
    vi.mocked(apiGet).mockRejectedValue(new ApiError("Not found", 404, "NOT_FOUND"));

    await expect(getTimeBankBalance(PHONE)).resolves.toBeNull();
  });

  it("menolak role di bawah CASHIER tanpa memanggil API", async () => {
    mockRole.value = "GUEST";

    await expect(getTimeBankBalance(PHONE)).rejects.toThrow("FORBIDDEN");
    expect(apiGet).not.toHaveBeenCalled();
  });
});
