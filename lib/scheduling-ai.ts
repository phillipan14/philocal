import Anthropic from "@anthropic-ai/sdk";
import {
  CalendarEvent,
  EmailThread,
  UserPreferences,
  SchedulingProposal,
} from "./types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function analyzeAndPropose(
  email: EmailThread,
  events: CalendarEvent[],
  prefs: UserPreferences,
): Promise<SchedulingProposal> {
  const eventsContext = events
    .map((e) => `- ${e.summary}: ${e.start} to ${e.end}`)
    .join("\n");

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `You are PhiloCal, an AI scheduling assistant. Analyze this email and propose meeting times.

USER PREFERENCES:
- Timezone: ${prefs.timezone}
- Working hours: ${prefs.workingHoursStart} to ${prefs.workingHoursEnd}
- Buffer between meetings: ${prefs.bufferMinutes} minutes
- Default meeting duration: ${prefs.defaultDuration} minutes
- Default location: ${prefs.defaultLocation}

CALENDAR (next 7 days):
${eventsContext || "No events scheduled."}

EMAIL:
From: ${email.from} <${email.fromEmail}>
Subject: ${email.subject}
Body: ${email.body}

INSTRUCTIONS:
1. Determine if this email contains a scheduling request.
2. If yes, propose exactly 3 time slots that work given the calendar and preferences.
3. Draft a professional, friendly email reply proposing those times.
4. If this is NOT a scheduling email, set intent to "unclear".

Respond in this exact JSON format (no markdown, no code fences):
{
  "intent": "schedule_meeting",
  "meetingTitle": "string - suggested meeting title",
  "meetingDuration": 30,
  "participants": ["email@example.com"],
  "proposedSlots": [
    { "start": "ISO datetime", "end": "ISO datetime", "label": "human readable label" }
  ],
  "draftReply": "string - the full email reply text"
}`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";
  const parsed = JSON.parse(text);

  return {
    id: `prop_${Date.now()}`,
    emailThreadId: email.threadId,
    intent: parsed.intent,
    proposedSlots: parsed.proposedSlots || [],
    draftReply: parsed.draftReply || "",
    meetingDuration: parsed.meetingDuration || prefs.defaultDuration,
    meetingTitle: parsed.meetingTitle || email.subject,
    participants: parsed.participants || [email.fromEmail],
    status: "proposed",
    createdAt: new Date().toISOString(),
  };
}

export async function classifyEmails(
  emails: EmailThread[],
): Promise<EmailThread[]> {
  if (emails.length === 0) return [];

  const emailSummaries = emails
    .map(
      (e, i) =>
        `[${i}] From: ${e.from}, Subject: "${e.subject}", Snippet: "${e.snippet}"`,
    )
    .join("\n");

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 256,
    messages: [
      {
        role: "user",
        content: `Classify which of these emails contain scheduling requests (wanting to meet, schedule a call, find a time, etc).

${emailSummaries}

Respond with ONLY a JSON array of indices that are scheduling-related, e.g. [0, 3, 5]. If none, respond [].`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "[]";
  const indices: number[] = JSON.parse(text);

  return emails.map((e, i) => ({
    ...e,
    isSchedulingRelated: indices.includes(i),
  }));
}
