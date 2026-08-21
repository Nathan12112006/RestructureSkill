# Milestone 3 completion report

## Scope completed

Milestone 3 adds an optional bundled MCP Apps renderer while preserving the
complete Milestone 1/2 skill and text-only action protocol. The MCP surface is
closed-world, deterministic, stateless, read-only, and contains no model call,
network service, persistence, credentials, telemetry, or action execution.

## Repository audit findings

The Milestone 2 skill, canonical action protocol, 60 golden cases, 30 negative
triggers, and text fallback were present and remain authoritative. Milestone 3
required adding the MCP manifest/configuration boundary, strict structured
validation, a complete UI resource, and a host-independent fallback while
keeping implicit invocation disabled.

## Files created

- `.mcp.json`
- `mcp/package.json`, `mcp/package-lock.json`, `mcp/tsconfig.json`
- `mcp/src/create-server.ts`, `schema.ts`, `errors.ts`, `review-fallback.ts`,
  `stdio.ts`, `public.d.ts`, `sdk-shims.d.ts`
- `mcp/src/tools/render-prompt-review.ts`
- `mcp/public/prompt-review.html`
- `mcp/dist/stdio.js`, `create-server.js`, `review-fallback.js`, and
  `prompt-review.html`
- `mcp/tests/render-prompt-review.test.mjs`, `action-messages.test.mjs`, and
  `resource-security.test.mjs`
- `skills/prompt-compiler/references/mcp-review.md`
- `docs/milestone-3-completion-report.md`

## Files modified

- `.codex-plugin/plugin.json` and root `package.json` moved to base version
  `0.3.0`; the installed manifest uses a `0.3.0+codex.<timestamp>` cachebuster
  version and references `./.mcp.json`.
- `scripts/validate-plugin.mjs` and `tests/validate-plugin.test.mjs` now
  validate the optional MCP package, standalone artifacts, contracts, and
  current root dependency boundary.
- `skills/prompt-compiler/SKILL.md` and output/reference documentation describe
  MCP as optional and retain the complete text fallback.
- `README.md`, `AGENTS.md`, architecture/product-decision documents, phase
  design, and manual testing guidance were updated for Milestone 3.

## Architecture decisions

- The MCP server exposes exactly one tool, `render_prompt_review`, and one
  versioned `ui://` HTML resource.
- The server validates and renders only. It does not call a model, make network
  requests, store prompts, or send actions.
- The standalone bundle is launched by local `.mcp.json`; the runtime does not
  require the MCP package's `node_modules` after build.
- The UI uses the shared MCP Apps JSON-RPC bridge for initialization, tool
  input/result notifications, and `ui/message`. A documented
  `sendFollowUpMessage({ prompt })` compatibility fallback is used only when a
  parent bridge is unavailable.
- User-controlled values are rendered through `textContent` and textarea
  `value`. Approval hashes the exact optimized textarea value; revision uses a
  separate exact revision-request field; original and cancel use canonical
  Milestone 2 messages.

## Automated tests

Commands and results:

```text
npm.cmd --prefix mcp test
Result: passed - TypeScript check, standalone build, and 8 MCP tests.

npm.cmd test
Result: passed - 41 tests, 0 failures, including readable prompt formatting and terminal review-boundary regressions.

npm.cmd run validate
Result: passed - 48 repository requirements.

python C:\Users\wenze\.codex\skills\.system\plugin-creator\scripts\validate_plugin.py C:\Plugin\prompt-compiler
Result: passed - plugin validation passed.

npx.cmd --yes @modelcontextprotocol/inspector@latest --cli ...
Result: passed - tool discovery, MCP Apps metadata, resource read, and a complete render_prompt_review call.
```

The focused regression loop first ran red on missing readable-editor and
terminal-boundary assertions, then passed after the contract and UI fixes.

## Host tests actually performed

- MCP Inspector discovered exactly one tool, reported `hasApp: true`, verified
  the `ui://prompt-compiler/prompt-review-v1.html` resource, empty connect and
  resource domains, `prefersBorder: true`, and the
  `text/html;profile=mcp-app` MIME type.
- MCP Inspector successfully called `render_prompt_review` and received the
  structured review, complete text fallback, and UI resource link.
- A fresh ephemeral Codex 0.149.0-alpha.4 session discovered the installed
  Prompt Compiler skill and logged the MCP tool as started and completed. It
  stopped with a pending review and did not execute the underlying request.
- Local headless Chrome rendered a representative review at 200% scale. All
  content and four actions remained visible, text wrapped, and the temporary
  visual harness exposed and verified the fix for a stale startup warning.
- The Codex CLI does not render inline cards, and the in-app browser runtime
  was unavailable in this environment. A real Codex/ChatGPT inline-card and
  action-bridge test therefore remains manual follow-up.

## Security and privacy

- Prompts are limited to 50,000 characters; lists to 50 items; warnings to 20;
  individual items to 2,000 characters; versions are positive; enums and six
  provenance sources are closed-world.
- The UI has a restrictive CSP, no third-party resources, network APIs,
  browser storage, tokens, telemetry, or hidden prompt content.
- Incoming JSON-RPC messages require `event.source === window.parent`.
- Request IDs are numeric and unique; pending bridge failures re-enable action
  buttons. Duplicate submissions are blocked.
- Native host confirmation remains separate from semantic prompt approval.

## Acceptance checklist

- [x] Optional MCP package and local stdio configuration.
- [x] Standalone bundled runtime and retained build artifacts.
- [x] Exactly one render tool and one versioned HTML resource.
- [x] Strict schema, enum validation, size limits, and concise errors.
- [x] Structured output and complete plain-text fallback.
- [x] Correct read-only/non-destructive/closed-world annotations.
- [x] Editable optimized prompt and separate revision-request field.
- [x] Exact whitespace-preserving approval, revision, original, and cancel messages.
- [x] SHA-256 via Web Crypto with `UNAVAILABLE` fallback.
- [x] Shared JSON-RPC bridge with compatibility fallback.
- [x] Text-only Milestone 1/2 workflow preserved when MCP/UI is unavailable.
- [x] Validator rejects model SDKs, network calls, raw logging, and stale MCP artifacts.
- [x] Focused render, resource, security, accessibility-static, and action tests.
- [x] MCP Inspector tool, app-metadata, resource, and render-call validation.
- [x] Fresh Codex host discovery and MCP tool invocation.
- [x] Local 200% visual rendering check.
- [ ] Real ChatGPT or Codex inline MCP UI validation.
- [ ] Real-host accessibility validation at 200% zoom.

## Deviations

No implementation deviation from the requested Milestone 3 boundary was
identified. Protocol-level host verification was completed, but the available
CLI host could not display the inline card, so no real-host rendering or
action-delivery claim is made.

## Known limitations

The MCP Apps bridge and host-provided tool-input/result notification shape have
not been exercised in a card-rendering host. The `ui/message` actions and the
`sendFollowUpMessage` compatibility fallback are covered statically but remain
untested end to end in such a host.

## Required manual follow-up

Restart the Codex app, invoke `$prompt-compiler`, and confirm that the inline
card appears. At 200% zoom, edit the optimized prompt, submit a revision
request, approve, use original, and cancel in separate reviews. Confirm that
failed bridge requests restore the buttons and that the text fallback remains
available when the UI is disabled or unavailable.

## Recommendation

Ready for next milestone: **No** until inline resource rendering, action
delivery, and accessibility are exercised in a card-rendering host. The local
personal plugin was refreshed from the Milestone 3 source; production was not
touched.
