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
