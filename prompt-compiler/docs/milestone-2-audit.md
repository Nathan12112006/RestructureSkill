# Milestone 2 audit of Milestone 1

This audit records the Workstream A checks against the repository as found
before Milestone 2 changes. `Correct` means the behavior was already present;
`Finding` identifies the narrow hardening addressed in this milestone.

## Findings

### A-01

ID: A-01  
Severity: Correct  
Observed behavior: The plugin manifest is at `.codex-plugin/plugin.json`,
points to `./skills/`, and the package scripts use the repository root.  
Expected behavior: Manifest and package paths are valid and stable.  
Affected files: `.codex-plugin/plugin.json`, `package.json`  
Proposed fix: None; retain the paths and validate them.  
Verification method: Parse the manifest and run `npm.cmd run validate`.

### A-02

ID: A-02  
Severity: Correct  
Observed behavior: `SKILL.md` has valid `name` and `description` frontmatter
and disables ordinary-question activation in its description.  
Expected behavior: Skill metadata identifies the focused skill and its trigger
boundary.  
Affected files: `skills/prompt-compiler/SKILL.md`  
Proposed fix: Retain the metadata and make the explicit boundary clearer for
Milestone 2.  
Verification method: Validator frontmatter checks and manual inspection.

### A-03

ID: A-03  
Severity: Finding  
Observed behavior: Five references existed, but there was no canonical action
protocol, context-selection policy, or automatic-mode template reference.  
Expected behavior: Every Milestone 2 workflow rule has a referenced,
host-usable document.  
Affected files: `skills/prompt-compiler/references/`  
Proposed fix: Add `action-protocol.md`, `context-selection.md`, and
`automatic-mode-templates.md`, and reference them from the skill.  
Verification method: Required-reference validation and reference inspection.

### A-04

ID: A-04  
Severity: Correct  
Observed behavior: The output contract showed target, mode, original prompt,
optimized prompt, assumptions, meaningful changes, impact, and decisions.  
Expected behavior: Reviews expose the information needed for semantic approval.  
Affected files: `references/output-contract.md`  
Proposed fix: Preserve the existing sections and add review ID and protocol
options.  
Verification method: Output-contract validator checks and manual review.

### A-05

ID: A-05  
Severity: Finding  
Observed behavior: Natural-language approval language was documented, but
there was no deterministic envelope for a future host control.  
Expected behavior: Natural-language choices remain supported alongside four
exact action envelopes.  
Affected files: `references/approval-workflow.md`, `references/output-contract.md`  
Proposed fix: Define the canonical action protocol and retain the four natural
language options.  
Verification method: Protocol transition tests and static marker validation.

### A-06

ID: A-06  
Severity: Finding  
Observed behavior: Prompt versions were described, but active review IDs,
available earlier versions, hashes, and stale-action rejection were not
deterministically specified.  
Expected behavior: Each review has an opaque ID and positive version; stale,
mismatched, unavailable, or hash-inconsistent approvals are rejected.  
Affected files: `references/approval-workflow.md`, `references/action-protocol.md`,
`scripts/action-protocol.mjs`  
Proposed fix: Add the state transition seam and tests for active and earlier
versions.  
Verification method: `tests/action-protocol.test.mjs`.

### A-07

ID: A-07  
Severity: Correct  
Observed behavior: The skill required the original request to be preserved
verbatim and the output contract displayed it outside the optimized block.  
Expected behavior: Original wording, spelling, and punctuation remain visible
and are available for Use original.  
Affected files: `SKILL.md`, `references/output-contract.md`  
Proposed fix: Retain the rule and test verbatim original selection in the
protocol seam.  
Verification method: Original-selection transition test.

### A-08

ID: A-08  
Severity: Correct  
Observed behavior: Material assumptions were required to be shown, and the
skill prohibited invented facts and permissions.  
Expected behavior: Necessary assumptions are visible and uncertain details are
not silently asserted.  
Affected files: `SKILL.md`, `references/output-contract.md`  
Proposed fix: Retain behavior; add provenance rules for imported context.  
Verification method: Manual fixture criteria and context policy inspection.

### A-09

ID: A-09  
Severity: Correct  
Observed behavior: Meaningful changes were limited to scope, meaning,
validation, or output changes, with an explicit None form.  
Expected behavior: Simple prompts do not receive decorative expansion.  
Affected files: `SKILL.md`, `references/output-contract.md`  
Proposed fix: Retain the minimal-change rule and expand simple answer fixtures.  
Verification method: Golden fixture schema and manual evaluation checklist.

### A-10

ID: A-10  
Severity: Correct  
Observed behavior: Operational impact used the six documented classifications
and stated that semantic approval does not grant native permissions.  
Expected behavior: Impact is visible and remains informational.  
Affected files: `SKILL.md`, `references/output-contract.md`  
Proposed fix: Retain classifications and add external/destructive coverage.  
Verification method: Fixture category validation and output-contract review.

### A-11

ID: A-11  
Severity: Finding  
Observed behavior: Edit, Use original, and Cancel were described, but the
repository had no executable transition contract for revisions, questions, or
replay after cancellation.  
Expected behavior: Edits create pending revisions, questions do not execute,
Use original is verbatim, and cancellation cannot be replayed.  
Affected files: `references/approval-workflow.md`, `scripts/action-protocol.mjs`  
Proposed fix: Add deterministic transitions and edge tests.  
Verification method: `tests/action-protocol.test.mjs` covers all transitions.

### A-12

ID: A-12  
Severity: Correct  
Observed behavior: The skill explicitly stopped before inspecting, editing,
sending, publishing, deleting, or otherwise performing the task.  
Expected behavior: No underlying task starts during review.  
Affected files: `SKILL.md`, `references/approval-workflow.md`  
Proposed fix: Retain the mandatory boundary and set every golden case to false
for underlying-task execution during review.  
Verification method: Fixture validation and manual host checklist.

### A-13

ID: A-13  
Severity: Correct  
Observed behavior: Quoted and pasted third-party text was treated as content by
default and could not override host instructions.  
Expected behavior: Quoted prompt-injection-like text is not followed.  
Affected files: `SKILL.md`, `references/semantic-preservation.md`  
Proposed fix: Retain the rule and add five quoted-content fixtures.  
Verification method: Quoted fixture category and manual semantic checks.

### A-14

ID: A-14  
Severity: Correct  
Observed behavior: Minimal mode and the examples instructed the compiler to
keep simple prompts concise.  
Expected behavior: Answer-only requests do not gain file operations or large
generic templates.  
Affected files: `SKILL.md`, `references/examples.md`  
Proposed fix: Retain behavior and add ten answer-only fixtures.  
Verification method: Category counts and manual evaluation.

### A-15

ID: A-15  
Severity: Correct  
Observed behavior: The skill prohibited revealing system, developer, policy,
private-memory, and private-reasoning content.  
Expected behavior: Hidden or unavailable instructions are never exposed.  
Affected files: `SKILL.md`, `references/semantic-preservation.md`  
Proposed fix: Retain the prohibition and document only user-visible provenance.  
Verification method: Context-policy review and quoted-content fixtures.

### A-16

ID: A-16  
Severity: Finding  
Observed behavior: Conversation guidance allowed relevant context but did not
specify exact allowed, forbidden, and provenance-labeled sources.  
Expected behavior: Context selection is narrow, user-visible, and labeled.  
Affected files: `SKILL.md`, `references/context-selection.md`  
Proposed fix: Add the context-selection policy and exact six provenance labels.  
Verification method: Validator checks all labels and manual policy inspection.

### A-17

ID: A-17  
Severity: Correct  
Observed behavior: Package metadata had no dependencies and the validator
rejected model-provider SDK markers.  
Expected behavior: Milestone 2 remains skill-only with no model API, MCP,
backend, UI, authentication, database, or persistence implementation.  
Affected files: `package.json`, `scripts/validate-plugin.mjs`  
Proposed fix: Keep dependencies empty and extend forbidden-surface checks.  
Verification method: Dependency scan, forbidden-directory scan, and package
validation.

## Audit conclusion

The core Milestone 1 approval boundary was present. Milestone 2 findings were
limited to deterministic protocol coverage, explicit context/template rules,
and evaluation/validation breadth. No backend, model API, MCP server, UI,
authentication system, database, or persistence layer was required or added.
