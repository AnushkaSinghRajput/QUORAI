import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { BLOG_POSTS } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "Blog",
};

export default function BlogPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#f0c4c8]">
          Blog
        </p>
        <h1 className="mt-3 font-display text-4xl tracking-tight text-ink">
          Notes from the research desk
        </h1>
        <div className="mt-10 grid gap-3">
          {BLOG_POSTS.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="surface rounded-[1.4rem] p-6 transition hover:border-white/25"
            >
              <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                {post.date} · {post.minutes} min · {post.tags.join(" · ")}
              </div>
              <h2 className="mt-3 font-display text-2xl text-ink">{post.title}</h2>
              <p className="mt-2 max-w-2xl text-sm text-ink-soft">{post.excerpt}</p>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
