# Automatic-mode templates

These are deterministic generated text snippets. Return them for the user to
copy and paste or use in the selected host. Prompt Compiler does not
automatically write ChatGPT Project Instructions or a repository `AGENTS.md`.
It is never automatically written; it is returned for user paste/use only.
The generated text is not evidence that either host setting has changed.

## ChatGPT Project Instructions

When requested, return exactly this installation block:

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

Tell the user that this block is generated text to paste into the project's
instructions. Do not claim to have modified the Project.

## Codex `AGENTS.md`

When requested, return exactly this marked section:

```markdown
<!-- prompt-compiler:start -->
## Prompt Compiler workflow

Before implementing a new task, compile the request into a target-specific
prompt and show a review.

Do not edit files or run request-specific commands until the user approves the
prompt, chooses the original request, or explicitly bypasses review for the
current task.

Preserve explicit constraints, filenames, paths, dates, quantities, and
approval boundaries.

Prompt Compiler profile: none
<!-- prompt-compiler:end -->
```

Tell the user that this section is generated text to paste into the intended
repository `AGENTS.md`. Do not write the file, create a diff, or claim that the
repository instructions changed.

## One-request bypass

The exact phrase is:

```text
skip prompt review for this request
```

It bypasses Prompt Compiler review for the current request only. It is
nonpersistent: it does not change Project Instructions, `AGENTS.md`, a profile,
or future requests. Native host safety and operational confirmations still
apply.
