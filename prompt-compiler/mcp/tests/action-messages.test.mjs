import assert from 'node:assert/strict';
import test from 'node:test';
import { actionMessage, promptHash } from '../dist/create-server.js';

const review = {
  review_id: 'pc-actions', version: 3, target: 'chatgpt', mode: 'strict',
  original_prompt: '  original\n\n', optimized_prompt: 'edited',
  assumptions: { low: [], medium: [], high: [] }, meaningful_changes: [], applied_user_instructions: [],
  operational_impact: { level: 'answer-only', reason: 'No external effect.' }, revision_count: 0, warnings: [],
};

test('approval preserves exact whitespace and hashes edited text', () => {
  const edited = ' first line\n\nsecond line  ';
  const message = actionMessage('approve', review, edited);
  assert.match(message, /PROMPT_COMPILER_ACTION: APPROVE_AND_RUN/);
  assert.match(message, /PROMPT_VERSION: 3/);
  assert.match(message, new RegExp(`APPROVED_PROMPT_SHA256: ${promptHash(edited)}`));
  assert.match(message, new RegExp(`APPROVED_PROMPT_BEGIN\\n${edited}\\nAPPROVED_PROMPT_END`));
});

test('revision uses base version, original is verbatim, and cancel is canonical', () => {
  assert.equal(actionMessage('revision', review, 'change only the heading'), [
    'PROMPT_COMPILER_ACTION: REQUEST_REVISION', 'REVIEW_ID: pc-actions', 'BASE_PROMPT_VERSION: 3',
    'REVISION_REQUEST_BEGIN', 'change only the heading', 'REVISION_REQUEST_END',
  ].join('\n'));
  assert.equal(actionMessage('original', review), [
    'PROMPT_COMPILER_ACTION: USE_ORIGINAL', 'REVIEW_ID: pc-actions', `ORIGINAL_REQUEST_SHA256: ${promptHash(review.original_prompt)}`,
  ].join('\n'));
  assert.equal(actionMessage('cancel', review), 'PROMPT_COMPILER_ACTION: CANCEL\nREVIEW_ID: pc-actions');
});
