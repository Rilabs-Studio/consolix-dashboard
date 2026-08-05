import { getTvDevices } from "@/lib/rdms";
import { PageHeader } from "@/components/layout/page-header";
import { PerangkatClient } from "./perangkat-client";

// Initial state dari RSC; status online di-patch live oleh WebSocket Go RDMS.
export default async function PerangkatPage() {
  const devices = await getTvDevices();

  return (
    <div>
      <PageHeader
        title="Perangkat TV"
        description="TV Android rental — terdaftar otomatis saat pertama kali mengirim heartbeat."
      />
      <PerangkatClient initialDevices={devices} />
    </div>
  );
}
