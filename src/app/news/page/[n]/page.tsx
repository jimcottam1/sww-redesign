import { NEWS_PER_PAGE, NewsList } from "@/components/NewsList";
import { getPosts } from "@/lib/wordpress";

export const dynamicParams = false;
export const metadata = { title: "News · Southside Wheely Wheelers" };

export async function generateStaticParams() {
  const { totalPages } = await getPosts(NEWS_PER_PAGE, 1);
  return Array.from({ length: Math.max(0, totalPages - 1) }, (_, i) => ({ n: String(i + 2) }));
}

export default async function NewsPageN({ params }: { params: Promise<{ n: string }> }) {
  return <NewsList page={Number((await params).n)} />;
}
