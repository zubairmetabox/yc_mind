import { NextResponse } from "next/server";

// No auth on this app, and it holds Zubair's personal curation data — set
// X-Robots-Tag on every response (pages AND API routes) so it's never
// indexed regardless of how a crawler found the URL. robots.txt only stops
// well-behaved crawlers from *visiting*; this header is the actual
// authoritative no-index signal search engines respect even if the URL
// gets linked from somewhere else.
export function proxy() {
  const response = NextResponse.next();
  response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive, nosnippet");
  return response;
}

export const config = {
  matcher: "/:path*",
};
