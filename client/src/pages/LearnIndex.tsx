/* ============================================================
   REPS — Learn Index
   Terminal Precision: Grid of archetype cards with status
   ============================================================ */

import { useLocation } from "wouter";
import { BookOpen, CheckCircle2, ChevronRight } from "lucide-react";
import { CONTENT_ARCHETYPES as ARCHETYPES } from "@/lib/content/catalog";
import { loadStore, getAccuracy } from "@/lib/store";

export default function LearnIndex() {
  const [, navigate] = useLocation();
  const store = loadStore();

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 22,
            fontWeight: 700,
            color: "oklch(0.21 0 0)",
            letterSpacing: "-0.01em",
          }}
        >
          Learn
        </h1>
        <p
          style={{
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: 14,
            color: "oklch(0.28 0 0)",
            marginTop: 4,
          }}
        >
          Step through each archetype: recognize → formula → worked example →
          cold solve → trap box.
        </p>
      </div>

      <div
        className="responsive-grid"
        style={{
          gap: 10,
        }}
      >
        {ARCHETYPES.map(arch => {
          const accuracy = getAccuracy(store.practiceAttempts, arch.id);
          const attempts = store.practiceAttempts.filter(
            a => a.archetypeId === arch.id
          ).length;

          return (
            <button
              key={arch.id}
              onClick={() => navigate(`/learn/${arch.id}`)}
              className="card-interactive"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "16px 18px",
                background: "oklch(1 0 0)",
                border: "1px solid oklch(0.90 0.013 78)",
                borderRadius: 4,
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 4,
                  background: "oklch(0.21 0 0 / 0.07)",
                  border: "1px solid oklch(0.21 0 0 / 0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <BookOpen size={16} style={{ color: "oklch(0.21 0 0)" }} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: "'Inter', system-ui, sans-serif",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "oklch(0.21 0 0)",
                    marginBottom: 2,
                  }}
                >
                  {arch.shortName}
                </div>
                <div
                  style={{
                    fontFamily: "'Inter', system-ui, sans-serif",
                    fontSize: 12,
                    color: "oklch(0.51 0 0)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {arch.description}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  flexShrink: 0,
                }}
              >
                {attempts > 0 && (
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 13,
                      fontWeight: 700,
                      color:
                        accuracy >= 80
                          ? "oklch(0.44 0.15 150)"
                          : accuracy >= 60
                            ? "oklch(0.48 0.16 68)"
                            : "oklch(0.38 0.20 22)",
                    }}
                  >
                    {accuracy}%
                  </span>
                )}
                {arch.verificationStatus === "verified" && (
                  <CheckCircle2
                    size={14}
                    style={{ color: "oklch(0.44 0.15 150)" }}
                  />
                )}
                <ChevronRight
                  size={14}
                  style={{ color: "oklch(0.69 0 0)" }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
