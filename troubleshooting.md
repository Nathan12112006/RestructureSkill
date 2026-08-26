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

## The skill is found but the MCP card is missing

The text review is the supported fallback. Confirm that the checkout includes
the built mcp/dist files and that .mcp.json launches mcp/dist/stdio.js. Then
run the MCP package build/test commands and start a new host conversation.
The Codex CLI does not itself render inline cards. The Codex IDE extension is
untested for this package.

## The review does not stop

The invocation message cannot approve its own review, even if it says
continue, run, or skip confirmation. The host must stop after the review and
wait for a new user message. Use Approve and run, Edit, Use original, or
Cancel in that new message. Native operational confirmations may still appear
after approval.

## An approval action is rejected

Check that the review ID and prompt version are from the active review and that
the approved body is present exactly once. A stale review, mismatched hash, or
malformed envelope must be rejected. Start a new review rather than editing a
previous action message.

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
