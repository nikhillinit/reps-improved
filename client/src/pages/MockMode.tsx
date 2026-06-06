/* ============================================================
   REPS — Mock Mode
   Terminal Precision: Timed exam simulation
   ============================================================ */

import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { Trophy, Clock, ChevronRight } from "lucide-react";
import { useIsMobile } from "@/hooks/useMobile";
import {
  CONTENT_ARCHETYPES as ARCHETYPES,
  CONTENT_PRACTICE_ITEMS_BY_ARCHETYPE,
  CONTENT_ROUTER_STEMS as ROUTER_STEMS,
} from "@/lib/content/catalog";
import { nanoid } from "nanoid";

type Phase = "setup" | "exam" | "result";

interface MockQuestion {
  id: string;
  type: "router" | "practice";
  stem: string;
  correctArchetypeId: string;
  choices?: string[];
  answer?: string;
  explanation?: string;
}

const MOCK_DURATION = 20 * 60; // 20 minutes

export default function MockMode() {
  const [, navigate] = useLocation();
  const [phase, setPhase] = useState<Phase>("setup");
  const [questions, setQuestions] = useState<MockQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(MOCK_DURATION);
  const [revealed, setRevealed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMobile = useIsMobile();

  const startExam = () => {
    // Mix router + practice questions
    const routerQs: MockQuestion[] = ROUTER_STEMS.slice(0, 9).map(s => ({
      id: nanoid(),
      type: "router",
      stem: s.stem,
      correctArchetypeId: s.correctId,
      choices: ARCHETYPES.map(a => a.id),
    }));
    const practiceQs: MockQuestion[] = ARCHETYPES.slice(0, 9).map(arch => {
      const stem = CONTENT_PRACTICE_ITEMS_BY_ARCHETYPE[arch.id]?.[0];
      return {
        id: nanoid(),
        type: "practice",
        stem: stem?.text || arch.workedExample.stem,
        correctArchetypeId: arch.id,
        answer: stem?.answer || arch.workedExample.solution,
        explanation: stem?.explanation || "",
      };
    });
    const all = [...routerQs, ...practiceQs].sort(() => Math.random() - 0.5);
    setQuestions(all);
    setCurrentIdx(0);
    setAnswers({});
    setTimeLeft(MOCK_DURATION);
    setRevealed(false);
    setPhase("exam");
  };

  useEffect(() => {
    if (phase !== "exam") return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          setPhase("result");
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [phase]);

  const handleAnswer = (qId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [qId]: answer }));
  };

  const handleNext = useCallback(() => {
    setRevealed(false);
    if (currentIdx >= questions.length - 1) {
      clearInterval(timerRef.current!);
      setPhase("result");
    } else {
      setCurrentIdx(i => i + 1);
    }
  }, [currentIdx, questions.length]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (phase !== "exam") return;
      if (e.key === "Enter" || e.key === "ArrowRight") { e.preventDefault(); handleNext(); }
      if (e.key === " " && questions[currentIdx]?.type === "practice") { e.preventDefault(); setRevealed(true); }
      const num = parseInt(e.key);
      if (!isNaN(num) && num >= 1 && num <= ARCHETYPES.length && questions[currentIdx]?.type === "router") {
        handleAnswer(questions[currentIdx].id, ARCHETYPES[num - 1].id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, currentIdx, questions, handleNext]);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)
      .toString()
      .padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  if (phase === "setup") return <SetupScreen onStart={startExam} />;
  if (phase === "result")
    return (
      <ResultScreen
        questions={questions}
        answers={answers}
        onDone={() => navigate("/")}
      />
    );

  const q = questions[currentIdx];
  const isRouter = q.type === "router";
  const userAnswer = answers[q.id];
  const progress = (currentIdx / questions.length) * 100;
  const isLowTime = timeLeft < 120;

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
          <Trophy size={16} style={{ color: "var(--foreground)" }} />
          <h1
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 18,
              fontWeight: 700,
              color: "var(--foreground)",
            }}
          >
            Mock Exam
          </h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 14,
              fontWeight: 700,
              color: isLowTime ? "var(--color-error)" : "var(--foreground)",
            }}
          >
            <Clock size={14} />
            {formatTime(timeLeft)}
          </div>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 12,
              color: "var(--muted-foreground)",
            }}
          >
            {currentIdx + 1}/{questions.length}
          </div>
        </div>
      </div>

      {/* Progress */}
      <div
        style={{
          height: 4,
          background: "var(--border)",
          borderRadius: 2,
          marginBottom: 28,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progress}%`,
            background: "var(--foreground)",
            borderRadius: 2,
            transition: "width 300ms ease-out",
          }}
        />
      </div>

      {/* Question */}
      <div
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: 4,
          padding: 24,
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              padding: "2px 6px",
              border: "1px solid var(--border)",
              borderRadius: 2,
              color: "var(--muted-foreground)",
            }}
          >
            Q{currentIdx + 1}
          </span>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              padding: "2px 6px",
              border: "1px solid var(--border)",
              borderRadius: 2,
              color: "var(--muted-foreground)",
            }}
          >
            {isRouter ? "IDENTIFY" : "SOLVE"}
          </span>
        </div>
        <p
          style={{
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: 16,
            color: "var(--foreground)",
            lineHeight: 1.75,
          }}
        >
          {q.stem}
        </p>
      </div>

      {/* Router: choices — single column on mobile */}
      {isRouter && (
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
          gap: 8,
          marginBottom: 16,
        }}>
          {ARCHETYPES.map((arch, idx) => {
            const isSelected = userAnswer === arch.id;
            return (
              <button
                key={arch.id}
                onClick={() => handleAnswer(q.id, arch.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 14px",
                  minHeight: 48,
                  background: isSelected ? "var(--muted)" : "var(--card)",
                  border: `1.5px solid ${isSelected ? "var(--foreground)" : "var(--border)"}`,
                  borderRadius: 6,
                  color: "var(--foreground)",
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  fontSize: 14,
                  fontWeight: isSelected ? 600 : 400,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 150ms",
                }}
              >
                {!isMobile && (
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--muted-foreground)", minWidth: 14 }}>
                    {idx + 1}
                  </span>
                )}
                {arch.shortName}
              </button>
            );
          })}
        </div>
      )}

      {/* Practice: reveal answer */}
      {!isRouter && !revealed && (
        <div className="sticky-next">
          <button onClick={() => setRevealed(true)} className="btn-reveal">
            Reveal Answer
            {!isMobile && <span className="kbd-badge" style={{ marginLeft: 4 }}>Space</span>}
          </button>
        </div>
      )}
      {!isRouter && revealed && (
        <div className="fade-in" style={{
          background: "var(--card)",
          border: "1px solid var(--color-correct-border)",
          borderLeft: "3px solid var(--color-correct)",
          borderRadius: "0 6px 6px 0",
          padding: 18,
          marginBottom: 14,
        }}>
          <div className="section-label" style={{ marginBottom: 8, color: "var(--color-correct)" }}>ANSWER</div>
          <div className="formula-display" style={{ borderLeftColor: "var(--color-correct)" }}>{q.answer}</div>
        </div>
      )}

      {/* Next — sticky on mobile, shown after selection/reveal */}
      {(isRouter || revealed) && (
        <div className="sticky-next">
          <button onClick={handleNext} className="btn-primary" style={{ width: "100%", justifyContent: "center" }}>
            {currentIdx >= questions.length - 1 ? "Finish Exam" : "Next"}
            <ChevronRight size={16} aria-hidden="true" />
            {!isMobile && <span className="kbd-badge">Enter</span>}
          </button>
        </div>
      )}
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
            color: "var(--foreground)",
            marginBottom: 8,
          }}
        >
          Mock Exam
        </h1>
        <p
          style={{
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: 14,
            color: "var(--foreground)",
          }}
        >
          18 questions (9 router + 9 practice) under a 20-minute timer.
          Simulates exam conditions.
        </p>
      </div>
      <div
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: 4,
          padding: 20,
          marginBottom: 24,
        }}
      >
        <div className="section-label" style={{ marginBottom: 12 }}>
          EXAM FORMAT
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            [
              "9 Router questions",
              "Identify the correct archetype from 9 choices",
            ],
            [
              "9 Practice questions",
              "Solve and self-rate against the answer key",
            ],
            ["20-minute timer", "Auto-submits when time expires"],
          ].map(([title, desc]) => (
            <div key={title} style={{ display: "flex", gap: 10 }}>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  color: "var(--foreground)",
                  marginTop: 2,
                }}
              >
                →
              </span>
              <div>
                <div
                  style={{
                    fontFamily: "'Inter', system-ui, sans-serif",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--foreground)",
                  }}
                >
                  {title}
                </div>
                <div
                  style={{
                    fontFamily: "'Inter', system-ui, sans-serif",
                    fontSize: 12,
                    color: "var(--muted-foreground)",
                  }}
                >
                  {desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <button onClick={onStart} className="btn-primary" style={{ width: "100%", justifyContent: "center" }}>
        <Trophy size={16} aria-hidden="true" />
        Start Mock Exam
      </button>
    </div>
  );
}

function ResultScreen({
  questions,
  answers,
  onDone,
}: {
  questions: MockQuestion[];
  answers: Record<string, string>;
  onDone: () => void;
}) {
  const routerQs = questions.filter(q => q.type === "router");
  const routerCorrect = routerQs.filter(
    q => answers[q.id] === q.correctArchetypeId
  ).length;
  const attempted = Object.keys(answers).length;
  return (
    <div>
      <h1
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 22,
          fontWeight: 700,
          color: "var(--foreground)",
          marginBottom: 24,
        }}
      >
        Exam Complete
      </h1>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <div className="stat-card">
          <div className="stat-value">
            {attempted}/{questions.length}
          </div>
          <div className="stat-label">Attempted</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: "var(--color-correct)" }}>
            {routerCorrect}/{routerQs.length}
          </div>
          <div className="stat-label">Router Correct</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{questions.length - routerQs.length}</div>
          <div className="stat-label">Practice Qs</div>
        </div>
      </div>
      <button onClick={onDone} className="btn-primary" style={{ width: "100%", justifyContent: "center" }}>
        Back to Dashboard
      </button>
    </div>
  );
}
