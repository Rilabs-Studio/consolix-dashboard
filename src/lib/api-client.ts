import { auth } from "@/auth";

// Thin wrapper around the NestJS `/v1` API. Injects the admin JWT from the
// NextAuth session and unwraps the `{ success, message, data, meta }` envelope
// so callers work with plain data (mirrors the old ok()/fail() ergonomics).

const BASE_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/v1";

export interface PageMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly errorCode?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type Query = Record<string, string | number | boolean | undefined | null>;

function buildUrl(path: string, query?: Query): string {
  const url = new URL(`${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

async function authHeader(): Promise<Record<string, string>> {
  // Reading the session runs the NextAuth `jwt` callback, which proactively
  // refreshes the access token when it's near expiry (see auth.config.ts).
  // So by the time we build this header, the token is already fresh.
  const session = await auth();
  if (session?.error) {
    // Refresh token expired/revoked — no point hitting the API with a dead token.
    throw new ApiError("Sesi berakhir, silakan login ulang.", 401, "SESSION_EXPIRED");
  }
  const token = session?.accessToken;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

interface Envelope<T> {
  success: boolean;
  message: string | null;
  data: T;
  meta?: PageMeta | null;
}

async function request<T>(
  method: string,
  path: string,
  opts: { query?: Query; body?: unknown } = {},
): Promise<Envelope<T>> {
  const headers: Record<string, string> = { ...(await authHeader()) };
  let body: string | undefined;
  if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(opts.body);
  }

  const res = await fetch(buildUrl(path, opts.query), {
    method,
    headers,
    body,
    cache: "no-store",
  });

  let json: Envelope<T> | undefined;
  try {
    json = (await res.json()) as Envelope<T>;
  } catch {
    // non-JSON response (e.g. gateway error)
  }

  if (!res.ok || !json || json.success === false) {
    const msg =
      (json as { message?: string } | undefined)?.message ??
      `Request failed (${res.status})`;
    const code = (json as { errorCode?: string } | undefined)?.errorCode;
    throw new ApiError(msg, res.status, code);
  }
  return json;
}

/** GET returning the unwrapped `data` (object or array). */
export async function apiGet<T>(path: string, query?: Query): Promise<T> {
  return (await request<T>("GET", path, { query })).data;
}

/** GET a paginated list → `{ items, meta }`. `data` is the items array. */
export async function apiGetPaged<T>(
  path: string,
  query?: Query,
): Promise<{ items: T[]; meta: PageMeta | null }> {
  const env = await request<T[]>("GET", path, { query });
  return { items: env.data ?? [], meta: env.meta ?? null };
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return (await request<T>("POST", path, { body })).data;
}

export async function apiPut<T>(path: string, body?: unknown): Promise<T> {
  return (await request<T>("PUT", path, { body })).data;
}

export async function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  return (await request<T>("PATCH", path, { body })).data;
}

export async function apiDelete<T>(path: string, body?: unknown): Promise<T> {
  return (await request<T>("DELETE", path, { body })).data;
}
