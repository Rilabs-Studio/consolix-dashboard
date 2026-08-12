import { LogOut } from "lucide-react";
import { signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import { MobileNav } from "./mobile-nav";
import { PushToggle } from "./push-toggle";
import { RefreshButton } from "./refresh-button";

export function Topbar({ name, role }: { name?: string | null; role?: string }) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-slate-200 bg-white pt-safe pr-3 pl-2 sm:px-5 lg:px-6">
      {/* Client island: Topbar tetap Server Component karena memuat inline
          "use server" sign-out di bawah. */}
      <MobileNav role={role} />
      <span className="truncate font-semibold text-slate-900 md:hidden">Consolix Admin</span>
      <div className="ml-auto flex items-center gap-1 sm:gap-3">
        <RefreshButton />
        <PushToggle />
        {/* Nama & role mengalah ke kontrol navigasi di layar tersempit. */}
        <div className="hidden text-right sm:block">
          <p className="max-w-[12rem] truncate text-sm font-medium text-slate-900">
            {name ?? "Admin"}
          </p>
          <p className="text-xs text-slate-500">{role}</p>
        </div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <Button
            type="submit"
            variant="ghost"
            size="icon"
            title="Keluar"
            className="h-11 w-11 sm:h-9 sm:w-9"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </header>
  );
}
