import type { Metadata } from "next";
import { Inter, Righteous, Shrikhand } from "next/font/google";
import Link from "next/link";
import { Stripes } from "@/components/Groovy";
import { getSite } from "@/lib/site";
import "./globals.css";

const display = Shrikhand({ subsets: ["latin"], weight: "400", variable: "--font-display" });
const body = Inter({ subsets: ["latin"], variable: "--font-body" });
const label = Righteous({ subsets: ["latin"], weight: "400", variable: "--font-label" });

export const metadata: Metadata = {
  title: "Southside Wheely Wheelers · Cycling Club, Kilmallock",
  description: "A friendly cycling club in Kilmallock, Co. Limerick. Sunday spins all year round, three groups, coffee stop guaranteed.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const site = await getSite();
  const news = { href: "/news", label: "News", primary: true };
  const links = [...site.nav.slice(0, 3), news, ...site.nav.slice(3)];

  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${label.variable}`}>
      <body>
        <header className="nav">
          <Link href="/" className="nav-brand">
            {site.logo && <img src={site.logo} alt="" width={40} height={40} />}
            <span>Southside<br />Wheely Wheelers</span>
          </Link>
          <nav className="nav-links">
            {links.filter((l) => l.primary).map((l) => <Link key={l.href} href={l.href}>{l.label}</Link>)}
          </nav>
          <div className={`nav-end ${links.some((l) => !l.primary) ? "has-more" : ""}`}>
            <Link href="/join-the-club" className="btn btn-sm">Join the club</Link>
            <details className="nav-menu">
              <summary aria-label="Menu"><span /><span /></summary>
              <nav>
                {links.map((l) => <Link key={l.href} href={l.href}>{l.label}</Link>)}
              </nav>
            </details>
          </div>
        </header>
        {children}
        <footer className="footer" id="contact">
          <Stripes />
          <div className="wrap footer-grid">
            <div>
              <p className="eyebrow">Get in touch</p>
              <h2 className="footer-title">Questions about joining or upcoming spins?</h2>
              {site.contact.email && <a className="footer-email" href={`mailto:${site.contact.email}`}>{site.contact.email}</a>}
            </div>
            <div className="footer-meta">
              {site.spins.meetPoint && (
                <p><strong>Sunday spins</strong><br />{site.spins.startTime} · {site.spins.meetPoint}</p>
              )}
              {site.contact.map && <p><a href={site.contact.map} target="_blank" rel="noreferrer">Open in Google Maps ↗</a></p>}
              {site.contact.facebook && <p><a href={site.contact.facebook} target="_blank" rel="noreferrer">Message us on Facebook ↗</a></p>}
            </div>
          </div>
          {site.sponsors.length > 0 && (
            <div className="wrap sponsors">
              <p className="eyebrow">Website sponsors</p>
              <div className="sponsor-logos">
                {site.sponsors.map((src) => <img key={src} src={src} alt="Sponsor logo" loading="lazy" />)}
              </div>
            </div>
          )}
          <div className="wrap footer-base">
            <span>© {new Date().getFullYear()} {site.name} Cycling Club</span>
            <span>Content from <a href="https://swwcycling.ie">swwcycling.ie</a></span>
          </div>
        </footer>
      </body>
    </html>
  );
}
