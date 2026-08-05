"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cancelRental, setRentalStatus } from "@/server/actions/rentals";
import type { RentalOrder } from "@/lib/types";
import { formatRupiah } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { SubmitButton } from "@/components/forms/form-controls";

const COLLATERAL_OPTIONS = ["KTP", "STNK", "SIM", "KK"];

/** Next lifecycle action per status. Handover requires collateral documents
 * (KTP + at least one other) recorded via the modal. */
export function RentalRowActions({ order }: { order: RentalOrder }) {
  const router = useRouter();
  const [handoverOpen, setHandoverOpen] = useState(false);
  const [checked, setChecked] = useState<string[]>(["KTP"]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const act = (action: (fd: FormData) => Promise<{ error?: string }>, fd: FormData) =>
    startTransition(async () => {
      setError(null);
      const result = await action(fd);
      if (result.error) setError(result.error);
      else {
        setHandoverOpen(false);
        router.refresh();
      }
    });

  const toggle = (doc: string) =>
    setChecked((prev) => (prev.includes(doc) ? prev.filter((d) => d !== doc) : [...prev, doc]));

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-1">
        {order.status === "confirmed" && (
          <Button size="sm" onClick={() => setHandoverOpen(true)}>
            Serahkan
          </Button>
        )}
        {order.status === "out" && (
          <form
            action={(fd) => {
              if (
                !confirm(
                  `Barang kembali lengkap?\nKembalikan deposit ${formatRupiah(order.depositAmount)} ` +
                    `dan dokumen jaminan (${(order.collateralDocuments ?? []).join(", ")}).`,
                )
              )
                return;
              act(setRentalStatus, fd);
            }}
          >
            <input type="hidden" name="id" value={order.id} />
            <input type="hidden" name="status" value="completed" />
            <Button type="submit" size="sm" disabled={pending}>
              Diterima Kembali
            </Button>
          </form>
        )}
        {(order.status === "pending" || order.status === "confirmed") && (
          <form
            action={(fd) => {
              if (!confirm(`Batalkan order ${order.code}?`)) return;
              act(cancelRental, fd);
            }}
          >
            <input type="hidden" name="id" value={order.id} />
            <Button type="submit" variant="ghost" size="sm" disabled={pending}>
              Batal
            </Button>
          </form>
        )}
      </div>
      {order.status === "out" && (order.collateralDocuments?.length ?? 0) > 0 && (
        <p className="text-right text-xs text-slate-400">
          Jaminan: {order.collateralDocuments!.join(" + ")}
        </p>
      )}
      {error && !handoverOpen && (
        <p className="max-w-[14rem] text-right text-xs text-red-600">{error}</p>
      )}

      <Modal
        open={handoverOpen}
        onClose={() => setHandoverOpen(false)}
        title={`Serah Terima ${order.code}`}
      >
        <form action={(fd) => act(setRentalStatus, fd)} className="space-y-3">
          <input type="hidden" name="id" value={order.id} />
          <input type="hidden" name="status" value="out" />
          <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
            Terima <span className="font-semibold">deposit {formatRupiah(order.depositAmount)}</span>
            {order.paymentStatus !== "paid" && (
              <> + pembayaran tunai <span className="font-semibold">{formatRupiah(order.totalAmount)}</span> (butuh shift buka)</>
            )}
            .
          </div>
          <div>
            <Label>Dokumen jaminan yang diserahkan penyewa</Label>
            <p className="mb-2 text-xs text-slate-500">
              Wajib KTP + minimal satu dokumen lain (STNK/SIM/KK/lainnya).
            </p>
            <div className="flex flex-wrap gap-3">
              {COLLATERAL_OPTIONS.map((doc) => (
                <label key={doc} className="flex items-center gap-1.5 text-sm">
                  <input
                    type="checkbox"
                    name="collateral"
                    value={doc}
                    checked={checked.includes(doc)}
                    onChange={() => toggle(doc)}
                    className="h-4 w-4 accent-indigo-600"
                  />
                  {doc}
                </label>
              ))}
            </div>
          </div>
          <div>
            <Label>Dokumen lainnya (opsional)</Label>
            <Input name="collateral" placeholder="mis. Paspor / ID kampus" />
          </div>
          <div>
            <Label>Catatan jaminan</Label>
            <Textarea
              name="collateralNotes"
              rows={2}
              placeholder="mis. STNK motor Beat B 1234 XY"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <SubmitButton className="w-full">Serahkan Barang</SubmitButton>
        </form>
      </Modal>
    </div>
  );
}
