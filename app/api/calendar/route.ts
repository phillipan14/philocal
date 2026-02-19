import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getEvents, createEvent } from "@/lib/google-calendar";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const timeMin =
    searchParams.get("timeMin") || new Date().toISOString();
  const timeMax =
    searchParams.get("timeMax") ||
    new Date(Date.now() + 7 * 86400000).toISOString();

  const events = await getEvents(
    (session as any).accessToken,
    timeMin,
    timeMax,
  );
  return NextResponse.json(events);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { summary, start, end, attendees, location } = await request.json();
  const event = await createEvent(
    (session as any).accessToken,
    summary,
    start,
    end,
    attendees,
    location,
  );
  return NextResponse.json(event);
}
