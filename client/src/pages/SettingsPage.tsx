/* ============================================================
   REPS — Settings Page  v2.1
   Mobile-first · CSS variables · Touch-optimised buttons
   ============================================================ */

import { useState } from "react";
import { Trash2, Database, Download, Upload } from "lucide-react";
import { exportStore, importStoreFromJson, loadStore, resetStore, saveStore, seedQAData } from "@/lib/store";
import { CONTENT_ARCHETYPES as ARCHETYPES } from "@/lib/content/catalog";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/useMobile";

export default function SettingsPage() {
  const [store, setStore] = useState(loadStore());
  const isMobile = useIsMobile();

  const handleToggle = (key: keyof typeof store.settings) => {
    const updated = { ...store, settings: { ...store.settings, [key]: !store.settings[key] } };
    saveStore(updated);
    setStore(updated);
  };

  const handleTimerChange = (value: number) => {
    const updated = { ...store, settings: { ...store.settings, timerDefault: value } };
    saveStore(updated);
    setStore(updated);
  };

  const handleSeedQA = () => {
    const updated = seedQAData(ARCHETYPES);
    setStore(updated);
    toast.success("QA data seeded — 12 attempts + 6 cards added.");
  };

  const handleReset = () => {
    if (!window.confirm("Reset ALL data? This cannot be undone.")) return;
    resetStore();
    setStore(loadStore());
    toast.success("All data reset.");
  };

  const handleExport = () => {
    const json = exportStore();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reps-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Data exported.");
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = e => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        const result = importStoreFromJson(String(ev.target?.result ?? ""));
        if (!result.ok || !result.store) { toast.error(result.errors[0] ?? "Invalid backup file."); return; }
        setStore(result.store);
        if (result.warnings.length > 0) {
          toast.warning(`Data imported with ${result.warnings.length} quarantined record(s).`);
        } else {
          toast.success("Data imported successfully.");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const totalAttempts = store.practiceAttempts.length + store.routerAttempts.length;
  const totalCards = store.cards.length;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 700, color: "var(--foreground)", marginBottom: 4 }}>
          Settings
        </h1>
        <p style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 14, color: "var(--muted-foreground)", margin: 0 }}>
          Preferences, data management, and debug tools.
        </p>
      </div>

      {/* Stats */}
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <div className="section-label" style={{ marginBottom: 12 }}>DATA SUMMARY</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          <div className="stat-card">
            <div className="stat-value">{totalAttempts}</div>
            <div className="stat-label">Attempts</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{totalCards}</div>
            <div className="stat-label">SRS Cards</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{store.cards.filter(c => c.dueAt <= Date.now()).length}</div>
            <div className="stat-label">Due Now</div>
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <div className="section-label" style={{ marginBottom: 16 }}>PREFERENCES</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <ToggleRow
            label="Retrieve-First Mode"
            description="Attempt to recall before revealing the answer"
            value={store.settings.retrieveFirst}
            onChange={() => handleToggle("retrieveFirst")}
          />
          <ToggleRow
            label="Hide Timer"
            description="Don't show elapsed time during practice"
            value={store.settings.hideTimer}
            onChange={() => handleToggle("hideTimer")}
          />
          {/* Timer default — stacks on mobile */}
          <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "center", justifyContent: "space-between", gap: 10 }}>
            <div>
              <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>
                Default Timer (seconds)
              </div>
              <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 12, color: "var(--muted-foreground)" }}>
                Time allowed per question
              </div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {[30, 60, 90, 120].map(v => (
                <button
                  key={v}
                  onClick={() => handleTimerChange(v)}
                  style={{
                    padding: "8px 12px",
                    minHeight: 36,
                    background: store.settings.timerDefault === v ? "var(--foreground)" : "transparent",
                    border: `1px solid ${store.settings.timerDefault === v ? "var(--foreground)" : "var(--border)"}`,
                    borderRadius: 4,
                    color: store.settings.timerDefault === v ? "var(--background)" : "var(--foreground)",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 150ms",
                  }}
                >
                  {v}s
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <div className="section-label" style={{ marginBottom: 16 }}>DATA MANAGEMENT</div>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, auto)", gap: 8 }}>
          <ActionButton icon={<Download size={14} />} label="Export Backup" onClick={handleExport} />
          <ActionButton icon={<Upload size={14} />} label="Import Backup" onClick={handleImport} />
          <ActionButton icon={<Database size={14} />} label="Seed QA Data" onClick={handleSeedQA} />
          <ActionButton icon={<Trash2 size={14} />} label="Reset All Data" onClick={handleReset} danger />
        </div>
      </div>

      {/* About */}
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, padding: 16 }}>
        <div className="section-label" style={{ marginBottom: 12 }}>ABOUT</div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "var(--muted-foreground)", lineHeight: 1.8 }}>
          <div>REPS v2.1 — OPNS-430 Exam Drill (Improved)</div>
          <div>6 archetypes · SRS scheduling · localStorage persistence</div>
          <div style={{ marginTop: 8 }}>Improved from exam-drill.replit.app</div>
        </div>
      </div>
    </div>
  );
}

function ToggleRow({ label, description, value, onChange }: {
  label: string; description: string; value: boolean; onChange: () => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>{label}</div>
        <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 12, color: "var(--muted-foreground)" }}>{description}</div>
      </div>
      <button
        onClick={onChange}
        role="switch"
        aria-checked={value}
        aria-label={label}
        style={{
          width: 44,
          height: 24,
          background: value ? "var(--foreground)" : "var(--border)",
          border: "none",
          borderRadius: 12,
          cursor: "pointer",
          position: "relative",
          transition: "background 200ms",
          flexShrink: 0,
          WebkitTapHighlightColor: "transparent",
        }}
      >
        <div style={{
          width: 18,
          height: 18,
          background: "var(--card)",
          borderRadius: "50%",
          position: "absolute",
          top: 3,
          left: value ? 23 : 3,
          transition: "left 200ms ease-out",
          boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
        }} />
      </button>
    </div>
  );
}

function ActionButton({ icon, label, onClick, danger }: {
  icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        padding: "10px 14px",
        minHeight: 44,
        background: "transparent",
        border: `1px solid ${danger ? "var(--color-error-border)" : "var(--border)"}`,
        borderRadius: 6,
        color: danger ? "var(--color-error)" : "var(--foreground)",
        fontFamily: "'IBM Plex Sans', sans-serif",
        fontSize: 13,
        fontWeight: 500,
        cursor: "pointer",
        transition: "all 150ms",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      {icon}
      {label}
    </button>
  );
}
