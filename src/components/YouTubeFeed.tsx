import { decode } from "@/lib/divi";
import { formatDate } from "@/lib/wordpress";

type Video = { id: string; title: string; published: string };

async function getVideos(channelId: string) {
  const res = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`, { next: { revalidate: 1800 } });
  if (!res.ok) return { channel: null, videos: [] };
  const xml = await res.text();
  const channel = decode(xml.match(/<title>([^<]+)<\/title>/)?.[1] ?? "");
  const videos: Video[] = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(([, e]) => ({
    id: e.match(/<yt:videoId>([^<]+)/)?.[1] ?? "",
    title: decode(e.match(/<title>([^<]+)/)?.[1] ?? ""),
    published: e.match(/<published>([^<]+)/)?.[1] ?? "",
  }));
  return { channel, videos: videos.filter((v) => v.id) };
}

export async function YouTubeFeed({ channelId }: { channelId: string }) {
  const { channel, videos } = await getVideos(channelId).catch(() => ({ channel: null, videos: [] as Video[] }));
  const channelUrl = `https://www.youtube.com/channel/${channelId}`;
  if (!videos.length) return <a className="btn" href={channelUrl} target="_blank" rel="noreferrer">Watch on YouTube ↗</a>;
  const [latest, ...rest] = videos;

  return (
    <div className="yt">
      <div className="embed embed-video">
        <iframe src={`https://www.youtube.com/embed/${latest.id}`} loading="lazy" allowFullScreen title={latest.title} />
      </div>
      <div className="yt-grid">
        {rest.map((v) => (
          <a key={v.id} className="yt-card" href={`https://www.youtube.com/watch?v=${v.id}`} target="_blank" rel="noreferrer">
            <img src={`https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`} alt="" loading="lazy" />
            <span className="yt-title">{v.title}</span>
            <time>{formatDate(v.published)}</time>
          </a>
        ))}
      </div>
      <a className="btn" href={`${channelUrl}?sub_confirmation=1`} target="_blank" rel="noreferrer">
        Subscribe{channel ? ` to ${channel}` : ""} ↗
      </a>
    </div>
  );
}
