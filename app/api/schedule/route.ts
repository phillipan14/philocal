import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getRecentThreads } from "@/lib/gmail";
import { getEvents } from "@/lib/google-calendar";
import { analyzeAndPropose, classifyEmails } from "@/lib/scheduling-ai";
import { UserPreferences, DEFAULT_PREFERENCES } from "@/lib/types";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = request.headers.get("x-anthropic-key") || undefined;
  const threads = await getRecentThreads((session as any).accessToken);

  try {
    const classified = await classifyEmails(threads, apiKey);
    return NextResponse.json(classified);
  } catch {
    // If no API key, return threads unclassified — user can still see emails
    return NextResponse.json(
      threads.map((t) => ({ ...t, isSchedulingRelated: true })),
    );
  }
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
