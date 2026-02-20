import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import {
  CalendarEvent,
  EmailThread,
  UserPreferences,
  SchedulingProposal,
  TimeSlot,
  ThreadMessage,
  ReplyAnalysis,
} from "./types";
import { buildSchedulingReplyHtml } from "./email-template";

function buildPrompt(
  email: EmailThread,
  events: CalendarEvent[],
  prefs: UserPreferences,
  options?: { previouslyRejectedSlots?: TimeSlot[]; attempt?: number },
): string {
  const eventsContext = events
    .map((e) => `- ${e.summary}: ${e.start} to ${e.end}`)
    .join("\n");

  const rejectedContext =
    options?.previouslyRejectedSlots && options.previouslyRejectedSlots.length > 0
      ? `\nPREVIOUSLY REJECTED SLOTS (do NOT propose these again):\n${options.previouslyRejectedSlots.map((s) => `- ${s.label} (${s.start} to ${s.end})`).join("\n")}\n`
      : "";

  const attemptNote =
    options?.attempt && options.attempt > 1
      ? `\nThis is re-proposal attempt ${options.attempt}. Propose DIFFERENT times from the rejected slots above.\n`
      : "";

  return `You are PhiloCal, an AI scheduling assistant. Analyze this email and propose meeting times.

USER PREFERENCES:
- Timezone: ${prefs.timezone}
- Working hours: ${prefs.workingHoursStart} to ${prefs.workingHoursEnd}
- Buffer between meetings: ${prefs.bufferMinutes} minutes
- Default meeting duration: ${prefs.defaultDuration} minutes
- Default location: ${prefs.defaultLocation}

CALENDAR (next 7 days):
${eventsContext || "No events scheduled."}
${rejectedContext}${attemptNote}
EMAIL:
From: ${email.from} <${email.fromEmail}>
Subject: ${email.subject}
Body: ${email.body}

INSTRUCTIONS:
1. Determine if this email contains a scheduling request.
2. If yes, propose exactly 3 time slots that work given the calendar and preferences.
3. Write short reply components (NOT the full email — we build the HTML ourselves).
4. If this is NOT a scheduling email, set intent to "unclear".

For proposedSlots labels, use a clear format like "Wednesday, February 24, 2:00 PM – 2:30 PM".

Respond in this exact JSON format (no markdown, no code fences):
{
  "intent": "schedule_meeting",
  "meetingTitle": "string - suggested meeting title",
  "meetingDuration": 30,
  "participants": ["email@example.com"],
  "proposedSlots": [
    { "start": "ISO datetime", "end": "ISO datetime", "label": "Wednesday, February 24, 2:00 PM – 2:30 PM" }
  ],
  "replyGreeting": "string - one warm sentence acknowledging their email, e.g. 'Thanks for reaching out! I'd love to grab coffee and discuss the collaboration.'",
  "replyContext": "string - optional one sentence of context, or empty string if not needed",
  "replyClosing": "string - one sentence closing, e.g. 'Let me know if any of these work for you. Looking forward to our chat!'"
}`;
}

async function callAnthropic(
  prompt: string,
  apiKey: string,
): Promise<string> {
  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });
  return response.content[0].type === "text" ? response.content[0].text : "";
}

async function callOpenAI(
  prompt: string,
  apiKey: string,
): Promise<string> {
  const client = new OpenAI({ apiKey });
  const response = await client.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });
  return response.choices[0]?.message?.content || "";
}

export async function analyzeAndPropose(
  email: EmailThread,
  events: CalendarEvent[],
  prefs: UserPreferences,
  options?: { previouslyRejectedSlots?: TimeSlot[]; attempt?: number },
): Promise<SchedulingProposal> {
  const provider = prefs.aiProvider || "anthropic";
  const prompt = buildPrompt(email, events, prefs, options);

  let text: string;

  if (provider === "openai") {
    const key = prefs.openaiApiKey || process.env.OPENAI_API_KEY;
    if (!key) throw new Error("No OpenAI API key provided. Add one in Settings.");
    text = await callOpenAI(prompt, key);
  } else {
    const key = prefs.anthropicApiKey || process.env.ANTHROPIC_API_KEY;
    if (!key) throw new Error("No Anthropic API key provided. Add one in Settings.");
    text = await callAnthropic(prompt, key);
  }

  const parsed = JSON.parse(text);

  const slots = parsed.proposedSlots || [];
  const recipientName = email.from.split(" ")[0] || "there";

  // Build the HTML email from structured components
  const htmlReply = buildSchedulingReplyHtml({
    recipientName,
    greeting: parsed.replyGreeting || "Thanks for reaching out!",
    context: parsed.replyContext || "",
    slots,
    closing: parsed.replyClosing || "Let me know if any of these work for you!",
    senderName: "Phillip",
  });

  // Also build a readable plain-text version for the dashboard preview
  const plainSlots = slots.map((s: { label: string }) => `  • ${s.label}`).join("\n");
  const plainReply = [
    `Hi ${recipientName},`,
    "",
    parsed.replyGreeting || "Thanks for reaching out!",
    parsed.replyContext || "",
    "",
    "Here are a few times that work for me:",
    plainSlots,
    "",
    parsed.replyClosing || "Let me know if any of these work for you!",
    "",
    "Best regards,",
    "Phillip",
  ]
    .filter((line) => line !== undefined)
    .join("\n");

  return {
    id: `prop_${Date.now()}`,
    emailThreadId: email.threadId,
    intent: parsed.intent,
    proposedSlots: slots,
    draftReply: plainReply,
    htmlReply,
    meetingDuration: parsed.meetingDuration || prefs.defaultDuration,
    meetingTitle: parsed.meetingTitle || email.subject,
    participants: parsed.participants || [email.fromEmail],
    status: "proposed",
    createdAt: new Date().toISOString(),
  };
}

function buildReplyAnalysisPrompt(
  messages: ThreadMessage[],
  proposedSlots: TimeSlot[],
): string {
  const conversation = messages
    .map((m) => `[${m.from} <${m.fromEmail}> at ${m.timestamp}]\n${m.text}`)
    .join("\n\n---\n\n");

  const slotsText = proposedSlots
    .map((s, i) => `  Option ${i + 1}: ${s.label} (${s.start} to ${s.end})`)
    .join("\n");

  return `You are PhiloCal, an AI scheduling assistant. Analyze the latest reply in this email conversation to determine the sender's intent regarding scheduling.

CONVERSATION HISTORY:
${conversation}

CURRENTLY PROPOSED TIME SLOTS:
${slotsText}

INSTRUCTIONS:
Analyze the LATEST message in the conversation. Determine:
1. Did they select one of the proposed slots? (e.g., "Tuesday works!", "option 2", "the 3pm one", "let's do the first one")
2. Did they reject all slots? (e.g., "none work", "I'm busy all week", "can we do next week instead?")
3. Did they suggest a counter-proposal? (e.g., "how about Thursday at 4?", "could we do 2pm instead?")
4. Is their reply unclear or unrelated to scheduling?

For slot_selected: match their response to the closest proposed slot index (0-based).
For counter_proposal: extract the suggested time text.

Respond in this exact JSON format (no markdown, no code fences):
{
  "type": "slot_selected" | "rejection" | "counter_proposal" | "unclear",
  "selectedSlotIndex": null or 0-based index number,
  "counterProposalText": null or "the suggested time text",
  "confidence": 0.0 to 1.0,
  "reasoning": "brief explanation of your analysis"
}`;
}

export async function analyzeReply(
  messages: ThreadMessage[],
  proposedSlots: TimeSlot[],
  prefs: UserPreferences,
): Promise<ReplyAnalysis> {
  const provider = prefs.aiProvider || "anthropic";
  const prompt = buildReplyAnalysisPrompt(messages, proposedSlots);

  let text: string;

  if (provider === "openai") {
    const key = prefs.openaiApiKey || process.env.OPENAI_API_KEY;
    if (!key) throw new Error("No OpenAI API key provided.");
    text = await callOpenAI(prompt, key);
  } else {
    const key = prefs.anthropicApiKey || process.env.ANTHROPIC_API_KEY;
    if (!key) throw new Error("No Anthropic API key provided.");
    text = await callAnthropic(prompt, key);
  }

  const parsed = JSON.parse(text);

  return {
    type: parsed.type,
    selectedSlotIndex: parsed.selectedSlotIndex ?? null,
    counterProposalText: parsed.counterProposalText ?? null,
    confidence: parsed.confidence ?? 0.5,
    reasoning: parsed.reasoning ?? "",
  };
}
