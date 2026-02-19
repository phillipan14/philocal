import { google } from "googleapis";
import { CalendarEvent } from "./types";

function getCalendarClient(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.calendar({ version: "v3", auth });
}

export async function getEvents(
  accessToken: string,
  timeMin: string,
  timeMax: string,
): Promise<CalendarEvent[]> {
  const calendar = getCalendarClient(accessToken);
  const res = await calendar.events.list({
    calendarId: "primary",
    timeMin,
    timeMax,
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 100,
  });

  return (res.data.items || []).map((event) => ({
    id: event.id || "",
    summary: event.summary || "(No title)",
    start: event.start?.dateTime || event.start?.date || "",
    end: event.end?.dateTime || event.end?.date || "",
    attendees: event.attendees?.map((a) => a.email || "").filter(Boolean),
    location: event.location || undefined,
    htmlLink: event.htmlLink || undefined,
  }));
}

export async function createEvent(
  accessToken: string,
  summary: string,
  start: string,
  end: string,
  attendees: string[],
  location?: string,
) {
  const calendar = getCalendarClient(accessToken);
  const res = await calendar.events.insert({
    calendarId: "primary",
    requestBody: {
      summary,
      start: { dateTime: start },
      end: { dateTime: end },
      attendees: attendees.map((email) => ({ email })),
      location,
      reminders: { useDefault: true },
    },
    sendUpdates: "all",
  });
  return res.data;
}
