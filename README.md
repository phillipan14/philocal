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

### Features

- **Email intelligence** — AI classifies which emails are scheduling requests
- **Calendar awareness** — reads your Google Calendar to find open slots
- **Smart proposals** — respects working hours, buffer times, and preferences
- **One-click booking** — sends the email reply and creates the event simultaneously
- **Preference learning** — configure working hours, buffer, timezone, default duration

## Tech stack

- **Frontend:** Next.js 16, React 19, Tailwind CSS 4
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

### Set up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a project (or select existing)
3. Enable **Google Calendar API** and **Gmail API**
4. Create **OAuth 2.0 credentials** (Web application)
5. Add `http://localhost:3000/api/auth/callback/google` as authorized redirect URI

### Configure environment

```bash
cp .env.example .env.local
```

Fill in your values:

```
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret  # generate with: openssl rand -base64 32
ANTHROPIC_API_KEY=your_api_key
```

### Start the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/phillipan14/philocal&env=GOOGLE_CLIENT_ID,GOOGLE_CLIENT_SECRET,NEXTAUTH_SECRET,ANTHROPIC_API_KEY&envDescription=Google%20OAuth%20credentials%20and%20API%20keys)

## License

MIT
