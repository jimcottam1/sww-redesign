import Link from "next/link";
import type { Block, Section } from "@/lib/divi";
import { getMedia } from "@/lib/wordpress";
import { YouTubeFeed } from "./YouTubeFeed";

const WP_HOST = new URL(process.env.WORDPRESS_URL ?? "https://swwcycling.ie").host;

/** Keep visitors on this site when a WordPress link points at one of its own pages. */
export function localHref(url: string) {
  try {
    const u = new URL(url);
    if (u.host === WP_HOST && !u.pathname.startsWith("/wp-content")) {
      const path = u.pathname.replace(/\/$/, "") || "/";
      return path === "/archive" ? "/news" : path;
    }
  } catch {}
  return url;
}

export async function Gallery({ ids }: { ids: number[] }) {
  const media = await getMedia(ids).catch(() => []);
  if (!media.length) return null;
  return (
    <div className="gallery">
      {media.map((m) => (
        <a key={m.id} href={m.full} target="_blank" rel="noreferrer" className="gallery-item">
          <img src={m.url} alt={m.alt} width={m.width} height={m.height} loading="lazy" />
        </a>
      ))}
    </div>
  );
}

function Embed({ src }: { src: string }) {
  const youtube = /youtube\.com|youtu\.be/.test(src);
  return (
    <div className={`embed ${youtube ? "embed-video" : ""}`}>
      <iframe src={src} loading="lazy" allowFullScreen title="Embedded content" />
    </div>
  );
}

function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case "html":
      return <div className="prose" dangerouslySetInnerHTML={{ __html: block.html }} />;
    case "image":
      return <img className="block-img" src={block.src} alt={block.alt} loading="lazy" />;
    case "button": {
      const href = localHref(block.url);
      return href.startsWith("/") ? (
        <Link className="btn" href={href}>{block.text}</Link>
      ) : (
        <a className="btn" href={href} target="_blank" rel="noreferrer">{block.text} ↗</a>
      );
    }
    case "gallery":
      return <Gallery ids={block.ids} />;
    case "embed":
      return <Embed src={block.src} />;
    case "youtube":
      return <YouTubeFeed channelId={block.channelId} />;
    default:
      return null;
  }
}

export function Sections({ sections, skipFirstHeading }: { sections: Section[]; skipFirstHeading?: boolean }) {
  // Divi often repeats a section for desktop/mobile; render each distinct one once.
  const seen = new Set<string>();
  const unique = sections
    .map((s) => ({
      ...s,
      blocks: s.blocks.filter((b) => {
        if (b.type === "html") return true;
        const key = JSON.stringify(b);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }),
    }))
    .filter((s) => {
      const key = s.heading + JSON.stringify(s.blocks);
      if (seen.has(key) || (!s.blocks.length && seen.has(s.heading))) return false;
      seen.add(key);
      seen.add(s.heading);
      return true;
    });

  return (
    <div className="wp-sections">
      {unique.map((s, i) => {
        const Heading = i === 0 && skipFirstHeading ? null : s.heading ? "h2" : null;
        const images = s.blocks.filter((b) => b.type === "image");
        const onlyImages = images.length > 1 && images.length === s.blocks.length;
        return (
          <section key={i} className="wp-section">
            {Heading && <Heading className="wp-heading">{s.heading}</Heading>}
            {onlyImages ? (
              <div className="logo-row">
                {s.blocks.map((b, j) => <BlockView key={j} block={b} />)}
              </div>
            ) : (
              s.blocks.map((b, j) => <BlockView key={j} block={b} />)
            )}
          </section>
        );
      })}
    </div>
  );
}
