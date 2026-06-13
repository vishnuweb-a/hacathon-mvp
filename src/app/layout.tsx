import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Shield, Database, LayoutDashboard, Sparkles, Brain, FileText } from "lucide-react";
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
  title: "Security Memory Agent",
  description: "AI-powered security incident and memory management",
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
        <nav className="border-b border-border bg-card">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center gap-2">
                  <Shield className="w-6 h-6 text-primary" />
                  <span className="font-bold text-lg hidden sm:block">SOC OS</span>
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  <Link href="/" className="border-transparent text-muted-foreground hover:border-gray-300 hover:text-foreground inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    Dashboard
                  </Link>
                  <Link href="/incidents" className="border-transparent text-muted-foreground hover:border-gray-300 hover:text-foreground inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                    <Database className="w-4 h-4 mr-2" />
                    Incidents
                  </Link>
                  <Link href="/assistant" className="border-transparent text-muted-foreground hover:border-gray-300 hover:text-foreground inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                    <Sparkles className="w-4 h-4 mr-2 text-cyan-500" />
                    Copilot
                  </Link>
                  <Link href="/learning" className="border-transparent text-muted-foreground hover:border-gray-300 hover:text-foreground inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                    <Brain className="w-4 h-4 mr-2 text-violet-500" />
                    Learning
                  </Link>
                  <Link href="/reports" className="border-transparent text-muted-foreground hover:border-gray-300 hover:text-foreground inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                    <FileText className="w-4 h-4 mr-2 text-amber-500" />
                    Reports
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </nav>
        <main className="flex-1 flex flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}
