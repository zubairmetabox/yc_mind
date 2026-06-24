import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCurationState, setCuration, type CurationAction, type CurationType } from "@/lib/curation";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  return NextResponse.json(await getCurationState(userId));
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = await req.json();
  const { type, id, action } = body as {
    type: CurationType;
    id: string;
    action: CurationAction | "clear";
  };

  if (!id || (type !== "company" && type !== "idea")) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (action !== "like" && action !== "dislike" && action !== "neutral" && action !== "clear") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  try {
    await setCuration(userId, type, id, action);
    const state = await getCurationState(userId);
    return NextResponse.json(state);
  } catch (err) {
    console.error("setCuration failed:", err);
    // Most likely cause: deployed on Vercel without Blob storage enabled yet
    // (no durable filesystem to fall back to). See web/README.md.
    return NextResponse.json(
      {
        error:
          "Ratings can't be saved yet — Blob storage isn't connected to this deployment. " +
          "Enable it in the Vercel project's Storage tab, then try again.",
      },
      { status: 503 },
    );
  }
}
