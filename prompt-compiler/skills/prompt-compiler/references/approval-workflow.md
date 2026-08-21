# Approval workflow

## States

The conversational states are:

`idle` → `review-pending` → `approved` or `revision-pending` or
`original-selected` or `cancelled`.

`revision-pending` returns to `review-pending` after a new review. `approved`
and `original-selected` move to `executing`, then `completed`, only when the
host proceeds with the underlying task.

## Initial review

An explicit invocation with a non-empty request creates version 1 and presents
the complete output contract. The review response must stop before inspecting,
editing, sending, publishing, deleting, or otherwise performing the requested
task. The review turn is terminal: after the text review or MCP render, call no
more tools, continue no analysis, inspect no files, and do no underlying work
until the user's next message.

An empty request receives:

`I need the request you want structured. Add it after invoking Prompt Compiler.`

## Decisions

### Approve and run

Clear approvals include `Approve and run.`, `Approved.`, `Use the optimized
prompt.`, and `Run prompt version 2.` The host executes the exact optimized
prompt text shown for the approved version. That exact text becomes the sole
operative request.
Execute it without recompiling, silently regenerating, expanding, or altering
it after approval.

### Edit

An edit such as `Edit: Do not add tests, and only inspect files inside
src/auth.` is a request for revision, not approval. Apply the requested edit,
increment the version, show revised assumptions and meaningful changes, and
request approval again. `Looks good, but don't change dependencies.` is also an
edit because it changes constraints.

### Use original

Use the user's original request verbatim as the operative prompt. Do not
regenerate or silently add the optimized wording. Native safety and tool
confirmations still apply.

### Cancel

Stop and do not perform the original or optimized task. A concise response is:

`Cancelled. No underlying task was performed.`

### Questions and unclear responses

A question such as `Will this modify my files?` is not approval. Answer it from
the review, keep the review pending, and show the decisions again if needed.
When intent is genuinely unclear, do not execute.

## Versioning

Every presented review has a positive, monotonically increasing version within
the current workflow and an opaque review ID. A user may approve the active
version or explicitly identify an earlier version that remains available in
the active review history. A stale or unavailable version is rejected. The
exact text shown for that version is authoritative; the canonical protocol may
also include a lowercase SHA-256 or `UNAVAILABLE`.

Canonical action envelopes and malformed-action rules are defined in
`action-protocol.md`. They supplement, and do not replace, the natural-language
decisions above.

## Semantic versus operational approval

Semantic approval answers whether the wording represents user intent. Prompt
Compiler owns that step. Operational approval answers whether a host or tool
may edit files, install a dependency, access the network, send an email, push a
branch, or delete data. Those confirmations remain native to ChatGPT, Codex,
and their tools.

Always include:

`Prompt approval confirms the wording and intent. Native confirmations may
still be required before files, accounts, external services, or destructive
operations are changed.`

Approval of a rewritten prompt never grants blanket permission.

For a one-request bypass, accept only the exact phrase
`skip prompt review for this request`. It is nonpersistent and does not alter
future reviews, Project Instructions, `AGENTS.md`, or profiles.
