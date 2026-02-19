# PhiloCal Design Doc

**Date**: 2026-02-19
**Author**: Phillip An + Claude
**Status**: Approved

## Overview

PhiloCal is an AI-powered scheduling assistant that monitors your Gmail for scheduling requests and proposes meeting times based on your Google Calendar availability. Inspired by [BlockIt](https://blockit.com) — the "self-driving calendar" backed by Sequoia.

**Tagline**: "Your calendar has a philosophy now."

## How It Works

1. User signs in with Google (OAuth — Calendar + Gmail permissions)
2. Dashboard shows incoming email threads with scheduling intent
3. AI (Claude) parses each thread, checks user's calendar, drafts a response with 3 time slots
4. User reviews and approves — email reply sent via Gmail API + calendar event created
5. Activity log tracks all scheduling actions

## Architecture

```
Next.js 15 App
├── Landing / Sign-in (Google OAuth)
├── Dashboard
│   ├── Email Queue (scheduling requests from Gmail)
│   ├── Calendar Preview (weekly view from Google Calendar)
│   └── Activity Log (booking history)
├── Preferences (working hours, buffer, timezone, defaults)
└── API Routes
    ├── /api/auth (NextAuth + Google OAuth)
    ├── /api/emails (Gmail API — fetch threads)
    ├── /api/calendar (Google Calendar API — read/write events)
    ├── /api/schedule (Claude AI — parse intent + propose times)
    └── /api/approve (send reply + create event)
```

## Tech Stack

- Next.js 15, React 19, Tailwind CSS 4, TypeScript
- NextAuth.js — Google OAuth with Calendar + Gmail scopes
- Google Calendar API — read events, create events
- Gmail API — read inbox, send replies
- Claude API (Anthropic) — parse scheduling intent, propose times, draft responses
- localStorage — user preferences

No database. Session via NextAuth cookies, preferences in localStorage, all data live from Google APIs.

## Features

### Email Queue
- Gmail API fetches recent threads
- Claude classifies which are scheduling-related
- Cards show: sender, subject, snippet, detected intent
- Expand to see AI-proposed response with 3 time slots
- "Approve & Send" button

### Calendar Preview
- Weekly view of Google Calendar events
- Proposed meeting slots highlighted
- Busy/free blocks at a glance

### Activity Log
- Recent scheduling actions with status badges
- Proposed / Confirmed / Declined states

### Preferences
- Working hours (default: 9am-6pm)
- Buffer time between meetings (15/30/60 min)
- Preferred meeting durations
- Timezone
- Meeting location defaults (Zoom/Google Meet/in-person)

## AI Prompt Flow

Claude receives:
- The email thread content
- User's calendar events for the relevant period
- User preferences (timezone, working hours, buffer)

Claude outputs structured JSON:
- Scheduling intent classification
- 3 proposed time slots
- Draft email reply
- Meeting duration estimate
- Participant emails

## Brand Voice

- Tagline: "Your calendar has a philosophy now."
- Empty queue: "Inbox zero? Either nobody wants to meet you, or you're crushing it."
- After booking: "Another meeting booked. Your calendar weeps."
- Loading: "Consulting the ancient calendar scrolls..."
- Footer: "Time is an illusion. Meetings are not."
- No history: "No scheduling history yet. Are you sure you have friends?"

## Implementation Phases

1. Scaffold + Auth (Next.js, Google OAuth, dark theme)
2. Calendar Integration (Google Calendar API, weekly view)
3. Gmail Integration (fetch threads, scheduling detection)
4. AI Scheduling Logic (Claude parsing, time proposals, draft responses)
5. Approve & Send Flow (one-click send + book, activity log, preferences)
6. Polish & Ship (screenshots, README, GitHub, Vercel deploy)
