import type {
  Archetype,
  PracticeStem,
  ProblemItem,
  RouterStem,
  SemanticQa,
} from "./schemas";

const isPresent = (value: string | undefined): boolean =>
  Boolean(value?.trim());

function buildSemanticQa(
  archetype: Archetype,
  stem: PracticeStem,
  traps: string[]
): SemanticQa {
  const checks = {
    hasStableArchetypeLink: isPresent(archetype.id),
    hasSourceBackedAnswer:
      archetype.verificationStatus === "verified" && isPresent(stem.answer),
    hasExplanation: isPresent(stem.explanation),
    hasTrapCoverage: traps.length > 0,
  };

  const warnings = Object.entries(checks)
    .filter(([, passed]) => !passed)
    .map(([check]) => check);

  return {
    verificationStatus: archetype.verificationStatus,
    checks,
    warnings,
  };
}

function passesSemanticQa(semanticQa: SemanticQa): boolean {
  return Object.values(semanticQa.checks).every(Boolean);
}

export function toProblemItems(
  archetypes: readonly Archetype[]
): ProblemItem[] {
  return archetypes.flatMap(archetype =>
    archetype.practiceStems.map(stem => {
      const traps = stem.traps ?? archetype.trapNotes;

      return {
        id: stem.id,
        archetypeId: archetype.id,
        text: stem.text,
        answer: stem.answer,
        explanation: stem.explanation,
        traps,
        verificationStatus: archetype.verificationStatus,
        semanticQa: buildSemanticQa(archetype, stem, traps),
      };
    })
  );
}

export function eligibleArchetypes(
  archetypes: readonly Archetype[]
): Archetype[] {
  return archetypes.filter(
    archetype =>
      archetype.verificationStatus === "verified" &&
      archetype.practiceStems.length > 0 &&
      archetype.triggers.length > 0 &&
      archetype.trapNotes.length > 0
  );
}

export function eligiblePracticeItems(
  archetypes: readonly Archetype[]
): ProblemItem[] {
  return toProblemItems(eligibleArchetypes(archetypes)).filter(
    item =>
      item.verificationStatus === "verified" &&
      passesSemanticQa(item.semanticQa)
  );
}

export function eligibleRouterStems(
  routerStems: readonly RouterStem[],
  archetypes: readonly Archetype[]
): RouterStem[] {
  const eligibleArchetypeIds = new Set(
    eligibleArchetypes(archetypes).map(item => item.id)
  );

  return routerStems.filter(
    stem =>
      eligibleArchetypeIds.has(stem.correctId) &&
      isPresent(stem.id) &&
      isPresent(stem.stem) &&
      stem.semanticQa.verificationStatus === "verified" &&
      passesSemanticQa(stem.semanticQa)
  );
}
