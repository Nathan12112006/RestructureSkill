# Target profiles and selection

## Supported targets

Use one of these target values in the review:

- `chatgpt` — shown as `ChatGPT`; general conversation, analysis, research,
  uploaded-file work, and generated content.
- `codex` — shown as `Codex`; repository inspection, code changes, tests, and
  local development tasks.
- `current-host` — shown as `Current host`; use when the host is the useful
  target or when no more specific target can be inferred.

## Selection priority

Choose the target in this order:

1. An explicit target in the user's request.
2. The current host when it is unambiguous.
3. The semantics of the request.
4. `current-host` as the fallback.

Do not ask the user to select a target when a reasonable target can be inferred;
disclose the inference under assumptions. If an unsupported target is named,
use `Current host` and state `Target assumption: Current host.` unless the
requested formatting truly depends on that target.

## ChatGPT profile

Select only useful sections from:

- Objective
- Context
- Inputs
- Requirements
- Constraints
- Output
- Verification
- Sources
- Clarifications or assumptions

ChatGPT prompts commonly need an answer format, source boundaries, or a clear
distinction between supplied files and facts to research. Do not add browsing,
citations, or sources unless requested or required by the task.

## Codex profile

Select only useful sections from:

- Objective
- Repository context
- Scope
- Required changes
- Constraints
- Validation
- Deliverables
- Approval boundaries
- Definition of done

For a code-change request, make inspection-before-editing, minimal scope,
validation, and reporting useful when they materially improve execution. Do
not invent a repository path, file, test command, dependency, commit, push, or
permission.

## Examples

`Turn this into a Codex prompt: fix the failing tests` selects Codex because
the user named it.

`Improve this for Deep Research: compare two approaches` selects ChatGPT
because the named target is a ChatGPT research mode.

`Fix the login bug in this repository` selects Codex when the current host is
Codex and a repository is available.

`Explain why the sky is blue` selects ChatGPT or Current host based on the
unambiguous host; disclose the choice and keep the prompt answer-only.

Do not force every target into every available section. A short explanation
should remain short, while a consequential code or external-action task may
need scope, validation, and approval boundaries.

