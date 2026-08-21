# Product decisions

Each decision records context, decision, reason, and consequences.

## PD-001: Prompt compilation occurs in the host model

Context: The host already has the current conversation and can transform the
request. Decision: the current ChatGPT or Codex model compiles the prompt.
Reason: preserve context and avoid a second model boundary. Consequences: no
separate compiler service and no guarantee of invisible middleware behavior.

## PD-002: No separate OpenAI API call in Milestone 1

Context: a second request would need credentials and duplicate context.
Decision: make no OpenAI API request. Reason: reduce privacy, cost, and setup
risk. Consequences: no API key or model SDK; quality depends on the host model.

## PD-003: Approval is mandatory by default

Context: rewriting can change scope or meaning. Decision: show a review and
stop before the underlying task. Reason: keep semantic control with the user.
Consequences: users must choose Approve, Edit, Use original, or Cancel.

## PD-004: Exact approved prompt is executed without regeneration

Context: regeneration after approval could silently alter wording. Decision: use
the exact text most recently shown for the approved version. Reason: make the
approval auditable and predictable. Consequences: revisions require a new
version and review.

## PD-005: Operational confirmations remain native to the host

Context: semantic agreement is different from permission to change files or
external systems. Decision: retain ChatGPT, Codex, and tool confirmations.
Reason: preserve native safety boundaries. Consequences: prompt approval is not
blanket authorization.

## PD-006: Explicit invocation is the initial supported workflow

Context: skills are not guaranteed to run as invisible middleware. Decision:
optimize explicit `@Prompt Compiler` and `$prompt-compiler` invocation.
Reason: reliable initial evaluation. Consequences: implicit invocation is
disabled until trigger tests justify enabling it.

## PD-007: Persistent instructions are deferred

Context: Milestone 1 has no storage boundary or supported Project-memory write.
Decision: only apply user-visible instructions already in the conversation.
Reason: avoid misleading storage claims. Consequences: no profiles, database,
or memory integration.

## PD-008: No telemetry in Milestone 1

Context: prompt text may be sensitive and the product does not need analytics
to compile a request. Decision: collect and send no telemetry. Reason: privacy
and minimal scope. Consequences: no usage analytics or remote diagnostics.

## PD-009: Simple prompts must remain simple

Context: rigid templates can add noise and change scope. Decision: use the
smallest structure that materially improves a request. Reason: preserve natural
intent and reduce correction turns. Consequences: Minimal mode may produce a
short sentence rather than a full template.

## PD-010: Hidden instructions must never be exposed

Context: the host may contain system, developer, or private context. Decision:
never reveal hidden instructions, policies, private reasoning, or hidden memory
details. Reason: preserve platform boundaries. Consequences: only explicit
user-supplied standing instructions may appear in a review.

## PD-011: Canonical actions supplement natural language

Context: Text fallback needs an exact message format that future host controls
can validate without changing the conversational workflow. Decision: define
four canonical action envelopes with an opaque review ID, positive version,
optional lowercase hash, and exact body markers. Reason: reject replay,
mismatch, stale, malformed, and regenerated approvals deterministically.
Consequences: natural-language choices remain supported, while the protocol
seam is pure in-memory logic and does not create a server or persistence layer.

## PD-012: Automatic-mode setup is generated, not written

Context: Host project and repository settings are user-owned surfaces and are
not writable by this skill-only package. Decision: return deterministic
ChatGPT Project Instructions and Codex `AGENTS.md` snippets for user paste/use.
Reason: avoid claiming a host setting changed when it did not. Consequences:
manual setup remains required and the snippets are not persistent plugin state.

## PD-013: Selected context is narrow and provenance-labeled

Context: Relevant context can improve compilation, while copying a transcript
or hidden instructions creates privacy and correctness risk. Decision: include
only user-visible context that changes execution and show one exact source
label. Reason: make imported constraints auditable. Consequences: unavailable
or hidden context is not guessed or exposed.

## PD-014: Per-request bypass is nonpersistent

Context: Users sometimes need to proceed without a review for one task.
Decision: support only `skip prompt review for this request` for the current
request. Reason: provide a narrow escape hatch without changing future
behavior. Consequences: Project Instructions, `AGENTS.md`, profiles, and later
requests remain unchanged.

## PD-015: MCP rendering is optional and read-only

Context: A structured card improves review usability, but the text workflow
must work in hosts without MCP Apps support. Decision: add one bundled,
stateless `render_prompt_review` tool that validates and renders a review only;
it never calls a model, sends a follow-up, stores prompt text, or executes an
action. Reason: keep the UI boundary narrow and preserve the text fallback.
Consequences: hosts may use the card when available, while the skill always
emits the complete canonical text contract when it is unavailable.

## PD-016: Untrusted review data is rendered as text

Context: Original prompts and instructions can contain HTML-like or malicious
content. Decision: the review card uses `textContent` and textarea `value`, a
restrictive CSP, no third-party resources, and no browser storage. Reason:
prevent prompt content from becoming executable markup or a data exfiltration
path. Consequences: formatting is intentionally plain and user-visible.
