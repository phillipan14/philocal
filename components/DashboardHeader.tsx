"use client";

import { useState } from "react";

interface DashboardHeaderProps {
  userName: string;
  emailCount: number;
  bookedCount: number;
  onPreferences: () => void;
  onSignOut: () => void;
}

const PHILOCAL_EMAIL = "philocal@agentmail.to";

export default function DashboardHeader({
  userName,
  emailCount,
  bookedCount,
  onPreferences,
  onSignOut,
}: DashboardHeaderProps) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(PHILOCAL_EMAIL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <header className="mb-10 animate-in">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1
            className="text-3xl sm:text-4xl font-normal tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            <span className="text-[var(--accent)]">PhiloCal</span>
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onPreferences}
            className="btn-secondary text-sm"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
            </svg>
            Settings
          </button>
          <button
            onClick={onSignOut}
            className="btn-secondary text-sm"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Greeting */}
      <div className="mb-8">
        <p className="text-[var(--text-secondary)] text-lg">
          Welcome back, <span className="text-[var(--text-primary)] font-medium">{userName}</span>
        </p>
      </div>

      {/* CC Address — Hero element */}
      <div
        className="rounded-2xl p-6 sm:p-8 mb-8"
        style={{
          background: "linear-gradient(135deg, rgba(232, 184, 108, 0.06) 0%, rgba(232, 184, 108, 0.02) 100%)",
          border: "1px solid rgba(232, 184, 108, 0.15)",
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div>
            <p className="text-sm font-medium text-[var(--accent-text)] mb-2">
              Your scheduling address
            </p>
            <p className="text-[var(--text-secondary)] text-sm leading-relaxed max-w-md">
              CC this email on any thread where you need to schedule a meeting.
              PhiloCal reads it and proposes times for you.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div
              className="px-5 py-3 rounded-xl text-lg font-medium text-[var(--accent)] tracking-wide"
              style={{
                background: "rgba(232, 184, 108, 0.08)",
                border: "1px solid rgba(232, 184, 108, 0.12)",
                fontFamily: "var(--font-body)",
              }}
            >
              {PHILOCAL_EMAIL}
            </div>
            <button
              onClick={handleCopy}
              className="btn-primary px-5 py-3 text-sm shrink-0"
            >
              {copied ? (
                <span className="flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Copied
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                  </svg>
                  Copy
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card p-5 flex items-center gap-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "var(--warning-soft)" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          </div>
          <div>
            <p className="text-2xl font-semibold tabular-nums">{emailCount}</p>
            <p className="text-sm text-[var(--text-tertiary)]">Scheduling requests</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "var(--success-soft)" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <div>
            <p className="text-2xl font-semibold tabular-nums">{bookedCount}</p>
            <p className="text-sm text-[var(--text-tertiary)]">Meetings booked</p>
          </div>
        </div>
      </div>
    </header>
  );
}
