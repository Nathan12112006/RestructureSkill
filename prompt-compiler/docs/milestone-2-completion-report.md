# Milestone 2 completion report

## Scope completed

Version 0.2.0 hardens the skill-only workflow with a canonical text action
protocol, deterministic review-state tests, selected-context policy, host setup
templates, one-request bypass wording, and a 60-case semantic fixture suite
with 30 negative implicit-activation cases. No MCP server, backend, custom UI,
authentication, database, persistence, or model API was added.

## Repository audit findings

The Milestone 1 audit is recorded in `docs/milestone-2-audit.md`. The existing
semantic approval boundary, original-request preservation, impact categories,
hidden-instruction prohibition, and no-model-dependency boundary were correct.
The missing deterministic protocol, context provenance, generated templates,
and evaluation breadth were addressed.

## Files created

- `docs/milestone-2-audit.md`: Workstream A audit with structured findings.
- `docs/milestone-2-completion-report.md`: This report.
- `skills/prompt-compiler/references/action-protocol.md`: Four exact action
  envelopes and state rules.
- `skills/prompt-compiler/references/context-selection.md`: Allowed,
  forbidden, and provenance-labeled context policy.
- `skills/prompt-compiler/references/automatic-mode-templates.md`: Deterministic
  ChatGPT Project Instructions and Codex `AGENTS.md` snippets plus bypass.
- `scripts/action-protocol.mjs`: Pure deterministic protocol parsing and state
  transition seam used by automated tests.
- `tests/action-protocol.test.mjs`: Transition and edge-case contract tests.
- `tests/negative-triggers.json`: 30 negative implicit-activation cases.

## Files modified

- `.codex-plugin/plugin.json`: Package version `0.2.0` with the installed
  cachebuster `0.2.0+codex.20260821073731`.
- `package.json`: Version `0.2.0`, no dependencies added.
- `skills/prompt-compiler/SKILL.md`: Protocol, context, templates, and bypass
  rules.
- `skills/prompt-compiler/references/approval-workflow.md`: Active ID/version,
  hash, stale-action, and bypass rules.
- `skills/prompt-compiler/references/output-contract.md`: Review ID and action
  protocol options.
- `tests/fixtures.json`: 60 categorized cases with required semantic fields.
- `scripts/validate-plugin.mjs`: Milestone 2 counts, fields, references,
  markers, versions, negative cases, and forbidden-surface validation.
- `tests/validate-plugin.test.mjs`: Version cachebuster, schema, corpus, and
  protocol/template validator regression tests.
- `README.md`: Milestone 2 behavior, protocol, template, and limitation notes.
- `AGENTS.md`: Current milestone and architecture boundary.
- `docs/architecture.md`: Milestone 2 protocol and fixture architecture.
- `docs/product-decisions.md`: Canonical action, template, context, and bypass
  decisions.
- `docs/phase-2-design.md`: Renamed Milestone 3 future-design wording and
  canonical approval envelope.
- `tests/expected-behaviors.md`: Exact fixture counts, schema, and honest
  quality-measurement guidance.
- `tests/manual-test-checklist.md`: Protocol, provenance, template, and bypass
  checks.

## Architecture decisions

Protocol logic is a small pure Node module, not a runtime service or model
boundary. It preserves exact approved body text and returns a state transition;
the host remains responsible for compilation, context, execution, and native
operational confirmations. Generated host snippets are returned for user
paste/use and are never automatically written.

## Automated tests

Command:

`npm.cmd test`

Result:

31 tests passed, 0 failed. This includes 12 protocol transition tests and 19
repository validator tests.

## Validation

Command:

`npm.cmd run validate`

Result:

Prompt Compiler validation passed. Checked 27 requirements.

## Host tests actually performed

A fresh, ephemeral Codex CLI session was executed with Codex
`0.149.0-alpha.4`, the installed plugin
`prompt-compiler@personal 0.2.0+codex.20260821073731`, a read-only sandbox, and
this explicit invocation:

`$prompt-compiler`

`Explain what the patience setting does in YOLO training in two sentences. Do not modify files.`

The host activated the skill, preserved the two-sentence and no-write
constraints, emitted review ID `pc-7f3b91d2` and prompt version `1`, selected
`answer-only`, listed provenance for both current-request instructions, and
stopped without answering the underlying YOLO question. This passes the
explicit-invocation review-boundary smoke test. ChatGPT Project Instructions,
automatic mode, follow-up state transitions, and corpus-wide quality metrics
were not exercised in a real host.

## Security and privacy checks

- No model-provider SDK or external dependency was added.
- No network, API key, prompt store, transcript store, authentication, or
  telemetry path was added.
- Protocol rejects mismatched IDs, stale/unavailable versions, malformed
  bodies, and hash mismatches.
- Quoted third-party instructions remain content by default.
- The one-request bypass is explicitly nonpersistent.

## Acceptance criteria

- [x] Milestone 1 audit completed.
- [ ] Every explicit constraint in the golden set is preserved in actual host
  outputs; static fixtures define criteria but do not measure quality.
- [x] Golden fixture set contains the required 60 cases and semantic fields.
- [x] Negative implicit-activation fixture set contains at least 30 cases.
- [x] No underlying task is allowed during review in fixtures and skill rules.
- [x] Canonical action protocol transitions and edge cases are automated.
- [x] Approved text is returned exactly and the protocol does not regenerate it.
- [x] Context-selection provenance labels are documented.
- [x] ChatGPT Project Instructions export text is deterministic and explicitly
  user-applied.
- [x] Codex `AGENTS.md` export text is deterministic and explicitly
  user-applied.
- [x] Per-request bypass wording is exact and nonpersistent.
- [ ] Target selection reaches at least 95% in real-host evaluation.
- [ ] Operational-impact selection reaches at least 95% in real-host
  evaluation.
- [ ] Relevant-context precision reaches at least 90% in real-host evaluation.
- [x] Implicit invocation remains disabled.
- [x] Text review remains fully functional in the repository contract and pure
  protocol tests.
- [x] No MCP server, backend, UI, authentication, database, persistence, or
  model API was added.
- [ ] Real-host coverage is partial: one explicit Codex review-boundary smoke
  test passed, but automatic-mode behavior and corpus-wide host results remain
  unmeasured.
- [x] `npm.cmd test` and `npm.cmd run validate` pass in the repository.

## Deviations from the handoff

None known. The protocol module is intentionally testable pure logic and does
not implement a host runtime, UI, or server.

## Known limitations

- Static fixtures define evaluation criteria but do not claim model quality
  scores.
- Host behavior still depends on the currently available ChatGPT or Codex
  surface. One Codex explicit-invocation path was re-certified; other host
  workflows remain untested.
- The Codex session emitted an icon-path warning, but no icon field or `..`
  icon path exists in this repository, its marketplace source, or its installed
  cache. The warning could not be attributed to Prompt Compiler.
- Protocol state is in-memory test logic; durable review state is deferred to
  later milestones.

## Required manual follow-up

In ChatGPT and any additional available Codex host, generate the two setup
snippets, paste them manually where intended, exercise approve/revision/original/
cancel/question/bypass flows, run the full labeled corpus, and record actual
host versions and quality results.

## Recommendation

Ready for next milestone: No. The repository implementation and automated
checks are ready for review, and the explicit Codex smoke test passed, but
mandatory automatic-mode and quality-gate evidence remains unmeasured.
