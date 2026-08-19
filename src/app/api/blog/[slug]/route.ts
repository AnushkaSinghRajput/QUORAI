import { errorResponse, jsonResponse } from "@/lib/http";
import { getPost } from "@/lib/site-content";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const post = getPost(slug);
  if (!post) return errorResponse("Post not found.", 404);
  return jsonResponse({ post });
}
