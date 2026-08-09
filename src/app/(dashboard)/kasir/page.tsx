import { apiGet } from "@/lib/api-client";
import { getTvDevices } from "@/lib/rdms";
import type { Booking, CashShift, ConsoleUnit } from "@/lib/types";
import { PageHeader } from "@/components/layout/page-header";
import { KasirClient } from "./kasir-client";

// Initial state dari RSC, lalu di-patch dua sumber live: Socket.IO NestJS
// (booking) dan WebSocket Go RDMS (kondisi fisik TV). Keduanya dijahit lewat
// ConsoleUnit.rdmsDeviceId — satu kartu per unit, bukan dua papan.
export default async function KasirPage() {
  const [units, sessions, shift, devices] = await Promise.all([
    apiGet<ConsoleUnit[]>("/consoles/units"),
    apiGet<Booking[]>("/admin/sessions/active"),
    apiGet<CashShift | null>("/admin/shifts/current"),
    getTvDevices(),
  ]);

  return (
    <div>
      <PageHeader
        title="Kasir"
        description="Papan konsol live · walk-in · check-in QR · kontrol TV · pembayaran."
      />
      <KasirClient
        initialUnits={units}
        initialSessions={sessions}
        shift={shift}
        initialDevices={devices}
      />
    </div>
  );
}
