# consolix-dashboard — Panduan untuk Claude

Back-office (POS kasir + CMS + laporan) sistem rental PlayStation **Consolix**. Dashboard ini
**UI murni** di atas backend NestJS (`../consolix-backend`) — **tidak punya database/ORM sendiri**.
Setiap halaman baca/tulis lewat API `/v1` & `/v1/admin/*`, terautentikasi JWT dari
`POST /v1/auth/admin/login`.

Sumber kebenaran bentuk JSON: [`../consolix-backend/docs/api-contract.md`](../consolix-backend/docs/api-contract.md)
— **baca sebelum menulis kode yang menyentuh data**. PRD per fitur:
[`../consolix-backend/docs/prd/`](../consolix-backend/docs/prd/). Docs lokal: [`docs/`](./docs/).

## Tech stack

Next.js 16 (App Router, RSC) · React 19 · TypeScript strict · Tailwind CSS 4 (CSS-first, **tanpa**
`tailwind.config`) · Auth.js v5 (Credentials → NestJS) · Server Actions · Zod · Recharts ·
socket.io-client (halaman kasir) · Vitest.
**Tanpa database/ORM** — jangan pernah menambahkan Prisma atau query DB langsung.

## Aturan penting

- **Next.js 16 BUKAN versi yang kamu hafal.** File konvensi `middleware.ts` sudah berganti nama
  menjadi **`src/proxy.ts`**. Baca panduan di `node_modules/next/dist/docs/` sebelum menulis kode
  yang menyentuh API Next.js.
- **Tidak ada akses DB.** Semua data lewat helper `src/lib/api-client.ts`. Jangan `fetch` NestJS
  langsung — gunakan `apiGet` / `apiGetPaged` / `apiPost` / `apiPut` / `apiPatch` / `apiDelete`
  yang sudah menyuntikkan JWT & membuka envelope `{ success, message, data, meta }`.
- **Server Action untuk semua mutasi:** `"use server"` → `requireRole(...)` → baca `FormData`
  dengan helper `src/lib/form.ts` (`str`, `strOrUndef`, `bool`, `list`) → validasi Zod dari
  `src/lib/validations.ts` → `apiPost/apiPut/apiDelete` → `revalidatePath(...)` → `redirect(...)`.
- **Role gating wajib** di setiap action yang mengubah data:
  `requireRole("CASHIER"|"OPERATOR"|"ADMIN"|"SUPER_ADMIN")` dari `src/lib/session.ts`.
  Hierarki: `CASHIER < OPERATOR < ADMIN < SUPER_ADMIN`. Role NestJS lowercase dinormalkan ke
  uppercase di sesi. Menu di `src/components/layout/nav.ts` punya `minRole` — kasir hanya melihat
  Kasir / Booking / Pesanan FnB / Topup.
- **Refresh token proaktif** terjadi di callback `jwt` (`src/auth.config.ts`) — `api-client` tidak
  perlu retry 401. `session.error === "RefreshAccessTokenError"` berarti logout paksa.
- Bahasa UI & copy: **Indonesia**. Mata uang `formatRupiah` (`src/lib/utils.ts`), tanggal `date-fns`
  locale `id`. Uang dari API selalu **integer rupiah**.

## Struktur

- `src/app/(auth)/login` — login. `src/app/(dashboard)/<modul>/` — halaman per fitur
  (`page.tsx` async RSC + `*-form.tsx` Client Component). `src/app/api/auth/[...nextauth]/` — Auth.js.
- `src/server/actions/<modul>.ts` — Server Actions per modul.
- `src/lib/` — `api-client`, `session`, `validations` (Zod), `form`, `utils`, `constants`, `types`, `nav-socket`.
- `src/components/{ui,forms,layout}/` — Table, Button, Card, Badge, Input, Modal, PageHeader,
  Sidebar, Topbar, ImageUpload, ArrayInput, SubmitButton, ConfirmDelete. **Gunakan ulang komponen
  ini, jangan bikin baru.**
- Halaman `(dashboard)/kasir` adalah satu-satunya yang client-heavy, dan **satu-satunya papan meja**:
  satu kartu per `ConsoleUnit` yang menggabungkan dua sumber live — booking dari Socket.IO namespace
  `/live` (origin = `NEXT_PUBLIC_API_URL` tanpa `/v1`) dan kondisi fisik TV dari WebSocket Go RDMS,
  dijahit lewat `ConsoleUnit.rdmsDeviceId`. Jangan bikin papan meja kedua.
- **Pengecualian aturan "semua lewat NestJS":** modul `(dashboard)/perangkat` dan lapisan TV di
  kartu Kasir bicara ke backend **Go RDMS** (`../consolix-tv/backend`, kontrak
  `../consolix-tv/docs/api.md`) lewat `src/lib/rdms.ts` (`RDMS_API_URL`, server-side only — API Go
  tanpa auth, wajib privat) dan WebSocket native `src/lib/use-rdms-state.ts`
  (`NEXT_PUBLIC_RDMS_WS_URL`, push state per detik, bukan Socket.IO). Mutasi tetap Server Action +
  `requireRole` (`src/server/actions/rdms.ts`).
- **Siklus hidup sesi hanya lewat NestJS.** `src/server/actions/rdms.ts` sengaja tidak punya
  mulai/perpanjang/hentikan sesi: mulai = walk-in atau check-in QR, perpanjang & selesai = `pos.ts`.
  Backend yang meneruskannya ke TV lewat listener RDMS. Memanggil `/sessions` RDMS dari dashboard
  membuat jam Kasir dan TV berbeda, dan sesinya tidak tertagih.
- **Tidak ada overtime.** Sesi berhenti di `endAt` (TV ikut mati) dan menunggu pembayaran; hitung
  mundur di kartu berhenti di `00:00`, tidak menghitung naik. Lanjut main = extend, yang dihitung
  dari saat tombol ditekan dan menyalakan TV lagi.

## Code style

- TypeScript `strict`. Hindari `any`; pakai tipe dari `src/lib/types.ts` atau generic pada helper
  `api-client`. Komentar singkat menjelaskan **kenapa**, bukan apa.
- Import pakai alias `@/*`. Indentasi 2 spasi, string `"double quotes"`, koma trailing.
- Page = async Server Component yang fetch lalu render; form = Client Component (`"use client"`)
  berisi `<form action={serverAction}>` **HTML native** — tanpa react-hook-form. Ikuti pola file
  tetangga di modul yang sama.
- Skema Zod adalah satu sumber validasi (form ↔ action). Tambah field → ubah skema dulu.
- `npm run lint` & `npx tsc --noEmit` harus bersih sebelum dianggap selesai.

## Testing — wajib saat menambah/refactor fitur

Tulis test di perubahan yang sama (Vitest, unit, tanpa DB/server — mock session & `api-client`):

- Skema Zod: minimal satu kasus **valid** dan satu **invalid/edge** (pola `safeParse(...).success`).
- Hierarki role & util (`tests/utils.test.ts`).
- Role-gating Server Action: role di bawah `minRole` harus ditolak.

```bash
npm test            # sekali jalan
npm run test:watch
npm run test:coverage
```

## Menjalankan

```bash
# Jalankan backend dulu (../consolix-backend) di http://localhost:3000
cp .env.example .env      # API_URL + AUTH_SECRET
PORT=3100 npm run dev     # dashboard di http://localhost:3100 (3000 dipakai NestJS)
```

Login memakai akun `admin_users` dari `npm run seed:admin` di backend.
