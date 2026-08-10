"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, Trash2 } from "lucide-react";
import type { Booking, ConsoleUnit, FnbMenuCategory } from "@/lib/types";
import { formatRupiah, formatTime } from "@/lib/utils";
import { createFnbOrder } from "@/server/actions/fnb";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { SubmitButton } from "@/components/forms/form-controls";

/** Jual lepas = bayar sekarang (butuh shift); tempel = dibayar saat checkout sesi. */
type Mode = "direct" | "session";

export function PosClient({
  menu,
  sessions,
  units,
  shiftOpen,
}: {
  menu: FnbMenuCategory[];
  sessions: Booking[];
  units: ConsoleUnit[];
  shiftOpen: boolean;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();

  const [activeCategory, setActiveCategory] = useState(menu[0]?.id ?? "");
  const [cart, setCart] = useState<Record<string, number>>({});
  // Tanpa shift terbuka, jual lepas pasti ditolak backend (NO_OPEN_SHIFT) —
  // jadi mulai dari mode yang masih bisa dipakai.
  const [mode, setMode] = useState<Mode>(shiftOpen ? "direct" : "session");
  const [error, setError] = useState<string | null>(null);

  const itemsById = useMemo(
    () => new Map(menu.flatMap((c) => c.items).map((i) => [i.id, i])),
    [menu]
  );
  const unitLabel = useMemo(() => {
    const byId = new Map(units.map((u) => [u.id, u.displayLabel || u.code]));
    return (unitId: string) => byId.get(unitId) ?? "Unit";
  }, [units]);

  const lines = Object.entries(cart)
    .map(([itemId, qty]) => ({ item: itemsById.get(itemId), qty }))
    .filter((l): l is { item: NonNullable<typeof l.item>; qty: number } => Boolean(l.item));
  const total = lines.reduce((sum, l) => sum + l.item.price * l.qty, 0);

  function bump(itemId: string, delta: number) {
    setError(null);
    setCart((prev) => {
      const stock = itemsById.get(itemId)?.stock ?? 0;
      const next = Math.min(Math.max((prev[itemId] ?? 0) + delta, 0), stock);
      const copy = { ...prev };
      if (next === 0) delete copy[itemId];
      else copy[itemId] = next;
      return copy;
    });
  }

  const category = menu.find((c) => c.id === activeCategory) ?? menu[0];

  return (
    <form
      ref={formRef}
      action={(fd) =>
        startTransition(async () => {
          const result = await createFnbOrder(fd);
          if (result.error) {
            setError(result.error);
            return;
          }
          setError(null);
          setCart({});
          formRef.current?.reset();
          router.refresh();
        })
      }
      className="grid gap-6 lg:grid-cols-[1fr_360px]"
    >
      {/* ---- Menu ---- */}
      <div>
        {menu.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-slate-500">
              Belum ada item menu yang aktif. Tambahkan lewat menu <strong>FnB</strong> di Master
              Data.
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap gap-2 text-sm">
              {menu.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setActiveCategory(c.id)}
                  className={`rounded-full px-3 py-1 ${
                    c.id === category?.id
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {category?.items.length === 0 && (
                <p className="col-span-full text-sm text-slate-500">
                  Tidak ada item di kategori ini.
                </p>
              )}
              {category?.items.map((item) => {
                const habis = item.stock <= 0;
                const inCart = cart[item.id] ?? 0;
                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={habis || inCart >= item.stock}
                    onClick={() => bump(item.id, 1)}
                    className={`rounded-xl border p-3 text-left transition-colors ${
                      habis
                        ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-60"
                        : "border-slate-200 bg-white hover:border-indigo-400 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-60"
                    }`}
                  >
                    <p className="text-sm font-medium text-slate-900">{item.name}</p>
                    <p className="mt-1 text-sm text-indigo-600">{formatRupiah(item.price)}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {habis ? "Stok habis" : `Stok ${item.stock}`}
                      {inCart > 0 && ` · ${inCart} di keranjang`}
                    </p>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ---- Keranjang & pembayaran ---- */}
      <Card className="h-fit lg:sticky lg:top-4">
        <CardContent className="space-y-4 pt-6">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Keranjang</h2>
            {lines.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">Pilih item dari menu di sebelah kiri.</p>
            ) : (
              <ul className="mt-2 divide-y divide-slate-100">
                {lines.map(({ item, qty }) => (
                  <li key={item.id} className="flex items-center gap-2 py-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-slate-900">{item.name}</p>
                      <p className="text-xs text-slate-500">
                        {qty} × {formatRupiah(item.price)}
                      </p>
                    </div>
                    <span className="text-sm tabular-nums text-slate-700">
                      {formatRupiah(item.price * qty)}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        title="Kurangi"
                        onClick={() => bump(item.id, -1)}
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        title="Tambah"
                        disabled={qty >= item.stock}
                        onClick={() => bump(item.id, 1)}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-slate-200 pt-3">
            <span className="text-sm font-medium text-slate-700">Total</span>
            <span className="text-lg font-semibold tabular-nums text-slate-900">
              {formatRupiah(total)}
            </span>
          </div>

          {/* Keranjang dikirim sebagai satu JSON supaya itemId & qty tetap berpasangan. */}
          <input
            type="hidden"
            name="items"
            value={JSON.stringify(lines.map((l) => ({ itemId: l.item.id, qty: l.qty })))}
          />

          <div>
            <Label>Cara bayar</Label>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <button
                type="button"
                onClick={() => setMode("direct")}
                disabled={!shiftOpen}
                className={`rounded-md border px-3 py-2 ${
                  mode === "direct"
                    ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                    : "border-slate-300 text-slate-600 disabled:opacity-50"
                }`}
              >
                Jual lepas
              </button>
              <button
                type="button"
                onClick={() => setMode("session")}
                className={`rounded-md border px-3 py-2 ${
                  mode === "session"
                    ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                    : "border-slate-300 text-slate-600"
                }`}
              >
                Tempel ke sesi
              </button>
            </div>
            {!shiftOpen && (
              <p className="mt-2 text-xs text-amber-600">
                Shift belum dibuka — jual lepas butuh shift terbuka. Buka dulu di halaman Kasir.
              </p>
            )}
          </div>

          {mode === "direct" ? (
            <div>
              <Label htmlFor="paymentMethod">Metode</Label>
              <Select id="paymentMethod" name="paymentMethod" defaultValue="cash">
                <option value="cash">Tunai</option>
                <option value="qris_manual">QRIS</option>
              </Select>
            </div>
          ) : (
            <div>
              <Label htmlFor="bookingId">Sesi berjalan</Label>
              {sessions.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Tidak ada sesi berjalan. Pakai mode jual lepas.
                </p>
              ) : (
                <Select id="bookingId" name="bookingId" required>
                  <option value="">— Pilih sesi —</option>
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {unitLabel(s.consoleUnitId)} · {s.customerName || s.userName || s.code} ·
                      sampai {formatTime(s.endAt)}
                    </option>
                  ))}
                </Select>
              )}
              <p className="mt-1 text-xs text-slate-500">
                Masuk ke tagihan sesi, dibayar sekali saat checkout.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="customerName">Nama</Label>
              <Input id="customerName" name="customerName" placeholder="Opsional" />
            </div>
            <div>
              <Label htmlFor="customerPhone">No. HP</Label>
              <Input id="customerPhone" name="customerPhone" placeholder="Opsional" />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Catatan</Label>
            <Textarea id="notes" name="notes" rows={2} placeholder="Mis. tanpa sambal" />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2">
            {/* SubmitButton menaruh {...props} setelah disabled={pending} milik
                useFormStatus, jadi status transisi ikut dibawa di sini. */}
            <SubmitButton className="flex-1" disabled={pending || lines.length === 0}>
              Simpan pesanan
            </SubmitButton>
            {lines.length > 0 && (
              <Button type="button" variant="ghost" size="icon" title="Kosongkan keranjang" onClick={() => setCart({})}>
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
