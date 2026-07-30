import { notFound } from "next/navigation";
import { Landing } from "@/components/landing";
import { localeFromSegments } from "@/lib/lang";

export default async function HomePage({ params }: { params: Promise<{ lang?: string[] }> }) {
  const locale = localeFromSegments((await params).lang);
  if (!locale) notFound();

  return <Landing locale={locale} />;
}
