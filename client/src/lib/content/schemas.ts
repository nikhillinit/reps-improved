import { z } from "zod";

export const StableIdSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:_[a-z0-9]+)*$/, "must be a stable snake_case id");

const RequiredTextSchema = z.string().trim().min(1);

export const VerificationStatusSchema = z.enum([
  "verified",
  "unverified",
  "ai-generated-unverified",
]);

export type VerificationStatus = z.infer<typeof VerificationStatusSchema>;

export const RootCauseSchema = z.object({
  id: StableIdSchema,
  label: RequiredTextSchema,
});

export type RootCause = z.infer<typeof RootCauseSchema>;

export const PracticeStemSchema = z.object({
  id: StableIdSchema,
  text: RequiredTextSchema,
  answer: RequiredTextSchema,
  explanation: RequiredTextSchema,
  traps: z.array(RequiredTextSchema).optional(),
});

export type PracticeStem = z.infer<typeof PracticeStemSchema>;

export const WorkedExampleSchema = z.object({
  stem: RequiredTextSchema,
  solution: RequiredTextSchema,
  steps: z.array(RequiredTextSchema).min(1),
});

export const ArchetypeSchema = z.object({
  id: StableIdSchema,
  name: RequiredTextSchema,
  shortName: RequiredTextSchema,
  description: RequiredTextSchema,
  triggers: z.array(RequiredTextSchema).min(1),
  disqualifiers: z.array(RequiredTextSchema).min(1),
  derivedCondition: RequiredTextSchema,
  formula: RequiredTextSchema,
  formulaVars: z.record(RequiredTextSchema, RequiredTextSchema),
  trapNotes: z.array(RequiredTextSchema).min(1),
  workedExample: WorkedExampleSchema,
  practiceStems: z.array(PracticeStemSchema).min(1),
  rootCauses: z.array(RootCauseSchema).min(1),
  verificationStatus: VerificationStatusSchema,
});

export type Archetype = z.infer<typeof ArchetypeSchema>;

export const SemanticQaSchema = z.object({
  verificationStatus: VerificationStatusSchema,
  checks: z.object({
    hasStableArchetypeLink: z.boolean(),
    hasSourceBackedAnswer: z.boolean(),
    hasExplanation: z.boolean(),
    hasTrapCoverage: z.boolean(),
  }),
  warnings: z.array(RequiredTextSchema).default([]),
});

export type SemanticQa = z.infer<typeof SemanticQaSchema>;

export const ProblemItemSchema = z.object({
  id: StableIdSchema,
  archetypeId: StableIdSchema,
  text: RequiredTextSchema,
  answer: RequiredTextSchema,
  explanation: RequiredTextSchema,
  traps: z.array(RequiredTextSchema).default([]),
  verificationStatus: VerificationStatusSchema,
  semanticQa: SemanticQaSchema,
});

export type ProblemItem = z.infer<typeof ProblemItemSchema>;

export const RouterStemKindSchema = z.enum([
  "direct",
  "near-miss",
  "conceptual-trap",
]);

export type RouterStemKind = z.infer<typeof RouterStemKindSchema>;

export const RouterStemSchema = z.object({
  id: StableIdSchema,
  stem: RequiredTextSchema,
  correctId: StableIdSchema,
  kind: RouterStemKindSchema.optional(),
  confuserIds: z.array(StableIdSchema).optional(),
  semanticQa: SemanticQaSchema,
});

export type RouterStem = z.infer<typeof RouterStemSchema>;
