# Canonical action protocol

The text protocol is a deterministic fallback for hosts that cannot render a
review control. Natural-language decisions remain supported; a host may use
these envelopes when it needs an unambiguous action message.

Every review has an opaque `REVIEW_ID` and a positive `PROMPT_VERSION`. The
review ID is generated for the review and must match exactly. A review remains
pending until one of the four actions below is accepted. The host must retain
the exact prompt text associated with each available version.

## Approve and run

```text
PROMPT_COMPILER_ACTION: APPROVE_AND_RUN
REVIEW_ID: <opaque-id>
PROMPT_VERSION: <positive integer>
APPROVED_PROMPT_SHA256: <lowercase hash or UNAVAILABLE>
APPROVED_PROMPT_BEGIN
<exact approved prompt>
APPROVED_PROMPT_END
```

The body between the begin and end markers is authoritative. Preserve every
whitespace character, blank line, line ending, and trailing space. When a lowercase SHA-256
is available it must hash that exact body; `UNAVAILABLE` is allowed when the
host cannot calculate a hash. Execute no regenerated or reconstructed text.

For the active prompt version, the body submitted from the editable review
control is the user's exact approval record. It may differ from the initially
rendered body, but its supplied hash must match that submitted body. An
explicitly selected earlier version is immutable and must still match the
stored body for that version.

## Request revision

```text
PROMPT_COMPILER_ACTION: REQUEST_REVISION
REVIEW_ID: <opaque-id>
BASE_PROMPT_VERSION: <positive integer>
REVISION_REQUEST_BEGIN
<requested changes>
REVISION_REQUEST_END
```

This requests a new review. It is never approval. The revision request keeps
the underlying task pending; a newly generated review receives a new positive
version.

## Use original

```text
PROMPT_COMPILER_ACTION: USE_ORIGINAL
REVIEW_ID: <opaque-id>
ORIGINAL_REQUEST_SHA256: <lowercase hash or UNAVAILABLE>
```

Use the original request verbatim. If a hash is present it must match the
original request exactly.

## Cancel

```text
PROMPT_COMPILER_ACTION: CANCEL
REVIEW_ID: <opaque-id>
```

Cancellation ends the review. Later actions for that review cannot resurrect
it; the host must create a new review with a new review ID.

## Validation and state rules

- Reject malformed envelopes, missing bodies, non-positive versions, unknown
  actions, and mismatched review IDs.
- Reject an unavailable or stale version. An explicitly identified earlier
  version may be approved only while it remains available in the active review
  history and its exact body still matches.
- A question is not an action. Answer it and keep the review pending.
- A natural-language edit or request for changes is a revision, not approval.
- A cancelled, approved, or original-selected review is no longer pending.
- Approval means the exact approved body is the operative prompt; it does not
  grant native permission to edit files, send messages, access services, or
  perform destructive actions.

## Execution integrity

Immediately before execution, the host compares the exact operative text with
the exact approved text. If hashing is available, it computes the execution
SHA-256 and compares it with `APPROVED_PROMPT_SHA256`. Exact string equality
is mandatory even when hashing is unavailable; whitespace and line breaks are
never normalized.

When conversation state is available, retain only these review facts for the
current workflow: review ID, prompt version, approved hash, and execution
hash. Do not persist approved prompt content as profile data. If text or hash
verification fails, return a clear integrity error with no executable prompt,
do not execute, re-present the review, and require a new approval.

Natural-language options remain valid: `Approve and run`, `Edit: <requested
changes>`, `Use original`, and `Cancel`. The protocol is an additional exact
transport, not a replacement for those options.
