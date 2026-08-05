import { apiGet } from "@/lib/api-client";
import { getTvDevices } from "@/lib/rdms";
import type { ConsoleType } from "@/lib/types";
import { createConsoleUnit } from "@/server/actions/consoles";
import { PageHeader } from "@/components/layout/page-header";
import { UnitForm } from "../unit-form";

export default async function KonsolBaruPage() {
  const [types, devices] = await Promise.all([
    apiGet<ConsoleType[]>("/admin/console-types"),
    getTvDevices(),
  ]);
  return (
    <div>
      <PageHeader title="Tambah Unit" description="Unit konsol fisik baru." />
      <UnitForm action={createConsoleUnit} types={types} devices={devices} />
    </div>
  );
}
