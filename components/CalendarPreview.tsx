"use client";

import { CalendarEvent, TimeSlot } from "@/lib/types";

interface CalendarPreviewProps {
  events: CalendarEvent[];
  proposedSlots?: TimeSlot[];
}

function groupEventsByDay(events: CalendarEvent[]): Map<string, CalendarEvent[]> {
  const grouped = new Map<string, CalendarEvent[]>();
  const sorted = [...events].sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
  );

  for (const event of sorted) {
    const dateKey = new Date(event.start).toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
    if (!grouped.has(dateKey)) grouped.set(dateKey, []);
    grouped.get(dateKey)!.push(event);
  }
  return grouped;
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function isToday(dateStr: string): boolean {
  return new Date(dateStr).toDateString() === new Date().toDateString();
}

export default function CalendarPreview({
  events,
  proposedSlots = [],
}: CalendarPreviewProps) {
  const now = new Date();
  const threeDaysOut = new Date(now.getTime() + 3 * 86400000);

  const upcomingEvents = events.filter((e) => {
    const d = new Date(e.start);
    return d >= now && d <= threeDaysOut;
  });

  const grouped = groupEventsByDay(upcomingEvents);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3
          className="text-xl font-normal text-[var(--text-primary)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Upcoming
        </h3>
        <span className="text-sm text-[var(--text-tertiary)]">
          Next 3 days
        </span>
      </div>

      {upcomingEvents.length === 0 && proposedSlots.length === 0 ? (
        <div className="card p-8 text-center">
          <div className="w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: "var(--accent-soft)" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <p className="text-[var(--text-secondary)] text-sm mb-1">
            Calendar is clear
          </p>
          <p className="text-[var(--text-tertiary)] text-sm">
            No events in the next 3 days.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {Array.from(grouped.entries()).map(([dayLabel, dayEvents]) => (
            <div key={dayLabel}>
              <div className="flex items-center gap-3 mb-3">
                {isToday(dayEvents[0].start) && (
                  <span className="inline-block w-2 h-2 rounded-full bg-[var(--accent)]" />
                )}
                <p className="text-sm font-medium text-[var(--text-secondary)]">
                  {isToday(dayEvents[0].start) ? "Today" : dayLabel}
                </p>
              </div>
              <div className="space-y-2">
                {dayEvents.map((event) => (
                  <div key={event.id} className="calendar-event-item">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {event.summary}
                        </p>
                        {event.attendees && event.attendees.length > 0 && (
                          <p className="text-xs text-[var(--text-tertiary)] mt-0.5 truncate">
                            {event.attendees.slice(0, 2).join(", ")}
                            {event.attendees.length > 2 &&
                              ` +${event.attendees.length - 2}`}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-[var(--text-tertiary)] shrink-0 tabular-nums">
                        {formatTime(event.start)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {proposedSlots.length > 0 && (
            <div>
              <p className="text-sm font-medium text-[var(--success)] mb-3">
                Proposed
              </p>
              <div className="space-y-2">
                {proposedSlots.map((slot, i) => (
                  <div key={i} className="calendar-proposed-item">
                    <p className="text-sm font-medium">{slot.label}</p>
                    <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                      {formatTime(slot.start)} - {formatTime(slot.end)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
