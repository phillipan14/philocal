import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  title: "PhiloCal — AI Scheduling Assistant",
  description:
    "Your calendar has a philosophy now. AI-powered scheduling that monitors your email and books meetings automatically.",
  openGraph: {
    title: "PhiloCal — AI Scheduling Assistant",
    description: "Your calendar has a philosophy now.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
