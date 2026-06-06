/* ============================================================
   REPS — Layout
   Mobile: fixed top bar + bottom tab nav (5 primary items)
   Desktop: persistent left sidebar
   ============================================================ */

import { type ReactNode } from "react";
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
  Menu,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useState } from "react";
import { useIsMobile } from "@/hooks/useMobile";

const SIDEBAR_ITEMS = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/learn", label: "Learn", icon: BookOpen },
  { path: "/router", label: "Router", icon: Shuffle },
  { path: "/practice", label: "Practice", icon: Zap },
  { path: "/mock", label: "Mock", icon: Trophy },
  { path: "/review", label: "Review", icon: BarChart2 },
  { path: "/packet", label: "Packet", icon: FileText },
  { path: "/settings", label: "Settings", icon: Settings },
];

// Bottom nav shows the 5 most-used modes; overflow goes in the sheet
const BOTTOM_NAV_ITEMS = [
  { path: "/", label: "Home", icon: LayoutDashboard },
  { path: "/router", label: "Router", icon: Shuffle },
  { path: "/practice", label: "Practice", icon: Zap },
  { path: "/review", label: "Review", icon: BarChart2 },
  { path: "/learn", label: "Learn", icon: BookOpen },
];

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const isMobile = useIsMobile();

  // Active path helper
  const isActive = (path: string) =>
    path === "/" ? location === "/" : location.startsWith(path);

  return (
    <div className="app-shell">
      {/* ── Desktop sidebar ── */}
      {!isMobile && (
        <aside className="desktop-sidebar">
          <SidebarHeader />
          <nav style={{ flex: 1, padding: "12px 8px", overflowY: "auto" }}>
            <div className="section-label" style={{ padding: "4px 8px 8px" }}>
              MODES
            </div>
            {SIDEBAR_ITEMS.map(({ path, label, icon: Icon }) => (
              <Link key={path} href={path}>
                <div className={`nav-item ${isActive(path) ? "active" : ""}`}>
                  <Icon size={15} strokeWidth={1.8} aria-hidden="true" />
                  <span>{label}</span>
                </div>
              </Link>
            ))}
          </nav>
          <SidebarFooter />
        </aside>
      )}

      {/* ── Mobile top bar ── */}
      {isMobile && (
        <header className="mobile-topbar" role="banner">
          <button
            type="button"
            aria-label="Open navigation menu"
            onClick={() => setIsSheetOpen(true)}
            className="icon-button"
          >
            <Menu size={18} aria-hidden="true" />
          </button>
          <Link href="/">
            <span className="brand-mark">REPS_</span>
          </Link>
          <span className="topbar-code">OPNS-430</span>
        </header>
      )}

      {/* ── Mobile full nav sheet (for overflow items) ── */}
      {isMobile && (
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetContent
            side="left"
            className="p-0"
            style={{
              width: 220,
              background: "var(--sidebar)",
              borderRight: "1px solid var(--sidebar-border)",
            }}
          >
            <SheetHeader
              style={{
                padding: "20px 16px 12px",
                borderBottom: "1px solid var(--sidebar-border)",
              }}
            >
              <SheetTitle>
                <span className="brand-mark">REPS_</span>
              </SheetTitle>
              <div className="topbar-code">OPNS-430</div>
            </SheetHeader>
            <nav style={{ flex: 1, padding: "12px 8px", overflowY: "auto" }}>
              <div className="section-label" style={{ padding: "4px 8px 8px" }}>
                ALL MODES
              </div>
              {SIDEBAR_ITEMS.map(({ path, label, icon: Icon }) => (
                <Link key={path} href={path} onClick={() => setIsSheetOpen(false)}>
                  <div className={`nav-item ${isActive(path) ? "active" : ""}`}>
                    <Icon size={15} strokeWidth={1.8} aria-hidden="true" />
                    <span>{label}</span>
                  </div>
                </Link>
              ))}
            </nav>
            <SidebarFooter />
          </SheetContent>
        </Sheet>
      )}

      {/* ── Main content ── */}
      <main
        className={`app-main ${isMobile ? "app-main-mobile" : ""}`}
        id="main-content"
        role="main"
      >
        {children}
      </main>

      {/* ── Mobile bottom tab bar ── */}
      {isMobile && (
        <nav
          className="mobile-bottom-nav"
          role="navigation"
          aria-label="Primary navigation"
        >
          {BOTTOM_NAV_ITEMS.map(({ path, label, icon: Icon }) => (
            <Link key={path} href={path}>
              <div
                className={`bottom-nav-item ${isActive(path) ? "active" : ""}`}
                role="link"
                aria-label={label}
                aria-current={isActive(path) ? "page" : undefined}
              >
                <Icon
                  size={20}
                  strokeWidth={isActive(path) ? 2.2 : 1.8}
                  aria-hidden="true"
                />
                <span>{label}</span>
              </div>
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}

function SidebarHeader() {
  return (
    <div
      style={{
        padding: "20px 16px 16px",
        borderBottom: "1px solid var(--sidebar-border)",
      }}
    >
      <Link href="/">
        <span className="brand-mark">REPS_</span>
      </Link>
      <div className="topbar-code" style={{ marginTop: 4 }}>
        OPNS-430
      </div>
    </div>
  );
}

function SidebarFooter() {
  return (
    <div
      style={{
        padding: "12px 16px",
        borderTop: "1px solid var(--sidebar-border)",
      }}
    >
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
          color: "var(--muted-foreground)",
          letterSpacing: "0.05em",
        }}
      >
        v2.2 improved
      </div>
    </div>
  );
}
