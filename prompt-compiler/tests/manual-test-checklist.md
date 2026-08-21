# Manual test checklist

Run this checklist for every case in `fixtures.json` in an explicitly invoked
Prompt Compiler session.

- [ ] The skill activates when explicitly invoked.
- [ ] The underlying task is not performed during review.
- [ ] The input is shown verbatim as the review's Original request.
- [ ] An opaque Review ID and positive prompt version are shown.
- [ ] The selected target is reasonable.
- [ ] The selected mode is reasonable.
- [ ] Every explicit constraint is preserved.
- [ ] No unsupported fact is invented.
- [ ] Assumptions are visible.
- [ ] Meaningful changes are accurate.
- [ ] Operational impact is reasonable.
- [ ] The optimized prompt is not unnecessarily long.
- [ ] A nontrivial optimized prompt uses short labeled sections and/or concise
      bullet lists with blank lines; simple one-sentence prompts may remain simple.
- [ ] The review turn ends immediately after text/MCP rendering with no more
      tools, analysis, file inspection, or underlying work.
- [ ] The four decision options are shown.
- [ ] Canonical action protocol options are shown with the active Review ID and
      version.
- [ ] Imported instructions use exactly one allowed provenance label: Current
      request, Earlier user message, ChatGPT Project Instructions, Codex
      AGENTS.md, Prompt Compiler profile, or Plugin default.
- [ ] Approved prompt whitespace and line breaks are preserved exactly.
- [ ] Approve and run uses the exact prompt shown.
- [ ] Approval treats the exact approved body as the sole operative request and
      does not recompile it before execution.
- [ ] Edit creates a new version and another review.
- [ ] Use original selects the original text.
- [ ] Cancel performs no underlying task.
- [ ] Native operational confirmations remain separate.
- [ ] A question keeps the review pending and an edit is not approval.
- [ ] A cancelled review cannot resume without a new review ID.
- [ ] `skip prompt review for this request` bypasses only the current request.
- [ ] Generated ChatGPT Project Instructions and Codex `AGENTS.md` text is
      returned for user paste/use and is never auto-written.
- [ ] When MCP is available, `render_prompt_review` returns the structured
      review, UI resource link, complete text fallback, and read-only annotations.
- [ ] The card displays untrusted values as text, has a visible editable
      optimized prompt and separate revision-request field, and works at 200% zoom.
- [ ] Approve and run hashes the exact optimized textarea value; Request
      revision uses the exact nonempty revision-request field and base version.
- [ ] Use original hashes the verbatim original request; Cancel sends only the
      canonical cancellation message.
- [ ] The card sends `ui/initialize` and listens for standard tool input/result
      notifications; `ui/message` is primary and the compatibility bridge is
      only used when the shared bridge is unavailable.
- [ ] When MCP/UI is unavailable, no review payload is sent and the complete
      text fallback remains visible.

## Required scenarios

### A — simple prompt

Invoke with `@Prompt Compiler` and `What does patience mean in YOLO training?`.
Expect ChatGPT, Minimal, answer-only, a short prompt, and no task execution.

### B — vague Codex task

Invoke with `$prompt-compiler` and `Fix the login issue and don't over engineer
it.` Expect Codex, Balanced, minimal-change boundaries, a current-repository
assumption when appropriate, local-write impact, and no execution before
approval.

### C — detailed dataset task

Invoke with the uploaded YOLO dataset request from the handoff. Expect the exact
`Water accumulation` class and fixed-test-set prohibition to remain visible;
review must not analyze or modify the dataset.

### D — external action

Invoke with `Email my professor and tell them I will submit tomorrow.` Expect
external-action classification, no send, and a clear native confirmation note.

### E — edit

After a review, send `Edit: Do not add tests and do not modify package.json.`
Expect a new version and review, with no execution.

### F — use original

After a review, send `Use original.` Expect the exact original request to become
operative, without regeneration and with native confirmations still applying.

### G — already structured

Use a request with objective, context, constraints, validation, and output.
Expect `None. The original request was already sufficiently clear.` under
Meaningful changes and no unnecessary expansion.

### H — Codex action protocol

Invoke with `$prompt-compiler` in a Codex repository. Check that the review
includes an opaque ID and version, then test valid approval, a mismatched ID,
an unavailable version, a revision request, a question, Use original, and
Cancel. Confirm the exact approved body is the text executed by the host only
after native operational confirmation.

### I — automatic-mode setup text

Ask Prompt Compiler to generate ChatGPT Project Instructions and a marked
Codex `AGENTS.md` section. Confirm the returned snippets match the deterministic
templates, include their paste/use explanation, and do not modify either host
setting automatically.

### J — one-request bypass

Send exactly `skip prompt review for this request`, confirm the current request
proceeds under native host behavior, then send a later request and confirm the
review is still active.
