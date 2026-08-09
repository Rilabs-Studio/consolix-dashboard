"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { SessionBill } from "@/lib/types";
import { PAYMENT_METHOD_LABEL } from "@/lib/constants";
import { formatRupiah, formatTime } from "@/lib/utils";
import { checkoutSession, getSessionBill } from "@/server/actions/pos";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label, Select } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";

/**
 * Dialog "Selesai & Bayar": tampilkan bill lengkap (jam main + makanan +
 * identitas), terima pembayaran, lalu tawarkan struk — kirim WhatsApp
 * (wa.me prefilled) atau cetak.
 */
export function BillDialog({
  sessionId,
  open,
  onClose,
}: {
  sessionId: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [bill, setBill] = useState<SessionBill | null>(null);
  const [paid, setPaid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // State awal (bill null, belum bayar) di-reset lewat remount: parent memberi
  // `key` per sesi — efek ini murni fetch, tanpa setState sinkron.
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

  function pay(fd: FormData) {
    if (!sessionId) return;
    startTransition(async () => {
      const result = await checkoutSession(fd);
      if (result.error) {
        setError(result.error);
        return;
      }
      setError(null);
      // Ambil ulang bill final — overtime & status pembayaran baru terhitung di checkout.
      try {
        setBill(await getSessionBill(sessionId));
      } catch {
        /* struk tetap bisa dibuat dari bill sebelumnya */
      }
      setPaid(true);
      router.refresh();
    });
  }

  const unitLabel = bill ? (bill.unit.displayLabel ?? bill.unit.code) : "";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={paid ? "Struk Pembayaran" : `Bill — ${unitLabel || "Sesi"}`}
    >
      {!bill && !error && <p className="py-6 text-center text-sm text-slate-500">Memuat bill…</p>}
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      {bill && (
        <div className="space-y-4">
          <BillBreakdown bill={bill} />

          {!paid ? (
            <form action={pay} className="space-y-3 border-t border-slate-100 pt-3">
              <input type="hidden" name="id" value={bill.bookingId} />
              <div>
                <Label>Metode pembayaran</Label>
                <Select name="paymentMethod" defaultValue="cash">
                  <option value="cash">{PAYMENT_METHOD_LABEL.cash}</option>
                  <option value="qris_manual">{PAYMENT_METHOD_LABEL.qris_manual}</option>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={pending}>
                {pending ? "Memproses…" : `Terima Pembayaran — ${formatRupiah(bill.totalAmount)}`}
              </Button>
            </form>
          ) : (
            <div className="space-y-2 border-t border-slate-100 pt-3">
              <p className="text-sm text-emerald-600">Pembayaran diterima ✓</p>
              {bill.customer.phone ? (
                <a
                  href={waLink(bill)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full rounded-md bg-emerald-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-emerald-700"
                >
                  Kirim Struk via WhatsApp — {bill.customer.phone}
                </a>
              ) : (
                <p className="text-xs text-slate-400">
                  Nomor WhatsApp pelanggan tidak tersedia — struk hanya bisa dicetak.
                </p>
              )}
              <Button variant="outline" className="w-full" onClick={() => printReceipt(bill)}>
                Cetak Struk
              </Button>
              <Button variant="ghost" className="w-full" onClick={onClose}>
                Selesai
              </Button>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

function BillBreakdown({ bill }: { bill: SessionBill }) {
  const unitLabel = bill.unit.displayLabel ?? bill.unit.code;
  return (
    <div className="space-y-3 text-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-slate-900">
            {bill.customer.name ?? "Pelanggan"}{" "}
            {bill.customer.phone && (
              <span className="font-normal text-slate-500">· {bill.customer.phone}</span>
            )}
          </p>
          <p className="text-xs text-slate-400">
            {bill.code} · {unitLabel}
          </p>
        </div>
        <Badge tone={bill.paymentStatus === "paid" ? "green" : "yellow"}>
          {bill.paymentStatus === "paid" ? "Lunas" : "Belum bayar"}
        </Badge>
      </div>

      <div className="flex justify-between">
        <span>
          Main {formatTime(bill.play.startAt)}–{formatTime(bill.play.endAt)} (
          {bill.play.durationMinutes} mnt)
        </span>
        <span className="font-medium">{formatRupiah(bill.play.amount)}</span>
      </div>

      {bill.fnb.orders.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Makanan & Minuman
          </p>
          {bill.fnb.orders.flatMap((o) =>
            o.items.map((i, idx) => (
              <div key={`${o.id}-${idx}`} className="flex justify-between">
                <span>
                  {i.name} ×{i.qty}
                  {o.status === "pending" && (
                    <span className="ml-1 text-xs text-amber-600">(belum disajikan)</span>
                  )}
                </span>
                <span>{formatRupiah(i.subtotal)}</span>
              </div>
            ))
          )}
        </div>
      )}

      {bill.discountAmount > 0 && (
        <div className="flex justify-between text-emerald-600">
          <span>Diskon</span>
          <span>-{formatRupiah(bill.discountAmount)}</span>
        </div>
      )}

      <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-semibold">
        <span>Total</span>
        <span>{formatRupiah(bill.totalAmount)}</span>
      </div>
    </div>
  );
}

/** Struk teks (dipakai WhatsApp) — monospace-friendly, tanpa markup selain bold WA. */
function receiptText(bill: SessionBill): string {
  const unitLabel = bill.unit.displayLabel ?? bill.unit.code;
  const lines: string[] = [
    "*Consolix Rental* 🎮",
    `Struk ${bill.code}`,
    `Meja: ${unitLabel}`,
    `Pelanggan: ${bill.customer.name ?? "-"}`,
    "--------------------------",
    `Main ${formatTime(bill.play.startAt)}-${formatTime(bill.play.endAt)} (${bill.play.durationMinutes} mnt)`,
    `  ${formatRupiah(bill.play.amount)}`,
  ];
  if (bill.fnb.orders.length > 0) {
    lines.push("Makanan & Minuman:");
    for (const order of bill.fnb.orders) {
      for (const item of order.items) {
        lines.push(`  ${item.name} x${item.qty} — ${formatRupiah(item.subtotal)}`);
      }
    }
  }
  if (bill.discountAmount > 0) lines.push(`Diskon: -${formatRupiah(bill.discountAmount)}`);
  lines.push(
    "--------------------------",
    `*TOTAL: ${formatRupiah(bill.totalAmount)}*`,
    `Dibayar: ${PAYMENT_METHOD_LABEL[bill.paymentMethod] ?? bill.paymentMethod}`,
    "",
    "Terima kasih sudah bermain di Consolix! 🙏"
  );
  return lines.join("\n");
}

function waLink(bill: SessionBill): string {
  const digits = (bill.customer.phone ?? "").replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(receiptText(bill))}`;
}

/** Cetak struk: window baru ber-layout 80mm (printer thermal / Save as PDF). */
function printReceipt(bill: SessionBill): void {
  const win = window.open("", "_blank", "width=420,height=640");
  if (!win) return;
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const body = esc(receiptText(bill).replace(/\*/g, ""));
  win.document.write(`<!doctype html>
<html><head><title>Struk ${esc(bill.code)}</title>
<style>
  body { font-family: "Courier New", monospace; font-size: 12px; width: 80mm; margin: 0 auto; padding: 8px; }
  pre { white-space: pre-wrap; margin: 0; }
  @media print { @page { size: 80mm auto; margin: 4mm; } }
</style></head>
<body><pre>${body}</pre><script>window.print();<\/script></body></html>`);
  win.document.close();
}
