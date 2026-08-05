import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role?: string;
    accessToken?: string;
    refreshToken?: string;
    /** Absolute epoch ms at which the access token expires. */
    expiresAt?: number;
  }
  interface Session {
    accessToken?: string;
    /** Set when the refresh chain breaks (refresh token expired/revoked). */
    error?: string;
    user: {
      id: string;
      role: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    accessToken?: string;
    refreshToken?: string;
    /** Absolute epoch ms at which the access token expires. */
    expiresAt?: number;
    /** Set when a refresh attempt fails so the session can force re-login. */
    error?: string;
  }
}
