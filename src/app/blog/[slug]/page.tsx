import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { BLOG_POSTS, getPost } from "@/lib/site-content";

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  return { title: post?.title ?? "Blog" };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
        <Link href="/blog" className="text-sm text-ink-soft hover:text-ink">
          ← Blog
        </Link>
        <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
          {post.date} · {post.minutes} min
        </p>
        <h1 className="mt-3 font-display text-4xl tracking-tight text-ink">
          {post.title}
        </h1>
        <div className="mt-8 space-y-4 text-base leading-relaxed text-ink-soft">
          {post.body.map((paragraph) => (
            <p key={paragraph.slice(0, 24)}>{paragraph}</p>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
