"use client";

import { useEffect, useState } from "react";
import type { SessionBill } from "@/lib/types";
import { PAYMENT_METHOD_LABEL } from "@/lib/constants";
import { formatRupiah } from "@/lib/utils";
import { getSessionBill, saveAndEndSession } from "@/server/actions/pos";
import { Input, Label, Select } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { SubmitButton } from "@/components/forms/form-controls";

/**
 * Dialog "Simpan & Selesai": akhiri sesi lebih awal, sisa menitnya masuk
 * tabungan waktu milik nomor HP pelanggan, lalu jam terpakai + FnB ditagih
 * sekarang. Parent memberi `key` per sesi sehingga state bill selalu segar.
 */
export function SaveSessionDialog({
  open,
  sessionId,
  remainingMinutes,
  onClose,
  onDone,
}: {
  open: boolean;
  sessionId: string | null;
  /** Sisa menit yang akan disimpan — beku bila sesi sedang dijeda. */
  remainingMinutes: number;
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
    const result = await saveAndEndSession(fd);
    if (result.error) {
      setError(result.error);
      return;
    }
    onDone();
  }

  return (
    <Modal open={open} onClose={onClose} title="Simpan & Selesai">
      {!bill && !error && <p className="py-6 text-center text-sm text-slate-500">Memuat bill…</p>}
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      {bill && sessionId && (
        <form action={submit} className="space-y-3">
          <input type="hidden" name="id" value={sessionId} />
          <p className="rounded-md bg-sky-50 px-3 py-2 text-xs text-sky-800">
            Sisa <b>{remainingMinutes} menit</b> akan disimpan sebagai tabungan waktu, bisa
            dipakai lagi lewat walk-in dengan nomor HP yang sama.
          </p>
          {remainingMinutes === 0 && (
            <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Waktu sudah habis — tidak ada sisa untuk disimpan. Gunakan tombol <b>Bayar</b>.
            </p>
          )}
          <div>
            <Label>No. HP pelanggan (kunci tabungan)</Label>
            <Input
              name="customerPhone"
              placeholder="08…"
              defaultValue={bill.customer.phone ?? ""}
              required
            />
          </div>
          {bill.totalAmount > 0 ? (
            <div>
              <Label>Metode pembayaran — tagihan {formatRupiah(bill.totalAmount)}</Label>
              <Select name="paymentMethod" defaultValue="cash">
                <option value="cash">{PAYMENT_METHOD_LABEL.cash}</option>
                <option value="qris_manual">{PAYMENT_METHOD_LABEL.qris_manual}</option>
              </Select>
            </div>
          ) : (
            // Kontrak tetap minta paymentMethod meski tagihan nol.
            <input type="hidden" name="paymentMethod" value="cash" />
          )}
          {/* Spread kondisional: `disabled={undefined}` akan menimpa disable
              bawaan SubmitButton saat pending (props menimpa lewat spread). */}
          <SubmitButton className="w-full" {...(remainingMinutes === 0 ? { disabled: true } : {})}>
            Simpan & Terima Pembayaran
          </SubmitButton>
        </form>
      )}
    </Modal>
  );
}
