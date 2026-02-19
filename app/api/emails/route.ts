import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getRecentThreads } from "@/lib/gmail";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const threads = await getRecentThreads((session as any).accessToken);
  return NextResponse.json(threads);
}
