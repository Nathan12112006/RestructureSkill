import assert from 'node:assert/strict';
import test from 'node:test';
import { actionMessage, promptHash } from '../dist/create-server.js';

const review = {
  version: 3, target: 'chatgpt', mode: 'strict',
  original_prompt: '  original\n\n', optimized_prompt: 'edited',
  behaviour_tuning_prompt: 'You are a careful editor who preserves the requested constraints.',
  assumptions: { low: [], medium: [], high: [] }, meaningful_changes: [], applied_user_instructions: [],
  operational_impact: { level: 'answer-only', reason: 'No external effect.' }, revision_count: 0, warnings: [],
};

test('approval preserves exact whitespace and hashes edited text', () => {
  const edited = ' first line\n\nsecond line  ';
  const message = actionMessage('approve', review, edited);
  assert.equal(message, [
    'RESTRUCTURE_ACTION: APPROVE_AND_RUN',
    'PROMPT_VERSION: 3',
    `APPROVED_PROMPT_SHA256: ${promptHash(edited)}`,
    'APPROVED_PROMPT_BEGIN',
    edited,
    'APPROVED_PROMPT_END',
  ].join('\n'));
});

test('revision uses base version, original is verbatim, and cancel is canonical', () => {
  assert.equal(actionMessage('revision', review, 'change only the heading'), [
    'RESTRUCTURE_ACTION: REQUEST_REVISION', 'BASE_PROMPT_VERSION: 3',
    'REVISION_REQUEST_BEGIN', 'change only the heading', 'REVISION_REQUEST_END',
  ].join('\n'));
  assert.equal(actionMessage('original', review), [
    'RESTRUCTURE_ACTION: USE_ORIGINAL', `ORIGINAL_REQUEST_SHA256: ${promptHash(review.original_prompt)}`,
  ].join('\n'));
  assert.equal(actionMessage('cancel', review), 'RESTRUCTURE_ACTION: CANCEL');
});
