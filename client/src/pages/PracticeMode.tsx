/* ============================================================
   REPS — Practice Mode
   Terminal Precision: SRS-based practice with rating + root causes
   ============================================================ */

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  Zap,
  CheckCircle2,
  XCircle,
  MinusCircle,
  ChevronRight,
  Eye,
} from "lucide-react";
import {
  CONTENT_ARCHETYPES as ARCHETYPES,
  CONTENT_ARCHETYPE_MAP as ARCHETYPE_MAP,
  CONTENT_PRACTICE_ITEMS_BY_ARCHETYPE,
  isEligibleArchetypeId,
} from "@/lib/content/catalog";
import {
  loadStore,
  saveStore,
  scheduleCard,
  type PracticeAttempt,
  type Card,
  type Rating,
} from "@/lib/store";
import { nanoid } from "nanoid";

type Phase = "setup" | "drill" | "result";

interface DrillCard {
  card: Card;
  stemIdx: number;
}

export default function PracticeMode() {
  const [, navigate] = useLocation();
  const [phase, setPhase] = useState<Phase>("setup");
  const [queue, setQueue] = useState<DrillCard[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [attempts, setAttempts] = useState<PracticeAttempt[]>([]);
  const [selectedRootCauses, setSelectedRootCauses] = useState<string[]>([]);
  const [startTime, setStartTime] = useState(Date.now());

  const startSession = (count: number) => {
    const store = loadStore();
    let cards = store.cards.filter(
      c => c.dueAt <= Date.now() && isEligibleArchetypeId(c.archetypeId)
    );
    // If no due cards, create cards for all archetypes
    if (cards.length === 0) {
      const newCards: Card[] = ARCHETYPES.map(arch => ({
        id: nanoid(),
        archetypeId: arch.id,
        cardType: "practice" as const,
        dueAt: Date.now(),
        interval: 1,
        easeFactor: 2.5,
        reps: 0,
        lapses: 0,
        verificationStatus: arch.verificationStatus,
      }));
      const updated = { ...store, cards: [...store.cards, ...newCards] };
      saveStore(updated);
      cards = newCards;
    }
    const shuffled = cards.sort(() => Math.random() - 0.5).slice(0, count);
    const drillQueue: DrillCard[] = shuffled.map(card => {
      const stems = CONTENT_PRACTICE_ITEMS_BY_ARCHETYPE[card.archetypeId] ?? [];
      const stemIdx = Math.floor(Math.random() * (stems.length || 1));
      return { card, stemIdx };
    });
    setQueue(drillQueue);
    setCurrentIdx(0);
    setAttempts([]);
    setRevealed(false);
    setSelectedRootCauses([]);
    setStartTime(Date.now());
    setPhase("drill");
  };

  const handleReveal = () => setRevealed(true);

  const handleRate = (rating: Rating) => {
    if (!queue[currentIdx]) return;
    const { card } = queue[currentIdx];
    const stems = CONTENT_PRACTICE_ITEMS_BY_ARCHETYPE[card.archetypeId] ?? [];
    const stem = stems[queue[currentIdx].stemIdx] ?? stems[0];
    const attempt: PracticeAttempt = {
      id: nanoid(),
      archetypeId: card.archetypeId,
      stemId: stem?.id,
      rating,
      rootCauseIds: rating !== "correct" ? selectedRootCauses : [],
      timestamp: Date.now(),
      mode: "practice",
      timeSpent: Date.now() - startTime,
    };
    const updatedCard = scheduleCard(card, rating);
    const store = loadStore();
    const updatedCards = store.cards.map(c =>
      c.id === card.id ? updatedCard : c
    );
    saveStore({
      ...store,
      cards: updatedCards,
      practiceAttempts: [...store.practiceAttempts, attempt],
    });
    const newAttempts = [...attempts, attempt];
    setAttempts(newAttempts);
    if (currentIdx >= queue.length - 1) {
      setPhase("result");
    } else {
      setCurrentIdx(i => i + 1);
      setRevealed(false);
      setSelectedRootCauses([]);
      setStartTime(Date.now());
    }
  };

  if (phase === "setup") return <SetupScreen onStart={startSession} />;
  if (phase === "result")
    return (
      <ResultScreen
        attempts={attempts}
        onRetry={() => startSession(queue.length)}
        onDone={() => navigate("/")}
      />
    );
  if (!queue[currentIdx]) return null;

  const { card, stemIdx } = queue[currentIdx];
  const arch = ARCHETYPE_MAP[card.archetypeId];
  const stems = CONTENT_PRACTICE_ITEMS_BY_ARCHETYPE[card.archetypeId] ?? [];
  const stem = stems[stemIdx] || stems[0];
  const progress = (currentIdx / queue.length) * 100;

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
          <Zap size={16} style={{ color: "oklch(0.78 0.17 65)" }} />
          <h1
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 18,
              fontWeight: 700,
              color: "oklch(0.91 0.005 265)",
            }}
          >
            Practice
          </h1>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 12,
              color: "oklch(0.40 0.01 265)",
              padding: "2px 8px",
              border: "1px solid oklch(0.28 0.01 265)",
              borderRadius: 3,
            }}
          >
            {arch?.shortName}
          </span>
        </div>
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 12,
            color: "oklch(0.40 0.01 265)",
          }}
        >
          {currentIdx + 1} / {queue.length}
        </div>
      </div>

      {/* Progress */}
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
          marginBottom: 16,
        }}
      >
        <div className="section-label" style={{ marginBottom: 10 }}>
          PROBLEM
        </div>
        <p
          style={{
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: 16,
            color: "oklch(0.88 0.005 265)",
            lineHeight: 1.75,
          }}
        >
          {stem?.text || "No stem available."}
        </p>
      </div>

      {/* Reveal / Answer */}
      {!revealed ? (
        <button
          onClick={handleReveal}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 18px",
            background: "transparent",
            border: "1px solid oklch(0.35 0.01 265)",
            borderRadius: 4,
            color: "oklch(0.55 0.01 265)",
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: 13,
            cursor: "pointer",
            marginBottom: 20,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = "oklch(0.78 0.17 65 / 0.5)";
            e.currentTarget.style.color = "oklch(0.78 0.17 65)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = "oklch(0.35 0.01 265)";
            e.currentTarget.style.color = "oklch(0.55 0.01 265)";
          }}
        >
          <Eye size={14} />
          Reveal Answer{" "}
          <span className="kbd-badge" style={{ marginLeft: 4 }}>
            Space
          </span>
        </button>
      ) : (
        <div>
          <div
            style={{
              background: "oklch(0.17 0.012 265)",
              border: "1px solid oklch(0.72 0.14 185 / 0.3)",
              borderLeft: "3px solid oklch(0.72 0.14 185)",
              borderRadius: "0 4px 4px 0",
              padding: 20,
              marginBottom: 16,
            }}
          >
            <div
              className="section-label"
              style={{ marginBottom: 8, color: "oklch(0.72 0.14 185)" }}
            >
              ANSWER
            </div>
            <div
              className="formula-display"
              style={{
                marginBottom: 10,
                borderLeftColor: "oklch(0.72 0.14 185)",
              }}
            >
              {stem?.answer}
            </div>
            <p
              style={{
                fontFamily: "'IBM Plex Sans', sans-serif",
                fontSize: 13,
                color: "oklch(0.60 0.01 265)",
              }}
            >
              {stem?.explanation}
            </p>
          </div>

          {/* Root causes (shown for incorrect/partial) */}
          <div
            style={{
              background: "oklch(0.17 0.012 265)",
              border: "1px solid oklch(0.28 0.01 265)",
              borderRadius: 4,
              padding: 16,
              marginBottom: 16,
            }}
          >
            <div className="section-label" style={{ marginBottom: 10 }}>
              RATE YOUR ATTEMPT
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <RateButton
                icon={<CheckCircle2 size={14} />}
                label="Correct"
                color="oklch(0.72 0.14 185)"
                onClick={() => handleRate("correct")}
              />
              <RateButton
                icon={<MinusCircle size={14} />}
                label="Partial"
                color="oklch(0.78 0.17 65)"
                onClick={() => handleRate("partial")}
              />
              <RateButton
                icon={<XCircle size={14} />}
                label="Incorrect"
                color="oklch(0.62 0.22 25)"
                onClick={() => handleRate("incorrect")}
              />
            </div>
            {arch?.rootCauses && (
              <div>
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 10,
                    color: "oklch(0.40 0.01 265)",
                    letterSpacing: "0.08em",
                    marginBottom: 8,
                  }}
                >
                  ROOT CAUSE (optional)
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {(
                    arch.rootCauses as Array<{ id: string; label: string }>
                  ).map(rc => {
                    const isSelected = selectedRootCauses.includes(rc.id);
                    return (
                      <button
                        key={rc.id}
                        onClick={() =>
                          setSelectedRootCauses(prev =>
                            isSelected
                              ? prev.filter(x => x !== rc.id)
                              : [...prev, rc.id]
                          )
                        }
                        style={{
                          padding: "4px 10px",
                          background: isSelected
                            ? "oklch(0.62 0.22 25 / 0.15)"
                            : "transparent",
                          border: `1px solid ${isSelected ? "oklch(0.62 0.22 25 / 0.5)" : "oklch(0.28 0.01 265)"}`,
                          borderRadius: 3,
                          color: isSelected
                            ? "oklch(0.62 0.22 25)"
                            : "oklch(0.45 0.01 265)",
                          fontFamily: "'IBM Plex Sans', sans-serif",
                          fontSize: 12,
                          cursor: "pointer",
                          transition: "all 150ms",
                        }}
                      >
                        {rc.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function RateButton({
  icon,
  label,
  color,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "8px 16px",
        background: `${color} / 0.1`,
        border: `1px solid ${color} / 0.4`,
        borderRadius: 4,
        color,
        fontFamily: "'IBM Plex Sans', sans-serif",
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
        transition: "all 150ms",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = `${color}`;
        e.currentTarget.style.color = "oklch(0.13 0.01 265)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = `${color} / 0.1`;
        e.currentTarget.style.color = color;
      }}
    >
      {icon}
      {label}
    </button>
  );
}

function SetupScreen({ onStart }: { onStart: (count: number) => void }) {
  const [count, setCount] = useState(10);
  const store = loadStore();
  const dueCount = store.cards.filter(c => c.dueAt <= Date.now()).length;
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
          Practice Mode
        </h1>
        <p
          style={{
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: 14,
            color: "oklch(0.55 0.01 265)",
          }}
        >
          SRS-based practice. Reveal the answer, rate yourself, log root causes
          for misses.
        </p>
      </div>
      <div
        style={{
          background: "oklch(0.17 0.012 265)",
          border: "1px solid oklch(0.28 0.01 265)",
          borderRadius: 4,
          padding: 20,
          marginBottom: 20,
        }}
      >
        <div className="section-label" style={{ marginBottom: 12 }}>
          SESSION SIZE
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {[5, 10, 15, 20].map(n => (
            <button
              key={n}
              onClick={() => setCount(n)}
              style={{
                padding: "8px 16px",
                background: count === n ? "oklch(0.78 0.17 65)" : "transparent",
                border: `1px solid ${count === n ? "oklch(0.78 0.17 65)" : "oklch(0.28 0.01 265)"}`,
                borderRadius: 4,
                color:
                  count === n ? "oklch(0.13 0.01 265)" : "oklch(0.55 0.01 265)",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {n}
            </button>
          ))}
        </div>
        {dueCount > 0 && (
          <div
            style={{
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontSize: 12,
              color: "oklch(0.72 0.14 185)",
              marginTop: 10,
            }}
          >
            ✓ {dueCount} cards due today
          </div>
        )}
      </div>
      <button
        onClick={() => onStart(count)}
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
        <Zap size={16} />
        Start Practice
      </button>
    </div>
  );
}

function ResultScreen({
  attempts,
  onRetry,
  onDone,
}: {
  attempts: PracticeAttempt[];
  onRetry: () => void;
  onDone: () => void;
}) {
  const correct = attempts.filter(a => a.rating === "correct").length;
  const partial = attempts.filter(a => a.rating === "partial").length;
  const incorrect = attempts.filter(a => a.rating === "incorrect").length;
  const pct =
    attempts.length > 0 ? Math.round((correct / attempts.length) * 100) : 0;
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
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <div className="stat-card">
          <div
            className="stat-value"
            style={{
              color: pct >= 80 ? "oklch(0.72 0.14 185)" : "oklch(0.78 0.17 65)",
            }}
          >
            {pct}%
          </div>
          <div className="stat-label">Accuracy</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: "oklch(0.72 0.14 185)" }}>
            {correct}
          </div>
          <div className="stat-label">Correct</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: "oklch(0.78 0.17 65)" }}>
            {partial}
          </div>
          <div className="stat-label">Partial</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: "oklch(0.62 0.22 25)" }}>
            {incorrect}
          </div>
          <div className="stat-label">Incorrect</div>
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
        >
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
