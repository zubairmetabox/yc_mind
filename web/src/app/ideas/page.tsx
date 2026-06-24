import { redirect } from "next/navigation";

// Ideas page is hidden for now (nav links removed in nav-links.tsx and
// mobile-tab-bar.tsx) — redirect away in case anyone hits the URL directly.
// All the underlying code/data is still here if this needs reverting; see
// ideas-board.tsx, idea-card.tsx, ideas-parser.ts.
export default function IdeasPage() {
  redirect("/");
}
