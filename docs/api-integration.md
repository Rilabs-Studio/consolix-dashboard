# Integrasi API

Semua request lewat `src/lib/api-client.ts` — jangan pernah `fetch` langsung.

## Helper

| Fungsi | Pakai untuk |
|---|---|
| `apiGet<T>(path, query?)` | GET non-paginated → `data` |
| `apiGetPaged<T>(path, query?)` | GET paginated → `{items, meta}` |
| `apiPost/apiPut/apiPatch/apiDelete<T>(path, body?)` | mutasi |

- Base URL dari env `API_URL` (lokal: `http://localhost:3001/v1`).
- JWT disuntik dari sesi Auth.js (`auth()`), envelope
  `{success,message,data,meta}` dibuka otomatis.
- Gagal → `ApiError` dengan `status` + `errorCode` + `message` (bahasa Indonesia
  dari backend, aman ditampilkan langsung).

## Refresh token

Access token backend berumur 15 menit. Callback `jwt` di `src/auth.ts`
me-refresh **proaktif** (`REFRESH_SKEW_MS = 60_000`) memakai refresh token —
request RSC tidak pernah kena 401 di tengah render. Refresh gagal →
`session.error = 'RefreshAccessTokenError'` → komponen layout memaksa login ulang.

## Error handling di action

```ts
try { await apiPost(...) ; return {}; }
catch (err) { if (err instanceof ApiError) return { error: err.message }; throw err; }
```

`error` dirender inline di form modal (pola `ActionResult`).

## Kontrak

Bentuk JSON mengikuti `consolix-backend/docs/api-contract.md` — **baca dulu
sebelum mengubah key/enum apa pun**. Tipe TS di `src/lib/types.ts` harus
dicerminkan manual dari kontrak itu.
