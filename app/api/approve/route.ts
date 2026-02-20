import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createEvent } from "@/lib/google-calendar";
import { replyToThread } from "@/lib/agentmail";
import { sendReply } from "@/lib/gmail";
import { buildSchedulingReplyHtml, htmlToPlainText } from "@/lib/email-template";
import { updateStatus } from "@/lib/conversation-store";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { proposal, selectedSlot, emailThread, source } = await request.json();
    const accessToken = (session as any).accessToken;

    // Build a confirmation HTML email for the selected slot
    const recipientName = emailThread.from?.split(" ")[0] || "there";
    const confirmHtml = buildSchedulingReplyHtml({
      recipientName,
      greeting: `Great news! I've booked us in for ${selectedSlot.label}.`,
      context: "You should receive a calendar invite shortly.",
      slots: [selectedSlot],
      closing: "Looking forward to it!",
      senderName: "Phillip",
    });
    const confirmPlain = htmlToPlainText(confirmHtml);

    // Always send the confirmation email (single selected slot, not all 3 proposed)
    const htmlBody = confirmHtml;
    const plainBody = confirmPlain;

    // Create the calendar event
    const event = await createEvent(
      accessToken,
      proposal.meetingTitle,
      selectedSlot.start,
      selectedSlot.end,
      proposal.participants,
    );

    // Send the reply via the appropriate channel
    if (source === "gmail") {
      await sendReply(
        accessToken,
        emailThread.threadId,
        emailThread.fromEmail,
        emailThread.subject,
        plainBody,
        htmlBody,
      );
    } else {
      // AgentMail
      await replyToThread(emailThread.threadId, plainBody, htmlBody);
    }

    // Update conversation store
    await updateStatus(emailThread.threadId, "booked", {
      selectedSlot: selectedSlot,
      calendarEventId: event.id || null,
      calendarEventLink: event.htmlLink || null,
    });

    return NextResponse.json({
      success: true,
      event,
      message: "Meeting booked and reply sent.",
    });
  } catch (err: any) {
    const message = err?.message || "Failed to book meeting";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
