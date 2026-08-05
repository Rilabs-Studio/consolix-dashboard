import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// The `authorized` callback in auth.config.ts handles redirect/gating logic.
// (Next 16 renamed the `middleware` file convention to `proxy`.)
export const { auth: proxy } = NextAuth(authConfig);

export default proxy;

export const config = {
  // Run on everything except Next internals and static assets.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
