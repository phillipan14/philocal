"use client";

import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

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
          AI that reads your email, checks your calendar, and books meetings for
          you. Just CC PhiloCal and let it handle the rest.
        </p>

        <button
          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          className="btn-primary mt-8 text-base px-8 py-3"
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
            href="https://github.com/phillipan14/philocal"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[var(--text-secondary)] transition-colors"
          >
            GitHub
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
    </main>
  );
}
