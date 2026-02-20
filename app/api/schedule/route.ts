import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSchedulingThreads, getThreadDetails } from "@/lib/agentmail";
import { getEvents } from "@/lib/google-calendar";
import { analyzeAndPropose } from "@/lib/scheduling-ai";
import { UserPreferences, DEFAULT_PREFERENCES } from "@/lib/types";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const threads = await getSchedulingThreads();
  return NextResponse.json(threads);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { email, preferences } = await request.json();
    const prefs: UserPreferences = preferences || DEFAULT_PREFERENCES;

    // Fetch full thread body from AgentMail for better AI analysis
    const fullThread = await getThreadDetails(email.threadId);
    const emailForAnalysis = fullThread || email;

    const now = new Date();
    const weekOut = new Date(now.getTime() + 7 * 86400000);
    let events: any[] = [];
    try {
      events = await getEvents(
        (session as any).accessToken,
        now.toISOString(),
        weekOut.toISOString(),
      );
    } catch {
      // Calendar fetch may fail with stale token — continue with empty events
    }

    const proposal = await analyzeAndPropose(emailForAnalysis, events, prefs);
    return NextResponse.json(proposal);
  } catch (err: any) {
    const message = err?.message || "Failed to generate proposal";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
