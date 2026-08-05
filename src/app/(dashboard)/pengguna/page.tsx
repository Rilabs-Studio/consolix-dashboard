import { apiGetPaged } from "@/lib/api-client";
import type { AppUser } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { getCurrentAdmin } from "@/lib/session";
import { hasRole } from "@/lib/constants";
import { setUserActive } from "@/server/actions/users";
import { PageHeader } from "@/components/layout/page-header";
import { Table, THead, TBody, TR, TH, TD, EmptyRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import Link from "next/link";

export default async function PenggunaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page } = await searchParams;
  const admin = await getCurrentAdmin();
  const canToggle = hasRole(admin?.role, "ADMIN");
  const { items: users, meta } = await apiGetPaged<AppUser>("/admin/users", {
    search: q,
    page: page ?? 1,
    limit: 20,
  });

  return (
    <div>
      <PageHeader title="Pengguna" description="Pelanggan aplikasi Consolix." />
      <div className="mb-4 flex items-center justify-between gap-3">
        <form className="flex gap-2">
          <input
            name="q"
            defaultValue={q}
            placeholder="Cari nama / nomor…"
            className="h-9 w-64 rounded-md border border-slate-300 bg-white px-3 text-sm"
          />
          <Button type="submit" variant="outline" size="sm">
            Cari
          </Button>
        </form>
        <Link href="/pengguna/admin" className={buttonVariants({ variant: "outline", size: "sm" })}>
          Kelola Admin & Kasir
        </Link>
      </div>
      <Table>
        <THead>
          <TR>
            <TH>Nama</TH>
            <TH>Nomor</TH>
            <TH>Poin</TH>
            <TH>Level</TH>
            <TH>Terdaftar</TH>
            <TH>Status</TH>
            {canToggle && <TH></TH>}
          </TR>
        </THead>
        <TBody>
          {users.length === 0 && <EmptyRow colSpan={7} />}
          {users.map((u) => (
            <TR key={u.id}>
              <TD className="font-medium">{u.name}</TD>
              <TD>{u.phone ?? '—'}</TD>
              <TD>{u.currentPoints}</TD>
              <TD>Lv {u.level}</TD>
              <TD>{formatDate(u.createdAt)}</TD>
              <TD>
                {u.isActive ? <Badge tone="green">Aktif</Badge> : <Badge tone="red">Nonaktif</Badge>}
              </TD>
              {canToggle && (
                <TD>
                  <form action={setUserActive}>
                    <input type="hidden" name="id" value={u.id} />
                    <input type="hidden" name="active" value={u.isActive ? "false" : "true"} />
                    <Button type="submit" variant="ghost" size="sm">
                      {u.isActive ? "Nonaktifkan" : "Aktifkan"}
                    </Button>
                  </form>
                </TD>
              )}
            </TR>
          ))}
        </TBody>
      </Table>
      {meta && meta.totalPages > 1 && (
        <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
          <span>
            Hal {meta.page}/{meta.totalPages} · {meta.totalItems} pengguna
          </span>
          {meta.hasPrevPage && (
            <Link href={`/pengguna?q=${q ?? ""}&page=${meta.page - 1}`} className="underline">
              ‹ Sebelumnya
            </Link>
          )}
          {meta.hasNextPage && (
            <Link href={`/pengguna?q=${q ?? ""}&page=${meta.page + 1}`} className="underline">
              Berikutnya ›
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
