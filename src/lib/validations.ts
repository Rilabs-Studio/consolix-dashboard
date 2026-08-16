// Zod schemas — the single validation source shared by forms and Server
// Actions. Add a field here first, then to the form. Grows per phase.

import { z } from "zod";
import { ADMIN_ROLES } from "./constants";

/** Coerce a form string to a non-negative integer rupiah amount. */
export const rupiah = z.coerce.number().int().min(0);

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Format jam HH:mm");

export const adminAccountSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(8),
  role: z.enum(ADMIN_ROLES),
});
export type AdminAccountInput = z.infer<typeof adminAccountSchema>;

export const consoleTypeSchema = z.object({
  name: z.string().min(2),
  basePricePerHour: rupiah.min(1000),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

export const consoleUnitSchema = z.object({
  code: z.string().min(1).max(10),
  consoleTypeId: z.string().uuid(),
  roomType: z.enum(["regular", "vip"]),
  // String kosong = hapus nilai (kontrak PATCH /admin/console-units).
  displayLabel: z.string().max(64),
  rdmsDeviceId: z.string().max(64),
  // Select "true"/"false" di form edit; absen saat create.
  isActive: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
  notes: z.string().optional(),
});

export const gameSchema = z.object({
  title: z.string().min(2),
  platform: z.array(z.string()).min(1),
  genre: z.array(z.string()),
  coverUrl: z.string().optional(),
  description: z.string().optional(),
  minPlayers: z.coerce.number().int().min(1).default(1),
  maxPlayers: z.coerce.number().int().min(1).default(1),
});

export const priceRuleSchema = z
  .object({
    consoleTypeId: z.string().uuid().optional(),
    dayType: z.enum(["weekday", "weekend", "holiday"]),
    startTime: hhmm,
    endTime: hhmm,
    pricePerHour: rupiah.min(1000),
    label: z.string().min(2),
    priority: z.coerce.number().int().default(0),
  })
  .refine((v) => v.startTime !== v.endTime, {
    message: "Jam mulai dan selesai tidak boleh sama",
  });

export const holidaySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal YYYY-MM-DD"),
  name: z.string().min(2),
  type: z.enum(["closed", "special_hours", "special_price"]),
  openTime: hhmm.optional(),
  closeTime: hhmm.optional(),
  priceMultiplier: z.coerce.number().min(0.1).optional(),
});

export const dayScheduleSchema = z.object({
  dayOfWeek: z.coerce.number().int().min(0).max(6),
  openTime: hhmm,
  closeTime: hhmm,
  isClosed: z.boolean().default(false),
  is24Hours: z.boolean().default(false),
});
export const operatingHoursSchema = z.object({
  days: z.array(dayScheduleSchema).length(7),
});

export const expenseSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal YYYY-MM-DD"),
  expenseCategoryId: z.string().uuid(),
  description: z.string().min(3, "Deskripsi minimal 3 karakter"),
  amount: rupiah.min(100),
  paymentMethod: z.enum(["cash", "transfer"]),
  proofUrl: z.string().optional(),
});

// ---- Input manual kasir ----

/**
 * Pesanan FnB yang diketik kasir di counter. Dua mode saling eksklusif:
 * `bookingId` terisi = tempel ke sesi berjalan (dibayar saat checkout sesi),
 * kosong = jual lepas dan `paymentMethod` yang menentukan. `wallet` sengaja
 * tidak ada — saldo hanya bisa didebit pemiliknya lewat app.
 */
export const fnbOrderSchema = z.object({
  items: z
    .array(z.object({ itemId: z.string().uuid(), qty: z.coerce.number().int().min(1) }))
    .min(1, "Keranjang masih kosong"),
  bookingId: z.string().uuid().optional(),
  paymentMethod: z.enum(["cash", "qris_manual"]),
  customerName: z.string().min(2, "Nama minimal 2 karakter").max(64).optional(),
  customerPhone: z.string().max(20).optional(),
  notes: z.string().max(200).optional(),
});

/**
 * Sesi yang sudah selesai tapi gagal tercatat. Backend menolak sesi yang belum
 * berakhir (`BACKFILL_NOT_PAST`) dan yang lebih mundur dari 7 hari
 * (`BACKFILL_TOO_OLD`) — di sini hanya bentuk inputnya yang divalidasi.
 */
export const backfillSessionSchema = z.object({
  consoleUnitId: z.string().uuid({ message: "Pilih konsol terlebih dulu" }),
  startAt: z.string().min(1, "Jam mulai wajib diisi"),
  // Selaras dengan MIN/MAX_BOOKING_MINUTES backend — 30 menit ditolak di sana.
  durationMinutes: z.coerce
    .number()
    .int()
    .min(60, "Durasi minimal 60 menit")
    .max(480, "Durasi maksimal 480 menit"),
  paymentMethod: z.enum(["cash", "qris_manual"]),
  amount: rupiah.optional(),
  customerName: z.string().max(64).optional(),
  userPhone: z.string().max(20).optional(),
  reason: z.string().min(5, "Alasan minimal 5 karakter"),
});

// ---- Sesi kasir: jeda/simpan/batal + tabungan waktu ----

/**
 * Nomor HP Indonesia — terima gaya lokal (08…) maupun ternormalisasi (+62…,
 * bentuk yang dikembalikan bill/booking backend); backend yang menormalkan.
 */
const phone = z
  .string()
  .regex(/^(08\d{7,13}|\+?628\d{7,12})$/, "Nomor HP tidak valid (08… atau +628…)");

export const sessionIdSchema = z.object({ id: z.string().uuid() });

/**
 * Walk-in biasa atau redeem tabungan waktu. Memakai tabungan mensyaratkan
 * nomor HP (kunci saldonya) dan boleh sependek 15 menit — sesi berbayar tetap
 * minimal 60 menit seperti MIN_BOOKING_MINUTES backend.
 */
export const walkInSchema = z
  .object({
    consoleUnitId: z.string().uuid({ message: "Pilih konsol terlebih dulu" }),
    durationMinutes: z.coerce.number().int().max(480, "Durasi maksimal 480 menit"),
    customerName: z.string().max(64).optional(),
    userPhone: z.string().max(20).optional(),
    useTimeBank: z.boolean().default(false),
  })
  .superRefine((v, ctx) => {
    if (v.useTimeBank && !v.userPhone) {
      ctx.addIssue({
        code: "custom",
        path: ["userPhone"],
        message: "Nomor HP wajib diisi saat memakai tabungan waktu",
      });
    }
    const min = v.useTimeBank ? 15 : 60;
    if (v.durationMinutes < min) {
      ctx.addIssue({
        code: "custom",
        path: ["durationMinutes"],
        message: `Durasi minimal ${min} menit`,
      });
    }
  });

/** Simpan sisa menit sebagai tabungan waktu, lalu tagih sesi yang berjalan. */
export const saveSessionSchema = z.object({
  id: z.string().uuid(),
  customerPhone: phone,
  paymentMethod: z.enum(["cash", "qris_manual"]),
});

/**
 * Batalkan sesi tanpa menagih sewa. FnB yang telanjur disajikan tetap harus
 * dibayar — metode bayarnya wajib hanya bila ada tagihan FnB (UI yang menjaga).
 */
export const cancelSessionSchema = z.object({
  id: z.string().uuid(),
  reason: z.string().min(5, "Alasan minimal 5 karakter").max(200),
  fnbPaymentMethod: z.enum(["cash", "qris_manual"]).optional(),
});

export const cashTopupSchema = z.object({
  userId: z.string().uuid({ message: "Pilih member terlebih dulu" }),
  amount: z.coerce
    .number()
    .int()
    .min(10_000, "Nominal minimal Rp10.000")
    .max(5_000_000, "Nominal maksimal Rp5.000.000"),
});

export const broadcastSchema = z.object({
  title: z.string().min(3, "Judul minimal 3 karakter"),
  body: z.string().min(5, "Isi minimal 5 karakter"),
  deepLink: z.string().optional(),
  audienceType: z.enum(["all", "tier", "specific"]),
});

// ---- RDMS: rental TV (backend Go) ----

export const tvDeviceSchema = z.object({
  id: z.string().min(1, "ID perangkat wajib diisi").max(32),
  name: z.string().min(1, "Nama meja wajib diisi").max(64),
});

export const tvBroadcastSchema = z.object({
  message: z.string().min(1, "Pesan tidak boleh kosong").max(200),
  deviceId: z.string().optional(),
  durationSeconds: z.coerce.number().int().min(3).max(600).default(10),
});

export const tvVolumeSchema = z.object({
  volume: z.coerce.number().int().min(0).max(100),
});

// Kiosk: durationSeconds hanya dipakai saat membuka kunci — 0 berarti terbuka
// sampai dikunci lagi. Dibatasi 1 jam supaya meja tidak tertinggal terbuka
// semalaman karena salah pilih durasi.
export const tvKioskSchema = z.object({
  durationSeconds: z.coerce.number().int().min(0).max(3600).default(0),
});
