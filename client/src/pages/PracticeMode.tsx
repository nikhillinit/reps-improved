/* ============================================================
   REPS — Practice Mode  v2.1
   Mobile-first · Touch-optimised rating row · Keyboard shortcuts
   ============================================================ */

import { useState, useEffect, useCallback } from "react";
import { useLocation, useRoute } from "wouter";
import {
  Zap,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Eye,
  RotateCcw,
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
import { useIsMobile } from "@/hooks/useMobile";

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

function hasPracticeCard(cards: Card[], archetypeId: string, problemItemId?: string): boolean {
  return cards.some(
    card =>
      card.cardType === "practice" &&
      card.archetypeId === archetypeId &&
      (problemItemId ? card.problemItemId === problemItemId : true)
  );
}

function ensurePracticeCards(store: RepsStore, now: number, target?: PracticeTarget): RepsStore {
  const openItems = getOpenErrorItems(store);
  const remediationCards = openItems
    .filter(item => item.problemItemId && !hasPracticeCard(store.cards, item.archetypeId, item.problemItemId))
    .map(item => createPracticeCard(item.archetypeId, now, { problemItemId: item.problemItemId, dueAt: item.dueAt }))
    .filter((card): card is Card => Boolean(card));

  const cardsAfterRemediation = [...store.cards, ...remediationCards];
  const targetCard =
    target && !hasPracticeCard(cardsAfterRemediation, target.archetypeId, target.problemItemId)
      ? createPracticeCard(target.archetypeId, now, { problemItemId: target.problemItemId, dueAt: now })
      : undefined;

  const existingCards = [...cardsAfterRemediation, ...(targetCard ? [targetCard] : [])];
  const representedArchetypes = new Set(existingCards.filter(c => c.cardType === "practice").map(c => c.archetypeId));
  const coverageCards = ARCHETYPES.filter(arch => !representedArchetypes.has(arch.id))
    .map(arch => createPracticeCard(arch.id, now))
    .filter((card): card is Card => Boolean(card));

  const cardsToAdd = [...remediationCards, ...(targetCard ? [targetCard] : []), ...coverageCards];
  if (cardsToAdd.length === 0) return store;
  const updated = { ...store, cards: [...store.cards, ...cardsToAdd] };
  saveStore(updated);
  return updated;
}

function stemIndexForQueueItem(card: Card, problemItemId?: string): number {
  const stems = CONTENT_PRACTICE_ITEMS_BY_ARCHETYPE[card.archetypeId] ?? [];
  const requestedProblemItemId = problemItemId ?? card.problemItemId;
  if (requestedProblemItemId) {
    const exactIndex = stems.findIndex(stem => stem.id === requestedProblemItemId);
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
    const aMatches = a.card.archetypeId === target.archetypeId && (!target.problemItemId || a.problemItemId === target.problemItemId || a.card.problemItemId === target.problemItemId);
    const bMatches = b.card.archetypeId === target.archetypeId && (!target.problemItemId || b.problemItemId === target.problemItemId || b.card.problemItemId === target.problemItemId);
    if (aMatches === bMatches) return 0;
    return aMatches ? -1 : 1;
  });
}

export default function PracticeMode() {
  const [, navigate] = useLocation();
  const [, routeParams] = useRoute<{ archetypeId: string }>("/practice/:archetypeId");
  const [phase, setPhase] = useState<Phase>("setup");
  const [queue, setQueue] = useState<DrillCard[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [attempts, setAttempts] = useState<PracticeAttempt[]>([]);
  const [selectedRootCauses, setSelectedRootCauses] = useState<string[]>([]);
  const [startTime, setStartTime] = useState(Date.now());
  const [autoStartedTarget, setAutoStartedTarget] = useState(false);
  const isMobile = useIsMobile();

  const startSession = (count: number, target?: PracticeTarget) => {
    const now = Date.now();
    const store = ensurePracticeCards(loadStore(), now, target);
    const queueLimit = target ? Math.max(store.cards.length, count) : count;
    const prioritized = sortTargetFirst(getPracticeQueueItems(store, queueLimit, now), target);
    const drillQueue: DrillCard[] = prioritized.slice(0, count).map(item => ({
      card: item.card,
      stemIdx: stemIndexForQueueItem(item.card, item.problemItemId),
      priority: item.priority,
    }));
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
    if (autoStartedTarget || phase !== "setup" || !archetypeId || !isEligibleArchetypeId(archetypeId)) return;
    const problemItemId = new URLSearchParams(window.location.search).get("problemItemId") ?? undefined;
    const target = problemItemId && CONTENT_PRACTICE_ITEM_MAP[problemItemId]?.archetypeId === archetypeId
      ? { archetypeId, problemItemId }
      : { archetypeId };
    setAutoStartedTarget(true);
    startSession(1, target);
  }, [autoStartedTarget, phase, routeParams?.archetypeId]);

  const handleReveal = useCallback(() => setRevealed(true), []);

  const handleRate = useCallback((rating: Rating) => {
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
    const updatedCard = scheduleCard({ ...card, ...(stem?.id ? { problemItemId: stem.id } : {}) }, rating);
    const store = loadStore();
    const updatedCards = store.cards.map(c => c.id === card.id ? updatedCard : c);
    saveStore({ ...store, cards: updatedCards, practiceAttempts: [...store.practiceAttempts, attempt] });
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
  }, [queue, currentIdx, selectedRootCauses, startTime, attempts]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (phase !== "drill") return;
      if (!revealed && e.key === " ") { e.preventDefault(); handleReveal(); }
      if (revealed) {
        if (e.key === "1") handleRate("correct");
        if (e.key === "2") handleRate("partial");
        if (e.key === "3") handleRate("incorrect");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, revealed, handleReveal, handleRate]);

  if (phase === "setup") return <SetupScreen onStart={startSession} />;
  if (phase === "result") return <ResultScreen attempts={attempts} onRetry={() => startSession(queue.length)} onDone={() => navigate("/")} />;
  if (!queue[currentIdx]) return null;

  const { card, stemIdx } = queue[currentIdx];
  const arch = ARCHETYPE_MAP[card.archetypeId];
  const stems = CONTENT_PRACTICE_ITEMS_BY_ARCHETYPE[card.archetypeId] ?? [];
  const stem = stems[stemIdx] || stems[0];
  const progress = (currentIdx / queue.length) * 100;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Zap size={15} style={{ color: "var(--muted-foreground)" }} aria-hidden="true" />
          <h1 style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, fontWeight: 700, color: "var(--foreground)" }}>Practice</h1>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--muted-foreground)", padding: "2px 7px", border: "1px solid var(--border)", borderRadius: 3 }}>
            {arch?.shortName}
          </span>
        </div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "var(--muted-foreground)" }}>
          {currentIdx + 1} / {queue.length}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 4, background: "var(--border)", borderRadius: 2, marginBottom: 20, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${progress}%`, background: "var(--foreground)", borderRadius: 2, transition: "width 300ms ease-out" }} />
      </div>

      {/* Stem */}
      <div className="stem-card stem-enter">
        <div className="section-label" style={{ marginBottom: 10 }}>PROBLEM</div>
        <p style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: isMobile ? 15 : 16, color: "var(--foreground)", lineHeight: 1.75, margin: 0 }}>
          {stem?.text || "No stem available."}
        </p>
      </div>

      {/* Reveal / Answer */}
      {!revealed ? (
        <div className="sticky-next">
          <button onClick={handleReveal} className="btn-reveal" aria-label="Reveal answer">
            <Eye size={16} aria-hidden="true" />
            Reveal Answer
            {!isMobile && <span className="kbd-badge" style={{ marginLeft: 4 }}>Space</span>}
          </button>
        </div>
      ) : (
        <div className="fade-in">
          {/* Answer panel */}
          <div style={{
            background: "var(--card)",
            border: "1px solid var(--color-correct-border)",
            borderLeft: "3px solid var(--color-correct)",
            borderRadius: "0 6px 6px 0",
            padding: 18,
            marginBottom: 14,
          }}>
            <div className="section-label" style={{ marginBottom: 8, color: "var(--color-correct)" }}>ANSWER</div>
            <div className="formula-display" style={{ marginBottom: 10, borderLeftColor: "var(--color-correct)" }}>
              {stem?.answer}
            </div>
            <p style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 13, color: "var(--foreground)", lineHeight: 1.6, margin: 0 }}>
              {stem?.explanation}
            </p>
          </div>

          {/* Rate + Root causes */}
          <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 6, padding: 16, marginBottom: 16 }}>
            <div className="section-label" style={{ marginBottom: 12 }}>RATE YOUR ATTEMPT</div>

            {/* Rating row — full width on mobile, auto on desktop */}
            <div className="rating-row" style={{ marginBottom: arch?.rootCauses ? 16 : 0 }}>
              <button className="rating-btn correct-btn" onClick={() => handleRate("correct")} aria-label="Correct">
                <CheckCircle2 size={18} aria-hidden="true" />
                <span>Correct</span>
                {!isMobile && <span className="kbd-badge">1</span>}
              </button>
              <button className="rating-btn partial-btn" onClick={() => handleRate("partial")} aria-label="Partial">
                <MinusCircle size={18} aria-hidden="true" />
                <span>Partial</span>
                {!isMobile && <span className="kbd-badge">2</span>}
              </button>
              <button className="rating-btn incorrect-btn" onClick={() => handleRate("incorrect")} aria-label="Incorrect">
                <XCircle size={18} aria-hidden="true" />
                <span>Incorrect</span>
                {!isMobile && <span className="kbd-badge">3</span>}
              </button>
            </div>

            {arch?.rootCauses && (
              <div>
                <div className="section-label" style={{ marginBottom: 8 }}>ROOT CAUSE (optional)</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {(arch.rootCauses as Array<{ id: string; label: string }>).map(rc => {
                    const isSelected = selectedRootCauses.includes(rc.id);
                    return (
                      <button
                        key={rc.id}
                        onClick={() => setSelectedRootCauses(prev => isSelected ? prev.filter(x => x !== rc.id) : [...prev, rc.id])}
                        style={{
                          padding: "5px 11px",
                          minHeight: 36,
                          background: isSelected ? "var(--color-error-bg)" : "transparent",
                          border: `1px solid ${isSelected ? "var(--color-error-border)" : "var(--border)"}`,
                          borderRadius: 4,
                          color: isSelected ? "var(--color-error)" : "var(--muted-foreground)",
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

function SetupScreen({ onStart }: { onStart: (count: number) => void }) {
  const [count, setCount] = useState(10);
  const store = loadStore();
  const dueCount = store.cards.filter(c => c.dueAt <= Date.now()).length;
  const duePatchCount = getDuePatchItems(store).length;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 700, color: "var(--foreground)", marginBottom: 8 }}>
          Practice Mode
        </h1>
        <p style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 15, color: "var(--muted-foreground)", lineHeight: 1.6, margin: 0 }}>
          SRS-based practice. Reveal the answer, rate yourself, log root causes for misses.
        </p>
      </div>

      <div className="setup-card" style={{ marginBottom: 20 }}>
        <div className="section-label" style={{ marginBottom: 12 }}>SESSION SIZE</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[5, 10, 15, 20].map(n => (
            <button
              key={n}
              onClick={() => setCount(n)}
              style={{
                padding: "10px 20px",
                minHeight: 44,
                background: count === n ? "var(--foreground)" : "transparent",
                border: `1px solid ${count === n ? "var(--foreground)" : "var(--border)"}`,
                borderRadius: 4,
                color: count === n ? "var(--background)" : "var(--foreground)",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 150ms",
              }}
            >
              {n}
            </button>
          ))}
        </div>
        {(duePatchCount > 0 || dueCount > 0) && (
          <div style={{
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: 12,
            color: duePatchCount > 0 ? "var(--color-error)" : "var(--color-correct)",
            marginTop: 10,
          }}>
            {duePatchCount > 0 ? `${duePatchCount} patch${duePatchCount > 1 ? "es" : ""} due now` : `✓ ${dueCount} cards due today`}
          </div>
        )}
      </div>

      <button onClick={() => onStart(count)} className="btn-primary" style={{ width: "100%", justifyContent: "center" }}>
        <Zap size={16} aria-hidden="true" />
        Start Practice
      </button>
    </div>
  );
}

function ResultScreen({ attempts, onRetry, onDone }: {
  attempts: PracticeAttempt[]; onRetry: () => void; onDone: () => void;
}) {
  const correct = attempts.filter(a => a.rating === "correct").length;
  const partial = attempts.filter(a => a.rating === "partial").length;
  const incorrect = attempts.filter(a => a.rating === "incorrect").length;
  const pct = attempts.length > 0 ? Math.round((correct / attempts.length) * 100) : 0;
  const pctColor = pct >= 80 ? "var(--color-correct)" : pct >= 60 ? "var(--color-warn)" : "var(--color-error)";

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 700, color: "var(--foreground)", marginBottom: 4 }}>
          Session Complete
        </h1>
        <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 14, color: "var(--muted-foreground)" }}>
          {correct} of {attempts.length} correct
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-value" style={{ color: pctColor }}>{pct}%</div>
          <div className="stat-label">Accuracy</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: "var(--color-correct)" }}>{correct}</div>
          <div className="stat-label">Correct</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: "var(--color-warn)" }}>{partial}</div>
          <div className="stat-label">Partial</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: "var(--color-error)" }}>{incorrect}</div>
          <div className="stat-label">Incorrect</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={onRetry} className="btn-primary" style={{ flex: 1, justifyContent: "center" }}>
          <RotateCcw size={14} aria-hidden="true" />
          Retry
        </button>
        <button onClick={onDone} className="btn-secondary" style={{ flex: 1, justifyContent: "center" }}>
          Dashboard
        </button>
      </div>
    </div>
  );
}
