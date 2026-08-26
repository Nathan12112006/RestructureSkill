# Examples

These examples illustrate the minimum useful structure. Each includes the
review facts and expected next state; actual reviews must preserve the user's
verbatim request and use the complete output contract.

## 1. Simple explanation

Original: `what does patience do in YOLO training?`

Target: ChatGPT. Mode: Minimal.

Optimized prompt:

```text
Explain what the `patience` setting does during YOLO training and give a
short example of when it stops training.
```

Assumptions: None. Meaningful changes: Made the requested concept and example
explicit. Operational impact: answer-only. Expected next state: review-pending.

## 2. Vague coding request

Original: `Fix the login issue and don't over engineer it.`

Target: Codex. Mode: Balanced.

Optimized prompt:

```text
Investigate and fix the login issue in the current repository. Make the
smallest targeted change, preserve unrelated behavior, and run the most
relevant existing checks. Report the root cause, changed files, and results.
Do not add dependencies or refactor unrelated code unless necessary.
```

Assumptions: The request refers to the current repository and login flow.
Meaningful changes: Translated the minimal-change preference into boundaries
and validation. Operational impact: local-write. Expected next state:
review-pending.

## 3. Detailed code-change request

Original: `In src/auth/login.ts, fix the null token bug, add a regression test in tests/login.test.ts, run npm test, and don't change the public API.`

Target: Codex. Mode: Strict.

Optimized prompt:

```text
Objective: Fix the null-token bug in `src/auth/login.ts`.
Required changes: Add a focused regression test in `tests/login.test.ts`.
Constraints: Preserve the public API and avoid unrelated refactors.
Validation: Run `npm test` and report the result.
Deliverables: Root cause, changed files, and test output summary.
```

Assumptions: None. Meaningful changes: Organized existing exact paths,
command, and constraints for execution. Operational impact: local-write.
Expected next state: review-pending.

## 4. Uploaded-file analysis

Original: `Analyze the uploaded CSV for missing values, but don't modify it.`

Target: ChatGPT. Mode: Balanced.

Optimized prompt:

```text
Analyze the uploaded CSV for missing values. Report affected columns, counts,
and representative rows, and do not modify the uploaded file.
```

Assumptions: The uploaded CSV is available in the current conversation.
Meaningful changes: Made the report contents explicit while preserving the
no-modification constraint. Operational impact: read-only. Expected next state:
review-pending.

## 5. Web research

Original: `Compare current battery prices from three reputable sources and cite them.`

Target: ChatGPT. Mode: Balanced.

Optimized prompt:

```text
Using current web sources, compare battery prices from three reputable sources.
State the retrieval date, currency, product assumptions, and direct citations;
distinguish sourced facts from calculations.
```

Assumptions: “Battery” needs a product/category clarification if the context
does not supply one. Meaningful changes: Added source/date transparency.
Operational impact: read-only. Expected next state: review-pending.

## 6. External action

Original: `Email my professor and tell them I will submit tomorrow.`

Target: ChatGPT. Mode: Strict.

Optimized prompt:

```text
Email my professor with a message saying that I will submit tomorrow. Before
sending, ask for or confirm the professor's email address, course context, and
desired tone. Do not send until those details are confirmed and the host's
native operational confirmation is granted.
```

Assumptions: No recipient, account, course, or tone details were supplied.
Meaningful changes: Preserved the explicit send request while making the
missing details and confirmation boundary visible. Operational impact:
external-action: sending changes an external system; this review does not send
anything, and native confirmation remains required. Expected next state:
review-pending.

## 7. Already well-structured prompt

Original: `Objective: summarize the paper. Context: use the attached PDF.
Constraints: do not invent claims. Output: a 200-word summary with page cites.`

Target: ChatGPT. Mode: Minimal.

Optimized prompt:

```text
Objective: summarize the paper. Context: use the attached PDF.
Constraints: do not invent claims. Output: a 200-word summary with page cites.
```

Assumptions: None. Meaningful changes: None. The original request was already
sufficiently clear. Operational impact: read-only. Expected next state:
review-pending.

## 8. Contradictory request

Original: `Change whatever is necessary, but do not modify any files.`

Target: Codex. Mode: Strict.

Optimized prompt:

```text
Analyze the requested issue and identify what would need to change, but do not
modify any files. The request contains a conflict between changing what is
necessary and forbidding file changes; ask which constraint should govern
before implementing a fix.
```

Assumptions: The user wants analysis before choosing a resolution. Meaningful
changes: Preserved both constraints and surfaced the conflict. Operational
impact: read-only. Expected next state: review-pending pending clarification.

## 9. User edit after review

Original: `Fix the parser bug.` Initial target: Codex. Initial mode: Balanced.

Edit: `Edit: Do not add tests and do not modify package.json.`

Revised optimized prompt:

```text
Investigate and fix the parser bug in the current repository. Do not add tests,
do not modify `package.json`, and report the root cause, changed files, and
relevant checks.
```

Assumptions: The current repository contains the parser. Meaningful changes:
Added both user-specified exclusions. Operational impact: local-write.
Expected next state: revision-pending → review-pending with version incremented.

## 10. Question while review is pending

Original: `Check my repository for the login issue.`

Pending question: `Will this modify my files?`

Target: Codex. Mode: Balanced. The current reviewed prompt is read-only: it
inspects the current repository for the login issue and reports findings; it
does not modify files. The question is not approval. Assumptions: The
repository is the current host repository. Operational impact: read-only
unless a later approved revision explicitly asks for a fix. Expected next
state: review-pending.
