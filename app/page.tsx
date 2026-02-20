"use client";

import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session?.user) {
      router.push("/dashboard");
    }
  }, [session, router]);

  if (status === "loading" || session?.user) return null;

  return (
    <>
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--bg-primary)]/80 backdrop-blur-lg border-b border-[var(--border)]">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-[var(--accent)]" style={{ fontFamily: "var(--font-display)" }}>
              PhiloCal
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/phillipan14/philocal"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors hidden sm:block"
            >
              GitHub
            </a>
            <button
              onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
              className="landing-btn-primary text-sm"
            >
              Get started
            </button>
          </div>
        </div>
      </nav>

      <main className="relative z-10">
        {/* Hero */}
        <section className="mx-auto max-w-4xl px-6 pt-32 pb-20 sm:pt-40 sm:pb-28 text-center">
          <div className="animate-in">
            <p className="text-sm font-medium text-[var(--accent)] tracking-widest uppercase mb-6">
              AI-Powered Scheduling
            </p>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.08]">
              The{" "}
              <span className="text-[var(--accent)]">
                AI scheduler
              </span>{" "}
              for people who are{" "}
              <span className="text-[var(--accent)]">
                back&#8209;to&#8209;back
              </span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed">
              Meet PhiloCal: your instant, 24/7 AI scheduling assistant.
              It reads your email, checks your calendar, and books meetings
              for you. Just let it handle the rest.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
              <button
                onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                className="landing-btn-primary text-base px-8 py-4"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Start free with Google
              </button>
              <a
                href="#features"
                className="landing-btn-secondary text-base px-8 py-4"
              >
                See how it works
              </a>
            </div>
            <p className="mt-6 text-sm text-[var(--text-tertiary)] italic">
              It is 2026. We have self-driving cars. Meet your self-driving calendar.
            </p>
          </div>
        </section>

        {/* Integrations strip */}
        <section className="border-t border-b border-[var(--border)] py-10 bg-[var(--bg-secondary)]/50">
          <div className="mx-auto max-w-4xl px-6">
            <p className="text-center text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-widest mb-6">
              Integrates with the tools you use
            </p>
            <div className="flex items-center justify-center gap-10 sm:gap-16 flex-wrap">
              <IntegrationLogo name="Google Calendar" icon="📅" />
              <IntegrationLogo name="Gmail" icon="✉️" />
              <IntegrationLogo name="Google Meet" icon="📹" />
              <IntegrationLogo name="Claude AI" icon="🧠" />
            </div>
          </div>
        </section>

        {/* Feature pillars */}
        <section id="features" className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">
              Scheduling that actually works
            </h2>
            <p className="mt-4 text-[var(--text-secondary)] max-w-xl mx-auto">
              No more back-and-forth emails. No more timezone math. PhiloCal
              handles the tedious parts so you can focus on what matters.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <FeaturePillar
              label="Instantaneous"
              title="Schedule in the blink of AI"
              description="PhiloCal scans your inbox for scheduling requests and responds in seconds, not hours. Available 24/7, never drops the ball."
              icon="⚡"
            />
            <FeaturePillar
              label="Personalized"
              title="Tailored to your preferences"
              description="Respects your working hours, buffer times, preferred meeting durations, and default locations. Your calendar, your rules."
              icon="🎯"
            />
            <FeaturePillar
              label="Trustworthy"
              title="You stay in control"
              description="PhiloCal proposes times and drafts replies — but nothing happens without your approval. Review, adjust, then send with one click."
              icon="🛡️"
            />
          </div>
        </section>

        {/* Stats section */}
        <section className="border-t border-[var(--border)] bg-[var(--bg-secondary)]/50 py-20 sm:py-24">
          <div className="mx-auto max-w-5xl px-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
              <StatCard number="3" suffix="sec" label="Average response time to scheduling requests" />
              <StatCard number="10" suffix="+" label="Hours saved per month on scheduling admin" />
              <StatCard number="0" suffix="" label="Meetings booked without your explicit approval" />
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="mx-auto max-w-4xl px-6 py-20 sm:py-28">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">
              How it works
            </h2>
            <p className="mt-4 text-[var(--text-secondary)]">
              Three steps. Zero scheduling headaches.
            </p>
          </div>
          <div className="space-y-8">
            <StepCard
              number="01"
              title="Connect your Google account"
              description="Sign in with Google. PhiloCal gets read access to your Gmail and full access to your calendar. No passwords stored."
            />
            <StepCard
              number="02"
              title="PhiloCal scans your inbox"
              description="AI classifies incoming emails to find scheduling requests — people wanting to meet, schedule calls, or find mutual availability."
            />
            <StepCard
              number="03"
              title="Review, approve, done"
              description="For each request, PhiloCal proposes 3 time slots that work with your calendar and drafts a reply. You pick a slot, hit approve, and the meeting is booked."
            />
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t border-[var(--border)] py-20 sm:py-28">
          <div className="mx-auto max-w-3xl px-6">
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">
              Frequently asked questions
            </h2>
            <div className="space-y-3">
              <FAQItem
                question="Is my data safe?"
                answer="PhiloCal never stores your emails or calendar data on our servers. All processing happens in real-time through the Google API, and your Anthropic API key is stored only in your browser's local storage."
              />
              <FAQItem
                question="Do I need an Anthropic API key?"
                answer="Yes — PhiloCal uses Claude AI to classify emails and propose meeting times. You can get an API key at console.anthropic.com and enter it in the app preferences. Your key stays on your device."
              />
              <FAQItem
                question="What permissions does PhiloCal need?"
                answer="Gmail read access (to scan for scheduling emails), Gmail send access (to send replies you approve), and Google Calendar access (to check availability and create events)."
              />
              <FAQItem
                question="Can PhiloCal book meetings without my approval?"
                answer="Never. PhiloCal always proposes times and drafts replies for your review. Nothing is sent or booked until you explicitly click 'Approve & Send'."
              />
              <FAQItem
                question="Is PhiloCal free?"
                answer="The app is open-source and free to use. You only pay for your own Anthropic API usage, which is typically just a few cents per scheduling request."
              />
            </div>
          </div>
        </section>

        {/* CTA section */}
        <section className="border-t border-[var(--border)] bg-[var(--bg-secondary)]/50 py-20 sm:py-28">
          <div className="mx-auto max-w-2xl px-6 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold">
              Ready to stop scheduling manually?
            </h2>
            <p className="mt-4 text-[var(--text-secondary)]">
              Connect your Google account and let PhiloCal handle the rest.
            </p>
            <button
              onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
              className="landing-btn-primary text-base px-8 py-4 mt-8"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Start free with Google
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-[var(--border)] py-10">
          <div className="mx-auto max-w-6xl px-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-[var(--accent)]">
                  PhiloCal
                </span>
                <span className="text-xs text-[var(--text-tertiary)]">
                  Your self-driving calendar
                </span>
              </div>
              <div className="flex items-center gap-6 text-sm text-[var(--text-tertiary)]">
                <a
                  href="https://linkedin.com/in/phillipan"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[var(--text-secondary)] transition-colors"
                >
                  LinkedIn
                </a>
                <a
                  href="https://github.com/phillipan14/philocal"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[var(--text-secondary)] transition-colors"
                >
                  GitHub
                </a>
                <a
                  href="https://skylarq.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[var(--text-secondary)] transition-colors"
                >
                  Skylarq
                </a>
              </div>
            </div>
            <p className="mt-6 text-center text-xs text-[var(--text-tertiary)]">
              Built by{" "}
              <a
                href="https://linkedin.com/in/phillipan"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
              >
                Phillip An
              </a>
              {" "}&middot; Powered by{" "}
              <a
                href="https://skylarq.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
              >
                Skylarq
              </a>
            </p>
          </div>
        </footer>
      </main>
    </>
  );
}

function IntegrationLogo({ name, icon }: { name: string; icon: string }) {
  return (
    <div className="flex flex-col items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
      <span className="text-2xl">{icon}</span>
      <span className="text-xs text-[var(--text-tertiary)]">{name}</span>
    </div>
  );
}

function FeaturePillar({
  label,
  title,
  description,
  icon,
}: {
  label: string;
  title: string;
  description: string;
  icon: string;
}) {
  return (
    <div className="card p-8 text-center group hover:border-[var(--accent)]/30 transition-all">
      <span className="text-3xl block mb-4">{icon}</span>
      <p className="text-xs font-semibold text-[var(--accent)] tracking-widest uppercase mb-2">
        {label}
      </p>
      <h3 className="text-lg font-bold mb-3">{title}</h3>
      <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
        {description}
      </p>
    </div>
  );
}

function StatCard({
  number,
  suffix,
  label,
}: {
  number: string;
  suffix: string;
  label: string;
}) {
  return (
    <div className="p-6">
      <p className="text-5xl sm:text-6xl font-bold text-[var(--accent)]">
        {number}
        <span className="text-3xl sm:text-4xl">{suffix}</span>
      </p>
      <p className="mt-3 text-sm text-[var(--text-secondary)]">{label}</p>
    </div>
  );
}

function StepCard({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="card p-6 sm:p-8 flex items-start gap-6">
      <span className="text-3xl font-bold text-[var(--accent)]/30 shrink-0 leading-none mt-1">
        {number}
      </span>
      <div>
        <h3 className="text-lg font-bold mb-2">{title}</h3>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}

function FAQItem({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="card overflow-hidden cursor-pointer"
      onClick={() => setOpen(!open)}
    >
      <div className="p-5 flex items-center justify-between gap-4">
        <h4 className="text-sm font-semibold">{question}</h4>
        <span
          className={`text-[var(--text-tertiary)] transition-transform shrink-0 ${open ? "rotate-45" : ""}`}
        >
          +
        </span>
      </div>
      {open && (
        <div className="px-5 pb-5 -mt-1">
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            {answer}
          </p>
        </div>
      )}
    </div>
  );
}
