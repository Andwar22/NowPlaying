# 🎬 NowPlaying — Jadwal Film Jellyfin

Web simpel untuk menampilkan film yang sedang tayang di server Jellyfin,
lengkap dengan **batas tayang** tiap film. Film yang sudah melewati tanggal
tayang otomatis hilang dari halaman.

## Cara tambah / ubah film

Semua data ada di **`src/data/movies.json`**. Satu entri contohnya:

```json
{
  "id": "dune-part-two",
  "tmdbId": 693134,
  "title": "Dune: Part Two",
  "showFrom": null,
  "showUntil": "2026-11-30",
  "note": "Versi 4K"
}
```

| Field      | Wajib | Keterangan                                                                 |
| ---------- | ----- | -------------------------------------------------------------------------- |
| `id`       | Ya    | ID unik, huruf kecil + strip (mis. `avengers-endgame`)                     |
| `tmdbId`   | Tidak | ID film di TMDB — untuk isi metadata otomatis (lihat bawah)                |
| `title`    | Ya    | Judul film (dipakai kalau metadata otomatis tidak ada)                     |
| `showFrom` | Tidak | Tanggal mulai tayang `YYYY-MM-DD`. Kosong/`null` = sudah tayang            |
| `showUntil`| Ya    | **Tanggal terakhir tayang** `YYYY-MM-DD`. Lewat tanggal ini film hilang    |
| `note`     | Tidak | Catatan bebas, mis. "Versi 4K" / "Segera dihapus"                          |
| `manual`   | Tidak | Override manual: `title, year, overview, rating, genres[], runtime, poster, backdrop` |

**Aturan tampil:**
- `showUntil` < hari ini → film **disembunyikan otomatis** (saat build & di browser)
- `showFrom` > hari ini → masuk section **🎬 Segera Hadir**
- Selain itu → masuk section **Sedang Tayang**

> Zona waktu yang dipakai: **Asia/Jakarta (WIB)**.

## Metadata otomatis (poster, sinopsis, rating)

IMDb tidak menyediakan API gratis, jadi web ini memakai **TMDB** (gratis):

1. Daftar di https://www.themoviedb.org/settings/api → dapat **API Key (v3)**
2. Isi `tmdbId` tiap film. Cara dapatnya: cari film di
   https://www.themoviedb.org → buka halamannya → angka di URL itulah ID-nya.
   Contoh: `themoviedb.org/movie/693134-dune-part-two` → `693134`
3. Jalankan:
   ```sh
   TMDB_API_KEY=kunci_kamu npm run enrich
   ```
4. Hasilnya tersimpan di `src/data/meta.json` (poster, backdrop, sinopsis
   Bahasa Indonesia, rating, genre, durasi) → ikut ke-commit ke repo.

Tanpa API key pun web tetap jalan — isi lewat field `manual` di `movies.json`.

## Perintah

| Perintah          | Fungsi                                              |
| ----------------- | --------------------------------------------------- |
| `npm install`     | Install dependencies                                 |
| `npm run dev`     | Dev server di `localhost:4321`                       |
| `npm run build`   | Build statis ke `./dist/`                           |
| `npm run preview` | Preview hasil build                                 |
| `npm run enrich`  | Ambil metadata dari TMDB (butuh `TMDB_API_KEY`)      |

## Deploy

Hasil `npm run build` adalah file statis di `dist/` — bisa di-host gratis di
**Cloudflare Pages**, **Vercel**, atau **GitHub Pages**. Karena halaman
mengevaluasi ulang tanggal di browser, film yang kedaluwarsa tetap hilang
walau situs tidak di-build ulang setiap hari.
