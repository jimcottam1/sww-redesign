import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Sections } from "@/components/Blocks";
import { Events } from "@/components/Events";
import { getUpcomingEvents } from "@/lib/calendar";
import { getSite } from "@/lib/site";
import { getPage, getPages } from "@/lib/wordpress";

// Pages that the redesign shows elsewhere (the home page and the news listing).
const SKIP = new Set(["home", "news", "archive"]);

export const dynamicParams = false;

export async function generateStaticParams() {
  const pages = await getPages();
  return pages.filter((p) => !SKIP.has(p.slug)).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const page = await getPage((await params).slug);
  return { title: page ? `${page.title} · Southside Wheely Wheelers` : "Not found" };
}

export default async function WPPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) notFound();

  const site = await getSite();
  const isCalendar = slug === "calendar" && site.calendarId;
  const events = isCalendar ? await getUpcomingEvents(site.calendarId!).catch(() => []) : [];

  // The page's own first heading becomes the big title.
  const [first, ...rest] = page.sections;
  const titleFromContent = first?.level === 1 || first?.level === 2 ? first.heading : null;
  let sections = titleFromContent ? [{ ...first, heading: "" }, ...rest] : page.sections;
  // The Google Calendar embed is replaced by the native events list, so drop it and any heading left empty.
  if (isCalendar)
    sections = sections
      .map((s) => ({ ...s, blocks: s.blocks.filter((b) => b.type !== "embed") }))
      .filter((s) => s.blocks.length);

  return (
    <main className="section page-top">
      <div className="wrap page">
        <p className="eyebrow">Southside Wheely Wheelers</p>
        <h1 className="section-title page-title">{(titleFromContent ?? page.title).replace(/!$/, "")}.</h1>
        <Sections sections={sections} />
        {isCalendar && (
          <section className="wp-section">
            <h2 className="wp-heading">Upcoming events</h2>
            <Events events={events} />
          </section>
        )}
      </div>
    </main>
  );
}
