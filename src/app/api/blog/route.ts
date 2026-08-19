import { jsonResponse } from "@/lib/http";
import { BLOG_POSTS } from "@/lib/site-content";

export const runtime = "nodejs";

export async function GET() {
  return jsonResponse({
    posts: BLOG_POSTS.map((post) => ({
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      date: post.date,
      minutes: post.minutes,
      tags: post.tags,
    })),
  });
}
