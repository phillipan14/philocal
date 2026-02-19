import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createEvent } from "@/lib/google-calendar";
import { sendReply } from "@/lib/gmail";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { proposal, selectedSlot, emailThread } = await request.json();
  const accessToken = (session as any).accessToken;

  const event = await createEvent(
    accessToken,
    proposal.meetingTitle,
    selectedSlot.start,
    selectedSlot.end,
    proposal.participants,
  );

  await sendReply(
    accessToken,
    emailThread.threadId,
    emailThread.fromEmail,
    emailThread.subject,
    proposal.draftReply,
  );

  return NextResponse.json({
    success: true,
    event,
    message: "Meeting booked and reply sent.",
  });
}
