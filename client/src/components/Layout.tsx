import { useState, type ReactNode } from "react";
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
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useIsMobile } from "@/hooks/useMobile";

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
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [location, navigate] = useLocation();
  const [isNavOpen, setIsNavOpen] = useState(false);
  const isMobile = useIsMobile();

  useKeyboardShortcuts(location, navigate);

  return (
    <div
      className="flex min-h-screen"
      style={{ background: "oklch(0.13 0.01 265)" }}
    >
      {isMobile ? (
        <>
          <header className="mobile-topbar">
            <button
              type="button"
              aria-label="Open navigation"
              onClick={() => setIsNavOpen(true)}
              className="icon-button"
            >
              <Menu size={18} />
            </button>
            <Link href="/">
              <span className="brand-mark">REPS_</span>
            </Link>
            <span className="topbar-code">OPNS-430</span>
          </header>
          <Sheet open={isNavOpen} onOpenChange={setIsNavOpen}>
            <SheetContent
              side="left"
              className="p-0"
              style={{
                width: 260,
                background: "oklch(0.15 0.012 265)",
                borderRight: "1px solid oklch(0.22 0.01 265)",
              }}
            >
              <SheetHeader
                style={{
                  padding: "20px 16px 12px",
                  borderBottom: "1px solid oklch(0.22 0.01 265)",
                }}
              >
                <SheetTitle>
                  <span className="brand-mark">REPS_</span>
                </SheetTitle>
                <div className="topbar-code">OPNS-430</div>
              </SheetHeader>
              <NavContent
                location={location}
                onNavigate={() => setIsNavOpen(false)}
              />
              <SidebarFooter />
            </SheetContent>
          </Sheet>
        </>
      ) : (
        <aside className="desktop-sidebar">
          <SidebarHeader />
          <NavContent location={location} />
          <SidebarFooter />
        </aside>
      )}

      <main className={`app-main ${isMobile ? "app-main-mobile" : ""}`}>
        {children}
      </main>
    </div>
  );
}

function SidebarHeader() {
  return (
    <div
      style={{
        padding: "20px 16px 16px",
        borderBottom: "1px solid oklch(0.22 0.01 265)",
      }}
    >
      <Link href="/">
        <span className="brand-mark">REPS_</span>
      </Link>
      <div className="topbar-code" style={{ marginTop: 2 }}>
        OPNS-430
      </div>
    </div>
  );
}

function NavContent({
  location,
  onNavigate,
}: {
  location: string;
  onNavigate?: () => void;
}) {
  return (
    <nav style={{ flex: 1, padding: "12px 8px", overflowY: "auto" }}>
      <div className="section-label" style={{ padding: "4px 8px 8px" }}>
        MODES
      </div>
      {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
        const isActive =
          path === "/" ? location === "/" : location.startsWith(path);
        return (
          <Link key={path} href={path} onClick={onNavigate}>
            <div className={`nav-item ${isActive ? "active" : ""}`}>
              <Icon size={15} strokeWidth={1.8} />
              <span>{label}</span>
            </div>
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarFooter() {
  return (
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
        v2.0 improved
      </div>
    </div>
  );
}
