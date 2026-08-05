import { redirect } from "next/navigation";

// Daftar member = halaman /pengguna; halaman ini meneruskan ke pengaturan tier.
export default function MemberPage() {
  redirect("/member/tier");
}
