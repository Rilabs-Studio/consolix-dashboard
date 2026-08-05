"use server";

import { apiPost } from "@/lib/api-client";
import { requireRole } from "@/lib/session";

// Mirrors the backend's allowed upload folders (api-contract §7).
export type UploadFolder =
  | "avatars"
  | "console-units"
  | "games"
  | "fnb-items"
  | "topup-proofs"
  | "expense-proofs"
  | "event-banners"
  | "promo-banners"
  | "merch-products";

export interface PresignedUpload {
  uploadUrl: string;
  key: string;
  publicUrl: string;
  expiresIn: number;
}

/**
 * Mints a presigned PUT URL on the backend (which holds the storage creds). The
 * browser then PUTs the file straight to object storage — bytes never pass
 * through Next.js or the API. Returns the URL pair; the caller persists
 * `publicUrl`.
 */
export async function presignUpload(input: {
  folder: UploadFolder;
  contentType: string;
}): Promise<PresignedUpload> {
  await requireRole("CASHIER"); // cashiers upload topup/expense proofs
  return apiPost<PresignedUpload>("/uploads/presign", {
    folder: input.folder,
    contentType: input.contentType,
  });
}
