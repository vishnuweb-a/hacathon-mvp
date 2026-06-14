import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import Link from "next/link";
import { Shield } from "lucide-react";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "SentinelMind — Security Intelligence Platform",
  description: "Memory-native security intelligence platform powered by Hindsight",
};

const NAV_LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/incidents", label: "Incidents" },
  { href: "/assistant", label: "Copilot" },
  { href: "/intelligence", label: "Intelligence" },
  { href: "/memory-graph", label: "Memory Graph" },
  { href: "/provenance", label: "Provenance" },
  { href: "/runbooks", label: "Runbooks" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} h-full antialiased dark`}
    >
      <body
        className="min-h-full flex flex-col"
        style={{ backgroundColor: "#0B1220", color: "#F3F6FB" }}
      >
        <nav
          className="border-b"
          style={{ backgroundColor: "#121A2B", borderColor: "#243146" }}
        >
          <div className="max-w-[1400px] mx-auto px-6">
            <div className="flex justify-between h-14">
              <div className="flex items-center">
                <Link href="/" className="flex items-center gap-2.5 mr-10">
                  <Shield className="w-5 h-5 text-cyan-500" />
                  <span className="font-bold text-[15px] tracking-tight" style={{ color: "#F3F6FB" }}>
                    SentinelMind
                  </span>
                </Link>
                <div className="hidden md:flex items-center gap-1">
                  {NAV_LINKS.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors text-[#94A3B8] hover:bg-[#182235] hover:text-[#F3F6FB]"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
              <div className="flex items-center">
                <span className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium"
                  style={{ backgroundColor: "rgba(22, 163, 74, 0.1)", color: "#16A34A", border: "1px solid rgba(22, 163, 74, 0.2)" }}
                >
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: "#16A34A" }} />
                  Online
                </span>
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
