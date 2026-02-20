import {
  ConversationState,
  EmailThread,
  TimeSlot,
  UserPreferences,
} from "./types";
import {
  loadStore,
  saveStore,
  getConversation,
} from "./conversation-store";
import {
  getSchedulingThreads,
  getThreadWithMessages,
  getThreadMessageCount,
  replyToThread,
} from "./agentmail";
import { getEvents, createEvent } from "./google-calendar";
import { analyzeAndPropose, analyzeReply } from "./scheduling-ai";
import {
  buildConfirmationHtml,
  buildReProposalHtml,
  buildClarificationHtml,
  htmlToPlainText,
} from "./email-template";

const AGENTMAIL_INBOX = process.env.AGENTMAIL_INBOX_ID || "philocal@agentmail.to";
const MAX_ATTEMPTS = 3;
const DEDUP_GUARD_MS = 10_000;

export interface ProcessingResult {
  processed: number;
  errors: string[];
  details: Record<string, { status: string; action: string }>;
}

export async function processAllThreads(
  accessToken: string,
  prefs: UserPreferences,
): Promise<ProcessingResult> {
  const result: ProcessingResult = { processed: 0, errors: [], details: {} };
  const store = await loadStore();

  // Fetch current threads from AgentMail
  let threads: EmailThread[];
  try {
    threads = await getSchedulingThreads();
  } catch (err: any) {
    result.errors.push(`Failed to fetch threads: ${err.message}`);
    return result;
  }

  // Fetch calendar events once for all threads
  const now = new Date();
  const weekOut = new Date(now.getTime() + 7 * 86400000);
  let events: any[] = [];
  try {
    events = await getEvents(accessToken, now.toISOString(), weekOut.toISOString());
  } catch {
    // Continue with empty events — calendar might have stale token
  }

  for (const thread of threads) {
    try {
      const conv = store.conversations[thread.threadId];
      const action = await processThread(thread, conv, accessToken, prefs, events, store);
      result.details[thread.threadId] = action;
      result.processed++;
    } catch (err: any) {
      result.errors.push(`Thread ${thread.threadId}: ${err.message}`);
      result.details[thread.threadId] = { status: "error", action: err.message };
      // Mark errored in store
      if (store.conversations[thread.threadId]) {
        store.conversations[thread.threadId].status = "error";
        store.conversations[thread.threadId].errorMessage = err.message;
        store.conversations[thread.threadId].updatedAt = new Date().toISOString();
      }
    }
  }

  store.lastProcessedAt = new Date().toISOString();
  await saveStore(store);
  return result;
}

async function processThread(
  thread: EmailThread,
  conv: ConversationState | undefined,
  accessToken: string,
  prefs: UserPreferences,
  events: any[],
  store: { conversations: Record<string, ConversationState>; lastProcessedAt: string | null },
): Promise<{ status: string; action: string }> {
  // Not in store — create as new
  if (!conv) {
    const newConv: ConversationState = {
      threadId: thread.threadId,
      status: "new",
      senderName: thread.from,
      senderEmail: thread.fromEmail,
      subject: thread.subject,
      proposedSlots: [],
      selectedSlot: null,
      meetingTitle: "",
      participants: [],
      lastMessageId: null,
      messageCount: 0,
      attempts: 0,
      previouslyRejectedSlots: [],
      calendarEventId: null,
      calendarEventLink: null,
      errorMessage: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.conversations[thread.threadId] = newConv;
    conv = newConv;
  }

  // Dedup guard — skip if processed very recently
  const msSinceUpdate = Date.now() - new Date(conv.updatedAt).getTime();
  if (conv.status !== "new" && msSinceUpdate < DEDUP_GUARD_MS) {
    return { status: conv.status, action: "skipped (dedup)" };
  }

  // Terminal states
  if (conv.status === "booked" || conv.status === "stalled") {
    return { status: conv.status, action: "terminal" };
  }

  // State machine
  switch (conv.status) {
    case "new":
      return await handleNew(conv, thread, accessToken, prefs, events, store);
    case "awaiting_reply":
      return await handleAwaitingReply(conv, accessToken, prefs, events, store);
    case "processing_reply":
      return await handleProcessingReply(conv, accessToken, prefs, events, store);
    case "error":
      // If we already have a selected slot, retry just the booking
      if (conv.selectedSlot) {
        return await retryBooking(conv, accessToken, prefs, events, store);
      }
      // Otherwise restart the full flow
      conv.status = "new";
      conv.errorMessage = null;
      return await handleNew(conv, thread, accessToken, prefs, events, store);
    default:
      return { status: conv.status, action: "no action" };
  }
}

async function handleNew(
  conv: ConversationState,
  thread: EmailThread,
  accessToken: string,
  prefs: UserPreferences,
  events: any[],
  store: { conversations: Record<string, ConversationState>; lastProcessedAt: string | null },
): Promise<{ status: string; action: string }> {
  conv.status = "proposing";
  conv.updatedAt = new Date().toISOString();

  // Get full thread details for better AI analysis
  const threadData = await getThreadWithMessages(thread.threadId);
  const emailForAnalysis = threadData?.thread || thread;

  const proposal = await analyzeAndPropose(emailForAnalysis, events, prefs, {
    previouslyRejectedSlots: conv.previouslyRejectedSlots,
    attempt: conv.attempts + 1,
  });

  if (proposal.intent === "unclear") {
    conv.status = "stalled";
    conv.errorMessage = "Email does not appear to be a scheduling request";
    conv.updatedAt = new Date().toISOString();
    return { status: "stalled", action: "not a scheduling email" };
  }

  // Send proposal email
  const plainReply = htmlToPlainText(proposal.htmlReply || proposal.draftReply);
  await replyToThread(thread.threadId, plainReply, proposal.htmlReply);

  // Update conversation state
  conv.status = "awaiting_reply";
  conv.proposedSlots = proposal.proposedSlots;
  conv.meetingTitle = proposal.meetingTitle;
  conv.participants = proposal.participants;
  conv.attempts = conv.attempts + 1;
  conv.messageCount = threadData?.messages.length ?? 1;
  conv.updatedAt = new Date().toISOString();

  return { status: "awaiting_reply", action: "proposal sent" };
}

async function handleAwaitingReply(
  conv: ConversationState,
  accessToken: string,
  prefs: UserPreferences,
  events: any[],
  store: { conversations: Record<string, ConversationState>; lastProcessedAt: string | null },
): Promise<{ status: string; action: string }> {
  // Check if there's a new message
  const currentCount = await getThreadMessageCount(conv.threadId);

  if (currentCount <= conv.messageCount) {
    return { status: "awaiting_reply", action: "no new messages" };
  }

  // New message detected — transition to processing
  conv.status = "processing_reply";
  conv.updatedAt = new Date().toISOString();

  return await handleProcessingReply(conv, accessToken, prefs, events, store);
}

async function handleProcessingReply(
  conv: ConversationState,
  accessToken: string,
  prefs: UserPreferences,
  events: any[],
  store: { conversations: Record<string, ConversationState>; lastProcessedAt: string | null },
): Promise<{ status: string; action: string }> {
  // Fetch all messages
  const threadData = await getThreadWithMessages(conv.threadId);
  if (!threadData) {
    conv.status = "error";
    conv.errorMessage = "Could not fetch thread messages";
    conv.updatedAt = new Date().toISOString();
    return { status: "error", action: "fetch failed" };
  }

  conv.messageCount = threadData.messages.length;

  // Filter out messages from our own inbox to only analyze sender messages
  const senderMessages = threadData.messages.filter(
    (m) => m.fromEmail !== AGENTMAIL_INBOX && !m.fromEmail.endsWith("@agentmail.to"),
  );

  if (senderMessages.length === 0) {
    conv.status = "awaiting_reply";
    conv.updatedAt = new Date().toISOString();
    return { status: "awaiting_reply", action: "no sender messages found" };
  }

  // Analyze the reply
  const analysis = await analyzeReply(threadData.messages, conv.proposedSlots, prefs);

  switch (analysis.type) {
    case "slot_selected": {
      const slotIdx = analysis.selectedSlotIndex ?? 0;
      const slot = conv.proposedSlots[slotIdx];
      if (!slot) {
        conv.status = "error";
        conv.errorMessage = `Invalid slot index: ${slotIdx}`;
        conv.updatedAt = new Date().toISOString();
        return { status: "error", action: "invalid slot index" };
      }

      conv.selectedSlot = slot;
      conv.status = "confirmed";
      conv.updatedAt = new Date().toISOString();

      // Verify availability
      const now = new Date();
      const weekOut = new Date(now.getTime() + 7 * 86400000);
      let freshEvents = events;
      try {
        freshEvents = await getEvents(accessToken, now.toISOString(), weekOut.toISOString());
      } catch { /* use existing events */ }

      // Create calendar event
      try {
        const calEvent = await createEvent(
          accessToken,
          conv.meetingTitle,
          slot.start,
          slot.end,
          conv.participants,
        );
        conv.calendarEventId = calEvent.id || null;
        conv.calendarEventLink = calEvent.htmlLink || null;
      } catch (err: any) {
        conv.status = "error";
        conv.errorMessage = `Calendar create failed: ${err.message}`;
        conv.updatedAt = new Date().toISOString();
        return { status: "error", action: "calendar creation failed" };
      }

      // Send confirmation email
      const confirmHtml = buildConfirmationHtml(conv.senderName.split(" ")[0], slot, conv.meetingTitle);
      const confirmPlain = htmlToPlainText(confirmHtml);
      await replyToThread(conv.threadId, confirmPlain, confirmHtml);

      conv.status = "booked";
      conv.updatedAt = new Date().toISOString();
      return { status: "booked", action: `booked slot ${slotIdx + 1}` };
    }

    case "rejection": {
      // Add current slots to rejected list
      conv.previouslyRejectedSlots = [
        ...conv.previouslyRejectedSlots,
        ...conv.proposedSlots,
      ];

      if (conv.attempts >= MAX_ATTEMPTS) {
        // Graceful fallback
        const fallbackHtml = buildClarificationHtml(
          conv.senderName.split(" ")[0],
          [],
        );
        // Send a simple "let's figure this out" message
        const fallbackText = `Hi ${conv.senderName.split(" ")[0]},\n\nIt seems like the times I've proposed haven't worked out. Feel free to suggest some times that work better for you, and I'll get us booked in!\n\nBest regards,\nPhillip`;
        await replyToThread(conv.threadId, fallbackText);

        conv.status = "stalled";
        conv.updatedAt = new Date().toISOString();
        return { status: "stalled", action: "max attempts reached" };
      }

      // Re-propose with new times
      conv.status = "re_proposing";
      conv.updatedAt = new Date().toISOString();

      const emailForAnalysis = threadData.thread;
      const newProposal = await analyzeAndPropose(emailForAnalysis, events, prefs, {
        previouslyRejectedSlots: conv.previouslyRejectedSlots,
        attempt: conv.attempts + 1,
      });

      const reProposalHtml = buildReProposalHtml(
        conv.senderName.split(" ")[0],
        newProposal.proposedSlots,
      );
      const reProposalPlain = htmlToPlainText(reProposalHtml);
      await replyToThread(conv.threadId, reProposalPlain, reProposalHtml);

      conv.proposedSlots = newProposal.proposedSlots;
      conv.attempts += 1;
      conv.status = "awaiting_reply";
      conv.updatedAt = new Date().toISOString();
      return { status: "awaiting_reply", action: "re-proposed new times" };
    }

    case "counter_proposal": {
      // Treat counter-proposal like a rejection + new info — re-propose
      conv.previouslyRejectedSlots = [
        ...conv.previouslyRejectedSlots,
        ...conv.proposedSlots,
      ];

      if (conv.attempts >= MAX_ATTEMPTS) {
        conv.status = "stalled";
        conv.updatedAt = new Date().toISOString();
        return { status: "stalled", action: "max attempts on counter-proposal" };
      }

      // Re-analyze considering the counter-proposal (it's in the thread history)
      const emailForAnalysis = threadData.thread;
      const newProposal = await analyzeAndPropose(emailForAnalysis, events, prefs, {
        previouslyRejectedSlots: conv.previouslyRejectedSlots,
        attempt: conv.attempts + 1,
      });

      const reProposalHtml = buildReProposalHtml(
        conv.senderName.split(" ")[0],
        newProposal.proposedSlots,
      );
      const reProposalPlain = htmlToPlainText(reProposalHtml);
      await replyToThread(conv.threadId, reProposalPlain, reProposalHtml);

      conv.proposedSlots = newProposal.proposedSlots;
      conv.attempts += 1;
      conv.status = "awaiting_reply";
      conv.updatedAt = new Date().toISOString();
      return { status: "awaiting_reply", action: "re-proposed after counter" };
    }

    case "unclear":
    default: {
      // Send clarification
      const clarifyHtml = buildClarificationHtml(
        conv.senderName.split(" ")[0],
        conv.proposedSlots,
      );
      const clarifyPlain = htmlToPlainText(clarifyHtml);
      await replyToThread(conv.threadId, clarifyPlain, clarifyHtml);

      conv.status = "awaiting_reply";
      conv.updatedAt = new Date().toISOString();
      return { status: "awaiting_reply", action: "sent clarification" };
    }
  }
}

async function retryBooking(
  conv: ConversationState,
  accessToken: string,
  _prefs: UserPreferences,
  _events: any[],
  _store: { conversations: Record<string, ConversationState>; lastProcessedAt: string | null },
): Promise<{ status: string; action: string }> {
  const slot = conv.selectedSlot!;
  conv.errorMessage = null;
  conv.status = "confirmed";
  conv.updatedAt = new Date().toISOString();

  try {
    const calEvent = await createEvent(
      accessToken,
      conv.meetingTitle,
      slot.start,
      slot.end,
      conv.participants,
    );
    conv.calendarEventId = calEvent.id || null;
    conv.calendarEventLink = calEvent.htmlLink || null;
  } catch (err: any) {
    conv.status = "error";
    conv.errorMessage = `Calendar create failed: ${err.message}`;
    conv.updatedAt = new Date().toISOString();
    return { status: "error", action: "calendar retry failed" };
  }

  // Send confirmation email
  const confirmHtml = buildConfirmationHtml(conv.senderName.split(" ")[0], slot, conv.meetingTitle);
  const confirmPlain = htmlToPlainText(confirmHtml);
  await replyToThread(conv.threadId, confirmPlain, confirmHtml);

  conv.status = "booked";
  conv.updatedAt = new Date().toISOString();
  return { status: "booked", action: "booked (retry)" };
}
