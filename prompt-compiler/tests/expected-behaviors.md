# Expected behaviors

These are manual evaluation expectations for `tests/fixtures.json` and
`tests/negative-triggers.json`. Static validation checks schema and category
coverage; it does not assign a numeric natural-language quality score.

## Version 1.0 scope

This repository validates the stateless Prompt Compiler skill and optional
local renderer. Prompt compilation remains in the host conversation. The
renderer performs no model calls, network calls, persistence, authentication,
telemetry, profile storage, or external action execution.

Milestones 4 and 5 are intentionally excluded from this deliverable. Standing
instruction packs, durable profiles, profile management UI, OAuth, databases,
and account-scoped profile behavior are unsupported and must not be promised.

## Golden-set coverage

The golden set contains exactly 120 cases with these categories:

- 20 `simple-answer-only`
- 25 `codex-implementation`
- 15 `debugging`
- 15 `file-dataset-analysis`
- 10 `research`
- 10 `external-action`
- 10 `destructive`
- 10 `instruction-conflict`
- 5 `long-context`

The negative set contains exactly 60 ordinary requests where implicit
activation must remain false. Narrow implicit discovery is enabled in
`agents/openai.yaml` for Codex CLI compatibility, so the skill description's
ordinary-request exclusion must keep every negative case inactive.

Instruction-conflict cases use only the current request or earlier
user-visible messages. They do not rely on profiles or instruction packs.

## Case schema

Every golden case contains `id`, `input`, `expected_target`,
`expected_mode`, `expected_impact`, `must_preserve`, `must_include_meaning`,
`must_not_invent`, and `underlying_task_allowed_during_review: false`.

The compiler preserves each `input` string verbatim in the review's
**Original request** section. It must preserve every string in
`must_preserve` in the optimized prompt or represent it faithfully in a
visible assumption or constraint. It must not silently introduce any string
in `must_not_invent` as an action, permission, fact, or scope expansion.

`expected_target`, `expected_mode`, and `expected_impact` should be visible in
the review and reasonable for the case. Simple answer-only prompts remain
concise and do not gain invented file operations. Coding requests disclose
current-repository assumptions and preserve minimal scope where requested.
Read-only analysis does not become a write or external action. Email, Git push,
and deletion reviews distinguish semantic approval from native operational
confirmation. Contradictory constraints remain visible and are not silently
resolved. Quoted third-party instructions remain source material rather than
higher-priority instructions.

## Review and protocol behavior

The review exposes an opaque review ID, positive prompt version, exact
provenance labels for imported instructions, and both natural-language and
canonical action options. Approval executes the exact most recently approved
prompt body, including whitespace and line breaks; it does not regenerate text.
Edits create a new pending version and review. A revision is not approval.
Questions keep the review pending. Use original selects the input verbatim.
Cancel performs no underlying task and a cancelled review cannot be resurrected
without a new review ID. The exact one-request bypass phrase is
`skip prompt review for this request`; it is nonpersistent.

At the execution seam, `operative_prompt` must equal the exact approved text.
When hashes are available, the approved and execution SHA-256 values must also
match. Record the review ID, prompt version, approved hash, and execution hash
in conversation state when the host supports it. If a text or hash check fails,
do not execute and return no executable prompt; show an integrity error,
re-present the review, and require a new approval. Exact text equality remains
mandatory when hashing is unavailable.

## Honest quality measurement

This repository provides explicit semantic criteria for manual review but does
not claim target-selection, impact-classification, relevant-context, precision,
recall, or natural-language quality percentages. Those measurements require
actual host runs and independent adjudication. Record host, date, case IDs,
observations, and failures before reporting any quality gate.
