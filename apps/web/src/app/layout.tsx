import type { Metadata } from "next";
import Link from "next/link";
import "leaflet/dist/leaflet.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cambium MRV",
  description:
    "Privacy-preserving field evidence for autonomous agriculture — green claims, supply-chain compliance, RWA due diligence.",
};

const navLinks = [
  { href: "/", label: "Dashboard" },
  { href: "/fields", label: "Fields" },
  { href: "/machines", label: "Machines" },
  { href: "/sessions", label: "Sessions" },
  { href: "/evidence", label: "Evidence" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="border-b border-ink-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <Link href="/" className="flex items-baseline gap-2">
              <span className="text-lg font-semibold tracking-tight text-cambium">
                Cambium
              </span>
              <span className="text-xs uppercase tracking-wide text-ink-500">
                MRV / field evidence
              </span>
            </Link>
            <nav className="flex items-center gap-1">
              {navLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="rounded-md px-3 py-1.5 text-sm text-ink-700 hover:bg-ink-100"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
        <footer className="mx-auto max-w-6xl px-6 py-6 text-xs text-ink-500">
          Cambium creates verifiable evidence packets. It does not certify
          carbon credits and does not guarantee legal compliance.
        </footer>
      </body>
    </html>
  );
}
