import { cache } from "react";
import { decode, parseDivi, sections, stripTags, type Section } from "./divi";

const WP_URL = process.env.WORDPRESS_URL ?? "https://swwcycling.ie";

export type Post = {
  id: number;
  slug: string;
  date: string;
  title: string;
  excerpt: string;
  content: string;
  image: string | null;
};

export type Media = { id: number; url: string; full: string; alt: string; width: number; height: number };

type RawPost = {
  id: number;
  slug: string;
  date: string;
  title: { rendered: string };
  excerpt: { rendered: string };
  content?: { rendered: string };
  _embedded?: { "wp:featuredmedia"?: RawMedia[] };
};

type RawMedia = {
  id: number;
  source_url: string;
  alt_text?: string;
  media_details?: { width?: number; height?: number; sizes?: Record<string, { source_url: string; width: number; height: number }> };
};

function toMedia(m: RawMedia): Media {
  const sizes = m.media_details?.sizes ?? {};
  const best = sizes.large ?? sizes.medium_large ?? sizes.full;
  return {
    id: m.id,
    url: best?.source_url ?? m.source_url,
    full: m.source_url,
    alt: m.alt_text ?? "",
    width: best?.width ?? m.media_details?.width ?? 1200,
    height: best?.height ?? m.media_details?.height ?? 800,
  };
}

function toPost(p: RawPost): Post {
  const media = p._embedded?.["wp:featuredmedia"]?.[0];
  return {
    id: p.id,
    slug: p.slug,
    date: p.date,
    title: stripTags(p.title.rendered),
    excerpt: stripTags(p.excerpt.rendered).replace(/\[…\]$/, "…"),
    content: p.content?.rendered ?? "",
    image: media?.source_url ? toMedia(media).url : null,
  };
}

async function wpFetch(path: string) {
  // The live club site is the CMS; refresh every 5 minutes.
  const res = await fetch(`${WP_URL}/wp-json/wp/v2/${path}`, {
    headers: { "User-Agent": "Mozilla/5.0 (SWW headless frontend)" },
    next: { revalidate: 300 },
  });
  if (!res.ok) throw new Error(`WordPress request failed: ${res.status} ${path}`);
  return res;
}

const wp = async <T,>(path: string): Promise<T> => (await wpFetch(path)).json();

export async function getPosts(perPage = 9, page = 1) {
  const res = await wpFetch(`posts?per_page=${perPage}&page=${page}&_embed=wp:featuredmedia&_fields=id,slug,date,title,excerpt,_links,_embedded`);
  const raw: RawPost[] = await res.json();
  return { posts: raw.map(toPost), totalPages: Number(res.headers.get("X-WP-TotalPages") ?? 1) };
}

// Batches stay small so each response fits in Next's fetch cache (2MB) and is shared across the static build.
const ALL_POSTS_BATCH = 20;

export const getAllPosts = cache(async () => {
  const fields = "_fields=id,slug,date,title,excerpt,content,_links,_embedded&_embed=wp:featuredmedia";
  const first = await wpFetch(`posts?per_page=${ALL_POSTS_BATCH}&page=1&${fields}`);
  const totalPages = Number(first.headers.get("X-WP-TotalPages") ?? 1);
  const rest = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, i) => wp<RawPost[]>(`posts?per_page=${ALL_POSTS_BATCH}&page=${i + 2}&${fields}`)),
  );
  return [(await first.json()) as RawPost[], ...rest].flat().map(toPost);
});

export async function getPost(slug: string) {
  return (await getAllPosts()).find((p) => p.slug === slug) ?? null;
}

export type Page = { id: number; slug: string; title: string; menuOrder: number; content: string; sections: Section[] };

export const getPages = cache(async (): Promise<Page[]> => {
  const raw = await wp<{ id: number; slug: string; menu_order: number; title: { rendered: string }; content: { rendered: string } }[]>(
    "pages?per_page=100&_fields=id,slug,menu_order,title,content",
  );
  return raw.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: decode(p.title.rendered),
    menuOrder: p.menu_order,
    content: p.content.rendered,
    sections: sections(parseDivi(p.content.rendered)),
  }));
});

export const getPage = async (slug: string) => (await getPages()).find((p) => p.slug === slug) ?? null;

export const getMedia = cache(async (ids: number[]): Promise<Media[]> => {
  if (!ids.length) return [];
  const raw = await wp<RawMedia[]>(`media?include=${ids.join(",")}&per_page=100&_fields=id,source_url,alt_text,media_details`);
  const byId = new Map(raw.map((m) => [m.id, toMedia(m)]));
  return ids.map((id) => byId.get(id)).filter((m): m is Media => !!m);
});

export const formatDate = (d: string | Date) =>
  new Date(d).toLocaleDateString("en-IE", { day: "numeric", month: "short", year: "numeric" });
