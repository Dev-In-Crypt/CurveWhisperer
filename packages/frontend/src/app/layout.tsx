import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CurveWhisperer — Four.Meme AI Advisor",
  description: "Real-time AI advisor for Four.Meme bonding curves on BNB Chain",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <header className="border-b border-card-border px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight">CurveWhisperer</h1>
            <span className="text-xs text-muted">Four.Meme AI Advisor</span>
          </div>
          <div className="flex items-center gap-2">
            <ConnectionDot />
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-card-border px-6 py-3 text-center text-xs text-muted">
          Built for Four.Meme AI Sprint on BNB Chain
        </footer>
      </body>
    </html>
  );
}

function ConnectionDot() {
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted">
      <div className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
      <span>Live</span>
    </div>
  );
}
