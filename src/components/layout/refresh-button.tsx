"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Tombol segarkan di Topbar. Wajib ada karena PWA `display: standalone` tidak
 * menampilkan tombol reload browser — dan tidak semua orang menemukan gestur
 * tarik-ke-bawah di `RefreshableMain` (di desktop gestur itu tidak ada sama
 * sekali).
 */
export function RefreshButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => startTransition(() => router.refresh())}
      disabled={isPending}
      title="Segarkan halaman"
      aria-label="Segarkan halaman"
      className={cn(
        "inline-flex h-11 w-11 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 sm:h-9 sm:w-9",
        isPending && "text-indigo-600"
      )}
    >
      <RefreshCw className={cn("h-4 w-4", isPending && "animate-spin")} />
    </button>
  );
}
