"use client";

interface DashboardHeaderProps {
  userName: string;
  emailCount: number;
  bookedCount: number;
  onPreferences: () => void;
  onSignOut: () => void;
}

export default function DashboardHeader({
  userName,
  emailCount,
  bookedCount,
  onPreferences,
  onSignOut,
}: DashboardHeaderProps) {
  return (
    <header className="mb-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-[var(--accent)] via-purple-400 to-violet-300 bg-clip-text text-transparent">
              PhiloCal
            </span>
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Welcome back, {userName}. Let&apos;s philosophize about your
            schedule.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onPreferences}
            className="btn-secondary text-xs px-3 py-2"
          >
            Preferences
          </button>
          <button
            onClick={onSignOut}
            className="btn-secondary text-xs px-3 py-2"
          >
            Sign out
          </button>
        </div>
      </div>
      <div className="flex gap-5 text-xs">
        <div className="flex items-center gap-2">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--warning)]" />
          <span className="text-[var(--text-tertiary)]">
            <span className="text-[var(--text-secondary)] font-medium">
              {emailCount}
            </span>{" "}
            scheduling requests
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--success)]" />
          <span className="text-[var(--text-tertiary)]">
            <span className="text-[var(--text-secondary)] font-medium">
              {bookedCount}
            </span>{" "}
            meetings booked
          </span>
        </div>
      </div>
    </header>
  );
}
