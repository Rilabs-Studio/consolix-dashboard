import { getTvDevices, getTvPackages } from "@/lib/rdms";
import { PageHeader } from "@/components/layout/page-header";
import { MejaTvClient } from "./meja-tv-client";

// Initial state dari RSC; selanjutnya client di-patch tiap detik oleh
// WebSocket backend Go RDMS (bukan Socket.IO NestJS) — lihat use-rdms-state.
export default async function MejaTvPage() {
  const [devices, packages] = await Promise.all([getTvDevices(), getTvPackages()]);

  return (
    <div>
      <PageHeader
        title="Meja TV"
        description="Monitoring rental TV real-time · timer, broadcast, kontrol audio."
      />
      <MejaTvClient initialDevices={devices} packages={packages} />
    </div>
  );
}
