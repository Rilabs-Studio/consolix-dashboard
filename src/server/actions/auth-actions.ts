"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";

export async function loginAction(
  _prev: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/",
    });
  } catch (error) {
    // AuthError = bad credentials; anything else (e.g. the success redirect) re-throws.
    if (error instanceof AuthError) {
      return "Email atau password salah.";
    }
    throw error;
  }
}
