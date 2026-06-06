import {
  ARCHETYPES as RAW_ARCHETYPES,
  ROUTER_STEMS as RAW_ROUTER_STEMS,
} from "../archetypes";
import {
  eligibleArchetypes,
  eligiblePracticeItems,
  eligibleRouterStems,
} from "./selectors";
import type { Archetype, ProblemItem, RouterStem } from "./schemas";

export const CONTENT_ARCHETYPES: Archetype[] =
  eligibleArchetypes(RAW_ARCHETYPES);
export const CONTENT_PRACTICE_ITEMS: ProblemItem[] =
  eligiblePracticeItems(RAW_ARCHETYPES);
export const CONTENT_ROUTER_STEMS: RouterStem[] = eligibleRouterStems(
  RAW_ROUTER_STEMS,
  CONTENT_ARCHETYPES
);

export const CONTENT_ARCHETYPE_MAP: Record<string, Archetype> =
  Object.fromEntries(
    CONTENT_ARCHETYPES.map(archetype => [archetype.id, archetype])
  );

export const CONTENT_PRACTICE_ITEMS_BY_ARCHETYPE: Record<
  string,
  ProblemItem[]
> = CONTENT_PRACTICE_ITEMS.reduce(
  (itemsByArchetype, item) => ({
    ...itemsByArchetype,
    [item.archetypeId]: [...(itemsByArchetype[item.archetypeId] ?? []), item],
  }),
  {} as Record<string, ProblemItem[]>
);

export const CONTENT_PRACTICE_ITEM_MAP: Record<string, ProblemItem> =
  Object.fromEntries(CONTENT_PRACTICE_ITEMS.map(item => [item.id, item]));

export const CONTENT_ROUTER_STEM_MAP: Record<string, RouterStem> =
  Object.fromEntries(CONTENT_ROUTER_STEMS.map(stem => [stem.id, stem]));

export function isEligibleArchetypeId(archetypeId: string): boolean {
  return archetypeId in CONTENT_ARCHETYPE_MAP;
}

export function isEligibleProblemItemId(problemItemId: string): boolean {
  return problemItemId in CONTENT_PRACTICE_ITEM_MAP;
}

export function isEligibleRouterStemId(routerStemId: string): boolean {
  return routerStemId in CONTENT_ROUTER_STEM_MAP;
}

export function firstProblemItemForArchetype(
  archetypeId: string
): ProblemItem | undefined {
  return CONTENT_PRACTICE_ITEMS_BY_ARCHETYPE[archetypeId]?.[0];
}

export function routerStemForText(stemText: string): RouterStem | undefined {
  return CONTENT_ROUTER_STEMS.find(stem => stem.stem === stemText);
}
