# Restructure

Restructure is a stateless ChatGPT and Codex plugin that turns an ordinary request
into a clearer, target-specific prompt, shows the review, and waits for a
semantic decision before the host performs the task.

Version 1.0.0 includes:

- One focused Restructure skill for ChatGPT and Codex.
- An optional local MCP Apps renderer with an editable review card.
- A complete assistant-visible text review on every review, with an optional
  editable card or resource link when the host exposes MCP UI.
- Exact approval, revision, original-request, and cancellation actions.
- Numbered sections for non-trivial optimized prompts, so the result stays
  readable and copyable.
- Optional request-tailored behaviour tuning, shown and editable in the MCP card
  only after the user enables it.

The repository does not provide global middleware. A user must invoke the
skill explicitly, or manually add one of the generated host-instruction
snippets to a selected project or repository.

## Important reminders

Restructure is intentionally opt-in. Invoke it from the plugin picker, with
`@Restructure` in ChatGPT, or with `$restructure` in Codex. It does not take
over unrelated prompts in an ordinary conversation.

The bundled `.mcp.json` starts a local stdio MCP server for Codex surfaces that
load repository plugins. ChatGPT Chat and Work can use installed plugins, but
ChatGPT cannot connect directly to that local stdio process. Its MCP card
requires a separately registered public HTTPS or Secure MCP Tunnel connection,
plus an `.app.json` mapping. This local release includes neither a remote
endpoint nor that account-specific mapping, so its text review is the supported
ChatGPT path until that connection is configured.

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

For MCP reviews, the host model generates a request-tailored behaviour-tuning
addition alongside every optimized prompt so the card has the value ready. A
teaching request might receive a teacher-oriented role, while an implementation
request might receive an expert-engineer-oriented role. These are
request-tailored generated outcomes, not fixed plugin copy or a magic phrase. The
MCP server receives the generated `behaviour_tuning_prompt` separately and
never generates it itself. The host derives role, expertise, and working style
from task semantics and allowed visible context; it does not invent facts or
credentials, broaden scope or permissions, change output requirements, weaken
safety/native confirmations, or request hidden reasoning.

Prompt approval confirms wording and intent. Native ChatGPT, Codex, connector,
filesystem, network, and destructive-operation confirmations remain separate.

## Use it explicitly

In a supported ChatGPT host, invoke the skill from the plugin picker or with:

    @Restructure

For Codex use

    /Restructure

The assistant-visible review always presents the original request verbatim, the
optimized prompt, assumptions, meaningful changes, applied user-visible
instructions, operational impact, and a positive prompt version.
An editable card or resource link may also appear when the host exposes MCP UI;
it is optional and never replaces the visible review. The review then stops.

Choose one action in a new message:

- Approve and run executes the exact optimized text most recently shown.
- Edit: <requested changes> creates a new version and review.
- Use original uses the original request verbatim.
- Cancel stops without performing the underlying task.

Questions and edits are not approval. Stale, unavailable, or malformed action
envelopes are rejected. Whitespace and line breaks in approved text are
preserved.

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
CLI uses a different local-marketplace prompt. If the CLI and desktop app show
different marketplaces on Windows, point that PowerShell session at the same
Codex configuration root before listing or installing:

    $env:CODEX_HOME = "$env:USERPROFILE\.codex"
    codex plugin marketplace list
    codex plugin add restructure@restructure-repo

Start a new Codex session after installation so the skill and MCP tool are
loaded. The local marketplace entry uses a relative path to this repository
root; it does not download a hosted service.

If install or remove reports that the cached plugin is in use, fully quit every
Codex desktop, CLI, and IDE-extension process that loaded the plugin before
retrying. On Windows, the running stdio server keeps its cached directory open,
so an in-place reinstall cannot safely replace it. Do not delete the cache while
those processes are running.

### Codex desktop

Use the app's local marketplace/plugin installation flow and select this
repository root. Install Restructure,
restart the app if requested, and start a new conversation. The desktop app
may expose the editable card when MCP Apps are supported; the text review
remains authoritative.

### ChatGPT Chat and Work

After Restructure is available in the Plugins Directory, install it, start a
new Chat or Work conversation, and invoke `@Restructure`. Merely checking out
this repository or installing its Codex marketplace entry does not install the
plugin into ChatGPT.

To expose this MCP renderer in ChatGPT, first make the server reachable through
a public HTTPS Streamable HTTP endpoint or Secure MCP Tunnel, register that
connection in ChatGPT developer mode, copy its `plugin_asdk_app...` technical
ID into `.app.json`, and reference that file from the manifest's `apps` field.
This repository intentionally ships only the local stdio server, so no valid
account-specific ID can be included here. Use the complete text review when the
remote connection or card is unavailable.

The Codex IDE extension does not support plugins. Use Codex CLI or Codex
desktop for the local installation path.

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
the host emits the complete text review and waits for the same actions. When
the renderer is available, the host still emits that same complete visible
text after the renderer call because some hosts hide tool output. In text-only
mode no review payload is sent to the MCP server. This path does not execute
the task automatically.

Behaviour tuning is off by default in text-only mode. The host generates,
shows, and appends a request-tailored addition only when the user explicitly asks
for behaviour tuning in the current request; silence means omit it. The
choice and any edits are transient to that review and are not persisted or
carried into later requests. If the user has not opted in, the text fallback
contains only the optimized prompt.

When the MCP card is available, each new review starts with behaviour tuning
unchecked and the addition hidden. Checking the control reveals the separate
editable `behaviour_tuning_prompt`; approval composes the exact checked value
after the optimized prompt. Unchecking excludes it without changing the
underlying request-tailored value for that rendered review.

Legacy v1 review payloads without `behaviour_tuning_prompt` remain valid and
use the optimized-only card with no tuning control.

## Automatic MCP review card

The render tool advertises its versioned review resource through the MCP Apps
`ui.resourceUri` metadata and the ChatGPT-compatible output template. Supported
hosts can therefore mount the editable card automatically. The tool also
returns a `resource_link`, structured review data, and the complete text
fallback. The assistant-visible text review remains authoritative everywhere.

After the resource loads, the card keeps actions disabled until the MCP Apps
initialization handshake succeeds. If that standard bridge fails but the host
exposes its legacy follow-up-message API, the card explicitly switches to that
compatibility bridge before enabling actions. Only the idempotent initialization
request may retry once after a transient thread-resume error; review actions are
never resent automatically. The card also acknowledges host teardown and leaves
its controls disabled after teardown.

Some Codex Desktop versions have a host-side resume race that can reject the
initial resource read before it reaches any MCP server. In that case the card
cannot intercept the failure; wait for the thread to finish resuming and use
Try again, resend the request, or continue with the complete text review. See
[OpenAI Codex issue #34195](https://github.com/openai/codex/issues/34195) and
the troubleshooting guide.

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
- The local stdio MCP is a Codex installation path. ChatGPT MCP rendering needs
  a registered remote connection and `.app.json`; neither is included here.
- ChatGPT skill invocation and ChatGPT custom UI remain untested in this
  repository's 1.0 release checks; the Codex IDE extension does not support
  plugins.
- Codex CLI 0.149.0 discovery, one render_prompt_review call, structured
  review output, and stopping before execution were exercised on the installed
  1.0.0+codex.20260826063251 build. No approval was sent.
- The CLI does not itself render an inline card; use its text fallback.
- Native host permissions and confirmations still govern file, network,
  account, external, and destructive operations.

See docs/architecture.md, docs/data-flow.md,
docs/compatibility-matrix.md, docs/troubleshooting.md, and
docs/deployment.md for the release boundary and operational guidance.
