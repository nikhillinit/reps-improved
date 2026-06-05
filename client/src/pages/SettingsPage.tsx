/* ============================================================
   REPS — Settings Page
   Terminal Precision: Preferences + data management
   ============================================================ */

import { useState } from "react";
import { Settings, Trash2, Database, Download, Upload } from "lucide-react";
import { loadStore, saveStore, resetStore, seedQAData } from "@/lib/store";
import { CONTENT_ARCHETYPES as ARCHETYPES } from "@/lib/content/catalog";
import { toast } from "sonner";

export default function SettingsPage() {
  const [store, setStore] = useState(loadStore());

  const handleToggle = (key: keyof typeof store.settings) => {
    const updated = {
      ...store,
      settings: { ...store.settings, [key]: !store.settings[key] },
    };
    saveStore(updated);
    setStore(updated);
  };

  const handleTimerChange = (value: number) => {
    const updated = {
      ...store,
      settings: { ...store.settings, timerDefault: value },
    };
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
    const json = JSON.stringify(store, null, 2);
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
        try {
          const parsed = JSON.parse(ev.target?.result as string);
          saveStore(parsed);
          setStore(parsed);
          toast.success("Data imported successfully.");
        } catch {
          toast.error("Invalid backup file.");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const totalAttempts =
    store.practiceAttempts.length + store.routerAttempts.length;
  const totalCards = store.cards.length;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 22,
            fontWeight: 700,
            color: "oklch(0.91 0.005 265)",
            marginBottom: 4,
          }}
        >
          Settings
        </h1>
        <p
          style={{
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: 14,
            color: "oklch(0.55 0.01 265)",
          }}
        >
          Preferences, data management, and debug tools.
        </p>
      </div>

      {/* Stats */}
      <div
        style={{
          background: "oklch(0.17 0.012 265)",
          border: "1px solid oklch(0.28 0.01 265)",
          borderRadius: 4,
          padding: 16,
          marginBottom: 20,
        }}
      >
        <div className="section-label" style={{ marginBottom: 12 }}>
          DATA SUMMARY
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 12,
          }}
        >
          <div className="stat-card" style={{ padding: "12px 16px" }}>
            <div className="stat-value" style={{ fontSize: 20 }}>
              {totalAttempts}
            </div>
            <div className="stat-label">Total Attempts</div>
          </div>
          <div className="stat-card" style={{ padding: "12px 16px" }}>
            <div className="stat-value" style={{ fontSize: 20 }}>
              {totalCards}
            </div>
            <div className="stat-label">SRS Cards</div>
          </div>
          <div className="stat-card" style={{ padding: "12px 16px" }}>
            <div className="stat-value" style={{ fontSize: 20 }}>
              {store.cards.filter(c => c.dueAt <= Date.now()).length}
            </div>
            <div className="stat-label">Cards Due</div>
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div
        style={{
          background: "oklch(0.17 0.012 265)",
          border: "1px solid oklch(0.28 0.01 265)",
          borderRadius: 4,
          padding: 16,
          marginBottom: 20,
        }}
      >
        <div className="section-label" style={{ marginBottom: 16 }}>
          PREFERENCES
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
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
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "oklch(0.85 0.005 265)",
                }}
              >
                Default Timer (seconds)
              </div>
              <div
                style={{
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  fontSize: 12,
                  color: "oklch(0.45 0.01 265)",
                }}
              >
                Time allowed per question
              </div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {[30, 60, 90, 120].map(v => (
                <button
                  key={v}
                  onClick={() => handleTimerChange(v)}
                  style={{
                    padding: "5px 10px",
                    background:
                      store.settings.timerDefault === v
                        ? "oklch(0.78 0.17 65)"
                        : "transparent",
                    border: `1px solid ${store.settings.timerDefault === v ? "oklch(0.78 0.17 65)" : "oklch(0.28 0.01 265)"}`,
                    borderRadius: 3,
                    color:
                      store.settings.timerDefault === v
                        ? "oklch(0.13 0.01 265)"
                        : "oklch(0.55 0.01 265)",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 12,
                    cursor: "pointer",
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
      <div
        style={{
          background: "oklch(0.17 0.012 265)",
          border: "1px solid oklch(0.28 0.01 265)",
          borderRadius: 4,
          padding: 16,
          marginBottom: 20,
        }}
      >
        <div className="section-label" style={{ marginBottom: 16 }}>
          DATA MANAGEMENT
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <ActionButton
            icon={<Download size={13} />}
            label="Export Backup"
            onClick={handleExport}
          />
          <ActionButton
            icon={<Upload size={13} />}
            label="Import Backup"
            onClick={handleImport}
          />
          <ActionButton
            icon={<Database size={13} />}
            label="Seed QA Data"
            onClick={handleSeedQA}
          />
          <ActionButton
            icon={<Trash2 size={13} />}
            label="Reset All Data"
            onClick={handleReset}
            danger
          />
        </div>
      </div>

      {/* About */}
      <div
        style={{
          background: "oklch(0.17 0.012 265)",
          border: "1px solid oklch(0.28 0.01 265)",
          borderRadius: 4,
          padding: 16,
        }}
      >
        <div className="section-label" style={{ marginBottom: 12 }}>
          ABOUT
        </div>
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 12,
            color: "oklch(0.40 0.01 265)",
            lineHeight: 1.8,
          }}
        >
          <div>REPS v2.0 — OPNS-430 Exam Drill (Improved)</div>
          <div>6 archetypes · SRS scheduling · localStorage persistence</div>
          <div style={{ marginTop: 8, color: "oklch(0.30 0.01 265)" }}>
            Improved from exam-drill.replit.app
          </div>
        </div>
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: boolean;
  onChange: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div>
        <div
          style={{
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: 13,
            fontWeight: 600,
            color: "oklch(0.85 0.005 265)",
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: 12,
            color: "oklch(0.45 0.01 265)",
          }}
        >
          {description}
        </div>
      </div>
      <button
        onClick={onChange}
        style={{
          width: 40,
          height: 22,
          background: value ? "oklch(0.78 0.17 65)" : "oklch(0.28 0.01 265)",
          border: "none",
          borderRadius: 11,
          cursor: "pointer",
          position: "relative",
          transition: "background 200ms",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 16,
            height: 16,
            background: "oklch(0.91 0.005 265)",
            borderRadius: "50%",
            position: "absolute",
            top: 3,
            left: value ? 21 : 3,
            transition: "left 200ms ease-out",
          }}
        />
      </button>
    </div>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  const color = danger ? "oklch(0.62 0.22 25)" : "oklch(0.55 0.01 265)";
  const hoverBorder = danger
    ? "oklch(0.62 0.22 25 / 0.5)"
    : "oklch(0.78 0.17 65 / 0.5)";
  const hoverColor = danger ? "oklch(0.62 0.22 25)" : "oklch(0.78 0.17 65)";
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "8px 14px",
        background: "transparent",
        border: `1px solid ${danger ? "oklch(0.62 0.22 25 / 0.3)" : "oklch(0.28 0.01 265)"}`,
        borderRadius: 4,
        color,
        fontFamily: "'IBM Plex Sans', sans-serif",
        fontSize: 13,
        cursor: "pointer",
        transition: "all 150ms",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = hoverBorder;
        e.currentTarget.style.color = hoverColor;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = danger
          ? "oklch(0.62 0.22 25 / 0.3)"
          : "oklch(0.28 0.01 265)";
        e.currentTarget.style.color = color;
      }}
    >
      {icon}
      {label}
    </button>
  );
}
