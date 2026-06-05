import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mnemo — Your Codebase Has Been Trying to Warn You",
  description:
    "Institutional memory for engineering teams. Mnemo remembers every decision, reversal, and caveat so you don't repeat what already failed.",
  openGraph: {
    title: "Mnemo — Institutional Memory for Engineering Teams",
    description: "Your codebase has been trying to warn you.",
    type: "website"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;1,400&family=Playfair+Display:ital,wght@0,400;1,400&family=Lora:ital@1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
