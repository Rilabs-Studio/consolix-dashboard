"use client";

import { usePathname } from "next/navigation";
import { getActiveHref } from "./nav";
import { NavList } from "./nav-list";

/** Navigasi desktop. Di bawah `md` digantikan sepenuhnya oleh `MobileNav`. */
export function Sidebar({ role }: { role?: string }) {
  const activeHref = getActiveHref(usePathname());

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
      <div className="flex h-14 items-center gap-2 border-b border-slate-200 px-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-600 text-sm font-bold text-white">
          C
        </div>
        <span className="font-semibold text-slate-900">Consolix Admin</span>
      </div>
      <nav className="flex-1 space-y-5 overflow-y-auto p-3">
        <NavList role={role} activeHref={activeHref} />
      </nav>
    </aside>
  );
}
