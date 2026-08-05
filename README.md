# Consolix Dashboard

Back-office sistem rental PlayStation **Consolix** — POS kasir, CRUD master data, approval topup,
laporan keuangan. **UI murni** di atas API NestJS (`../consolix-backend`), tanpa database sendiri.

Next.js 16 (App Router, RSC) · React 19 · TypeScript strict · Tailwind CSS 4 · Auth.js v5 ·
Server Actions · Zod · Recharts · Vitest.

## Quickstart

```bash
# 1. Jalankan backend dulu → http://localhost:3000 (lihat ../consolix-backend/README.md)

# 2. Konfigurasi env
cp .env.example .env
# API_URL="http://localhost:3000/v1"
# AUTH_SECRET → openssl rand -base64 32

# 3. Jalankan (port 3100 karena 3000 dipakai backend)
npm install
PORT=3100 npm run dev     # http://localhost:3100
```

Login dengan akun dari `npm run seed:admin` di backend.

## Skrip

| Skrip | Fungsi |
|---|---|
| `npm run dev` / `build` / `start` | Dev / build / produksi |
| `npm run lint` | ESLint |
| `npm test` / `test:watch` / `test:coverage` | Vitest |

## Peran & menu

Ladder role: `CASHIER < OPERATOR < ADMIN < SUPER_ADMIN`. Menu difilter `minRole`
(`src/components/layout/nav.ts`) — kasir hanya melihat Kasir, Booking, Pesanan FnB, dan Topup.

## Dokumentasi

Konvensi kode: [`CLAUDE.md`](./CLAUDE.md). Pola halaman & RBAC: [`docs/`](./docs/).
Kontrak API (sumber kebenaran): [`../consolix-backend/docs/api-contract.md`](../consolix-backend/docs/api-contract.md).
