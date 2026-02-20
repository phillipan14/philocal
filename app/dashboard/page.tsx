"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  CalendarEvent,
  EmailThread,
  SchedulingProposal,
  ActivityItem,
  ConversationState,
  ConversationStatus,
} from "@/lib/types";
import { getPreferences } from "@/lib/preferences";
import DashboardHeader from "@/components/DashboardHeader";
import CalendarPreview from "@/components/CalendarPreview";
import PreferencesModal from "@/components/PreferencesModal";

const POLL_INTERVAL = 30_000;

type EnrichedThread = EmailThread & { conversationState: ConversationState | null };

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [emails, setEmails] = useState<EnrichedThread[]>([]);
  const [conversations, setConversations] = useState<Record<string, ConversationState>>({});
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPreferences, setShowPreferences] = useState(false);
  const [autoMode, setAutoMode] = useState(true);
  const [processing, setProcessing] = useState(false);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async () => {
    const [calRes, emailRes] = await Promise.all([
      fetch("/api/calendar"),
      fetch("/api/schedule"),
    ]);
    if (calRes.ok) setEvents(await calRes.json());
    if (emailRes.ok) {
      const data: EnrichedThread[] = await emailRes.json();
      setEmails(data);
      // Build conversations map from enriched data
      const convMap: Record<string, ConversationState> = {};
      for (const t of data) {
        if (t.conversationState) convMap[t.threadId] = t.conversationState;
      }
      setConversations((prev) => ({ ...prev, ...convMap }));
    }
  }, []);

  const triggerProcess = useCallback(async () => {
    setProcessing(true);
    try {
      const prefs = getPreferences();
      await fetch("/api/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences: prefs }),
      });
      // Refresh conversation states
      const convRes = await fetch("/api/process");
      if (convRes.ok) {
        const convData = await convRes.json();
        setConversations(convData);
      }
      // Refresh thread list
      await fetchData();
    } catch {
      // Silently handle — will retry on next poll
    }
    setProcessing(false);
  }, [fetchData]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
      return;
    }
    if (status !== "authenticated") return;

    async function load() {
      await fetchData();
      setLoading(false);
    }
    load();
  }, [status, router, fetchData]);

  // Polling for auto-mode
  useEffect(() => {
    if (autoMode) {
      // Trigger immediately on enable
      triggerProcess();
      pollRef.current = setInterval(triggerProcess, POLL_INTERVAL);
    } else if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [autoMode, triggerProcess]);

  if (status === "loading" || loading) {
    return (
      <main className="relative z-10 mx-auto max-w-4xl px-5 sm:px-8 py-12">
        <div className="py-24 text-center">
          <div className="w-12 h-12 rounded-2xl mx-auto mb-6 animate-shimmer" />
          <p className="text-[var(--text-secondary)] text-lg animate-pulse-soft">
            Loading your schedule...
          </p>
        </div>
      </main>
    );
  }

  function addActivity(item: ActivityItem) {
    setActivities((prev) => [item, ...prev]);
  }

  // Compute stats
  const convList = Object.values(conversations);
  const activeStatuses: ConversationStatus[] = ["new", "proposing", "awaiting_reply", "processing_reply", "re_proposing", "confirmed"];
  const activeCount = convList.filter((c) => activeStatuses.includes(c.status)).length;
  const awaitingCount = convList.filter((c) => c.status === "awaiting_reply").length;
  const bookedCount = convList.filter((c) => c.status === "booked").length + activities.filter((a) => a.type === "booked").length;

  // Separate emails into those with active conversations and those without
  const conversationThreads = emails.filter(
    (e) => conversations[e.threadId] && conversations[e.threadId].status !== "new",
  );
  const manualThreads = emails.filter(
    (e) => !conversations[e.threadId] || conversations[e.threadId].status === "new",
  );

  return (
    <main className="relative z-10 mx-auto max-w-4xl px-5 sm:px-8 py-10 sm:py-14">
      <DashboardHeader
        userName={session?.user?.name?.split(" ")[0] || "friend"}
        emailCount={emails.length}
        bookedCount={bookedCount}
        activeCount={activeCount}
        awaitingCount={awaitingCount}
        autoMode={autoMode}
        processing={processing}
        onPreferences={() => setShowPreferences(true)}
        onSignOut={() => signOut({ callbackUrl: "/" })}
        onToggleAutoMode={() => setAutoMode((v) => !v)}
        onProcessNow={triggerProcess}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active conversations (auto-processed) */}
          {conversationThreads.length > 0 && (
            <>
              <h2
                className="text-xl font-normal text-[var(--text-primary)]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Active Conversations
              </h2>
              <div className="space-y-4">
                {conversationThreads.map((email, i) => (
                  <div
                    key={email.id}
                    className={`animate-in delay-${Math.min(i + 1, 5)}`}
                  >
                    <ConversationCard
                      email={email}
                      conversation={conversations[email.threadId]}
                      onRePropose={triggerProcess}
                    />
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Manual queue (not yet processed or auto-mode off) */}
          <h2
            className="text-xl font-normal text-[var(--text-primary)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {autoMode ? "Pending Requests" : "Scheduling Requests"}
          </h2>

          {manualThreads.length === 0 && conversationThreads.length === 0 ? (
            <div className="card p-10 text-center animate-in">
              <div
                className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center"
                style={{ background: "var(--accent-soft)" }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <p className="text-lg font-medium text-[var(--text-primary)] mb-2">
                No requests yet
              </p>
              <p className="text-[var(--text-secondary)] text-sm leading-relaxed max-w-sm mx-auto">
                CC{" "}
                <span className="text-[var(--accent)] font-medium">
                  philocal@agentmail.to
                </span>{" "}
                on any email thread where you need to schedule a meeting.
              </p>
            </div>
          ) : manualThreads.length === 0 ? null : (
            <div className="space-y-4">
              {manualThreads.map((email, i) => (
                <div
                  key={email.id}
                  className={`animate-in delay-${Math.min(i + 1, 5)}`}
                >
                  <EmailCard email={email} onBooked={addActivity} />
                </div>
              ))}
            </div>
          )}

          {/* Activity log */}
          {activities.length > 0 && (
            <div className="mt-10 space-y-4">
              <h2
                className="text-xl font-normal text-[var(--text-primary)]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Recent Activity
              </h2>
              <div className="space-y-3">
                {activities.map((a) => (
                  <div
                    key={a.id}
                    className="card p-5 flex items-center gap-4 animate-in"
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        background:
                          a.type === "booked"
                            ? "var(--success-soft)"
                            : "var(--warning-soft)",
                      }}
                    >
                      {a.type === "booked" ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"/>
                          <polyline points="12 6 12 12 16 14"/>
                        </svg>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{a.title}</p>
                      <p className="text-sm text-[var(--text-tertiary)] truncate">
                        {a.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar — Calendar */}
        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-8">
            <CalendarPreview events={events} />
          </div>
        </div>
      </div>

      <footer className="mt-20 pt-8 border-t border-[var(--border)] text-center">
        <p className="text-sm text-[var(--text-tertiary)]">
          Built by{" "}
          <a
            href="https://linkedin.com/in/phillipan"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
          >
            Phillip An
          </a>
          {" "}&middot;{" "}
          <a
            href="https://skylarq.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
          >
            Powered by Skylarq
          </a>
        </p>
      </footer>

      {showPreferences && (
        <PreferencesModal onClose={() => setShowPreferences(false)} />
      )}
    </main>
  );
}

/* ─── Status Badge ─────────────────────────────── */

const STATUS_CONFIG: Record<ConversationStatus, { label: string; color: string; bg: string }> = {
  new: { label: "New", color: "var(--text-secondary)", bg: "var(--bg-tertiary)" },
  proposing: { label: "Proposing", color: "var(--accent)", bg: "var(--accent-soft)" },
  awaiting_reply: { label: "Awaiting Reply", color: "#9382dc", bg: "rgba(147, 130, 220, 0.1)" },
  processing_reply: { label: "Processing", color: "var(--accent)", bg: "var(--accent-soft)" },
  confirmed: { label: "Confirmed", color: "var(--success)", bg: "var(--success-soft)" },
  booked: { label: "Booked", color: "var(--success)", bg: "var(--success-soft)" },
  re_proposing: { label: "Re-proposing", color: "var(--warning)", bg: "var(--warning-soft)" },
  stalled: { label: "Stalled", color: "var(--warning)", bg: "var(--warning-soft)" },
  error: { label: "Error", color: "#e85d5d", bg: "rgba(232, 93, 93, 0.1)" },
};

function StatusBadge({ status }: { status: ConversationStatus }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.new;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.color }} />
      {cfg.label}
    </span>
  );
}

/* ─── Conversation Card (auto-processed) ─────── */

function ConversationCard({
  email,
  conversation,
  onRePropose,
}: {
  email: EnrichedThread;
  conversation: ConversationState;
  onRePropose: () => void;
}) {
  const isTerminal = conversation.status === "booked" || conversation.status === "stalled";

  return (
    <div
      className="card overflow-hidden"
      style={
        conversation.status === "booked"
          ? { borderColor: "var(--success)", borderWidth: "1px" }
          : undefined
      }
    >
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-semibold shrink-0"
                style={{
                  background: "var(--accent-soft)",
                  color: "var(--accent)",
                }}
              >
                {conversation.senderName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{conversation.senderName}</p>
                  <StatusBadge status={conversation.status} />
                </div>
                <p className="text-xs text-[var(--text-tertiary)] truncate">
                  {conversation.senderEmail}
                </p>
              </div>
            </div>
            <h4 className="font-medium text-base leading-snug mb-1.5">
              {conversation.subject || email.subject}
            </h4>
            {conversation.meetingTitle && conversation.meetingTitle !== conversation.subject && (
              <p className="text-sm text-[var(--text-secondary)] mb-1">
                {conversation.meetingTitle}
              </p>
            )}
          </div>
        </div>

        {/* Proposed slots */}
        {conversation.status === "awaiting_reply" && conversation.proposedSlots.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-medium text-[var(--text-tertiary)] mb-2">
              Proposed times (waiting for reply)
            </p>
            <div className="space-y-1.5">
              {conversation.proposedSlots.map((slot, i) => (
                <div
                  key={i}
                  className="px-3 py-2 rounded-lg text-sm text-[var(--text-secondary)]"
                  style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border)" }}
                >
                  {slot.label}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Booked slot */}
        {conversation.status === "booked" && conversation.selectedSlot && (
          <div className="mt-4 flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "var(--success-soft)" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium">{conversation.selectedSlot.label}</p>
              {conversation.calendarEventLink && (
                <a
                  href={conversation.calendarEventLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[var(--accent)] hover:underline"
                >
                  View in Calendar
                </a>
              )}
            </div>
          </div>
        )}

        {/* Error */}
        {conversation.status === "error" && conversation.errorMessage && (
          <p className="mt-3 text-sm text-[#e85d5d]">{conversation.errorMessage}</p>
        )}

        {/* Stalled — manual re-propose */}
        {conversation.status === "stalled" && (
          <div className="mt-4">
            <p className="text-sm text-[var(--text-secondary)] mb-2">
              {conversation.errorMessage || "Could not reach agreement after multiple attempts."}
            </p>
            <button onClick={onRePropose} className="btn-secondary text-sm">
              Re-process
            </button>
          </div>
        )}

        {/* Meta info */}
        <div className="mt-4 flex items-center gap-4 text-xs text-[var(--text-tertiary)]">
          <span>Attempt {conversation.attempts}</span>
          <span>&middot;</span>
          <span>{conversation.messageCount} messages</span>
          <span>&middot;</span>
          <span>Updated {new Date(conversation.updatedAt).toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Email Card (manual flow, preserved) ────── */

function EmailCard({
  email,
  onBooked,
}: {
  email: EnrichedThread;
  onBooked: (item: ActivityItem) => void;
}) {
  const [proposal, setProposal] = useState<SchedulingProposal | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [proposing, setProposing] = useState(false);
  const [approving, setApproving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePropose() {
    setProposing(true);
    setError(null);
    const preferences = getPreferences();

    const res = await fetch("/api/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, preferences }),
    });
    if (res.ok) {
      const p = await res.json();
      setProposal(p);
      setExpanded(true);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Failed to propose times. Please try again.");
    }
    setProposing(false);
  }

  async function handleApprove() {
    if (!proposal || selectedSlot === null) return;
    setApproving(true);
    setError(null);
    const res = await fetch("/api/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        proposal,
        selectedSlot: proposal.proposedSlots[selectedSlot],
        emailThread: email,
        source: email.source || "agentmail",
      }),
    });
    if (res.ok) {
      setDone(true);
      onBooked({
        id: `act_${Date.now()}`,
        type: "booked",
        title: proposal.meetingTitle,
        description: `With ${email.from} — ${proposal.proposedSlots[selectedSlot].label}`,
        timestamp: new Date().toISOString(),
        participants: proposal.participants,
      });
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Failed to book meeting. Try signing out and back in.");
    }
    setApproving(false);
  }

  if (done) {
    return (
      <div
        className="card p-6 animate-in-scale"
        style={{ borderColor: "var(--success)", borderWidth: "1px" }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "var(--success-soft)" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div>
            <p className="font-medium">{proposal?.meetingTitle}</p>
            <p className="text-sm text-[var(--text-secondary)] mt-0.5">
              Meeting booked with {email.from}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      {/* Card header */}
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            {/* Sender avatar + name */}
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-semibold shrink-0"
                style={{
                  background: "var(--accent-soft)",
                  color: "var(--accent)",
                }}
              >
                {email.from.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{email.from}</p>
                <p className="text-xs text-[var(--text-tertiary)] truncate">
                  {email.fromEmail}
                </p>
              </div>
            </div>
            {/* Subject */}
            <h4 className="font-medium text-base leading-snug mb-1.5">
              {email.subject}
            </h4>
            {/* Snippet */}
            <p className="text-sm text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
              {email.snippet}
            </p>
          </div>
        </div>
        {/* Action button */}
        <div className="mt-5">
          <button
            onClick={handlePropose}
            disabled={proposing || !!proposal}
            className="btn-primary w-full sm:w-auto"
          >
            {proposing ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                </svg>
                Finding times...
              </span>
            ) : proposal ? (
              <span className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Times proposed
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                Propose Times
              </span>
            )}
          </button>
          {error && (
            <p className="text-sm mt-3 text-[var(--warning)]">{error}</p>
          )}
        </div>
      </div>

      {/* Expanded proposal section */}
      {expanded && proposal && (
        <div
          className="px-6 pb-6 pt-5 animate-in"
          style={{
            borderTop: "1px solid var(--border)",
            background: "var(--bg-tertiary)",
          }}
        >
          {/* Time slots as large clickable cards */}
          <p className="text-sm font-medium text-[var(--text-secondary)] mb-3">
            Pick a time
          </p>
          <div className="space-y-2 mb-5">
            {proposal.proposedSlots.map((slot, i) => (
              <button
                key={i}
                onClick={() => setSelectedSlot(i)}
                className="w-full text-left p-4 rounded-xl transition-all"
                style={{
                  background:
                    selectedSlot === i
                      ? "var(--accent-soft)"
                      : "var(--bg-secondary)",
                  border:
                    selectedSlot === i
                      ? "1px solid var(--accent)"
                      : "1px solid var(--border)",
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors"
                    style={{
                      borderColor:
                        selectedSlot === i
                          ? "var(--accent)"
                          : "var(--border-light)",
                    }}
                  >
                    {selectedSlot === i && (
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ background: "var(--accent)" }}
                      />
                    )}
                  </div>
                  <span
                    className="text-sm font-medium"
                    style={{
                      color:
                        selectedSlot === i
                          ? "var(--text-primary)"
                          : "var(--text-secondary)",
                    }}
                  >
                    {slot.label}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Draft reply */}
          <p className="text-sm font-medium text-[var(--text-secondary)] mb-2">
            Draft reply
          </p>
          <div
            className="rounded-xl p-4 text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap max-h-36 overflow-y-auto mb-5"
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border)",
            }}
          >
            {proposal.draftReply}
          </div>

          {/* Approve button */}
          <button
            onClick={handleApprove}
            disabled={selectedSlot === null || approving}
            className="btn-success w-full"
          >
            {approving ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                </svg>
                Booking...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Approve &amp; Book Meeting
              </span>
            )}
          </button>
          {error && (
            <p className="text-sm mt-3 text-[var(--warning)]">{error}</p>
          )}
        </div>
      )}
    </div>
  );
}
