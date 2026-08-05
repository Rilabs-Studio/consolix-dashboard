// Enum-like value sets. Dashboard admin roles stay uppercase internally; all
// domain enums below mirror the NestJS API contract values exactly
// (../consolix-backend/docs/api-contract.md §5 is the source of truth).

// ── Admin roles (dashboard-internal, uppercase) ────────────────────────────
export const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN", "OPERATOR", "CASHIER"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

// NestJS issues/accepts lowercase roles (super_admin | admin | operator | cashier).
const ROLE_FROM_API: Record<string, AdminRole> = {
  super_admin: "SUPER_ADMIN",
  admin: "ADMIN",
  operator: "OPERATOR",
  cashier: "CASHIER",
};
const ROLE_TO_API: Record<AdminRole, string> = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  OPERATOR: "operator",
  CASHIER: "cashier",
};

export function toAdminRole(apiRole: string | undefined): AdminRole {
  return (apiRole && ROLE_FROM_API[apiRole]) || "CASHIER";
}
export function toApiRole(role: AdminRole): string {
  return ROLE_TO_API[role] ?? "cashier";
}

export const ADMIN_ROLE_LABEL: Record<AdminRole, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  OPERATOR: "Operator",
  CASHIER: "Kasir",
};

// ── Booking lifecycle — backend bookings.status ────────────────────────────
export const BOOKING_STATUSES = [
  "pending",
  "confirmed",
  "checked_in",
  "in_progress",
  "overtime",
  "completed",
  "cancelled",
  "no_show",
  "expired",
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = {
  pending: "Menunggu Pembayaran",
  confirmed: "Terkonfirmasi",
  checked_in: "Check-in",
  in_progress: "Berlangsung",
  overtime: "Overtime",
  completed: "Selesai",
  cancelled: "Dibatalkan",
  no_show: "Tidak Hadir",
  expired: "Kedaluwarsa",
};

// ── Console units ──────────────────────────────────────────────────────────
export const CONSOLE_UNIT_STATUSES = ["available", "in_use", "booked", "maintenance"] as const;
export type ConsoleUnitStatus = (typeof CONSOLE_UNIT_STATUSES)[number];

export const CONSOLE_UNIT_STATUS_LABEL: Record<ConsoleUnitStatus, string> = {
  available: "Tersedia",
  in_use: "Dipakai",
  booked: "Dibooking",
  maintenance: "Maintenance",
};

export const ROOM_TYPES = ["regular", "vip"] as const;
export type RoomType = (typeof ROOM_TYPES)[number];

// ── Payments ───────────────────────────────────────────────────────────────
export const PAYMENT_METHODS = ["wallet", "cash", "qris_manual"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  wallet: "Saldo",
  cash: "Tunai",
  qris_manual: "QRIS",
};

export const PAYMENT_STATUSES = ["unpaid", "paid", "refunded"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

// ── Topup ──────────────────────────────────────────────────────────────────
export const TOPUP_METHODS = ["bank_transfer", "qris", "cash_kasir"] as const;
export type TopupMethod = (typeof TOPUP_METHODS)[number];

export const TOPUP_STATUSES = ["pending", "approved", "rejected"] as const;
export type TopupStatus = (typeof TOPUP_STATUSES)[number];

export const TOPUP_STATUS_LABEL: Record<TopupStatus, string> = {
  pending: "Menunggu",
  approved: "Disetujui",
  rejected: "Ditolak",
};

// ── FnB ────────────────────────────────────────────────────────────────────
export const FNB_ORDER_STATUSES = ["pending", "preparing", "served", "cancelled"] as const;
export type FnbOrderStatus = (typeof FNB_ORDER_STATUSES)[number];

export const FNB_ORDER_STATUS_LABEL: Record<FnbOrderStatus, string> = {
  pending: "Menunggu",
  preparing: "Disiapkan",
  served: "Disajikan",
  cancelled: "Dibatalkan",
};

// ── Promos & vouchers ──────────────────────────────────────────────────────
export const DISCOUNT_TYPES = ["PERCENT", "FIXED", "FREE_MINUTES"] as const;
export type DiscountType = (typeof DISCOUNT_TYPES)[number];

export const PROMO_APPLIES_TO = ["booking", "fnb", "topup", "all"] as const;
export type PromoAppliesTo = (typeof PROMO_APPLIES_TO)[number];

export const VOUCHER_STATUSES = ["active", "used", "expired", "revoked"] as const;
export type VoucherStatus = (typeof VOUCHER_STATUSES)[number];

// ── Events & tournaments ───────────────────────────────────────────────────
export const EVENT_STATUSES = ["draft", "published", "ongoing", "finished", "cancelled"] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

// ── Cash shifts ────────────────────────────────────────────────────────────
export const SHIFT_STATUSES = ["open", "closed"] as const;
export type ShiftStatus = (typeof SHIFT_STATUSES)[number];

// ── Role hierarchy for gating. Higher number = more privilege. ─────────────
export const ROLE_LEVEL: Record<AdminRole, number> = {
  CASHIER: 1,
  OPERATOR: 2,
  ADMIN: 3,
  SUPER_ADMIN: 4,
};

export function hasRole(role: string | undefined, min: AdminRole): boolean {
  if (!role) return false;
  return (ROLE_LEVEL[role as AdminRole] ?? 0) >= ROLE_LEVEL[min];
}
