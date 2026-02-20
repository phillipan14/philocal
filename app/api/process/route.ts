import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { processAllThreads } from "@/lib/processor";
import { getAllConversations } from "@/lib/conversation-store";
import { UserPreferences, DEFAULT_PREFERENCES } from "@/lib/types";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const prefs: UserPreferences = body.preferences || DEFAULT_PREFERENCES;
    const accessToken = (session as any).accessToken;

    const result = await processAllThreads(accessToken, prefs);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Processing failed" },
      { status: 500 },
    );
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const conversations = await getAllConversations();
    return NextResponse.json(conversations);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to load conversations" },
      { status: 500 },
    );
  }
}
