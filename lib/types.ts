export interface CalendarEvent {
  id: string;
  summary: string;
  start: string;
  end: string;
  attendees?: string[];
  location?: string;
  htmlLink?: string;
}

export interface EmailThread {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  fromEmail: string;
  snippet: string;
  body: string;
  date: string;
  isSchedulingRelated?: boolean;
  source?: "gmail" | "agentmail";
}

export interface SchedulingProposal {
  id: string;
  emailThreadId: string;
  intent: "schedule_meeting" | "reschedule" | "cancel" | "unclear";
  proposedSlots: TimeSlot[];
  draftReply: string;
  htmlReply?: string;
  meetingDuration: number;
  meetingTitle: string;
  participants: string[];
  status: "proposed" | "approved" | "declined";
  createdAt: string;
}

export interface TimeSlot {
  start: string;
  end: string;
  label: string;
}

export interface ActivityItem {
  id: string;
  type: "booked" | "proposed" | "declined" | "sent";
  title: string;
  description: string;
  timestamp: string;
  participants?: string[];
}

export interface UserPreferences {
  workingHoursStart: string;
  workingHoursEnd: string;
  timezone: string;
  bufferMinutes: number;
  defaultDuration: number;
  defaultLocation: string;
  anthropicApiKey: string;
  openaiApiKey: string;
  aiProvider: "anthropic" | "openai";
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  workingHoursStart: "09:00",
  workingHoursEnd: "18:00",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  bufferMinutes: 15,
  defaultDuration: 30,
  defaultLocation: "Google Meet",
  anthropicApiKey: "",
  openaiApiKey: "",
  aiProvider: "openai",
};
