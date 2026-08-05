# Arsitektur Dashboard

Next.js 16 App Router — **UI murni di atas API NestJS**. Tidak ada database,
ORM, atau `fetch` langsung; semua data lewat `src/lib/api-client.ts`.

## Lapisan

```
page.tsx (RSC, async)  ──►  apiGet / apiGetPaged  ──►  NestJS /v1
*-form.tsx ("use client") ─► server action ("use server")
                              └► requireRole → Zod → apiPost/Patch/Delete → revalidatePath
```

- **RSC** membaca data saat render server — tidak ada state fetching di klien.
- **Server Actions** (`src/server/actions/*.ts`) adalah satu-satunya jalur mutasi.
  Pola: `requireRole()` → parse FormData (`str`/`strOrUndef`/`bool`) →
  `schema.parse()` → panggil API → `revalidatePath()`.
- `ActionResult {error?}` untuk form dalam modal (error inline, bukan throw).
- **Auth.js v5**: Credentials → `POST /v1/auth/admin/login`; callback `jwt`
  me-refresh access token **proaktif** 60 detik sebelum kedaluwarsa;
  `session.error = 'RefreshAccessTokenError'` = logout paksa.
- **`src/proxy.ts`** (konvensi Next 16 pengganti `middleware.ts`) menjaga rute
  lewat callback `authorized`.
- Satu-satunya halaman client-heavy: `/kasir` — socket.io-client ke `/live`
  (initial state dari RSC, dipatch event `board:update`).
- Tailwind 4 CSS-first: `@import "tailwindcss"` di `globals.css`,
  **tanpa** `tailwind.config`.

## Struktur

```
src/app/(auth)/login          src/app/(dashboard)/<modul>/page.tsx
src/server/actions/           src/lib/{api-client,session,form,validations,types,constants,utils}.ts
src/components/{ui,forms,layout,charts}/
```

Konvensi mengikat lain ada di `CLAUDE.md`; matriks role di `rbac.md`;
pola halaman di `ui-patterns.md`.
