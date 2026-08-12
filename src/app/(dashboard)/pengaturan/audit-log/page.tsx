import { apiGetPaged } from "@/lib/api-client";
import type { AuditLog } from "@/lib/types";
import { requireRole } from "@/lib/session";
import { PageHeader } from "@/components/layout/page-header";
import { AuditTable } from "./audit-table";

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ entity?: string; page?: string }>;
}) {
  await requireRole("ADMIN");
  const { entity, page } = await searchParams;
  const { items: logs } = await apiGetPaged<AuditLog>("/admin/audit-logs", {
    entity,
    page: page ?? 1,
    limit: 50,
  });

  return (
    <div>
      <PageHeader
        title="Audit Log"
        description="Jejak aksi admin & kasir — field sensitif otomatis di-redact, retensi 365 hari."
      />
      <form className="mb-4 flex flex-wrap items-end gap-2">
        <div className="min-w-0 flex-1 sm:flex-none">
          <label className="mb-1 block text-xs font-medium text-slate-500">Entity</label>
          <input
            name="entity"
            defaultValue={entity ?? ""}
            placeholder="mis. cash_shift"
            className="h-10 w-full rounded-md border border-slate-300 bg-white px-2 text-base sm:h-9 sm:w-56 sm:text-sm"
          />
        </div>
        <button
          type="submit"
          className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm hover:bg-slate-50 sm:h-9"
        >
          Filter
        </button>
      </form>
      <AuditTable logs={logs} />
    </div>
  );
}
