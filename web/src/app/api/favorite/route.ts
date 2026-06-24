import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCurationState, setFavorite, type CurationType } from "@/lib/curation";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  return NextResponse.json(await getCurationState(userId));
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = await req.json();
  const { type, id, starred } = body as {
    type: CurationType;
    id: string;
    starred: boolean;
  };

  if (!id || (type !== "company" && type !== "idea") || typeof starred !== "boolean") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    await setFavorite(userId, type, id, starred);
    const state = await getCurationState(userId);
    return NextResponse.json(state);
  } catch (err) {
    console.error("setFavorite failed:", err);
    return NextResponse.json(
      {
        error:
          "Favorites can't be saved yet — Blob storage isn't connected to this deployment. " +
          "Enable it in the Vercel project's Storage tab, then try again.",
      },
      { status: 503 },
    );
  }
}
