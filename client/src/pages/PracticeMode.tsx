/* ============================================================
   REPS — Practice Mode
   Terminal Precision: SRS-based practice with rating + root causes
   ============================================================ */

import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
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
  CONTENT_PRACTICE_ITEM_MAP,
  CONTENT_PRACTICE_ITEMS_BY_ARCHETYPE,
  isEligibleArchetypeId,
} from "@/lib/content/catalog";
import {
  getDuePatchItems,
  getOpenErrorItems,
  getPracticeQueueItems,
  loadStore,
  saveStore,
  scheduleCard,
  type Card,
  type PracticeAttempt,
  type PracticeQueuePriority,
  type Rating,
  type RepsStore,
} from "@/lib/store";
import { nanoid } from "nanoid";

type Phase = "setup" | "drill" | "result";

interface DrillCard {
  card: Card;
  stemIdx: number;
  priority: PracticeQueuePriority;
}

interface PracticeTarget {
  archetypeId: string;
  problemItemId?: string;
}

const COVERAGE_DELAY_MS = 24 * 60 * 60 * 1000;

function createPracticeCard(
  archetypeId: string,
  now: number,
  options: { problemItemId?: string; dueAt?: number } = {}
): Card | undefined {
  const arch = ARCHETYPE_MAP[archetypeId];
  if (!arch) return undefined;

  const dueAt = options.dueAt ?? now + COVERAGE_DELAY_MS;
  return {
    id: nanoid(),
    archetypeId,
    ...(options.problemItemId ? { problemItemId: options.problemItemId } : {}),
    cardType: "practice",
    dueAt,
    interval: Math.max(0, (dueAt - now) / COVERAGE_DELAY_MS),
    easeFactor: 2.5,
    reps: 0,
    lapses: 0,
    verificationStatus: arch.verificationStatus,
  };
}

function hasPracticeCard(
  cards: Card[],
  archetypeId: string,
  problemItemId?: string
): boolean {
  return cards.some(
    card =>
      card.cardType === "practice" &&
      card.archetypeId === archetypeId &&
      (problemItemId ? card.problemItemId === problemItemId : true)
  );
}

function ensurePracticeCards(
  store: RepsStore,
  now: number,
  target?: PracticeTarget
): RepsStore {
  const openItems = getOpenErrorItems(store);
  const remediationCards = openItems
    .filter(
      item =>
        item.problemItemId &&
        !hasPracticeCard(store.cards, item.archetypeId, item.problemItemId)
    )
    .map(item =>
      createPracticeCard(item.archetypeId, now, {
        problemItemId: item.problemItemId,
        dueAt: item.dueAt,
      })
    )
    .filter((card): card is Card => Boolean(card));

  const cardsAfterRemediation = [...store.cards, ...remediationCards];
  const targetCard =
    target &&
    !hasPracticeCard(
      cardsAfterRemediation,
      target.archetypeId,
      target.problemItemId
    )
      ? createPracticeCard(target.archetypeId, now, {
          problemItemId: target.problemItemId,
          dueAt: now,
        })
      : undefined;

  const existingCards = [
    ...cardsAfterRemediation,
    ...(targetCard ? [targetCard] : []),
  ];
  const representedArchetypes = new Set(
    existingCards
      .filter(card => card.cardType === "practice")
      .map(card => card.archetypeId)
  );
  const coverageCards = ARCHETYPES.filter(
    arch => !representedArchetypes.has(arch.id)
  )
    .map(arch => createPracticeCard(arch.id, now))
    .filter((card): card is Card => Boolean(card));

  const cardsToAdd = [
    ...remediationCards,
    ...(targetCard ? [targetCard] : []),
    ...coverageCards,
  ];
  if (cardsToAdd.length === 0) return store;

  const updated = { ...store, cards: [...store.cards, ...cardsToAdd] };
  saveStore(updated);
  return updated;
}

function stemIndexForQueueItem(card: Card, problemItemId?: string): number {
  const stems = CONTENT_PRACTICE_ITEMS_BY_ARCHETYPE[card.archetypeId] ?? [];
  const requestedProblemItemId = problemItemId ?? card.problemItemId;
  if (requestedProblemItemId) {
    const exactIndex = stems.findIndex(
      stem => stem.id === requestedProblemItemId
    );
    if (exactIndex >= 0) return exactIndex;
  }
  return Math.floor(Math.random() * (stems.length || 1));
}

function sortTargetFirst(
  queue: ReturnType<typeof getPracticeQueueItems>,
  target?: PracticeTarget
): ReturnType<typeof getPracticeQueueItems> {
  if (!target) return queue;

  return [...queue].sort((a, b) => {
    const aMatches =
      a.card.archetypeId === target.archetypeId &&
      (!target.problemItemId ||
        a.problemItemId === target.problemItemId ||
        a.card.problemItemId === target.problemItemId);
    const bMatches =
      b.card.archetypeId === target.archetypeId &&
      (!target.problemItemId ||
        b.problemItemId === target.problemItemId ||
        b.card.problemItemId === target.problemItemId);
    if (aMatches === bMatches) return 0;
    return aMatches ? -1 : 1;
  });
}

export default function PracticeMode() {
  const [, navigate] = useLocation();
  const [, routeParams] = useRoute<{ archetypeId: string }>(
    "/practice/:archetypeId"
  );
  const [phase, setPhase] = useState<Phase>("setup");
  const [queue, setQueue] = useState<DrillCard[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [attempts, setAttempts] = useState<PracticeAttempt[]>([]);
  const [selectedRootCauses, setSelectedRootCauses] = useState<string[]>([]);
  const [startTime, setStartTime] = useState(Date.now());
  const [autoStartedTarget, setAutoStartedTarget] = useState(false);

  const startSession = (count: number, target?: PracticeTarget) => {
    const now = Date.now();
    const store = ensurePracticeCards(loadStore(), now, target);
    const queueLimit = target ? Math.max(store.cards.length, count) : count;
    const prioritized = sortTargetFirst(
      getPracticeQueueItems(store, queueLimit, now),
      target
    );
    const drillQueue: DrillCard[] = prioritized.slice(0, count).map(item => {
      const stemIdx = stemIndexForQueueItem(item.card, item.problemItemId);
      return { card: item.card, stemIdx, priority: item.priority };
    });
    setQueue(drillQueue);
    setCurrentIdx(0);
    setAttempts([]);
    setRevealed(false);
    setSelectedRootCauses([]);
    setStartTime(Date.now());
    setPhase("drill");
  };

  useEffect(() => {
    const archetypeId = routeParams?.archetypeId;
    if (
      autoStartedTarget ||
      phase !== "setup" ||
      !archetypeId ||
      !isEligibleArchetypeId(archetypeId)
    ) {
      return;
    }

    const problemItemId =
      new URLSearchParams(window.location.search).get("problemItemId") ??
      undefined;
    const target =
      problemItemId &&
      CONTENT_PRACTICE_ITEM_MAP[problemItemId]?.archetypeId === archetypeId
        ? { archetypeId, problemItemId }
        : { archetypeId };

    setAutoStartedTarget(true);
    startSession(1, target);
  }, [autoStartedTarget, phase, routeParams?.archetypeId]);

  const handleReveal = () => setRevealed(true);

  const handleRate = (rating: Rating) => {
    if (!queue[currentIdx]) return;
    const { card } = queue[currentIdx];
    const stems = CONTENT_PRACTICE_ITEMS_BY_ARCHETYPE[card.archetypeId] ?? [];
    const stem = stems[queue[currentIdx].stemIdx] ?? stems[0];
    const attempt: PracticeAttempt = {
      id: nanoid(),
      archetypeId: card.archetypeId,
      problemItemId: stem?.id,
      stemId: stem?.id,
      rating,
      rootCauseIds: rating !== "correct" ? selectedRootCauses : [],
      timestamp: Date.now(),
      mode: "practice",
      timeSpent: Date.now() - startTime,
    };
    const updatedCard = scheduleCard(
      { ...card, ...(stem?.id ? { problemItemId: stem.id } : {}) },
      rating
    );
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
          <Zap size={16} style={{ color: "oklch(0.21 0 0)" }} />
          <h1
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 18,
              fontWeight: 700,
              color: "oklch(0.21 0 0)",
            }}
          >
            Practice
          </h1>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 12,
              color: "oklch(0.51 0 0)",
              padding: "2px 8px",
              border: "1px solid oklch(0.90 0.013 78)",
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
            color: "oklch(0.51 0 0)",
          }}
        >
          {currentIdx + 1} / {queue.length}
        </div>
      </div>

      {/* Progress */}
      <div
        style={{
          height: 3,
          background: "oklch(0.90 0.013 78)",
          borderRadius: 2,
          marginBottom: 28,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progress}%`,
            background: "oklch(0.21 0 0)",
            borderRadius: 2,
            transition: "width 300ms ease-out",
          }}
        />
      </div>

      {/* Stem */}
      <div
        style={{
          background: "oklch(1 0 0)",
          border: "1px solid oklch(0.90 0.013 78)",
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
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: 16,
            color: "oklch(0.21 0 0)",
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
            border: "1px solid oklch(0.90 0.013 78)",
            borderRadius: 4,
            color: "oklch(0.28 0 0)",
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: 13,
            cursor: "pointer",
            marginBottom: 20,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = "oklch(0.21 0 0 / 0.28)";
            e.currentTarget.style.color = "oklch(0.21 0 0)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = "oklch(0.90 0.013 78)";
            e.currentTarget.style.color = "oklch(0.28 0 0)";
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
              background: "oklch(1 0 0)",
              border: "1px solid oklch(0.44 0.15 150 / 0.15)",
              borderLeft: "3px solid oklch(0.44 0.15 150)",
              borderRadius: "0 4px 4px 0",
              padding: 20,
              marginBottom: 16,
            }}
          >
            <div
              className="section-label"
              style={{ marginBottom: 8, color: "oklch(0.44 0.15 150)" }}
            >
              ANSWER
            </div>
            <div
              className="formula-display"
              style={{
                marginBottom: 10,
                borderLeftColor: "oklch(0.44 0.15 150)",
              }}
            >
              {stem?.answer}
            </div>
            <p
              style={{
                fontFamily: "'Inter', system-ui, sans-serif",
                fontSize: 13,
                color: "oklch(0.28 0 0)",
              }}
            >
              {stem?.explanation}
            </p>
          </div>

          {/* Root causes (shown for incorrect/partial) */}
          <div
            style={{
              background: "oklch(1 0 0)",
              border: "1px solid oklch(0.90 0.013 78)",
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
                color="oklch(0.44 0.15 150)"
                onClick={() => handleRate("correct")}
              />
              <RateButton
                icon={<MinusCircle size={14} />}
                label="Partial"
                color="oklch(0.48 0.16 68)"
                onClick={() => handleRate("partial")}
              />
              <RateButton
                icon={<XCircle size={14} />}
                label="Incorrect"
                color="oklch(0.38 0.20 22)"
                onClick={() => handleRate("incorrect")}
              />
            </div>
            {arch?.rootCauses && (
              <div>
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 10,
                    color: "oklch(0.51 0 0)",
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
                            ? "oklch(0.38 0.20 22 / 0.10)"
                            : "transparent",
                          border: `1px solid ${isSelected ? "oklch(0.38 0.20 22 / 0.28)" : "oklch(0.90 0.013 78)"}`,
                          borderRadius: 3,
                          color: isSelected
                            ? "oklch(0.38 0.20 22)"
                            : "oklch(0.51 0 0)",
                          fontFamily: "'Inter', system-ui, sans-serif",
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
        fontFamily: "'Inter', system-ui, sans-serif",
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
        transition: "all 150ms",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = `${color}`;
        e.currentTarget.style.color = "oklch(1 0 0)";
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
  const duePatchCount = getDuePatchItems(store).length;
  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 22,
            fontWeight: 700,
            color: "oklch(0.21 0 0)",
            marginBottom: 8,
          }}
        >
          Practice Mode
        </h1>
        <p
          style={{
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: 14,
            color: "oklch(0.28 0 0)",
          }}
        >
          SRS-based practice. Reveal the answer, rate yourself, log root causes
          for misses.
        </p>
      </div>
      <div
        style={{
          background: "oklch(1 0 0)",
          border: "1px solid oklch(0.90 0.013 78)",
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
                background: count === n ? "oklch(0.21 0 0)" : "transparent",
                border: `1px solid ${count === n ? "oklch(0.21 0 0)" : "oklch(0.90 0.013 78)"}`,
                borderRadius: 4,
                color:
                  count === n ? "oklch(1 0 0)" : "oklch(0.28 0 0)",
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
        {(duePatchCount > 0 || dueCount > 0) && (
          <div
            style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: 12,
              color:
                duePatchCount > 0
                  ? "oklch(0.38 0.20 22)"
                  : "oklch(0.44 0.15 150)",
              marginTop: 10,
            }}
          >
            {duePatchCount > 0
              ? `${duePatchCount} patch${duePatchCount > 1 ? "es" : ""} due now`
              : `✓ ${dueCount} cards due today`}
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
          background: "oklch(0.21 0 0)",
          border: "none",
          borderRadius: 4,
          color: "oklch(1 0 0)",
          fontFamily: "'Inter', system-ui, sans-serif",
          fontSize: 14,
          fontWeight: 700,
          cursor: "pointer",
        }}
        onMouseEnter={e =>
          (e.currentTarget.style.background = "oklch(0.14 0 0)")
        }
        onMouseLeave={e =>
          (e.currentTarget.style.background = "oklch(0.21 0 0)")
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
            color: "oklch(0.21 0 0)",
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
              color: pct >= 80 ? "oklch(0.44 0.15 150)" : "oklch(0.48 0.16 68)",
            }}
          >
            {pct}%
          </div>
          <div className="stat-label">Accuracy</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: "oklch(0.44 0.15 150)" }}>
            {correct}
          </div>
          <div className="stat-label">Correct</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: "oklch(0.48 0.16 68)" }}>
            {partial}
          </div>
          <div className="stat-label">Partial</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: "oklch(0.38 0.20 22)" }}>
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
            background: "oklch(0.21 0 0)",
            border: "none",
            borderRadius: 4,
            color: "oklch(1 0 0)",
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
          onMouseEnter={e =>
            (e.currentTarget.style.background = "oklch(0.14 0 0)")
          }
          onMouseLeave={e =>
            (e.currentTarget.style.background = "oklch(0.21 0 0)")
          }
        >
          Retry
        </button>
        <button
          onClick={onDone}
          style={{
            padding: "10px 20px",
            background: "transparent",
            border: "1px solid oklch(0.90 0.013 78)",
            borderRadius: 4,
            color: "oklch(0.28 0 0)",
            fontFamily: "'Inter', system-ui, sans-serif",
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
