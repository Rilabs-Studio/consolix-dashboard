import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  MonitorPlay,
  Gamepad2,
  CalendarClock,
  ClipboardList,
  ConciergeBell,
  UtensilsCrossed,
  Users,
  Crown,
  Trophy,
  Target,
  Ticket,
  Gift,
  CalendarDays,
  HandCoins,
  PackageOpen,
  Shirt,
  Landmark,
  Bell,
  ScrollText,
  MonitorSmartphone,
  Tags,
} from "lucide-react";
import type { AdminRole } from "@/lib/constants";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  group: string;
  /** Minimum role that sees this entry (hierarchy: CASHIER < OPERATOR < ADMIN < SUPER_ADMIN). */
  minRole: AdminRole;
};

export const NAV: NavItem[] = [
  { label: "Overview", href: "/", icon: LayoutDashboard, group: "Umum", minRole: "OPERATOR" },
  { label: "Kasir", href: "/kasir", icon: MonitorPlay, group: "Operasional", minRole: "CASHIER" },
  { label: "Booking", href: "/booking", icon: CalendarClock, group: "Operasional", minRole: "CASHIER" },
  { label: "Kasir FnB", href: "/fnb/kasir", icon: ConciergeBell, group: "Operasional", minRole: "CASHIER" },
  { label: "Pesanan FnB", href: "/fnb/pesanan", icon: ClipboardList, group: "Operasional", minRole: "CASHIER" },
  { label: "Top Up Saldo", href: "/topup", icon: HandCoins, group: "Operasional", minRole: "CASHIER" },
  { label: "Sewa Rumahan", href: "/sewa", icon: PackageOpen, group: "Operasional", minRole: "CASHIER" },
  { label: "Merchandise", href: "/merchandise", icon: Shirt, group: "Operasional", minRole: "CASHIER" },
  { label: "Konsol", href: "/konsol", icon: Gamepad2, group: "Master Data", minRole: "OPERATOR" },
  { label: "Tipe Konsol", href: "/konsol/tipe", icon: Tags, group: "Master Data", minRole: "OPERATOR" },
  { label: "Perangkat TV", href: "/perangkat", icon: MonitorSmartphone, group: "Master Data", minRole: "OPERATOR" },
  { label: "FnB", href: "/fnb", icon: UtensilsCrossed, group: "Master Data", minRole: "OPERATOR" },
  { label: "Member", href: "/member", icon: Crown, group: "Loyalty", minRole: "OPERATOR" },
  { label: "Gamifikasi", href: "/gamifikasi", icon: Trophy, group: "Loyalty", minRole: "OPERATOR" },
  { label: "Challenge", href: "/challenge", icon: Target, group: "Loyalty", minRole: "OPERATOR" },
  { label: "Promo", href: "/promo", icon: Ticket, group: "Loyalty", minRole: "OPERATOR" },
  { label: "Voucher", href: "/voucher", icon: Gift, group: "Loyalty", minRole: "OPERATOR" },
  { label: "Event", href: "/event", icon: CalendarDays, group: "Loyalty", minRole: "OPERATOR" },
  { label: "Keuangan", href: "/keuangan", icon: Landmark, group: "Monitoring", minRole: "ADMIN" },
  { label: "Notifikasi", href: "/notifikasi", icon: Bell, group: "Monitoring", minRole: "OPERATOR" },
  { label: "Pengguna", href: "/pengguna", icon: Users, group: "Pengelolaan", minRole: "OPERATOR" },
  { label: "Audit Log", href: "/pengaturan/audit-log", icon: ScrollText, group: "Pengelolaan", minRole: "ADMIN" },
];

/**
 * Longest-prefix match: hanya href paling spesifik yang dianggap aktif, supaya
 * `/fnb` tidak ikut menyala saat berada di `/fnb/pesanan`. Dipakai bersama oleh
 * Sidebar (desktop) dan MobileNav (drawer) agar keduanya tidak pernah berbeda.
 */
export function getActiveHref(pathname: string, items: NavItem[] = NAV): string | null {
  return items.reduce<string | null>((best, item) => {
    const matches =
      item.href === "/"
        ? pathname === "/"
        : pathname === item.href || pathname.startsWith(item.href + "/");
    if (!matches) return best;
    if (best === null || item.href.length > best.length) return item.href;
    return best;
  }, null);
}
