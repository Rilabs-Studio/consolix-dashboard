# Pola UI

Ikuti pola halaman tetangga; jangan membuat komponen baru bila yang reusable
sudah ada.

## Anatomi modul

```
src/app/(dashboard)/<modul>/
  page.tsx        RSC async: await apiGetPaged → <PageHeader> + <Table>
  <x>-form.tsx    "use client": form HTML native → server action (tanpa react-hook-form)
  row-actions.tsx "use client": aksi per baris (Modal + ActionResult)
src/server/actions/<modul>.ts
```

## Komponen reusable (wajib dipakai ulang)

| Komponen | File |
|---|---|
| `Table THead TBody TR TH TD EmptyRow` | `ui/table.tsx` |
| `Button` + `buttonVariants` (default/secondary/outline/destructive/ghost/link) | `ui/button.tsx` |
| `Card CardHeader CardTitle CardContent` | `ui/card.tsx` |
| `Badge` (tone: green/blue/yellow/red/purple/default) | `ui/badge.tsx` |
| `Input Label Select Textarea` | `ui/input.tsx` |
| `Modal` | `ui/modal.tsx` |
| `PageHeader` (`actionLabel`+`actionHref`) | `layout/page-header.tsx` |
| `SubmitButton ConfirmDelete` | `forms/form-controls.tsx` |
| `ImagePreview` | `ui/image-preview.tsx` |
| `RevenueChart` (Recharts, dipakai Overview & Keuangan) | `charts/revenue-chart.tsx` |
| `NavList` (dipakai bersama Sidebar & MobileNav) + `getActiveHref` | `layout/nav-list.tsx`, `layout/nav.ts` |
| `Sidebar` (desktop, `hidden md:flex`) / `MobileNav` (drawer, `md:hidden`) | `layout/sidebar.tsx`, `layout/mobile-nav.tsx` |

## Aturan

- Semua copy **bahasa Indonesia**; uang `formatRupiah`; tanggal
  `formatDate`/`formatDateTime` (date-fns locale `id`).
- Filter list = `<form>` GET biasa dengan `searchParams` (Promise di Next 16 —
  wajib `await searchParams`).
- Form dalam Modal → action mengembalikan `ActionResult {error?}` dan error
  dirender inline; form halaman penuh boleh `redirect()`.
- Form action bertipe `Promise<void>`: bungkus action ber-`ActionResult`
  dengan inline `"use server"` void wrapper bila dipakai langsung di `<form action>`.
- Client component: hindari setState-di-effect (pakai adjust-during-render),
  hindari `useState(Date.now())` (impure — set di interval setelah mount).
- Ikon dari `lucide-react`, warna aksen indigo/emerald mengikuti komponen yang ada.

## Mobile-first (wajib)

Dashboard dipakai kasir dari HP — `start_url` PWA-nya `/kasir`. Semua kelas dasar
adalah tampilan HP; `sm:`/`md:`/`lg:` yang menambah kepadatan, bukan sebaliknya.
`md` (768px) breakpoint struktural (sidebar muncul, tabel berhenti jadi kartu),
`sm` (640px) breakpoint kepadatan (tinggi kontrol, ukuran font, `flex-col → flex-row`).
Jangan pernah mendeteksi mobile lewat JS — tidak ada `useMediaQuery` di repo ini.

- **Tabel.** `<Table>` default `layout="cards"`: di bawah `md` tiap baris jadi kartu
  label↔nilai. **Setiap `<TD>` wajib punya `data-label` yang menyalin `<TH>`-nya**;
  sel aksi sengaja dibiarkan tanpa label agar memakai lebar penuh. Pakai
  `layout="scroll" stickyFirstColumn minWidth="…"` hanya untuk tabel yang gunanya
  membandingkan antar baris (mis. rekap tutup kasir).
- **Toolbar & filter** selalu `flex flex-wrap gap-2`. Strip tab panjang pakai
  edge-bleed: `-mx-4 overflow-x-auto px-4 no-scrollbar sm:mx-0 sm:px-0` dengan pil
  ber-`shrink-0 whitespace-nowrap`.
- **Grid form** mulai dari satu kolom: `grid gap-3 sm:grid-cols-2`. Jangan tulis
  `grid-cols-2`/`grid-cols-3` tanpa prefix.
- **CTA** di header/footer form: `w-full sm:w-auto`.
- **Input.** Selalu lewat primitif `Input`/`Select`/`Textarea` — ukurannya
  `text-base sm:text-sm` karena font di bawah 16px membuat iOS Safari zoom saat
  field difokuskan. `<input>`/`<select>` mentah harus meniru kelas itu.
- **Modal** di-portal ke `body` dan tampil sebagai bottom sheet di HP. Karena itu
  `<form>` harus berada **di dalam** Modal, bukan Modal di dalam `<form>`: field
  yang pindah ke portal lepas dari form DOM dan hilang dari `FormData`. Butuh sheet
  di tengah form (mis. keranjang POS)? Pakai panel `fixed` lokal, bukan `Modal`.
- **Safe area.** Utility `pt-safe` / `pb-safe` / `px-safe` (definisinya di
  `globals.css`) untuk elemen yang menempel tepi layar; aktif karena root layout
  mengekspor `viewportFit: "cover"`.
- Tinggi viewport pakai `dvh`, bukan `vh` — bar browser mobile membuat `100vh`
  lebih tinggi dari area yang terlihat.
