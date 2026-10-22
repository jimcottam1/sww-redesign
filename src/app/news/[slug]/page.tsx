import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate, getAllPosts, getPost } from "@/lib/wordpress";

export const dynamicParams = false;

export async function generateStaticParams() {
  return (await getAllPosts()).map((p) => ({ slug: p.slug }));
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const post = await getPost((await params).slug);
  if (!post) notFound();
  return (
    <main className="section page-top">
      <article className="wrap article">
        <Link href="/news" className="link-arrow">← All news</Link>
        <time>{formatDate(post.date)}</time>
        <h1 className="article-title">{post.title}</h1>
        {post.image && <img className="article-hero" src={post.image} alt="" />}
        <div className="prose" dangerouslySetInnerHTML={{ __html: post.content }} />
      </article>
    </main>
  );
}
