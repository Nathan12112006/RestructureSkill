import { z } from 'zod';

export const MAX_PROMPT_CHARS = 50_000;
export const MAX_LIST_ITEMS = 50;
export const MAX_WARNINGS = 20;
export const MAX_ITEM_CHARS = 2_000;

export const PROVENANCE_SOURCES = [
  'Current request',
  'Earlier user message',
  'ChatGPT Project Instructions',
  'Codex AGENTS.md',
  'Restructure profile',
  'Plugin default',
] as const;

const boundedText = z.string().max(MAX_ITEM_CHARS, `must be at most ${MAX_ITEM_CHARS} characters`);
const boundedList = z.array(boundedText).max(MAX_LIST_ITEMS, `must contain at most ${MAX_LIST_ITEMS} items`);

export const assumptionsSchema = z.object({
  low: boundedList,
  medium: boundedList,
  high: boundedList,
}).strict();

export const appliedInstructionSchema = z.object({
  text: boundedText,
  source: z.enum(PROVENANCE_SOURCES),
}).strict();

export const operationalImpactSchema = z.object({
  level: z.enum([
    'answer-only',
    'read-only',
    'local-write',
    'external-action',
    'destructive-or-irreversible',
    'unknown',
  ]),
  reason: boundedText,
}).strict();

export const promptReviewSchema = z.object({
  version: z.number().int().positive(),
  target: z.enum(['chatgpt', 'codex', 'current-host']),
  mode: z.enum(['minimal', 'balanced', 'strict']),
  original_prompt: z.string().min(1, 'must be nonempty').max(MAX_PROMPT_CHARS),
  optimized_prompt: z.string().min(1, 'must be nonempty').max(MAX_PROMPT_CHARS),
  behaviour_tuning_prompt: z.string()
    .min(1, 'must be nonempty')
    .max(MAX_PROMPT_CHARS)
    .describe('Request-tailored model role and working-style guidance generated alongside the optimized prompt without changing scope, facts, permissions, safety, or approval requirements.')
    .optional(),
  assumptions: assumptionsSchema,
  meaningful_changes: boundedList,
  applied_user_instructions: z.array(appliedInstructionSchema).max(MAX_LIST_ITEMS),
  operational_impact: operationalImpactSchema,
  revision_count: z.number().int().nonnegative(),
  warnings: z.array(boundedText).max(MAX_WARNINGS),
}).strict();

export type PromptReview = z.infer<typeof promptReviewSchema>;
export type ProvenanceSource = typeof PROVENANCE_SOURCES[number];

export function totalAssumptions(review: Pick<PromptReview, 'assumptions'>): number {
  return review.assumptions.low.length + review.assumptions.medium.length + review.assumptions.high.length;
}

export function validatePromptReview(input: unknown): PromptReview {
  const parsed = promptReviewSchema.safeParse(input);
  if (!parsed.success) {
    const details = parsed.error.issues.map((issue) => {
      const location = issue.path.length ? issue.path.join('.') : 'review';
      return `${location}: ${issue.message}`;
    });
    throw new Error(`Invalid prompt review: ${details.join('; ')}`);
  }
  const assumptions = totalAssumptions(parsed.data);
  if (assumptions > MAX_LIST_ITEMS) {
    throw new Error(`Invalid prompt review: assumptions must contain at most ${MAX_LIST_ITEMS} items`);
  }
  return parsed.data;
}
