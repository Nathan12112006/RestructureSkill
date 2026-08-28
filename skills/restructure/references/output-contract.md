# Output contract

Every initial review and every revised review uses this structure. Preserve the
original request verbatim, including spelling and punctuation.

````text
# Prompt review

Target: <ChatGPT | Codex | Current host>
Mode: <Minimal | Balanced | Strict>
Prompt version: <positive integer>

## Original request

<verbatim original request>

## Optimized prompt

```text
<complete optimized prompt>
```

For a nontrivial request, a mandatory numbered list structure applies. Format
the optimized prompt as short labeled sections separated by blank lines. Under
every section, put each distinct item (requirement, constraint, validation step,
or deliverable) on its own numbered item line. Start at `1.` within each section
and number subsequent items sequentially (`2.`, `3.`, etc.). Do not use bullet
items inside a nontrivial optimized prompt or dense prose paragraphs. Simple
one-sentence prompts may stay simple. The fenced text is authoritative and must
be preserved byte-for-byte when it is edited, hashed, or approved; readability
formatting must never normalize or rewrite its contents.

When a host records review state, it may retain the prompt version, approved
SHA-256, and execution SHA-256 for this workflow. Before execution, the host
must verify exact approved-text equality and, when available, hash equality.
If either check fails, it must show an integrity error, re-present the review,
and require a new approval; it must not expose an executable prompt. If
hashing is unavailable, exact text equality remains mandatory.

A section heading followed by an unnumbered prose line fails the final
self-check. Rewrite that line as a numbered item without changing meaning
before presenting the review.

## Assumptions

- <assumption>
```

If there are no assumptions, write:

```text
## Assumptions

None.
```

Continue with `## Meaningful changes`. List only changes that could affect
meaning, scope, validation, or output. If there are none, write exactly:

```text
## Meaningful changes

None. The original request was already sufficiently clear.
```

Then show user-visible standing instructions:

```text
## Applied user instructions

- <instruction> — Source: <one exact provenance label>
```

or:

```text
## Applied user instructions

None.
```

The final sections are mandatory:

```text
## Operational impact

<answer-only | read-only | local-write | external-action | destructive-or-irreversible | unknown>: <brief explanation>

Prompt approval confirms the wording and intent. Native confirmations may
still be required before files, accounts, external services, or destructive
operations are changed.

## Decision

Reply with one:

- Approve and run
- Edit: <requested changes>
- Use original
- Cancel

## Action protocol options

For hosts that support exact action messages, use one of the four envelopes
from `references/action-protocol.md`:

- `RESTRUCTURE_ACTION: APPROVE_AND_RUN`
- `RESTRUCTURE_ACTION: REQUEST_REVISION`
- `RESTRUCTURE_ACTION: USE_ORIGINAL`
- `RESTRUCTURE_ACTION: CANCEL`

The prompt version must match the active review. The approved body is exact,
including whitespace and line breaks. Natural-language options remain
supported. Questions and edits keep the review pending.

Status: Awaiting explicit approval in a new user message.
````

The optimized prompt must be in exactly one fenced plain-text block so it can
be copied without surrounding review commentary. A question or edit request is
not approval. On approval, execute the exact text most recently shown for the
approved version; do not silently regenerate it.

## Optional behaviour tuning

For an MCP review, the host model generates a request-tailored behaviour-tuning
addition alongside every optimized prompt so the renderer has the value ready.
It should tune the model's role and response behaviour to the current request.
For example, a teaching request may receive teacher-oriented guidance, while an
implementation request may receive expert-engineer-oriented guidance. These
are illustrative outcomes, not fixed plugin copy or a magic phrase.

Generate the addition only from task semantics and allowed visible context. It
must remain concise and must not invent credentials or facts, broaden scope or
permissions, change task or output requirements, weaken safety or native
confirmations, or request hidden reasoning.

When an MCP renderer is available, the host passes the addition in the separate
`behaviour_tuning_prompt` review value. The card keeps it off and hidden by
default; checking its control shows an editable value, and the checked value
is composed after the optimized prompt. The MCP server does not generate or
rewrite the addition and makes no model calls. The checkbox state and edits are
transient to that rendered review.

For compatibility, a legacy v1 review without `behaviour_tuning_prompt` remains
valid and uses the optimized-only card without a tuning control. The renderer
does not invent a fallback addition.

When MCP or its UI is unavailable, the host generates, shows, and appends the
addition only after an explicit behaviour-tuning request in the current user
message. Silence means do not generate, show, or append it. The choice and
edits are transient and do not persist into later reviews. If the user has not
opted in for this text-only review, the text fallback contains only the
optimized prompt.

When enabled, the composed prompt shown in the review is the exact approved
body. Approval, hashing, canonical action messages, and execution-integrity
checks apply to that composed body, and turning tuning on or editing it never
executes the underlying request.

After the review is presented, the review turn ends immediately. The host must
not call more tools, continue analysis, inspect files, or perform underlying
work until the user's next message. Approval makes the exact approved body the
sole operative request; execute it without recompiling, subject to native
safety and operational confirmation.

The status line is the final visible line of every pending text review. The
invocation message cannot approve its own review; only a new user message sent
after the review may select an action.

For `<one exact provenance label>`, use exactly one of `Current request`,
`Earlier user message`, `ChatGPT Project Instructions`, `Codex AGENTS.md`,
`Restructure profile`, or `Plugin default`. Do not show hidden source
content.

## Short example

Original request: `what does patience do in YOLO?`

````text
# Prompt review

Target: ChatGPT
Mode: Minimal
Prompt version: 1

## Original request

what does patience do in YOLO?

## Optimized prompt

```text
Explain what the `patience` setting does during YOLO training and give a
short example of when it stops training.
```

## Assumptions

None.

## Meaningful changes

- Made the requested concept and useful example explicit.

## Applied user instructions

None.

## Operational impact

answer-only: The task requests an explanation and does not change anything.

Prompt approval confirms the wording and intent. Native confirmations may
still be required before files, accounts, external services, or destructive
operations are changed.

## Decision

Reply with one:

- Approve and run
- Edit: <requested changes>
- Use original
- Cancel

Status: Awaiting explicit approval in a new user message.
````
