"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import {
  MAX_PULL,
  TRIGGER_PULL,
  dampPull,
  isVerticalPull,
  pullProgress,
  shouldTrigger,
} from "@/lib/pull-to-refresh";
import { cn } from "@/lib/utils";

/** Batas aman kalau transisi tidak pernah terlihat berjalan — indikator jangan nyangkut. */
const STUCK_TIMEOUT_MS = 8000;

/**
 * `<main>` dashboard yang bisa ditarik ke bawah untuk menyegarkan halaman.
 *
 * PWA `display: standalone` tidak punya tombol reload sama sekali, dan scroller
 * halaman ini adalah `<main>` — bukan `<body>` — sehingga pull-to-refresh bawaan
 * browser pun tidak pernah aktif. Jadi gesturnya dibuat sendiri di sini, dan
 * `RefreshButton` di Topbar menyediakan jalan yang sama untuk mouse/keyboard.
 *
 * `router.refresh()` hanya mengambil ulang Server Component — state client
 * (papan Kasir, keranjang POS) tetap utuh.
 */
export function RefreshableMain({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const router = useRouter();
  const mainRef = useRef<HTMLElement>(null);
  const [pull, setPull] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [isPending, startTransition] = useTransition();
  // Cermin `pull` untuk dibaca di listener native tanpa closure basi.
  const pullRef = useRef(0);
  const sawPending = useRef(false);

  const setPullBoth = (v: number) => {
    pullRef.current = v;
    setPull(v);
  };

  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;

    let startY = 0;
    let startX = 0;
    let tracking = false;
    let active = false;

    const onStart = (e: TouchEvent) => {
      // Hanya dari puncak scroll, dan hanya satu jari (dua jari = pinch-zoom).
      if (e.touches.length !== 1 || el.scrollTop > 0) return;
      tracking = true;
      active = false;
      startY = e.touches[0].clientY;
      startX = e.touches[0].clientX;
    };

    const onMove = (e: TouchEvent) => {
      if (!tracking) return;
      const dy = e.touches[0].clientY - startY;
      const dx = e.touches[0].clientX - startX;

      if (!active) {
        if (!isVerticalPull(dx, dy)) {
          tracking = false; // scroll ke atas / geser mendatar — bukan urusan kami
          return;
        }
        active = true;
        setDragging(true);
      }

      // preventDefault mematikan bounce bawaan iOS supaya tarikannya milik kami.
      // Listener ini sengaja non-passive; prop onTouchMove React selalu passive.
      e.preventDefault();
      setPullBoth(dampPull(dy));
    };

    const onEnd = () => {
      if (!tracking) return;
      tracking = false;
      if (!active) return;
      active = false;
      setDragging(false);

      if (shouldTrigger(pullRef.current)) {
        setPullBoth(TRIGGER_PULL); // tahan indikator selama refresh berjalan
        sawPending.current = false;
        startTransition(() => router.refresh());
      } else {
        setPullBoth(0);
      }
    };

    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onEnd);
    el.addEventListener("touchcancel", onEnd);
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
      el.removeEventListener("touchcancel", onEnd);
    };
  }, [router]);

  // Tarik indikator kembali setelah transisi benar-benar selesai — bukan saat
  // dipicu, karena `isPending` baru menyala di render berikutnya.
  useEffect(() => {
    if (isPending) {
      sawPending.current = true;
      return;
    }
    if (!sawPending.current) return;
    sawPending.current = false;
    setPullBoth(0);
  }, [isPending]);

  // Jaring pengaman: kalau transisi tak pernah terlihat berjalan, jangan biarkan
  // indikator menggantung selamanya.
  useEffect(() => {
    if (pull !== TRIGGER_PULL || dragging || isPending) return;
    const timer = setTimeout(() => setPullBoth(0), STUCK_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [pull, dragging, isPending]);

  const visible = pull > 0 || isPending;

  return (
    <main
      ref={mainRef}
      // overscroll-y-contain: tarikan di puncak tidak merambat jadi navigasi
      // "swipe to go back"/bounce halaman di iOS.
      className={cn("relative overscroll-y-contain", className)}
    >
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center",
          !dragging && "transition-transform duration-200 ease-out motion-reduce:transition-none"
        )}
        style={{
          transform: `translateY(${pull - MAX_PULL / 2}px)`,
          opacity: visible ? pullProgress(pull) : 0,
        }}
      >
        <span className="rounded-full border border-slate-200 bg-white p-2 shadow-md">
          <RefreshCw
            className={cn("h-4 w-4 text-indigo-600", isPending && "animate-spin")}
            // Sebelum ambang, ikon ikut berputar mengikuti tarikan.
            style={isPending ? undefined : { transform: `rotate(${pullProgress(pull) * 270}deg)` }}
          />
        </span>
      </div>

      <p role="status" aria-live="polite" className="sr-only">
        {isPending ? "Menyegarkan halaman…" : ""}
      </p>

      {children}
    </main>
  );
}
