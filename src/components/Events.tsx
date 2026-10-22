import type { CalEvent } from "@/lib/calendar";

const day = (d: Date) => d.toLocaleDateString("en-IE", { day: "numeric" });
const month = (d: Date) => d.toLocaleDateString("en-IE", { month: "short" });
const weekday = (d: Date) => d.toLocaleDateString("en-IE", { weekday: "long" });
const time = (d: Date) => d.toLocaleTimeString("en-IE", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Dublin" });

export function Events({ events, compact }: { events: CalEvent[]; compact?: boolean }) {
  if (!events.length) return <p className="muted">No upcoming events on the calendar right now.</p>;
  return (
    <ol className={`events ${compact ? "events-compact" : ""}`}>
      {events.map((e) => (
        <li key={e.id} className="event">
          <div className="event-date">
            <span>{month(e.start)}</span>
            <strong>{day(e.start)}</strong>
          </div>
          <div className="event-body">
            <h3>{e.title}</h3>
            <p className="event-meta">
              {weekday(e.start)}{!e.allDay && ` · ${time(e.start)}`}
              {e.location && <> · {e.location.split(",").slice(0, 2).join(",")}</>}
            </p>
            {!compact && e.description && <p className="event-desc">{e.description.slice(0, 220)}{e.description.length > 220 && "…"}</p>}
          </div>
          {e.url && (
            <a className="event-link" href={e.url} target="_blank" rel="noreferrer" aria-label={`Details for ${e.title}`}>↗</a>
          )}
        </li>
      ))}
    </ol>
  );
}
