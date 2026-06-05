import { ARCHETYPES, ROUTER_STEMS } from "../client/src/lib/archetypes";
import { validateContentCatalog } from "../client/src/lib/content/validate";

const result = validateContentCatalog({
  archetypes: ARCHETYPES,
  routerStems: ROUTER_STEMS,
});

console.log(JSON.stringify(result, null, 2));

if (!result.ok) {
  process.exitCode = 1;
}
