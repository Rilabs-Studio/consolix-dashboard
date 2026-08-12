"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Input, Label } from "@/components/ui/input";
import { searchUsers, type UserLookupItem } from "@/server/actions/users";

/**
 * Combobox pencarian user terdaftar (nama/nomor) untuk form kasir.
 * User terpilih dikirim sebagai hidden input `name` (default "userId").
 */
export function UserPicker({ name = "userId", label = "Member" }: { name?: string; label?: string }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserLookupItem[]>([]);
  const [selected, setSelected] = useState<UserLookupItem | null>(null);
  const [open, setOpen] = useState(false);
  const [, startSearch] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seq = useRef(0); // drops stale responses that resolve out of order
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => () => clearTimeout(timer.current ?? undefined), []);

  // Di layar sentuh tidak ada padanan blur untuk "klik di luar" — tanpa ini
  // daftar saran menggantung setelah user menyentuh bagian lain form.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  function onQueryChange(value: string) {
    setQuery(value);
    setSelected(null);
    if (timer.current) clearTimeout(timer.current);
    if (value.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    timer.current = setTimeout(() => {
      const requestId = ++seq.current;
      startSearch(async () => {
        const users = await searchUsers(value);
        if (requestId !== seq.current) return;
        setResults(users);
        setOpen(true);
      });
    }, 300);
  }

  function select(user: UserLookupItem) {
    setSelected(user);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative">
      <Label>{label}</Label>
      {selected ? (
        <div className="flex h-10 items-center justify-between rounded-md border border-indigo-200 bg-indigo-50 px-2 text-sm sm:h-9">
          <span className="flex items-center gap-2 truncate">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-200 text-[11px] font-semibold text-indigo-700">
              {selected.name.charAt(0).toUpperCase()}
            </span>
            <span className="truncate font-medium text-slate-900">{selected.name}</span>
            {/* Nomor HP mengalah lebih dulu di layar sempit — nama yang penting. */}
            <span className="hidden shrink-0 text-xs text-slate-500 sm:inline">
              {selected.phone ?? "Tanpa nomor HP"}
            </span>
          </span>
          <button
            type="button"
            aria-label="Hapus pilihan"
            className="ml-2 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-indigo-100 hover:text-slate-600"
            onClick={() => {
              setSelected(null);
              setQuery("");
              setResults([]);
            }}
          >
            ✕
          </button>
        </div>
      ) : (
        <Input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Cari nama / nomor…"
          autoComplete="off"
        />
      )}
      <input type="hidden" name={name} value={selected?.id ?? ""} />

      {open && !selected && (
        // z-50 & max-h relatif viewport: picker ini sering dipakai di dalam
        // Modal, dan di HP dengan keyboard terbuka ruangnya sangat sempit.
        <ul className="absolute z-50 mt-1 max-h-[min(14rem,40dvh)] w-full overflow-auto overscroll-contain rounded-md border border-slate-200 bg-white py-1 shadow-lg">
          {results.length === 0 && (
            <li className="px-3 py-2 text-sm text-slate-400">User tidak ditemukan.</li>
          )}
          {results.map((u) => (
            <li key={u.id}>
              <button
                type="button"
                onClick={() => select(u)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-indigo-50"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600">
                  {u.name.charAt(0).toUpperCase()}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-medium text-slate-900">{u.name}</span>
                  <span className="block text-xs text-slate-500">{u.phone ?? "Tanpa nomor HP"}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
