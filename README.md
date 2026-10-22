# Southside Wheely Wheelers: redesign

A headless Next.js frontend for https://swwcycling.ie. The existing WordPress site stays the CMS: edit content there and it shows up here.

## Where the content comes from
Everything is live; nothing is hard-coded.

| Content | Source | Refresh |
| --- | --- | --- |
| Every page (`/club-spins`, `/trips-abroad`, `/gallery`, …) | WordPress pages API, Divi layout converted by `src/lib/divi.ts` | hourly rebuild |
| Home page sections (welcome, offers, ride groups, trips, join) | Parsed from the Home, Club Spins, Trips Abroad and Join pages in `src/lib/site.ts` | hourly rebuild |
| News and articles | WordPress posts API | hourly rebuild |
| Photo galleries and trip cover photos | WordPress media API (Divi gallery IDs) | hourly rebuild |
| Events (`/calendar`, home "Coming up") | The club's public Google Calendar (the one embedded on the WordPress calendar page) | hourly rebuild |
| YouTube page | The channel's public YouTube RSS feed | hourly rebuild |
| Nav menu, contact email, Facebook, map link, sponsors | Read from the pages above | hourly rebuild |

The home page relies on a few conventions in WordPress: ride groups are headings named "<Colour> GROUP" on the Club Spins page, and trips are headings containing a year on the Trips Abroad page.

## Run locally
```sh
npm run dev                  # development, http://localhost:3000
npm run build && npx serve out   # preview the static build
```

## Deploy (GitHub Pages)
The site is a static export (`out/`), built and deployed by `.github/workflows/deploy.yml`:
- on every push to `main`
- every hour, so new WordPress posts, pages, calendar events and videos appear without a code change
- on demand from the repo's **Actions → Deploy to GitHub Pages → Run workflow**

To publish instantly when WordPress changes, send a `repository_dispatch` event of type `wordpress-updated` to the repo (for example from a WordPress webhook plugin, using a GitHub token with access to this repo only).

The workflow sets `NEXT_PUBLIC_BASE_PATH` to `/<repo-name>` for project sites; with a custom domain it is empty.
Set `WORDPRESS_URL` in `.env.local` to point at a different WordPress install.
