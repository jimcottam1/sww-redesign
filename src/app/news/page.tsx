import { NewsList } from "@/components/NewsList";

export const metadata = { title: "News · Southside Wheely Wheelers" };

export default function NewsPage() {
  return <NewsList page={1} />;
}
