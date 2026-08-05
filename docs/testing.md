# Testing Dashboard

```bash
npx tsc --noEmit   # wajib bersih
npm run lint       # wajib bersih
npm test           # Vitest
npm run build      # wajib sukses sebelum dianggap selesai
```

## Peta test Vitest → acceptance criteria

| Test | Menguji | PRD backend terkait |
|---|---|---|
| skema Zod (valid + invalid) | `lib/validations.ts` — setiap skema minimal satu kasus valid & satu invalid | semua form |
| hierarki role | `hasRole`/ladder CASHIER<OPERATOR<ADMIN<SUPER_ADMIN | `rbac.md` |
| role-gating action | server action menolak role di bawah `requireRole` (mock session + api-client, tanpa server) | 07, 18, 19 |

## Verifikasi manual (alur kasir E2E)

login kasir → buka shift (kas awal) → start walk-in → papan `/kasir` berubah
**tanpa refresh** → jual FnB → bayar cash → catat pengeluaran cash → tutup
shift: *expected cash* harus cocok hitungan manual. Login `CASHIER` tidak
melihat menu Keuangan/Audit Log.

Aturan: setiap fitur baru menyertakan test skema + test role-gating action-nya.
