/* ============================================================
   REPS — Core Data Store
   All state persisted to localStorage under key "reps_v2"
   ============================================================ */

export type Rating = "correct" | "incorrect" | "partial";
export type VerificationStatus = "verified" | "unverified" | "ai-generated-unverified";

export interface RootCause {
  id: string;
  label: string;
}

export interface Archetype {
  id: string;
  name: string;
  shortName: string;
  description: string;
  triggers: string[];
  disqualifiers: string[];
  derivedCondition: string;
  formula: string;
  formulaVars: Record<string, string>;
  trapNotes: string[];
  workedExample: {
    stem: string;
    solution: string;
    steps: string[];
  };
  practiceStems: PracticeStem[];
  rootCauses: RootCause[];
  verificationStatus: VerificationStatus;
}

export interface PracticeStem {
  id: string;
  text: string;
  answer: string;
  explanation: string;
  traps?: string[];
}

export interface PracticeAttempt {
  id: string;
  archetypeId: string;
  stemId?: string;
  rating: Rating;
  rootCauseIds: string[];
  timestamp: number;
  mode: "practice" | "router" | "mock";
  timeSpent?: number;
}

export interface RouterAttempt {
  id: string;
  stem: string;
  correctArchetypeId: string;
  selectedArchetypeId: string;
  isCorrect: boolean;
  timestamp: number;
  timeSpent?: number;
}

export interface Card {
  id: string;
  archetypeId: string;
  cardType: "practice" | "router";
  dueAt: number;
  interval: number;
  easeFactor: number;
  reps: number;
  lapses: number;
  verificationStatus: VerificationStatus;
}

export interface RepsStore {
  cards: Card[];
  practiceAttempts: PracticeAttempt[];
  routerAttempts: RouterAttempt[];
  settings: {
    retrieveFirst: boolean;
    timerDefault: number;
    hideTimer: boolean;
  };
  lastUpdated: number;
}

const STORE_KEY = "reps_v2";

const defaultStore: RepsStore = {
  cards: [],
  practiceAttempts: [],
  routerAttempts: [],
  settings: {
    retrieveFirst: true,
    timerDefault: 60,
    hideTimer: false,
  },
  lastUpdated: Date.now(),
};

export function loadStore(): RepsStore {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return { ...defaultStore };
    const parsed = JSON.parse(raw);
    return { ...defaultStore, ...parsed };
  } catch {
    return { ...defaultStore };
  }
}

export function saveStore(store: RepsStore): void {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({ ...store, lastUpdated: Date.now() }));
  } catch (e) {
    console.error("Failed to save store", e);
  }
}

export function resetStore(): void {
  localStorage.removeItem(STORE_KEY);
}

// SRS scheduling (simplified SM-2)
export function scheduleCard(card: Card, rating: Rating): Card {
  const updated = { ...card, reps: card.reps + 1 };
  if (rating === "incorrect") {
    updated.lapses += 1;
    updated.interval = 1;
    updated.easeFactor = Math.max(1.3, card.easeFactor - 0.2);
  } else if (rating === "partial") {
    updated.interval = Math.max(1, Math.floor(card.interval * 1.2));
    updated.easeFactor = Math.max(1.3, card.easeFactor - 0.1);
  } else {
    if (card.reps === 0) updated.interval = 1;
    else if (card.reps === 1) updated.interval = 3;
    else updated.interval = Math.round(card.interval * card.easeFactor);
    updated.easeFactor = Math.min(3.0, card.easeFactor + 0.1);
  }
  updated.dueAt = Date.now() + updated.interval * 24 * 60 * 60 * 1000;
  return updated;
}

export function getDueCards(cards: Card[]): Card[] {
  const now = Date.now();
  return cards.filter((c) => c.dueAt <= now);
}

export function getAccuracy(attempts: PracticeAttempt[], archetypeId?: string): number {
  const filtered = archetypeId
    ? attempts.filter((a) => a.archetypeId === archetypeId)
    : attempts;
  if (filtered.length === 0) return 0;
  const correct = filtered.filter((a) => a.rating === "correct").length;
  return Math.round((correct / filtered.length) * 100);
}

export function getOpenErrors(attempts: PracticeAttempt[], cards: Card[]): number {
  const incorrectArchetypes = new Set(
    attempts.filter((a) => a.rating === "incorrect").map((a) => a.archetypeId)
  );
  const resolvedArchetypes = new Set(
    attempts
      .filter((a) => a.rating === "correct")
      .map((a) => a.archetypeId)
  );
  // An error is "open" if there's an incorrect attempt with no subsequent correct attempt
  let openCount = 0;
  for (const arcId of Array.from(incorrectArchetypes)) {
    const arcAttempts = attempts
      .filter((a) => a.archetypeId === arcId)
      .sort((a, b) => a.timestamp - b.timestamp);
    const lastAttempt = arcAttempts[arcAttempts.length - 1];
    if (lastAttempt && lastAttempt.rating === "incorrect") openCount++;
  }
  return openCount;
}

// Seed QA data
export function seedQAData(archetypes: Archetype[]): RepsStore {
  const store = loadStore();
  const now = Date.now();

  const newAttempts: PracticeAttempt[] = [];
  const newCards: Card[] = [];

  archetypes.forEach((arch, i) => {
    // One correct attempt
    newAttempts.push({
      id: `qa_correct_${arch.id}`,
      archetypeId: arch.id,
      rating: "correct",
      rootCauseIds: [],
      timestamp: now - (archetypes.length - i) * 3600000,
      mode: "practice",
    });
    // One incorrect attempt with root causes
    newAttempts.push({
      id: `qa_incorrect_${arch.id}`,
      archetypeId: arch.id,
      rating: "incorrect",
      rootCauseIds: arch.rootCauses.slice(0, 2).map((rc) => rc.id),
      timestamp: now - (archetypes.length - i) * 1800000,
      mode: "practice",
    });

    // Add a card
    newCards.push({
      id: `qa_card_${arch.id}`,
      archetypeId: arch.id,
      cardType: "practice",
      dueAt: now,
      interval: 1,
      easeFactor: 2.5,
      reps: 1,
      lapses: 1,
      verificationStatus: arch.verificationStatus,
    });
  });

  const updated: RepsStore = {
    ...store,
    cards: [...store.cards.filter((c) => !c.id.startsWith("qa_")), ...newCards],
    practiceAttempts: [
      ...store.practiceAttempts.filter((a) => !a.id.startsWith("qa_")),
      ...newAttempts,
    ],
    lastUpdated: now,
  };
  saveStore(updated);
  return updated;
}
