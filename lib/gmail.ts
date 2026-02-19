import { google } from "googleapis";
import { EmailThread } from "./types";

function getGmailClient(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.gmail({ version: "v1", auth });
}

export async function getRecentThreads(
  accessToken: string,
  maxResults = 20,
): Promise<EmailThread[]> {
  const gmail = getGmailClient(accessToken);

  const res = await gmail.users.messages.list({
    userId: "me",
    maxResults,
    q: "is:inbox newer_than:3d",
  });

  const messages = res.data.messages || [];
  const threads: EmailThread[] = [];

  for (const msg of messages.slice(0, maxResults)) {
    const detail = await gmail.users.messages.get({
      userId: "me",
      id: msg.id!,
      format: "full",
    });

    const headers = detail.data.payload?.headers || [];
    const getHeader = (name: string) =>
      headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())
        ?.value || "";

    const fromRaw = getHeader("From");
    const fromMatch = fromRaw.match(/^(.*?)\s*<(.+?)>$/);

    let bodyText = "";
    const parts = detail.data.payload?.parts;
    if (parts) {
      const textPart = parts.find((p) => p.mimeType === "text/plain");
      if (textPart?.body?.data) {
        bodyText = Buffer.from(textPart.body.data, "base64").toString("utf-8");
      }
    } else if (detail.data.payload?.body?.data) {
      bodyText = Buffer.from(
        detail.data.payload.body.data,
        "base64",
      ).toString("utf-8");
    }

    threads.push({
      id: msg.id!,
      threadId: detail.data.threadId || msg.id!,
      subject: getHeader("Subject"),
      from: fromMatch ? fromMatch[1].trim() : fromRaw,
      fromEmail: fromMatch ? fromMatch[2] : fromRaw,
      snippet: detail.data.snippet || "",
      body: bodyText.slice(0, 2000),
      date: getHeader("Date"),
    });
  }

  return threads;
}

export async function sendReply(
  accessToken: string,
  threadId: string,
  to: string,
  subject: string,
  body: string,
) {
  const gmail = getGmailClient(accessToken);

  const raw = [
    `To: ${to}`,
    `Subject: Re: ${subject}`,
    `Content-Type: text/plain; charset=utf-8`,
    `In-Reply-To: ${threadId}`,
    `References: ${threadId}`,
    "",
    body,
  ].join("\r\n");

  const encoded = Buffer.from(raw).toString("base64url");

  await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw: encoded,
      threadId,
    },
  });
}
