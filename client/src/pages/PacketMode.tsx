/* ============================================================
   REPS — Packet Mode  v2.1
   Mobile-first · Stacked layout on mobile · CSS variables
   ============================================================ */

import { useState } from "react";
import { Download, CheckSquare, Square } from "lucide-react";
import { CONTENT_ARCHETYPES as ARCHETYPES } from "@/lib/content/catalog";
import { useIsMobile } from "@/hooks/useMobile";

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
  const isMobile = useIsMobile();

  const toggleArch = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handlePrint = () => window.print();

  const checkboxStyle = (active: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 10px",
    minHeight: 40,
    background: "transparent",
    border: "none",
    color: active ? "var(--foreground)" : "var(--muted-foreground)",
    fontFamily: "'IBM Plex Sans', sans-serif",
    fontSize: 13,
    cursor: "pointer",
    textAlign: "left",
    borderRadius: 4,
    transition: "color 150ms",
    WebkitTapHighlightColor: "transparent",
    width: "100%",
  });

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 700, color: "var(--foreground)", marginBottom: 4 }}>
          Packet
        </h1>
        <p style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 14, color: "var(--muted-foreground)", margin: 0 }}>
          Generate a printable reference packet for exam day. Select archetypes and sections.
        </p>
      </div>

      {/* On mobile: controls above preview. On desktop: sidebar + preview */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "220px 1fr", gap: 16 }}>

        {/* Controls */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Archetype selector — 2-col on mobile */}
          <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, padding: 14 }}>
            <div className="section-label" style={{ marginBottom: 10 }}>ARCHETYPES</div>
            <div style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "1fr",
              gap: 2,
            }}>
              {ARCHETYPES.map(arch => (
                <button key={arch.id} onClick={() => toggleArch(arch.id)} style={checkboxStyle(selected.has(arch.id))}>
                  {selected.has(arch.id)
                    ? <CheckSquare size={14} style={{ color: "var(--foreground)", flexShrink: 0 }} aria-hidden="true" />
                    : <Square size={14} style={{ flexShrink: 0 }} aria-hidden="true" />}
                  {arch.shortName}
                </button>
              ))}
            </div>
          </div>

          {/* Section selector — 2-col on mobile */}
          <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, padding: 14 }}>
            <div className="section-label" style={{ marginBottom: 10 }}>SECTIONS</div>
            <div style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "1fr",
              gap: 2,
            }}>
              {([
                ["triggers", "Triggers"],
                ["formula", "Formula"],
                ["worked", "Worked Example"],
                ["traps", "Trap Box"],
              ] as [keyof typeof sections, string][]).map(([key, label]) => (
                <button key={key} onClick={() => setSections(s => ({ ...s, [key]: !s[key] }))} style={checkboxStyle(sections[key])}>
                  {sections[key]
                    ? <CheckSquare size={14} style={{ color: "var(--foreground)", flexShrink: 0 }} aria-hidden="true" />
                    : <Square size={14} style={{ flexShrink: 0 }} aria-hidden="true" />}
                  {label}
                </button>
              ))}
            </div>
          </div>

          <button onClick={handlePrint} className="btn-primary" style={{ width: "100%", justifyContent: "center" }}>
            <Download size={14} aria-hidden="true" />
            Print / Export PDF
          </button>
        </div>

        {/* Preview */}
        <div style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: 8,
          padding: 20,
          maxHeight: isMobile ? "60vh" : "72vh",
          overflowY: "auto",
        }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 15, fontWeight: 700, color: "var(--foreground)", marginBottom: 4 }}>
            REPS — OPNS-430 Reference Packet
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "var(--muted-foreground)", marginBottom: 20, letterSpacing: "0.08em" }}>
            {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} · {selected.size} archetypes
          </div>

          {ARCHETYPES.filter(a => selected.has(a.id)).map((arch, i) => (
            <div key={arch.id} style={{
              marginBottom: 24,
              paddingBottom: 24,
              borderBottom: i < selected.size - 1 ? "1px solid var(--border)" : "none",
            }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700, color: "var(--foreground)", marginBottom: 10 }}>
                {i + 1}. {arch.shortName}
                <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 12, fontWeight: 400, color: "var(--muted-foreground)", marginLeft: 8 }}>
                  {arch.description}
                </span>
              </div>

              {sections.triggers && (
                <div style={{ marginBottom: 10 }}>
                  <div className="section-label" style={{ marginBottom: 6 }}>TRIGGERS</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {(arch.triggers as string[]).map(t => (
                      <span key={t} className="trigger-chip" style={{ fontSize: 11 }}>{t}</span>
                    ))}
                  </div>
                </div>
              )}

              {sections.formula && (
                <div style={{ marginBottom: 10 }}>
                  <div className="formula-display" style={{ fontSize: 13, padding: "8px 12px" }}>
                    {arch.formula as string}
                  </div>
                </div>
              )}

              {sections.worked && (
                <div style={{ marginBottom: 10 }}>
                  <div className="section-label" style={{ marginBottom: 4 }}>WORKED EXAMPLE</div>
                  <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 12, color: "var(--foreground)", lineHeight: 1.6 }}>
                    {(arch.workedExample as { solution: string }).solution}
                  </div>
                </div>
              )}

              {sections.traps && (
                <div>
                  <div className="section-label" style={{ marginBottom: 6, color: "var(--color-error)" }}>TRAPS</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    {(arch.trapNotes as string[]).map((t, ti) => (
                      <div key={ti} style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 12, color: "var(--foreground)" }}>
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
