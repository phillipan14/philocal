"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  CalendarEvent,
  EmailThread,
  SchedulingProposal,
  ActivityItem,
} from "@/lib/types";
import { getPreferences } from "@/lib/preferences";
import DashboardHeader from "@/components/DashboardHeader";
import CalendarPreview from "@/components/CalendarPreview";
import PreferencesModal from "@/components/PreferencesModal";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [emails, setEmails] = useState<EmailThread[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPreferences, setShowPreferences] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
      return;
    }
    if (status !== "authenticated") return;

    async function load() {
      const [calRes, emailRes] = await Promise.all([
        fetch("/api/calendar"),
        fetch("/api/schedule"),
      ]);
      if (calRes.ok) setEvents(await calRes.json());
      if (emailRes.ok) {
        const allEmails = await emailRes.json();
        setEmails(allEmails.filter((e: EmailThread) => e.isSchedulingRelated));
      }
      setLoading(false);
    }
    load();
  }, [status, router]);

  if (status === "loading" || loading) {
    return (
      <main className="relative z-10 mx-auto max-w-5xl px-4 py-10">
        <div className="text-center py-20">
          <p className="text-[var(--text-secondary)] animate-pulse-soft">
            Consulting the ancient calendar scrolls...
          </p>
        </div>
      </main>
    );
  }

  function addActivity(item: ActivityItem) {
    setActivities((prev) => [item, ...prev]);
  }

  return (
    <main className="relative z-10 mx-auto max-w-5xl px-4 py-10">
      <DashboardHeader
        userName={session?.user?.name?.split(" ")[0] || "friend"}
        emailCount={emails.length}
        bookedCount={activities.filter((a) => a.type === "booked").length}
        onPreferences={() => setShowPreferences(true)}
        onSignOut={() => signOut({ callbackUrl: "/" })}
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Email queue */}
        <div className="lg:col-span-3 space-y-4">
          <h3 className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wider">
            Scheduling Requests
          </h3>
          {emails.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-3xl mb-3">&#128172;</p>
              <p className="text-[var(--text-secondary)] font-medium">
                Inbox zero? Either nobody wants to meet you, or you&apos;re
                crushing it.
              </p>
            </div>
          ) : (
            emails.map((email) => (
              <EmailCard
                key={email.id}
                email={email}
                onBooked={addActivity}
              />
            ))
          )}

          {/* Activity log */}
          <h3 className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wider mt-8">
            Activity Log
          </h3>
          {activities.length === 0 ? (
            <div className="card p-6 text-center">
              <p className="text-sm text-[var(--text-tertiary)] italic">
                No scheduling history yet. Are you sure you have friends?
              </p>
            </div>
          ) : (
            activities.map((a) => (
              <div key={a.id} className="card p-4 flex items-center gap-3">
                <span
                  className={`badge badge-${a.type === "booked" ? "confirmed" : "pending"}`}
                >
                  {a.type}
                </span>
                <div>
                  <p className="text-sm font-medium">{a.title}</p>
                  <p className="text-xs text-[var(--text-tertiary)]">
                    {a.description}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Calendar preview */}
        <div className="lg:col-span-2">
          <CalendarPreview events={events} />
        </div>
      </div>

      <footer className="mt-20 text-center text-xs text-[var(--text-tertiary)]">
        <p className="italic mb-2">
          &ldquo;Time is an illusion. Meetings are not.&rdquo;
        </p>
        <p>
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
            className="hover:text-[var(--text-secondary)] transition-colors"
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

function EmailCard({
  email,
  onBooked,
}: {
  email: EmailThread;
  onBooked: (item: ActivityItem) => void;
}) {
  const [proposal, setProposal] = useState<SchedulingProposal | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [proposing, setProposing] = useState(false);
  const [approving, setApproving] = useState(false);
  const [done, setDone] = useState(false);

  async function handlePropose() {
    setProposing(true);
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
    }
    setProposing(false);
  }

  async function handleApprove() {
    if (!proposal || selectedSlot === null) return;
    setApproving(true);
    const res = await fetch("/api/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        proposal,
        selectedSlot: proposal.proposedSlots[selectedSlot],
        emailThread: email,
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
    }
    setApproving(false);
  }

  if (done) {
    return (
      <div className="card p-5 border-l-2 border-[var(--success)]">
        <div className="flex items-center gap-3">
          <span className="text-lg">&#9989;</span>
          <div>
            <p className="text-sm font-medium">
              Booked: {proposal?.meetingTitle}
            </p>
            <p className="text-xs text-[var(--text-tertiary)]">
              Another meeting booked. Your calendar weeps.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-5 animate-in">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="badge badge-scheduling">Scheduling</span>
            <span className="text-xs text-[var(--text-tertiary)]">
              {email.from}
            </span>
          </div>
          <h4 className="text-sm font-semibold truncate">{email.subject}</h4>
          <p className="text-xs text-[var(--text-tertiary)] mt-1 line-clamp-2">
            {email.snippet}
          </p>
        </div>
        <button
          onClick={handlePropose}
          disabled={proposing || !!proposal}
          className="btn-primary text-xs shrink-0"
        >
          {proposing ? "Thinking..." : proposal ? "Proposed" : "Propose Times"}
        </button>
      </div>

      {expanded && proposal && (
        <div className="mt-4 pt-4 border-t border-[var(--border)]">
          <p className="text-xs font-medium text-[var(--text-secondary)] mb-2 uppercase tracking-wider">
            Proposed Time Slots
          </p>
          <div className="space-y-2">
            {proposal.proposedSlots.map((slot, i) => (
              <label
                key={i}
                className={`flex items-center gap-3 card p-3 cursor-pointer ${selectedSlot === i ? "border-[var(--accent)]" : ""}`}
              >
                <input
                  type="radio"
                  name={`slot-${email.id}`}
                  checked={selectedSlot === i}
                  onChange={() => setSelectedSlot(i)}
                  className="accent-[var(--accent)]"
                />
                <span className="text-sm">{slot.label}</span>
              </label>
            ))}
          </div>

          <div className="mt-3">
            <p className="text-xs font-medium text-[var(--text-secondary)] mb-1 uppercase tracking-wider">
              Draft Reply
            </p>
            <div className="bg-[var(--bg-tertiary)] rounded-lg p-3 text-xs text-[var(--text-secondary)] whitespace-pre-wrap max-h-32 overflow-y-auto">
              {proposal.draftReply}
            </div>
          </div>

          <button
            onClick={handleApprove}
            disabled={selectedSlot === null || approving}
            className="btn-primary mt-4 w-full"
          >
            {approving ? "Booking..." : "Approve & Send"}
          </button>
        </div>
      )}
    </div>
  );
}
