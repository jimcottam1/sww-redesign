// Reads the club's public Google Calendar (the one embedded on the WordPress calendar page).

export type CalEvent = { id: string; title: string; start: Date; allDay: boolean; location: string; description: string; url: string | null };

function parseDate(value: string, params: string) {
  if (/VALUE=DATE/.test(params) || /^\d{8}$/.test(value)) {
    return { date: new Date(+value.slice(0, 4), +value.slice(4, 6) - 1, +value.slice(6, 8)), allDay: true };
  }
  const [, y, mo, d, h, mi, s] = value.match(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/) ?? [];
  const utc = value.endsWith("Z");
  const date = utc ? new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, +s)) : new Date(+y, +mo - 1, +d, +h, +mi, +s);
  return { date, allDay: false };
}

const unescape = (s: string) => s.replace(/\\n/g, "\n").replace(/\\([,;\\])/g, "$1");

export function calendarIdFromEmbed(embedSrc: string) {
  const src = new URL(embedSrc).searchParams.get("src");
  if (!src) return null;
  // Embed URLs carry the calendar id base64-encoded.
  return src.includes("@") ? src : Buffer.from(src, "base64").toString("utf8");
}

export async function getEvents(calendarId: string) {
  const res = await fetch(`https://calendar.google.com/calendar/ical/${encodeURIComponent(calendarId)}/public/basic.ics`, {
    next: { revalidate: 1800 },
  });
  if (!res.ok) return [];
  const text = (await res.text()).replace(/\r?\n[ \t]/g, ""); // unfold continuation lines

  const events: CalEvent[] = [];
  for (const block of text.split("BEGIN:VEVENT").slice(1)) {
    const field = (name: string) => block.match(new RegExp(`^${name}(;[^:\\n]*)?:(.*)$`, "m"));
    const start = field("DTSTART");
    if (!start) continue;
    const { date, allDay } = parseDate(start[2].trim(), start[1] ?? "");
    const description = unescape(field("DESCRIPTION")?.[2] ?? "").trim();
    events.push({
      id: field("UID")?.[2] ?? String(date.getTime()),
      title: unescape(field("SUMMARY")?.[2] ?? "Event").trim(),
      start: date,
      allDay,
      location: unescape(field("LOCATION")?.[2] ?? "").trim(),
      description: description.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
      url: description.match(/https?:\/\/[^\s"<>]+/)?.[0] ?? null,
    });
  }
  return events.sort((a, b) => a.start.getTime() - b.start.getTime());
}

export async function getUpcomingEvents(calendarId: string, limit = 50) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return (await getEvents(calendarId)).filter((e) => e.start >= today).slice(0, limit);
}
