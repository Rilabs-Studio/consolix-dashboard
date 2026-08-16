"use client";

import { useEffect, useState } from "react";
import type { SessionBill } from "@/lib/types";
import { PAYMENT_METHOD_LABEL } from "@/lib/constants";
import { formatRupiah } from "@/lib/utils";
import { cancelSession, getSessionBill } from "@/server/actions/pos";
import { Input, Label, Select } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { SubmitButton } from "@/components/forms/form-controls";

/**
 * Dialog "Batalkan Sesi": sewa tidak ditagih (mis. konsol rusak), tapi FnB
 * yang telanjur disajikan tetap harus dibayar — bill diambil dulu untuk tahu
 * ada-tidaknya tagihan FnB. Parent memberi `key` per sesi agar state segar.
 */
export function CancelSessionDialog({
  open,
  sessionId,
  onClose,
  onDone,
}: {
  open: boolean;
  sessionId: string | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const [bill, setBill] = useState<SessionBill | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !sessionId) return;
    let stale = false;
    getSessionBill(sessionId)
      .then((b) => {
        if (!stale) setBill(b);
      })
      .catch(() => {
        if (!stale) setError("Gagal memuat bill — tutup lalu coba lagi.");
      });
    return () => {
      stale = true;
    };
  }, [open, sessionId]);

  async function submit(fd: FormData) {
    const result = await cancelSession(fd);
    if (result.error) {
      setError(result.error);
      return;
    }
    onDone();
  }

  // Hanya FnB yang sudah disajikan yang ditagih saat cancel — order yang masih
  // pending/preparing ikut dibatalkan backend tanpa biaya.
  const fnbAmount = (bill?.fnb.orders ?? [])
    .filter((o) => o.status === "served")
    .reduce((sum, o) => sum + o.totalAmount, 0);

  return (
    <Modal open={open} onClose={onClose} title="Batalkan Sesi">
      {!bill && !error && <p className="py-6 text-center text-sm text-slate-500">Memuat bill…</p>}
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      {bill && sessionId && (
        <form action={submit} className="space-y-3">
          <input type="hidden" name="id" value={sessionId} />
          <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Sewa akan dibatalkan dan <b>tidak ditagih</b>. FnB yang sudah disajikan tetap harus
            dibayar.
          </p>
          {fnbAmount > 0 && (
            <div>
              <Label>Tagihan FnB: {formatRupiah(fnbAmount)}</Label>
              <Select name="fnbPaymentMethod" required defaultValue="cash">
                <option value="cash">{PAYMENT_METHOD_LABEL.cash}</option>
                <option value="qris_manual">{PAYMENT_METHOD_LABEL.qris_manual}</option>
              </Select>
            </div>
          )}
          <div>
            <Label>Alasan pembatalan (wajib)</Label>
            <Input
              name="reason"
              placeholder="mis. konsol rusak, stik bermasalah"
              minLength={5}
              required
            />
          </div>
          <SubmitButton variant="destructive" className="w-full">
            Batalkan Sesi
          </SubmitButton>
        </form>
      )}
    </Modal>
  );
}
