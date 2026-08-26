# Changelog

## 1.0.0 - 2026-08-26

This release packages the stateless Restructure skill and its optional
closed-world MCP review renderer for repository/local-marketplace use.

Added:

- 1.0.0 version alignment in the plugin, root package, MCP package, lockfile,
  and MCP server version constant.
- Repository marketplace metadata with a relative source path to the plugin
  root.
- 1.0 onboarding, support, terms-draft, data-flow,
  compatibility, troubleshooting, deployment, disaster-recovery, and
  versioning documentation.
- Explicit installation, approval, exact-text, and text-fallback guidance.

Preserved:

- Host-side prompt compilation and the semantic approval boundary.
- The single read-only render_prompt_review MCP tool.
- Deterministic validation, editable review UI, and canonical action messages.
- Text-only operation when MCP Apps or the UI bridge is unavailable.

Not included:

- A hosted production endpoint, public directory listing, account system,
  authentication flow, database, telemetry, or persistent profile service.
- Any Milestone 4 or Milestone 5 feature; those milestones were intentionally
  skipped for this stateless 1.0 edition.

Release status:

- Root test suite: 52/52 passed.
- MCP test suite: 10/10 passed.
- Repository validator: 60 checks passed.
- Skill/plugin validation passed.
- npm audit reported 0 vulnerabilities.
- Personal marketplace installation and skill discovery passed for
  restructure@personal at 1.0.0+codex.20260826063251.
- A fresh ephemeral Codex CLI 0.149.0 run invoked the skill, called
  render_prompt_review exactly once, returned structured review/text
  fallback/UI-resource data, and stopped before the underlying task.
- ChatGPT hosts, inline-card rendering, and the Codex IDE extension were not
  retested in this release.
