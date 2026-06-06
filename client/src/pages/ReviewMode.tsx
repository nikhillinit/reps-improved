/* ============================================================
   REPS — Review Mode  v2.1
   Mobile-first · Full-width tabs · CSS variables
   ============================================================ */

import { useState } from "react";
import { useLocation } from "wouter";
import { BarChart2, AlertTriangle, Wrench } from "lucide-react";
import { loadStore, getAccuracy, getDuePatchItems, getOpenErrorItems } from "@/lib/store";
import { CONTENT_ARCHETYPES as ARCHETYPES, CONTENT_ARCHETYPE_MAP as ARCHETYPE_MAP, CONTENT_PRACTICE_ITEM_MAP } from "@/lib/content/catalog";
import { useIsMobile } from "@/hooks/useMobile";

type Tab = "errors" | "trapmap" | "patch";

export default function ReviewMode() {
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<Tab>("errors");
  const store = loadStore();
  const isMobile = useIsMobile();

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 700, color: "var(--foreground)", marginBottom: 4 }}>
          Review
        </h1>
        <p style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 14, color: "var(--muted-foreground)", margin: 0 }}>
          Analyze errors, identify trap patterns, and work through the patch queue.
        </p>
      </div>

      {/* Tabs — full-width on mobile */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "repeat(3, 1fr)" : "repeat(3, auto)",
        gap: 4,
        marginBottom: 20,
        background: "var(--muted)",
        padding: 4,
        borderRadius: 8,
        border: "1px solid var(--border)",
        width: isMobile ? "100%" : "fit-content",
      }}>
        {([
          ["errors", "Error Log", <BarChart2 size={14} aria-hidden="true" />],
          ["trapmap", "Trap Map", <AlertTriangle size={14} aria-hidden="true" />],
          ["patch", "Patch Queue", <Wrench size={14} aria-hidden="true" />],
        ] as [Tab, string, React.ReactNode][]).map(([t, label, icon]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            aria-pressed={tab === t}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              padding: isMobile ? "10px 8px" : "8px 16px",
              minHeight: 40,
              background: tab === t ? "var(--foreground)" : "transparent",
              border: "none",
              borderRadius: 5,
              color: tab === t ? "var(--background)" : "var(--muted-foreground)",
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontSize: isMobile ? 12 : 13,
              fontWeight: tab === t ? 600 : 400,
              cursor: "pointer",
              transition: "all 150ms",
              whiteSpace: "nowrap",
            }}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      {tab === "errors" && <ErrorLog store={store} />}
      {tab === "trapmap" && <TrapMap store={store} />}
      {tab === "patch" && <PatchQueue store={store} navigate={navigate} />}
    </div>
  );
}

function ErrorLog({ store }: { store: ReturnType<typeof loadStore> }) {
  const archetypeStats = ARCHETYPES.map(arch => {
    const attempts = store.practiceAttempts.filter(a => a.archetypeId === arch.id);
    const accuracy = getAccuracy(store.practiceAttempts, arch.id);
    const recentAttempts = [...attempts].sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);
    return { arch, attempts, accuracy, recentAttempts };
  }).sort((a, b) => {
    if (a.attempts.length === 0 && b.attempts.length === 0) return 0;
    if (a.attempts.length === 0) return 1;
    if (b.attempts.length === 0) return -1;
    return a.accuracy - b.accuracy;
  });

  if (store.practiceAttempts.length === 0) {
    return (
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, padding: 32, textAlign: "center" }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "var(--muted-foreground)" }}>
          No practice attempts yet. Start a Practice session to see your error log.
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {archetypeStats.filter(s => s.attempts.length > 0).map(({ arch, attempts, accuracy, recentAttempts }) => {
        const accuracyColor = accuracy >= 80 ? "var(--color-correct)" : accuracy >= 60 ? "var(--color-warn)" : "var(--color-error)";
        return (
          <div key={arch.id} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 6, padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 14, fontWeight: 600, color: "var(--foreground)" }}>
                {arch.shortName}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 700, color: accuracyColor }}>
                  {accuracy}%
                </span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--muted-foreground)" }}>
                  {attempts.length} reps
                </span>
              </div>
            </div>
            <div style={{ height: 4, background: "var(--border)", borderRadius: 2, overflow: "hidden", marginBottom: 8 }}>
              <div style={{ height: "100%", width: `${accuracy}%`, background: accuracyColor, borderRadius: 2, transition: "width 600ms ease-out" }} />
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {recentAttempts.map(a => (
                <div key={a.id} style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: a.rating === "correct" ? "var(--color-correct)" : a.rating === "partial" ? "var(--color-warn)" : "var(--color-error)",
                }} title={a.rating} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TrapMap({ store }: { store: ReturnType<typeof loadStore> }) {
  const rootCauseFreq: Record<string, { label: string; count: number; archetypeId: string }> = {};
  store.practiceAttempts.filter(a => a.rating === "incorrect").forEach(a => {
    const arch = ARCHETYPE_MAP[a.archetypeId];
    if (!arch) return;
    (a.rootCauseIds as string[]).forEach(rcId => {
      const rc = (arch.rootCauses as Array<{ id: string; label: string }>).find(r => r.id === rcId);
      if (!rc) return;
      if (!rootCauseFreq[rcId]) rootCauseFreq[rcId] = { label: rc.label, count: 0, archetypeId: a.archetypeId };
      rootCauseFreq[rcId].count++;
    });
  });

  const sorted = Object.entries(rootCauseFreq).sort((a, b) => b[1].count - a[1].count);

  if (sorted.length === 0) {
    return (
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, padding: 32, textAlign: "center" }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "var(--muted-foreground)" }}>
          No root causes logged yet. Rate attempts as Incorrect and tag root causes to populate the Trap Map.
        </div>
      </div>
    );
  }

  const maxCount = sorted[0][1].count;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 13, color: "var(--muted-foreground)", marginBottom: 4 }}>
        Most frequent error patterns across all sessions:
      </div>
      {sorted.map(([rcId, { label, count, archetypeId }]) => {
        const arch = ARCHETYPE_MAP[archetypeId];
        const barWidth = (count / maxCount) * 100;
        return (
          <div key={rcId} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 6, padding: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div>
                <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>{label}</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "var(--muted-foreground)", marginLeft: 8 }}>{arch?.shortName}</span>
              </div>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700, color: "var(--color-error)" }}>{count}×</span>
            </div>
            <div style={{ height: 4, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${barWidth}%`, background: "var(--color-error)", borderRadius: 2 }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PatchQueue({ store, navigate }: { store: ReturnType<typeof loadStore>; navigate: (path: string) => void }) {
  const dueItems = getDuePatchItems(store);
  const dueItemIds = new Set(dueItems.map(item => item.id));
  const laterItems = getOpenErrorItems(store).filter(item => !dueItemIds.has(item.id));

  const patchItems = [...dueItems, ...laterItems].map(item => {
    const arch = ARCHETYPE_MAP[item.archetypeId];
    const rootCauses = item.latestAttempt.rootCauseIds.map(rcId => {
      const rc = arch?.rootCauses.find(rootCause => rootCause.id === rcId);
      return rc?.label || rcId;
    });
    const problemItem = item.problemItemId ? CONTENT_PRACTICE_ITEM_MAP[item.problemItemId] : undefined;
    const dueNow = dueItemIds.has(item.id);
    const minutesUntilDue = Math.ceil((item.dueAt - Date.now()) / 60000);
    const dueLabel = dueNow ? "due now" : minutesUntilDue < 60 ? `due in ${Math.max(1, minutesUntilDue)}m` : `due in ${Math.ceil(minutesUntilDue / 60)}h`;
    const practicePath = item.problemItemId
      ? `/practice/${item.archetypeId}?problemItemId=${encodeURIComponent(item.problemItemId)}`
      : `/practice/${item.archetypeId}`;
    return { item, arch, problemItem, lastAttempt: item.latestAttempt, rootCauses, dueNow, dueLabel, practicePath };
  });

  if (patchItems.length === 0) {
    return (
      <div style={{ background: "var(--card)", border: "1px solid var(--color-correct-border)", borderLeft: "3px solid var(--color-correct)", borderRadius: "0 6px 6px 0", padding: 24 }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "var(--color-correct)" }}>
          ✓ Patch queue is empty — no open errors.
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 4 }}>
        <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 13, color: "var(--muted-foreground)" }}>
          {dueItems.length} due now / {laterItems.length} due later
        </div>
        <button
          onClick={() => navigate("/practice")}
          disabled={dueItems.length === 0}
          className={dueItems.length > 0 ? "btn-primary" : "btn-secondary"}
          style={{ opacity: dueItems.length === 0 ? 0.45 : 1, cursor: dueItems.length === 0 ? "not-allowed" : "pointer" }}
        >
          Practice due patches
        </button>
      </div>

      <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 13, color: "var(--muted-foreground)", marginBottom: 4 }}>
        Item-level patches from the latest miss or partial:
      </div>

      {patchItems.map(({ item, arch, problemItem, lastAttempt, rootCauses, dueNow, dueLabel, practicePath }) => (
        <div key={item.id} style={{
          background: "var(--card)",
          border: `1px solid ${dueNow ? "var(--color-error-border)" : "var(--border)"}`,
          borderLeft: `3px solid ${dueNow ? "var(--color-error)" : "var(--border)"}`,
          borderRadius: "0 6px 6px 0",
          padding: 16,
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8, gap: 8 }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 14, fontWeight: 600, color: "var(--foreground)" }}>
                {arch?.shortName ?? item.archetypeId}
              </div>
              <div style={{ marginTop: 4, fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 12, color: "var(--muted-foreground)", lineHeight: 1.5 }}>
                {problemItem?.text ?? "Archetype-level retest"}
              </div>
            </div>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              color: dueNow ? "var(--color-error)" : "var(--muted-foreground)",
              flexShrink: 0,
              padding: "2px 6px",
              background: dueNow ? "var(--color-error-bg)" : "var(--muted)",
              borderRadius: 3,
            }}>
              {dueLabel}
            </span>
          </div>

          {rootCauses.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
              {rootCauses.map(rc => (
                <span key={rc} className="trap-chip">! {rc}</span>
              ))}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "var(--muted-foreground)" }}>
              Latest: {lastAttempt.rating}
            </span>
            <button
              onClick={() => navigate(practicePath)}
              className="btn-secondary"
              style={{ fontSize: 12, padding: "6px 12px", minHeight: 36 }}
            >
              Mark by retest
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
