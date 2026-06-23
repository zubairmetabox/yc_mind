import { NextResponse } from "next/server";
import { getCurationState, setCuration, type CurationAction, type CurationType } from "@/lib/curation";

export async function GET() {
  return NextResponse.json(getCurationState());
}

export async function POST(req: Request) {
  const body = await req.json();
  const { type, id, action } = body as {
    type: CurationType;
    id: string;
    action: CurationAction | "clear";
  };

  if (!id || (type !== "company" && type !== "idea")) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (action !== "like" && action !== "dislike" && action !== "clear") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const state = setCuration(type, id, action);
  return NextResponse.json(state);
}
