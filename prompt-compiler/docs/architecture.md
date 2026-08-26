# Architecture

## Product boundary

Prompt Compiler 1.0 is a host-model skill with an optional local MCP Apps
renderer. Compilation stays in the ChatGPT or Codex conversation. The host
model sees the current request and only relevant, user-visible context, then
produces a review before it performs the requested work.

The MCP process is deliberately smaller than the host:

- It validates one structured review contract.
- It renders one optional review resource.
- It returns a complete plain-text fallback and canonical action messages.
- It has no model calls, network service, database, authentication, telemetry,
  prompt retention, or external action execution.

The package is a repository/local-marketplace deliverable. It is not a hosted
production service.

## Runtime flow

    User request
        |
        v
    Prompt Compiler skill in the host conversation
        |
        | relevant visible context only
        v
    Host model compiles target, mode, prompt, assumptions, changes, and impact
        |
        +--> text-only review (when MCP/UI is unavailable)
        |
        +--> render_prompt_review (optional local MCP process)
                 |
                 +--> strict validation
                 +--> structured review + text fallback + UI resource link
        |
        v
    User chooses Approve, Edit, Use original, or Cancel in a new message
        |
        v
    Host handles that action; native operational permissions still apply

Rendering never approves or executes a request. The host must stop after
presenting the review. Only a later user message can choose an action.

## Responsibility boundaries

### Host conversation

The host owns the original request, relevant context selection, compilation,
prompt versions, semantic approval, and the exact text used after approval.
The host model also chooses the target (ChatGPT, Codex, or current host),
compilation mode, assumptions, meaningful changes, and operational impact.

### MCP renderer

The renderer owns deterministic schema validation and presentation only. It
accepts no unknown review fields, enforces bounded text/list sizes, and returns
the review as structured content, complete text, and a versioned UI resource
reference. It does not rewrite, regenerate, store, or execute the prompt.

### Review UI

The optional HTML resource owns temporary display and input state: the edited
textarea, collapsed sections, validation messages, and action-submission
status. It sends canonical action messages through the host bridge; it never
performs the underlying task.

## Approval boundaries

Prompt Compiler approval means that the user accepts the wording and intent.
It is not authorization to modify files, install packages, access a network,
push a branch, send a message, delete data, or change an account. The host and
its tools keep their own native confirmation and permission checks.

For approval actions, the edited textarea is hashed and included with the
exact body. The host action protocol rejects stale review IDs, versions, and
hashes. Whitespace and line breaks are meaningful and remain unchanged.

## Degraded operation

When the MCP process, UI resource, JavaScript, or host bridge is unavailable,
the skill uses its complete text review. In that mode it does not send a
review payload to MCP, and approval remains available through the text action
protocol. A UI failure cannot turn a review into automatic execution.

## Repository components

- .codex-plugin/plugin.json: plugin manifest and optional MCP declaration.
- skills/prompt-compiler/: host-side skill and its text/action references.
- .mcp.json: local stdio launch configuration.
- mcp/src/: strict schema, renderer, fallback, and stdio server.
- mcp/public/: static review card with no third-party resources.
- mcp/dist/: standalone bundled runtime shipped for local installation.
- .agents/plugins/marketplace.json: repository marketplace entry.

There is intentionally no server, API, database, account, authentication, or
profile directory.
