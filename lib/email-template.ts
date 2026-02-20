import { TimeSlot } from "./types";

/**
 * Builds a professional HTML email for scheduling replies.
 * Clean, minimal design that renders well across Gmail, Outlook, Apple Mail.
 */
export function buildSchedulingReplyHtml({
  recipientName,
  greeting,
  context,
  slots,
  closing,
  senderName = "Phillip",
  slotsHeader,
}: {
  recipientName: string;
  greeting: string;
  context: string;
  slots: TimeSlot[];
  closing: string;
  senderName?: string;
  slotsHeader?: string;
}): string {
  const slotRows = slots
    .map(
      (slot) => `
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #f0f0f0;">
          <span style="color: #1a1a1a; font-size: 15px; font-weight: 500;">${slot.label}</span>
        </td>
      </tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a1a; line-height: 1.6; background-color: #ffffff;">
  <div style="max-width: 560px; margin: 0 auto; padding: 0;">
    <p style="font-size: 15px; margin: 0 0 16px 0;">Hi ${recipientName},</p>

    <p style="font-size: 15px; margin: 0 0 16px 0;">${greeting}</p>

    ${context ? `<p style="font-size: 15px; margin: 0 0 20px 0;">${context}</p>` : ""}

    <p style="font-size: 15px; margin: 0 0 12px 0; font-weight: 500;">${slotsHeader ?? (slots.length === 1 ? "Meeting details:" : "Here are a few times that work for me:")}</p>

    <table cellpadding="0" cellspacing="0" style="width: 100%; border: 1px solid #e8e8e6; border-radius: 8px; border-collapse: separate; margin: 0 0 20px 0; overflow: hidden;">
      ${slotRows}
    </table>

    <p style="font-size: 15px; margin: 0 0 16px 0;">${closing}</p>

    <p style="font-size: 15px; margin: 24px 0 0 0;">Best regards,<br>${senderName}</p>
  </div>
</body>
</html>`;
}

/**
 * Converts an HTML email to plain text fallback.
 * Strips tags, keeps structure readable.
 */
export function htmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/tr>/gi, "\n")
    .replace(/<\/td>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/^[ \t]+/gm, "")
    .trim();
}
