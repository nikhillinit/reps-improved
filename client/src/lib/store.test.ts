import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CONTENT_ARCHETYPES,
  CONTENT_PRACTICE_ITEMS,
  CONTENT_ROUTER_STEMS,
} from "./content/catalog";
import {
  LEGACY_STORE_KEY,
  STORE_KEY,
  exportStore,
  importStoreFromJson,
  loadStore,
  resetStore,
  saveStore,
  type RepsStore,
} from "./store";

function installLocalStorage() {
  const values = new Map<string, string>();
  const storage: Storage = {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key: string) => values.get(key) ?? null,
    key: (index: number) => Array.from(values.keys())[index] ?? null,
    removeItem: (key: string) => {
      values.delete(key);
    },
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };

  vi.stubGlobal("localStorage", storage);
}

describe("store v3 persistence", () => {
  beforeEach(() => {
    installLocalStorage();
    vi.spyOn(Date, "now").mockReturnValue(1_700_000_000_000);
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("migrates valid reps_v2 data into reps_v3 and preserves compatible history", () => {
    const item = CONTENT_PRACTICE_ITEMS[0];
    const routerStem = CONTENT_ROUTER_STEMS[0];
    const legacyStore = {
      settings: {
        retrieveFirst: false,
        timerDefault: 90,
        hideTimer: true,
      },
      practiceAttempts: [
        {
          id: "practice_valid",
          archetypeId: item.archetypeId,
          stemId: item.id,
          rating: "partial",
          rootCauseIds: [],
          timestamp: 1,
          mode: "practice",
          timeSpent: 5000,
        },
      ],
      routerAttempts: [
        {
          id: "router_valid",
          stem: routerStem.stem,
          correctArchetypeId: routerStem.correctId,
          selectedArchetypeId: routerStem.correctId,
          isCorrect: true,
          timestamp: 2,
          timeSpent: 3000,
        },
      ],
      cards: [
        {
          id: "card_valid",
          archetypeId: item.archetypeId,
          cardType: "practice",
          dueAt: 3,
          interval: 1,
          easeFactor: 2.5,
          reps: 1,
          lapses: 0,
          verificationStatus: "verified",
        },
      ],
      lastUpdated: 4,
    };

    localStorage.setItem(LEGACY_STORE_KEY, JSON.stringify(legacyStore));

    const migrated = loadStore();

    expect(migrated.version).toBe(3);
    expect(migrated.settings).toEqual(legacyStore.settings);
    expect(migrated.practiceAttempts).toHaveLength(1);
    expect(migrated.practiceAttempts[0]).toMatchObject({
      id: "practice_valid",
      problemItemId: item.id,
      stemId: item.id,
    });
    expect(migrated.routerAttempts[0]).toMatchObject({
      id: "router_valid",
      routerStemId: routerStem.id,
    });
    expect(migrated.cards[0]).toMatchObject({
      id: "card_valid",
      archetypeId: item.archetypeId,
    });
    expect(migrated.quarantinedRecords).toEqual([]);
    expect(JSON.parse(localStorage.getItem(STORE_KEY) ?? "{}").version).toBe(3);
  });

  it("drops unknown IDs from active state and records explicit quarantine entries", () => {
    const item = CONTENT_PRACTICE_ITEMS[0];
    const routerStem = CONTENT_ROUTER_STEMS[0];
    localStorage.setItem(
      LEGACY_STORE_KEY,
      JSON.stringify({
        settings: {
          retrieveFirst: true,
          timerDefault: 60,
          hideTimer: false,
        },
        practiceAttempts: [
          {
            id: "practice_unknown_arch",
            archetypeId: "missing_arch",
            stemId: item.id,
            rating: "correct",
            rootCauseIds: [],
            timestamp: 1,
            mode: "practice",
          },
          {
            id: "practice_unknown_problem",
            archetypeId: item.archetypeId,
            stemId: "missing_problem",
            rating: "correct",
            rootCauseIds: [],
            timestamp: 2,
            mode: "practice",
          },
          {
            id: "practice_unknown_root",
            archetypeId: item.archetypeId,
            stemId: item.id,
            rating: "incorrect",
            rootCauseIds: ["missing_root"],
            timestamp: 3,
            mode: "practice",
          },
        ],
        routerAttempts: [
          {
            id: "router_unknown_selected",
            stem: routerStem.stem,
            correctArchetypeId: routerStem.correctId,
            selectedArchetypeId: "missing_arch",
            isCorrect: false,
            timestamp: 4,
          },
        ],
        cards: [
          {
            id: "card_unknown_arch",
            archetypeId: "missing_arch",
            cardType: "practice",
            dueAt: 5,
            interval: 1,
            easeFactor: 2.5,
            reps: 0,
            lapses: 0,
            verificationStatus: "verified",
          },
        ],
      })
    );

    const migrated = loadStore();

    expect(migrated.practiceAttempts).toEqual([]);
    expect(migrated.routerAttempts).toEqual([]);
    expect(migrated.cards).toEqual([]);
    expect(migrated.quarantinedRecords.map(record => record.path)).toEqual(
      expect.arrayContaining([
        "practiceAttempts[0]",
        "practiceAttempts[1]",
        "practiceAttempts[2]",
        "routerAttempts[0]",
        "cards[0]",
      ])
    );
    expect(migrated.quarantinedRecords).toHaveLength(5);
    expect(
      migrated.quarantinedRecords.every(record => record.reason.length > 0)
    ).toBe(true);
  });

  it("imports valid backups transactionally and rolls back malformed imports", () => {
    const item = CONTENT_PRACTICE_ITEMS[0];
    const current: RepsStore = {
      version: 3,
      cards: [],
      practiceAttempts: [],
      routerAttempts: [],
      routerDiagnostics: [],
      settings: {
        retrieveFirst: true,
        timerDefault: 60,
        hideTimer: false,
      },
      quarantinedRecords: [],
      lastUpdated: 10,
    };
    saveStore(current);
    const before = localStorage.getItem(STORE_KEY);

    const badResult = importStoreFromJson("{not-json");

    expect(badResult.ok).toBe(false);
    expect(localStorage.getItem(STORE_KEY)).toBe(before);

    const incompleteResult = importStoreFromJson(
      JSON.stringify({
        settings: {
          retrieveFirst: false,
        },
      })
    );

    expect(incompleteResult.ok).toBe(false);
    expect(localStorage.getItem(STORE_KEY)).toBe(before);

    const malformedResult = importStoreFromJson(
      JSON.stringify({
        version: 3,
        cards: "not-an-array",
        practiceAttempts: [],
        routerAttempts: [],
      })
    );

    expect(malformedResult.ok).toBe(false);
    expect(localStorage.getItem(STORE_KEY)).toBe(before);

    const goodResult = importStoreFromJson(
      JSON.stringify({
        version: 3,
        cards: [
          {
            id: "imported_card",
            archetypeId: item.archetypeId,
            problemItemId: item.id,
            cardType: "practice",
            dueAt: 1,
            interval: 2,
            easeFactor: 2.4,
            reps: 3,
            lapses: 0,
            verificationStatus: "verified",
          },
        ],
        practiceAttempts: [],
        routerAttempts: [],
        routerDiagnostics: [],
        settings: {
          retrieveFirst: false,
          timerDefault: 120,
          hideTimer: true,
        },
        quarantinedRecords: [],
        lastUpdated: 12,
      })
    );

    expect(goodResult.ok).toBe(true);
    expect(loadStore().cards[0]).toMatchObject({
      id: "imported_card",
      problemItemId: item.id,
    });
    expect(loadStore().settings.timerDefault).toBe(120);
  });

  it("exports the current v3 store under the new key and reset clears both versions", () => {
    const store = loadStore();

    const exported = JSON.parse(exportStore());

    expect(exported.version).toBe(3);

    localStorage.setItem(LEGACY_STORE_KEY, "{}");
    resetStore();

    expect(localStorage.getItem(STORE_KEY)).toBeNull();
    expect(localStorage.getItem(LEGACY_STORE_KEY)).toBeNull();
    expect(store.settings.retrieveFirst).toBe(true);
    expect(CONTENT_ARCHETYPES.length).toBeGreaterThan(0);
  });

  it("exports read-only and does not overwrite newer persisted state with stale snapshots", () => {
    const item = CONTENT_PRACTICE_ITEMS[0];
    const current: RepsStore = {
      version: 3,
      cards: [
        {
          id: "current_card",
          archetypeId: item.archetypeId,
          problemItemId: item.id,
          cardType: "practice",
          dueAt: 1,
          interval: 1,
          easeFactor: 2.5,
          reps: 1,
          lapses: 0,
          verificationStatus: "verified",
        },
      ],
      practiceAttempts: [],
      routerAttempts: [],
      routerDiagnostics: [],
      settings: {
        retrieveFirst: true,
        timerDefault: 60,
        hideTimer: false,
      },
      quarantinedRecords: [],
      lastUpdated: 10,
    };
    const staleSnapshot: RepsStore = {
      ...current,
      cards: [],
      lastUpdated: 5,
    };

    saveStore(current);
    const beforeExport = localStorage.getItem(STORE_KEY);
    const exported = JSON.parse(exportStore(staleSnapshot));

    expect(exported.cards).toEqual([]);
    expect(localStorage.getItem(STORE_KEY)).toBe(beforeExport);
    expect(loadStore().cards[0]).toMatchObject({ id: "current_card" });
  });
});
