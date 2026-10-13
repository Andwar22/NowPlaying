#!/usr/bin/env node
/**
 * enrich.mjs — Mengisi metadata film otomatis dari TMDB.
 *
 * Cara pakai:
 *   1. Daftar gratis di https://www.themoviedb.org/settings/api untuk dapat API key (v3).
 *   2. Jalankan:  TMDB_API_KEY=kunci_kamu node scripts/enrich.mjs
 *      atau:      npm run enrich  (dengan TMDB_API_KEY di environment)
 *
 * Script membaca src/data/movies.json, mengambil data tiap entri yang punya
 * "tmdbId", lalu menulis hasilnya ke src/data/meta.json.
 * Entri tanpa tmdbId dilewati (pakai field "manual" di movies.json).
 *
 * Cara dapat tmdbId: cari film di https://www.themoviedb.org,
 * buka halamannya, angka di URL itulah tmdbId-nya.
 * Contoh: https://www.themoviedb.org/movie/693134-dune-part-two → 693134
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const API_KEY = process.env.TMDB_API_KEY;

if (!API_KEY) {
  console.error("❌ TMDB_API_KEY belum diisi.");
  console.error("   Daftar gratis di https://www.themoviedb.org/settings/api");
  console.error("   lalu jalankan: TMDB_API_KEY=kunci_kamu npm run enrich");
  process.exit(1);
}

const img = (path, size) => (path ? `https://image.tmdb.org/t/p/${size}${path}` : null);

const movies = JSON.parse(readFileSync(join(root, "src/data/movies.json"), "utf8")).movies;
const out = {};
let ok = 0,
  skipped = 0;

for (const m of movies) {
  if (!m.tmdbId) {
    console.log(`- ${m.id}: tanpa tmdbId, dilewati (pakai "manual")`);
    skipped++;
    continue;
  }
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/movie/${m.tmdbId}?api_key=${API_KEY}&language=id-ID`
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const j = await res.json();
    out[m.id] = {
      title: j.title,
      year: j.release_date ? Number(j.release_date.slice(0, 4)) : null,
      overview: j.overview || null,
      poster: img(j.poster_path, "w500"),
      backdrop: img(j.backdrop_path, "w1280"),
      rating: j.vote_average ? Math.round(j.vote_average * 10) / 10 : null,
      genres: (j.genres || []).map((g) => g.name),
      runtime: j.runtime || null,
    };
    console.log(`✓ ${m.id} → ${j.title}`);
    ok++;
    // jeda sopan agar tidak kena rate limit
    await new Promise((r) => setTimeout(r, 300));
  } catch (e) {
    console.error(`✗ ${m.id}: gagal (${e.message})`);
  }
}

writeFileSync(join(root, "src/data/meta.json"), JSON.stringify(out, null, 2) + "\n");
console.log(`\nSelesai: ${ok} berhasil, ${skipped} dilewati → src/data/meta.json`);
