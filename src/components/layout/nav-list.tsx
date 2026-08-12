import Link from "next/link";
import { NAV, type NavItem } from "./nav";
import { hasRole } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * Daftar menu berkelompok yang dipakai bersama Sidebar (desktop) dan MobileNav
 * (drawer). Satu sumber render supaya filter role & tampilan tidak pernah
 * berbeda antara keduanya.
 */
export function NavList({
  role,
  activeHref,
  onNavigate,
}: {
  role?: string;
  activeHref: string | null;
  /** Diisi drawer untuk menutup dirinya saat menu ditekan; Sidebar tidak memakainya. */
  onNavigate?: () => void;
}) {
  // Kasir hanya melihat entri operasionalnya; tiap item mendeklarasikan minRole.
  const visible = NAV.filter((n) => hasRole(role, n.minRole));
  const groups = Array.from(new Set(visible.map((n) => n.group)));

  return (
    <>
      {groups.map((group) => (
        <div key={group}>
          <p className="px-3 pb-1 text-xs font-semibold tracking-wide text-slate-400 uppercase">
            {group}
          </p>
          <div className="space-y-0.5">
            {visible
              .filter((n) => n.group === group)
              .map((item) => (
                <NavEntry
                  key={item.href}
                  item={item}
                  active={item.href === activeHref}
                  onNavigate={onNavigate}
                />
              ))}
          </div>
        </div>
      ))}
    </>
  );
}

function NavEntry({
  item,
  active,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        // py-2.5 di mobile → tinggi ±44px; kembali padat dari sm ke atas.
        "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors sm:py-2",
        active ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {item.label}
    </Link>
  );
}
