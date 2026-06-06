import { describe, expect, it } from "vitest";
import { ARCHETYPES, ROUTER_STEMS } from "../archetypes";
import {
  CONTENT_ARCHETYPES,
  CONTENT_PRACTICE_ITEMS,
  CONTENT_ROUTER_STEMS,
} from "./catalog";
import {
  ArchetypeSchema,
  ProblemItemSchema,
  RouterStemSchema,
} from "./schemas";
import {
  eligibleArchetypes,
  eligiblePracticeItems,
  eligibleRouterStems,
  toProblemItems,
} from "./selectors";
import { validateContentCatalog } from "./validate";

describe("content boundary schemas", () => {
  it("parses the legacy archetype and router exports through canonical schemas", () => {
    expect(() =>
      ARCHETYPES.forEach(item => ArchetypeSchema.parse(item))
    ).not.toThrow();
    expect(() =>
      ROUTER_STEMS.forEach(item => RouterStemSchema.parse(item))
    ).not.toThrow();

    const problemItems = toProblemItems(ARCHETYPES);
    expect(problemItems.length).toBeGreaterThanOrEqual(ARCHETYPES.length);
    expect(() =>
      problemItems.forEach(item => ProblemItemSchema.parse(item))
    ).not.toThrow();
  });

  it("keeps stable IDs unique across archetypes, practice items, and router stems", () => {
    const problemItems = toProblemItems(ARCHETYPES);
    const ids = [
      ...ARCHETYPES.map(item => item.id),
      ...problemItems.map(item => item.id),
      ...ROUTER_STEMS.map(item => item.id),
    ];

    expect(new Set(ids).size).toBe(ids.length);
    ids.forEach(id => expect(id).toMatch(/^[a-z0-9]+(?:_[a-z0-9]+)*$/));
  });

  it("selects only verified content for graded learning loops", () => {
    const archetypes = eligibleArchetypes(ARCHETYPES);
    const practiceItems = eligiblePracticeItems(ARCHETYPES);
    const routerStems = eligibleRouterStems(ROUTER_STEMS, archetypes);

    expect(archetypes).toHaveLength(6);
    expect(
      practiceItems.every(item => item.verificationStatus === "verified")
    ).toBe(true);
    expect(routerStems).toHaveLength(ROUTER_STEMS.length);
    expect(new Set(routerStems.map(item => item.correctId))).toEqual(
      new Set(archetypes.map(item => item.id))
    );
  });

  it("exposes route-facing content through the eligible catalog adapter", () => {
    expect(CONTENT_ARCHETYPES).toEqual(eligibleArchetypes(ARCHETYPES));
    expect(CONTENT_PRACTICE_ITEMS).toEqual(eligiblePracticeItems(ARCHETYPES));
    expect(CONTENT_ROUTER_STEMS).toEqual(
      eligibleRouterStems(ROUTER_STEMS, CONTENT_ARCHETYPES)
    );
    expect(
      CONTENT_ROUTER_STEMS.every(stem =>
        Object.values(stem.semanticQa.checks).every(Boolean)
      )
    ).toBe(true);
  });
});

describe("content catalog validation", () => {
  it("passes the current P0 content catalog", () => {
    const result = validateContentCatalog({
      archetypes: ARCHETYPES,
      routerStems: ROUTER_STEMS,
    });

    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.stats.eligibleArchetypes).toBe(6);
    expect(result.stats.eligiblePracticeItems).toBeGreaterThanOrEqual(6);
    expect(result.stats.eligibleRouterStems).toBe(ROUTER_STEMS.length);
  });

  it("fails closed when router stems point at unknown archetypes", () => {
    const result = validateContentCatalog({
      archetypes: ARCHETYPES,
      routerStems: [
        { ...ROUTER_STEMS[0], id: "bad_router", correctId: "missing" },
      ],
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        "routerStems[bad_router].correctId references unknown archetype missing",
      ])
    );
  });

  it("fails closed on cross-namespace stable ID collisions", () => {
    const result = validateContentCatalog({
      archetypes: ARCHETYPES,
      routerStems: [{ ...ROUTER_STEMS[0], id: ARCHETYPES[0].id }],
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        `catalogIds[${ARCHETYPES[0].id}] duplicates a stable id`,
      ])
    );
  });
});
