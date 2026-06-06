/* ============================================================
   REPS — Packet Mode
   Terminal Precision: Printable reference packet generator
   ============================================================ */

import { useState } from "react";
import { FileText, Download, CheckSquare, Square } from "lucide-react";
import { CONTENT_ARCHETYPES as ARCHETYPES } from "@/lib/content/catalog";

export default function PacketMode() {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(ARCHETYPES.map(a => a.id))
  );
  const [sections, setSections] = useState({
    formula: true,
    traps: true,
    worked: true,
    triggers: true,
  });

  const toggleArch = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handlePrint = () => window.print();

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 22,
            fontWeight: 700,
            color: "oklch(0.21 0 0)",
            marginBottom: 4,
          }}
        >
          Packet
        </h1>
        <p
          style={{
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: 14,
            color: "oklch(0.28 0 0)",
          }}
        >
          Generate a printable reference packet for exam day. Select archetypes
          and sections.
        </p>
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 20 }}
      >
        {/* Controls */}
        <div>
          <div
            style={{
              background: "oklch(1 0 0)",
              border: "1px solid oklch(0.90 0.013 78)",
              borderRadius: 4,
              padding: 16,
              marginBottom: 12,
            }}
          >
            <div className="section-label" style={{ marginBottom: 12 }}>
              ARCHETYPES
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {ARCHETYPES.map(arch => (
                <button
                  key={arch.id}
                  onClick={() => toggleArch(arch.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 8px",
                    background: "transparent",
                    border: "none",
                    color: selected.has(arch.id)
                      ? "oklch(0.21 0 0)"
                      : "oklch(0.51 0 0)",
                    fontFamily: "'Inter', system-ui, sans-serif",
                    fontSize: 13,
                    cursor: "pointer",
                    textAlign: "left",
                    borderRadius: 3,
                    transition: "color 150ms",
                  }}
                >
                  {selected.has(arch.id) ? (
                    <CheckSquare
                      size={13}
                      style={{ color: "oklch(0.21 0 0)", flexShrink: 0 }}
                    />
                  ) : (
                    <Square size={13} style={{ flexShrink: 0 }} />
                  )}
                  {arch.shortName}
                </button>
              ))}
            </div>
          </div>

          <div
            style={{
              background: "oklch(1 0 0)",
              border: "1px solid oklch(0.90 0.013 78)",
              borderRadius: 4,
              padding: 16,
              marginBottom: 12,
            }}
          >
            <div className="section-label" style={{ marginBottom: 12 }}>
              SECTIONS
            </div>
            {(
              [
                ["triggers", "Triggers & Disqualifiers"],
                ["formula", "Formula & Variables"],
                ["worked", "Worked Example"],
                ["traps", "Trap Box"],
              ] as [keyof typeof sections, string][]
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setSections(s => ({ ...s, [key]: !s[key] }))}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 8px",
                  background: "transparent",
                  border: "none",
                  color: sections[key]
                    ? "oklch(0.21 0 0)"
                    : "oklch(0.51 0 0)",
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontSize: 13,
                  cursor: "pointer",
                  textAlign: "left",
                  width: "100%",
                  borderRadius: 3,
                }}
              >
                {sections[key] ? (
                  <CheckSquare
                    size={13}
                    style={{ color: "oklch(0.21 0 0)", flexShrink: 0 }}
                  />
                ) : (
                  <Square size={13} style={{ flexShrink: 0 }} />
                )}
                {label}
              </button>
            ))}
          </div>

          <button
            onClick={handlePrint}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 16px",
              background: "oklch(0.21 0 0)",
              border: "none",
              borderRadius: 4,
              color: "oklch(1 0 0)",
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              width: "100%",
              justifyContent: "center",
            }}
            onMouseEnter={e =>
              (e.currentTarget.style.background = "oklch(0.14 0 0)")
            }
            onMouseLeave={e =>
              (e.currentTarget.style.background = "oklch(0.21 0 0)")
            }
          >
            <Download size={14} />
            Print / Export PDF
          </button>
        </div>

        {/* Preview */}
        <div
          style={{
            background: "oklch(1 0 0)",
            border: "1px solid oklch(0.90 0.013 78)",
            borderRadius: 4,
            padding: 24,
            maxHeight: "70vh",
            overflowY: "auto",
          }}
        >
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 16,
              fontWeight: 700,
              color: "oklch(0.21 0 0)",
              marginBottom: 4,
            }}
          >
            REPS — OPNS-430 Reference Packet
          </div>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              color: "oklch(0.51 0 0)",
              marginBottom: 24,
              letterSpacing: "0.08em",
            }}
          >
            {new Date().toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}{" "}
            · {selected.size} archetypes
          </div>
          {ARCHETYPES.filter(a => selected.has(a.id)).map((arch, i) => (
            <div
              key={arch.id}
              style={{
                marginBottom: 28,
                paddingBottom: 28,
                borderBottom:
                  i < selected.size - 1
                    ? "1px solid oklch(0.90 0.013 78)"
                    : "none",
              }}
            >
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 14,
                  fontWeight: 700,
                  color: "oklch(0.21 0 0)",
                  marginBottom: 12,
                }}
              >
                {i + 1}. {arch.shortName}
                <span
                  style={{
                    fontFamily: "'Inter', system-ui, sans-serif",
                    fontSize: 12,
                    fontWeight: 400,
                    color: "oklch(0.51 0 0)",
                    marginLeft: 10,
                  }}
                >
                  {arch.description}
                </span>
              </div>

              {sections.triggers && (
                <div style={{ marginBottom: 10 }}>
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 10,
                      color: "oklch(0.51 0 0)",
                      letterSpacing: "0.08em",
                      marginBottom: 6,
                    }}
                  >
                    TRIGGERS
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {(arch.triggers as string[]).map(t => (
                      <span
                        key={t}
                        className="trigger-chip"
                        style={{ fontSize: 11 }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {sections.formula && (
                <div style={{ marginBottom: 10 }}>
                  <div
                    className="formula-display"
                    style={{ fontSize: 13, padding: "8px 12px" }}
                  >
                    {arch.formula as string}
                  </div>
                </div>
              )}

              {sections.worked && (
                <div style={{ marginBottom: 10 }}>
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 10,
                      color: "oklch(0.51 0 0)",
                      letterSpacing: "0.08em",
                      marginBottom: 4,
                    }}
                  >
                    WORKED EXAMPLE
                  </div>
                  <div
                    style={{
                      fontFamily: "'Inter', system-ui, sans-serif",
                      fontSize: 12,
                      color: "oklch(0.28 0 0)",
                      lineHeight: 1.6,
                    }}
                  >
                    {(arch.workedExample as { solution: string }).solution}
                  </div>
                </div>
              )}

              {sections.traps && (
                <div>
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 10,
                      color: "oklch(0.38 0.20 22)",
                      letterSpacing: "0.08em",
                      marginBottom: 6,
                    }}
                  >
                    TRAPS
                  </div>
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 3 }}
                  >
                    {(arch.trapNotes as string[]).map((t, i) => (
                      <div
                        key={i}
                        style={{
                          fontFamily: "'Inter', system-ui, sans-serif",
                          fontSize: 12,
                          color: "oklch(0.28 0 0)",
                        }}
                      >
                        ⚠ {t}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
