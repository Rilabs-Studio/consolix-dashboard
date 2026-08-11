import { apiGet } from "@/lib/api-client";
import type { Booking, CashShift, ConsoleUnit, FnbMenuCategory } from "@/lib/types";
import { PageHeader } from "@/components/layout/page-header";
import { PosClient } from "./pos-client";

// Jaring pengaman untuk pesanan yang tidak lewat app atau QR meja: kasir
// mengetiknya sendiri di counter. Dua mode — jual lepas (bayar sekarang, butuh
// shift terbuka) atau tempel ke sesi berjalan (dibayar saat checkout sesi).
export default async function KasirFnbPage() {
  const [menu, sessions, units, shift] = await Promise.all([
    apiGet<FnbMenuCategory[]>("/admin/fnb/menu"),
    apiGet<Booking[]>("/admin/sessions/active"),
    apiGet<ConsoleUnit[]>("/consoles/units"),
    apiGet<CashShift | null>("/admin/shifts/current"),
  ]);

  return (
    <div>
      <PageHeader
        title="Kasir FnB"
        description="Input manual pesanan makanan & minuman di counter."
      />
      <PosClient menu={menu} sessions={sessions} units={units} shiftOpen={shift?.status === "open"} />
    </div>
  );
}
