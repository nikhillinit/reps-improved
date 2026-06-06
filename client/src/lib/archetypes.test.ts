import { describe, expect, it } from "vitest";
import { ARCHETYPES, ROUTER_STEMS } from "./archetypes";

type RouterStemWithMvpMetadata = (typeof ROUTER_STEMS)[number] & {
  kind?: "direct" | "near-miss" | "conceptual-trap";
  confuserIds?: string[];
};

describe("router stem bank", () => {
  it("ships six MVP router stems per P0 archetype with the required mix", () => {
    const stems = ROUTER_STEMS as RouterStemWithMvpMetadata[];

    for (const archetype of ARCHETYPES) {
      const archetypeStems = stems.filter(
        stem => stem.correctId === archetype.id
      );

      expect(archetypeStems, archetype.id).toHaveLength(6);
      expect(
        archetypeStems.filter(stem => stem.kind === "direct"),
        `${archetype.id}: direct`
      ).toHaveLength(3);
      expect(
        archetypeStems.filter(stem => stem.kind === "near-miss"),
        `${archetype.id}: near-miss`
      ).toHaveLength(2);
      expect(
        archetypeStems.filter(stem => stem.kind === "conceptual-trap"),
        `${archetype.id}: conceptual-trap`
      ).toHaveLength(1);
    }
  });

  it("labels near-miss stems with explicit confuser buckets", () => {
    const stems = ROUTER_STEMS as RouterStemWithMvpMetadata[];
    const nearMisses = stems.filter(stem => stem.kind === "near-miss");

    expect(nearMisses.length).toBeGreaterThan(0);
    expect(
      nearMisses.every(
        stem => Array.isArray(stem.confuserIds) && stem.confuserIds.length > 0
      )
    ).toBe(true);
  });
});
