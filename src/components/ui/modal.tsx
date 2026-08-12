"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

/**
 * Overlay gelap + panel putih. Di mobile tampil sebagai bottom sheet, dari `sm`
 * ke atas di tengah layar. Tutup via tombol ✕, klik overlay, atau Esc.
 *
 * Di-portal ke `document.body` karena shell dashboard punya dua ancestor
 * `overflow-hidden` dan drawer navigasi memakai `transform` — keduanya membuat
 * containing block baru yang bisa memotong panel `fixed` ini.
 *
 * Konsekuensinya: `<form>` harus berada DI DALAM Modal (seperti semua pemakaian
 * saat ini), bukan Modal di dalam `<form>` — field yang dipindah ke portal
 * lepas dari form DOM dan hilang dari FormData.
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // `open` hanya bernilai true setelah interaksi klien, jadi render server
  // selalu `null` dan tidak ada yang bisa mismatch saat hydrate.
  if (!open || typeof document === "undefined") return null;

  return createPortal(
    // Overlay-nya yang jadi scroller: `overscroll-contain` mencegah panel tinggi
    // meneruskan scroll-nya ke <main> di belakang.
    <div
      className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto overscroll-contain bg-black/50 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-slate-200 bg-white pb-safe shadow-xl sm:max-h-[85dvh] sm:rounded-xl sm:pb-0",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2 border-b border-slate-200 p-4">
          <h3 className="min-w-0 truncate text-base font-semibold text-slate-900">{title}</h3>
          <button
            type="button"
            aria-label="Tutup"
            onClick={onClose}
            className="-mr-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 sm:h-8 sm:w-8"
          >
            ✕
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>,
    document.body
  );
}
