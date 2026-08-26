# Prompt Compiler Plugin — Milestones 2 Through 1.0 Engineering Roadmap

**Document date:** August 21, 2026  
**Starting point:** Milestone 1 has been implemented but has not been inspected as part of this handoff.  
**Core requirements complete:** Milestone 6 / version 1.0.0  
**Optional public release:** Milestone 7

---

## 1. Target outcome

The completed Prompt Compiler plugin must allow a user to enter an ordinary request such as:

```text
fix the login issue and dont over engineer it
```

The plugin must then:

1. Use relevant context from the current ChatGPT or Codex conversation.
2. Convert the request into a clearer, target-specific prompt.
3. Show the optimized prompt before executing it.
4. Show assumptions, meaningful changes, standing instructions, and operational impact.
5. Let the user:
   - Approve and run.
   - Edit the prompt.
   - Request a recompilation.
   - Use the original request.
   - Cancel.
6. Execute the exact text the user approved.
7. Keep native operational confirmations separate.
8. Require no user-provided OpenAI API key.
9. Support standing instructions such as “do not over-engineer.”
10. Support automatic review inside selected ChatGPT Projects and Codex repositories.
11. Remain usable through ordinary chat when custom UI is unavailable.
12. Persist approved instruction profiles without storing raw prompts or full conversations.

Public Plugin Directory publication is not required for the core product.

---

## 2. Non-negotiable architecture

### 2.1 The host model compiles prompts

The ChatGPT or Codex model in the current conversation must:

- Read the user’s request.
- Use relevant conversation context.
- Select the target and compilation mode.
- Generate the optimized prompt.
- Identify assumptions and meaningful changes.
- Determine operational impact.
- Apply visible standing instructions.
- Preserve prompt versions.
- Use the exact approved prompt after approval.

The MCP server must not:

- Call the OpenAI API.
- Call another model provider.
- Ask the user for an OpenAI API key.
- Reconstruct the conversation.
- Independently rewrite a prompt.
- Regenerate a prompt after approval.
- Treat prompt approval as permission for every operational action.

### 2.2 Responsibility boundaries

The system should have three clear owners.

#### Host conversation

Owns:

- Original request.
- Relevant context.
- Compiled prompt.
- Prompt versions.
- Semantic approval.
- Exact approved text.
- Execution of the selected prompt.

#### MCP server

Owns:

- Review-card rendering.
- Input validation.
- Deterministic UI resources.
- Canonical action messages.
- Authenticated instruction-profile storage after Milestone 5.
- User-profile authorization.
- Profile deletion and export.

#### UI component

Owns only temporary presentation state:

- Current textarea value.
- Expanded and collapsed sections.
- Validation messages.
- Submission status.
- Unsaved profile edits.

Do not store authoritative profiles or approved prompts only inside the UI.

### 2.3 Semantic and operational approval remain separate

Prompt Compiler approval means:

```text
This prompt accurately expresses what I want.
```

It does not automatically mean:

```text
Modify every file.
Install packages.
Access the network.
Push a branch.
Send an email.
Delete data.
Publish content.
Change an account.
```

ChatGPT, Codex, MCP tools, connectors, the filesystem, and external services must continue using their native confirmation and permission behavior.

---

## 3. Milestone sequence

| Milestone | Version | Main outcome | Separate model API |
|---|---:|---|---:|
| Milestone 2 | 0.2.0 | Quality hardening, action protocol, evaluation suite, selected-context automatic-mode templates | None |
| Milestone 3 | 0.3.0 | Stateless MCP review server and editable in-chat review UI | None |
| Milestone 4 | 0.4.0 | Standing instructions, conflict handling, Project Instructions export, and `AGENTS.md` export | None |
| Milestone 5 | 0.5.0 | Authenticated durable instruction profiles | None |
| Milestone 6 | 1.0.0 | Complete integration, onboarding, fallbacks, security hardening, and final acceptance | None |
| Milestone 7 | Optional | Public Plugin Directory submission and production operations | None |

Implement one milestone at a time. Stop after each milestone and review its completion report before starting the next.

---

# Milestone 2 — Quality Hardening and Automatic Host Setup

## 4. Objective

Turn the Milestone 1 skill from a specification-complete prototype into a tested workflow that behaves consistently in actual ChatGPT and Codex conversations.

Milestone 2 also introduces the first automatic selected-context workflow through:

- ChatGPT Project Instructions.
- Codex repository `AGENTS.md`.
- A dedicated Prompt Compiler workflow.

Do not add an MCP server, backend, authentication, UI component, database, or persistent profile system yet.

---

## 5. Workstream A — Audit Milestone 1

Codex must first inspect the implementation instead of assuming it matches the earlier handoff.

Audit:

- Plugin manifest and package paths.
- Skill metadata.
- Skill references.
- Output contract.
- Approval language.
- Prompt version handling.
- Original-prompt preservation.
- Assumption handling.
- Meaningful-change handling.
- Operational-impact classification.
- Edit, approval, use-original, and cancellation behavior.
- Whether the underlying task ever starts during review.
- Whether quoted third-party text can influence the compiler.
- Whether simple prompts become unnecessarily long.
- Whether hidden or unavailable instructions are exposed.
- Whether the skill claims access to context it does not have.
- Whether the repository contains accidental model API dependencies.

Create:

```text
docs/milestone-2-audit.md
```

For every finding, record:

```text
ID
Severity
Observed behavior
Expected behavior
Affected files
Proposed fix
Verification method
```

Repair only defects necessary for Milestone 2.

---

## 6. Workstream B — Canonical action protocol

Natural-language replies must remain supported, but introduce a strict protocol that the future UI can use.

### Approve and run

```text
PROMPT_COMPILER_ACTION: APPROVE_AND_RUN
REVIEW_ID: <opaque-id>
PROMPT_VERSION: <positive integer>
APPROVED_PROMPT_SHA256: <lowercase hash or UNAVAILABLE>
APPROVED_PROMPT_BEGIN
<exact approved prompt>
APPROVED_PROMPT_END
```

### Request revision

```text
PROMPT_COMPILER_ACTION: REQUEST_REVISION
REVIEW_ID: <opaque-id>
BASE_PROMPT_VERSION: <positive integer>
REVISION_REQUEST_BEGIN
<requested changes>
REVISION_REQUEST_END
```

### Use original

```text
PROMPT_COMPILER_ACTION: USE_ORIGINAL
REVIEW_ID: <opaque-id>
ORIGINAL_REQUEST_SHA256: <hash or UNAVAILABLE>
```

### Cancel

```text
PROMPT_COMPILER_ACTION: CANCEL
REVIEW_ID: <opaque-id>
```

### Parsing requirements

The compiler must:

- Reject an action whose review ID does not match the active review.
- Reject approval of a version that is no longer active unless the user explicitly identifies an available earlier version.
- Treat requested changes as a revision, not approval.
- Treat questions as questions, not approval.
- Keep the active review pending after answering a question.
- Never resurrect a cancelled review without generating a new review.
- Refuse approval when the approved-prompt body is missing or malformed.
- Preserve whitespace and line breaks in the approved prompt.

Add automated tests for every transition.

---

## 7. Workstream C — Context-selection policy

Document exactly which context may be included in a compiled prompt.

### Include context when it changes execution

Examples:

- Previously defined class labels.
- A fixed test set.
- Uploaded-file names.
- A previously selected framework.
- Repository paths already discussed.
- Previously approved output formats.
- Explicit standing instructions.
- User-defined terminology.

### Do not include context merely because it exists

Avoid:

- Copying the entire conversation.
- Repeating unrelated personal information.
- Importing outdated constraints superseded later.
- Repeating model-generated suggestions that were never approved.
- Treating earlier assistant guesses as user requirements.
- Including hidden system or developer instructions.

### Context provenance

Every standing instruction or imported constraint shown in the review should have a source label:

```text
Current request
Earlier user message
ChatGPT Project Instructions
Codex AGENTS.md
Prompt Compiler profile
Plugin default
```

The model must not reveal hidden instruction content.

Create:

```text
skills/prompt-compiler/references/context-selection.md
```

---

## 8. Workstream D — Golden prompt evaluation suite

Expand the evaluation collection to at least 60 prompts.

Required groups:

- 10 simple answer-only prompts.
- 10 vague Codex requests.
- 10 detailed code-change requests.
- 8 file-analysis requests.
- 6 research requests.
- 6 external-action requests.
- 5 destructive or irreversible requests.
- 5 prompt-injection-like quoted-content requests.

Create at least 30 negative prompts where implicit activation should not occur.

Each test case should define:

```json
{
  "id": "codex-minimal-login-fix",
  "input": "fix the login issue and dont over engineer",
  "expected_target": "codex",
  "expected_mode": "balanced",
  "expected_impact": "local-write",
  "must_preserve": [
    "login",
    "do not over engineer"
  ],
  "must_include_meaning": [
    "minimal targeted change",
    "no unrelated refactor"
  ],
  "must_not_invent": [
    "specific filename",
    "dependency",
    "git push"
  ],
  "underlying_task_allowed_during_review": false
}
```

Do not assign an artificial numeric score to natural-language quality. Evaluate against explicit semantic criteria.

---

## 9. Workstream E — Selected-context automatic mode

### ChatGPT Project Instructions template

Generate an installation block that the user can paste into a ChatGPT Project:

```text
For each new task in this project, compile the request into a clear prompt
and show a review before execution.

Use relevant project chats, files, and project instructions as context.
Preserve exact names, filenames, dates, quantities, constraints, and
user-approved terminology.

Show:
- optimized prompt
- assumptions
- meaningful changes
- applied standing instructions
- operational impact

Do not execute the task until the user approves, selects the original
request, or explicitly bypasses review for that request.
```

The plugin must say that this is generated text for the user to paste. It must not claim that it modified the Project itself.

### Codex `AGENTS.md` template

Generate a marked section:

```markdown
<!-- prompt-compiler:start -->
## Prompt Compiler workflow

Before implementing a new task, compile the request into a target-specific
prompt and show a review.

Do not edit files or run task-specific commands until the user approves the
prompt, chooses the original request, or explicitly bypasses review for the
current task.

Preserve explicit constraints, filenames, paths, dates, quantities, and
approval boundaries.

Prompt Compiler profile: none
<!-- prompt-compiler:end -->
```

Milestone 2 should generate the snippet. It must not automatically write the file.

### Per-request bypass

Support:

```text
skip prompt review for this request
```

The bypass applies only to that request unless the user explicitly changes project or profile settings.

---

## 10. Workstream F — Trigger behavior

Keep implicit skill invocation disabled until the evaluation suite supports enabling it safely.

Suggested gate:

- At least 95% precision on positive and negative trigger tests.
- At least 90% recall on prompts explicitly asking to structure, compile, optimize, or review a prompt.
- Zero cases where an ordinary answer-only request unexpectedly becomes a prompt-review workflow.

Automatic Project and repository behavior should come from Project Instructions or `AGENTS.md`, not from an overly broad global skill description.

---

## 11. Milestone 2 acceptance criteria

- [ ] Milestone 1 audit completed.
- [ ] Every explicit constraint in the golden set is preserved.
- [ ] No underlying task starts during review.
- [ ] No prompt is regenerated after approval.
- [ ] Canonical action protocol passes all tests.
- [ ] Target selection reaches at least 95% accuracy.
- [ ] Operational-impact selection reaches at least 95% accuracy.
- [ ] Relevant-context precision reaches at least 90%.
- [ ] ChatGPT Project Instructions export works.
- [ ] Codex `AGENTS.md` export works.
- [ ] Per-request bypass works.
- [ ] Implicit invocation remains disabled unless the trigger gate passes.
- [ ] Text review remains fully functional.
- [ ] No MCP server, authentication, database, or model API has been added.
- [ ] All automated tests and validators pass.
- [ ] Real-host results are recorded honestly.

---

# Milestone 3 — Stateless MCP Review UI

## 12. Objective

Add an editable inline review card while keeping prompt compilation inside the host model.

The MCP server is stateless in this milestone. It renders validated review data and returns canonical user actions. It must not call a model or save profiles.

---

## 13. Architecture

```text
User request
    ↓
Prompt Compiler skill
    ↓
Host model uses current conversation and compiles prompt
    ↓
Host model calls render_prompt_review
    ↓
MCP server validates review payload
    ↓
Inline review component renders
    ↓
User edits or chooses an action
    ↓
Component sends canonical action through ui/message
    ↓
Host model handles the action in the same conversation
```

The server must not decide how to rewrite a prompt.

---

## 14. Repository changes

Add a minimal TypeScript MCP package. Reuse the current package manager and repository conventions.

Suggested structure:

```text
mcp/
├── package.json
├── tsconfig.json
├── src/
│   ├── create-server.ts
│   ├── schema.ts
│   ├── errors.ts
│   ├── review-fallback.ts
│   └── tools/
│       └── render-prompt-review.ts
├── public/
│   └── prompt-review.html
└── tests/
    ├── render-tool.test.ts
    ├── resource.test.ts
    ├── security.test.ts
    └── action-message.test.ts
```

Do not add a complex framework solely for this component.

---

## 15. MCP tool contract

Expose one tool:

```text
render_prompt_review
```

The input must include:

```text
review ID
prompt version
target
compilation mode
verbatim original prompt
optimized prompt
assumptions
meaningful changes
applied instructions
operational impact
revision count
warnings
```

Apply explicit limits, such as:

- Original prompt maximum: 50,000 characters.
- Optimized prompt maximum: 50,000 characters.
- Assumptions maximum: 50.
- Meaningful changes maximum: 50.
- Applied instructions maximum: 50.
- Warnings maximum: 20.
- Individual list item maximum: 2,000 characters.
- Positive integer version.
- Non-empty review ID.

Reject malformed payloads with concise, model-readable errors.

The tool must be deterministic and have no external side effects.

Suggested annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false,
  "openWorldHint": false
}
```

---

## 16. Text fallback

Every tool result must include:

- Structured content for the UI.
- A complete plain-text review.
- A UI-resource reference when the host supports UI.

The conversation must remain usable when:

- The UI cannot load.
- The host does not support MCP Apps.
- JavaScript fails.
- The resource is blocked.
- The user disables review UI.

---

## 17. Review-card requirements

The inline component must display:

- Target.
- Mode.
- Prompt version.
- Editable optimized-prompt textarea.
- Collapsible original request.
- Assumptions grouped by impact.
- Meaningful changes.
- Applied instructions with source labels.
- Operational-impact warning.
- Revision-request field.
- Review ID.
- Four actions:
  - Approve and run.
  - Request revision.
  - Use original.
  - Cancel.

### Security

- Render untrusted text through `textContent`, not raw HTML.
- Do not evaluate user-supplied HTML, Markdown scripts, or URLs.
- Do not use `localStorage` for authoritative data.
- Do not include authentication tokens or hidden prompt content.
- Keep third-party resources out of the component unless necessary.
- Add no analytics scripts.
- Define a minimal content-security policy.

### Accessibility

- Every input must have a visible label.
- Keyboard navigation must work.
- Focus must move to validation errors.
- Warnings must not rely only on color.
- Buttons must have clear action names.
- Text must remain readable at 200% zoom.
- Screen-reader announcements must confirm action submission.

---

## 18. Action behavior

### Approve and run

The component:

1. Reads the exact textarea value.
2. Computes a SHA-256 hash when supported.
3. Sends the canonical approval message through `ui/message`.
4. Includes the exact prompt text.
5. Does not directly perform the underlying task.

### Request revision

The component sends the review ID, base version, and revision text.

### Use original

The component sends the canonical use-original message.

### Cancel

The component sends the canonical cancellation message.

No action may occur automatically when the component renders.

---

## 19. Milestone 3 tests

Automated tests must cover:

- Valid review payload.
- Missing required field.
- Oversized field.
- Unknown enum.
- Unsafe HTML content.
- Prompt containing canonical action markers.
- Empty lists.
- Maximum-sized prompt.
- Unicode and multilingual text.
- Text fallback completeness.
- UI resource URI.
- Tool annotations.
- Exact textarea content in approval message.
- Whitespace and line-break preservation.
- Duplicate-button submission prevention.
- Network request detection.
- Server logging behavior.
- Failure to render the UI.

Use MCP Inspector and every host surface actually available.

---

## 20. Milestone 3 acceptance criteria

- [ ] MCP server performs zero model API calls.
- [ ] MCP server stores no review payloads.
- [ ] Render tool accepts only valid structured reviews.
- [ ] Inline UI renders on at least one supported host.
- [ ] Text fallback is complete.
- [ ] Exact edited prompt is preserved.
- [ ] No action occurs on render.
- [ ] UI security tests pass.
- [ ] Accessibility checks pass.
- [ ] The complete Milestone 1 text workflow still passes.
- [ ] No authentication or persistent profiles have been added.

---

# Milestone 4 — Standing Instructions and Host-Native Project Integration

## 21. Objective

Allow users to define, preview, apply, and export standing instructions.

Milestone 4 supports conversation-level instructions and host-native exports. It does not yet store profiles in a user-account database.

---

## 22. Instruction model

Represent each instruction as:

```ts
type StandingInstruction = {
  id: string;
  text: string;
  kind: "preference" | "constraint";
  enabled: boolean;
  source:
    | "current-request"
    | "conversation"
    | "chatgpt-project-instructions"
    | "codex-agents-md"
    | "plugin-profile"
    | "plugin-default";
  scope:
    | "current-request"
    | "current-conversation"
    | "chatgpt-project-export"
    | "codex-repository-export"
    | "plugin-profile";
};
```

### Preference

A default style that the user may override in the current request.

Example:

```text
Prefer minimal changes.
```

### Constraint

A boundary that must not be silently overridden.

Example:

```text
Do not modify the fixed test set.
```

When a request conflicts with a constraint, show the conflict and request a decision.

---

## 23. Default minimal-engineering pack

Provide an optional pack named:

```text
Minimal Implementation
```

Contents:

```text
Prefer the simplest correct solution.
Make the smallest targeted change that satisfies the request.
Do not refactor unrelated code.
Do not add dependencies unless necessary.
Preserve existing public APIs and behavior outside the requested scope.
Do not add architectural layers, configuration systems, files, or
abstractions unless they are required.
Present useful but nonessential improvements as recommendations instead of
implementing them without approval.
```

Do not silently enable this pack for every user.

---

## 24. Semantic merge order

Apply instructions in this user-visible order:

1. Explicit constraints in the current request.
2. User-visible ChatGPT Project Instructions or Codex `AGENTS.md`.
3. Explicit instructions established earlier in the conversation.
4. Selected Prompt Compiler instruction pack.
5. Plugin defaults.

Native system, developer, safety, and tool instructions remain higher priority but must not be exposed.

### Conflict behavior

- A current request may override a standing preference.
- A current request that conflicts with a standing constraint produces a visible warning.
- Do not silently drop either side.
- Offer a revised prompt that isolates the conflict and proposed resolution.
- Require approval of the resolution.

---

## 25. Review UI additions

Add an **Applied Instructions** section with:

- Enabled checkbox.
- Source label.
- Preference or constraint label.
- Conflict indicator.
- “Apply only to this request” behavior.
- Clear indication that unselected instructions are not applied.

Changing a checkbox affects only the current review unless the user separately exports or later saves a profile.

---

## 26. ChatGPT Project Instructions export

Generate a deterministic block containing:

- Prompt-review workflow.
- Selected standing instructions.
- Optional plugin-profile reference placeholder.
- Clear explanation that the text must be pasted into Project settings.
- Stable markers so future exports can be updated safely.

Requirements:

- Plain text.
- Only user-selected instructions.
- No hidden instructions.
- No claim that the project was modified.
- No unsupported write operation.
- Reproducible output.

---

## 27. Codex `AGENTS.md` export

Generate a mergeable marked section:

```markdown
<!-- prompt-compiler:start -->
## Prompt Compiler workflow

Before implementing a new task, compile the request and present a review.

Do not edit files or run task-specific commands until the user approves,
selects the original request, or explicitly bypasses review for that request.

### Standing instructions

- Prefer the simplest correct solution.
- Do not refactor unrelated code.
- Do not add dependencies unless necessary.

Prompt Compiler profile: none
<!-- prompt-compiler:end -->
```

When Codex applies the section:

- Read the existing file first.
- Preserve unrelated content.
- Replace only an existing Prompt Compiler marked section.
- Otherwise append a new marked section.
- Show the proposed diff before writing.
- Use native file permissions and confirmations.
- Never claim success until the file has actually been written and checked.

---

## 28. Milestone 4 acceptance criteria

- [ ] Standing-instruction schema exists.
- [ ] Preferences and constraints are distinct.
- [ ] Source labels are visible.
- [ ] Conflict behavior is tested.
- [ ] Minimal Implementation pack works.
- [ ] ChatGPT Project Instructions export works.
- [ ] Codex `AGENTS.md` export works.
- [ ] Conversation-level instructions work.
- [ ] The review displays applied instructions accurately.
- [ ] Disabled instructions do not appear in the optimized prompt.
- [ ] No persistent database exists yet.
- [ ] No false claim of Project memory or Project Instructions writes occurs.
- [ ] Text fallback includes all instruction behavior.

---

# Milestone 5 — Durable Instruction Profiles

## 29. Objective

Add authenticated, cross-session plugin-managed instruction profiles.

A user should be able to save rules such as:

```text
Do not over-engineer.
Prefer minimal targeted changes.
Do not add dependencies without approval.
```

The plugin must clearly describe these as Prompt Compiler profiles, not ChatGPT memory.

---

## 30. Authentication

Any tool that accesses user-specific saved profiles must authenticate the user.

Requirements:

- Standards-compliant OAuth authorization-code flow with PKCE.
- Audience, issuer, expiration, and scope validation.
- Proper unauthorized responses for missing or invalid tokens.
- No access based only on a user ID supplied by the model or UI.
- Authorization checked for every profile read and write.
- No password system built solely for this plugin when a managed identity provider is available.
- No API key pasted into ChatGPT.

Keep the stateless render tool usable without authentication.

---

## 31. Storage model

Use a small relational schema.

Suggested entities:

```text
users
instruction_profiles
profile_instructions
```

Store:

### User

- Internal user ID.
- Identity-provider subject.
- Created and updated timestamps.

### Profile

- Profile ID.
- Owner ID.
- Slug.
- Display name.
- Description.
- Default status.
- Revision number.
- Created and updated timestamps.

### Instruction

- Instruction ID.
- Profile ID.
- Position.
- Text.
- Preference or constraint type.
- Enabled state.
- Created and updated timestamps.

Do not store by default:

- Original prompts.
- Optimized prompts.
- Full conversations.
- Uploaded files.
- Approval decisions.
- Repository contents.
- Hidden host instructions.
- Authentication tokens in plaintext.

---

## 32. Profile tools

### Read-only tools

```text
list_instruction_profiles
get_instruction_profile
get_default_instruction_profile
export_instruction_profile
```

### Write tools

```text
create_instruction_profile
update_instruction_profile
delete_instruction_profile
set_default_instruction_profile
clear_default_instruction_profile
```

Requirements:

- One focused operation per tool.
- Explicit schemas.
- Accurate read-only, destructive, and open-world annotations.
- Revision numbers for concurrent updates.
- Validation of profile and instruction lengths.
- Server-side ownership checks.
- Complete authoritative profile returned after writes.
- Deletion clearly marked destructive.
- No tool may accept an arbitrary owner ID from the model.

---

## 33. Profile reference protocol

Support a visible reference such as:

```text
Prompt Compiler profile: waterdetect
```

The compiler searches user-visible context for this reference.

If found:

1. Retrieve the authenticated user’s profile.
2. Show every applied instruction in the review.
3. Show the profile name and revision.
4. Permit current-request preferences to override profile preferences.
5. Show conflicts with constraints.
6. Never silently apply a profile belonging to another user.

If no profile is referenced:

- Use an explicitly selected current profile.
- Otherwise request the default profile.
- Otherwise apply no plugin-managed profile.

A profile lookup failure should produce a warning and continue with available conversation or host-native instructions. It should not prevent prompt review.

---

## 34. Profile-management UI

Create a separate profile-management view.

Required functions:

- List profiles.
- Create profile.
- Rename profile.
- Edit description.
- Add instruction.
- Edit instruction.
- Reorder instructions.
- Choose preference or constraint.
- Enable or disable instruction.
- Set or clear default.
- Export profile.
- Delete profile with clear confirmation.
- Delete all stored profile data.

Do not reuse the prompt-review approval button for profile writes.

---

## 35. Privacy and retention

Publish a clear internal policy before production use.

Requirements:

- Review payloads are processed transiently and not retained.
- Profile data persists until the user deletes it.
- Operational logs omit raw prompts and instruction bodies where possible.
- Security logs may contain tool name, pseudonymous user ID, result, latency, and correlation ID.
- Users can export profile data.
- Users can delete individual profiles.
- Users can delete all plugin-managed data.
- Account disconnection behavior is documented.
- Database backups and deletion timing are documented honestly.

---

## 36. Degraded modes

### MCP unavailable

- Use text review.
- Use host-native Project Instructions or `AGENTS.md`.
- Explain that no saved profile was applied.

### Authentication unavailable

- Do not expose another user’s data.
- Do not create anonymous durable profiles.
- Offer host-native export instead.

### Database unavailable

- Read operations return a failure.
- Write operations do not claim success.
- Prompt review continues without saved profiles.

---

## 37. Milestone 5 acceptance criteria

- [ ] OAuth flow works.
- [ ] User-specific tools require authentication.
- [ ] Render tool remains usable without authentication.
- [ ] Cross-user access is impossible in tests.
- [ ] Profile creation, reading, updating, and deletion work.
- [ ] Default-profile behavior works.
- [ ] Profile revision conflicts are handled.
- [ ] Profile references work from Project Instructions and `AGENTS.md`.
- [ ] Every applied profile instruction is visible.
- [ ] Users can export and delete their profiles.
- [ ] Raw prompts are not retained.
- [ ] Full conversations are not transferred to the server.
- [ ] No OpenAI or other model API exists in the server.
- [ ] Security and migration tests pass.
- [ ] Review fallback works when profile service is unavailable.

---

# Milestone 6 — Version 1.0 Feature Completion

## 38. Objective

Integrate all components into a reliable, understandable, privacy-conscious product and prove that the original requirements have been met.

Milestone 6 is primarily an integration, onboarding, compatibility, testing, and release-quality milestone.

---

## 39. Required user journeys

### Journey A — Explicit one-time review

```text
@Prompt Compiler
Fix the login issue and do not over engineer it.
```

Expected:

- Current context is used.
- Optimized prompt appears.
- Minimal Implementation rules appear when selected.
- User edits or approves.
- Exact approved text is used.

### Journey B — Automatic ChatGPT Project workflow

One-time setup:

1. Install the plugin.
2. Select or create an instruction profile.
3. Generate the Project Instructions block.
4. Paste it into Project settings.
5. Include a profile reference when using a saved profile.

Ongoing use:

1. User enters a normal project request.
2. Project workflow invokes prompt review.
3. Relevant project chats, files, and instructions inform the result.
4. Applied instructions are visible.
5. User approves or bypasses for that request.

### Journey C — Automatic Codex repository workflow

One-time setup:

1. Install the plugin.
2. Generate the marked `AGENTS.md` section.
3. Review and apply the proposed diff.
4. Reference a saved profile when desired.

Ongoing use:

1. User enters a normal coding request.
2. Codex presents prompt review before edits.
3. Native Codex permissions govern filesystem and network actions.
4. Exact approved prompt is used.

### Journey D — UI unavailable

- User disables or cannot render the review card.
- Text review appears.
- No review payload is sent to the MCP server in text-only mode.
- Approval still works.

### Journey E — Profile service unavailable

- Prompt review still works.
- Host-native instructions remain available.
- A clear warning states that no saved profile was applied.

### Journey F — Per-request bypass

```text
skip prompt review for this request
```

- The current task proceeds under native host behavior.
- Automatic review remains active for later requests.

---

## 40. Onboarding

Provide three setup paths.

### Explicit-only

Best for occasional use:

```text
Invoke Prompt Compiler manually with @ or the available skill picker.
```

### ChatGPT Project automatic mode

Best for ongoing project work:

- Generate Project Instructions.
- Explain where to paste them.
- Allow an instruction profile to be referenced.
- Explain that the plugin does not directly change Project settings.

### Codex repository automatic mode

Best for coding projects:

- Generate `AGENTS.md` section.
- Offer a repository-owned diff.
- Explain repository scope and native file permissions.
- Keep profile references optional.

Onboarding must state:

- No separate OpenAI API key is required.
- The host model performs prompt compilation.
- The MCP server renders UI and stores profiles only.
- Saved profiles are stored by the plugin service.
- Text-only mode avoids sending review payloads to the server.
- Prompt approval does not replace native operational confirmations.

---

## 41. Exact-prompt guarantee

Implement and test this invariant:

```text
operative_prompt == exact_text_approved_by_user
```

When available, record in conversation state:

```text
review ID
prompt version
approved hash
execution hash
```

If hashes differ:

- Do not execute.
- Show an integrity error.
- Present the reviewed prompt again.
- Require a new approval.

Do not store approved-prompt content in the profile database.

---

## 42. Compatibility matrix

Maintain:

```text
docs/compatibility-matrix.md
```

Record:

```text
Host surface
Version or date tested
Explicit skill invocation
Automatic Project or repository mode
MCP tools
Custom UI
Follow-up message action
Authentication
Profile persistence
Text fallback
Known limitations
```

Test at minimum on the currently available versions of:

- ChatGPT web.
- ChatGPT desktop where available.
- Codex app or CLI.
- Codex repository instructions.

Do not infer support from old documentation. Mark unavailable surfaces as untested.

---

## 43. End-to-end evaluation

Expand the evaluation set to at least 120 prompts:

- 20 simple answer-only.
- 25 Codex implementation tasks.
- 15 debugging tasks.
- 15 file and dataset analysis tasks.
- 10 web or deep-research tasks.
- 10 external actions.
- 10 destructive or irreversible actions.
- 10 instruction-conflict cases.
- 5 long-context references.

Include at least 60 negative implicit-activation prompts.

Required quality gates:

- Explicit hard-constraint preservation: 100%.
- Invented permissions: 0.
- Execution before semantic approval: 0.
- Exact approved-prompt execution: 100%.
- Target selection: at least 97%.
- Operational-impact classification: at least 97%.
- Profile application: 100% for explicit profile references.
- Cross-user profile leakage: 0.
- Text fallback completion: 100%.
- UI action success: at least 99% across supported UI tests.
- Automatic-mode false activation: no more than 2% on the negative set.
- Simple prompts remain concise.

---

## 44. Security review

Test:

- Prompt injection in original requests.
- Prompt injection in saved instructions.
- Cross-user profile access.
- Malicious HTML or script in UI fields.
- Approval-message spoofing.
- Stale review approval.
- Replay of write tools.
- OAuth-token theft or leakage.
- Database injection.
- Excessive logging.
- Destructive profile deletion.
- Host operational-approval confusion.
- Content-security-policy misconfiguration.
- Dependency vulnerabilities.

Required controls:

- Server-side validation.
- Accurate tool annotations.
- User ownership checks.
- Revision checks.
- Narrow content-security policy.
- No raw prompt logging.
- No token exposure.
- Rate limits.
- Secure headers.
- Dependency audit.
- Automated security regression tests.
- Manual prompt-injection testing.

---

## 45. Observability

Allowed by default:

- Tool name.
- Result status.
- Latency.
- Error code.
- Correlation ID.
- Pseudonymous user identifier.
- Server version.

Not allowed by default:

- Raw prompt.
- Optimized prompt.
- Full instruction body.
- Conversation transcript.
- Authentication token.
- Uploaded-file contents.

Add a diagnostic mode that remains off by default and clearly redacts user text.

---

## 46. Release documentation

Complete:

```text
README.md
SECURITY.md
PRIVACY.md
TERMS-DRAFT.md
SUPPORT.md
CHANGELOG.md
docs/architecture.md
docs/data-flow.md
docs/authentication.md
docs/profile-storage.md
docs/compatibility-matrix.md
docs/troubleshooting.md
docs/deployment.md
docs/disaster-recovery.md
docs/versioning.md
```

`TERMS-DRAFT.md` must clearly state that it is a development placeholder rather than published legal advice.

---

## 47. Version 1.0 acceptance criteria

### Prompt compilation

- [ ] Ordinary English requests compile successfully.
- [ ] Relevant conversation context is used.
- [ ] Irrelevant context is omitted.
- [ ] Exact identifiers and constraints are preserved.
- [ ] Simple requests remain simple.

### Approval

- [ ] Review appears before execution.
- [ ] User can edit and approve exact text.
- [ ] User can request a revision.
- [ ] User can use the original request.
- [ ] User can cancel.
- [ ] Stale or mismatched versions are rejected.
- [ ] Exact approved prompt is executed.

### UI and fallback

- [ ] MCP Apps UI works on supported tested surfaces.
- [ ] Text fallback works everywhere tested.
- [ ] UI-disabled mode sends no review payload to the server.
- [ ] Failure does not block text review.

### Standing instructions

- [ ] Conversation instructions work.
- [ ] Minimal Implementation pack works.
- [ ] ChatGPT Project Instructions export works.
- [ ] Codex `AGENTS.md` export works.
- [ ] Durable saved profiles work.
- [ ] Profile reference line works.
- [ ] Applied instructions and sources are visible.
- [ ] Conflicts are visible.

### Automatic selected-context workflow

- [ ] ChatGPT Project automatic mode is documented and tested.
- [ ] Codex repository automatic mode is documented and tested.
- [ ] Per-request bypass works.
- [ ] No claim of global account-wide interception is made.

### Privacy and security

- [ ] No user-supplied model API key is requested.
- [ ] MCP server makes no model API calls.
- [ ] Raw prompts are not logged.
- [ ] Review payloads are not retained.
- [ ] Profile access is authenticated and authorized.
- [ ] Users can export and delete profiles.
- [ ] Tool annotations are accurate.
- [ ] Security tests pass.

### Operations

- [ ] Automated tests pass.
- [ ] MCP Inspector tests pass.
- [ ] Host compatibility matrix is current.
- [ ] Deployment and rollback are documented.
- [ ] Known limitations are disclosed.

The product requirements are complete when every mandatory item passes.

---

# Milestone 7 — Optional Public Plugin Directory Release

## 48. When this milestone is needed

Perform Milestone 7 only when the plugin should be publicly discoverable and installable through the Plugin Directory.

Private use, developer-mode use, repository distribution, and personal marketplace use can stop after Milestone 6.

---

## 49. Required public-release work

Prepare:

- Stable public HTTPS MCP endpoint.
- Verified developer or business identity.
- Public privacy policy.
- Public terms of service.
- Public support contact and process.
- Production monitoring.
- Incident-response process.
- Account-disconnection and deletion documentation.
- Complete plugin listing metadata.
- Listing screenshots.
- Accurate capability descriptions.
- Submission test cases.
- Review-ready authentication.
- Narrow production content-security policy.
- Privacy and security disclosures matching actual behavior.

The listing must state accurately that:

- The host model performs prompt compilation.
- The plugin does not directly modify Project Instructions.
- Persistent instruction profiles are stored by the plugin service.
- Prompt review does not guarantee activation for every message.
- Operational confirmations remain separate.
- An initial Project or repository setup step may be required.

---

## 50. Public-release acceptance criteria

- [ ] Public identity and legal pages match the listing.
- [ ] Production endpoint satisfies review requirements.
- [ ] OAuth discovery works from the public endpoint.
- [ ] Authentication passes end-to-end.
- [ ] Privacy and deletion controls work.
- [ ] Tool annotations match behavior.
- [ ] Listing descriptions are accurate.
- [ ] Screenshots represent the real product.
- [ ] Submission tests are reproducible.
- [ ] Review findings are resolved or documented.
- [ ] Monitoring and support processes are active.

---

# Cross-Milestone Engineering Rules

## 51. Do not over-engineer

Reject architecture that is not required by the current milestone.

Examples of unnecessary early additions:

- A separate model-orchestration service.
- Vector storage for instruction profiles.
- Microservices for UI and profile storage.
- A custom password system.
- Event sourcing for simple profile edits.
- A generic workflow engine.
- A complex policy language.
- A single universal tool with many unrelated modes.
- Storing every review for possible future improvement.

A skill, one MCP service, a relational database, focused tools, and static UI resources are sufficient for version 1.0.

---

## 52. Release gates

A milestone cannot be called complete when:

- Tests were skipped without explanation.
- The plugin was not installed in an available real host.
- UI behavior is described as working without testing.
- A failing security test is dismissed as low priority.
- A server logs raw prompt content.
- An approval action can execute a stale prompt.
- A profile tool can access another user’s data.
- The plugin depends on a model API despite the architecture requirement.
- Documentation does not match actual behavior.
- A future feature is described as implemented.

---

## 53. Completion-report format

At the end of every milestone, Codex must return:

```text
# Milestone <number> completion report

## Scope completed

## Repository audit findings

## Files created

## Files modified

## Architecture decisions

## Automated tests

Command:
Result:

## Host tests actually performed

## Security and privacy checks

## Acceptance criteria

- [x] Completed criterion
- [ ] Incomplete criterion

## Deviations from the handoff

## Known limitations

## Required manual follow-up

## Recommendation

Ready for next milestone: Yes or No
```

Do not recommend proceeding while a mandatory exit criterion remains incomplete.

---

# First Prompt to Give Codex

```text
Read HANDOFF_PROMPT_COMPILER_MILESTONES_2_TO_1_0.md completely.

The repository contains an implementation of Milestone 1, but do not assume
that it exactly matches the earlier specification. Begin with Milestone 2
only.

First:
1. Inspect the repository and current AGENTS.md.
2. Audit the Milestone 1 implementation.
3. Compare the repository with the Milestone 2 entry criteria.
4. Report conflicts, missing behavior, and current platform assumptions that
   need to be re-verified.
5. Produce a concise Milestone 2 implementation plan.

Then implement Milestone 2:
- harden prompt compilation and approval behavior
- add the canonical action protocol
- formalize context-selection rules
- expand the golden prompt evaluation set
- generate ChatGPT Project Instructions and Codex AGENTS.md automatic-mode
  templates
- add a one-request bypass
- test explicit and implicit activation behavior

Do not add an MCP server, custom UI, authentication, database, profile
persistence, or OpenAI API integration during Milestone 2.

Keep context-aware compilation inside the ChatGPT or Codex host model.
Preserve exact approved prompt text.
Do not over-engineer.

Run every available test and validator. Exercise every host surface actually
available. Stop after Milestone 2 and return the required milestone completion
report. Do not begin Milestone 3 without explicit approval.
```