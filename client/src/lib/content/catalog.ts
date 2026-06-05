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

export function isEligibleArchetypeId(archetypeId: string): boolean {
  return archetypeId in CONTENT_ARCHETYPE_MAP;
}
