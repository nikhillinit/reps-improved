/* ============================================================
   REPS — Router Mode
   Terminal Precision: Rapid archetype identification drill
   ============================================================ */

import { useState, useRef } from "react";
import { useLocation } from "wouter";
import {
  Shuffle,
  CheckCircle2,
  XCircle,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { useHotkeys } from "@/hooks/useHotkeys";
import { ARCHETYPES, ARCHETYPE_MAP, ROUTER_STEMS } from "@/lib/archetypes";
import { loadStore, saveStore, type RouterAttempt } from "@/lib/store";
import { nanoid } from "nanoid";

type Phase = "setup" | "drill" | "result";

interface SessionState {
  stems: typeof ROUTER_STEMS;
  currentIdx: number;
  attempts: RouterAttempt[];
  startTime: number;
  stemStart: number;
}

export default function RouterMode() {
  const [, navigate] = useLocation();
  const [phase, setPhase] = useState<Phase>("setup");
  const [session, setSession] = useState<SessionState | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startSession = () => {
    const shuffled = [...ROUTER_STEMS]
      .sort(() => Math.random() - 0.5)
      .slice(0, 8);
    setSession({
      stems: shuffled,
      currentIdx: 0,
      attempts: [],
      startTime: Date.now(),
      stemStart: Date.now(),
    });
    setPhase("drill");
    setSelected(null);
    setShowFeedback(false);
  };

  const handleSelect = (archetypeId: string) => {
    if (showFeedback || !session) return;
    const stem = session.stems[session.currentIdx];
    const timeSpent = Date.now() - session.stemStart;
    const isCorrect = archetypeId === stem.correctId;
    const attempt: RouterAttempt = {
      id: nanoid(),
      stem: stem.stem,
      correctArchetypeId: stem.correctId,
      selectedArchetypeId: archetypeId,
      isCorrect,
      timestamp: Date.now(),
      timeSpent,
    };
    setSelected(archetypeId);
    setShowFeedback(true);
    setSession(s => (s ? { ...s, attempts: [...s.attempts, attempt] } : s));
  };

  const handleNext = () => {
    if (!session) return;
    if (session.currentIdx >= session.stems.length - 1) {
      // Save to store
      const store = loadStore();
      saveStore({
        ...store,
        routerAttempts: [...store.routerAttempts, ...session.attempts],
      });
      setPhase("result");
    } else {
      setSession(s =>
        s ? { ...s, currentIdx: s.currentIdx + 1, stemStart: Date.now() } : s
      );
      setSelected(null);
      setShowFeedback(false);
    }
  };

  const selectByIndex = (index: number) => {
    const archetypeId = ARCHETYPES[index]?.id;
    if (phase === "drill" && session && !showFeedback && archetypeId) {
      handleSelect(archetypeId);
    }
  };

  useHotkeys(
    {
      Enter: () => {
        if (phase === "drill" && showFeedback) handleNext();
      },
      ArrowRight: () => {
        if (phase === "drill" && showFeedback) handleNext();
      },
      "1": () => selectByIndex(0),
      "2": () => selectByIndex(1),
      "3": () => selectByIndex(2),
      "4": () => selectByIndex(3),
      "5": () => selectByIndex(4),
      "6": () => selectByIndex(5),
    },
    [phase, showFeedback, session]
  );

  if (phase === "setup") return <SetupScreen onStart={startSession} />;
  if (phase === "result" && session)
    return (
      <ResultScreen
        session={session}
        onRetry={startSession}
        onDone={() => navigate("/")}
      />
    );
  if (!session) return null;

  const stem = session.stems[session.currentIdx];
  const progress = (session.currentIdx / session.stems.length) * 100;
  const correctArch = ARCHETYPE_MAP[stem.correctId];
  const confuserIds = new Set(stem.confuserIds ?? []);
  if (selected && selected !== stem.correctId) confuserIds.add(selected);
  const confuserArches = Array.from(confuserIds)
    .map(id => ARCHETYPE_MAP[id])
    .filter(Boolean);

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Shuffle size={16} style={{ color: "oklch(0.78 0.17 65)" }} />
          <h1
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 18,
              fontWeight: 700,
              color: "oklch(0.91 0.005 265)",
            }}
          >
            Router
          </h1>
        </div>
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 12,
            color: "oklch(0.40 0.01 265)",
          }}
        >
          {session.currentIdx + 1} / {session.stems.length}
        </div>
      </div>

      {/* Progress bar */}
      <div
        style={{
          height: 3,
          background: "oklch(0.22 0.01 265)",
          borderRadius: 2,
          marginBottom: 28,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progress}%`,
            background: "oklch(0.78 0.17 65)",
            borderRadius: 2,
            transition: "width 300ms ease-out",
          }}
        />
      </div>

      {/* Stem */}
      <div
        style={{
          background: "oklch(0.17 0.012 265)",
          border: "1px solid oklch(0.28 0.01 265)",
          borderRadius: 4,
          padding: 24,
          marginBottom: 20,
        }}
      >
        <div className="section-label" style={{ marginBottom: 10 }}>
          IDENTIFY THE ARCHETYPE
        </div>
        <p
          style={{
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: 16,
            color: "oklch(0.88 0.005 265)",
            lineHeight: 1.75,
          }}
        >
          {stem.stem}
        </p>
      </div>

      {/* Choices */}
      <div className="responsive-grid" style={{ gap: 8, marginBottom: 20 }}>
        {ARCHETYPES.map((arch, i) => {
          const isSelected = selected === arch.id;
          const isCorrect = arch.id === stem.correctId;
          let borderColor = "oklch(0.28 0.01 265)";
          let bg = "oklch(0.17 0.012 265)";
          let textColor = "oklch(0.75 0.01 265)";
          if (showFeedback) {
            if (isCorrect) {
              borderColor = "oklch(0.72 0.14 185)";
              bg = "oklch(0.72 0.14 185 / 0.08)";
              textColor = "oklch(0.85 0.005 265)";
            } else if (isSelected && !isCorrect) {
              borderColor = "oklch(0.62 0.22 25)";
              bg = "oklch(0.62 0.22 25 / 0.08)";
              textColor = "oklch(0.85 0.005 265)";
            }
          } else if (isSelected) {
            borderColor = "oklch(0.78 0.17 65)";
            bg = "oklch(0.78 0.17 65 / 0.08)";
            textColor = "oklch(0.91 0.005 265)";
          }
          return (
            <button
              key={arch.id}
              onClick={() => handleSelect(arch.id)}
              disabled={showFeedback}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 16px",
                background: bg,
                border: `1px solid ${borderColor}`,
                borderRadius: 4,
                color: textColor,
                fontFamily: "'IBM Plex Sans', sans-serif",
                fontSize: 14,
                fontWeight: 500,
                cursor: showFeedback ? "default" : "pointer",
                textAlign: "left",
                transition: "all 150ms ease-out",
              }}
              onMouseEnter={e => {
                if (!showFeedback) {
                  e.currentTarget.style.borderColor =
                    "oklch(0.78 0.17 65 / 0.5)";
                  e.currentTarget.style.background =
                    "oklch(0.78 0.17 65 / 0.05)";
                }
              }}
              onMouseLeave={e => {
                if (!showFeedback && !isSelected) {
                  e.currentTarget.style.borderColor = "oklch(0.28 0.01 265)";
                  e.currentTarget.style.background = "oklch(0.17 0.012 265)";
                }
              }}
            >
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  color: "oklch(0.35 0.01 265)",
                  minWidth: 16,
                }}
              >
                {i + 1}
              </span>
              <span style={{ flex: 1 }}>{arch.shortName}</span>
              {showFeedback && isCorrect && (
                <CheckCircle2
                  size={14}
                  style={{ color: "oklch(0.72 0.14 185)", flexShrink: 0 }}
                />
              )}
              {showFeedback && isSelected && !isCorrect && (
                <XCircle
                  size={14}
                  style={{ color: "oklch(0.62 0.22 25)", flexShrink: 0 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {showFeedback && correctArch && (
        <div
          style={{
            background: "oklch(0.17 0.012 265)",
            border: "1px solid oklch(0.28 0.01 265)",
            borderLeft: "3px solid oklch(0.78 0.17 65)",
            borderRadius: "0 4px 4px 0",
            padding: 18,
            marginBottom: 16,
          }}
        >
          <div
            className="section-label"
            style={{ marginBottom: 12, color: "oklch(0.78 0.17 65)" }}
          >
            WHY THIS BUCKET
          </div>
          <div
            className="responsive-grid"
            style={{ gap: 10, marginBottom: confuserArches.length ? 14 : 0 }}
          >
            <RouterFeedbackFact
              label="Derived condition"
              value={correctArch.derivedCondition}
            />
            <RouterFeedbackFact label="First formula" value={correctArch.formula} />
            <RouterFeedbackFact
              label="Top trap"
              value={correctArch.trapNotes[0] ?? "Check units and scope."}
            />
          </div>
          {confuserArches.length > 0 && (
            <div>
              <div className="section-label" style={{ marginBottom: 8 }}>
                WHY NOT THE CONFUSER
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {confuserArches.map(confuser => (
                  <div
                    key={confuser.id}
                    style={{
                      padding: "9px 12px",
                      background: "oklch(0.13 0.01 265)",
                      border: "1px solid oklch(0.28 0.01 265)",
                      borderRadius: 3,
                      fontFamily: "'IBM Plex Sans', sans-serif",
                      fontSize: 13,
                      color: "oklch(0.66 0.01 265)",
                      lineHeight: 1.55,
                    }}
                  >
                    <strong style={{ color: "oklch(0.82 0.005 265)" }}>
                      Not {confuser.shortName}:
                    </strong>{" "}
                    that bucket requires {confuser.derivedCondition}. This stem
                    points to {correctArch.derivedCondition}.
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Feedback + Next */}
      {showFeedback && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {selected === stem.correctId ? (
              <>
                <CheckCircle2
                  size={16}
                  style={{ color: "oklch(0.72 0.14 185)" }}
                />
                <span
                  style={{
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    fontSize: 14,
                    color: "oklch(0.72 0.14 185)",
                    fontWeight: 600,
                  }}
                >
                  Correct!
                </span>
              </>
            ) : (
              <>
                <XCircle size={16} style={{ color: "oklch(0.62 0.22 25)" }} />
                <span
                  style={{
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    fontSize: 14,
                    color: "oklch(0.62 0.22 25)",
                    fontWeight: 600,
                  }}
                >
                  Incorrect —{" "}
                  {ARCHETYPES.find(a => a.id === stem.correctId)?.shortName}
                </span>
              </>
            )}
          </div>
          <button
            onClick={handleNext}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 18px",
              background: "oklch(0.78 0.17 65)",
              border: "none",
              borderRadius: 4,
              color: "oklch(0.13 0.01 265)",
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
            onMouseEnter={e =>
              (e.currentTarget.style.background = "oklch(0.65 0.14 65)")
            }
            onMouseLeave={e =>
              (e.currentTarget.style.background = "oklch(0.78 0.17 65)")
            }
          >
            {session.currentIdx >= session.stems.length - 1
              ? "See Results"
              : "Next"}{" "}
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

function RouterFeedbackFact({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        background: "oklch(0.13 0.01 265)",
        border: "1px solid oklch(0.28 0.01 265)",
        borderRadius: 3,
        padding: "10px 12px",
        minHeight: 78,
      }}
    >
      <div className="section-label" style={{ marginBottom: 6 }}>
        {label}
      </div>
      <div
        style={{
          fontFamily: "'IBM Plex Sans', sans-serif",
          fontSize: 13,
          color: "oklch(0.70 0.01 265)",
          lineHeight: 1.55,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function SetupScreen({ onStart }: { onStart: () => void }) {
  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 22,
            fontWeight: 700,
            color: "oklch(0.91 0.005 265)",
            marginBottom: 8,
          }}
        >
          Router Mode
        </h1>
        <p
          style={{
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: 14,
            color: "oklch(0.55 0.01 265)",
          }}
        >
          8 randomized stems. Identify the correct archetype for each. No hints
          — pure pattern recognition.
        </p>
      </div>
      <div
        style={{
          background: "oklch(0.17 0.012 265)",
          border: "1px solid oklch(0.28 0.01 265)",
          borderRadius: 4,
          padding: 20,
          marginBottom: 24,
        }}
      >
        <div className="section-label" style={{ marginBottom: 12 }}>
          ARCHETYPES IN SCOPE
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {ARCHETYPES.map(a => (
            <span key={a.id} className="trigger-chip">
              {a.shortName}
            </span>
          ))}
        </div>
      </div>
      <button
        onClick={onStart}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "12px 24px",
          background: "oklch(0.78 0.17 65)",
          border: "none",
          borderRadius: 4,
          color: "oklch(0.13 0.01 265)",
          fontFamily: "'IBM Plex Sans', sans-serif",
          fontSize: 14,
          fontWeight: 700,
          cursor: "pointer",
        }}
        onMouseEnter={e =>
          (e.currentTarget.style.background = "oklch(0.65 0.14 65)")
        }
        onMouseLeave={e =>
          (e.currentTarget.style.background = "oklch(0.78 0.17 65)")
        }
      >
        <Shuffle size={16} />
        Start Router Session
      </button>
    </div>
  );
}

function ResultScreen({
  session,
  onRetry,
  onDone,
}: {
  session: SessionState;
  onRetry: () => void;
  onDone: () => void;
}) {
  const correct = session.attempts.filter(a => a.isCorrect).length;
  const total = session.attempts.length;
  const pct = Math.round((correct / total) * 100);
  const avgTime = Math.round(
    session.attempts.reduce((s, a) => s + (a.timeSpent || 0), 0) / total / 1000
  );

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 22,
            fontWeight: 700,
            color: "oklch(0.91 0.005 265)",
            marginBottom: 4,
          }}
        >
          Session Complete
        </h1>
      </div>
      <div className="grid grid-cols-1 gap-3 mb-7 md:grid-cols-3">
        <StatCard
          value={`${pct}%`}
          label="Accuracy"
          danger={pct < 60}
          accent={pct >= 80}
        />
        <StatCard value={`${correct}/${total}`} label="Correct" />
        <StatCard value={`${avgTime}s`} label="Avg Time" />
      </div>
      <div
        style={{
          background: "oklch(0.17 0.012 265)",
          border: "1px solid oklch(0.28 0.01 265)",
          borderRadius: 4,
          padding: 16,
          marginBottom: 24,
        }}
      >
        <div className="section-label" style={{ marginBottom: 12 }}>
          REVIEW
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {session.attempts.map((a, i) => (
            <div
              key={a.id}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                padding: "8px 12px",
                background: "oklch(0.13 0.01 265)",
                borderRadius: 3,
                border: `1px solid ${a.isCorrect ? "oklch(0.72 0.14 185 / 0.2)" : "oklch(0.62 0.22 25 / 0.2)"}`,
              }}
            >
              {a.isCorrect ? (
                <CheckCircle2
                  size={14}
                  style={{
                    color: "oklch(0.72 0.14 185)",
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                />
              ) : (
                <XCircle
                  size={14}
                  style={{
                    color: "oklch(0.62 0.22 25)",
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    fontSize: 12,
                    color: "oklch(0.65 0.01 265)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {a.stem.slice(0, 80)}…
                </div>
                {!a.isCorrect && (
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 11,
                      color: "oklch(0.62 0.22 25)",
                      marginTop: 2,
                    }}
                  >
                    You:{" "}
                    {
                      ARCHETYPES.find(x => x.id === a.selectedArchetypeId)
                        ?.shortName
                    }{" "}
                    → Correct:{" "}
                    {
                      ARCHETYPES.find(x => x.id === a.correctArchetypeId)
                        ?.shortName
                    }
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={onRetry}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "10px 20px",
            background: "oklch(0.78 0.17 65)",
            border: "none",
            borderRadius: 4,
            color: "oklch(0.13 0.01 265)",
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
          onMouseEnter={e =>
            (e.currentTarget.style.background = "oklch(0.65 0.14 65)")
          }
          onMouseLeave={e =>
            (e.currentTarget.style.background = "oklch(0.78 0.17 65)")
          }
        >
          <RotateCcw size={14} />
          Retry
        </button>
        <button
          onClick={onDone}
          style={{
            padding: "10px 20px",
            background: "transparent",
            border: "1px solid oklch(0.28 0.01 265)",
            borderRadius: 4,
            color: "oklch(0.55 0.01 265)",
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          Dashboard
        </button>
      </div>
    </div>
  );
}
