"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteConsoleUnit } from "@/server/actions/consoles";
import { Button } from "@/components/ui/button";

/**
 * Hapus unit dengan konfirmasi + error inline. Unit ber-riwayat booking tidak
 * bisa dihapus (CONSOLE_UNIT_HAS_HISTORY) — arahkan admin untuk menonaktifkan.
 */
export function DeleteUnitButton({ id, code }: { id: string; code: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div>
      <form
        action={(fd) => {
          if (!confirm(`Hapus unit ${code}?`)) return;
          startTransition(async () => {
            const result = await deleteConsoleUnit(fd);
            if (result?.error) {
              setError(
                result.errorCode === "CONSOLE_UNIT_HAS_HISTORY"
                  ? "Unit ini punya riwayat booking sehingga tidak bisa dihapus. Ubah Status Unit menjadi Nonaktif agar tidak muncul di app dan tidak bisa dibooking."
                  : result.error
              );
            }
          });
        }}
      >
        <input type="hidden" name="id" value={id} />
        <Button type="submit" variant="ghost" size="icon" disabled={pending} title="Hapus">
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      </form>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
