# Milestone 3 MCP review interface

This document describes the implemented optional MCP Apps review interface.
The repository preserves the Milestone 1/2 skill and text-only workflow when
MCP or UI support is unavailable.

## Implemented flow

```text
User request
    → skill and current host model compile a review
    → model calls render_prompt_review when available
    → MCP server validates structured review data
    → inline editable card, with complete text fallback
    → user selects Approve, Edit, Use original, or Cancel
    → component sends exact follow-up text to the same conversation
```

The MCP server does not call a model. It validates closed-world review data,
renders the interface, and returns data without storing UI state. It is
read-only with respect to external systems and does not replace native
operational confirmations.

## Render tool

`render_prompt_review` accepts an opaque `review_id`, positive `version`,
`target`, `mode`, `original_prompt`, `optimized_prompt`, grouped assumptions,
`meaningful_changes`, `applied_user_instructions`, an operational-impact
level/reason, revision count, and warnings. Prompts are bounded at 50,000
characters; list and item limits are enforced by the strict schema. The schema
is secret-free and does not accept unnecessary conversation history.

The tool returns validated `structuredContent`, a complete plain-text fallback,
and a versioned `ui://` resource link. Its annotations are
`readOnlyHint: true`, `destructiveHint: false`, and `openWorldHint: false`.

## Interface behavior

The inline card displays target, mode, version, review ID, an editable optimized
prompt, a separate revision-request field, original request, assumptions,
meaningful changes, applied instructions with source labels, operational impact,
warnings, revision count, and four actions. It uses `textContent` and textarea
`value` for untrusted data, a restrictive CSP, no third-party resources, and no
browser storage.

The card initializes through the shared MCP Apps bridge, listens for standard
tool input/result notifications, and sends actions through `ui/message` with
the canonical Milestone 2 envelopes. It feature-detects
`window.openai.sendFollowUpMessage({ prompt })` only as a compatibility
fallback. Rendering never sends an action.

## Exact follow-up

Approval carries the exact edited text and version:

```text
PROMPT_COMPILER_ACTION: APPROVE_AND_RUN
REVIEW_ID: <opaque-id>
PROMPT_VERSION: 2
APPROVED_PROMPT_SHA256: <lowercase hash or UNAVAILABLE>
APPROVED_PROMPT_BEGIN
<exact edited prompt>
APPROVED_PROMPT_END
```

Request revision carries the exact separate revision-request field and the
base version. Use original hashes the verbatim original request. Cancel carries
only its canonical action and review ID. These messages never initiate an
action; the host continues to enforce semantic and native operational
confirmation.

## Security and privacy boundaries

No preferences are stored, no raw prompt logging or diagnostics are emitted,
and no authorization or external model service is present. Static tests check
that annotations match read-only behavior and that the UI has no network,
storage, token, or hidden-content path.
