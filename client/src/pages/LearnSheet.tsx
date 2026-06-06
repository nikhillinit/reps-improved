/* ============================================================
   REPS — Learn Sheet
   Terminal Precision: Step-through archetype learning
   ============================================================ */

import { useState, useEffect, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { ChevronLeft, ChevronRight, AlertTriangle, Eye } from "lucide-react";
import { CONTENT_ARCHETYPE_MAP as ARCHETYPE_MAP } from "@/lib/content/catalog";
import type { Archetype } from "@/lib/store";

const STEPS = [
  "Recognize",
  "Formula",
  "Worked Example",
  "Cold Solve",
  "Trap Box",
  "Sanity Checks",
] as const;
type Step = (typeof STEPS)[number];

export default function LearnSheet() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const arch = ARCHETYPE_MAP[params.id];
  const [currentStep, setCurrentStep] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [coldSolveInput, setColdSolveInput] = useState("");

  useEffect(() => {
    setRevealed(false);
    setColdSolveInput("");
  }, [currentStep]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowRight" || e.key === "Enter") {
        if (currentStep < STEPS.length - 1) setCurrentStep(s => s + 1);
      }
      if (e.key === "ArrowLeft") {
        if (currentStep > 0) setCurrentStep(s => s - 1);
      }
      if (e.key === " ") {
        e.preventDefault();
        setRevealed(r => !r);
      }
    },
    [currentStep]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!arch)
    return (
      <div
        style={{
          color: "oklch(0.62 0.22 25)",
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        Archetype not found.{" "}
        <button
          onClick={() => navigate("/learn")}
          style={{
            color: "oklch(0.78 0.17 65)",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          ← Back
        </button>
      </div>
    );

  const step = STEPS[currentStep];

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <button
          onClick={() => navigate("/learn")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            background: "none",
            border: "none",
            color: "oklch(0.40 0.01 265)",
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: 13,
            cursor: "pointer",
            padding: "4px 0",
          }}
          onMouseEnter={e =>
            (e.currentTarget.style.color = "oklch(0.78 0.17 65)")
          }
          onMouseLeave={e =>
            (e.currentTarget.style.color = "oklch(0.40 0.01 265)")
          }
        >
          <ChevronLeft size={14} />
          Learn
        </button>
        <span style={{ color: "oklch(0.28 0.01 265)" }}>/</span>
        <h1
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 18,
            fontWeight: 700,
            color: "oklch(0.91 0.005 265)",
          }}
        >
          {arch.shortName}
        </h1>
        {arch.verificationStatus === "verified" && (
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9,
              padding: "2px 6px",
              border: "1px solid oklch(0.72 0.14 185 / 0.4)",
              borderRadius: 2,
              color: "oklch(0.72 0.14 185)",
              background: "oklch(0.72 0.14 185 / 0.08)",
              letterSpacing: "0.06em",
            }}
          >
            VERIFIED
          </span>
        )}
      </div>

      {/* Step track */}
      <div style={{ marginBottom: 24 }}>
        <div className="step-track" style={{ marginBottom: 8 }}>
          {STEPS.map((s, i) => (
            <button
              key={s}
              onClick={() => setCurrentStep(i)}
              className={`step-track-item ${i === currentStep ? "active" : i < currentStep ? "done" : ""}`}
              style={{ cursor: "pointer", border: "none", padding: 0 }}
              title={s}
            />
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              color: "oklch(0.78 0.17 65)",
              fontWeight: 600,
            }}
          >
            {step}
          </span>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              color: "oklch(0.40 0.01 265)",
            }}
          >
            {currentStep + 1} / {STEPS.length}
          </span>
        </div>
      </div>

      {/* Step content */}
      <div className="stem-enter" key={currentStep}>
        {step === "Recognize" && <RecognizeStep arch={arch} />}
        {step === "Formula" && <FormulaStep arch={arch} />}
        {step === "Worked Example" && (
          <WorkedExampleStep
            arch={arch}
            revealed={revealed}
            onReveal={() => setRevealed(true)}
          />
        )}
        {step === "Cold Solve" && (
          <ColdSolveStep
            arch={arch}
            revealed={revealed}
            onReveal={() => setRevealed(true)}
            input={coldSolveInput}
            onInput={setColdSolveInput}
          />
        )}
        {step === "Trap Box" && <TrapBoxStep arch={arch} />}
        {step === "Sanity Checks" && <SanityChecksStep arch={arch} />}
      </div>

      {/* Navigation */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 32,
          paddingTop: 20,
          borderTop: "1px solid oklch(0.22 0.01 265)",
        }}
      >
        <button
          onClick={() => setCurrentStep(s => Math.max(0, s - 1))}
          disabled={currentStep === 0}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 16px",
            background: "transparent",
            border: "1px solid oklch(0.28 0.01 265)",
            borderRadius: 4,
            color:
              currentStep === 0
                ? "oklch(0.30 0.01 265)"
                : "oklch(0.55 0.01 265)",
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: 13,
            cursor: currentStep === 0 ? "not-allowed" : "pointer",
          }}
        >
          <ChevronLeft size={14} />
          Previous
        </button>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span className="kbd-badge">←→</span>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              color: "oklch(0.30 0.01 265)",
            }}
          >
            navigate
          </span>
          <span className="kbd-badge" style={{ marginLeft: 8 }}>
            Space
          </span>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              color: "oklch(0.30 0.01 265)",
            }}
          >
            reveal
          </span>
        </div>
        {currentStep < STEPS.length - 1 ? (
          <button
            onClick={() => setCurrentStep(s => s + 1)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
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
            Next Step
            <ChevronRight size={14} />
          </button>
        ) : (
          <button
            onClick={() => navigate("/practice")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              background: "oklch(0.72 0.14 185)",
              border: "none",
              borderRadius: 4,
              color: "oklch(0.13 0.01 265)",
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Practice Now →
          </button>
        )}
      </div>
    </div>
  );
}

function RecognizeStep({ arch }: { arch: Archetype }) {
  return (
    <div
      style={{
        background: "oklch(0.17 0.012 265)",
        border: "1px solid oklch(0.28 0.01 265)",
        borderRadius: 4,
        padding: 24,
      }}
    >
      <div style={{ marginBottom: 20 }}>
        <div className="section-label" style={{ marginBottom: 10 }}>
          TRIGGERS
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {(arch.triggers as string[]).map(t => (
            <span key={t} className="trigger-chip">
              {t}
            </span>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: 20 }}>
        <div className="section-label" style={{ marginBottom: 10 }}>
          DISQUALIFIERS
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {(arch.disqualifiers as string[]).map(d => (
            <span key={d} className="disqualifier-chip">
              {d}
            </span>
          ))}
        </div>
      </div>
      <div>
        <div className="section-label" style={{ marginBottom: 8 }}>
          DERIVED CONDITION
        </div>
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 13,
            color: "oklch(0.70 0.01 265)",
            background: "oklch(0.13 0.01 265)",
            padding: "10px 14px",
            borderRadius: 3,
            border: "1px solid oklch(0.22 0.01 265)",
          }}
        >
          {arch.derivedCondition as string}
        </div>
      </div>
    </div>
  );
}

function FormulaStep({ arch }: { arch: Archetype }) {
  return (
    <div
      style={{
        background: "oklch(0.17 0.012 265)",
        border: "1px solid oklch(0.28 0.01 265)",
        borderRadius: 4,
        padding: 24,
      }}
    >
      <div style={{ marginBottom: 20 }}>
        <div className="section-label" style={{ marginBottom: 10 }}>
          FORMULA
        </div>
        <div className="formula-display">{arch.formula as string}</div>
      </div>
      <div>
        <div className="section-label" style={{ marginBottom: 10 }}>
          VARIABLES
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {Object.entries(arch.formulaVars as Record<string, string>).map(
            ([varName, desc]) => (
              <div
                key={varName}
                style={{ display: "flex", gap: 12, alignItems: "baseline" }}
              >
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "oklch(0.78 0.17 65)",
                    minWidth: 60,
                    flexShrink: 0,
                  }}
                >
                  {varName}
                </span>
                <span
                  style={{
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    fontSize: 13,
                    color: "oklch(0.65 0.01 265)",
                  }}
                >
                  {desc}
                </span>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

function WorkedExampleStep({
  arch,
  revealed,
  onReveal,
}: {
  arch: Archetype;
  revealed: boolean;
  onReveal: () => void;
}) {
  const ex = arch.workedExample as {
    stem: string;
    solution: string;
    steps: string[];
  };
  return (
    <div>
      <div
        style={{
          background: "oklch(0.17 0.012 265)",
          border: "1px solid oklch(0.28 0.01 265)",
          borderRadius: 4,
          padding: 24,
          marginBottom: 12,
        }}
      >
        <div className="section-label" style={{ marginBottom: 10 }}>
          PROBLEM STEM
        </div>
        <p
          style={{
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: 15,
            color: "oklch(0.85 0.005 265)",
            lineHeight: 1.7,
          }}
        >
          {ex.stem}
        </p>
      </div>
      {!revealed ? (
        <button
          onClick={onReveal}
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
          Reveal Solution{" "}
          <span className="kbd-badge" style={{ marginLeft: 4 }}>
            Space
          </span>
        </button>
      ) : (
        <div
          style={{
            background: "oklch(0.17 0.012 265)",
            border: "1px solid oklch(0.72 0.14 185 / 0.3)",
            borderLeft: "3px solid oklch(0.72 0.14 185)",
            borderRadius: "0 4px 4px 0",
            padding: 20,
          }}
        >
          <div
            className="section-label"
            style={{ marginBottom: 10, color: "oklch(0.72 0.14 185)" }}
          >
            SOLUTION
          </div>
          <div
            className="formula-display"
            style={{
              marginBottom: 16,
              borderLeftColor: "oklch(0.72 0.14 185)",
            }}
          >
            {ex.solution}
          </div>
          <div className="section-label" style={{ marginBottom: 8 }}>
            STEPS
          </div>
          <ol style={{ margin: 0, paddingLeft: 20 }}>
            {ex.steps.map((s, i) => (
              <li
                key={i}
                style={{
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  fontSize: 13,
                  color: "oklch(0.70 0.01 265)",
                  marginBottom: 6,
                  lineHeight: 1.6,
                }}
              >
                {s}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

function ColdSolveStep({
  arch,
  revealed,
  onReveal,
  input,
  onInput,
}: {
  arch: Archetype;
  revealed: boolean;
  onReveal: () => void;
  input: string;
  onInput: (v: string) => void;
}) {
  const stems = arch.practiceStems as Array<{
    id: string;
    text: string;
    answer: string;
    explanation: string;
    traps?: string[];
  }>;
  const stem = stems[0];
  if (!stem)
    return (
      <div style={{ color: "oklch(0.40 0.01 265)" }}>
        No practice stem available.
      </div>
    );
  return (
    <div>
      <div
        style={{
          background: "oklch(0.17 0.012 265)",
          border: "1px solid oklch(0.28 0.01 265)",
          borderRadius: 4,
          padding: 24,
          marginBottom: 12,
        }}
      >
        <div className="section-label" style={{ marginBottom: 10 }}>
          COLD SOLVE — NO HINTS
        </div>
        <p
          style={{
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: 15,
            color: "oklch(0.85 0.005 265)",
            lineHeight: 1.7,
            marginBottom: 16,
          }}
        >
          {stem.text}
        </p>
        <textarea
          value={input}
          onChange={e => onInput(e.target.value)}
          placeholder="Work through your solution here..."
          style={{
            width: "100%",
            minHeight: 80,
            background: "oklch(0.13 0.01 265)",
            border: "1px solid oklch(0.28 0.01 265)",
            borderRadius: 3,
            color: "oklch(0.85 0.005 265)",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 13,
            padding: "10px 12px",
            resize: "vertical",
            outline: "none",
            boxSizing: "border-box",
          }}
          onFocus={e =>
            (e.target.style.borderColor = "oklch(0.78 0.17 65 / 0.5)")
          }
          onBlur={e => (e.target.style.borderColor = "oklch(0.28 0.01 265)")}
        />
      </div>
      {!revealed ? (
        <button
          onClick={onReveal}
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
          Check Answer{" "}
          <span className="kbd-badge" style={{ marginLeft: 4 }}>
            Space
          </span>
        </button>
      ) : (
        <div
          style={{
            background: "oklch(0.17 0.012 265)",
            border: "1px solid oklch(0.72 0.14 185 / 0.3)",
            borderLeft: "3px solid oklch(0.72 0.14 185)",
            borderRadius: "0 4px 4px 0",
            padding: 20,
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
              marginBottom: 12,
              borderLeftColor: "oklch(0.72 0.14 185)",
            }}
          >
            {stem.answer}
          </div>
          <p
            style={{
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontSize: 13,
              color: "oklch(0.60 0.01 265)",
            }}
          >
            {stem.explanation}
          </p>
          {stem.traps && stem.traps.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div className="section-label" style={{ marginBottom: 6 }}>
                WATCH OUT FOR
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {stem.traps.map(t => (
                  <span key={t} className="trap-chip">
                    ⚠ {t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TrapBoxStep({ arch }: { arch: Archetype }) {
  const traps = arch.trapNotes as string[];
  return (
    <div
      style={{
        background: "oklch(0.17 0.012 265)",
        border: "1px solid oklch(0.62 0.22 25 / 0.3)",
        borderLeft: "3px solid oklch(0.62 0.22 25)",
        borderRadius: "0 4px 4px 0",
        padding: 24,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 16,
        }}
      >
        <AlertTriangle size={16} style={{ color: "oklch(0.62 0.22 25)" }} />
        <div className="section-label" style={{ color: "oklch(0.62 0.22 25)" }}>
          TRAP BOX — COMMON MISTAKES
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {traps.map((trap, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              gap: 12,
              alignItems: "flex-start",
              padding: "10px 14px",
              background: "oklch(0.62 0.22 25 / 0.05)",
              border: "1px solid oklch(0.62 0.22 25 / 0.15)",
              borderRadius: 3,
            }}
          >
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                color: "oklch(0.62 0.22 25)",
                flexShrink: 0,
                marginTop: 1,
              }}
            >
              T{i + 1}
            </span>
            <span
              style={{
                fontFamily: "'IBM Plex Sans', sans-serif",
                fontSize: 13,
                color: "oklch(0.75 0.01 265)",
                lineHeight: 1.6,
              }}
            >
              {trap}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SanityChecksStep({ arch }: { arch: Archetype }) {
  const checks = [
    "Units are consistent (time, quantity, cost)",
    "Answer is in the right order of magnitude",
    "Formula variables are correctly identified",
    "No confusion with a similar archetype",
    "Edge cases considered (e.g., zero demand, infinite lead time)",
  ];
  return (
    <div
      style={{
        background: "oklch(0.17 0.012 265)",
        border: "1px solid oklch(0.28 0.01 265)",
        borderRadius: 4,
        padding: 24,
      }}
    >
      <div className="section-label" style={{ marginBottom: 16 }}>
        SANITY CHECKS — {(arch.shortName as string).toLocaleUpperCase()}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {checks.map((check, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
              padding: "8px 12px",
              background: "oklch(0.13 0.01 265)",
              borderRadius: 3,
              border: "1px solid oklch(0.22 0.01 265)",
            }}
          >
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                color: "oklch(0.78 0.17 65)",
                flexShrink: 0,
                marginTop: 2,
              }}
            >
              ✓
            </span>
            <span
              style={{
                fontFamily: "'IBM Plex Sans', sans-serif",
                fontSize: 13,
                color: "oklch(0.65 0.01 265)",
                lineHeight: 1.6,
              }}
            >
              {check}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
