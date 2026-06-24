import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Every route in this app is personal data — require sign-in everywhere,
// no public pages. auth.protect() with no matcher list = protect everything.
export default clerkMiddleware(async (auth) => {
  await auth.protect();

  // Still no auth on this app from a *search engine's* point of view — keep
  // it out of indexes regardless of who's signed in. robots.txt only stops
  // well-behaved crawlers from visiting; this header is the authoritative
  // no-index signal even if the URL gets linked from somewhere else.
  const response = NextResponse.next();
  response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive, nosnippet");
  return response;
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
