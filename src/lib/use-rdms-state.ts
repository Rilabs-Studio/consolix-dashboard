"use client";

import { useEffect, useState } from "react";
import type { TvDevice, TvWsMessage } from "@/lib/types";

// WebSocket backend Go RDMS — satu-satunya endpoint RDMS yang boleh disentuh
// browser. Server push state penuh tiap detik + event call_cashier, jadi tidak
// perlu polling; initial state datang dari RSC sebagai props.
const WS_URL = process.env.NEXT_PUBLIC_RDMS_WS_URL ?? "ws://localhost:8080/ws";

export interface CashierCall {
  deviceId: string;
  at: number;
}

export function useRdmsState(initialDevices: TvDevice[]) {
  const [devices, setDevices] = useState(initialDevices);
  const [connected, setConnected] = useState(false);
  const [calls, setCalls] = useState<CashierCall[]>([]);

  useEffect(() => {
    let closed = false;
    let ws: WebSocket | null = null;
    let retry: ReturnType<typeof setTimeout>;

    function connect() {
      if (closed) return;
      ws = new WebSocket(WS_URL);
      ws.onopen = () => setConnected(true);
      ws.onmessage = (ev) => {
        const msg: TvWsMessage = JSON.parse(ev.data);
        if (msg.type === "state") {
          setDevices(msg.devices ?? []);
        } else if (msg.type === "call_cashier") {
          setCalls((prev) => [...prev, { deviceId: msg.device_id, at: Date.now() }]);
        }
      };
      ws.onclose = () => {
        setConnected(false);
        retry = setTimeout(connect, 2000);
      };
      ws.onerror = () => ws?.close();
    }

    connect();
    return () => {
      closed = true;
      clearTimeout(retry);
      ws?.close();
    };
  }, []);

  const dismissCall = (at: number) => setCalls((prev) => prev.filter((c) => c.at !== at));

  return { devices, connected, calls, dismissCall };
}
