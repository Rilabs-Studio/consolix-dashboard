"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cancelMerchOrder, completeMerchOrder } from "@/server/actions/merch";
import type { MerchOrder } from "@/lib/types";
import { formatRupiah } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function MerchRowActions({ order }: { order: MerchOrder }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const act = (action: (fd: FormData) => Promise<{ error?: string }>, fd: FormData) =>
    startTransition(async () => {
      setError(null);
      const result = await action(fd);
      if (result.error) setError(result.error);
      else router.refresh();
    });

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-1">
        {order.status === "confirmed" && (
          <form
            action={(fd) => {
              const tagihan =
                order.paymentStatus !== "paid"
                  ? `\nTagih tunai ${formatRupiah(order.totalAmount)} (butuh shift buka).`
                  : "";
              if (!confirm(`Serahkan pesanan ${order.code}?${tagihan}`)) return;
              act(completeMerchOrder, fd);
            }}
          >
            <input type="hidden" name="id" value={order.id} />
            <Button type="submit" size="sm" disabled={pending}>
              Serahkan
            </Button>
          </form>
        )}
        {(order.status === "pending" || order.status === "confirmed") && (
          <form
            action={(fd) => {
              if (!confirm(`Batalkan pesanan ${order.code}? Stok dikembalikan.`)) return;
              act(cancelMerchOrder, fd);
            }}
          >
            <input type="hidden" name="id" value={order.id} />
            <Button type="submit" variant="ghost" size="sm" disabled={pending}>
              Batal
            </Button>
          </form>
        )}
      </div>
      {error && <p className="max-w-[14rem] text-right text-xs text-red-600">{error}</p>}
    </div>
  );
}
