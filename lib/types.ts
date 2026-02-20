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

/* ─── Multi-turn conversation types ─────────── */

export type ConversationStatus =
  | "new"
  | "proposing"
  | "awaiting_reply"
  | "processing_reply"
  | "confirmed"
  | "booked"
  | "re_proposing"
  | "stalled"
  | "error";

export interface ConversationState {
  threadId: string;
  status: ConversationStatus;
  senderName: string;
  senderEmail: string;
  subject: string;
  proposedSlots: TimeSlot[];
  selectedSlot: TimeSlot | null;
  meetingTitle: string;
  participants: string[];
  lastMessageId: string | null;
  messageCount: number;
  attempts: number;
  previouslyRejectedSlots: TimeSlot[];
  calendarEventId: string | null;
  calendarEventLink: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationStore {
  conversations: Record<string, ConversationState>;
  lastProcessedAt: string | null;
}

export interface ReplyAnalysis {
  type: "slot_selected" | "rejection" | "counter_proposal" | "unclear";
  selectedSlotIndex: number | null;
  counterProposalText: string | null;
  confidence: number;
  reasoning: string;
}

export interface ThreadMessage {
  messageId: string;
  from: string;
  fromEmail: string;
  to: string[];
  text: string;
  timestamp: string;
}
