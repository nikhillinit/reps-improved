/* ============================================================
   REPS — Router Mode  v2.1
   Mobile-first · Single-column choices · Sticky next button
   ============================================================ */

import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import {
  Shuffle,
  CheckCircle2,
  XCircle,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import {
  CONTENT_ARCHETYPE_MAP as ARCHETYPE_MAP,
  CONTENT_ARCHETYPES as ARCHETYPES,
  CONTENT_ROUTER_STEMS as ROUTER_STEMS,
} from "@/lib/content/catalog";
import { loadStore, saveStore, type RouterAttempt } from "@/lib/store";
import { nanoid } from "nanoid";
import { useIsMobile } from "@/hooks/useMobile";

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
  const isMobile = useIsMobile();

  const startSession = () => {
    const shuffled = [...ROUTER_STEMS].sort(() => Math.random() - 0.5).slice(0, 8);
    setSession({ stems: shuffled, currentIdx: 0, attempts: [], startTime: Date.now(), stemStart: Date.now() });
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
      routerStemId: stem.id,
      stem: stem.stem,
      correctArchetypeId: stem.correctId,
      selectedArchetypeId: archetypeId,
      isCorrect,
      timestamp: Date.now(),
      timeSpent,
    };
    setSelected(archetypeId);
    setShowFeedback(true);
    setSession(s => s ? { ...s, attempts: [...s.attempts, attempt] } : s);
  };

  const handleNext = useCallback(() => {
    if (!session) return;
    if (session.currentIdx >= session.stems.length - 1) {
      const store = loadStore();
      saveStore({ ...store, routerAttempts: [...store.routerAttempts, ...session.attempts] });
      setPhase("result");
    } else {
      setSession(s => s ? { ...s, currentIdx: s.currentIdx + 1, stemStart: Date.now() } : s);
      setSelected(null);
      setShowFeedback(false);
    }
  }, [session]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (phase !== "drill" || !session) return;
    if (showFeedback && (e.key === "Enter" || e.key === "ArrowRight")) { handleNext(); return; }
    const idx = parseInt(e.key) - 1;
    if (idx >= 0 && idx < ARCHETYPES.length) handleSelect(ARCHETYPES[idx].id);
  }, [phase, session, showFeedback, handleNext]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (phase === "setup") return <SetupScreen onStart={startSession} />;
  if (phase === "result" && session)
    return <ResultScreen session={session} onRetry={startSession} onDone={() => navigate("/")} />;
  if (!session) return null;

  const stem = session.stems[session.currentIdx];
  const progress = ((session.currentIdx + (showFeedback ? 1 : 0)) / session.stems.length) * 100;
  const correctArch = ARCHETYPE_MAP[stem.correctId];
  const confuserIds = new Set(stem.confuserIds ?? []);
  if (selected && selected !== stem.correctId) confuserIds.add(selected);
  const confuserArches = Array.from(confuserIds)
    .map(id => ARCHETYPE_MAP[id])
    .filter((arch): arch is (typeof ARCHETYPES)[number] => Boolean(arch));
  const isCorrectAnswer = selected === stem.correctId;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Shuffle size={15} style={{ color: "var(--muted-foreground)" }} aria-hidden="true" />
          <h1 style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, fontWeight: 700, color: "var(--foreground)" }}>
            Router
          </h1>
        </div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "var(--muted-foreground)" }}>
          {session.currentIdx + 1} / {session.stems.length}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 4, background: "var(--border)", borderRadius: 2, marginBottom: 20, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${progress}%`,
          background: "var(--foreground)", borderRadius: 2,
          transition: "width 300ms ease-out",
        }} />
      </div>

      {/* Stem */}
      <div className="stem-card stem-enter">
        <div className="section-label" style={{ marginBottom: 10 }}>IDENTIFY THE ARCHETYPE</div>
        <p style={{
          fontFamily: "'IBM Plex Sans', sans-serif",
          fontSize: isMobile ? 15 : 16,
          color: "var(--foreground)",
          lineHeight: 1.75,
          margin: 0,
        }}>
          {stem.stem}
        </p>
      </div>

      {/* Choices — single column on mobile, 2-col on desktop */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
        gap: 8,
        marginBottom: 16,
      }}>
        {ARCHETYPES.map((arch, i) => {
          const isSelected = selected === arch.id;
          const isCorrect = arch.id === stem.correctId;
          let cls = "choice-btn";
          if (showFeedback) {
            if (isCorrect) cls += " correct";
            else if (isSelected && !isCorrect) cls += " incorrect";
          } else if (isSelected) {
            cls += " selected";
          }
          return (
            <button
              key={arch.id}
              className={cls}
              onClick={() => handleSelect(arch.id)}
              disabled={showFeedback}
              aria-pressed={isSelected}
              aria-label={`${arch.shortName}${showFeedback && isCorrect ? " — correct" : ""}${showFeedback && isSelected && !isCorrect ? " — incorrect" : ""}`}
            >
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                color: "var(--muted-foreground)",
                minWidth: 16,
                flexShrink: 0,
              }}>
                {i + 1}
              </span>
              <span style={{ flex: 1 }}>{arch.shortName}</span>
              {showFeedback && isCorrect && <CheckCircle2 size={15} style={{ color: "var(--color-correct)", flexShrink: 0 }} aria-hidden="true" />}
              {showFeedback && isSelected && !isCorrect && <XCircle size={15} style={{ color: "var(--color-error)", flexShrink: 0 }} aria-hidden="true" />}
            </button>
          );
        })}
      </div>

      {/* Feedback panel */}
      {showFeedback && correctArch && (
        <div className="feedback-panel fade-in">
          {/* Result indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            {isCorrectAnswer
              ? <><CheckCircle2 size={16} style={{ color: "var(--color-correct)" }} aria-hidden="true" /><span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 14, fontWeight: 600, color: "var(--color-correct)" }}>Correct!</span></>
              : <><XCircle size={16} style={{ color: "var(--color-error)" }} aria-hidden="true" /><span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 14, fontWeight: 600, color: "var(--color-error)" }}>Incorrect — {correctArch.shortName}</span></>
            }
          </div>

          <div className="section-label" style={{ marginBottom: 10 }}>WHY THIS BUCKET</div>
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 8,
            marginBottom: confuserArches.length > 0 ? 14 : 0,
          }}>
            <FeedbackFact label="Derived condition" value={correctArch.derivedCondition} />
            <FeedbackFact label="First formula" value={correctArch.formula} mono />
            <FeedbackFact label="Top trap" value={correctArch.trapNotes[0] ?? "—"} />
          </div>

          {confuserArches.length > 0 && (
            <>
              <div className="section-label" style={{ marginBottom: 8 }}>WHY NOT THE CONFUSER</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {confuserArches.map(confuser => (
                  <div key={confuser.id} style={{
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    fontSize: 13,
                    lineHeight: 1.6,
                    color: "var(--foreground)",
                    background: "var(--muted)",
                    border: "1px solid var(--border)",
                    borderRadius: 4,
                    padding: "10px 12px",
                  }}>
                    <strong>Not {confuser.shortName}:</strong>{" "}
                    that bucket requires {confuser.derivedCondition}. This stem points to {correctArch.derivedCondition}.
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Sticky next button */}
      {showFeedback && (
        <div className="sticky-next">
          <button
            onClick={handleNext}
            className="btn-primary"
            style={{ width: "100%", justifyContent: "center" }}
            aria-label={session.currentIdx >= session.stems.length - 1 ? "See results" : "Next question"}
          >
            {session.currentIdx >= session.stems.length - 1 ? "See Results" : "Next"}
            <ChevronRight size={15} aria-hidden="true" />
            {!isMobile && <span className="kbd-badge" style={{ marginLeft: 4 }}>Enter</span>}
          </button>
        </div>
      )}
    </div>
  );
}

function FeedbackFact({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ background: "var(--muted)", border: "1px solid var(--border)", borderRadius: 4, padding: 12 }}>
      <div className="section-label" style={{ marginBottom: 6 }}>{label}</div>
      <div style={{
        fontFamily: mono ? "'JetBrains Mono', monospace" : "'IBM Plex Sans', sans-serif",
        fontSize: 13,
        lineHeight: 1.5,
        color: "var(--foreground)",
        wordBreak: "break-word",
      }}>
        {value}
      </div>
    </div>
  );
}

function SetupScreen({ onStart }: { onStart: () => void }) {
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 700, color: "var(--foreground)", marginBottom: 8 }}>
          Router Mode
        </h1>
        <p style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 15, color: "var(--muted-foreground)", lineHeight: 1.6, margin: 0 }}>
          8 randomised stems. Identify the correct archetype for each. No hints — pure pattern recognition.
        </p>
      </div>

      <div className="setup-card" style={{ marginBottom: 24 }}>
        <div className="section-label" style={{ marginBottom: 12 }}>ARCHETYPES IN SCOPE</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {ARCHETYPES.map(a => (
            <span key={a.id} className="trigger-chip">{a.shortName}</span>
          ))}
        </div>
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 6 }}>
          {[
            { key: "1–6", desc: "Select archetype" },
            { key: "Enter / →", desc: "Advance to next" },
          ].map(({ key, desc }) => (
            <div key={key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="kbd-badge">{key}</span>
              <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 12, color: "var(--muted-foreground)" }}>{desc}</span>
            </div>
          ))}
        </div>
      </div>

      <button onClick={onStart} className="btn-primary" style={{ width: "100%", justifyContent: "center" }}>
        <Shuffle size={16} aria-hidden="true" />
        Start Router Session
      </button>
    </div>
  );
}

function ResultScreen({ session, onRetry, onDone }: {
  session: SessionState; onRetry: () => void; onDone: () => void;
}) {
  const correct = session.attempts.filter(a => a.isCorrect).length;
  const total = session.attempts.length;
  const pct = Math.round((correct / total) * 100);
  const avgTime = Math.round(session.attempts.reduce((s, a) => s + (a.timeSpent || 0), 0) / total / 1000);
  const pctColor = pct >= 80 ? "var(--color-correct)" : pct >= 60 ? "var(--color-warn)" : "var(--color-error)";

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 700, color: "var(--foreground)", marginBottom: 4 }}>
          Session Complete
        </h1>
        <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 14, color: "var(--muted-foreground)" }}>
          {correct} of {total} correct
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-value" style={{ color: pctColor }}>{pct}%</div>
          <div className="stat-label">Accuracy</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{correct}/{total}</div>
          <div className="stat-label">Correct</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{avgTime}s</div>
          <div className="stat-label">Avg Time</div>
        </div>
      </div>

      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, padding: 16, marginBottom: 24 }}>
        <div className="section-label" style={{ marginBottom: 12 }}>REVIEW</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {session.attempts.map(a => (
            <div key={a.id} style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              padding: "10px 12px",
              background: "var(--muted)",
              borderRadius: 4,
              border: `1px solid ${a.isCorrect ? "var(--color-correct-border)" : "var(--color-error-border)"}`,
            }}>
              {a.isCorrect
                ? <CheckCircle2 size={14} style={{ color: "var(--color-correct)", flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
                : <XCircle size={14} style={{ color: "var(--color-error)", flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
              }
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 12, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {a.stem.slice(0, 90)}…
                </div>
                {!a.isCorrect && (
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--color-error)", marginTop: 3 }}>
                    You: {ARCHETYPES.find(x => x.id === a.selectedArchetypeId)?.shortName} → Correct: {ARCHETYPES.find(x => x.id === a.correctArchetypeId)?.shortName}
                  </div>
                )}
              </div>
            </div>
          ))}
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
