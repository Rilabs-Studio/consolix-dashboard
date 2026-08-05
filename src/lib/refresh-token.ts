// Edge-safe helper that mints a fresh access token from the NestJS backend.
// Called by the NextAuth `jwt` callback, which also runs inside the Edge
// middleware — so this must rely only on `fetch` (no Node-only APIs).

const API_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/v1";

export interface RefreshedToken {
  accessToken: string;
  /** Absolute epoch ms at which the new access token expires. */
  expiresAt: number;
}

/**
 * Exchange a refresh token for a new access token via
 * `POST /v1/auth/refresh-token`.
 *
 * The backend reads the token from the `refreshToken` body field
 * (`ExtractJwt.fromBodyField('refreshToken')`) and wraps the result in the
 * standard envelope: `{ success, message, data: { accessToken, expiresIn } }`.
 * The refresh token is NOT rotated — it stays valid for its full 30-day TTL.
 *
 * Throws on any non-success response so the caller can flag the session as
 * expired and force a re-login.
 */
export async function refreshAccessToken(refreshToken: string): Promise<RefreshedToken> {
  const res = await fetch(`${API_URL}/auth/refresh-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
    cache: "no-store",
  });

  const json = (await res.json().catch(() => undefined)) as
    | { success?: boolean; data?: { accessToken?: string; expiresIn?: number } }
    | undefined;

  if (!res.ok || !json?.success || !json.data?.accessToken) {
    throw new Error("refresh_failed");
  }

  // `expiresIn` is seconds (e.g. 900 = 15m). Convert to an absolute epoch ms.
  const expiresIn = json.data.expiresIn ?? 0;
  return {
    accessToken: json.data.accessToken,
    expiresAt: Date.now() + expiresIn * 1000,
  };
}
