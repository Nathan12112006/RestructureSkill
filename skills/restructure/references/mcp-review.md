# Optional MCP review rendering

The optional Milestone 3 MCP server exposes exactly one read-only tool:
`render_prompt_review`. The host model must compile and validate the complete
review first. When the tool is available, the `render_prompt_review` call is
required; call it exactly once with the complete review before emitting the
assistant-visible review. The renderer response is an optional presentation
enhancement, not the presented review and not execution; it occurs before the
host waits for approval. The MCP server only
validates, returns the structured review, renders the editable card, and
supplies the complete text fallback; it never calls a model, sends a message,
executes the underlying request, or stores prompt data.

After the tool returns, the host must immediately emit the complete
assistant-visible text review from `references/output-contract.md`, including
the optimized prompt and canonical actions. Only after that visible review is
emitted may the host end the review turn. It must not call another tool,
continue analysis, inspect files, or perform underlying work. It waits for the
user's next message. A tool result, resource link, or card alone is not
presentation. An approval makes the exact approved body the sole operative
request and does not trigger recompilation.

Send every required review field, including the verbatim original prompt,
optimized prompt, grouped assumptions, meaningful changes, applied
instructions with exact provenance labels, operational impact, revision count,
and warnings. If the render_prompt_review invocation is unavailable or fails
then emit the full text review from `references/output-contract.md` and
continue the canonical Milestone 2 action protocol. Whether the
`render_prompt_review` call succeeds, fails, or its UI output is hidden, always
emit that complete text review and then wait for the user's next message. Do
not send a review payload
when the user uses the one-request bypass `skip prompt review for this request`.

The UI's buttons send canonical action messages through the shared `ui/message`
JSON-RPC mechanism. A host must still apply the normal semantic and native
operational confirmation boundaries after an action is received.
