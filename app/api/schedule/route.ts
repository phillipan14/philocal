import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getRecentThreads } from "@/lib/gmail";
import { getEvents } from "@/lib/google-calendar";
import { analyzeAndPropose, classifyEmails } from "@/lib/scheduling-ai";
import { UserPreferences, DEFAULT_PREFERENCES } from "@/lib/types";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const threads = await getRecentThreads((session as any).accessToken);
  const classified = await classifyEmails(threads);
  return NextResponse.json(classified);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { email, preferences } = await request.json();
  const prefs: UserPreferences = preferences || DEFAULT_PREFERENCES;

  const now = new Date();
  const weekOut = new Date(now.getTime() + 7 * 86400000);
  const events = await getEvents(
    (session as any).accessToken,
    now.toISOString(),
    weekOut.toISOString(),
  );

  const proposal = await analyzeAndPropose(email, events, prefs);
  return NextResponse.json(proposal);
}
