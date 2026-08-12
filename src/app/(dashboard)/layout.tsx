import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/session";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { RefreshableMain } from "@/components/layout/refreshable-main";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/login");

  return (
    // h-dvh, bukan h-screen: bar browser mobile membuat 100vh lebih tinggi dari
    // viewport yang terlihat, sehingga shell terpotong.
    <div className="flex h-dvh overflow-hidden bg-slate-50">
      <Sidebar role={admin.role} />
      {/* min-w-0 supaya tabel lebar men-scroll di dalam <main>, bukan
          merentangkan kolom ini — flex item default-nya min-width:auto. */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar name={admin.name} role={admin.role} />
        {/* Tarik ke bawah untuk menyegarkan — PWA standalone tidak punya tombol
            reload, dan scroller-nya <main>, bukan <body>. */}
        <RefreshableMain className="flex-1 overflow-x-hidden overflow-y-auto p-4 pb-safe sm:p-5 lg:p-6">
          {children}
        </RefreshableMain>
      </div>
    </div>
  );
}
