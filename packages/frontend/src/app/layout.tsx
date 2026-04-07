import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Web3Provider } from "../components/Web3Provider";
import { Header } from "../components/Header";

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
        <Web3Provider>
          <Header />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-card-border px-6 py-3 text-center text-xs text-muted">
            Built for Four.Meme AI Sprint on BNB Chain
          </footer>
        </Web3Provider>
      </body>
    </html>
  );
}
