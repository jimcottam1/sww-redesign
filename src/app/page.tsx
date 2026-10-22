import Link from "next/link";
import { Events } from "@/components/Events";
import { localHref } from "@/components/Blocks";
import { getUpcomingEvents } from "@/lib/calendar";
import { getSite } from "@/lib/site";
import { formatDate, getPosts } from "@/lib/wordpress";

export default async function Home() {
  const site = await getSite();
  const [{ posts }, events] = await Promise.all([
    getPosts(3).catch(() => ({ posts: [] })),
    site.calendarId ? getUpcomingEvents(site.calendarId, 4).catch(() => []) : [],
  ]);

  const maxKm = Math.max(0, ...site.groups.map((g) => Number(g.distance.match(/\d+(?!.*\d)/)?.[0] ?? 0)));
  const ticker = [
    site.spins.startTime && `Sunday ${site.spins.startTime}`,
    "Kilmallock",
    "Coffee stop",
    ...site.trips.list.map((t) => t.place),
    "All abilities",
  ].filter(Boolean) as string[];
  const joinHref = site.join.button ? localHref(site.join.button.url) : "/join-the-club";

  return (
    <main>
      <section className="hero">
        {site.hero && <img className="hero-img" src={site.hero} alt="Southside Wheely Wheelers riders out on a club spin" />}
        <div className="hero-shade" />
        <div className="wrap hero-inner">
          <p className="eyebrow">Cycling club · Kilmallock, Co. Limerick</p>
          <h1 className="hero-title">
            Ride together.<br /><span>Stop for coffee.</span>
          </h1>
          {site.tagline && <p className="hero-lede">{site.tagline}</p>}
          <div className="hero-ctas">
            <Link href="/join-the-club" className="btn">Join the club</Link>
            <Link href="#spins" className="btn btn-ghost">See Sunday spins</Link>
          </div>
        </div>
        <dl className="wrap hero-stats">
          {site.spins.startTime && <div><dt>Every Sunday</dt><dd>{site.spins.startTime.replace(/am$/i, "")}</dd></div>}
          <div><dt>Ride groups</dt><dd>{site.groups.length}</dd></div>
          {maxKm > 0 && <div><dt>Longest spins</dt><dd>{maxKm}<small>km</small></dd></div>}
          <div><dt>Trips abroad</dt><dd>{site.trips.list.length}</dd></div>
        </dl>
      </section>

      <div className="ticker" aria-hidden>
        <div className="ticker-track">
          {[...ticker, ...ticker].map((t, i) => <span key={i}>{t}</span>)}
        </div>
      </div>

      <section className="section" id="spins">
        <div className="wrap">
          <div className="section-head">
            <p className="eyebrow">Club spins</p>
            <h2 className="section-title">Pick your pace.</h2>
            {site.spins.groupsIntro && <p className="section-lede">{site.spins.groupsIntro}</p>}
          </div>
          <div className="groups">
            {site.groups.map((g) => (
              <article key={g.name} className="group" style={{ "--c": g.color } as React.CSSProperties}>
                <p className="group-name">{g.name} group</p>
                {g.distance && <p className="group-km">{g.distance}<small>km</small></p>}
                {g.duration && <ul className="group-facts"><li>{g.duration}</li></ul>}
                <p>{g.text}</p>
              </article>
            ))}
          </div>
          <Link href="/club-spins" className="link-arrow more">Everything about club spins →</Link>
        </div>
      </section>

      <section className="section">
        <div className="wrap split-grid">
          {site.spinsPhoto && (
            <div className="split-photo">
              <img src={site.spinsPhoto} alt="Club members together on a spin" />
            </div>
          )}
          <div>
            <p className="eyebrow">What we offer</p>
            <h2 className="section-title">More than local loops.</h2>
            {site.offersLede && <p className="section-lede">{site.offersLede}</p>}
            <div className="offers">
              {site.offers.map((o, i) => (
                <div key={o.title} className="offer">
                  <span className="offer-num">0{i + 1}</span>
                  <div>
                    <h3>{o.title}</h3>
                    <p>{o.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section trips" id="trips">
        <div className="wrap">
          <div className="section-head row">
            <div>
              <p className="eyebrow">Trips abroad</p>
              <h2 className="section-title">Big mountains. Bigger stories.</h2>
            </div>
            <Link href="/trips-abroad" className="link-arrow">All trips & photos →</Link>
          </div>
        </div>
        <div className="trip-rail">
          {site.trips.list.map((t) => (
            <Link key={t.year + t.place} href="/trips-abroad" className="trip">
              {t.image && <img className="trip-img" src={t.image.url} alt="" loading="lazy" />}
              <div className="trip-body">
                <p className="trip-year">{t.year}</p>
                <h3>{t.place}</h3>
                <p>{t.text}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {events.length > 0 && (
        <section className="section">
          <div className="wrap">
            <div className="section-head row">
              <div>
                <p className="eyebrow">Calendar</p>
                <h2 className="section-title">Coming up.</h2>
              </div>
              <Link href="/calendar" className="link-arrow">Full calendar →</Link>
            </div>
            <Events events={events} compact />
          </div>
        </section>
      )}

      {posts.length > 0 && (
        <section className="section">
          <div className="wrap">
            <div className="section-head row">
              <div>
                <p className="eyebrow">From the club</p>
                <h2 className="section-title">Latest news.</h2>
              </div>
              <Link href="/news" className="link-arrow">All news →</Link>
            </div>
            <div className="news-grid">
              {posts.map((p, i) => (
                <Link key={p.id} href={`/news/${p.slug}`} className={`news-card ${i === 0 ? "news-feature" : ""}`}>
                  {p.image && <img src={p.image} alt="" />}
                  <div className="news-body">
                    <time>{formatDate(p.date)}</time>
                    <h3>{p.title}</h3>
                    {i === 0 && <p>{p.excerpt}</p>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section join" id="join">
        <div className="wrap join-grid">
          <div>
            <p className="eyebrow">New members welcome</p>
            <h2 className="section-title">Come for a spin.</h2>
            {site.newMembers.intro.map((p) => <p key={p} className="section-lede">{p}</p>)}
          </div>
          <div>
            {site.newMembers.list.length > 0 && (
              <ul className="ticks">
                {site.newMembers.list.map((item) => <li key={item}>{item}</li>)}
              </ul>
            )}
            {site.join.intro.slice(1).map((p) => <p key={p} className="muted">{p}</p>)}
            <div className="hero-ctas">
              <Link className="btn" href="/join-the-club">How to join</Link>
              {site.join.button && (
                <a className="btn btn-ghost" href={joinHref} target="_blank" rel="noreferrer">{site.join.button.text} ↗</a>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
