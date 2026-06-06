/* ============================================================
   REPS — Dashboard  v2.1
   Mobile-first · Touch-optimised · Keyboard shortcuts
   ============================================================ */

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  Zap,
  Shuffle,
  AlertTriangle,
  Trophy,
  BookOpen,
  ChevronRight,
} from "lucide-react";
import {
  loadStore,
  getDueCards,
  getAccuracy,
  getOpenErrors,
  type RepsStore,
} from "@/lib/store";
import { CONTENT_ARCHETYPES as ARCHETYPES } from "@/lib/content/catalog";
import { useIsMobile } from "@/hooks/useMobile";

export default function Dashboard() {
  const [, navigate] = useLocation();
  const [store, setStore] = useState<RepsStore>(loadStore());
  const isMobile = useIsMobile();

  useEffect(() => {
    setStore(loadStore());
  }, []);

  const dueCards = getDueCards(store.cards);
  const todayReps = store.practiceAttempts.filter(
    a => a.timestamp > Date.now() - 86400000
  ).length;
  const openErrors = getOpenErrors(store.practiceAttempts, store.cards);

  // Keyboard shortcuts for Quick Actions (desktop only)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      switch (e.key.toLowerCase()) {
        case "r": e.preventDefault(); navigate("/router"); break;
        case "p": e.preventDefault(); navigate("/practice"); break;
        case "e": if (openErrors > 0) { e.preventDefault(); navigate("/review"); } break;
        case "m": e.preventDefault(); navigate("/mock"); break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate, openErrors]);

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const archetypeStats = ARCHETYPES.map(arch => ({
    arch,
    accuracy: getAccuracy(store.practiceAttempts, arch.id),
    attempts: store.practiceAttempts.filter(a => a.archetypeId === arch.id).length,
  })).sort((a, b) => {
    if (a.attempts === 0 && b.attempts === 0) return 0;
    if (a.attempts === 0) return 1;
    if (b.attempts === 0) return -1;
    return a.accuracy - b.accuracy;
  });

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ marginBottom: isMobile ? 20 : 28 }}>
        {/* Only show big REPS_ on desktop; mobile has it in the top bar */}
        {!isMobile && (
          <h1 style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 26,
            fontWeight: 700,
            color: "var(--foreground)",
            letterSpacing: "-0.02em",
            lineHeight: 1,
            marginBottom: 4,
          }}>
            REPS_
          </h1>
        )}
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11,
          color: "var(--muted-foreground)",
        }}>
          {dateStr}
        </div>
      </div>

      {/* ── Due cards banner ── */}
      {dueCards.length > 0 && (
        <button
          onClick={() => navigate("/practice")}
          className="btn-primary amber fade-in"
          style={{ width: "100%", marginBottom: 16, justifyContent: "space-between" }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Zap size={16} aria-hidden="true" />
            {dueCards.length} card{dueCards.length !== 1 ? "s" : ""} due — start practice
          </span>
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      )}

      {/* ── Stats row ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 10,
        marginBottom: 24,
      }}>
        <StatCard
          value={dueCards.length}
          label="Cards Due"
          sub={dueCards.length > 0 ? "Practice now" : "All caught up!"}
          accent={dueCards.length > 0}
        />
        <StatCard value={todayReps} label="Today's Reps" sub={todayReps > 0 ? "Keep going!" : "Start drilling"} />
        <StatCard
          value={openErrors}
          label="Open Errors"
          sub={openErrors > 0 ? "Patch queue" : "Clean slate"}
          danger={openErrors > 0}
        />
      </div>

      {/* ── Quick Actions ── */}
      <div style={{ marginBottom: 28 }}>
        <div className="section-label" style={{ marginBottom: 10 }}>QUICK ACTIONS</div>
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, auto)",
          gap: 8,
          justifyContent: isMobile ? undefined : "start",
        }}>
          <QuickAction
            icon={<Shuffle size={15} aria-hidden="true" />}
            label="5-min Router"
            shortcut="R"
            onClick={() => navigate("/router")}
            isMobile={isMobile}
          />
          <QuickAction
            icon={<Zap size={15} aria-hidden="true" />}
            label="10-q Practice"
            shortcut="P"
            onClick={() => navigate("/practice")}
            isMobile={isMobile}
          />
          <QuickAction
            icon={<AlertTriangle size={15} aria-hidden="true" />}
            label="Patch Errors"
            shortcut="E"
            onClick={() => navigate("/review")}
            disabled={openErrors === 0}
            isMobile={isMobile}
          />
          <QuickAction
            icon={<Trophy size={15} aria-hidden="true" />}
            label="Mock Scan"
            shortcut="M"
            onClick={() => navigate("/mock")}
            isMobile={isMobile}
          />
        </div>
      </div>

      {/* ── P0 Archetypes ── */}
      <div>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
          flexWrap: "wrap",
          gap: 8,
        }}>
          <div className="section-label">P0 ARCHETYPES</div>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, 1fr)",
          gap: 10,
        }}>
          {archetypeStats.map(({ arch, accuracy, attempts }) => (
            <ArchetypeCard
              key={arch.id}
              name={arch.shortName}
              accuracy={accuracy}
              attempts={attempts}
              status={arch.verificationStatus}
              onLearn={() => navigate(`/learn/${arch.id}`)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ value, label, sub, accent, danger }: {
  value: number; label: string; sub?: string; accent?: boolean; danger?: boolean;
}) {
  const valueColor = danger
    ? "var(--color-error)"
    : accent
      ? "var(--primary)"
      : "var(--foreground)";

  return (
    <div className="stat-card">
      <div className="stat-value" style={{ color: valueColor, fontSize: 24 }}>{value}</div>
      <div className="stat-label">{label}</div>
      {sub && (
        <div style={{
          fontFamily: "'IBM Plex Sans', sans-serif",
          fontSize: 11,
          color: "var(--muted-foreground)",
          marginTop: 3,
        }}>
          {sub}
        </div>
      )}
    </div>
  );
}

function QuickAction({ icon, label, shortcut, onClick, disabled, isMobile }: {
  icon: React.ReactNode; label: string; shortcut: string;
  onClick: () => void; disabled?: boolean; isMobile?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="btn-secondary"
      style={{
        justifyContent: isMobile ? "center" : "flex-start",
        opacity: disabled ? 0.45 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        minHeight: 48,
        flexDirection: isMobile ? "column" : "row",
        gap: isMobile ? 4 : 8,
        padding: isMobile ? "10px 8px" : "10px 14px",
        fontSize: 13,
      }}
    >
      {icon}
      <span style={{ fontWeight: 500 }}>{label}</span>
      {!isMobile && <span className="kbd-badge" style={{ marginLeft: "auto" }}>{shortcut}</span>}
    </button>
  );
}

function ArchetypeCard({ name, accuracy, attempts, status, onLearn }: {
  name: string; accuracy: number; attempts: number; status: string; onLearn: () => void;
}) {
  const accuracyColor =
    attempts === 0
      ? "var(--muted-foreground)"
      : accuracy >= 80
        ? "var(--color-correct)"
        : accuracy >= 60
          ? "var(--color-warn)"
          : "var(--color-error)";

  // Accuracy bar width
  const barWidth = attempts === 0 ? 0 : accuracy;

  return (
    <div
      className="card-interactive"
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 6,
        padding: 14,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      {/* Title row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 4 }}>
        <div style={{
          fontFamily: "'IBM Plex Sans', sans-serif",
          fontSize: 13,
          fontWeight: 600,
          color: "var(--foreground)",
          lineHeight: 1.3,
        }}>
          {name}
        </div>
        {status === "verified" && (
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 8,
            padding: "2px 5px",
            border: "1px solid var(--color-correct-border)",
            borderRadius: 2,
            color: "var(--color-correct)",
            background: "var(--color-correct-bg)",
            letterSpacing: "0.06em",
            flexShrink: 0,
          }}>
            ✓
          </span>
        )}
      </div>

      {/* Accuracy */}
      <div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 5, marginBottom: 4 }}>
          <span className="accuracy-display" style={{ color: accuracyColor, fontSize: 20 }}>
            {attempts === 0 ? "—" : `${accuracy}%`}
          </span>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9,
            color: "var(--muted-foreground)",
          }}>
            {attempts === 0 ? "no attempts" : `${attempts} reps`}
          </span>
        </div>
        {/* Accuracy bar */}
        <div style={{ height: 3, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
          <div style={{
            height: "100%",
            width: `${barWidth}%`,
            background: accuracyColor,
            borderRadius: 2,
            transition: "width 400ms ease-out",
          }} />
        </div>
      </div>

      {/* Learn button */}
      <button
        onClick={onLearn}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          padding: "6px 10px",
          background: "transparent",
          border: "1px solid var(--border)",
          borderRadius: 4,
          color: "var(--muted-foreground)",
          fontFamily: "'IBM Plex Sans', sans-serif",
          fontSize: 12,
          fontWeight: 500,
          cursor: "pointer",
          transition: "color 150ms, border-color 150ms",
          minHeight: 32,
          alignSelf: "flex-start",
        }}
        onMouseEnter={e => {
          e.currentTarget.style.color = "var(--foreground)";
          e.currentTarget.style.borderColor = "var(--foreground)";
        }}
        onMouseLeave={e => {
          e.currentTarget.style.color = "var(--muted-foreground)";
          e.currentTarget.style.borderColor = "var(--border)";
        }}
      >
        <BookOpen size={11} aria-hidden="true" />
        Learn
      </button>
    </div>
  );
}
