// Derives the redesign's structured content from the live WordPress pages.
import { cache } from "react";
import { backgroundImages, findSection, listItems, paragraphs, type Block, type Section } from "./divi";
import { calendarIdFromEmbed } from "./calendar";
import { getMedia, getPage, getPages, type Media, type Page } from "./wordpress";

const GROUP_COLORS: Record<string, string> = { green: "var(--green)", orange: "var(--orange)", red: "var(--red)" };

// Preferred nav order; any other published pages are appended.
const NAV_ORDER = ["club-spins", "trips-abroad", "calendar", "gallery", "contact-us"];
const HIDDEN = new Set(["home", "join-the-club", "news", "archive"]);

const blocksOf = <T extends Block["type"]>(page: Page | null, type: T) =>
  (page?.sections.flatMap((s) => s.blocks) ?? []).filter((b): b is Extract<Block, { type: T }> => b.type === type);

const firstSentence = (s: string) => s.match(/^.*?[.!?](\s|$)/)?.[0].trim() ?? s;

export type Group = { name: string; color: string; distance: string; duration: string | null; text: string };
export type Trip = { year: string; place: string; text: string; image: Media | null };

export const getSite = cache(async () => {
  const pages = await getPages();
  const [home, spins, trips, join, contact, calendar] = await Promise.all(
    ["home", "club-spins", "trips-abroad", "join-the-club", "contact-us", "calendar"].map(getPage),
  );
  const allHtml = pages.map((p) => p.content).join(" ");

  // Contact details
  const contactText = contact?.content ?? allHtml;
  const email = contactText.match(/[\w.+-]+@[\w-]+\.[\w.]+/)?.[0] ?? null;
  const facebook = allHtml.match(/https?:\/\/(?:www\.)?facebook\.com\/[\w.\-/]+/)?.[0] ?? null;
  const map = spins?.content.match(/https?:\/\/(?:maps\.app\.goo\.gl|(?:www\.)?google\.[a-z.]+\/maps)[^"'\s\]<&]*/)?.[0] ?? null;

  // Sunday spin details from the club spins page
  const spinsIntro = paragraphs(spins?.sections[0]).join(" ");
  const rollOut = spinsIntro.match(/roll out from (?:the )?(.+?) at (\d{1,2}[:.]\d{2}\s*[ap]m)/i);
  const meetPoint = rollOut?.[1].trim() ?? null;
  const startTime = rollOut?.[2].replace(/\s+/g, "") ?? null;

  const groups: Group[] = (spins?.sections ?? [])
    .filter((s) => /^\w+ group$/i.test(s.heading))
    .map((s) => {
      const text = paragraphs(s).join(" ");
      const range = text.match(/(\d+)\s*[–-]\s*(\d+)\s*km/);
      const plus = text.match(/(\d+)\s*km\+/);
      const upTo = text.match(/up to (\d+)\s*km/);
      const distance = range ? `${range[1]}–${range[2]}` : plus ? (upTo ? `${plus[1]}–${upTo[1]}` : `${plus[1]}+`) : "";
      const name = s.heading.replace(/\s*group$/i, "");
      return {
        name: name[0] + name.slice(1).toLowerCase(),
        color: GROUP_COLORS[name.toLowerCase()] ?? "var(--yellow)",
        distance,
        duration: text.match(/out for (?:around )?(.+? hours?)/i)?.[1] ?? null,
        text: paragraphs(s)[0] ?? "",
      };
    });

  // Trips: every heading on the trips page that names a year
  const tripSections = (trips?.sections ?? []).filter((s) => /\b(19|20)\d{2}\b/.test(s.heading));
  const tripCovers = await Promise.all(
    tripSections.map(async (s) => {
      const ids = s.blocks.find((b) => b.type === "gallery")?.ids.slice(0, 1) ?? [];
      return (await getMedia(ids).catch(() => []))[0] ?? null;
    }),
  );
  const tripList: Trip[] = tripSections.map((s, i) => ({
    year: s.heading.match(/\b(?:19|20)\d{2}\b/)![0],
    place: s.heading.replace(/^\s*\d{4}\s*[:–-]\s*/, "").replace(/\s*(January|February|March|April|May|June|July|August|September|October|November|December)?\s*\d{4}\s*$/i, "").trim(),
    text: firstSentence(paragraphs(s)[0] ?? ""),
    image: tripCovers[i],
  }));

  // Home page sections
  const homeSections = home?.sections ?? [];
  const welcome = findSection(homeSections, /welcome/i);
  const offerStart = homeSections.findIndex((s) => /what we offer/i.test(s.heading));
  const newMembers = findSection(homeSections, /new members/i);
  const offerEnd = newMembers ? homeSections.indexOf(newMembers) : homeSections.length;
  const offerRange = offerStart >= 0 ? homeSections.slice(offerStart + 1, offerEnd) : [];
  // A short line without a full stop inside an offer is a bold sub-heading starting another offer.
  const offers: { title: string; text: string }[] = [];
  for (const s of offerRange.filter((s) => s.heading.length < 60)) {
    let current = { title: s.heading, text: "" };
    offers.push(current);
    for (const p of paragraphs(s)) {
      if (p.length < 45 && !/[.!?:]$/.test(p)) offers.push((current = { title: p, text: "" }));
      else if (!current.text) current.text = p;
    }
  }
  const offerList = offers.filter((o) => o.text);
  const offersLede = offerRange.find((s) => s.heading.length >= 60)?.heading.replace(/\.\s*\w{1,3}\.$/, ".") ?? null;

  // Sponsors: images under a "sponsor" heading anywhere, de-duplicated
  const sponsors = [
    ...new Set(pages.flatMap((p) => p.sections).filter((s) => /sponsor/i.test(s.heading)).flatMap((s) => s.blocks).flatMap((b) => (b.type === "image" ? [b.src] : []))),
  ];

  const calendarEmbed = blocksOf(calendar, "embed").find((b) => b.src.includes("calendar.google.com"));

  const nav = [
    ...NAV_ORDER.map((slug) => pages.find((p) => p.slug === slug)).filter((p): p is Page => !!p),
    ...pages.filter((p) => !NAV_ORDER.includes(p.slug) && !HIDDEN.has(p.slug)).sort((a, b) => a.menuOrder - b.menuOrder),
  ].map((p) => ({ href: `/${p.slug}`, label: p.title.replace(/!$/, ""), primary: NAV_ORDER.includes(p.slug) }));

  return {
    name: "Southside Wheely Wheelers",
    logo: blocksOf(home, "image")[0]?.src ?? null,
    hero: backgroundImages(home?.content ?? "")[0] ?? blocksOf(spins, "image")[0]?.src ?? null,
    spinsPhoto: blocksOf(spins, "image")[0]?.src ?? null,
    welcome: paragraphs(welcome),
    tagline: (paragraphs(welcome)[0] ?? "").match(/[^.!?]+[.!?]/g)?.find((x) => /friendly|welcom/i.test(x))?.trim() ?? null,
    offersLede,
    offers: offerList,
    newMembers: { intro: paragraphs(newMembers), list: listItems(newMembers) },
    spins: { intro: paragraphs(spins?.sections[0]), groupsIntro: paragraphs(findSection(spins?.sections ?? [], /spin groups/i))[0] ?? null, meetPoint, startTime },
    groups,
    trips: { intro: paragraphs(trips?.sections[0])[0] ?? null, list: tripList },
    join: { title: join?.title ?? "Join the club", intro: paragraphs(join?.sections[0]).slice(0, 2), button: blocksOf(join, "button")[0] ?? null },
    contact: { intro: paragraphs(contact?.sections[0])[0] ?? null, email, facebook, map },
    calendarId: calendarEmbed ? calendarIdFromEmbed(calendarEmbed.src) : null,
    sponsors,
    nav,
  };
});

export type Site = Awaited<ReturnType<typeof getSite>>;
export type { Section };
