import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { authConfig } from "@/auth.config";
import { toAdminRole } from "@/lib/constants";

const credsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const API_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/v1";

// NestJS `POST /v1/auth/admin/login` → { success, data: AdminSession }
interface AdminSession {
  accessToken: string;
  refreshToken: string;
  /** Access-token lifetime in seconds (e.g. 900 = 15m). */
  expiresIn: number;
  user: { id: string; email: string; name: string; role: string; active: boolean };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = credsSchema.safeParse(raw);
        if (!parsed.success) return null;

        let res: Response;
        try {
          res = await fetch(`${API_URL}/auth/admin/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(parsed.data),
            cache: "no-store",
          });
        } catch {
          return null; // backend unreachable
        }
        if (!res.ok) return null;

        const json = (await res.json()) as { success: boolean; data?: AdminSession };
        if (!json.success || !json.data) return null;

        const { accessToken, refreshToken, expiresIn, user } = json.data;
        // Carry the JWT + role into the NextAuth token (see jwt callback).
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: toAdminRole(user.role), // normalize lowercase → dashboard uppercase
          accessToken,
          refreshToken,
          // Absolute expiry so the jwt callback can refresh ahead of time.
          expiresAt: Date.now() + (expiresIn ?? 0) * 1000,
        };
      },
    }),
  ],
});
