import type { NextAuthConfig } from "next-auth";
import { refreshAccessToken } from "@/lib/refresh-token";

// Refresh the access token this many ms BEFORE it actually expires, to absorb
// clock skew and in-flight latency (access token lives ~15m, refresh ~30d).
const REFRESH_SKEW_MS = 60_000;

// Edge-safe config (no Node-only deps). Used by middleware and extended in
// src/auth.ts with the Credentials provider that calls the NestJS backend.
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      // A session whose refresh chain has broken (refresh token expired/revoked)
      // counts as logged out, so protected routes bounce to /login instead of
      // looping, and /login renders the form instead of redirecting home.
      const isLoggedIn = !!auth?.user && !auth?.error;
      const isOnLogin = nextUrl.pathname.startsWith("/login");
      const isAuthApi = nextUrl.pathname.startsWith("/api/auth");

      // Public: NextAuth's own endpoints.
      if (isAuthApi) return true;

      if (isOnLogin) {
        if (isLoggedIn) return Response.redirect(new URL("/", nextUrl));
        return true;
      }

      return isLoggedIn;
    },
    async jwt({ token, user }) {
      // 1. Initial sign-in: seed the token from authorize()'s return value.
      if (user) {
        const u = user as {
          id?: string;
          role?: string;
          accessToken?: string;
          refreshToken?: string;
          expiresAt?: number;
        };
        token.id = u.id;
        token.role = u.role ?? "OPERATOR";
        token.accessToken = u.accessToken;
        token.refreshToken = u.refreshToken;
        token.expiresAt = u.expiresAt;
        delete token.error;
        return token;
      }

      // 2. Access token still fresh → reuse it untouched.
      const expiresAt = token.expiresAt as number | undefined;
      if (expiresAt && Date.now() < expiresAt - REFRESH_SKEW_MS) {
        return token;
      }

      // 3. Access token is (about to be) expired → refresh it proactively, so
      //    api-client never sends a stale token. This callback runs on every
      //    `auth()` call, which is the App-Router equivalent of a 401 retry
      //    interceptor — only it refreshes ahead of the request, not after it.
      const refreshToken = token.refreshToken as string | undefined;
      if (!refreshToken) {
        return { ...token, error: "RefreshAccessTokenError" };
      }
      try {
        const refreshed = await refreshAccessToken(refreshToken);
        token.accessToken = refreshed.accessToken;
        token.expiresAt = refreshed.expiresAt;
        // refreshToken is intentionally left as-is — the backend doesn't rotate it.
        delete token.error;
        return token;
      } catch {
        // Refresh token expired (30d) or was revoked → force a re-login.
        return { ...token, error: "RefreshAccessTokenError" };
      }
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      session.accessToken = token.accessToken as string | undefined;
      // Surfaced (not the refresh token itself) so server code can detect a
      // dead session and bounce to /login.
      session.error = token.error as string | undefined;
      return session;
    },
  },
} satisfies NextAuthConfig;
