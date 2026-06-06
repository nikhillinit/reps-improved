/* ============================================================
   REPS — Mock Mode
   Terminal Precision: Timed exam simulation
   ============================================================ */

import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Trophy, Clock } from "lucide-react";
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
const MOCK_ROUTER_QUESTION_COUNT = ARCHETYPES.length;
const MOCK_PRACTICE_QUESTION_COUNT = ARCHETYPES.length;
const MOCK_QUESTION_COUNT =
  MOCK_ROUTER_QUESTION_COUNT + MOCK_PRACTICE_QUESTION_COUNT;

export default function MockMode() {
  const [, navigate] = useLocation();
  const [phase, setPhase] = useState<Phase>("setup");
  const [questions, setQuestions] = useState<MockQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(MOCK_DURATION);
  const [revealed, setRevealed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startExam = () => {
    const routerQs: MockQuestion[] = ARCHETYPES.map(arch => {
      const stem =
        ROUTER_STEMS.find(candidate => candidate.correctId === arch.id) ??
        ROUTER_STEMS[0];

      return {
        id: nanoid(),
        type: "router",
        stem: stem.stem,
        correctArchetypeId: stem.correctId,
        choices: ARCHETYPES.map(a => a.id),
      };
    });
    const practiceQs: MockQuestion[] = ARCHETYPES.map(arch => {
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

  const handleNext = () => {
    setRevealed(false);
    if (currentIdx >= questions.length - 1) {
      clearInterval(timerRef.current!);
      setPhase("result");
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
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 8,
            marginBottom: 16,
          }}
        >
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
          {MOCK_QUESTION_COUNT} questions ({MOCK_ROUTER_QUESTION_COUNT} router +{" "}
          {MOCK_PRACTICE_QUESTION_COUNT} practice) under a 20-minute timer.
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
              `${MOCK_ROUTER_QUESTION_COUNT} Router questions`,
              `Identify the correct archetype from ${ARCHETYPES.length} choices`,
            ],
            [
              `${MOCK_PRACTICE_QUESTION_COUNT} Practice questions`,
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
          <div className="stat-value" style={{ color: "oklch(0.72 0.14 185)" }}>
            {routerCorrect}/{routerQs.length}
          </div>
          <div className="stat-label">Router Correct</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{questions.length - routerQs.length}</div>
          <div className="stat-label">Practice Qs</div>
        </div>
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
