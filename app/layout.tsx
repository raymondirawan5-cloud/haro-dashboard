import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Haro Dashboard",
  description: "Mission control + second brain",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="topbar">
          <div>
            <h1>Haro Dashboard</h1>
            <p className="muted">Mission control + Second Brain</p>
          </div>
          <nav className="nav">
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/mission-control/decisions">Decisions</Link>
            <Link href="/second-brain/memories">Memories</Link>
            <Link href="/second-brain/documents">Documents</Link>
            <Link href="/second-brain/tasks">Tasks</Link>
          </nav>
        </header>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
