import { ARCHETYPES, ROUTER_STEMS } from "../client/src/lib/archetypes";
import {
  eligibleArchetypes,
  eligiblePracticeItems,
  eligibleRouterStems,
} from "../client/src/lib/content/selectors";
import { validateContentCatalog } from "../client/src/lib/content/validate";

const validation = validateContentCatalog({
  archetypes: ARCHETYPES,
  routerStems: ROUTER_STEMS,
});
const archetypes = eligibleArchetypes(ARCHETYPES);
const practiceItems = eligiblePracticeItems(ARCHETYPES);
const routerStems = eligibleRouterStems(ROUTER_STEMS, ARCHETYPES);

const errors = [...validation.errors];

if (archetypes.length === 0) errors.push("No verified archetypes are eligible");
if (practiceItems.length === 0)
  errors.push("No verified practice items are eligible");
if (routerStems.length === 0)
  errors.push("No verified router stems are eligible");

const result = {
  ok: errors.length === 0,
  errors,
  warnings: validation.warnings,
  stats: {
    ...validation.stats,
    eligibleArchetypeIds: archetypes.map(item => item.id),
    eligiblePracticeItemIds: practiceItems.map(item => item.id),
    eligibleRouterStemIds: routerStems.map(item => item.id),
  },
};

console.log(JSON.stringify(result, null, 2));

if (!result.ok) {
  process.exitCode = 1;
}
