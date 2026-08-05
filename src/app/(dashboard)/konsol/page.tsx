import Link from "next/link";
import { apiGet } from "@/lib/api-client";
import type { ConsoleUnit } from "@/lib/types";
import { CONSOLE_UNIT_STATUS_LABEL } from "@/lib/constants";
import { formatRupiah } from "@/lib/utils";
import { setUnitStatus } from "@/server/actions/consoles";
import { PageHeader } from "@/components/layout/page-header";
import { Table, THead, TBody, TR, TH, TD, EmptyRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";

const STATUS_TONE = {
  available: "green",
  in_use: "blue",
  booked: "yellow",
  maintenance: "red",
} as const;

export default async function KonsolPage() {
  const units = await apiGet<ConsoleUnit[]>("/admin/console-units");

  return (
    <div>
      <PageHeader
        title="Konsol"
        description="Unit fisik + status live."
        actionLabel="Tambah Unit"
        actionHref="/konsol/baru"
      />
      <div className="mb-4 flex gap-2">
        {[
          { href: "/konsol/tipe", label: "Tipe & Harga Dasar" },
          { href: "/konsol/game", label: "Katalog Game" },
          { href: "/konsol/harga", label: "Price Rules" },
          { href: "/konsol/jam-operasional", label: "Jam Operasional" },
        ].map((l) => (
          <Link key={l.href} href={l.href} className={buttonVariants({ variant: "outline", size: "sm" })}>
            {l.label}
          </Link>
        ))}
      </div>
      <Table>
        <THead>
          <TR>
            <TH>Kode</TH>
            <TH>Label</TH>
            <TH>Tipe</TH>
            <TH>Ruangan</TH>
            <TH>Harga Dasar/Jam</TH>
            <TH>Status</TH>
            <TH></TH>
          </TR>
        </THead>
        <TBody>
          {units.length === 0 && <EmptyRow colSpan={7} />}
          {units.map((u) => (
            <TR key={u.id}>
              <TD>
                <Link href={`/konsol/${u.id}`} className="font-medium text-indigo-700 hover:underline">
                  {u.code}
                </Link>
              </TD>
              <TD>
                <span className="flex items-center gap-1.5">
                  {u.displayLabel ?? "—"}
                  {u.rdmsDeviceId && <Badge tone="blue">TV terhubung</Badge>}
                </span>
              </TD>
              <TD>{u.consoleType?.name ?? "—"}</TD>
              <TD>{u.roomType === "vip" ? <Badge tone="purple">VIP</Badge> : "Reguler"}</TD>
              <TD>{formatRupiah(u.consoleType?.basePricePerHour)}</TD>
              <TD>
                <Badge tone={STATUS_TONE[u.status]}>{CONSOLE_UNIT_STATUS_LABEL[u.status]}</Badge>
              </TD>
              <TD>
                {(u.status === "available" || u.status === "maintenance") && (
                  <form action={setUnitStatus}>
                    <input type="hidden" name="id" value={u.id} />
                    <input
                      type="hidden"
                      name="status"
                      value={u.status === "available" ? "maintenance" : "available"}
                    />
                    <Button type="submit" variant="ghost" size="sm">
                      {u.status === "available" ? "Set Maintenance" : "Selesai Maintenance"}
                    </Button>
                  </form>
                )}
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </div>
  );
}
