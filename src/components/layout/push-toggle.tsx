"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, BellRing } from "lucide-react";
import {
  getPushConfig,
  removePushSubscription,
  savePushSubscription,
} from "@/server/actions/push";
import { cn } from "@/lib/utils";

type PushState = "unsupported" | "off" | "on" | "denied" | "busy";

/** VAPID public key (base64url) → Uint8Array untuk pushManager.subscribe.
    Backing buffer dibuat eksplisit agar bertipe ArrayBuffer (bukan
    ArrayBufferLike) — syarat BufferSource di TS 5.7+. */
function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const arr = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

/**
 * Tombol lonceng di topbar: registrasi service worker + langganan Web Push.
 * Disembunyikan bila browser tidak mendukung atau backend belum ber-VAPID.
 * Di iPad, push hanya tersedia setelah dashboard di-install ke Home Screen.
 */
export function PushToggle() {
  const [state, setState] = useState<PushState>("unsupported");

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    let stale = false;
    (async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js");
        const sub = await reg.pushManager.getSubscription();
        if (stale) return;
        if (Notification.permission === "denied") setState("denied");
        else setState(sub ? "on" : "off");
      } catch {
        /* SW gagal terdaftar (mis. http tanpa localhost) — biarkan unsupported */
      }
    })();
    return () => {
      stale = true;
    };
  }, []);

  async function toggle() {
    if (state === "busy" || state === "denied") return;
    const previous = state;
    setState("busy");
    try {
      const reg = await navigator.serviceWorker.ready;
      if (previous === "on") {
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await removePushSubscription(sub.endpoint);
          await sub.unsubscribe();
        }
        setState("off");
        return;
      }

      const config = await getPushConfig();
      if (!config.enabled) {
        alert("Web Push belum dikonfigurasi di server (VAPID key kosong).");
        setState("off");
        return;
      }
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "denied" : "off");
        return;
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(config.publicKey),
      });
      const json = sub.toJSON();
      await savePushSubscription({
        endpoint: sub.endpoint,
        keys: { p256dh: json.keys?.p256dh ?? "", auth: json.keys?.auth ?? "" },
      });
      setState("on");
    } catch {
      setState(previous === "on" ? "on" : "off");
    }
  }

  if (state === "unsupported") return null;

  const Icon = state === "on" ? BellRing : state === "denied" ? BellOff : Bell;
  const title =
    state === "on"
      ? "Notifikasi aktif — klik untuk mematikan"
      : state === "denied"
        ? "Notifikasi diblokir — izinkan lewat pengaturan situs browser"
        : "Aktifkan notifikasi (pesanan meja, panggilan kasir, booking)";

  return (
    <button
      type="button"
      onClick={toggle}
      title={title}
      disabled={state === "busy" || state === "denied"}
      className={cn(
        "inline-flex h-11 w-11 items-center justify-center rounded-md transition-colors sm:h-9 sm:w-9",
        state === "on" ? "text-indigo-600 hover:bg-indigo-50" : "text-slate-400 hover:bg-slate-100",
        state === "denied" && "cursor-not-allowed opacity-50"
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
