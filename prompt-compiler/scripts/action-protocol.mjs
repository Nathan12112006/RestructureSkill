import { createHash } from 'node:crypto';

export const ACTIONS = Object.freeze({
  APPROVE_AND_RUN: 'APPROVE_AND_RUN',
  REQUEST_REVISION: 'REQUEST_REVISION',
  USE_ORIGINAL: 'USE_ORIGINAL',
  CANCEL: 'CANCEL',
});

const POSITIVE_INTEGER = /^[1-9]\d*$/;
const REVIEW_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/;
const SHA256 = /^[0-9a-f]{64}$/;

export function sha256(text) {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

export function verifyExecutionIntegrity({ operativePrompt, approvedPrompt, approvedHash = 'UNAVAILABLE' } = {}) {
  if (typeof operativePrompt !== 'string' || typeof approvedPrompt !== 'string') {
    return failure('integrity-mismatch', 'Exact approved prompt text is unavailable; execution is blocked.');
  }
  if (operativePrompt !== approvedPrompt) {
    return failure('integrity-mismatch', 'The operative prompt differs from the exact approved prompt; execution is blocked.');
  }
  let executionHash;
  try {
    executionHash = sha256(operativePrompt);
  } catch {
    executionHash = 'UNAVAILABLE';
  }
  if (approvedHash !== 'UNAVAILABLE' && approvedHash !== executionHash) {
    return failure('integrity-mismatch', 'The approved prompt hash differs from the execution hash; execution is blocked.');
  }
  return { ok: true, operativePrompt, approvedPrompt, approvedHash, executionHash };
}

function failure(code, message) {
  return { ok: false, error: { code, message } };
}

function headerValue(value, label, validator) {
  if (!value || !validator.test(value)) return failure('malformed-header', `${label} is malformed.`);
  return { ok: true, value };
}

function parseBodyEnvelope(text, action, begin, end, fields) {
  const header = `${fields.join('\n')}\n${begin}\n`;
  if (!text.startsWith(header)) return failure('malformed-envelope', `Malformed ${action} envelope.`);
  const remainder = text.slice(header.length);
  const endAt = remainder.lastIndexOf(`\n${end}`);
  if (endAt < 0 || !/^\n?\s*$/.test(remainder.slice(endAt + end.length + 1))) {
    return failure('malformed-body', `The ${action} body is missing or malformed.`);
  }
  const body = remainder.slice(0, endAt);
  if (!body.length) return failure('malformed-body', `The ${action} body is missing or malformed.`);
  return { ok: true, body };
}

export function parseAction(text) {
  if (typeof text !== 'string' || !text.length) return failure('malformed-envelope', 'Action must be non-empty text.');
  const lines = text.split('\n');
  const action = lines[0]?.match(/^PROMPT_COMPILER_ACTION: ([A-Z_]+)$/)?.[1];
  if (!action || !Object.hasOwn(ACTIONS, action)) return failure('unknown-action', 'Unknown Prompt Compiler action.');

  if (action === ACTIONS.APPROVE_AND_RUN) {
    const header = text.match(/^PROMPT_COMPILER_ACTION: APPROVE_AND_RUN\nREVIEW_ID: ([^\n]+)\nPROMPT_VERSION: ([^\n]+)\nAPPROVED_PROMPT_SHA256: ([^\n]+)\nAPPROVED_PROMPT_BEGIN\n/);
    if (!header) return failure('malformed-envelope', 'Malformed APPROVE_AND_RUN envelope.');
    const id = headerValue(header[1], 'REVIEW_ID', REVIEW_ID);
    const version = headerValue(header[2], 'PROMPT_VERSION', POSITIVE_INTEGER);
    if (!id.ok) return id;
    if (!version.ok) return version;
    if (header[3] !== 'UNAVAILABLE' && !SHA256.test(header[3])) return failure('malformed-header', 'APPROVED_PROMPT_SHA256 is malformed.');
    const body = parseBodyEnvelope(
      text,
      'APPROVE_AND_RUN',
      'APPROVED_PROMPT_BEGIN',
      'APPROVED_PROMPT_END',
      [
        'PROMPT_COMPILER_ACTION: APPROVE_AND_RUN',
        `REVIEW_ID: ${header[1]}`,
        `PROMPT_VERSION: ${header[2]}`,
        `APPROVED_PROMPT_SHA256: ${header[3]}`,
      ],
    );
    if (!body.ok) return body;
    return { ok: true, action, reviewId: header[1], promptVersion: Number(header[2]), hash: header[3], prompt: body.body };
  }

  if (action === ACTIONS.REQUEST_REVISION) {
    const header = text.match(/^PROMPT_COMPILER_ACTION: REQUEST_REVISION\nREVIEW_ID: ([^\n]+)\nBASE_PROMPT_VERSION: ([^\n]+)\nREVISION_REQUEST_BEGIN\n/);
    if (!header) return failure('malformed-envelope', 'Malformed REQUEST_REVISION envelope.');
    const id = headerValue(header[1], 'REVIEW_ID', REVIEW_ID);
    const version = headerValue(header[2], 'BASE_PROMPT_VERSION', POSITIVE_INTEGER);
    if (!id.ok) return id;
    if (!version.ok) return version;
    const body = parseBodyEnvelope(
      text,
      'REQUEST_REVISION',
      'REVISION_REQUEST_BEGIN',
      'REVISION_REQUEST_END',
      [
        'PROMPT_COMPILER_ACTION: REQUEST_REVISION',
        `REVIEW_ID: ${header[1]}`,
        `BASE_PROMPT_VERSION: ${header[2]}`,
      ],
    );
    if (!body.ok) return body;
    return { ok: true, action, reviewId: header[1], basePromptVersion: Number(header[2]), revisionRequest: body.body };
  }

  if (action === ACTIONS.USE_ORIGINAL) {
    if (lines.length !== 3) return failure('malformed-envelope', 'Malformed USE_ORIGINAL envelope.');
    const match = text.match(/^PROMPT_COMPILER_ACTION: USE_ORIGINAL\nREVIEW_ID: ([^\n]+)\nORIGINAL_REQUEST_SHA256: ([^\n]+)$/);
    if (!match || !REVIEW_ID.test(match[1]) || (match[2] !== 'UNAVAILABLE' && !SHA256.test(match[2]))) {
      return failure('malformed-envelope', 'Malformed USE_ORIGINAL envelope.');
    }
    return { ok: true, action, reviewId: match[1], hash: match[2] };
  }

  if (lines.length !== 2) return failure('malformed-envelope', 'Malformed CANCEL envelope.');
  const match = text.match(/^PROMPT_COMPILER_ACTION: CANCEL\nREVIEW_ID: ([^\n]+)$/);
  if (!match || !REVIEW_ID.test(match[1])) return failure('malformed-envelope', 'Malformed CANCEL envelope.');
  return { ok: true, action, reviewId: match[1] };
}

export function createReview({ reviewId, originalRequest, prompt, version = 1, availableVersions = {} }) {
  if (!REVIEW_ID.test(reviewId)) throw new TypeError('reviewId must be an opaque non-empty identifier.');
  if (!Number.isInteger(version) || version < 1 || typeof prompt !== 'string' || !prompt.length) {
    throw new TypeError('A positive version and non-empty prompt are required.');
  }
  const versions = { ...availableVersions, [version]: prompt };
  return {
    status: 'review-pending',
    reviewId,
    activeVersion: version,
    versions,
    originalRequest,
  };
}

export function processReviewInput(state, input) {
  if (typeof input !== 'string') return { ok: false, error: { code: 'malformed-input', message: 'Review input must be text.' }, state };
  if (!input.includes('PROMPT_COMPILER_ACTION:')) {
    if (input.trim().endsWith('?')) return { ok: true, kind: 'question', state };
    return { ok: false, error: { code: 'not-an-action', message: 'Choose a review action or ask a question.' }, state };
  }
  return transitionReview(state, input);
}

export function transitionReview(state, input) {
  const parsed = typeof input === 'string' ? parseAction(input) : input;
  if (!parsed.ok) return { ok: false, error: parsed.error, state };
  if (parsed.reviewId !== state.reviewId) return failureWithState('review-id-mismatch', 'The action review ID does not match the active review.', state);
  if (state.status !== 'review-pending') return failureWithState('review-not-pending', 'This review is no longer pending; create a new review.', state);

  if (parsed.action === ACTIONS.APPROVE_AND_RUN) {
    const expected = state.versions[parsed.promptVersion];
    if (typeof expected !== 'string' || parsed.promptVersion > state.activeVersion) {
      return failureWithState('stale-version', 'Only the active prompt version or an explicitly available earlier version may be approved.', state);
    }
    // The active review textarea is user-editable. Its exact body becomes the
    // approval record for the active version. Earlier versions are immutable
    // history and therefore still require their stored exact body.
    if (parsed.promptVersion < state.activeVersion && expected !== parsed.prompt) {
      return failureWithState('integrity-mismatch', 'The earlier prompt version does not match its stored approved text; execution is blocked.', state);
    }
    const integrity = verifyExecutionIntegrity({
      operativePrompt: parsed.prompt,
      approvedPrompt: parsed.prompt,
      approvedHash: parsed.hash,
    });
    if (!integrity.ok) return failureWithState(integrity.error.code, integrity.error.message, state);
    const next = {
      ...state,
      status: 'approved',
      approvedVersion: parsed.promptVersion,
      approvedPrompt: integrity.approvedPrompt,
      operativePrompt: integrity.operativePrompt,
      approvedHash: integrity.approvedHash,
      executionHash: integrity.executionHash,
    };
    return { ok: true, action: parsed.action, operativePrompt: integrity.operativePrompt, executionHash: integrity.executionHash, state: next };
  }

  if (parsed.action === ACTIONS.REQUEST_REVISION) {
    if (!Object.hasOwn(state.versions, parsed.basePromptVersion) || parsed.basePromptVersion > state.activeVersion) return failureWithState('stale-version', 'The revision base version is not available.', state);
    const next = { ...state, status: 'revision-pending', revisionBaseVersion: parsed.basePromptVersion, revisionRequest: parsed.revisionRequest };
    return { ok: true, action: parsed.action, state: next };
  }

  if (parsed.action === ACTIONS.USE_ORIGINAL) {
    if (typeof state.originalRequest !== 'string') return failureWithState('original-unavailable', 'The original request is unavailable.', state);
    const integrity = verifyExecutionIntegrity({
      operativePrompt: state.originalRequest,
      approvedPrompt: state.originalRequest,
      approvedHash: parsed.hash,
    });
    if (!integrity.ok) return failureWithState(integrity.error.code, integrity.error.message, state);
    const next = {
      ...state,
      status: 'original-selected',
      approvedVersion: state.activeVersion,
      approvedPrompt: integrity.approvedPrompt,
      operativePrompt: integrity.operativePrompt,
      approvedHash: integrity.approvedHash,
      executionHash: integrity.executionHash,
    };
    return { ok: true, action: parsed.action, operativePrompt: integrity.operativePrompt, executionHash: integrity.executionHash, state: next };
  }

  const next = { ...state, status: 'cancelled' };
  return { ok: true, action: parsed.action, state: next };
}

function failureWithState(code, message, state) {
  return { ok: false, error: { code, message }, state };
}
