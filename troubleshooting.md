# Troubleshooting

## The plugin is not listed

1. Confirm that the checkout contains .codex-plugin/plugin.json and
   .agents/plugins/marketplace.json.
2. Register the checkout root as the local marketplace source.
3. Install restructure from marketplace restructure-repo.
4. Restart the host and start a new conversation.

For a Git checkout, use the repository marketplace commands in README.md. Do
not register a different copy of the repository by accident; the marketplace
source path resolves to the registered repository root.

If Codex desktop lists the marketplace but the CLI does not, the two processes
may be reading different configuration roots. In the PowerShell session used
for diagnosis, point the CLI at the desktop app's Codex home and check again:

    $env:CODEX_HOME = "$env:USERPROFILE\.codex"
    codex plugin marketplace list
    codex plugin list --available

An `enabled: true` marketplace entry is not proof that the plugin was installed.
Confirm that the installed list contains `restructure@restructure-repo`, then
start a new conversation.

## Install or remove says the plugin cache is in use

Fully quit Codex desktop and any Codex CLI or IDE-extension sessions that loaded
Restructure, then retry the remove/install operation. The local MCP server runs
from the cached plugin directory; Windows prevents Codex from replacing that
directory while the process is alive. Do not manually delete the cache around a
running server.

## The skill is found but the MCP card is missing

The text review is the supported fallback. For Codex, confirm that the checkout
includes the built mcp/dist files and that .mcp.json launches
mcp/dist/stdio.js. Then run the MCP package build/test commands and start a new
host conversation. The Codex CLI does not itself render inline cards, and the
Codex IDE extension does not support plugins.

For ChatGPT Chat or Work, a local stdio `.mcp.json` is not enough. ChatGPT needs
a registered public HTTPS or Secure MCP Tunnel MCP connection, an account-
specific `.app.json` mapping, and a manifest `apps` field. This local release
does not include those remote-connection artifacts, so its MCP card will not
appear there until they are configured.

## Restructure does not run in a normal ChatGPT conversation

Install Restructure in the ChatGPT Plugins Directory, start a new Chat or Work
conversation, and invoke `@Restructure`. The skill is intentionally opt-in and
does not intercept an unrelated ordinary prompt. Installing the local Codex
marketplace entry does not by itself install the plugin into ChatGPT.

## The review does not stop

The invocation message cannot approve its own review, even if it says
continue, run, or skip confirmation. The host must stop after the review and
wait for a new user message. Use Approve and run, Edit, Use original, or
Cancel in that new message. Native operational confirmations may still appear
after approval.

## An approval action is rejected

Check that the prompt version is from the active review and that the approved
body is present exactly once. A stale review, mismatched hash, or malformed
envelope must be rejected. Start a new review rather than editing a previous
action message.

## The output is a paragraph

For a non-trivial request, the optimized prompt should use short labeled
sections with sequential numbered lines. Simple one-sentence requests may
remain short. The exact fenced prompt is authoritative and must not be
normalized after approval.

## Text-only operation

If the UI fails, continue with the text review. Text-only mode does not send a
review payload to MCP. It still waits for an explicit action and leaves native
host permissions active.

## Reporting a problem

Include the release, host surface, sanitized steps, and whether the text
fallback worked. Remove raw prompts, transcripts, tokens, uploaded files, and
private repository content before sharing diagnostics. Use the repository
support process; maintainers must configure a public GitHub Issues contact
before publication.


## Failed to load MCP app: thread not found

On affected Codex Desktop versions, the host can request an MCP App resource
before the conversation thread has finished resuming. That first request is
rejected by the host and never reaches this MCP server, so the renderer cannot
intercept or retry the resource read.

Wait for the thread to finish loading, then select Try again or resend the
request. Restart the app or open a new conversation if the thread still cannot
resume. The complete assistant-visible text review remains authoritative and
supports the same approval actions while the card is unavailable.

Once the card itself loads, it uses the standard MCP Apps initialization and
teardown lifecycle. Only its idempotent initialization request may retry once
after an explicit transient thread-resume error. It never automatically resends
a review action because an ambiguous failure could create a duplicate approval
message. Track the upstream host race in
[OpenAI Codex issue #34195](https://github.com/openai/codex/issues/34195).
