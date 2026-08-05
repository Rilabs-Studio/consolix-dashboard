"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";

/**
 * Thumbnail bukti transfer yang membuka pratinjau gambar penuh dalam Modal.
 * Tidak merender apa pun bila `url` kosong (pemanggil yang menampilkan "—").
 */
export function ImagePreview({ url, label = "Bukti transfer" }: { url?: string | null; label?: string }) {
  const [open, setOpen] = useState(false);
  if (!url) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="h-10 w-10 overflow-hidden rounded-md border border-slate-200 bg-slate-50 transition-opacity hover:opacity-80"
        aria-label={`Lihat ${label}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={label} className="h-full w-full object-cover" />
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={label}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={label} className="mx-auto max-h-[70vh] w-auto rounded-md" />
      </Modal>
    </>
  );
}
