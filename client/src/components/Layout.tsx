/* ============================================================
   REPS — Layout Component
   Terminal Precision: Fixed left sidebar + main content area
   ============================================================ */

import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  BookOpen,
  Shuffle,
  Zap,
  Trophy,
  BarChart2,
  FileText,
  Settings,
} from "lucide-react";

const NAV_ITEMS = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/learn", label: "Learn", icon: BookOpen },
  { path: "/router", label: "Router", icon: Shuffle },
  { path: "/practice", label: "Practice", icon: Zap },
  { path: "/mock", label: "Mock", icon: Trophy },
  { path: "/review", label: "Review", icon: BarChart2 },
  { path: "/packet", label: "Packet", icon: FileText },
  { path: "/settings", label: "Settings", icon: Settings },
];

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();

  return (
    <div className="flex min-h-screen" style={{ background: "oklch(0.13 0.01 265)" }}>
      {/* Sidebar */}
      <aside
        style={{
          width: 200,
          minWidth: 200,
          background: "oklch(0.15 0.012 265)",
          borderRight: "1px solid oklch(0.22 0.01 265)",
          display: "flex",
          flexDirection: "column",
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 50,
        }}
      >
        {/* Logo */}
        <div
          style={{
            padding: "20px 16px 16px",
            borderBottom: "1px solid oklch(0.22 0.01 265)",
          }}
        >
          <Link href="/">
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 20,
                fontWeight: 700,
                color: "oklch(0.78 0.17 65)",
                letterSpacing: "-0.02em",
                cursor: "pointer",
              }}
            >
              REPS_
            </span>
          </Link>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              color: "oklch(0.40 0.01 265)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginTop: 2,
            }}
          >
            OPNS-430
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px 8px", overflowY: "auto" }}>
          <div className="section-label" style={{ padding: "4px 8px 8px" }}>
            MODES
          </div>
          {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
            const isActive =
              path === "/"
                ? location === "/"
                : location.startsWith(path);
            return (
              <Link key={path} href={path}>
                <div className={`nav-item ${isActive ? "active" : ""}`}>
                  <Icon size={15} strokeWidth={1.8} />
                  <span>{label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div
          style={{
            padding: "12px 16px",
            borderTop: "1px solid oklch(0.22 0.01 265)",
          }}
        >
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              color: "oklch(0.30 0.01 265)",
              letterSpacing: "0.05em",
            }}
          >
            v2.0 · improved
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main
        style={{
          marginLeft: 200,
          flex: 1,
          minHeight: "100vh",
          padding: "32px 40px",
          maxWidth: "calc(100vw - 200px)",
        }}
      >
        {children}
      </main>
    </div>
  );
}
