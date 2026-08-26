// src/review-fallback.ts
import { createHash } from "node:crypto";
var ACTIONS = Object.freeze({
  approve: "RESTRUCTURE_ACTION: APPROVE_AND_RUN",
  revision: "RESTRUCTURE_ACTION: REQUEST_REVISION",
  original: "RESTRUCTURE_ACTION: USE_ORIGINAL",
  cancel: "RESTRUCTURE_ACTION: CANCEL"
});
function promptHash(prompt) {
  return createHash("sha256").update(prompt, "utf8").digest("hex");
}
function list(label, values) {
  return values.length ? `${label}:
${values.map((value) => `- ${value}`).join("\n")}` : `${label}: (none)`;
}
function renderTextFallback(review) {
  const assumptions = [
    list("Low-impact assumptions", review.assumptions.low),
    list("Medium-impact assumptions", review.assumptions.medium),
    list("High-impact assumptions", review.assumptions.high)
  ].join("\n");
  const applied = review.applied_user_instructions.length ? review.applied_user_instructions.map((item) => `- ${item.text} \u2014 Source: ${item.source}`).join("\n") : "(none)";
  const warnings = review.warnings.length ? review.warnings.map((item) => `- ${item}`).join("\n") : "(none)";
  const changes = review.meaningful_changes.length ? review.meaningful_changes.map((item) => `- ${item}`).join("\n") : "(none)";
  return [
    "RESTRUCTURE REVIEW",
    `Review ID: ${review.review_id}`,
    `Prompt version: ${review.version}`,
    `Target: ${review.target}`,
    `Compilation mode: ${review.mode}`,
    `Revision count: ${review.revision_count}`,
    "",
    "VERBATIM ORIGINAL PROMPT",
    review.original_prompt,
    "",
    "OPTIMIZED PROMPT",
    review.optimized_prompt,
    "",
    "ASSUMPTIONS GROUPED BY IMPACT",
    assumptions,
    "",
    "MEANINGFUL CHANGES",
    changes,
    "",
    "APPLIED USER INSTRUCTIONS",
    applied,
    "",
    "OPERATIONAL IMPACT",
    `Level: ${review.operational_impact.level}`,
    `Reason: ${review.operational_impact.reason}`,
    "",
    "WARNINGS",
    warnings,
    "",
    "ACTIONS",
    "Natural-language choices: Approve and run | Edit: <requested changes> | Use original | Cancel",
    `${ACTIONS.approve}
${ACTIONS.revision}
${ACTIONS.original}
${ACTIONS.cancel}`,
    "",
    "Prompt approval confirms wording and intent. Native confirmations may still be required before files, accounts, external services, or destructive operations are changed.",
    "",
    "Status: Awaiting explicit approval in a new user message."
  ].join("\n");
}
function actionMessage(action, review, editedPrompt) {
  if (action === "cancel") return [ACTIONS.cancel, `REVIEW_ID: ${review.review_id}`].join("\n");
  if (action === "revision") return [
    ACTIONS.revision,
    `REVIEW_ID: ${review.review_id}`,
    `BASE_PROMPT_VERSION: ${review.version}`,
    "REVISION_REQUEST_BEGIN",
    editedPrompt ?? "",
    "REVISION_REQUEST_END"
  ].join("\n");
  if (action === "original") {
    return [
      ACTIONS.original,
      `REVIEW_ID: ${review.review_id}`,
      `ORIGINAL_REQUEST_SHA256: ${promptHash(review.original_prompt)}`
    ].join("\n");
  }
  const prompt = editedPrompt ?? review.optimized_prompt;
  return [
    ACTIONS.approve,
    `REVIEW_ID: ${review.review_id}`,
    `PROMPT_VERSION: ${review.version}`,
    `APPROVED_PROMPT_SHA256: ${promptHash(prompt)}`,
    "APPROVED_PROMPT_BEGIN",
    prompt,
    "APPROVED_PROMPT_END"
  ].join("\n");
}
export {
  ACTIONS,
  actionMessage,
  promptHash,
  renderTextFallback
};
