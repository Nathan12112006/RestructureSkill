# Repository Instructions

## Product

This repository contains the Prompt Compiler skill and optional MCP Apps
plugin for ChatGPT and Codex.

## Current milestone

Implement and maintain the current requested milestone only unless the user
explicitly requests a later milestone.

Milestone 3 adds an optional closed-world MCP review renderer. The MCP server
must remain stateless and contain no model calls, network service, database,
authentication system, telemetry, persistence, or external action execution.

## Engineering style

- Prefer the simplest correct implementation.
- Do not over-engineer.
- Do not introduce unnecessary abstractions.
- Do not add dependencies unless they materially improve correctness.
- Do not refactor unrelated files.
- Preserve the plugin's approval boundary.
- Never execute the underlying user task during the prompt-review response.
- Keep the skill usable without custom UI.
- Keep documentation consistent with actual behavior.
- Do not claim a host integration was tested unless it was actually exercised.

## Validation

After changes:

1. Run `npm test`.
2. Run `npm run validate`.
3. Inspect the changed files.
4. Run the MCP checks from `mcp/` and report any manual host testing that
   remains necessary. Keep the text-only workflow usable when MCP/UI is unavailable.
