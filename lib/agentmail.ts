import { AgentMailClient } from "agentmail";
import { EmailThread } from "./types";

const client = new AgentMailClient({
  apiKey: process.env.AGENTMAIL_API_KEY,
});

const INBOX_ID = process.env.AGENTMAIL_INBOX_ID || "philocal@agentmail.to";

function parseSender(sender: string): { name: string; email: string } {
  const match = sender.match(/^(.*?)\s*<(.+?)>$/);
  if (match) {
    return { name: match[1].trim(), email: match[2] };
  }
  return { name: sender, email: sender };
}

export async function getSchedulingThreads(): Promise<EmailThread[]> {
  const response = await client.inboxes.threads.list(INBOX_ID, {
    limit: 20,
  });

  const threads: EmailThread[] = [];

  for (const item of response.threads) {
    const sender = item.senders?.[0]
      ? parseSender(item.senders[0])
      : { name: "Unknown", email: "unknown" };

    threads.push({
      id: item.threadId,
      threadId: item.threadId,
      subject: item.subject || "(No subject)",
      from: sender.name,
      fromEmail: sender.email,
      snippet: item.preview || "",
      body: item.preview || "",
      date: item.timestamp instanceof Date ? item.timestamp.toISOString() : String(item.timestamp),
      isSchedulingRelated: true,
      source: "agentmail",
    });
  }

  return threads;
}

export async function replyToThread(
  threadId: string,
  body: string,
  htmlBody?: string,
): Promise<void> {
  const thread = await client.inboxes.threads.get(INBOX_ID, threadId);
  if (!thread.messages || thread.messages.length === 0) {
    throw new Error("No messages found in thread to reply to.");
  }
  const messageId = thread.messages[thread.messages.length - 1].messageId;
  if (!messageId) {
    throw new Error("Could not determine message ID for reply.");
  }
  await client.inboxes.messages.reply(INBOX_ID, messageId, {
    text: body,
    ...(htmlBody ? { html: htmlBody } : {}),
  } as any);
}

export async function getThreadDetails(
  threadId: string,
): Promise<EmailThread | null> {
  const thread = await client.inboxes.threads.get(INBOX_ID, threadId);

  if (!thread.messages || thread.messages.length === 0) {
    return null;
  }

  const firstMessage = thread.messages[0];
  const sender = firstMessage.from
    ? parseSender(firstMessage.from)
    : { name: "Unknown", email: "unknown" };

  const body =
    firstMessage.extractedText ||
    firstMessage.text ||
    thread.preview ||
    "";

  return {
    id: thread.threadId,
    threadId: thread.threadId,
    subject: thread.subject || "(No subject)",
    from: sender.name,
    fromEmail: sender.email,
    snippet: thread.preview || "",
    body: body.slice(0, 2000),
    date: thread.timestamp instanceof Date ? thread.timestamp.toISOString() : String(thread.timestamp),
    isSchedulingRelated: true,
    source: "agentmail",
  };
}
