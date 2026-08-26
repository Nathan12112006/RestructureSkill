# Restructure

Restructure is a stateless ChatGPT and Codex plugin that turns an ordinary request
into a clearer, target-specific prompt, shows the review, and waits for a
semantic decision before the host performs the task.

Version 1.0.0 includes:

- One focused Restructure skill for ChatGPT and Codex.
- An optional local MCP Apps renderer with an editable review card.
- A complete text review when the renderer or custom UI is unavailable.
- Exact approval, revision, original-request, and cancellation actions.
- Numbered sections for non-trivial optimized prompts, so the result stays
  readable and copyable.

The repository does not provide global middleware. A user must invoke the
skill explicitly, or manually add one of the generated host-instruction
snippets to a selected project or repository.

## Important reminders

This version has only been tests on the ChatGPT App. It likely works with Codex CLI but does not work on codex extensions. 

## Important boundaries

The current host model performs compilation. It uses only relevant,
user-visible context already available in the conversation. No separate model
request is made and no user-provided OpenAI API key is required.

The optional MCP process validates a structured review, renders the card, and
returns the complete text fallback. It is read-only, closed-world, and
stateless: it makes no model or network calls, does not retain review
payloads, does not log raw prompts, and does not execute the underlying task.
The bundled server has no production service, database, or account system.
There is no profile storage.

Prompt approval confirms wording and intent. Native ChatGPT, Codex, connector,
filesystem, network, and destructive-operation confirmations remain separate.

## Use it explicitly

In a supported ChatGPT host, invoke the skill from the plugin picker or with:

    @Restructure

    Fix the login issue and do not over-engineer it.

In Codex, use the installed skill:

    $restructure

    Fix the login issue and do not over-engineer it.

The review presents the original request verbatim, the optimized prompt,
assumptions, meaningful changes, applied user-visible instructions,
operational impact, a review ID, and a positive prompt version. It then stops.

Choose one action in a new message:

- Approve and run executes the exact optimized text most recently shown.
- Edit: <requested changes> creates a new version and review.
- Use original uses the original request verbatim.
- Cancel stops without performing the underlying task.

Questions and edits are not approval. Stale or mismatched action envelopes
are rejected. Whitespace and line breaks in approved text are preserved.

For one request only, the exact phrase below bypasses Restructure review.
It does not change later requests:

    skip prompt review for this request

## Installation

### Codex CLI from this Git repository

Clone or check out this repository, including its prebuilt mcp/dist
artifacts. Register the repository root as a local marketplace source with
the Codex CLI, then install the entry named restructure:

    codex plugin marketplace add <checkout-path>
    codex plugin add restructure@restructure-repo

Use the CLI's marketplace/list commands to confirm the entry if your installed
CLI uses a different local-marketplace prompt. Start a new Codex session after
installation so the skill and MCP tool are loaded. The local marketplace entry
uses a relative path to this repository root; it does not download a
hosted service.

### Codex in the ChatGPT desktop app

Use the app's local marketplace/plugin installation flow and select this
repository root. Install Restructure,
restart the app if requested, and start a new conversation. The desktop app
may expose the editable card when MCP Apps are supported; the text review
remains authoritative.

### ChatGPT desktop

Use the ChatGPT desktop app's local plugin/marketplace installation flow and
select this repository's marketplace file. The plugin must be installed by
the host before it can be invoked. ChatGPT web availability and custom UI
support are not certified by this repository; use the text workflow when the
plugin picker or card is unavailable.

The Codex IDE extension is untested for this package. This repository makes no
claim that its plugin picker, MCP server, or inline card is available there.
Use Codex CLI or Codex in the ChatGPT desktop app for the tested installation path.

## Optional automatic setup

Automatic selected-context mode is host configuration, not global interception.
Ask the Restructure skill to generate the relevant block, then review and paste it
yourself:

- ChatGPT Project: paste the generated Project Instructions block into that
  project's settings.
- Codex repository: paste the generated marked section into the repository's
  AGENTS.md, review the diff, and commit it with the repository if desired.

The plugin does not write either setting or claim that the setting changed.
Keep any setup scoped to the selected project or repository. A per-request
skip prompt review for this request bypass remains non-persistent.

## Text-only fallback

If MCP Apps, the UI resource, JavaScript, or the host bridge is unavailable,
the host emits the complete text review and waits for the same actions. In
text-only mode no review payload is sent to the MCP server. This path does not
execute the task automatically.

## Development and release checks

Requirements: Node.js 20 or newer.

From the repository root:

    npm install
    npm test
    npm run validate

Build and test the optional bundled renderer:

    cd mcp
    npm install
    npm test

The MCP build produces standalone files under mcp/dist; the local .mcp.json
launches mcp/dist/stdio.js. Do not delete those artifacts from a Git release
unless you also provide an equivalent build step for consumers.

## Scope and limitations

- This is a local/repository marketplace package, not a hosted production
  service or public directory listing.
- ChatGPT web, ChatGPT desktop custom UI, and the Codex IDE extension remain
  untested in this repository's 1.0 release checks.
- Codex CLI 0.149.0 discovery, one render_prompt_review call, structured
  review output, and stopping before execution were exercised on the installed
  1.0.0+codex.20260826063251 build. No approval was sent.
- The CLI does not itself render an inline card; use its text fallback.
- Native host permissions and confirmations still govern file, network,
  account, external, and destructive operations.

See docs/architecture.md, docs/data-flow.md,
docs/compatibility-matrix.md, docs/troubleshooting.md, and
docs/deployment.md for the release boundary and operational guidance.
