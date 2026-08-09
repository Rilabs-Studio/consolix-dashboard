"use server";

import { apiGet, apiPost } from "@/lib/api-client";
import { requireRole } from "@/lib/session";

export interface PushConfig {
  enabled: boolean;
  publicKey: string;
}

export async function getPushConfig(): Promise<PushConfig> {
  await requireRole("CASHIER");
  return apiGet<PushConfig>("/admin/push/public-key");
}

export async function savePushSubscription(sub: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}): Promise<void> {
  await requireRole("CASHIER");
  await apiPost("/admin/push/subscribe", sub);
}

export async function removePushSubscription(endpoint: string): Promise<void> {
  await requireRole("CASHIER");
  await apiPost("/admin/push/unsubscribe", { endpoint });
}
