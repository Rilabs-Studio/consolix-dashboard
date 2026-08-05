# RBAC — Role & Matriks Menu

Ladder (hierarkis — tinggi memenuhi rendah):

```
CASHIER (1) < OPERATOR (2) < ADMIN (3) < SUPER_ADMIN (4)
```

Penegakan tiga lapis: backend (`@AdminOnly`, sumber kebenaran), server action
(`requireRole`), dan sidebar (`nav.ts` field `minRole` — kosmetik saja).

## Matriks menu × role

| Menu | minRole | CASHIER | OPERATOR | ADMIN | SUPER |
|---|---|---|---|---|---|
| Overview | OPERATOR | — | ✓ | ✓ | ✓ |
| Kasir (POS) | CASHIER | ✓ | ✓ | ✓ | ✓ |
| Booking | CASHIER | ✓ | ✓ | ✓ | ✓ |
| Pesanan FnB | CASHIER | ✓ | ✓ | ✓ | ✓ |
| Top Up Saldo | CASHIER | ✓ | ✓ | ✓ | ✓ |
| Konsol · FnB (master) | OPERATOR | — | ✓ | ✓ | ✓ |
| Member · Gamifikasi · Challenge · Promo · Voucher · Event | OPERATOR | — | ✓ | ✓ | ✓ |
| Notifikasi (broadcast) | OPERATOR | — | ✓ | ✓ | ✓ |
| Pengguna | OPERATOR | — | ✓ | ✓ | ✓ |
| **Keuangan** (P&L, tutup kasir, pengeluaran) | **ADMIN** | — | — | ✓ | ✓ |
| **Audit Log** | **ADMIN** | — | — | ✓ | ✓ |
| Pengguna → Admin (CRUD akun) | SUPER_ADMIN* | — | — | — | ✓ |

\* halaman `/pengguna/admin` tampil untuk ADMIN namun aksi CRUD akun ditolak
backend kecuali `super_admin`.

## Catatan penting

- Login `CASHIER` di-redirect dari Overview ke `/kasir`.
- Kasir **boleh** mencatat pengeluaran & melihat kategori (via POS/endpoint),
  tapi tidak melihat menu Keuangan/laporan — `GET /admin/reports/*` menolak
  dengan `FORBIDDEN`.
- Tutup shift boleh kasir; **reopen** shift hanya `ADMIN`+ dan tercatat audit log.
- Jangan hanya menyembunyikan menu: setiap action wajib `requireRole` dan
  backend tetap memvalidasi role dari JWT.
