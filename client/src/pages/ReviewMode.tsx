/* ============================================================
   REPS — Review Mode
   Terminal Precision: Error Log + Trap Map + Patch Queue
   ============================================================ */

import { useState } from "react";
import { useLocation } from "wouter";
import { BarChart2, AlertTriangle, Wrench, TrendingUp } from "lucide-react";
import {
  loadStore,
  getAccuracy,
  getDuePatchItems,
  getOpenErrorItems,
} from "@/lib/store";
import {
  CONTENT_ARCHETYPES as ARCHETYPES,
  CONTENT_ARCHETYPE_MAP as ARCHETYPE_MAP,
  CONTENT_PRACTICE_ITEM_MAP,
} from "@/lib/content/catalog";

type Tab = "errors" | "trapmap" | "patch";

export default function ReviewMode() {
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<Tab>("errors");
  const store = loadStore();

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
          Review
        </h1>
        <p
          style={{
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: 14,
            color: "oklch(0.28 0 0)",
          }}
        >
          Analyze your errors, identify trap patterns, and work through the
          patch queue.
        </p>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: 2,
          marginBottom: 24,
          background: "oklch(0.97 0.003 87)",
          padding: 4,
          borderRadius: 4,
          border: "1px solid oklch(0.90 0.013 78)",
          width: "fit-content",
        }}
      >
        {(
          [
            ["errors", "Error Log", <BarChart2 size={13} />],
            ["trapmap", "Trap Map", <AlertTriangle size={13} />],
            ["patch", "Patch Queue", <Wrench size={13} />],
          ] as [Tab, string, React.ReactNode][]
        ).map(([t, label, icon]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 14px",
              background: tab === t ? "oklch(0.21 0 0)" : "transparent",
              border: "none",
              borderRadius: 3,
              color:
                tab === t ? "oklch(1 0 0)" : "oklch(0.51 0 0)",
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: 13,
              fontWeight: tab === t ? 600 : 400,
              cursor: "pointer",
              transition: "all 150ms",
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
    const attempts = store.practiceAttempts.filter(
      a => a.archetypeId === arch.id
    );
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
      <div
        style={{
          background: "oklch(1 0 0)",
          border: "1px solid oklch(0.90 0.013 78)",
          borderRadius: 4,
          padding: 32,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 13,
            color: "oklch(0.51 0 0)",
          }}
        >
          No practice attempts yet. Start a Practice session to see your error
          log.
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {archetypeStats
        .filter(s => s.attempts.length > 0)
        .map(({ arch, attempts, accuracy, recentAttempts }) => {
          const accuracyColor =
            accuracy >= 80
              ? "oklch(0.44 0.15 150)"
              : accuracy >= 60
                ? "oklch(0.48 0.16 68)"
                : "oklch(0.38 0.20 22)";
          return (
            <div
              key={arch.id}
              style={{
                background: "oklch(1 0 0)",
                border: "1px solid oklch(0.90 0.013 78)",
                borderRadius: 4,
                padding: 16,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    fontFamily: "'Inter', system-ui, sans-serif",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "oklch(0.21 0 0)",
                  }}
                >
                  {arch.shortName}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 13,
                      fontWeight: 700,
                      color: accuracyColor,
                    }}
                  >
                    {accuracy}%
                  </span>
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 11,
                      color: "oklch(0.51 0 0)",
                    }}
                  >
                    {attempts.length} attempts
                  </span>
                </div>
              </div>
              {/* Mini accuracy bar */}
              <div
                style={{
                  height: 4,
                  background: "oklch(0.90 0.013 78)",
                  borderRadius: 2,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${accuracy}%`,
                    background: accuracyColor,
                    borderRadius: 2,
                    transition: "width 600ms ease-out",
                  }}
                />
              </div>
              {/* Recent attempts dots */}
              <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
                {recentAttempts.map(a => (
                  <div
                    key={a.id}
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background:
                        a.rating === "correct"
                          ? "oklch(0.44 0.15 150)"
                          : a.rating === "partial"
                            ? "oklch(0.48 0.16 68)"
                            : "oklch(0.38 0.20 22)",
                    }}
                    title={a.rating}
                  />
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
  const rootCauseFreq: Record<
    string,
    { label: string; count: number; archetypeId: string }
  > = {};
  store.practiceAttempts
    .filter(a => a.rating === "incorrect")
    .forEach(a => {
      const arch = ARCHETYPE_MAP[a.archetypeId];
      if (!arch) return;
      (a.rootCauseIds as string[]).forEach(rcId => {
        const rc = (
          arch.rootCauses as Array<{ id: string; label: string }>
        ).find(r => r.id === rcId);
        if (!rc) return;
        if (!rootCauseFreq[rcId])
          rootCauseFreq[rcId] = {
            label: rc.label,
            count: 0,
            archetypeId: a.archetypeId,
          };
        rootCauseFreq[rcId].count++;
      });
    });

  const sorted = Object.entries(rootCauseFreq).sort(
    (a, b) => b[1].count - a[1].count
  );

  if (sorted.length === 0) {
    return (
      <div
        style={{
          background: "oklch(1 0 0)",
          border: "1px solid oklch(0.90 0.013 78)",
          borderRadius: 4,
          padding: 32,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 13,
            color: "oklch(0.51 0 0)",
          }}
        >
          No root causes logged yet. Rate attempts as Incorrect and tag root
          causes to populate the Trap Map.
        </div>
      </div>
    );
  }

  const maxCount = sorted[0][1].count;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div
        style={{
          fontFamily: "'Inter', system-ui, sans-serif",
          fontSize: 13,
          color: "oklch(0.51 0 0)",
          marginBottom: 8,
        }}
      >
        Most frequent error patterns across all sessions:
      </div>
      {sorted.map(([rcId, { label, count, archetypeId }]) => {
        const arch = ARCHETYPE_MAP[archetypeId];
        const barWidth = (count / maxCount) * 100;
        return (
          <div
            key={rcId}
            style={{
              background: "oklch(1 0 0)",
              border: "1px solid oklch(0.90 0.013 78)",
              borderRadius: 4,
              padding: 14,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <div>
                <span
                  style={{
                    fontFamily: "'Inter', system-ui, sans-serif",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "oklch(0.21 0 0)",
                  }}
                >
                  {label}
                </span>
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 10,
                    color: "oklch(0.51 0 0)",
                    marginLeft: 8,
                  }}
                >
                  {arch?.shortName}
                </span>
              </div>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "oklch(0.38 0.20 22)",
                }}
              >
                {count}×
              </span>
            </div>
            <div
              style={{
                height: 4,
                background: "oklch(0.90 0.013 78)",
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${barWidth}%`,
                  background: "oklch(0.38 0.20 22)",
                  borderRadius: 2,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PatchQueue({
  store,
  navigate,
}: {
  store: ReturnType<typeof loadStore>;
  navigate: (path: string) => void;
}) {
  const dueItems = getDuePatchItems(store);
  const dueItemIds = new Set(dueItems.map(item => item.id));
  const laterItems = getOpenErrorItems(store).filter(
    item => !dueItemIds.has(item.id)
  );
  const patchItems = [...dueItems, ...laterItems].map(item => {
    const arch = ARCHETYPE_MAP[item.archetypeId];
    const rootCauses = item.latestAttempt.rootCauseIds.map(rcId => {
      const rc = arch?.rootCauses.find(rootCause => rootCause.id === rcId);
      return rc?.label || rcId;
    });
    const problemItem = item.problemItemId
      ? CONTENT_PRACTICE_ITEM_MAP[item.problemItemId]
      : undefined;
    const dueNow = dueItemIds.has(item.id);
    const minutesUntilDue = Math.ceil((item.dueAt - Date.now()) / 60000);
    const dueLabel = dueNow
      ? "due now"
      : minutesUntilDue < 60
        ? `due in ${Math.max(1, minutesUntilDue)}m`
        : `due in ${Math.ceil(minutesUntilDue / 60)}h`;
    const practicePath = item.problemItemId
      ? `/practice/${item.archetypeId}?problemItemId=${encodeURIComponent(
          item.problemItemId
        )}`
      : `/practice/${item.archetypeId}`;

    return {
      item,
      arch,
      problemItem,
      lastAttempt: item.latestAttempt,
      rootCauses,
      dueNow,
      dueLabel,
      practicePath,
    };
  });

  if (patchItems.length === 0) {
    return (
      <div
        style={{
          background: "oklch(1 0 0)",
          border: "1px solid oklch(0.44 0.15 150 / 0.15)",
          borderLeft: "3px solid oklch(0.44 0.15 150)",
          borderRadius: "0 4px 4px 0",
          padding: 24,
        }}
      >
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 13,
            color: "oklch(0.44 0.15 150)",
          }}
        >
          ✓ Patch queue is empty — no open errors.
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 4,
        }}
      >
        <div
          style={{
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: 13,
            color: "oklch(0.51 0 0)",
          }}
        >
          {dueItems.length} due now / {laterItems.length} due later
        </div>
        <button
          onClick={() => navigate("/practice")}
          disabled={dueItems.length === 0}
          style={{
            padding: "8px 14px",
            background:
              dueItems.length > 0 ? "oklch(0.21 0 0)" : "transparent",
            border: `1px solid ${
              dueItems.length > 0
                ? "oklch(0.21 0 0)"
                : "oklch(0.90 0.013 78)"
            }`,
            borderRadius: 4,
            color:
              dueItems.length > 0
                ? "oklch(1 0 0)"
                : "oklch(0.51 0 0)",
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: 13,
            fontWeight: 700,
            cursor: dueItems.length > 0 ? "pointer" : "not-allowed",
          }}
        >
          Practice due patches
        </button>
      </div>
      <div
        style={{
          fontFamily: "'Inter', system-ui, sans-serif",
          fontSize: 13,
          color: "oklch(0.51 0 0)",
          marginBottom: 4,
        }}
      >
        Item-level patches from the latest miss or partial:
      </div>
      {patchItems.map(
        ({
          item,
          arch,
          problemItem,
          lastAttempt,
          rootCauses,
          dueNow,
          dueLabel,
          practicePath,
        }) => (
          <div
            key={item.id}
            style={{
              background: "oklch(1 0 0)",
              border: `1px solid ${
                dueNow
                  ? "oklch(0.38 0.20 22 / 0.15)"
                  : "oklch(0.21 0 0 / 0.15)"
              }`,
              borderLeft: `3px solid ${
                dueNow ? "oklch(0.38 0.20 22)" : "oklch(0.21 0 0)"
              }`,
              borderRadius: "0 4px 4px 0",
              padding: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: "'Inter', system-ui, sans-serif",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "oklch(0.21 0 0)",
                  }}
                >
                  {arch?.shortName ?? item.archetypeId}
                </div>
                <div
                  style={{
                    marginTop: 4,
                    fontFamily: "'Inter', system-ui, sans-serif",
                    fontSize: 12,
                    color: "oklch(0.28 0 0)",
                    lineHeight: 1.5,
                  }}
                >
                  {problemItem?.text ?? "Archetype-level retest"}
                </div>
              </div>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  color: dueNow
                    ? "oklch(0.38 0.20 22)"
                    : "oklch(0.51 0 0)",
                }}
              >
                {dueLabel}
              </span>
            </div>
            {rootCauses.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {rootCauses.map(rc => (
                  <span key={rc} className="trap-chip">
                    ! {rc}
                  </span>
                ))}
              </div>
            )}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
                marginTop: 12,
              }}
            >
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  color: "oklch(0.51 0 0)",
                }}
              >
                Latest: {lastAttempt.rating}
              </span>
              <button
                onClick={() => navigate(practicePath)}
                style={{
                  padding: "6px 10px",
                  background: "transparent",
                  border: "1px solid oklch(0.21 0 0 / 0.25)",
                  borderRadius: 4,
                  color: "oklch(0.21 0 0)",
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = "oklch(0.21 0 0 / 0.06)";
                  e.currentTarget.style.borderColor = "oklch(0.21 0 0 / 0.22)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.borderColor = "oklch(0.21 0 0 / 0.25)";
                }}
              >
                Mark by retest
              </button>
            </div>
          </div>
        )
      )}
    </div>
  );
}
