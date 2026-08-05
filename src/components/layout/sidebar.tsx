"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV, type NavItem } from "./nav";
import { hasRole } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function Sidebar({ role }: { role?: string }) {
  const pathname = usePathname();
  // Cashiers only see their operational entries; each item declares its minRole.
  const visible = NAV.filter((n) => hasRole(role, n.minRole));
  const groups = Array.from(new Set(visible.map((n) => n.group)));

  // Longest-prefix match: only the most specific nav href is "active" so that
  // e.g. /fnb does not light up while on /fnb/pesanan.
  const activeHref = visible.reduce<string | null>((best, item) => {
    const matches =
      item.href === "/"
        ? pathname === "/"
        : pathname === item.href || pathname.startsWith(item.href + "/");
    if (!matches) return best;
    if (best === null || item.href.length > best.length) return item.href;
    return best;
  }, null);

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
      <div className="flex h-14 items-center gap-2 border-b border-slate-200 px-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-600 text-sm font-bold text-white">
          C
        </div>
        <span className="font-semibold text-slate-900">Consolix Admin</span>
      </div>
      <nav className="flex-1 space-y-5 overflow-y-auto p-3">
        {groups.map((group) => (
          <div key={group}>
            <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
              {group}
            </p>
            <div className="space-y-0.5">
              {visible
                .filter((n) => n.group === group)
                .map((item) => (
                  <NavEntry key={item.href} item={item} active={item.href === activeHref} />
                ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}

function NavEntry({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100"
      )}
    >
      <Icon className="h-4 w-4" />
      {item.label}
    </Link>
  );
}
