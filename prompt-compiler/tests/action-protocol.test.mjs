import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ACTIONS,
  createReview,
  parseAction,
  processReviewInput,
  sha256,
  transitionReview,
  verifyExecutionIntegrity,
} from '../scripts/action-protocol.mjs';

const reviewId = 'pc-review-opaque-7f3a';
const original = 'Fix the login issue.\nDo not change the public API.';
const promptV1 = 'Investigate and fix the login issue.\nPreserve the public API.';
const promptV2 = 'Investigate and fix the login issue.\nPreserve the public API.\nRun focused tests.';

function review() {
  return createReview({ reviewId, originalRequest: original, prompt: promptV2, version: 2, availableVersions: { 1: promptV1 } });
}

function approve(id = reviewId, version = 2, prompt = promptV2, hash = sha256(prompt)) {
  return [
    'PROMPT_COMPILER_ACTION: APPROVE_AND_RUN',
    `REVIEW_ID: ${id}`,
    `PROMPT_VERSION: ${version}`,
    `APPROVED_PROMPT_SHA256: ${hash}`,
    'APPROVED_PROMPT_BEGIN',
    prompt,
    'APPROVED_PROMPT_END',
  ].join('\n');
}

function revise(id = reviewId, version = 1, request = 'Keep the public API unchanged.') {
  return [
    'PROMPT_COMPILER_ACTION: REQUEST_REVISION',
    `REVIEW_ID: ${id}`,
    `BASE_PROMPT_VERSION: ${version}`,
    'REVISION_REQUEST_BEGIN',
    request,
    'REVISION_REQUEST_END',
  ].join('\n');
}

test('valid approve transitions to approved and returns exact text', () => {
  const result = transitionReview(review(), approve());
  assert.equal(result.ok, true);
  assert.equal(result.action, ACTIONS.APPROVE_AND_RUN);
  assert.equal(result.operativePrompt, promptV2);
  assert.equal(result.state.status, 'approved');
  assert.equal(result.state.approvedPrompt, promptV2);
  assert.equal(result.state.executionHash, sha256(promptV2));
});

test('active review textarea can be edited and approved verbatim', () => {
  const edited = `${promptV2}\nKeep the change limited to the authentication module.`;
  const result = transitionReview(review(), approve(reviewId, 2, edited, sha256(edited)));
  assert.equal(result.ok, true);
  assert.equal(result.operativePrompt, edited);
  assert.equal(result.state.approvedPrompt, edited);
  assert.equal(result.state.executionHash, sha256(edited));
});

test('earlier prompt versions remain immutable approval history', () => {
  const edited = `${promptV1}\nDo not change dependencies.`;
  const result = transitionReview(review(), approve(reviewId, 1, edited, sha256(edited)));
  assert.equal(result.ok, false);
  assert.equal(result.error.code, 'integrity-mismatch');
  assert.equal(result.operativePrompt, undefined);
});

test('execution integrity requires exact text and matching hash when available', () => {
  const exact = 'first line\n\n  second line';
  const valid = verifyExecutionIntegrity({
    operativePrompt: exact,
    approvedPrompt: exact,
    approvedHash: sha256(exact),
  });
  assert.equal(valid.ok, true);
  assert.equal(valid.operativePrompt, exact);
  assert.equal(valid.executionHash, sha256(exact));

  const textMismatch = verifyExecutionIntegrity({
    operativePrompt: `${exact} `,
    approvedPrompt: exact,
    approvedHash: sha256(exact),
  });
  assert.equal(textMismatch.ok, false);
  assert.equal(textMismatch.error.code, 'integrity-mismatch');
  assert.equal(textMismatch.operativePrompt, undefined);

  const hashMismatch = verifyExecutionIntegrity({
    operativePrompt: exact,
    approvedPrompt: exact,
    approvedHash: sha256('different'),
  });
  assert.equal(hashMismatch.ok, false);
  assert.equal(hashMismatch.error.code, 'integrity-mismatch');
  assert.equal(hashMismatch.operativePrompt, undefined);
});

test('hash unavailable still requires exact string equality', () => {
  const exact = 'line one\nline two';
  assert.equal(verifyExecutionIntegrity({
    operativePrompt: exact,
    approvedPrompt: exact,
    approvedHash: 'UNAVAILABLE',
  }).ok, true);
  const mismatch = verifyExecutionIntegrity({
    operativePrompt: 'line one\nline two\n',
    approvedPrompt: exact,
    approvedHash: 'UNAVAILABLE',
  });
  assert.equal(mismatch.ok, false);
  assert.equal(mismatch.error.code, 'integrity-mismatch');
});

test('mismatched review ID is rejected', () => {
  const result = transitionReview(review(), approve('other-review'));
  assert.equal(result.ok, false);
  assert.equal(result.error.code, 'review-id-mismatch');
  assert.equal(result.state.status, 'review-pending');
});

test('active version and explicitly available earlier version can be approved', () => {
  const active = transitionReview(review(), approve(reviewId, 2, promptV2));
  const earlier = transitionReview(review(), approve(reviewId, 1, promptV1));
  assert.equal(active.ok, true);
  assert.equal(earlier.ok, true);
  assert.equal(earlier.operativePrompt, promptV1);
});

test('unavailable stale version is rejected', () => {
  const result = transitionReview(review(), approve(reviewId, 9, promptV1));
  assert.equal(result.ok, false);
  assert.equal(result.error.code, 'stale-version');
});

test('missing and malformed approved bodies are rejected', () => {
  const missing = approve().replace(`\n${promptV2}\nAPPROVED_PROMPT_END`, '\nAPPROVED_PROMPT_END');
  const malformed = approve().replace('APPROVED_PROMPT_END', 'APPROVED_PROMPT_END\nextra');
  assert.equal(parseAction(missing).error.code, 'malformed-body');
  assert.equal(parseAction(malformed).error.code, 'malformed-body');
  assert.equal(transitionReview(review(), missing).ok, false);
});

test('approved body preserves whitespace and line breaks exactly', () => {
  const text = 'first line\n\n  indented line\ntrailing space ';
  const state = createReview({ reviewId, originalRequest: original, prompt: text, version: 2, availableVersions: { 1: text } });
  const result = transitionReview(state, approve(reviewId, 2, text));
  assert.equal(result.ok, true);
  assert.equal(result.operativePrompt, text);
});

test('valid revision is pending and cannot execute', () => {
  const result = transitionReview(review(), revise(reviewId, 2));
  assert.equal(result.ok, true);
  assert.equal(result.action, ACTIONS.REQUEST_REVISION);
  assert.equal(result.state.status, 'revision-pending');
  assert.equal(result.operativePrompt, undefined);
});

test('revision action is not approval', () => {
  const result = transitionReview(review(), revise(reviewId, 2));
  assert.notEqual(result.action, ACTIONS.APPROVE_AND_RUN);
  assert.equal(result.state.status, 'revision-pending');
});

test('questions keep the review pending', () => {
  const state = review();
  const result = processReviewInput(state, 'Will this modify my files?');
  assert.equal(result.ok, true);
  assert.equal(result.kind, 'question');
  assert.equal(result.state, state);
});

test('use original selects the verbatim original', () => {
  const result = transitionReview(review(), [
    'PROMPT_COMPILER_ACTION: USE_ORIGINAL',
    `REVIEW_ID: ${reviewId}`,
    `ORIGINAL_REQUEST_SHA256: ${sha256(original)}`,
  ].join('\n'));
  assert.equal(result.ok, true);
  assert.equal(result.action, ACTIONS.USE_ORIGINAL);
  assert.equal(result.operativePrompt, original);
  assert.equal(result.state.approvedVersion, 2);
  assert.equal(result.state.executionHash, sha256(original));
});

test('cancel stops the review', () => {
  const result = transitionReview(review(), `PROMPT_COMPILER_ACTION: CANCEL\nREVIEW_ID: ${reviewId}`);
  assert.equal(result.ok, true);
  assert.equal(result.state.status, 'cancelled');
});

test('cancelled review cannot be resurrected without a new review', () => {
  const cancelled = transitionReview(review(), `PROMPT_COMPILER_ACTION: CANCEL\nREVIEW_ID: ${reviewId}`);
  const replay = transitionReview(cancelled.state, approve());
  const newReview = createReview({ reviewId: 'pc-review-new', originalRequest: original, prompt: promptV1 });
  const fresh = transitionReview(newReview, approve('pc-review-new', 1, promptV1));
  assert.equal(replay.ok, false);
  assert.equal(replay.error.code, 'review-not-pending');
  assert.equal(fresh.ok, true);
});
