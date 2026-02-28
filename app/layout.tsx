import type { Metadata } from "next";
import TopNav from "@/components/TopNav";
import { ToastProvider } from "@/components/ui/Toast";
import LuciusReview from "@/components/LuciusReview";
import "./globals.css";

export const metadata: Metadata = {
  title: "Haro Dashboard",
  description: "Mission control + second brain",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ToastProvider>
          <header className="topbar">
            <div>
              <h1>Haro Dashboard</h1>
              <p className="muted">Mission control + Second Brain</p>
            </div>
            <TopNav />
            <LuciusReview />
          </header>
          <main className="container">{children}</main>
        </ToastProvider>
      </body>
    </html>
  );
}
