/* ============================================================
   REPS — Mock Mode
   Terminal Precision: Timed exam simulation
   ============================================================ */

import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import {
  Trophy,
  Clock,
  CheckCircle2,
  XCircle,
  MinusCircle,
} from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { ARCHETYPES, ARCHETYPE_MAP, ROUTER_STEMS } from "@/lib/archetypes";
import {
  loadStore,
  saveStore,
  type PracticeAttempt,
  type Rating,
  type RouterAttempt,
} from "@/lib/store";
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
  const savedRef = useRef(false);

  const startExam = () => {
    // Mix router + practice questions
    const routerQs: MockQuestion[] = ROUTER_STEMS.slice(0, 6).map(s => ({
      id: nanoid(),
      type: "router",
      stem: s.stem,
      correctArchetypeId: s.correctId,
      choices: ARCHETYPES.map(a => a.id),
    }));
    const practiceQs: MockQuestion[] = ARCHETYPES.slice(0, 6).map(arch => {
      const stem = arch.practiceStems[0];
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
    savedRef.current = false;
    setQuestions(all);
    setCurrentIdx(0);
    setAnswers({});
    setTimeLeft(MOCK_DURATION);
    setRevealed(false);
    setPhase("exam");
  };

  const saveResults = useCallback(() => {
    if (savedRef.current || questions.length === 0) return;
    savedRef.current = true;

    const now = Date.now();
    const mockPracticeAttempts: PracticeAttempt[] = questions
      .filter(q => q.type === "practice")
      .map((q, index) => {
        const answer = answers[q.id];
        const rating: Rating =
          answer === "correct" || answer === "partial" || answer === "incorrect"
            ? answer
            : "incorrect";

        return {
          id: nanoid(),
          archetypeId: q.correctArchetypeId,
          stemId: q.id,
          rating,
          rootCauseIds: [],
          timestamp: now + index,
          mode: "mock",
        };
      });

    const mockRouterAttempts: RouterAttempt[] = questions
      .filter(q => q.type === "router")
      .map((q, index) => {
        const selectedArchetypeId = answers[q.id] || "";
        return {
          id: nanoid(),
          stem: q.stem,
          correctArchetypeId: q.correctArchetypeId,
          selectedArchetypeId,
          isCorrect: selectedArchetypeId === q.correctArchetypeId,
          timestamp: now + mockPracticeAttempts.length + index,
        };
      });

    const store = loadStore();
    saveStore({
      ...store,
      practiceAttempts: [...store.practiceAttempts, ...mockPracticeAttempts],
      routerAttempts: [...store.routerAttempts, ...mockRouterAttempts],
    });
  }, [answers, questions]);

  const finishExam = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    saveResults();
    setPhase("result");
  }, [saveResults]);

  useEffect(() => {
    if (phase !== "exam") return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          finishExam();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [finishExam, phase]);

  const handleAnswer = (qId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [qId]: answer }));
  };

  const handleNext = () => {
    setRevealed(false);
    if (currentIdx >= questions.length - 1) {
      finishExam();
    } else {
      setCurrentIdx(i => i + 1);
    }
  };

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
          <Trophy size={16} style={{ color: "oklch(0.78 0.17 65)" }} />
          <h1
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 18,
              fontWeight: 700,
              color: "oklch(0.91 0.005 265)",
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
              color: isLowTime ? "oklch(0.62 0.22 25)" : "oklch(0.78 0.17 65)",
            }}
          >
            <Clock size={14} />
            {formatTime(timeLeft)}
          </div>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 12,
              color: "oklch(0.40 0.01 265)",
            }}
          >
            {currentIdx + 1}/{questions.length}
          </div>
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

      {/* Question */}
      <div
        style={{
          background: "oklch(0.17 0.012 265)",
          border: "1px solid oklch(0.28 0.01 265)",
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
              border: "1px solid oklch(0.28 0.01 265)",
              borderRadius: 2,
              color: "oklch(0.40 0.01 265)",
            }}
          >
            Q{currentIdx + 1}
          </span>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              padding: "2px 6px",
              border: "1px solid oklch(0.28 0.01 265)",
              borderRadius: 2,
              color: "oklch(0.40 0.01 265)",
            }}
          >
            {isRouter ? "IDENTIFY" : "SOLVE"}
          </span>
        </div>
        <p
          style={{
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: 16,
            color: "oklch(0.88 0.005 265)",
            lineHeight: 1.75,
          }}
        >
          {q.stem}
        </p>
      </div>

      {/* Router: choices */}
      {isRouter && (
        <div className="responsive-grid" style={{ gap: 8, marginBottom: 16 }}>
          {ARCHETYPES.map(arch => {
            const isSelected = userAnswer === arch.id;
            return (
              <button
                key={arch.id}
                onClick={() => handleAnswer(q.id, arch.id)}
                style={{
                  padding: "10px 14px",
                  background: isSelected
                    ? "oklch(0.78 0.17 65 / 0.1)"
                    : "oklch(0.17 0.012 265)",
                  border: `1px solid ${isSelected ? "oklch(0.78 0.17 65)" : "oklch(0.28 0.01 265)"}`,
                  borderRadius: 4,
                  color: isSelected
                    ? "oklch(0.91 0.005 265)"
                    : "oklch(0.65 0.01 265)",
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 150ms",
                }}
              >
                {arch.shortName}
              </button>
            );
          })}
        </div>
      )}

      {/* Practice: reveal answer */}
      {!isRouter && !revealed && (
        <button
          onClick={() => setRevealed(true)}
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
            marginBottom: 16,
          }}
        >
          Reveal Answer
        </button>
      )}
      {!isRouter && revealed && (
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
            className="formula-display"
            style={{ borderLeftColor: "oklch(0.72 0.14 185)" }}
          >
            {q.answer}
          </div>
          <div
            style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}
          >
            <MockRateButton
              icon={<CheckCircle2 size={14} />}
              label="Correct"
              active={userAnswer === "correct"}
              color="oklch(0.72 0.14 185)"
              onClick={() => handleAnswer(q.id, "correct")}
            />
            <MockRateButton
              icon={<MinusCircle size={14} />}
              label="Partial"
              active={userAnswer === "partial"}
              color="oklch(0.78 0.17 65)"
              onClick={() => handleAnswer(q.id, "partial")}
            />
            <MockRateButton
              icon={<XCircle size={14} />}
              label="Incorrect"
              active={userAnswer === "incorrect"}
              color="oklch(0.62 0.22 25)"
              onClick={() => handleAnswer(q.id, "incorrect")}
            />
          </div>
        </div>
      )}

      {/* Next */}
      <button
        onClick={handleNext}
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
        {currentIdx >= questions.length - 1 ? "Finish Exam" : "Next →"}
      </button>
    </div>
  );
}

function MockRateButton({
  icon,
  label,
  active,
  color,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
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
        padding: "7px 13px",
        background: active ? `${color} / 0.16` : "transparent",
        border: `1px solid ${active ? color : "oklch(0.28 0.01 265)"}`,
        borderRadius: 4,
        color: active ? color : "oklch(0.55 0.01 265)",
        fontFamily: "'IBM Plex Sans', sans-serif",
        fontSize: 13,
        fontWeight: active ? 600 : 500,
        cursor: "pointer",
      }}
    >
      {icon}
      {label}
    </button>
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
          Mock Exam
        </h1>
        <p
          style={{
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: 14,
            color: "oklch(0.55 0.01 265)",
          }}
        >
          12 questions (6 router + 6 practice) under a 20-minute timer.
          Simulates exam conditions.
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
          EXAM FORMAT
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            [
              "6 Router questions",
              "Identify the correct archetype from 6 choices",
            ],
            [
              "6 Practice questions",
              "Solve and self-rate against the answer key",
            ],
            ["20-minute timer", "Auto-submits when time expires"],
          ].map(([title, desc]) => (
            <div key={title} style={{ display: "flex", gap: 10 }}>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  color: "oklch(0.78 0.17 65)",
                  marginTop: 2,
                }}
              >
                →
              </span>
              <div>
                <div
                  style={{
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "oklch(0.85 0.005 265)",
                  }}
                >
                  {title}
                </div>
                <div
                  style={{
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    fontSize: 12,
                    color: "oklch(0.45 0.01 265)",
                  }}
                >
                  {desc}
                </div>
              </div>
            </div>
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
      >
        <Trophy size={16} />
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
          color: "oklch(0.91 0.005 265)",
          marginBottom: 24,
        }}
      >
        Exam Complete
      </h1>
      <div className="grid grid-cols-1 gap-3 mb-6 md:grid-cols-3">
        <StatCard
          value={`${attempted}/${questions.length}`}
          label="Attempted"
        />
        <StatCard
          value={`${routerCorrect}/${routerQs.length}`}
          label="Router Correct"
          accent
        />
        <StatCard
          value={questions.length - routerQs.length}
          label="Practice Qs"
        />
      </div>
      <button
        onClick={onDone}
        style={{
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
        Back to Dashboard
      </button>
    </div>
  );
}
