import { z } from "zod";
import {
  ArchetypeSchema,
  RouterStemSchema,
  type Archetype,
  type RouterStem,
} from "./schemas";
import {
  eligibleArchetypes,
  eligiblePracticeItems,
  eligibleRouterStems,
  toProblemItems,
} from "./selectors";

export interface ContentCatalog {
  archetypes: readonly Archetype[];
  routerStems: readonly RouterStem[];
}

export interface ContentValidationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    archetypes: number;
    practiceItems: number;
    routerStems: number;
    eligibleArchetypes: number;
    eligiblePracticeItems: number;
    eligibleRouterStems: number;
  };
}

function addZodIssues(
  errors: string[],
  label: string,
  issues: z.ZodIssue[]
): void {
  issues.forEach(issue => {
    const path = issue.path.length > 0 ? issue.path.join(".") : "root";
    errors.push(`${label}.${path}: ${issue.message}`);
  });
}

function addDuplicateErrors(
  errors: string[],
  label: string,
  ids: string[]
): void {
  const seen = new Set<string>();
  const duplicateIds = new Set<string>();

  ids.forEach(id => {
    if (seen.has(id)) duplicateIds.add(id);
    seen.add(id);
  });

  duplicateIds.forEach(id =>
    errors.push(`${label}[${id}] duplicates a stable id`)
  );
}

export function validateContentCatalog(
  catalog: ContentCatalog
): ContentValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const archetypes = [...catalog.archetypes];
  const routerStems = [...catalog.routerStems];
  const problemItems = toProblemItems(archetypes);

  const archetypeParse = z.array(ArchetypeSchema).safeParse(archetypes);
  if (!archetypeParse.success)
    addZodIssues(errors, "archetypes", archetypeParse.error.issues);

  const routerParse = z.array(RouterStemSchema).safeParse(routerStems);
  if (!routerParse.success)
    addZodIssues(errors, "routerStems", routerParse.error.issues);

  addDuplicateErrors(
    errors,
    "archetypes",
    archetypes.map(item => item.id)
  );
  addDuplicateErrors(
    errors,
    "practiceStems",
    archetypes.flatMap(item => item.practiceStems.map(stem => stem.id))
  );
  addDuplicateErrors(
    errors,
    "routerStems",
    routerStems.map(item => item.id)
  );
  addDuplicateErrors(errors, "catalogIds", [
    ...archetypes.map(item => item.id),
    ...problemItems.map(item => item.id),
    ...routerStems.map(item => item.id),
  ]);

  const archetypeIds = new Set(archetypes.map(item => item.id));

  routerStems.forEach(stem => {
    if (!archetypeIds.has(stem.correctId)) {
      errors.push(
        `routerStems[${stem.id}].correctId references unknown archetype ${stem.correctId}`
      );
    }
  });

  archetypes.forEach(archetype => {
    const routerCount = routerStems.filter(
      stem => stem.correctId === archetype.id
    ).length;
    if (archetype.verificationStatus === "verified" && routerCount === 0) {
      errors.push(
        `archetypes[${archetype.id}] is verified but has no router stems`
      );
    }
  });

  const eligible = eligibleArchetypes(archetypes);
  const eligibleProblems = eligiblePracticeItems(archetypes);
  const eligibleRouters = eligibleRouterStems(routerStems, archetypes);

  eligible.forEach(archetype => {
    const practiceCount = eligibleProblems.filter(
      item => item.archetypeId === archetype.id
    ).length;
    if (practiceCount === 0) {
      errors.push(
        `archetypes[${archetype.id}] is verified but has no eligible practice items`
      );
    }
  });

  problemItems.forEach(item => {
    item.semanticQa.warnings.forEach(warning =>
      warnings.push(`problemItems[${item.id}].semanticQa warning: ${warning}`)
    );
  });

  routerStems.forEach(stem => {
    stem.semanticQa?.warnings.forEach(warning =>
      warnings.push(`routerStems[${stem.id}].semanticQa warning: ${warning}`)
    );
  });

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    stats: {
      archetypes: archetypes.length,
      practiceItems: problemItems.length,
      routerStems: routerStems.length,
      eligibleArchetypes: eligible.length,
      eligiblePracticeItems: eligibleProblems.length,
      eligibleRouterStems: eligibleRouters.length,
    },
  };
}
