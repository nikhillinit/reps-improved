/* ============================================================
   REPS — Dashboard
   Terminal Precision: Stats + P0 archetypes + quick actions
   ============================================================ */

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  Zap,
  Shuffle,
  AlertTriangle,
  Trophy,
  BookOpen,
  TrendingUp,
} from "lucide-react";
import {
  loadStore,
  getDueCards,
  getAccuracy,
  getOpenErrors,
  type RepsStore,
} from "@/lib/store";
import { CONTENT_ARCHETYPES as ARCHETYPES } from "@/lib/content/catalog";

export default function Dashboard() {
  const [, navigate] = useLocation();
  const [store, setStore] = useState<RepsStore>(loadStore());

  useEffect(() => {
    setStore(loadStore());
  }, []);

  const dueCards = getDueCards(store.cards);
  const todayReps = store.practiceAttempts.filter(
    a => a.timestamp > Date.now() - 86400000
  ).length;
  const openErrors = getOpenErrors(store.practiceAttempts, store.cards);

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  // Sort archetypes by accuracy ascending (weakest first)
  const archetypeStats = ARCHETYPES.map(arch => ({
    arch,
    accuracy: getAccuracy(store.practiceAttempts, arch.id),
    attempts: store.practiceAttempts.filter(a => a.archetypeId === arch.id)
      .length,
  })).sort((a, b) => {
    if (a.attempts === 0 && b.attempts === 0) return 0;
    if (a.attempts === 0) return 1;
    if (b.attempts === 0) return -1;
    return a.accuracy - b.accuracy;
  });

  const weakest = archetypeStats.filter(s => s.attempts > 0).slice(0, 3);

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 32,
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 28,
              fontWeight: 700,
              color: "oklch(0.21 0 0)",
              letterSpacing: "-0.02em",
              lineHeight: 1,
            }}
          >
            REPS_
          </h1>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 12,
              color: "oklch(0.51 0 0)",
              marginTop: 4,
            }}
          >
            {dateStr}
          </div>
        </div>

        {/* Due cards CTA */}
        {dueCards.length > 0 && (
          <button
            onClick={() => navigate("/practice")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 20px",
              background: "oklch(0.21 0 0)",
              color: "oklch(1 0 0)",
              border: "none",
              borderRadius: 4,
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              transition: "background 150ms ease-out, transform 80ms ease-out",
            }}
            onMouseEnter={e =>
              (e.currentTarget.style.background = "oklch(0.14 0 0)")
            }
            onMouseLeave={e =>
              (e.currentTarget.style.background = "oklch(0.21 0 0)")
            }
            onMouseDown={e => (e.currentTarget.style.transform = "scale(0.97)")}
            onMouseUp={e => (e.currentTarget.style.transform = "scale(1)")}
          >
            <Zap size={16} />
            Start Practice
          </button>
        )}
      </div>

      {/* Stats row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
          marginBottom: 32,
        }}
      >
        <StatCard
          value={dueCards.length}
          label="Cards Due"
          accent={dueCards.length > 0}
          sub={
            dueCards.length > 0 ? "Start your session now" : "All caught up!"
          }
        />
        <StatCard value={todayReps} label="Today's Reps" />
        <StatCard
          value={openErrors}
          label="Open Errors"
          danger={openErrors > 0}
          sub={openErrors > 0 ? "Patch queue has items" : "No open errors"}
        />
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: 32 }}>
        <div className="section-label" style={{ marginBottom: 12 }}>
          QUICK ACTIONS
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <QuickAction
            icon={<Shuffle size={14} />}
            label="5-min Router"
            shortcut="R"
            onClick={() => navigate("/router")}
          />
          <QuickAction
            icon={<Zap size={14} />}
            label="10-q Practice"
            shortcut="P"
            onClick={() => navigate("/practice")}
          />
          <QuickAction
            icon={<AlertTriangle size={14} />}
            label="Patch Errors"
            shortcut="E"
            onClick={() => navigate("/review")}
            disabled={openErrors === 0}
          />
          <QuickAction
            icon={<Trophy size={14} />}
            label="Mock Scan"
            shortcut="M"
            onClick={() => navigate("/mock")}
          />
        </div>
      </div>

      {/* P0 Archetypes */}
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <div className="section-label">P0 ARCHETYPES</div>
          {weakest.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  color: "oklch(0.51 0 0)",
                }}
              >
                WEAKEST:
              </span>
              {weakest.map(s => (
                <span
                  key={s.arch.id}
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 10,
                    padding: "2px 6px",
                    border: "1px solid oklch(0.38 0.20 22 / 0.28)",
                    borderRadius: 3,
                    color: "oklch(0.38 0.20 22)",
                    background: "oklch(0.38 0.20 22 / 0.08)",
                  }}
                >
                  {s.arch.shortName}
                </span>
              ))}
            </div>
          )}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 10,
          }}
        >
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

function StatCard({
  value,
  label,
  sub,
  accent,
  danger,
}: {
  value: number;
  label: string;
  sub?: string;
  accent?: boolean;
  danger?: boolean;
}) {
  const valueColor = danger
    ? "oklch(0.38 0.20 22)"
    : accent
      ? "oklch(0.21 0 0)"
      : "oklch(0.21 0 0)";

  return (
    <div className="stat-card">
      <div className="stat-value" style={{ color: valueColor }}>
        {value}
      </div>
      <div className="stat-label">{label}</div>
      {sub && (
        <div
          style={{
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: 12,
            color: "oklch(0.51 0 0)",
            marginTop: 4,
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

function QuickAction({
  icon,
  label,
  shortcut,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  shortcut: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 14px",
        background: "oklch(1 0 0)",
        border: "1px solid oklch(0.90 0.013 78)",
        borderRadius: 4,
        color: disabled ? "oklch(0.69 0 0)" : "oklch(0.21 0 0)",
        fontFamily: "'Inter', system-ui, sans-serif",
        fontSize: 13,
        fontWeight: 500,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "border-color 150ms ease-out, background 150ms ease-out",
        opacity: disabled ? 0.5 : 1,
      }}
      onMouseEnter={e => {
        if (!disabled) {
          e.currentTarget.style.borderColor = "oklch(0.21 0 0 / 0.28)";
          e.currentTarget.style.background = "oklch(0.21 0 0 / 0.06)";
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = "oklch(0.90 0.013 78)";
        e.currentTarget.style.background = "oklch(1 0 0)";
      }}
    >
      {icon}
      <span>› {label}</span>
      <span className="kbd-badge">{shortcut}</span>
    </button>
  );
}

function ArchetypeCard({
  name,
  accuracy,
  attempts,
  status,
  onLearn,
}: {
  name: string;
  accuracy: number;
  attempts: number;
  status: string;
  onLearn: () => void;
}) {
  const accuracyColor =
    attempts === 0
      ? "oklch(0.51 0 0)"
      : accuracy >= 80
        ? "oklch(0.44 0.15 150)"
        : accuracy >= 60
          ? "oklch(0.48 0.16 68)"
          : "oklch(0.38 0.20 22)";

  return (
    <div
      className="card-interactive"
      style={{
        background: "oklch(1 0 0)",
        border: "1px solid oklch(0.90 0.013 78)",
        borderRadius: 4,
        padding: "16px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <div
          style={{
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: 13,
            fontWeight: 600,
            color: "oklch(0.21 0 0)",
          }}
        >
          {name}
        </div>
        {status === "verified" && (
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9,
              padding: "2px 5px",
              border: "1px solid oklch(0.44 0.15 150 / 0.22)",
              borderRadius: 2,
              color: "oklch(0.44 0.15 150)",
              background: "oklch(0.44 0.15 150 / 0.10)",
              letterSpacing: "0.06em",
            }}
          >
            VERIFIED
          </span>
        )}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 6,
          marginBottom: 4,
        }}
      >
        <span
          className="accuracy-display"
          style={{ color: accuracyColor, fontSize: 24 }}
        >
          {attempts === 0 ? "—" : `${accuracy}%`}
        </span>
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            color: "oklch(0.51 0 0)",
          }}
        >
          {attempts === 0 ? "no attempts" : "accuracy"}
        </span>
      </div>

      <button
        onClick={onLearn}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "5px 10px",
          background: "transparent",
          border: "1px solid oklch(0.90 0.013 78)",
          borderRadius: 3,
          color: "oklch(0.28 0 0)",
          fontFamily: "'Inter', system-ui, sans-serif",
          fontSize: 11,
          fontWeight: 500,
          cursor: "pointer",
          transition: "color 150ms, border-color 150ms",
          marginTop: 8,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.color = "oklch(0.21 0 0)";
          e.currentTarget.style.borderColor = "oklch(0.21 0 0 / 0.22)";
        }}
        onMouseLeave={e => {
          e.currentTarget.style.color = "oklch(0.28 0 0)";
          e.currentTarget.style.borderColor = "oklch(0.90 0.013 78)";
        }}
      >
        <BookOpen size={11} />
        Learn
      </button>
    </div>
  );
}
