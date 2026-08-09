import { apiGetPaged } from "@/lib/api-client";
import { FNB_ORDER_STATUS_LABEL, PAYMENT_METHOD_LABEL, type FnbOrderStatus } from "@/lib/constants";
import { formatDateTime, formatRupiah } from "@/lib/utils";
import { setFnbOrderStatus, settleFnbOrder } from "@/server/actions/fnb";
import { PageHeader } from "@/components/layout/page-header";
import { Table, THead, TBody, TR, TH, TD, EmptyRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface FnbOrder {
  id: string;
  code: string;
  status: FnbOrderStatus;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  customerName: string | null;
  customerPhone: string | null;
  /** Terisi = order menempel ke sesi (dibayar saat checkout sesi, bukan di sini). */
  bookingId: string | null;
  createdAt: string;
  items: { name: string; qty: number }[];
}

const TONE: Record<FnbOrderStatus, "yellow" | "blue" | "green" | "red"> = {
  pending: "yellow",
  preparing: "blue",
  served: "green",
  cancelled: "red",
};

async function setStatusVoid(fd: FormData): Promise<void> {
  "use server";
  await setFnbOrderStatus(fd);
}

async function settleVoid(fd: FormData): Promise<void> {
  "use server";
  await settleFnbOrder(fd);
}

export default async function PesananFnbPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const { items: orders } = await apiGetPaged<FnbOrder>("/admin/fnb/orders", {
    status,
    limit: 50,
  });

  return (
    <div>
      <PageHeader title="Pesanan FnB" description="Antrean dapur + pembayaran pickup." />
      <div className="mb-4 flex gap-2 text-sm">
        <a
          href="/fnb/pesanan"
          className={`rounded-full px-3 py-1 ${!status ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"}`}
        >
          Semua
        </a>
        {(Object.keys(FNB_ORDER_STATUS_LABEL) as FnbOrderStatus[]).map((s) => (
          <a
            key={s}
            href={`/fnb/pesanan?status=${s}`}
            className={`rounded-full px-3 py-1 ${status === s ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"}`}
          >
            {FNB_ORDER_STATUS_LABEL[s]}
          </a>
        ))}
      </div>
      <Table>
        <THead>
          <TR>
            <TH>Kode</TH>
            <TH>Waktu</TH>
            <TH>Item</TH>
            <TH>Total</TH>
            <TH>Bayar</TH>
            <TH>Status</TH>
            <TH></TH>
          </TR>
        </THead>
        <TBody>
          {orders.length === 0 && <EmptyRow colSpan={7} />}
          {orders.map((o) => (
            <TR key={o.id}>
              <TD className="font-medium">
                {o.code}
                {o.customerName && (
                  <p className="text-xs text-slate-400">
                    {o.customerName}
                    {o.customerPhone && ` · ${o.customerPhone}`}
                  </p>
                )}
              </TD>
              <TD>{formatDateTime(o.createdAt)}</TD>
              <TD className="text-sm">
                {o.items?.map((i) => `${i.name}×${i.qty}`).join(", ")}
              </TD>
              <TD>{formatRupiah(o.totalAmount)}</TD>
              <TD>
                {o.bookingId ? (
                  <Badge tone="blue">Tagihan sesi</Badge>
                ) : (
                  <>
                    {PAYMENT_METHOD_LABEL[o.paymentMethod as keyof typeof PAYMENT_METHOD_LABEL] ??
                      o.paymentMethod}{" "}
                    {o.paymentStatus === "paid" ? (
                      <Badge tone="green">Lunas</Badge>
                    ) : (
                      <Badge tone="yellow">Belum</Badge>
                    )}
                  </>
                )}
              </TD>
              <TD>
                <Badge tone={TONE[o.status]}>{FNB_ORDER_STATUS_LABEL[o.status]}</Badge>
              </TD>
              <TD>
                <div className="flex items-center gap-1">
                  {o.status === "pending" && (
                    <form action={setStatusVoid}>
                      <input type="hidden" name="id" value={o.id} />
                      <input type="hidden" name="status" value="preparing" />
                      <Button type="submit" variant="ghost" size="sm">
                        Siapkan
                      </Button>
                    </form>
                  )}
                  {["pending", "preparing"].includes(o.status) && (
                    <form action={setStatusVoid}>
                      <input type="hidden" name="id" value={o.id} />
                      <input type="hidden" name="status" value="served" />
                      <Button type="submit" size="sm">
                        Sajikan
                      </Button>
                    </form>
                  )}
                  {/* Order sesi dibayar di checkout sesi — settle di sini = dobel tagih. */}
                  {!o.bookingId && o.paymentStatus !== "paid" && o.status !== "cancelled" && (
                    <form action={settleVoid}>
                      <input type="hidden" name="id" value={o.id} />
                      <input type="hidden" name="paymentMethod" value="cash" />
                      <Button type="submit" variant="outline" size="sm">
                        Bayar Tunai
                      </Button>
                    </form>
                  )}
                  {["pending", "preparing"].includes(o.status) && (
                    <form action={setStatusVoid}>
                      <input type="hidden" name="id" value={o.id} />
                      <input type="hidden" name="status" value="cancelled" />
                      <Button type="submit" variant="ghost" size="sm">
                        Batal
                      </Button>
                    </form>
                  )}
                </div>
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </div>
  );
}
