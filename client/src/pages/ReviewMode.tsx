/* ============================================================
   REPS — Review Mode
   Terminal Precision: Error Log + Trap Map + Patch Queue
   ============================================================ */

import { useState } from "react";
import { BarChart2, AlertTriangle, Wrench, TrendingUp } from "lucide-react";
import { loadStore, getAccuracy, type PracticeAttempt } from "@/lib/store";
import { ARCHETYPES, ARCHETYPE_MAP } from "@/lib/archetypes";

type Tab = "errors" | "trapmap" | "patch";

export default function ReviewMode() {
  const [tab, setTab] = useState<Tab>("errors");
  const store = loadStore();

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 700, color: "oklch(0.91 0.005 265)", marginBottom: 4 }}>Review</h1>
        <p style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 14, color: "oklch(0.55 0.01 265)" }}>Analyze your errors, identify trap patterns, and work through the patch queue.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 2, marginBottom: 24, background: "oklch(0.17 0.012 265)", padding: 4, borderRadius: 4, border: "1px solid oklch(0.28 0.01 265)", width: "fit-content" }}>
        {([["errors", "Error Log", <BarChart2 size={13} />], ["trapmap", "Trap Map", <AlertTriangle size={13} />], ["patch", "Patch Queue", <Wrench size={13} />]] as [Tab, string, React.ReactNode][]).map(([t, label, icon]) => (
          <button key={t} onClick={() => setTab(t)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", background: tab === t ? "oklch(0.78 0.17 65)" : "transparent", border: "none", borderRadius: 3, color: tab === t ? "oklch(0.13 0.01 265)" : "oklch(0.50 0.01 265)", fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 13, fontWeight: tab === t ? 600 : 400, cursor: "pointer", transition: "all 150ms" }}>
            {icon}{label}
          </button>
        ))}
      </div>

      {tab === "errors" && <ErrorLog store={store} />}
      {tab === "trapmap" && <TrapMap store={store} />}
      {tab === "patch" && <PatchQueue store={store} />}
    </div>
  );
}

function ErrorLog({ store }: { store: ReturnType<typeof loadStore> }) {
  const archetypeStats = ARCHETYPES.map(arch => {
    const attempts = store.practiceAttempts.filter(a => a.archetypeId === arch.id);
    const accuracy = getAccuracy(store.practiceAttempts, arch.id);
    const lastAttempt = attempts.sort((a, b) => b.timestamp - a.timestamp)[0];
    const recentAttempts = attempts.slice(-5);
    return { arch, attempts, accuracy, lastAttempt, recentAttempts };
  }).sort((a, b) => {
    if (a.attempts.length === 0 && b.attempts.length === 0) return 0;
    if (a.attempts.length === 0) return 1;
    if (b.attempts.length === 0) return -1;
    return a.accuracy - b.accuracy;
  });

  if (store.practiceAttempts.length === 0) {
    return (
      <div style={{ background: "oklch(0.17 0.012 265)", border: "1px solid oklch(0.28 0.01 265)", borderRadius: 4, padding: 32, textAlign: "center" }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "oklch(0.40 0.01 265)" }}>No practice attempts yet. Start a Practice session to see your error log.</div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {archetypeStats.filter(s => s.attempts.length > 0).map(({ arch, attempts, accuracy, recentAttempts }) => {
        const accuracyColor = accuracy >= 80 ? "oklch(0.72 0.14 185)" : accuracy >= 60 ? "oklch(0.78 0.17 65)" : "oklch(0.62 0.22 25)";
        return (
          <div key={arch.id} style={{ background: "oklch(0.17 0.012 265)", border: "1px solid oklch(0.28 0.01 265)", borderRadius: 4, padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 14, fontWeight: 600, color: "oklch(0.91 0.005 265)" }}>{arch.shortName}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700, color: accuracyColor }}>{accuracy}%</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "oklch(0.40 0.01 265)" }}>{attempts.length} attempts</span>
              </div>
            </div>
            {/* Mini accuracy bar */}
            <div style={{ height: 4, background: "oklch(0.22 0.01 265)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${accuracy}%`, background: accuracyColor, borderRadius: 2, transition: "width 600ms ease-out" }} />
            </div>
            {/* Recent attempts dots */}
            <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
              {recentAttempts.map(a => (
                <div key={a.id} style={{ width: 8, height: 8, borderRadius: "50%", background: a.rating === "correct" ? "oklch(0.72 0.14 185)" : a.rating === "partial" ? "oklch(0.78 0.17 65)" : "oklch(0.62 0.22 25)" }} title={a.rating} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TrapMap({ store }: { store: ReturnType<typeof loadStore> }) {
  // Aggregate root causes across all incorrect attempts
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
      <div style={{ background: "oklch(0.17 0.012 265)", border: "1px solid oklch(0.28 0.01 265)", borderRadius: 4, padding: 32, textAlign: "center" }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "oklch(0.40 0.01 265)" }}>No root causes logged yet. Rate attempts as Incorrect and tag root causes to populate the Trap Map.</div>
      </div>
    );
  }

  const maxCount = sorted[0][1].count;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 13, color: "oklch(0.45 0.01 265)", marginBottom: 8 }}>Most frequent error patterns across all sessions:</div>
      {sorted.map(([rcId, { label, count, archetypeId }]) => {
        const arch = ARCHETYPE_MAP[archetypeId];
        const barWidth = (count / maxCount) * 100;
        return (
          <div key={rcId} style={{ background: "oklch(0.17 0.012 265)", border: "1px solid oklch(0.28 0.01 265)", borderRadius: 4, padding: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div>
                <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 13, fontWeight: 600, color: "oklch(0.85 0.005 265)" }}>{label}</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "oklch(0.40 0.01 265)", marginLeft: 8 }}>{arch?.shortName}</span>
              </div>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700, color: "oklch(0.62 0.22 25)" }}>{count}×</span>
            </div>
            <div style={{ height: 4, background: "oklch(0.22 0.01 265)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${barWidth}%`, background: "oklch(0.62 0.22 25)", borderRadius: 2 }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PatchQueue({ store }: { store: ReturnType<typeof loadStore> }) {
  // Find archetypes with recent incorrect attempts that haven't been corrected
  const patchItems = ARCHETYPES.map(arch => {
    const attempts = store.practiceAttempts
      .filter(a => a.archetypeId === arch.id)
      .sort((a, b) => a.timestamp - b.timestamp);
    const lastAttempt = attempts[attempts.length - 1];
    if (!lastAttempt || lastAttempt.rating !== "incorrect") return null;
    const rootCauses = (lastAttempt.rootCauseIds as string[]).map(rcId => {
      const rc = (arch.rootCauses as Array<{ id: string; label: string }>).find(r => r.id === rcId);
      return rc?.label || rcId;
    });
    return { arch, lastAttempt, rootCauses };
  }).filter(Boolean) as Array<{ arch: typeof ARCHETYPES[0]; lastAttempt: PracticeAttempt; rootCauses: string[] }>;

  if (patchItems.length === 0) {
    return (
      <div style={{ background: "oklch(0.17 0.012 265)", border: "1px solid oklch(0.72 0.14 185 / 0.3)", borderLeft: "3px solid oklch(0.72 0.14 185)", borderRadius: "0 4px 4px 0", padding: 24 }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "oklch(0.72 0.14 185)" }}>✓ Patch queue is empty — no open errors.</div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 13, color: "oklch(0.45 0.01 265)", marginBottom: 4 }}>
        {patchItems.length} archetype{patchItems.length > 1 ? "s" : ""} with unresolved errors:
      </div>
      {patchItems.map(({ arch, lastAttempt, rootCauses }) => (
        <div key={arch.id} style={{ background: "oklch(0.17 0.012 265)", border: "1px solid oklch(0.62 0.22 25 / 0.3)", borderLeft: "3px solid oklch(0.62 0.22 25)", borderRadius: "0 4px 4px 0", padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 14, fontWeight: 600, color: "oklch(0.91 0.005 265)" }}>{arch.shortName}</div>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "oklch(0.40 0.01 265)" }}>{new Date(lastAttempt.timestamp).toLocaleDateString()}</span>
          </div>
          {rootCauses.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {rootCauses.map(rc => <span key={rc} className="trap-chip">⚠ {rc}</span>)}
            </div>
          )}
          <div style={{ marginTop: 10, fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 12, color: "oklch(0.45 0.01 265)" }}>
            Recommended: Review the Trap Box for {arch.shortName}, then re-drill in Practice Mode.
          </div>
        </div>
      ))}
    </div>
  );
}
