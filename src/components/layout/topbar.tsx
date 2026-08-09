import { LogOut } from "lucide-react";
import { signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import { PushToggle } from "./push-toggle";

export function Topbar({ name, role }: { name?: string | null; role?: string }) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div className="md:hidden font-semibold text-slate-900">Consolix Admin</div>
      <div className="ml-auto flex items-center gap-4">
        <PushToggle />
        <div className="text-right">
          <p className="text-sm font-medium text-slate-900">{name ?? "Admin"}</p>
          <p className="text-xs text-slate-500">{role}</p>
        </div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <Button type="submit" variant="ghost" size="icon" title="Keluar">
            <LogOut className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </header>
  );
}
