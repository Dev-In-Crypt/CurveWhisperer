import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Web3Provider } from "../components/Web3Provider";
import { Header } from "../components/Header";
import { ParticleBackground } from "../components/ParticleBackground";

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
      <body className="min-h-full flex flex-col bg-background text-foreground scanlines">
        <Web3Provider>
          <ParticleBackground />
          <Header />
          <main className="flex-1 relative z-10">{children}</main>
          <footer className="border-t border-card-border/30 px-6 py-3 text-center text-xs text-muted font-mono relative z-10 backdrop-blur-sm bg-background/40">
            <span className="text-accent-purple/50">///</span> Built for Four.Meme AI Sprint on BNB Chain <span className="text-accent-purple/50">///</span>
          </footer>
        </Web3Provider>
      </body>
    </html>
  );
}
