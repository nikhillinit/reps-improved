/* ============================================================
   REPS - Core Data Store
   All active state is persisted to localStorage under "reps_v3".
   Legacy "reps_v2" data is migrated on first load.
   ============================================================ */

import {
  CONTENT_ARCHETYPE_MAP,
  CONTENT_PRACTICE_ITEM_MAP,
  firstProblemItemForArchetype,
  isEligibleArchetypeId,
  isEligibleProblemItemId,
  isEligibleRouterStemId,
  routerStemForText,
} from "./content/catalog";
import type { Archetype, VerificationStatus } from "./content/schemas";

export type Rating = "correct" | "incorrect" | "partial";
export type {
  Archetype,
  PracticeStem,
  RootCause,
  VerificationStatus,
} from "./content/schemas";

export const STORE_VERSION = 3;
export const STORE_KEY = "reps_v3";
export const LEGACY_STORE_KEY = "reps_v2";

export interface PracticeAttempt {
  id: string;
  archetypeId: string;
  problemItemId?: string;
  stemId?: string;
  rating: Rating;
  rootCauseIds: string[];
  timestamp: number;
  mode: "practice" | "router" | "mock";
  timeSpent?: number;
}

export interface RouterAttempt {
  id: string;
  routerStemId?: string;
  stem: string;
  correctArchetypeId: string;
  selectedArchetypeId: string;
  isCorrect: boolean;
  timestamp: number;
  timeSpent?: number;
  diagnosticSnapshotId?: string;
}

export interface Card {
  id: string;
  archetypeId: string;
  problemItemId?: string;
  cardType: "practice" | "router";
  dueAt: number;
  interval: number;
  easeFactor: number;
  reps: number;
  lapses: number;
  verificationStatus: VerificationStatus;
}

export interface RouterDiagnosticSnapshot {
  id: string;
  routerAttemptId?: string;
  routerStemId?: string;
  timestamp: number;
  selectedArchetypeId?: string;
  correctArchetypeId?: string;
  classifyTime?: number;
  derivedCondition?: string;
  firstFormulaOrMove?: string;
  trap?: string;
  confuserExplanation?: string;
}

export interface QuarantinedRecord {
  path: string;
  reason: string;
  record: unknown;
  quarantinedAt: number;
}

export interface StoreSettings {
  retrieveFirst: boolean;
  timerDefault: number;
  hideTimer: boolean;
}

export interface RepsStore {
  version: typeof STORE_VERSION;
  cards: Card[];
  practiceAttempts: PracticeAttempt[];
  routerAttempts: RouterAttempt[];
  routerDiagnostics: RouterDiagnosticSnapshot[];
  settings: StoreSettings;
  quarantinedRecords: QuarantinedRecord[];
  lastUpdated: number;
}

export interface StoreImportResult {
  ok: boolean;
  store?: RepsStore;
  warnings: string[];
  errors: string[];
}

export interface RemediationItem {
  id: string;
  archetypeId: string;
  problemItemId?: string;
  latestAttempt: PracticeAttempt;
  card?: Card;
  dueAt: number;
}

export type PracticeQueuePriority = "due-patch" | "due-card" | "new-weak";

export interface PracticeQueueItem {
  card: Card;
  priority: PracticeQueuePriority;
  dueAt: number;
  problemItemId?: string;
  remediationItem?: RemediationItem;
}

interface NormalizeResult {
  ok: boolean;
  store: RepsStore;
  warnings: string[];
  errors: string[];
}

const DAY_MS = 24 * 60 * 60 * 1000;

export const INCORRECT_REMEDIATION_DELAY_MS = 20 * 60 * 1000;
export const PARTIAL_REMEDIATION_DELAY_MS = 4 * 60 * 60 * 1000;

const defaultSettings: StoreSettings = {
  retrieveFirst: true,
  timerDefault: 60,
  hideTimer: false,
};

function createDefaultStore(): RepsStore {
  return {
    version: STORE_VERSION,
    cards: [],
    practiceAttempts: [],
    routerAttempts: [],
    routerDiagnostics: [],
    settings: { ...defaultSettings },
    quarantinedRecords: [],
    lastUpdated: Date.now(),
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0
    ? value
    : undefined;
}

function readNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function readBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function readStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter(item => typeof item === "string")
    : [];
}

function readCollection(
  value: Record<string, unknown>,
  key: string,
  errors: string[]
): unknown[] {
  if (!(key in value)) return [];
  if (Array.isArray(value[key])) return value[key];
  errors.push(`${key} must be an array`);
  return [];
}

function readSettings(value: unknown): StoreSettings {
  if (!isObject(value)) return { ...defaultSettings };

  return {
    retrieveFirst:
      readBoolean(value.retrieveFirst) ?? defaultSettings.retrieveFirst,
    timerDefault:
      readNumber(value.timerDefault) ?? defaultSettings.timerDefault,
    hideTimer: readBoolean(value.hideTimer) ?? defaultSettings.hideTimer,
  };
}

function quarantine(
  records: QuarantinedRecord[],
  warnings: string[],
  path: string,
  reason: string,
  record: unknown
) {
  records.push({
    path,
    reason,
    record,
    quarantinedAt: Date.now(),
  });
  warnings.push(`${path}: ${reason}`);
}

function readRating(value: unknown): Rating | undefined {
  return value === "correct" || value === "incorrect" || value === "partial"
    ? value
    : undefined;
}

function readMode(value: unknown): PracticeAttempt["mode"] | undefined {
  return value === "practice" || value === "router" || value === "mock"
    ? value
    : undefined;
}

function readCardType(value: unknown): Card["cardType"] | undefined {
  return value === "practice" || value === "router" ? value : undefined;
}

function readVerificationStatus(
  value: unknown
): VerificationStatus | undefined {
  return value === "verified" ||
    value === "unverified" ||
    value === "ai-generated-unverified"
    ? value
    : undefined;
}

function problemItemIdForRecord(
  value: Record<string, unknown>,
  archetypeId: string
): string | undefined | "invalid" {
  const candidate = readString(value.problemItemId) ?? readString(value.stemId);
  if (!candidate) return undefined;
  if (!isEligibleProblemItemId(candidate)) return "invalid";

  const item = CONTENT_PRACTICE_ITEM_MAP[candidate];
  return item.archetypeId === archetypeId ? candidate : "invalid";
}

function routerStemIdForRecord(
  value: Record<string, unknown>,
  stemText: string
): string | undefined | "invalid" {
  const candidate = readString(value.routerStemId);
  if (candidate) {
    return isEligibleRouterStemId(candidate) ? candidate : "invalid";
  }

  return routerStemForText(stemText)?.id ?? "invalid";
}

function normalizePracticeAttempt(
  value: unknown,
  index: number,
  quarantinedRecords: QuarantinedRecord[],
  warnings: string[]
): PracticeAttempt | undefined {
  const path = `practiceAttempts[${index}]`;
  if (!isObject(value)) {
    quarantine(
      quarantinedRecords,
      warnings,
      path,
      "record is not an object",
      value
    );
    return undefined;
  }

  const id = readString(value.id);
  const archetypeId = readString(value.archetypeId);
  const rating = readRating(value.rating);
  const timestamp = readNumber(value.timestamp);
  const mode = readMode(value.mode) ?? "practice";

  if (!id || !archetypeId || !rating || timestamp === undefined) {
    quarantine(
      quarantinedRecords,
      warnings,
      path,
      "missing required fields",
      value
    );
    return undefined;
  }
  if (!isEligibleArchetypeId(archetypeId)) {
    quarantine(
      quarantinedRecords,
      warnings,
      path,
      `unknown archetypeId ${archetypeId}`,
      value
    );
    return undefined;
  }

  const rootCauseIds = readStringArray(value.rootCauseIds);
  const knownRootCauseIds = new Set(
    CONTENT_ARCHETYPE_MAP[archetypeId].rootCauses.map(rootCause => rootCause.id)
  );
  const unknownRootCauseId = rootCauseIds.find(
    rootCauseId => !knownRootCauseIds.has(rootCauseId)
  );
  if (unknownRootCauseId) {
    quarantine(
      quarantinedRecords,
      warnings,
      path,
      `unknown rootCauseId ${unknownRootCauseId}`,
      value
    );
    return undefined;
  }

  const problemItemId = problemItemIdForRecord(value, archetypeId);
  if (problemItemId === "invalid") {
    quarantine(
      quarantinedRecords,
      warnings,
      path,
      "unknown or mismatched problem item id",
      value
    );
    return undefined;
  }

  return {
    id,
    archetypeId,
    ...(problemItemId ? { problemItemId, stemId: problemItemId } : {}),
    rating,
    rootCauseIds,
    timestamp,
    mode,
    ...(readNumber(value.timeSpent) !== undefined
      ? { timeSpent: readNumber(value.timeSpent) }
      : {}),
  };
}

function normalizeRouterAttempt(
  value: unknown,
  index: number,
  quarantinedRecords: QuarantinedRecord[],
  warnings: string[]
): RouterAttempt | undefined {
  const path = `routerAttempts[${index}]`;
  if (!isObject(value)) {
    quarantine(
      quarantinedRecords,
      warnings,
      path,
      "record is not an object",
      value
    );
    return undefined;
  }

  const id = readString(value.id);
  const stem = readString(value.stem);
  const correctArchetypeId = readString(value.correctArchetypeId);
  const selectedArchetypeId = readString(value.selectedArchetypeId);
  const timestamp = readNumber(value.timestamp);
  const isCorrect = readBoolean(value.isCorrect);

  if (
    !id ||
    !stem ||
    !correctArchetypeId ||
    !selectedArchetypeId ||
    timestamp === undefined ||
    isCorrect === undefined
  ) {
    quarantine(
      quarantinedRecords,
      warnings,
      path,
      "missing required fields",
      value
    );
    return undefined;
  }
  if (!isEligibleArchetypeId(correctArchetypeId)) {
    quarantine(
      quarantinedRecords,
      warnings,
      path,
      `unknown correctArchetypeId ${correctArchetypeId}`,
      value
    );
    return undefined;
  }
  if (!isEligibleArchetypeId(selectedArchetypeId)) {
    quarantine(
      quarantinedRecords,
      warnings,
      path,
      `unknown selectedArchetypeId ${selectedArchetypeId}`,
      value
    );
    return undefined;
  }

  const routerStemId = routerStemIdForRecord(value, stem);
  if (routerStemId === "invalid") {
    quarantine(
      quarantinedRecords,
      warnings,
      path,
      "unknown or unmapped router stem id",
      value
    );
    return undefined;
  }

  return {
    id,
    ...(routerStemId ? { routerStemId } : {}),
    stem,
    correctArchetypeId,
    selectedArchetypeId,
    isCorrect,
    timestamp,
    ...(readNumber(value.timeSpent) !== undefined
      ? { timeSpent: readNumber(value.timeSpent) }
      : {}),
    ...(readString(value.diagnosticSnapshotId)
      ? { diagnosticSnapshotId: readString(value.diagnosticSnapshotId) }
      : {}),
  };
}

function normalizeCard(
  value: unknown,
  index: number,
  quarantinedRecords: QuarantinedRecord[],
  warnings: string[]
): Card | undefined {
  const path = `cards[${index}]`;
  if (!isObject(value)) {
    quarantine(
      quarantinedRecords,
      warnings,
      path,
      "record is not an object",
      value
    );
    return undefined;
  }

  const id = readString(value.id);
  const archetypeId = readString(value.archetypeId);
  const cardType = readCardType(value.cardType);
  const dueAt = readNumber(value.dueAt);
  const interval = readNumber(value.interval);
  const easeFactor = readNumber(value.easeFactor);
  const reps = readNumber(value.reps);
  const lapses = readNumber(value.lapses);
  const verificationStatus = readVerificationStatus(value.verificationStatus);

  if (
    !id ||
    !archetypeId ||
    !cardType ||
    dueAt === undefined ||
    interval === undefined ||
    easeFactor === undefined ||
    reps === undefined ||
    lapses === undefined ||
    !verificationStatus
  ) {
    quarantine(
      quarantinedRecords,
      warnings,
      path,
      "missing required fields",
      value
    );
    return undefined;
  }
  if (!isEligibleArchetypeId(archetypeId)) {
    quarantine(
      quarantinedRecords,
      warnings,
      path,
      `unknown archetypeId ${archetypeId}`,
      value
    );
    return undefined;
  }

  const problemItemId = problemItemIdForRecord(value, archetypeId);
  if (problemItemId === "invalid") {
    quarantine(
      quarantinedRecords,
      warnings,
      path,
      "unknown or mismatched problem item id",
      value
    );
    return undefined;
  }

  return {
    id,
    archetypeId,
    ...(problemItemId ? { problemItemId } : {}),
    cardType,
    dueAt,
    interval,
    easeFactor,
    reps,
    lapses,
    verificationStatus,
  };
}

function normalizeRouterDiagnostic(
  value: unknown,
  index: number,
  quarantinedRecords: QuarantinedRecord[],
  warnings: string[]
): RouterDiagnosticSnapshot | undefined {
  const path = `routerDiagnostics[${index}]`;
  if (!isObject(value)) {
    quarantine(
      quarantinedRecords,
      warnings,
      path,
      "record is not an object",
      value
    );
    return undefined;
  }

  const id = readString(value.id);
  const timestamp = readNumber(value.timestamp);
  const routerStemId = readString(value.routerStemId);

  if (!id || timestamp === undefined) {
    quarantine(
      quarantinedRecords,
      warnings,
      path,
      "missing required fields",
      value
    );
    return undefined;
  }
  if (routerStemId && !isEligibleRouterStemId(routerStemId)) {
    quarantine(
      quarantinedRecords,
      warnings,
      path,
      `unknown routerStemId ${routerStemId}`,
      value
    );
    return undefined;
  }

  const selectedArchetypeId = readString(value.selectedArchetypeId);
  const correctArchetypeId = readString(value.correctArchetypeId);
  if (selectedArchetypeId && !isEligibleArchetypeId(selectedArchetypeId)) {
    quarantine(
      quarantinedRecords,
      warnings,
      path,
      `unknown selectedArchetypeId ${selectedArchetypeId}`,
      value
    );
    return undefined;
  }
  if (correctArchetypeId && !isEligibleArchetypeId(correctArchetypeId)) {
    quarantine(
      quarantinedRecords,
      warnings,
      path,
      `unknown correctArchetypeId ${correctArchetypeId}`,
      value
    );
    return undefined;
  }

  return {
    id,
    ...(readString(value.routerAttemptId)
      ? { routerAttemptId: readString(value.routerAttemptId) }
      : {}),
    ...(routerStemId ? { routerStemId } : {}),
    timestamp,
    ...(selectedArchetypeId ? { selectedArchetypeId } : {}),
    ...(correctArchetypeId ? { correctArchetypeId } : {}),
    ...(readNumber(value.classifyTime) !== undefined
      ? { classifyTime: readNumber(value.classifyTime) }
      : {}),
    ...(readString(value.derivedCondition)
      ? { derivedCondition: readString(value.derivedCondition) }
      : {}),
    ...(readString(value.firstFormulaOrMove)
      ? { firstFormulaOrMove: readString(value.firstFormulaOrMove) }
      : {}),
    ...(readString(value.trap) ? { trap: readString(value.trap) } : {}),
    ...(readString(value.confuserExplanation)
      ? { confuserExplanation: readString(value.confuserExplanation) }
      : {}),
  };
}

function readLegacyQuarantine(value: unknown): QuarantinedRecord[] {
  if (!Array.isArray(value)) return [];

  return value
    .map(record => {
      if (!isObject(record)) return undefined;
      const path = readString(record.path);
      const reason = readString(record.reason);
      const quarantinedAt = readNumber(record.quarantinedAt) ?? Date.now();
      if (!path || !reason) return undefined;
      return {
        path,
        reason,
        record: record.record,
        quarantinedAt,
      };
    })
    .filter((record): record is QuarantinedRecord => Boolean(record));
}

function normalizeStore(value: unknown): NormalizeResult {
  const store = createDefaultStore();
  const warnings: string[] = [];
  const errors: string[] = [];
  const quarantinedRecords: QuarantinedRecord[] = [];

  if (!isObject(value)) {
    return {
      ok: false,
      store,
      warnings,
      errors: ["backup root is not an object"],
    };
  }

  store.settings = readSettings(value.settings);
  store.lastUpdated = readNumber(value.lastUpdated) ?? Date.now();

  const cards = readCollection(value, "cards", errors);
  const practiceAttempts = readCollection(value, "practiceAttempts", errors);
  const routerAttempts = readCollection(value, "routerAttempts", errors);
  const routerDiagnostics = readCollection(value, "routerDiagnostics", errors);

  store.cards = cards
    .map((record, index) =>
      normalizeCard(record, index, quarantinedRecords, warnings)
    )
    .filter((record): record is Card => Boolean(record));
  store.practiceAttempts = practiceAttempts
    .map((record, index) =>
      normalizePracticeAttempt(record, index, quarantinedRecords, warnings)
    )
    .filter((record): record is PracticeAttempt => Boolean(record));
  store.routerAttempts = routerAttempts
    .map((record, index) =>
      normalizeRouterAttempt(record, index, quarantinedRecords, warnings)
    )
    .filter((record): record is RouterAttempt => Boolean(record));
  store.routerDiagnostics = routerDiagnostics
    .map((record, index) =>
      normalizeRouterDiagnostic(record, index, quarantinedRecords, warnings)
    )
    .filter((record): record is RouterDiagnosticSnapshot => Boolean(record));
  store.quarantinedRecords = [
    ...readLegacyQuarantine(value.quarantinedRecords),
    ...quarantinedRecords,
  ];

  return {
    ok: errors.length === 0,
    store,
    warnings,
    errors,
  };
}

function parseStoredJson(raw: string): unknown | undefined {
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

function warnAboutStoreIssues(warnings: string[]) {
  if (warnings.length > 0) {
    console.warn("Some REPS records were quarantined during store migration", {
      warnings,
    });
  }
}

function validateBackupRoot(value: unknown): string[] {
  if (!isObject(value)) return ["backup root is not an object"];

  const errors: string[] = [];
  const requiredCollections =
    value.version === STORE_VERSION
      ? ["cards", "practiceAttempts", "routerAttempts", "routerDiagnostics"]
      : ["cards", "practiceAttempts", "routerAttempts"];

  requiredCollections.forEach(key => {
    if (!(key in value)) {
      errors.push(`${key} is required`);
    } else if (!Array.isArray(value[key])) {
      errors.push(`${key} must be an array`);
    }
  });

  if (!isObject(value.settings)) {
    errors.push("settings is required");
  }

  return errors;
}

export function loadStore(): RepsStore {
  const rawV3 = localStorage.getItem(STORE_KEY);
  if (rawV3) {
    const parsed = parseStoredJson(rawV3);
    const result = normalizeStore(parsed);
    warnAboutStoreIssues(result.warnings);
    return result.ok ? result.store : createDefaultStore();
  }

  const rawV2 = localStorage.getItem(LEGACY_STORE_KEY);
  if (rawV2) {
    const parsed = parseStoredJson(rawV2);
    const result = normalizeStore(parsed);
    warnAboutStoreIssues(result.warnings);
    if (result.ok) {
      saveStore(result.store);
      return result.store;
    }
  }

  return createDefaultStore();
}

export function saveStore(store: RepsStore): void {
  try {
    localStorage.setItem(
      STORE_KEY,
      JSON.stringify({
        ...store,
        version: STORE_VERSION,
        lastUpdated: Date.now(),
      })
    );
  } catch (e) {
    console.error("Failed to save store", e);
  }
}

export function exportStore(store: RepsStore = loadStore()): string {
  const exported: RepsStore = {
    ...store,
    version: STORE_VERSION,
  };
  return JSON.stringify(exported, null, 2);
}

export function importStoreFromJson(json: string): StoreImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return {
      ok: false,
      warnings: [],
      errors: ["Invalid backup JSON."],
    };
  }

  const backupErrors = validateBackupRoot(parsed);
  if (backupErrors.length > 0) {
    return {
      ok: false,
      warnings: [],
      errors: backupErrors,
    };
  }

  const result = normalizeStore(parsed);
  if (!result.ok) {
    return result;
  }

  saveStore(result.store);
  return {
    ok: true,
    store: loadStore(),
    warnings: result.warnings,
    errors: [],
  };
}

export function resetStore(): void {
  localStorage.removeItem(STORE_KEY);
  localStorage.removeItem(LEGACY_STORE_KEY);
}

export function remediationDelayMs(rating: Rating): number | undefined {
  if (rating === "incorrect") return INCORRECT_REMEDIATION_DELAY_MS;
  if (rating === "partial") return PARTIAL_REMEDIATION_DELAY_MS;
  return undefined;
}

function intervalDaysFromMs(delayMs: number): number {
  return delayMs / DAY_MS;
}

// SRS scheduling (simplified SM-2, with short remediation windows for misses)
export function scheduleCard(card: Card, rating: Rating): Card {
  if (rating === "incorrect") {
    return {
      ...card,
      reps: card.reps + 1,
      lapses: card.lapses + 1,
      interval: intervalDaysFromMs(INCORRECT_REMEDIATION_DELAY_MS),
      easeFactor: Math.max(1.3, card.easeFactor - 0.2),
      dueAt: Date.now() + INCORRECT_REMEDIATION_DELAY_MS,
    };
  }

  if (rating === "partial") {
    return {
      ...card,
      reps: card.reps + 1,
      interval: intervalDaysFromMs(PARTIAL_REMEDIATION_DELAY_MS),
      easeFactor: Math.max(1.3, card.easeFactor - 0.1),
      dueAt: Date.now() + PARTIAL_REMEDIATION_DELAY_MS,
    };
  }

  const interval =
    card.reps === 0
      ? 1
      : card.reps === 1
        ? 3
        : Math.round(card.interval * card.easeFactor);

  return {
    ...card,
    reps: card.reps + 1,
    interval,
    easeFactor: Math.min(3.0, card.easeFactor + 0.1),
    dueAt: Date.now() + interval * DAY_MS,
  };
}

export function getDueCards(cards: Card[]): Card[] {
  const now = Date.now();
  return cards.filter(c => c.dueAt <= now);
}

function remediationKey(archetypeId: string, problemItemId?: string): string {
  return `${archetypeId}::${problemItemId ?? "__archetype__"}`;
}

function problemItemIdForAttempt(attempt: PracticeAttempt): string | undefined {
  return attempt.problemItemId ?? attempt.stemId;
}

function compareDueThenRecent(
  a: { dueAt: number; latestAttempt?: PracticeAttempt },
  b: { dueAt: number; latestAttempt?: PracticeAttempt }
): number {
  if (a.dueAt !== b.dueAt) return a.dueAt - b.dueAt;
  return (b.latestAttempt?.timestamp ?? 0) - (a.latestAttempt?.timestamp ?? 0);
}

function findRemediationCard(
  cards: Card[],
  archetypeId: string,
  problemItemId?: string
): Card | undefined {
  const eligibleCards = cards.filter(
    card => card.cardType === "practice" && card.archetypeId === archetypeId
  );

  const exactCards = eligibleCards.filter(card =>
    problemItemId ? card.problemItemId === problemItemId : !card.problemItemId
  );
  if (exactCards.length > 0) {
    return [...exactCards].sort((a, b) => a.dueAt - b.dueAt)[0];
  }

  return [...eligibleCards]
    .filter(card => !card.problemItemId)
    .sort((a, b) => a.dueAt - b.dueAt)[0];
}

function getOpenErrorItemsFromParts(
  attempts: PracticeAttempt[],
  cards: Card[]
): RemediationItem[] {
  const latestByItem = attempts.reduce<Record<string, PracticeAttempt>>(
    (latest, attempt) => {
      const problemItemId = problemItemIdForAttempt(attempt);
      const key = remediationKey(attempt.archetypeId, problemItemId);
      const current = latest[key];
      if (!current || attempt.timestamp > current.timestamp) {
        return { ...latest, [key]: attempt };
      }
      return latest;
    },
    {}
  );

  return Object.values(latestByItem)
    .filter(attempt => attempt.rating !== "correct")
    .map(latestAttempt => {
      const problemItemId = problemItemIdForAttempt(latestAttempt);
      const card = findRemediationCard(
        cards,
        latestAttempt.archetypeId,
        problemItemId
      );
      const fallbackDelay = remediationDelayMs(latestAttempt.rating) ?? 0;
      return {
        id: remediationKey(latestAttempt.archetypeId, problemItemId),
        archetypeId: latestAttempt.archetypeId,
        ...(problemItemId ? { problemItemId } : {}),
        latestAttempt,
        ...(card ? { card } : {}),
        dueAt: card?.dueAt ?? latestAttempt.timestamp + fallbackDelay,
      };
    })
    .sort(compareDueThenRecent);
}

export function getOpenErrorItems(store: RepsStore): RemediationItem[] {
  return getOpenErrorItemsFromParts(store.practiceAttempts, store.cards);
}

export function getDuePatchItems(
  store: RepsStore,
  now: number = Date.now()
): RemediationItem[] {
  return getOpenErrorItems(store)
    .filter(item => item.dueAt <= now)
    .sort(compareDueThenRecent);
}

function shuffleBucket<T>(items: T[], random: () => number): T[] {
  return [...items]
    .map(item => ({ item, order: random() }))
    .sort((a, b) => a.order - b.order)
    .map(({ item }) => item);
}

function practiceAttemptMatch(attempt: PracticeAttempt, card: Card): boolean {
  if (attempt.archetypeId !== card.archetypeId) return false;
  if (!card.problemItemId) return true;
  return problemItemIdForAttempt(attempt) === card.problemItemId;
}

function weaknessScore(store: RepsStore, card: Card): number {
  const attempts = store.practiceAttempts.filter(attempt =>
    practiceAttemptMatch(attempt, card)
  );
  if (attempts.length === 0) return -1;
  const correct = attempts.filter(
    attempt => attempt.rating === "correct"
  ).length;
  return correct / attempts.length;
}

export function getPracticeQueueItems(
  store: RepsStore,
  count: number,
  now: number = Date.now(),
  random: () => number = Math.random
): PracticeQueueItem[] {
  const duePatchItems = getDuePatchItems(store, now)
    .filter(item => item.card)
    .map(item => ({
      card: item.card as Card,
      priority: "due-patch" as const,
      dueAt: item.dueAt,
      ...(item.problemItemId ? { problemItemId: item.problemItemId } : {}),
      remediationItem: item,
    }));
  const duePatchCardIds = new Set(duePatchItems.map(item => item.card.id));

  const dueCards = store.cards
    .filter(
      card =>
        card.cardType === "practice" &&
        card.dueAt <= now &&
        isEligibleArchetypeId(card.archetypeId) &&
        !duePatchCardIds.has(card.id)
    )
    .map(card => ({
      card,
      priority: "due-card" as const,
      dueAt: card.dueAt,
      ...(card.problemItemId ? { problemItemId: card.problemItemId } : {}),
    }));
  const dueCardIds = new Set([
    ...Array.from(duePatchCardIds),
    ...dueCards.map(item => item.card.id),
  ]);

  const coverageCards = store.cards
    .filter(
      card =>
        card.cardType === "practice" &&
        isEligibleArchetypeId(card.archetypeId) &&
        !dueCardIds.has(card.id)
    )
    .sort((a, b) => {
      const weaknessDiff = weaknessScore(store, a) - weaknessScore(store, b);
      if (weaknessDiff !== 0) return weaknessDiff;
      const repsDiff = a.reps - b.reps;
      return repsDiff !== 0 ? repsDiff : a.dueAt - b.dueAt;
    })
    .map(card => ({
      card,
      priority: "new-weak" as const,
      dueAt: card.dueAt,
      ...(card.problemItemId ? { problemItemId: card.problemItemId } : {}),
    }));

  return [
    ...shuffleBucket(duePatchItems, random),
    ...shuffleBucket(dueCards, random),
    ...coverageCards,
  ].slice(0, count);
}

export function getAccuracy(
  attempts: PracticeAttempt[],
  archetypeId?: string
): number {
  const filtered = archetypeId
    ? attempts.filter(a => a.archetypeId === archetypeId)
    : attempts;
  if (filtered.length === 0) return 0;
  const correct = filtered.filter(a => a.rating === "correct").length;
  return Math.round((correct / filtered.length) * 100);
}

export function getOpenErrors(
  attempts: PracticeAttempt[],
  cards: Card[]
): number {
  return getOpenErrorItemsFromParts(attempts, cards).length;
}

// Seed QA data
export function seedQAData(archetypes: Archetype[]): RepsStore {
  const store = loadStore();
  const now = Date.now();

  const newAttempts: PracticeAttempt[] = [];
  const newCards: Card[] = [];

  archetypes.forEach((arch, i) => {
    const problemItem = firstProblemItemForArchetype(arch.id);
    newAttempts.push({
      id: `qa_correct_${arch.id}`,
      archetypeId: arch.id,
      ...(problemItem
        ? { problemItemId: problemItem.id, stemId: problemItem.id }
        : {}),
      rating: "correct",
      rootCauseIds: [],
      timestamp: now - (archetypes.length - i) * 3600000,
      mode: "practice",
    });
    newAttempts.push({
      id: `qa_incorrect_${arch.id}`,
      archetypeId: arch.id,
      ...(problemItem
        ? { problemItemId: problemItem.id, stemId: problemItem.id }
        : {}),
      rating: "incorrect",
      rootCauseIds: arch.rootCauses.slice(0, 2).map(rc => rc.id),
      timestamp: now - (archetypes.length - i) * 1800000,
      mode: "practice",
    });

    newCards.push({
      id: `qa_card_${arch.id}`,
      archetypeId: arch.id,
      ...(problemItem ? { problemItemId: problemItem.id } : {}),
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
    cards: [...store.cards.filter(c => !c.id.startsWith("qa_")), ...newCards],
    practiceAttempts: [
      ...store.practiceAttempts.filter(a => !a.id.startsWith("qa_")),
      ...newAttempts,
    ],
    lastUpdated: now,
  };
  saveStore(updated);
  return updated;
}
