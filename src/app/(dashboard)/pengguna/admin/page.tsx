import { apiGet } from "@/lib/api-client";
import type { AdminUser } from "@/lib/types";
import { ADMIN_ROLE_LABEL, toAdminRole } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { setAdminActive, deleteAdmin } from "@/server/actions/admins";
import { PageHeader } from "@/components/layout/page-header";
import { Table, THead, TBody, TR, TH, TD, EmptyRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDelete } from "@/components/forms/form-controls";
import { AdminForm } from "./admin-form";

interface ApiAdmin {
  id: string;
  email: string;
  name: string;
  role: string;
  active: boolean;
  createdAt: string;
}

export default async function AdminAccountsPage() {
  const rows = await apiGet<ApiAdmin[]>("/admin/admins");
  const admins: AdminUser[] = rows.map((a) => ({ ...a, role: toAdminRole(a.role) }));

  return (
    <div>
      <PageHeader
        title="Admin & Kasir"
        description="Akun back-office. Hanya Super Admin yang bisa mengelola halaman ini."
      />
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Table>
          <THead>
            <TR>
              <TH>Nama</TH>
              <TH>Email</TH>
              <TH>Role</TH>
              <TH>Dibuat</TH>
              <TH>Status</TH>
              <TH></TH>
            </TR>
          </THead>
          <TBody>
            {admins.length === 0 && <EmptyRow colSpan={6} />}
            {admins.map((a) => (
              <TR key={a.id}>
                <TD className="font-medium">{a.name}</TD>
                <TD>{a.email}</TD>
                <TD>
                  <Badge tone={a.role === "SUPER_ADMIN" ? "purple" : a.role === "CASHIER" ? "blue" : "default"}>
                    {ADMIN_ROLE_LABEL[a.role]}
                  </Badge>
                </TD>
                <TD>{formatDate(a.createdAt)}</TD>
                <TD>{a.active ? <Badge tone="green">Aktif</Badge> : <Badge tone="red">Nonaktif</Badge>}</TD>
                <TD>
                  <div className="flex items-center gap-1">
                    <form action={setAdminActive}>
                      <input type="hidden" name="id" value={a.id} />
                      <input type="hidden" name="active" value={a.active ? "false" : "true"} />
                      <Button type="submit" variant="ghost" size="sm">
                        {a.active ? "Nonaktifkan" : "Aktifkan"}
                      </Button>
                    </form>
                    <ConfirmDelete action={deleteAdmin} id={a.id} label={`Hapus akun ${a.email}?`} />
                  </div>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
        <AdminForm />
      </div>
    </div>
  );
}
