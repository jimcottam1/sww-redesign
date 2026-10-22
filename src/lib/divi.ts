// Turns Divi page-builder content (shortcodes inside WordPress HTML) into clean blocks.

export type Block =
  | { type: "heading"; level: number; text: string }
  | { type: "html"; html: string }
  | { type: "image"; src: string; alt: string }
  | { type: "button"; url: string; text: string }
  | { type: "gallery"; ids: number[] }
  | { type: "embed"; src: string }
  | { type: "posts" }
  | { type: "youtube"; channelId: string };

export type Section = { heading: string; level: number; blocks: Block[] };

const ENTITIES: Record<string, string> = {
  amp: "&", nbsp: " ", hellip: "…", ndash: "–", mdash: "—", lsquo: "‘", rsquo: "’", ldquo: "“", rdquo: "”", quot: '"', "#039": "'",
};

export function decode(s: string) {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&([a-z0-9#]+);/gi, (m, k) => ENTITIES[k] ?? m);
}

export const stripTags = (s: string) => decode(s.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();

// WordPress "texturizes" shortcode quotes into curly entities; restore them so attributes parse.
const normalizeQuotes = (s: string) => s.replace(/&#82(?:21|43|20|22);/g, '"');

function attrs(raw: string) {
  const out: Record<string, string> = {};
  for (const m of raw.matchAll(/(\w+)="([^"]*)"/g)) out[m[1]] = decode(m[2]);
  return out;
}

/** First section background image set in the builder (used as a hero photo). */
export function backgroundImages(content: string) {
  return [...normalizeQuotes(content).matchAll(/background_image="([^"]+)"/g)].map((m) => m[1]);
}

export function parseDivi(content: string): Block[] {
  const tokens: Block[] = [];
  const marker = (b: Block) => `\u0000${tokens.push(b) - 1}\u0000`;

  let s = normalizeQuotes(content)
    .replace(/<!-- \[et_pb_line_break_holder\] -->/g, "\n")
    // Code modules hold hand-written widgets; keep only a YouTube channel if one is referenced.
    .replace(/\[et_pb_code[^\]]*\]([\s\S]*?)\[\/et_pb_code\]/g, (_, code) => {
      const channelId = code.match(/\bUC[\w-]{22}\b/)?.[0];
      return channelId ? marker({ type: "youtube", channelId }) : "";
    })
    .replace(/<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>/g, "");

  s = s
    .replace(/\[et_pb_image([^\]]*)\]/g, (_, a) => {
      const { src, alt = "" } = attrs(a);
      return src ? marker({ type: "image", src, alt }) : "";
    })
    .replace(/\[et_pb_button([^\]]*)\]/g, (_, a) => {
      const { button_url, button_text } = attrs(a);
      return button_url ? marker({ type: "button", url: button_url, text: button_text ?? "Find out more" }) : "";
    })
    .replace(/\[et_pb_gallery([^\]]*)\]/g, (_, a) => {
      const ids = (attrs(a).gallery_ids ?? "").split(",").map(Number).filter(Boolean);
      return ids.length ? marker({ type: "gallery", ids }) : "";
    })
    .replace(/\[et_pb_blurb([^\]]*)\]/g, (_, a) => {
      const { title } = attrs(a);
      return title ? `<h3>${title}</h3>` : "";
    })
    .replace(/\[et_pb_blog[^\]]*\]/g, () => marker({ type: "posts" }))
    .replace(/<iframe[^>]*src="([^"]+)"[^>]*>\s*<\/iframe>/g, (_, src) => marker({ type: "embed", src: decode(src) }))
    // Drop every remaining shortcode (open or close) and builder leftovers.
    .replace(/\[\/?et_pb_[^\]]*\]/g, "")
    .replace(/\s(style|class|id)="[^"]*"/g, "");

  const blocks: Block[] = [];
  const pushHtml = (html: string) => {
    const clean = html
      .replace(/<p>\s*<\/p>|<p>\s*(?:&nbsp;|\s)*<\/p>/g, "")
      .replace(/<\/?p>\s*$/g, "")
      .replace(/^\s*<\/p>/g, "")
      .trim();
    if (stripTags(clean).length > 1) blocks.push({ type: "html", html: balance(clean) });
  };

  // Split on headings and markers, keeping order.
  const parts = s.split(/(<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>|\u0000\d+\u0000)/);
  for (const part of parts) {
    const h = part.match(/^<h([1-6])[^>]*>([\s\S]*?)<\/h[1-6]>$/);
    const t = part.match(/^\u0000(\d+)\u0000$/);
    if (h) {
      const text = stripTags(h[2]);
      if (text) blocks.push({ type: "heading", level: +h[1], text });
    } else if (t) {
      blocks.push(tokens[+t[1]]);
    } else {
      pushHtml(part);
    }
  }
  return blocks;
}

/** Remove paragraph tags orphaned by stripping shortcodes. */
function balance(html: string) {
  const opens = (html.match(/<p\b/g) ?? []).length;
  const closes = (html.match(/<\/p>/g) ?? []).length;
  if (opens > closes) html += "</p>".repeat(opens - closes);
  if (closes > opens) html = "<p>".repeat(closes - opens) + html;
  return html.replace(/<p>\s*<\/p>/g, "");
}

export function sections(blocks: Block[]): Section[] {
  const out: Section[] = [{ heading: "", level: 0, blocks: [] }];
  for (const b of blocks) {
    if (b.type === "heading") out.push({ heading: b.text, level: b.level, blocks: [] });
    else out[out.length - 1].blocks.push(b);
  }
  return out.filter((s) => s.heading || s.blocks.length);
}

/** Plain-text paragraphs of a section. */
export function paragraphs(section: Section | undefined) {
  if (!section) return [];
  return section.blocks
    .filter((b): b is Extract<Block, { type: "html" }> => b.type === "html")
    .flatMap((b) => b.html.replace(/<(ul|ol)[\s\S]*?<\/\1>/g, "</p>").split(/<\/p>|<br\s*\/?>/))
    .map(stripTags)
    .filter((p) => p.length > 2);
}

/** List items of a section. */
export function listItems(section: Section | undefined) {
  return (section?.blocks ?? []).flatMap((b) => (b.type === "html" ? [...b.html.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)].map((m) => stripTags(m[1])) : []));
}

export const findSection = (all: Section[], test: RegExp) => all.find((s) => test.test(s.heading));
