# Prompt Compiler

Prompt Compiler is a skill plugin with an optional MCP review renderer that
turns an ordinary request into a clear, target-specific ChatGPT or Codex prompt. It preserves explicit intent
and constraints, shows assumptions and meaningful changes, classifies
operational impact, and waits for semantic approval before the host performs
the underlying task.

## Why it stays in the conversation

Milestones 1 and 2 keep compilation inside the current conversation. The current
ChatGPT or Codex model performs the restructuring using context already
available in that conversation, so the plugin does not need a second model
request, remote backend, transcript upload, or database.

## API-key requirement

Milestone 2 does not require an OpenAI API key. This package does not call the
OpenAI API or any other model-provider API, and it does not claim that a
ChatGPT subscription includes API usage.

## Installation

This repository has not been fully host-certified as part of this repository test
run. The steps below separate documented platform behavior from actions that
still require manual verification because installation surfaces can change.

### Confirmed current references

- [ChatGPT plugins documentation](https://learn.chatgpt.com/docs/plugins)
  describes the Plugins tab in ChatGPT web/desktop for browsing public plugins.
- [OpenAI plugin build documentation](https://developers.openai.com/plugins/build/plugins)
  documents local plugin packaging and local marketplace locations.

### Codex

The current documented workflow uses `/plugins` to browse or enable plugins in
Codex and a configured marketplace, followed by a new session when required.
This repository intentionally creates no marketplace entry and does not install
itself. For a local marketplace workflow, manually verify the current
documentation, place the plugin in the supported local marketplace structure,
and use `codex plugin marketplace add ./local-marketplace-root` only for a
non-default marketplace that you explicitly configured. Then start a new
session if the host requests it.

### ChatGPT

Manually verify the current ChatGPT Plugins tab and plugin availability before
attempting installation. This skill package alone is not evidence that the
plugin has been installed, listed, or exercised in ChatGPT.

## Usage

Explicit invocation remains the supported workflow:

```text
@Prompt Compiler

Fix the login thing and make sure it works without changing too much.
```

In Codex, use:

```text
$prompt-compiler

Fix the login thing and make sure it works without changing too much.
```

The skill selects ChatGPT, Codex, or Current host; chooses Minimal, Balanced,
or Strict mode; presents the original request verbatim; and shows the
optimized prompt in a copyable plain-text block.

## Approval behavior

The review always stops before the underlying task. Reply with one of:

- `Approve and run` — execute the exact optimized prompt most recently shown.
- `Edit: <requested changes>` — create a new prompt version and review it
  again; editing is not approval.
- `Use original` — use the original request verbatim, with native host safety
  and tool confirmations still applying.
- `Cancel` — stop without performing the underlying task.

Semantic approval confirms wording and intent. Native confirmations may still
be required before files, accounts, external services, or destructive
operations are changed.

Every review also has an opaque review ID and prompt version. Hosts that need
an exact text action can use the four envelopes in
`skills/prompt-compiler/references/action-protocol.md`; natural-language
options remain supported. Approval executes the exact approved body, including
whitespace, and stale or mismatched actions are rejected.

## Selected-context and automatic-mode templates

The context policy permits only relevant, user-visible details and requires
one of six exact provenance labels. The generated ChatGPT Project Instructions
and Codex `AGENTS.md` snippets are returned for the user to paste or use; this
plugin never writes those host settings automatically. The exact one-request
bypass phrase is `skip prompt review for this request`, and it is nonpersistent.

## Limitations

- It is not global middleware for every message.
- Explicit invocation is recommended while implicit invocation is disabled.
- The optional Milestone 3 MCP UI is not guaranteed to be available; the text-only review is always the fallback.
- There is no persistent instruction storage yet.
- Automatic invocation is not guaranteed.
- There is no direct Project-memory or Project-Instructions integration; setup
  snippets require manual paste/use.
- Host safety and tool approvals still apply.
- No host integration has been tested by this repository validation.

## Development

From the plugin root:

```bash
npm test
npm run validate
```

From `mcp/`, build and test the optional bundled MCP renderer:

```bash
npm install
npm test
```

The tests use Node's built-in test runner and temporary repository copies. The
validator uses Node built-ins only and checks the package structure, content
safety, forbidden directories, v0.3.0 fixture counts and fields, negative
triggers, protocol/template markers, and model-provider dependency markers.

## Roadmap

Milestone 3 adds an optional MCP render interface with editable approval
controls. The standalone `mcp/dist/stdio.js` runtime needs no installed
`node_modules` after build; `.mcp.json` launches it locally. The text-only
workflow remains available when MCP/UI is unavailable. See
`docs/milestone-3-completion-report.md` for automated and unmeasured host gates.
