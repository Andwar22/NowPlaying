import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export interface MovieInput {
  id: string;
  tmdbId?: number | null;
  title: string;
  showFrom?: string | null;
  showUntil: string;
  note?: string;
  manual?: Partial<MovieMeta>;
}

export interface MovieMeta {
  title?: string;
  year?: number | null;
  overview?: string | null;
  poster?: string | null;
  backdrop?: string | null;
  rating?: number | null;
  genres?: string[];
  runtime?: number | null;
}

export interface Movie extends MovieInput {
  poster: string | null;
  backdrop: string | null;
  overview: string | null;
  year: number | null;
  rating: number | null;
  genres: string[];
  runtime: number | null;
  displayTitle: string;
}

const dataDir = join(process.cwd(), "src", "data");

function loadJson(name: string): any {
  const p = join(dataDir, name);
  if (!existsSync(p)) return name === "meta.json" ? {} : { movies: [] };
  return JSON.parse(readFileSync(p, "utf8"));
}

/** Tanggal hari ini (YYYY-MM-DD) dalam zona Asia/Jakarta. */
export function todayWIB(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(date);
}

/** Gabungkan movies.json + meta.json (hasil enrich) + manual override. */
export function loadMovies(): Movie[] {
  const { movies } = loadJson("movies.json") as { movies: MovieInput[] };
  const meta = loadJson("meta.json") as Record<string, MovieMeta>;
  return movies.map((m) => {
    const enriched = meta[m.id] ?? {};
    const manual = m.manual ?? {};
    return {
      ...m,
      displayTitle: manual.title ?? enriched.title ?? m.title,
      poster: manual.poster ?? enriched.poster ?? null,
      backdrop: manual.backdrop ?? enriched.backdrop ?? null,
      overview: manual.overview ?? enriched.overview ?? null,
      year: manual.year ?? enriched.year ?? null,
      rating: manual.rating ?? enriched.rating ?? null,
      genres: manual.genres ?? enriched.genres ?? [],
      runtime: manual.runtime ?? enriched.runtime ?? null,
    };
  });
}

export type MovieStatus = "playing" | "coming" | "expired";

export function statusOf(m: MovieInput, today: string): MovieStatus {
  if (m.showUntil < today) return "expired";
  if (m.showFrom && m.showFrom > today) return "coming";
  return "playing";
}

/** Sisa hari tayang (0 = hari terakhir). */
export function daysLeft(showUntil: string, today: string): number {
  const ms = Date.parse(showUntil + "T00:00:00+07:00") - Date.parse(today + "T00:00:00+07:00");
  return Math.max(0, Math.round(ms / 86_400_000));
}

export function formatDateID(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(iso + "T00:00:00+07:00"));
}
