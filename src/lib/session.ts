import { auth } from "@/auth";
import { hasRole, type AdminRole } from "@/lib/constants";

export async function getCurrentAdmin() {
  const session = await auth();
  // A broken refresh chain means the session is no longer usable → treat as
  // logged out so the dashboard layout redirects to /login.
  if (session?.error) return null;
  return session?.user ?? null;
}

/** Throws if the current admin lacks the minimum role. Use inside Server Actions. */
export async function requireRole(min: AdminRole = "OPERATOR") {
  const user = await getCurrentAdmin();
  if (!user) throw new Error("UNAUTHORIZED");
  if (!hasRole(user.role, min)) throw new Error("FORBIDDEN");
  return user;
}
