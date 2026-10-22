import Link from "next/link";
import { formatDate, getPosts } from "@/lib/wordpress";

export const NEWS_PER_PAGE = 12;

export async function NewsList({ page }: { page: number }) {
  const { posts, totalPages } = await getPosts(NEWS_PER_PAGE, page);
  const pageHref = (n: number) => (n === 1 ? "/news" : `/news/page/${n}`);

  return (
    <main className="section page-top">
      <div className="wrap">
        <p className="eyebrow">From the club</p>
        <h1 className="section-title">News.</h1>
        <div className="news-grid all">
          {posts.map((p) => (
            <Link key={p.id} href={`/news/${p.slug}`} className="news-card">
              {p.image && <img src={p.image} alt="" loading="lazy" />}
              <div className="news-body">
                <time>{formatDate(p.date)}</time>
                <h3>{p.title}</h3>
                <p>{p.excerpt}</p>
              </div>
            </Link>
          ))}
        </div>
        {totalPages > 1 && (
          <nav className="pager">
            {page > 1 ? <Link className="btn btn-ghost" href={pageHref(page - 1)}>← Newer</Link> : <span />}
            <span className="muted">Page {page} of {totalPages}</span>
            {page < totalPages ? <Link className="btn btn-ghost" href={pageHref(page + 1)}>Older →</Link> : <span />}
          </nav>
        )}
      </div>
    </main>
  );
}
