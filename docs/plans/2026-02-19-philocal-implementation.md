# PhiloCal Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build PhiloCal — an AI scheduling assistant that monitors Gmail for scheduling requests, proposes meeting times via Claude, and books events on Google Calendar.

**Architecture:** Next.js 15 app with Google OAuth (NextAuth), Gmail API for email monitoring, Google Calendar API for event management, and Claude API for natural language scheduling intelligence. No database — sessions via NextAuth cookies, preferences in localStorage. Three-panel dashboard: email queue, calendar preview, activity log.

**Tech Stack:** Next.js 15, React 19, Tailwind CSS 4, TypeScript, NextAuth.js, Google Calendar API, Gmail API, Anthropic Claude API

---

### Task 1: Scaffold Next.js Project

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `postcss.config.mjs`
- Create: `.gitignore`
- Create: `.env.example`

**Step 1: Initialize the project**

```bash
cd /Users/phillipan/philocal
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --turbopack --yes
```

If the directory is not empty (design doc exists), answer yes to proceed.

**Step 2: Install dependencies**

```bash
npm install next-auth @auth/core googleapis @anthropic-ai/sdk
```

**Step 3: Create `.env.example`**

```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=
ANTHROPIC_API_KEY=
```

**Step 4: Create `.env.local` with actual values**

Check if the user has Google OAuth credentials set up. If not, note that they need to:
1. Go to https://console.cloud.google.com
2. Create project or select existing
3. Enable Google Calendar API and Gmail API
4. Create OAuth 2.0 credentials (Web application)
5. Add `http://localhost:3000/api/auth/callback/google` as authorized redirect URI

```
GOOGLE_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
ANTHROPIC_API_KEY=<from Anthropic dashboard>
```

**Step 5: Update `.gitignore`**

Ensure these entries exist:
```
.env
.env.local
.env*.local
```

**Step 6: Verify project runs**

```bash
npm run dev
```

Expected: Next.js dev server starts on http://localhost:3000

**Step 7: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js 15 project with dependencies"
```

---

### Task 2: Dark Theme + Global Styles

**Files:**
- Modify: `app/globals.css` (replace entirely)

**Step 1: Replace `app/globals.css` with Phil* dark theme**

Match the Phil* design system (from PhilTer). Use indigo/purple accent palette, dot grid background, ambient glow, card/button/input/modal/badge utility classes.

```css
@import "tailwindcss";

:root {
  --bg-primary: #09090f;
  --bg-secondary: #111119;
  --bg-tertiary: #1a1a28;
  --bg-hover: #222234;
  --border: #1e1e32;
  --border-light: #35355a;
  --accent: #818cf8;
  --accent-hover: #6366f1;
  --accent-glow: rgba(129, 140, 248, 0.12);
  --success: #34d399;
  --warning: #fbbf24;
  --danger: #f87171;
  --text-primary: #f0f0f5;
  --text-secondary: #9ca3af;
  --text-tertiary: #555568;
}

* { box-sizing: border-box; }

body {
  font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background: var(--bg-primary);
  color: var(--text-primary);
}

/* Dot grid background */
body::before {
  content: "";
  position: fixed;
  inset: 0;
  background-image: radial-gradient(circle at 1px 1px, rgba(129,140,248,0.06) 1px, transparent 0);
  background-size: 32px 32px;
  pointer-events: none;
  z-index: 0;
}

/* Ambient glow */
body::after {
  content: "";
  position: fixed;
  top: -200px;
  left: 50%;
  transform: translateX(-50%);
  width: 600px;
  height: 400px;
  background: radial-gradient(ellipse, rgba(129,140,248,0.06) 0%, transparent 70%);
  pointer-events: none;
  z-index: 0;
}

/* Card styles */
.card {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 14px;
  transition: all 0.2s ease;
  position: relative;
}
.card:hover { border-color: var(--border-light); background: #14141e; }

/* Badge */
.badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}
.badge-scheduling { background: rgba(129,140,248,0.1); color: var(--accent); }
.badge-confirmed { background: rgba(52,211,153,0.1); color: var(--success); }
.badge-pending { background: rgba(251,191,36,0.1); color: var(--warning); }
.badge-declined { background: rgba(248,113,113,0.1); color: var(--danger); }

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.75);
  backdrop-filter: blur(8px);
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal-content {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 20px;
  width: 100%;
  max-width: 560px;
  padding: 28px;
  margin: 16px;
  box-shadow: 0 24px 48px rgba(0,0,0,0.4);
}

/* Inputs */
input[type="text"], input[type="url"], input[type="email"], input[type="number"], select, textarea {
  width: 100%;
  padding: 11px 14px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: 10px;
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}
input:focus, select:focus, textarea:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(129,140,248,0.08);
}
input::placeholder, textarea::placeholder { color: var(--text-tertiary); }

/* Buttons */
.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 22px;
  background: var(--accent);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-primary:hover:not(:disabled) { background: var(--accent-hover); box-shadow: 0 0 20px var(--accent-glow); }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 20px;
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  border: 1px solid var(--border);
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-secondary:hover { background: var(--bg-hover); color: var(--text-primary); border-color: var(--border-light); }

/* Scrollbar */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-in { animation: fadeIn 0.25s ease forwards; }

@keyframes pulse-soft {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
.animate-pulse-soft { animation: pulse-soft 2s ease-in-out infinite; }

/* Calendar grid */
.calendar-grid {
  display: grid;
  grid-template-columns: 60px repeat(7, 1fr);
  gap: 1px;
  background: var(--border);
  border-radius: 12px;
  overflow: hidden;
}
.calendar-cell {
  background: var(--bg-secondary);
  min-height: 48px;
  padding: 4px;
  position: relative;
}
.calendar-event {
  background: var(--accent-glow);
  border-left: 2px solid var(--accent);
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 11px;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.calendar-proposed {
  background: rgba(52,211,153,0.1);
  border-left: 2px solid var(--success);
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 11px;
  color: var(--success);
  border-style: dashed;
}
```

**Step 2: Commit**

```bash
git add app/globals.css
git commit -m "feat: add Phil* dark theme and global styles"
```

---

### Task 3: Layout + Landing Page

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/page.tsx`

**Step 1: Update `app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PhiloCal — AI Scheduling Assistant",
  description: "Your calendar has a philosophy now. AI-powered scheduling that monitors your email and books meetings automatically.",
  openGraph: {
    title: "PhiloCal — AI Scheduling Assistant",
    description: "Your calendar has a philosophy now.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
```

**Step 2: Create landing page `app/page.tsx`**

Build a landing page with:
- PhiloCal gradient logo text
- Tagline: "Your calendar has a philosophy now."
- Subtitle explaining what it does (monitors email, proposes times, books meetings)
- "Sign in with Google" button (links to NextAuth sign-in)
- Three feature cards: "Email Intelligence", "Calendar Awareness", "One-Click Booking"
- Footer with humor: "Time is an illusion. Meetings are not."

The page should check if the user is authenticated and redirect to `/dashboard` if so.

```tsx
"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session")
      .then(r => r.json())
      .then(session => {
        if (session?.user) {
          window.location.href = "/dashboard";
        } else {
          setChecking(false);
        }
      })
      .catch(() => setChecking(false));
  }, []);

  if (checking) return null;

  return (
    <main className="relative z-10 mx-auto max-w-2xl px-4 py-16 sm:py-24">
      <div className="text-center animate-in">
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-none">
          <span className="bg-gradient-to-r from-[var(--accent)] via-purple-400 to-violet-300 bg-clip-text text-transparent">
            PhiloCal
          </span>
        </h1>
        <p className="mt-4 text-lg text-[var(--text-secondary)]">
          Your calendar has a philosophy now.
        </p>
        <p className="mt-2 text-sm text-[var(--text-tertiary)] max-w-md mx-auto">
          AI that reads your email, checks your calendar, and books meetings for you.
          Just CC PhiloCal and let it handle the rest.
        </p>

        <button
          onClick={() => window.location.href = "/api/auth/signin/google"}
          className="btn-primary mt-8 text-base px-8 py-3"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Sign in with Google
        </button>

        <p className="mt-3 text-xs text-[var(--text-tertiary)]">
          Requires Google Calendar + Gmail permissions
        </p>
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-16">
        <div className="card p-5 text-center">
          <p className="text-2xl mb-2">&#128231;</p>
          <h3 className="font-semibold text-sm">Email Intelligence</h3>
          <p className="text-xs text-[var(--text-tertiary)] mt-1">
            Scans your inbox for scheduling requests. No more back-and-forth.
          </p>
        </div>
        <div className="card p-5 text-center">
          <p className="text-2xl mb-2">&#128197;</p>
          <h3 className="font-semibold text-sm">Calendar Awareness</h3>
          <p className="text-xs text-[var(--text-tertiary)] mt-1">
            Knows your availability, preferences, and buffer times.
          </p>
        </div>
        <div className="card p-5 text-center">
          <p className="text-2xl mb-2">&#9889;</p>
          <h3 className="font-semibold text-sm">One-Click Booking</h3>
          <p className="text-xs text-[var(--text-tertiary)] mt-1">
            Approve the AI&apos;s proposal. Email sent. Event booked. Done.
          </p>
        </div>
      </div>

      <footer className="mt-20 text-center text-xs text-[var(--text-tertiary)]">
        <p className="italic mb-2">&ldquo;Time is an illusion. Meetings are not.&rdquo;</p>
        <p>
          Built by{" "}
          <a href="https://linkedin.com/in/phillipan" target="_blank" rel="noopener noreferrer"
             className="text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">
            Phillip An
          </a>
          {" "}&middot;{" "}
          <a href="https://github.com/phillipan14/philocal" target="_blank" rel="noopener noreferrer"
             className="hover:text-[var(--text-secondary)] transition-colors">
            GitHub
          </a>
          {" "}&middot;{" "}
          <a href="https://skylarq.com" target="_blank" rel="noopener noreferrer"
             className="hover:text-[var(--text-secondary)] transition-colors">
            Powered by Skylarq
          </a>
        </p>
      </footer>
    </main>
  );
}
```

**Step 3: Verify page renders**

```bash
npm run dev
```

Visit http://localhost:3000 and confirm the landing page renders with gradient title, feature cards, and footer.

**Step 4: Commit**

```bash
git add app/layout.tsx app/page.tsx
git commit -m "feat: add landing page with PhiloCal branding"
```

---

### Task 4: Google OAuth with NextAuth

**Files:**
- Create: `app/api/auth/[...nextauth]/route.ts`
- Create: `lib/auth.ts`

**Step 1: Create `lib/auth.ts` — NextAuth configuration**

```ts
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: [
            "openid",
            "email",
            "profile",
            "https://www.googleapis.com/auth/calendar",
            "https://www.googleapis.com/auth/calendar.events",
            "https://www.googleapis.com/auth/gmail.readonly",
            "https://www.googleapis.com/auth/gmail.send",
          ].join(" "),
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
      }
      return token;
    },
    async session({ session, token }) {
      (session as any).accessToken = token.accessToken;
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
};
```

**Step 2: Create `app/api/auth/[...nextauth]/route.ts`**

```ts
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

**Step 3: Verify OAuth flow**

```bash
npm run dev
```

Click "Sign in with Google" on landing page. Confirm it redirects to Google consent screen (will fail without valid credentials — just verify the redirect URL is correct).

**Step 4: Commit**

```bash
git add lib/auth.ts app/api/auth/
git commit -m "feat: add Google OAuth with Calendar + Gmail scopes"
```

---

### Task 5: TypeScript Types

**Files:**
- Create: `lib/types.ts`

**Step 1: Create `lib/types.ts`**

```ts
export interface CalendarEvent {
  id: string;
  summary: string;
  start: string; // ISO datetime
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
}

export interface SchedulingProposal {
  id: string;
  emailThreadId: string;
  intent: "schedule_meeting" | "reschedule" | "cancel" | "unclear";
  proposedSlots: TimeSlot[];
  draftReply: string;
  meetingDuration: number; // minutes
  meetingTitle: string;
  participants: string[];
  status: "proposed" | "approved" | "declined";
  createdAt: string;
}

export interface TimeSlot {
  start: string; // ISO datetime
  end: string;
  label: string; // e.g. "Tuesday Feb 25, 2:00 PM - 2:30 PM"
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
  workingHoursStart: string; // "09:00"
  workingHoursEnd: string; // "18:00"
  timezone: string; // "America/Los_Angeles"
  bufferMinutes: number; // 15
  defaultDuration: number; // 30
  defaultLocation: string; // "Google Meet"
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  workingHoursStart: "09:00",
  workingHoursEnd: "18:00",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  bufferMinutes: 15,
  defaultDuration: 30,
  defaultLocation: "Google Meet",
};
```

**Step 2: Commit**

```bash
git add lib/types.ts
git commit -m "feat: add TypeScript types for calendar, email, scheduling"
```

---

### Task 6: Google Calendar API Integration

**Files:**
- Create: `lib/google-calendar.ts`
- Create: `app/api/calendar/route.ts`

**Step 1: Create `lib/google-calendar.ts`**

```ts
import { google } from "googleapis";
import { CalendarEvent } from "./types";

export function getCalendarClient(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.calendar({ version: "v3", auth });
}

export async function getEvents(accessToken: string, timeMin: string, timeMax: string): Promise<CalendarEvent[]> {
  const calendar = getCalendarClient(accessToken);
  const res = await calendar.events.list({
    calendarId: "primary",
    timeMin,
    timeMax,
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 100,
  });

  return (res.data.items || []).map(event => ({
    id: event.id || "",
    summary: event.summary || "(No title)",
    start: event.start?.dateTime || event.start?.date || "",
    end: event.end?.dateTime || event.end?.date || "",
    attendees: event.attendees?.map(a => a.email || "").filter(Boolean),
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
      attendees: attendees.map(email => ({ email })),
      location,
      reminders: { useDefault: true },
    },
    sendUpdates: "all",
  });
  return res.data;
}
```

**Step 2: Create `app/api/calendar/route.ts`**

```ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getEvents, createEvent } from "@/lib/google-calendar";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const timeMin = searchParams.get("timeMin") || new Date().toISOString();
  const timeMax = searchParams.get("timeMax") || new Date(Date.now() + 7 * 86400000).toISOString();

  const events = await getEvents((session as any).accessToken, timeMin, timeMax);
  return NextResponse.json(events);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { summary, start, end, attendees, location } = await request.json();
  const event = await createEvent((session as any).accessToken, summary, start, end, attendees, location);
  return NextResponse.json(event);
}
```

**Step 3: Commit**

```bash
git add lib/google-calendar.ts app/api/calendar/route.ts
git commit -m "feat: add Google Calendar API integration (read + create events)"
```

---

### Task 7: Gmail API Integration

**Files:**
- Create: `lib/gmail.ts`
- Create: `app/api/emails/route.ts`

**Step 1: Create `lib/gmail.ts`**

```ts
import { google } from "googleapis";
import { EmailThread } from "./types";

export function getGmailClient(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.gmail({ version: "v1", auth });
}

export async function getRecentThreads(accessToken: string, maxResults = 20): Promise<EmailThread[]> {
  const gmail = getGmailClient(accessToken);

  const res = await gmail.users.messages.list({
    userId: "me",
    maxResults,
    q: "is:inbox newer_than:3d",
  });

  const messages = res.data.messages || [];
  const threads: EmailThread[] = [];

  for (const msg of messages.slice(0, maxResults)) {
    const detail = await gmail.users.messages.get({
      userId: "me",
      id: msg.id!,
      format: "full",
    });

    const headers = detail.data.payload?.headers || [];
    const getHeader = (name: string) => headers.find(h => h.name?.toLowerCase() === name.toLowerCase())?.value || "";

    const fromRaw = getHeader("From");
    const fromMatch = fromRaw.match(/^(.*?)\s*<(.+?)>$/);

    let bodyText = "";
    const parts = detail.data.payload?.parts;
    if (parts) {
      const textPart = parts.find(p => p.mimeType === "text/plain");
      if (textPart?.body?.data) {
        bodyText = Buffer.from(textPart.body.data, "base64").toString("utf-8");
      }
    } else if (detail.data.payload?.body?.data) {
      bodyText = Buffer.from(detail.data.payload.body.data, "base64").toString("utf-8");
    }

    threads.push({
      id: msg.id!,
      threadId: detail.data.threadId || msg.id!,
      subject: getHeader("Subject"),
      from: fromMatch ? fromMatch[1].trim() : fromRaw,
      fromEmail: fromMatch ? fromMatch[2] : fromRaw,
      snippet: detail.data.snippet || "",
      body: bodyText.slice(0, 2000),
      date: getHeader("Date"),
    });
  }

  return threads;
}

export async function sendReply(
  accessToken: string,
  threadId: string,
  to: string,
  subject: string,
  body: string,
) {
  const gmail = getGmailClient(accessToken);

  const raw = [
    `To: ${to}`,
    `Subject: Re: ${subject}`,
    `Content-Type: text/plain; charset=utf-8`,
    `In-Reply-To: ${threadId}`,
    `References: ${threadId}`,
    "",
    body,
  ].join("\r\n");

  const encoded = Buffer.from(raw).toString("base64url");

  await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw: encoded,
      threadId,
    },
  });
}
```

**Step 2: Create `app/api/emails/route.ts`**

```ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getRecentThreads } from "@/lib/gmail";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const threads = await getRecentThreads((session as any).accessToken);
  return NextResponse.json(threads);
}
```

**Step 3: Commit**

```bash
git add lib/gmail.ts app/api/emails/route.ts
git commit -m "feat: add Gmail API integration (fetch threads + send replies)"
```

---

### Task 8: Claude AI Scheduling Logic

**Files:**
- Create: `lib/scheduling-ai.ts`
- Create: `app/api/schedule/route.ts`

**Step 1: Create `lib/scheduling-ai.ts`**

```ts
import Anthropic from "@anthropic-ai/sdk";
import { CalendarEvent, EmailThread, UserPreferences, SchedulingProposal, TimeSlot } from "./types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function analyzeAndPropose(
  email: EmailThread,
  events: CalendarEvent[],
  prefs: UserPreferences,
): Promise<SchedulingProposal> {
  const eventsContext = events.map(e =>
    `- ${e.summary}: ${e.start} to ${e.end}`
  ).join("\n");

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [{
      role: "user",
      content: `You are PhiloCal, an AI scheduling assistant. Analyze this email and propose meeting times.

USER PREFERENCES:
- Timezone: ${prefs.timezone}
- Working hours: ${prefs.workingHoursStart} to ${prefs.workingHoursEnd}
- Buffer between meetings: ${prefs.bufferMinutes} minutes
- Default meeting duration: ${prefs.defaultDuration} minutes
- Default location: ${prefs.defaultLocation}

CALENDAR (next 7 days):
${eventsContext || "No events scheduled."}

EMAIL:
From: ${email.from} <${email.fromEmail}>
Subject: ${email.subject}
Body: ${email.body}

INSTRUCTIONS:
1. Determine if this email contains a scheduling request.
2. If yes, propose exactly 3 time slots that work given the calendar and preferences.
3. Draft a professional, friendly email reply proposing those times.
4. If this is NOT a scheduling email, set intent to "unclear".

Respond in this exact JSON format (no markdown, no code fences):
{
  "intent": "schedule_meeting" | "reschedule" | "cancel" | "unclear",
  "meetingTitle": "string - suggested meeting title",
  "meetingDuration": number (minutes),
  "participants": ["email@example.com"],
  "proposedSlots": [
    { "start": "ISO datetime", "end": "ISO datetime", "label": "human readable label" }
  ],
  "draftReply": "string - the full email reply text"
}`,
    }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  const parsed = JSON.parse(text);

  return {
    id: `prop_${Date.now()}`,
    emailThreadId: email.threadId,
    intent: parsed.intent,
    proposedSlots: parsed.proposedSlots || [],
    draftReply: parsed.draftReply || "",
    meetingDuration: parsed.meetingDuration || prefs.defaultDuration,
    meetingTitle: parsed.meetingTitle || email.subject,
    participants: parsed.participants || [email.fromEmail],
    status: "proposed",
    createdAt: new Date().toISOString(),
  };
}

export async function classifyEmails(
  emails: EmailThread[],
): Promise<EmailThread[]> {
  if (emails.length === 0) return [];

  const emailSummaries = emails.map((e, i) =>
    `[${i}] From: ${e.from}, Subject: "${e.subject}", Snippet: "${e.snippet}"`
  ).join("\n");

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 256,
    messages: [{
      role: "user",
      content: `Classify which of these emails contain scheduling requests (wanting to meet, schedule a call, find a time, etc).

${emailSummaries}

Respond with ONLY a JSON array of indices that are scheduling-related, e.g. [0, 3, 5]. If none, respond [].`,
    }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "[]";
  const indices: number[] = JSON.parse(text);

  return emails.map((e, i) => ({
    ...e,
    isSchedulingRelated: indices.includes(i),
  }));
}
```

**Step 2: Create `app/api/schedule/route.ts`**

```ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getRecentThreads } from "@/lib/gmail";
import { getEvents } from "@/lib/google-calendar";
import { analyzeAndPropose, classifyEmails } from "@/lib/scheduling-ai";
import { UserPreferences, DEFAULT_PREFERENCES } from "@/lib/types";
import { NextResponse } from "next/server";

// GET: classify emails in inbox
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const threads = await getRecentThreads((session as any).accessToken);
  const classified = await classifyEmails(threads);
  return NextResponse.json(classified);
}

// POST: generate a scheduling proposal for a specific email
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { email, preferences } = await request.json();
  const prefs: UserPreferences = preferences || DEFAULT_PREFERENCES;

  const now = new Date();
  const weekOut = new Date(now.getTime() + 7 * 86400000);
  const events = await getEvents(
    (session as any).accessToken,
    now.toISOString(),
    weekOut.toISOString()
  );

  const proposal = await analyzeAndPropose(email, events, prefs);
  return NextResponse.json(proposal);
}
```

**Step 3: Commit**

```bash
git add lib/scheduling-ai.ts app/api/schedule/route.ts
git commit -m "feat: add Claude AI scheduling logic (classify + propose)"
```

---

### Task 9: Approve & Send API

**Files:**
- Create: `app/api/approve/route.ts`

**Step 1: Create `app/api/approve/route.ts`**

```ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createEvent } from "@/lib/google-calendar";
import { sendReply } from "@/lib/gmail";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { proposal, selectedSlot, emailThread } = await request.json();
  const accessToken = (session as any).accessToken;

  // Create calendar event
  const event = await createEvent(
    accessToken,
    proposal.meetingTitle,
    selectedSlot.start,
    selectedSlot.end,
    proposal.participants,
    undefined, // location
  );

  // Send email reply
  await sendReply(
    accessToken,
    emailThread.threadId,
    emailThread.fromEmail,
    emailThread.subject,
    proposal.draftReply,
  );

  return NextResponse.json({
    success: true,
    event,
    message: "Meeting booked and reply sent.",
  });
}
```

**Step 2: Commit**

```bash
git add app/api/approve/route.ts
git commit -m "feat: add approve endpoint (create event + send reply)"
```

---

### Task 10: Dashboard Layout + Calendar Preview Component

**Files:**
- Create: `app/dashboard/page.tsx`
- Create: `components/CalendarPreview.tsx`
- Create: `components/DashboardHeader.tsx`

**Step 1: Create `components/DashboardHeader.tsx`**

```tsx
"use client";

interface DashboardHeaderProps {
  userName: string;
  emailCount: number;
  bookedCount: number;
  onPreferences: () => void;
  onSignOut: () => void;
}

export default function DashboardHeader({
  userName, emailCount, bookedCount, onPreferences, onSignOut
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
            Welcome back, {userName}. Let&apos;s philosophize about your schedule.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onPreferences} className="btn-secondary text-xs px-3 py-2">
            Preferences
          </button>
          <button onClick={onSignOut} className="btn-secondary text-xs px-3 py-2">
            Sign out
          </button>
        </div>
      </div>
      <div className="flex gap-5 text-xs">
        <div className="flex items-center gap-2">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--warning)]" />
          <span className="text-[var(--text-tertiary)]">
            <span className="text-[var(--text-secondary)] font-medium">{emailCount}</span> scheduling requests
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--success)]" />
          <span className="text-[var(--text-tertiary)]">
            <span className="text-[var(--text-secondary)] font-medium">{bookedCount}</span> meetings booked
          </span>
        </div>
      </div>
    </header>
  );
}
```

**Step 2: Create `components/CalendarPreview.tsx`**

Build a weekly calendar component that:
- Displays 7 days starting from today
- Shows hours from 8am-8pm on the y-axis
- Renders existing Google Calendar events as blue blocks
- Renders proposed time slots as green dashed blocks
- Uses the `.calendar-grid`, `.calendar-event`, `.calendar-proposed` CSS classes from globals.css

```tsx
"use client";

import { CalendarEvent, TimeSlot } from "@/lib/types";

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
      label: d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
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
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

export default function CalendarPreview({ events, proposedSlots = [] }: CalendarPreviewProps) {
  const days = getDayLabels();

  function getEventsForDay(date: Date) {
    return events.filter(e => {
      const eventDate = new Date(e.start);
      return eventDate.toDateString() === date.toDateString();
    });
  }

  function getProposedForDay(date: Date) {
    return proposedSlots.filter(s => {
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
        <div className="grid grid-cols-8 min-w-[640px]" style={{ gap: "1px", background: "var(--border)" }}>
          {/* Header row */}
          <div className="bg-[var(--bg-secondary)] p-2 text-[10px] text-[var(--text-tertiary)]" />
          {days.map(d => (
            <div key={d.label} className="bg-[var(--bg-secondary)] p-2 text-center">
              <span className="text-[10px] text-[var(--text-tertiary)] font-medium">{d.label}</span>
            </div>
          ))}

          {/* Hour rows */}
          {HOURS.map(hour => (
            <>
              <div key={`label-${hour}`} className="bg-[var(--bg-secondary)] p-1 text-right pr-2">
                <span className="text-[10px] text-[var(--text-tertiary)]">
                  {hour % 12 || 12}{hour < 12 ? "a" : "p"}
                </span>
              </div>
              {days.map(d => {
                const dayEvents = getEventsForDay(d.date).filter(e => {
                  const h = getHourPosition(e.start);
                  return h >= hour && h < hour + 1;
                });
                const dayProposed = getProposedForDay(d.date).filter(s => {
                  const h = getHourPosition(s.start);
                  return h >= hour && h < hour + 1;
                });
                return (
                  <div key={`${d.label}-${hour}`} className="calendar-cell">
                    {dayEvents.map(e => (
                      <div key={e.id} className="calendar-event">{e.summary}</div>
                    ))}
                    {dayProposed.map((s, i) => (
                      <div key={i} className="calendar-proposed">{s.label}</div>
                    ))}
                  </div>
                );
              })}
            </>
          ))}
        </div>
      </div>
    </div>
  );
}
```

**Step 3: Create `app/dashboard/page.tsx` — scaffold**

```tsx
"use client";

import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import { CalendarEvent, EmailThread, SchedulingProposal, ActivityItem } from "@/lib/types";
import DashboardHeader from "@/components/DashboardHeader";
import CalendarPreview from "@/components/CalendarPreview";

export default function Dashboard() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [emails, setEmails] = useState<EmailThread[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    async function load() {
      const sessionRes = await fetch("/api/auth/session");
      const session = await sessionRes.json();
      if (!session?.user) {
        window.location.href = "/";
        return;
      }
      setUserName(session.user.name || "friend");

      const [calRes, emailRes] = await Promise.all([
        fetch("/api/calendar"),
        fetch("/api/schedule"),
      ]);
      if (calRes.ok) setEvents(await calRes.json());
      if (emailRes.ok) setEmails((await emailRes.json()).filter((e: EmailThread) => e.isSchedulingRelated));
      setLoading(false);
    }
    load();
  }, []);

  const schedulingEmails = emails.filter(e => e.isSchedulingRelated);

  if (loading) {
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

  return (
    <main className="relative z-10 mx-auto max-w-5xl px-4 py-10">
      <DashboardHeader
        userName={userName}
        emailCount={schedulingEmails.length}
        bookedCount={activities.filter(a => a.type === "booked").length}
        onPreferences={() => {/* TODO: open preferences modal */}}
        onSignOut={() => signOut({ callbackUrl: "/" })}
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Email queue — 3 cols */}
        <div className="lg:col-span-3 space-y-4">
          <h3 className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wider">
            Scheduling Requests
          </h3>
          {schedulingEmails.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-3xl mb-3">&#128172;</p>
              <p className="text-[var(--text-secondary)] font-medium">Inbox zero? Either nobody wants to meet you, or you&apos;re crushing it.</p>
            </div>
          ) : (
            schedulingEmails.map(email => (
              <EmailCard key={email.id} email={email} events={events} />
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
            activities.map(a => (
              <div key={a.id} className="card p-4 flex items-center gap-3">
                <span className={`badge badge-${a.type === "booked" ? "confirmed" : "pending"}`}>
                  {a.type}
                </span>
                <div>
                  <p className="text-sm font-medium">{a.title}</p>
                  <p className="text-xs text-[var(--text-tertiary)]">{a.description}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Calendar — 2 cols */}
        <div className="lg:col-span-2">
          <CalendarPreview events={events} />
        </div>
      </div>

      <footer className="mt-20 text-center text-xs text-[var(--text-tertiary)]">
        <p className="italic mb-2">&ldquo;Time is an illusion. Meetings are not.&rdquo;</p>
        <p>
          Built by{" "}
          <a href="https://linkedin.com/in/phillipan" target="_blank" rel="noopener noreferrer"
             className="text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">
            Phillip An
          </a>
          {" "}&middot;{" "}
          <a href="https://skylarq.com" target="_blank" rel="noopener noreferrer"
             className="hover:text-[var(--text-secondary)] transition-colors">
            Powered by Skylarq
          </a>
        </p>
      </footer>
    </main>
  );
}

// Inline EmailCard component (will be extracted if it grows)
function EmailCard({ email, events }: { email: EmailThread; events: CalendarEvent[] }) {
  const [proposal, setProposal] = useState<SchedulingProposal | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [proposing, setProposing] = useState(false);
  const [approving, setApproving] = useState(false);
  const [done, setDone] = useState(false);

  async function handlePropose() {
    setProposing(true);
    const prefsStr = localStorage.getItem("philocal-preferences");
    const preferences = prefsStr ? JSON.parse(prefsStr) : undefined;

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
    if (res.ok) setDone(true);
    setApproving(false);
  }

  if (done) {
    return (
      <div className="card p-5 border-l-2 border-[var(--success)]">
        <div className="flex items-center gap-3">
          <span className="text-lg">&#9989;</span>
          <div>
            <p className="text-sm font-medium">Booked: {proposal?.meetingTitle}</p>
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
            <span className="text-xs text-[var(--text-tertiary)]">{email.from}</span>
          </div>
          <h4 className="text-sm font-semibold truncate">{email.subject}</h4>
          <p className="text-xs text-[var(--text-tertiary)] mt-1 line-clamp-2">{email.snippet}</p>
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
              <label key={i} className={`flex items-center gap-3 card p-3 cursor-pointer ${selectedSlot === i ? "border-[var(--accent)]" : ""}`}>
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
```

**Step 4: Verify the dashboard renders**

```bash
npm run dev
```

Navigate to `/dashboard` (you'll get redirected to `/` if not authed — that's expected). Check that the component compiles without errors.

**Step 5: Commit**

```bash
git add components/DashboardHeader.tsx components/CalendarPreview.tsx app/dashboard/page.tsx
git commit -m "feat: add dashboard with email queue, calendar preview, activity log"
```

---

### Task 11: Preferences Modal

**Files:**
- Create: `components/PreferencesModal.tsx`
- Create: `lib/preferences.ts`

**Step 1: Create `lib/preferences.ts`**

```ts
import { UserPreferences, DEFAULT_PREFERENCES } from "./types";

const STORAGE_KEY = "philocal-preferences";

export function getPreferences(): UserPreferences {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES;
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : DEFAULT_PREFERENCES;
}

export function savePreferences(prefs: UserPreferences): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}
```

**Step 2: Create `components/PreferencesModal.tsx`**

```tsx
"use client";

import { useState } from "react";
import { UserPreferences } from "@/lib/types";
import { getPreferences, savePreferences } from "@/lib/preferences";

interface PreferencesModalProps {
  onClose: () => void;
}

export default function PreferencesModal({ onClose }: PreferencesModalProps) {
  const [prefs, setPrefs] = useState<UserPreferences>(getPreferences());

  function handleSave() {
    savePreferences(prefs);
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-in" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold mb-1">Preferences</h2>
        <p className="text-xs text-[var(--text-tertiary)] mb-5">
          Tell PhiloCal how you like your time managed.
        </p>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[var(--text-secondary)] block mb-1">Work starts</label>
              <input
                type="text"
                value={prefs.workingHoursStart}
                onChange={e => setPrefs({ ...prefs, workingHoursStart: e.target.value })}
                placeholder="09:00"
              />
            </div>
            <div>
              <label className="text-xs text-[var(--text-secondary)] block mb-1">Work ends</label>
              <input
                type="text"
                value={prefs.workingHoursEnd}
                onChange={e => setPrefs({ ...prefs, workingHoursEnd: e.target.value })}
                placeholder="18:00"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-[var(--text-secondary)] block mb-1">Timezone</label>
            <input
              type="text"
              value={prefs.timezone}
              onChange={e => setPrefs({ ...prefs, timezone: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[var(--text-secondary)] block mb-1">Buffer (minutes)</label>
              <input
                type="number"
                value={prefs.bufferMinutes}
                onChange={e => setPrefs({ ...prefs, bufferMinutes: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="text-xs text-[var(--text-secondary)] block mb-1">Default duration</label>
              <input
                type="number"
                value={prefs.defaultDuration}
                onChange={e => setPrefs({ ...prefs, defaultDuration: Number(e.target.value) })}
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-[var(--text-secondary)] block mb-1">Default location</label>
            <input
              type="text"
              value={prefs.defaultLocation}
              onChange={e => setPrefs({ ...prefs, defaultLocation: e.target.value })}
              placeholder="Google Meet"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSave} className="btn-primary flex-1">Save Preferences</button>
        </div>
      </div>
    </div>
  );
}
```

**Step 3: Wire preferences modal into dashboard**

In `app/dashboard/page.tsx`, add state for `showPreferences` and render `<PreferencesModal>` when true. Connect the `onPreferences` callback in `DashboardHeader`.

**Step 4: Commit**

```bash
git add lib/preferences.ts components/PreferencesModal.tsx app/dashboard/page.tsx
git commit -m "feat: add preferences modal with localStorage persistence"
```

---

### Task 12: NextAuth SessionProvider + Middleware

**Files:**
- Create: `components/Providers.tsx`
- Create: `middleware.ts`
- Modify: `app/layout.tsx`

**Step 1: Create `components/Providers.tsx`**

```tsx
"use client";

import { SessionProvider } from "next-auth/react";

export default function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
```

**Step 2: Wrap layout with Providers in `app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  title: "PhiloCal — AI Scheduling Assistant",
  description: "Your calendar has a philosophy now.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

**Step 3: Create `middleware.ts`**

Protect `/dashboard` route — redirect unauthenticated users to `/`.

```ts
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  if (!token && request.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
```

**Step 4: Commit**

```bash
git add components/Providers.tsx middleware.ts app/layout.tsx
git commit -m "feat: add SessionProvider, auth middleware for /dashboard"
```

---

### Task 13: Build Verification + README

**Files:**
- Modify: `README.md` (create)

**Step 1: Run build**

```bash
npm run build
```

Fix any TypeScript or build errors.

**Step 2: Create `README.md`**

```markdown
# PhiloCal

Your calendar has a philosophy now.

AI-powered scheduling assistant that monitors your Gmail for meeting requests, proposes optimal times based on your Google Calendar, and books everything with one click. Inspired by [BlockIt](https://blockit.com).

**Built by [Phillip An](https://linkedin.com/in/phillipan)**

## How it works

1. Sign in with Google (Calendar + Gmail access)
2. PhiloCal scans your inbox for scheduling requests
3. AI proposes 3 time slots based on your availability and preferences
4. Review the draft reply, pick a slot, click "Approve & Send"
5. Email reply sent + calendar event created automatically

## Features

- **Email intelligence** — AI classifies which emails are scheduling requests
- **Calendar awareness** — reads your Google Calendar to find open slots
- **Smart proposals** — respects working hours, buffer times, and preferences
- **One-click booking** — sends the email reply and creates the event simultaneously
- **Preference learning** — configure working hours, buffer, timezone, default duration

## Tech stack

- **Frontend:** Next.js 15, React 19, Tailwind CSS 4
- **Auth:** NextAuth.js + Google OAuth
- **Calendar:** Google Calendar API
- **Email:** Gmail API
- **AI:** Claude API (Anthropic)

## Run locally

```bash
git clone https://github.com/phillipan14/philocal.git
cd philocal
npm install
```

Set up Google OAuth credentials:
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Enable Google Calendar API and Gmail API
3. Create OAuth 2.0 credentials
4. Add `http://localhost:3000/api/auth/callback/google` as redirect URI

Create `.env.local`:
```
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret
ANTHROPIC_API_KEY=your_api_key
```

```bash
npm run dev
```

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/phillipan14/philocal)

## License

MIT
```

**Step 3: Commit**

```bash
git add README.md
git commit -m "docs: add README with setup instructions"
```

---

### Task 14: GitHub Repo + Profile README + Push

**Step 1: Create GitHub repo**

```bash
cd /Users/phillipan/philocal
gh repo create phillipan14/philocal --public --description "AI scheduling assistant — your calendar has a philosophy now" --source . --push
```

**Step 2: Update profile README**

Add PhiloCal to the projects table in `/Users/phillipan/phillipan14/README.md`:

```markdown
| &#129504; [PhiloCal](https://github.com/phillipan14/philocal) | **Your calendar has a philosophy now.** AI scheduling assistant that monitors Gmail for meeting requests, proposes times from your Google Calendar, and books with one click. Powered by Claude AI. |
```

**Step 3: Push profile README**

```bash
cd /Users/phillipan/phillipan14
git add README.md
git commit -m "Add PhiloCal to projects"
git push
```

---

## Summary

| Task | Description | Estimated Steps |
|------|-------------|----------------|
| 1 | Scaffold Next.js project | 7 |
| 2 | Dark theme + global styles | 2 |
| 3 | Layout + landing page | 4 |
| 4 | Google OAuth with NextAuth | 4 |
| 5 | TypeScript types | 2 |
| 6 | Google Calendar API | 3 |
| 7 | Gmail API | 3 |
| 8 | Claude AI scheduling logic | 3 |
| 9 | Approve & send endpoint | 2 |
| 10 | Dashboard + calendar preview | 5 |
| 11 | Preferences modal | 4 |
| 12 | SessionProvider + middleware | 4 |
| 13 | Build verification + README | 3 |
| 14 | GitHub repo + profile update | 3 |
| **Total** | | **49 steps** |
