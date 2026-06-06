import { describe, expect, it } from "vitest";
import {
  dismissOpenError,
  getOpenErrorItems,
  getOpenErrors,
  getRouterAccuracy,
  getTodayReps,
  getWeakestStats,
  type Card,
  type PracticeAttempt,
  type RepsStore,
  type RouterAttempt,
} from "./store";

const baseCard: Card = {
  id: "card-1",
  archetypeId: "arc-a",
  cardType: "practice",
  dueAt: 0,
  interval: 1,
  easeFactor: 2.5,
  reps: 0,
  lapses: 0,
  verificationStatus: "verified",
};

const attempt = (
  id: string,
  archetypeId: string,
  rating: PracticeAttempt["rating"],
  timestamp: number
): PracticeAttempt => ({
  id,
  archetypeId,
  rating,
  rootCauseIds: [],
  timestamp,
  mode: "practice",
});

const routerAttempt = (
  id: string,
  correctArchetypeId: string,
  isCorrect: boolean,
  timestamp: number
): RouterAttempt => ({
  id,
  stem: id,
  correctArchetypeId,
  selectedArchetypeId: isCorrect ? correctArchetypeId : "other",
  isCorrect,
  timestamp,
});

const store = (overrides: Partial<RepsStore> = {}): RepsStore => ({
  cards: [],
  practiceAttempts: [],
  routerAttempts: [],
  dismissedErrorIds: [],
  settings: {
    retrieveFirst: true,
    timerDefault: 60,
    hideTimer: false,
  },
  lastUpdated: 0,
  ...overrides,
});

describe("store selectors", () => {
  it("keeps an error open until a later correct attempt resolves it", () => {
    const attempts = [
      attempt("miss-1", "arc-a", "incorrect", 100),
      attempt("partial-1", "arc-a", "partial", 200),
    ];

    expect(getOpenErrors(attempts, [baseCard])).toBe(1);
    expect(
      getOpenErrors(
        [...attempts, attempt("hit-1", "arc-a", "correct", 300)],
        [baseCard]
      )
    ).toBe(0);
  });

  it("dismisses the current open error without hiding a later miss", () => {
    const initial = store({
      practiceAttempts: [attempt("miss-1", "arc-a", "incorrect", 100)],
    });
    const dismissed = dismissOpenError(initial, "miss-1");

    expect(
      getOpenErrorItems(initial.practiceAttempts, dismissed.dismissedErrorIds)
    ).toEqual([]);
    expect(
      getOpenErrorItems(
        [
          ...initial.practiceAttempts,
          attempt("miss-2", "arc-a", "incorrect", 200),
        ],
        dismissed.dismissedErrorIds
      ).map(item => item.lastIncorrectAttempt.id)
    ).toEqual(["miss-2"]);
  });

  it("counts today's practice, mock, and router reps", () => {
    const now = 1_000_000_000;
    const repsStore = store({
      practiceAttempts: [
        attempt("practice-today", "arc-a", "correct", now - 1_000),
        {
          ...attempt("mock-today", "arc-a", "correct", now - 2_000),
          mode: "mock",
        },
        attempt("old-practice", "arc-a", "correct", now - 90_000_000),
      ],
      routerAttempts: [
        routerAttempt("router-today", "arc-a", true, now - 3_000),
        routerAttempt("old-router", "arc-a", true, now - 90_000_000),
      ],
    });

    expect(getTodayReps(repsStore, now)).toBe(3);
  });

  it("derives router accuracy overall and by archetype", () => {
    const attempts = [
      routerAttempt("r1", "arc-a", true, 100),
      routerAttempt("r2", "arc-a", false, 200),
      routerAttempt("r3", "arc-b", true, 300),
    ];

    expect(getRouterAccuracy(attempts)).toBe(67);
    expect(getRouterAccuracy(attempts, "arc-a")).toBe(50);
    expect(getRouterAccuracy(attempts, "arc-c")).toBe(0);
  });

  it("only reports weakest rows when a real accuracy gap exists", () => {
    expect(
      getWeakestStats([
        { id: "arc-a", attempts: 3, accuracy: 100 },
        { id: "arc-b", attempts: 1, accuracy: 100 },
      ])
    ).toEqual([]);

    expect(
      getWeakestStats([
        { id: "arc-a", attempts: 3, accuracy: 80 },
        { id: "arc-b", attempts: 2, accuracy: 80 },
      ])
    ).toEqual([]);

    expect(
      getWeakestStats([
        { id: "arc-a", attempts: 3, accuracy: 80 },
        { id: "arc-b", attempts: 2, accuracy: 80 },
        { id: "arc-c", attempts: 2, accuracy: 100 },
      ])
    ).toEqual([
      { id: "arc-a", attempts: 3, accuracy: 80 },
      { id: "arc-b", attempts: 2, accuracy: 80 },
    ]);
  });
});
