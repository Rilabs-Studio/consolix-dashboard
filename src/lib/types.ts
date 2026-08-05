// Shared response types mirroring the NestJS API contract
// (../consolix-backend/docs/api-contract.md). Grows per phase — add types here,
// never inline anonymous shapes in pages.

import type {
  AdminRole,
  BookingStatus,
  ConsoleUnitStatus,
  PaymentMethod,
  PaymentStatus,
  RoomType,
} from "./constants";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  /** Uppercase dashboard role (normalized from the lowercase API value). */
  role: AdminRole;
  active: boolean;
  createdAt: string;
}

// ── Phase 2+ (kept here so pages/actions share one definition) ─────────────

export interface ConsoleType {
  id: string;
  name: string;
  basePricePerHour: number;
  imageUrl: string | null;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
}

export interface ConsoleUnit {
  id: string;
  code: string;
  /** Label tampilan (mis. "TV 01"); null → tampilkan `code`. */
  displayLabel: string | null;
  /** Mapping ke device TV RDMS; null → tidak terhubung. */
  rdmsDeviceId: string | null;
  consoleTypeId: string;
  consoleType?: ConsoleType;
  roomType: RoomType;
  status: ConsoleUnitStatus;
  notes: string | null;
  isActive: boolean;
}

export interface AppUser {
  id: string;
  /** Null for Google-first accounts that haven't added a number yet. */
  phone: string | null;
  name: string;
  email: string | null;
  avatarUrl: string | null;
  hasPin: boolean;
  referralCode: string;
  lifetimePoints: number;
  currentPoints: number;
  xp: number;
  level: number;
  memberTierId: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface Game {
  _id: string;
  title: string;
  slug: string;
  platform: string[];
  genre: string[];
  coverUrl: string | null;
  description: string;
  minPlayers: number;
  maxPlayers: number;
  isPopular: boolean;
  isActive: boolean;
}

export interface UnitGame {
  id: string;
  gameId: string;
  gameTitle: string;
}

export interface PriceRule {
  id: string;
  consoleTypeId: string | null;
  dayType: "weekday" | "weekend" | "holiday";
  startTime: string;
  endTime: string;
  pricePerHour: number;
  label: string;
  isActive: boolean;
  priority: number;
}

export interface OperatingHourDay {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
  is24Hours: boolean;
}

export interface OutletStatus {
  isOpen: boolean;
  closingSoon: boolean;
  opensAt: string | null;
  closesAt: string | null;
}

export interface Holiday {
  id: string;
  date: string;
  name: string;
  type: "closed" | "special_hours" | "special_price";
  openTime: string | null;
  closeTime: string | null;
  priceMultiplier: string | null;
}

export interface CalendarDay {
  date: string;
  total: number;
  byStatus: Partial<Record<BookingStatus, number>>;
}

export interface Booking {
  id: string;
  code: string;
  userId: string | null;
  /** Nama member — hanya terisi di GET /admin/bookings (walk-in tanpa akun → null). */
  userName: string | null;
  consoleUnitId: string;
  type: "booking" | "walk_in";
  status: BookingStatus;
  startAt: string;
  endAt: string;
  durationMinutes: number;
  actualStartAt: string | null;
  actualEndAt: string | null;
  baseAmount: number;
  extensionAmount: number;
  overtimeAmount: number;
  fnbAmount: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  checkInCode: string;
  customerName: string | null;
  notes: string | null;
  createdAt: string;
}

export interface ShiftTotals {
  rentalSales: number;
  fnbSales: number;
  topupCashTotal: number;
  salesByMethod: Record<string, number>;
  refundCashTotal: number;
  expenseCashTotal: number;
  expectedCash: number;
}

export interface CashShift {
  id: string;
  code: string;
  openedByAdminId: string;
  openedAt: string;
  cashOpening: number;
  notesOpen: string | null;
  closedByAdminId: string | null;
  closedAt: string | null;
  notesClose: string | null;
  status: "open" | "closed";
  rentalSales: number | null;
  fnbSales: number | null;
  topupCashTotal: number | null;
  salesByMethod: Record<string, number> | null;
  refundCashTotal: number | null;
  expenseCashTotal: number | null;
  expectedCash: number | null;
  actualCash: number | null;
  difference: number | null;
  /** Present when the shift is open (live totals). */
  totals?: ShiftTotals;
}

// ---------- Fase 6: laporan, broadcast, audit, rating ----------

export interface ExpenseCategory {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
}

export interface Expense {
  id: string;
  date: string;
  expenseCategoryId: string;
  description: string;
  amount: number;
  paymentMethod: "cash" | "transfer";
  proofUrl: string | null;
  cashShiftId: string | null;
  adminId: string;
  createdAt: string;
}

export interface RevenuePoint {
  day: string;
  rental: number;
  fnb: number;
  topup: number;
  total: number;
}

export interface PnlReport {
  from: string;
  to: string;
  revenue: { rental: number; fnb: number; total: number };
  cogs: number;
  grossProfit: number;
  expenses: { category: string; total: number }[];
  totalExpenses: number;
  netProfit: number;
}

export interface OccupancyRow {
  unitId: string;
  unitCode: string;
  sessions: number;
  usedMinutes: number;
  occupancyPercent: number;
}

export interface DashboardSummary {
  today: RevenuePoint;
  activeSessions: number;
  bookingsToday: number;
  pendingTopups: number;
  shiftOpen: boolean;
  series: RevenuePoint[];
}

export type BroadcastStatus = "draft" | "scheduled" | "sending" | "sent" | "failed" | "cancelled";

export interface Broadcast {
  id: string;
  title: string;
  body: string;
  deepLink: string | null;
  audienceType: "all" | "tier" | "specific";
  audienceFilter: { tierIds?: string[]; userIds?: string[] } | null;
  scheduledAt: string | null;
  status: BroadcastStatus;
  totalTargets: number;
  sentCount: number;
  failedCount: number;
  createdByAdminId: string;
  sentAt: string | null;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  adminId: string | null;
  adminEmail: string;
  action: string;
  entity: string;
  entityId: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  createdAt: string;
}

export interface SessionRating {
  id: string;
  bookingId: string;
  userId: string;
  consoleUnitId: string;
  rating: number;
  comment: string | null;
  tags: string[];
  adminReply: string | null;
  isHidden: boolean;
  createdAt: string;
}

export interface RatingAverage {
  consoleUnitId: string;
  avg: string;
  count: string;
}

// ---------- Sewa rumahan ----------

export type RentalProductKind = "main" | "addon";

export interface RentalProduct {
  id: string;
  name: string;
  description: string;
  kind: RentalProductKind;
  category: "console" | "tv" | "controller" | "bundle";
  pricePerDay: number;
  depositAmount: number;
  stock: number;
  imageUrl: string | null;
  isActive: boolean;
  sortOrder: number;
}

export type RentalOrderStatus = "pending" | "confirmed" | "out" | "completed" | "cancelled";

export interface RentalOrderItem {
  id: string;
  name: string;
  kind: RentalProductKind;
  pricePerDay: number;
  depositAmount: number;
  qty: number;
  subtotal: number;
}

export interface RentalOrder {
  id: string;
  code: string;
  userId: string;
  status: RentalOrderStatus;
  startDate: string;
  endDate: string;
  durationDays: number;
  deliveryMethod: "pickup" | "delivery";
  deliveryAddress: string | null;
  deliveryFee: number;
  baseAmount: number;
  addonAmount: number;
  depositAmount: number;
  totalAmount: number;
  paymentMethod: "wallet" | "cash";
  paymentStatus: "unpaid" | "paid" | "refunded";
  notes: string | null;
  collateralDocuments: string[] | null;
  collateralNotes: string | null;
  outAt: string | null;
  returnedAt: string | null;
  createdAt: string;
  items: RentalOrderItem[];
}

// ---------- Merchandise ----------

export interface MerchProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl: string | null;
  isActive: boolean;
  sortOrder: number;
}

export interface MerchOrderItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  subtotal: number;
}

export interface MerchOrder {
  id: string;
  code: string;
  userId: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  totalAmount: number;
  paymentMethod: "wallet" | "cash";
  paymentStatus: "unpaid" | "paid" | "refunded";
  notes: string | null;
  pickedUpAt: string | null;
  createdAt: string;
  items: MerchOrderItem[];
}

// ---- RDMS: rental TV Android (backend Go, ../consolix-tv) ----
// Field snake_case mengikuti payload REST/WebSocket Go apa adanya
// (kontrak: ../consolix-tv/docs/api.md).

export interface TvSession {
  id: number;
  status: "active" | "finished" | "stopped";
  start_time: string;
  end_time: string;
  remaining_seconds: number;
  warned: boolean;
}

export interface TvDevice {
  id: string;
  name: string;
  online: boolean;
  version?: string;
  volume: number;
  muted: boolean;
  session?: TvSession;
}

export interface TvPackage {
  id: number;
  name: string;
  duration_minutes: number;
  price: number;
}

export type TvWsMessage =
  | { type: "state"; devices: TvDevice[] }
  | { type: "call_cashier"; device_id: string };
