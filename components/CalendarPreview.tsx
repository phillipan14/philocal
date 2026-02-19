"use client";

import { CalendarEvent, TimeSlot } from "@/lib/types";
import { Fragment } from "react";

interface CalendarPreviewProps {
  events: CalendarEvent[];
  proposedSlots?: TimeSlot[];
}

function getDayLabels(): { label: string; date: Date }[] {
  const days = [];
  const now = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    days.push({
      label: d.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
      date: d,
    });
  }
  return days;
}

function getHourPosition(dateStr: string): number {
  const d = new Date(dateStr);
  return d.getHours() + d.getMinutes() / 60;
}

const START_HOUR = 8;
const END_HOUR = 20;
const HOURS = Array.from(
  { length: END_HOUR - START_HOUR },
  (_, i) => START_HOUR + i,
);

export default function CalendarPreview({
  events,
  proposedSlots = [],
}: CalendarPreviewProps) {
  const days = getDayLabels();

  function getEventsForDay(date: Date) {
    return events.filter((e) => {
      const eventDate = new Date(e.start);
      return eventDate.toDateString() === date.toDateString();
    });
  }

  function getProposedForDay(date: Date) {
    return proposedSlots.filter((s) => {
      const slotDate = new Date(s.start);
      return slotDate.toDateString() === date.toDateString();
    });
  }

  return (
    <div className="card p-4 overflow-hidden">
      <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-3 uppercase tracking-wider">
        This Week
      </h3>
      <div className="overflow-x-auto">
        <div
          className="grid min-w-[640px]"
          style={{
            gridTemplateColumns: "60px repeat(7, 1fr)",
            gap: "1px",
            background: "var(--border)",
          }}
        >
          {/* Header row */}
          <div className="bg-[var(--bg-secondary)] p-2 text-[10px] text-[var(--text-tertiary)]" />
          {days.map((d) => (
            <div
              key={d.label}
              className="bg-[var(--bg-secondary)] p-2 text-center"
            >
              <span className="text-[10px] text-[var(--text-tertiary)] font-medium">
                {d.label}
              </span>
            </div>
          ))}

          {/* Hour rows */}
          {HOURS.map((hour) => (
            <Fragment key={hour}>
              <div className="bg-[var(--bg-secondary)] p-1 text-right pr-2">
                <span className="text-[10px] text-[var(--text-tertiary)]">
                  {hour % 12 || 12}
                  {hour < 12 ? "a" : "p"}
                </span>
              </div>
              {days.map((d) => {
                const dayEvents = getEventsForDay(d.date).filter((e) => {
                  const h = getHourPosition(e.start);
                  return h >= hour && h < hour + 1;
                });
                const dayProposed = getProposedForDay(d.date).filter((s) => {
                  const h = getHourPosition(s.start);
                  return h >= hour && h < hour + 1;
                });
                return (
                  <div key={`${d.label}-${hour}`} className="calendar-cell">
                    {dayEvents.map((e) => (
                      <div key={e.id} className="calendar-event">
                        {e.summary}
                      </div>
                    ))}
                    {dayProposed.map((s, i) => (
                      <div key={i} className="calendar-proposed">
                        {s.label}
                      </div>
                    ))}
                  </div>
                );
              })}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
