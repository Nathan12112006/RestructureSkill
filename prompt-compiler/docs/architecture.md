# Architecture

## Milestone 2: skill-only package

The package contains one focused skill, reference documents, a pure testable
action-protocol seam, static validation, 60 semantic fixtures, 30 negative
trigger fixtures, and documentation. The host conversation is the
runtime boundary:

```text
User request
    → Prompt Compiler skill
    → current ChatGPT or Codex model compiles a review
    → user chooses Approve, Edit, Use original, or Cancel
    → current host continues only after that choice
```

The review response must stop before the underlying task. The skill does not
intercept every message and starts with explicit invocation; implicit invocation
remains disabled; automatic-mode setup is provided only as deterministic
snippets for the user to paste into a selected host.

## Why no API request is needed

Prompt compilation is a transformation performed by the model already running
the conversation. A second OpenAI API request would require separate
credentials, add latency, risk duplicating context, and create an unnecessary
external data path. Milestone 2 therefore makes no network request, asks for no
API key, and has no model-provider dependency.

## Conversation as context source

The current host supplies the relevant conversation context. The skill may use
earlier user-visible details that materially clarify the request, but it must
not request or copy the entire transcript and must not expose hidden host
instructions or private reasoning.

## Semantic and operational approval

Prompt Compiler owns semantic approval: whether the optimized wording
represents the user's intent. ChatGPT, Codex, and tools own operational approval:
whether files, accounts, external systems, network resources, or destructive
state may be changed. An approved wording is never blanket authorization.

## Text-only fallback and action protocol

The review is a complete text contract. It shows target, mode, version, original
request, optimized prompt, assumptions, meaningful changes, applied user
instructions, operational impact, opaque review ID, prompt version, and four
decisions. The canonical protocol preserves exact body text and rejects stale,
mismatched, malformed, or hash-inconsistent actions. It works without custom
UI and makes exact approved-prompt execution explicit.

## Optional MCP boundary

Milestone 3 adds a bundled MCP server that validates structured review data and
returns an editable UI resource plus a complete text fallback. It is stateless,
read-only, closed-world, and never calls a model or initiates an action. The
skill remains usable when the MCP server or UI is unavailable.
