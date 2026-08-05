import { apiGet } from "@/lib/api-client";
import type { Booking, CashShift, ConsoleUnit } from "@/lib/types";
import { PageHeader } from "@/components/layout/page-header";
import { KasirClient } from "./kasir-client";

// Initial state comes from RSC; the client then patches it live via Socket.IO
// (namespace /live) — no polling.
export default async function KasirPage() {
  const [units, sessions, shift] = await Promise.all([
    apiGet<ConsoleUnit[]>("/consoles/units"),
    apiGet<Booking[]>("/admin/sessions/active"),
    apiGet<CashShift | null>("/admin/shifts/current"),
  ]);

  return (
    <div>
      <PageHeader title="Kasir" description="Papan konsol live · walk-in · check-in QR · pembayaran." />
      <KasirClient initialUnits={units} initialSessions={sessions} shift={shift} />
    </div>
  );
}
