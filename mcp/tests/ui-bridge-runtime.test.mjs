import assert from 'node:assert/strict';
import { createHash, webcrypto } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const mcpRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = await readFile(path.join(mcpRoot, 'public/prompt-review.html'), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script, 'expected the review UI to contain an embedded script');

const review = {
  target: 'chatgpt',
  mode: 'strict',
  version: 1,
  revision_count: 0,
  original_prompt: 'original prompt',
  optimized_prompt: 'optimized prompt',
  behaviour_tuning_prompt: 'You are an implementation specialist focused on the requested constraints.',
  assumptions: { low: [], medium: [], high: [] },
  meaningful_changes: [],
  applied_user_instructions: [],
  operational_impact: { level: 'answer-only', reason: 'No external effect.' },
  warnings: [],
};

class FakeNode {
  constructor(tagName, id = '') {
    this.tagName = tagName;
    this.id = id;
    this.value = '';
    this.type = '';
    this.checked = false;
    this.hidden = false;
    this.textContent = '';
    this.className = '';
    this.disabled = false;
    this.childNodes = [];
    this.listeners = new Map();
    this.focused = false;
  }

  addEventListener(type, listener) {
    this.listeners.set(type, listener);
  }

  append(...nodes) {
    this.childNodes.push(...nodes);
  }

  replaceChildren(...nodes) {
    this.childNodes = nodes;
  }

  focus() {
    this.focused = true;
  }

  click() {
    if (this.disabled) return;
    if (this.type === 'checkbox') this.checked = !this.checked;
    const event = { currentTarget: this, target: this };
    const clickListener = this.listeners.get('click');
    if (clickListener) clickListener(event);
    const changeListener = this.listeners.get('change');
    if (this.type === 'checkbox' && changeListener) changeListener(event);
  }

  input(value = this.value) {
    this.value = value;
    const event = { currentTarget: this, target: this };
    const listener = this.listeners.get('input');
    if (listener) listener(event);
  }
}

function createHarness({ onPostMessage, legacy = false, initialReview = review } = {}) {
  const ids = [
    'result', 'optimized-prompt', 'optimized-prompt-preview', 'revision-request',
    'behaviour-tuning-option', 'behaviour-tuning-enabled', 'behaviour-tuning-controls', 'behaviour-tuning-prompt',
    'target', 'mode', 'version', 'revision-count', 'original-prompt',
    'assumptions', 'meaningful-changes', 'applied-instructions', 'operational-impact',
    'warnings', 'approve', 'revision', 'original', 'cancel',
  ];
  const nodes = new Map(ids.map((id) => [id, new FakeNode(
    ['optimized-prompt', 'revision-request', 'behaviour-tuning-prompt'].includes(id) ? 'textarea' :
      id === 'behaviour-tuning-enabled' ? 'input' : 'div', id,
  )]));
  nodes.get('behaviour-tuning-enabled').type = 'checkbox';
  for (const id of ['approve', 'revision', 'original', 'cancel']) nodes.get(id).tagName = 'button';

  const listeners = new Map();
  const posts = [];
  const parent = {
    postMessage(message) {
      posts.push(message);
      if (onPostMessage) onPostMessage(message, api);
    },
  };
  const windowObject = {
    parent,
    crypto: webcrypto,
    TextEncoder,
    openai: {
      toolOutput: { structuredContent: { review: initialReview } },
      ...(legacy ? { sendFollowUpMessage: async (message) => { legacyMessages.push(message); } } : {}),
    },
    addEventListener(type, listener) {
      const current = listeners.get(type) || [];
      current.push(listener);
      listeners.set(type, current);
    },
    removeEventListener(type, listener) {
      listeners.set(type, (listeners.get(type) || []).filter((candidate) => candidate !== listener));
    },
    setTimeout,
    clearTimeout,
  };
  const legacyMessages = [];
  const documentObject = {
    getElementById(id) {
      return nodes.get(id) || null;
    },
    querySelectorAll(selector) {
      return selector === 'button' ? ['approve', 'revision', 'original', 'cancel'].map((id) => nodes.get(id)) : [];
    },
    createElement(tagName) {
      return new FakeNode(tagName);
    },
  };
  const dispatch = (data) => {
    for (const listener of [...(listeners.get('message') || [])]) listener({ source: parent, data });
  };
  const api = {
    nodes,
    posts,
    legacyMessages,
    dispatch,
    respond(id, response = {}) {
      dispatch({ jsonrpc: '2.0', id, ...response });
    },
    buttons() {
      return ['approve', 'revision', 'original', 'cancel'].map((id) => nodes.get(id));
    },
  };
  const context = {
    window: windowObject,
    document: documentObject,
    Error,
    Map,
    Promise,
    String,
    Array,
    Uint8Array,
    TextEncoder,
    setTimeout,
    clearTimeout,
  };
  vm.runInNewContext(script, context, { filename: 'prompt-review.html' });
  return api;
}

async function flush(milliseconds = 0) {
  if (milliseconds) await new Promise((resolve) => setTimeout(resolve, milliseconds));
  await Promise.resolve();
  await new Promise((resolve) => setImmediate(resolve));
}

function initialize(harness) {
  const initializeRequest = harness.posts.find((message) => message.method === 'ui/initialize');
  assert.ok(initializeRequest, 'the UI should begin the standard bridge handshake');
  harness.respond(initializeRequest.id, { result: {} });
  return flush();
}

function approvalMessage(harness) {
  const message = harness.posts.find((candidate) => candidate.method === 'ui/message');
  assert.ok(message, 'the review should emit an approval action');
  return message.params.content[0].text;
}

function approvedPrompt(message) {
  const begin = 'APPROVED_PROMPT_BEGIN\n';
  const end = '\nAPPROVED_PROMPT_END';
  const start = message.indexOf(begin);
  const finish = message.indexOf(end, start + begin.length);
  assert.ok(start >= 0 && finish >= 0, 'the approval should contain an exact prompt body');
  return message.slice(start + begin.length, finish);
}

function sha256(value) {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

test('behaviour tuning starts unchecked and hidden, and approval omits it by default', async () => {
  const harness = createHarness();
  await initialize(harness);

  const toggle = harness.nodes.get('behaviour-tuning-enabled');
  const option = harness.nodes.get('behaviour-tuning-option');
  const controls = harness.nodes.get('behaviour-tuning-controls');
  const tuning = harness.nodes.get('behaviour-tuning-prompt');
  assert.equal(toggle.checked, false);
  assert.equal(option.hidden, false);
  assert.equal(controls.hidden, true);
  assert.equal(tuning.value, review.behaviour_tuning_prompt);

  harness.nodes.get('approve').click();
  await flush(20);
  const message = approvalMessage(harness);
  assert.equal(approvedPrompt(message), review.optimized_prompt);
  assert.match(message, new RegExp(`APPROVED_PROMPT_SHA256: ${sha256(review.optimized_prompt)}`));
  assert.doesNotMatch(message, new RegExp(review.behaviour_tuning_prompt.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')));
});

test('optimized prompt stays in the structured bullet preview when behaviour tuning is enabled', async () => {
  const optimizedPrompt = 'Implementation plan:\n- Preserve the existing UI\n- Make the smallest safe change';
  const harness = createHarness({ initialReview: { ...review, optimized_prompt: optimizedPrompt } });
  await initialize(harness);

  const preview = harness.nodes.get('optimized-prompt-preview');
  assert.deepEqual(preview.childNodes.map((node) => node.tagName), ['h3', 'ul']);
  assert.deepEqual(preview.childNodes[1].childNodes.map((node) => node.textContent), [
    'Preserve the existing UI',
    'Make the smallest safe change',
  ]);

  harness.nodes.get('behaviour-tuning-enabled').click();
  harness.nodes.get('behaviour-tuning-prompt').input('You are a focused implementation specialist.');
  assert.deepEqual(preview.childNodes.map((node) => node.tagName), ['h3', 'ul']);
  assert.equal(preview.childNodes.some((node) => node.textContent.includes('implementation specialist')), false);
});

test('checking behaviour tuning reveals an editable prompt and appends the edited text to approval', async () => {
  const harness = createHarness();
  await initialize(harness);

  const toggle = harness.nodes.get('behaviour-tuning-enabled');
  const controls = harness.nodes.get('behaviour-tuning-controls');
  const tuning = harness.nodes.get('behaviour-tuning-prompt');
  toggle.click();
  assert.equal(toggle.checked, true);
  assert.equal(controls.hidden, false);
  const editedTuning = 'You are a patient teacher who explains each concept with a concrete example.';
  tuning.input(editedTuning);
  const expected = review.optimized_prompt + '\n\n' + editedTuning;

  harness.nodes.get('approve').click();
  await flush(20);
  const message = approvalMessage(harness);
  assert.equal(approvedPrompt(message), expected);
  assert.match(message, new RegExp(`APPROVED_PROMPT_SHA256: ${sha256(expected)}`));
});

test('behaviour tuning draft survives a toggle cycle while remaining excluded when disabled', async () => {
  const harness = createHarness();
  await initialize(harness);
  const toggle = harness.nodes.get('behaviour-tuning-enabled');
  const controls = harness.nodes.get('behaviour-tuning-controls');
  const tuning = harness.nodes.get('behaviour-tuning-prompt');
  const draft = 'You are a careful code reviewer who checks the smallest safe change.';

  toggle.click();
  tuning.input(draft);
  toggle.click();
  assert.equal(controls.hidden, true);
  assert.equal(tuning.value, draft);
  toggle.click();
  assert.equal(controls.hidden, false);
  assert.equal(tuning.value, draft);
});

test('checked empty behaviour tuning is rejected without sending an action', async () => {
  const harness = createHarness();
  await initialize(harness);
  harness.nodes.get('behaviour-tuning-enabled').click();
  harness.nodes.get('behaviour-tuning-prompt').input('');
  harness.nodes.get('approve').click();
  await flush();

  assert.equal(harness.posts.filter((message) => message.method === 'ui/message').length, 0);
  assert.match(harness.nodes.get('result').textContent, /behaviour-tuning prompt|turn behaviour tuning off/i);
  assert.equal(harness.nodes.get('behaviour-tuning-prompt').focused, true);
});

test('each new review resets behaviour tuning to unchecked and hidden', async () => {
  const nextReview = {
    ...review,
    behaviour_tuning_prompt: 'You are a concise researcher who cites the supplied evidence.',
  };
  const harness = createHarness({ initialReview: nextReview });
  await initialize(harness);

  assert.equal(harness.nodes.get('behaviour-tuning-enabled').checked, false);
  assert.equal(harness.nodes.get('behaviour-tuning-controls').hidden, true);
  assert.equal(harness.nodes.get('behaviour-tuning-prompt').value, nextReview.behaviour_tuning_prompt);
});

test('legacy reviews without generated tuning keep the v1 optimized-only workflow', async () => {
  const { behaviour_tuning_prompt: _missingTuning, ...legacyReview } = review;
  const harness = createHarness({ initialReview: legacyReview });
  await initialize(harness);

  assert.equal(harness.nodes.get('behaviour-tuning-option').hidden, true);
  assert.equal(harness.nodes.get('behaviour-tuning-enabled').checked, false);
  assert.equal(harness.nodes.get('behaviour-tuning-controls').hidden, true);

  harness.nodes.get('approve').click();
  await flush(20);
  assert.equal(approvedPrompt(approvalMessage(harness)), legacyReview.optimized_prompt);
});

test('buttons remain disabled until initialization completes and sends initialized notification', async () => {
  const harness = createHarness();

  assert.ok(harness.buttons().every((button) => button.disabled));
  assert.equal(harness.posts.filter((message) => message.method === 'ui/message').length, 0);

  await initialize(harness);

  assert.ok(harness.posts.some((message) => message.method === 'ui/notifications/initialized'));
  assert.ok(harness.buttons().every((button) => !button.disabled));
});

test('approval emits one action message and never resends after a transient thread error', async () => {
  let harness;
  harness = createHarness({
    onPostMessage(message, current) {
      if (message.method !== 'ui/initialize' && message.method !== 'ui/message') return;
      if (message.method === 'ui/initialize') return;
      current.respond(message.id, { error: { message: 'thread not found while resuming' } });
    },
  });
  await initialize(harness);

  harness.nodes.get('approve').click();
  await flush();
  await flush(20);

  const actionMessages = harness.posts.filter((message) => message.method === 'ui/message');
  assert.equal(actionMessages.length, 1);
  assert.match(harness.nodes.get('result').textContent, /No review action was retried automatically/);
});

test('approval snapshots the mounted review version and prompt while the hash is pending', async () => {
  const harness = createHarness();
  await initialize(harness);
  harness.nodes.get('optimized-prompt').value = 'edited prompt from the mounted review';

  harness.nodes.get('approve').click();
  harness.dispatch({
    jsonrpc: '2.0',
    method: 'ui/notifications/tool-result',
    params: {
      structuredContent: {
        review: {
          ...review,
          version: 9,
          optimized_prompt: 'prompt from a different review',
        },
      },
    },
  });
  await flush(20);

  const action = harness.posts.find((message) => message.method === 'ui/message');
  assert.ok(action, 'the mounted review should emit one approval action');
  const body = action.params.content[0].text;
  assert.match(body, /PROMPT_VERSION: 1/);
  assert.match(body, /edited prompt from the mounted review/);
  assert.doesNotMatch(body, /prompt from a different review/);
  assert.equal(harness.nodes.get('optimized-prompt').value, 'edited prompt from the mounted review');
});

test('notifications mount one valid review and cannot replace it', async () => {
  const harness = createHarness({ initialReview: null });
  await initialize(harness);
  assert.ok(harness.buttons().every((button) => button.disabled));

  harness.dispatch({
    jsonrpc: '2.0',
    method: 'ui/notifications/tool-input',
    params: { review: { ...review, version: 0 } },
  });
  await flush();
  assert.ok(harness.buttons().every((button) => button.disabled));

  harness.dispatch({
    jsonrpc: '2.0',
    method: 'ui/notifications/tool-input',
    params: { review },
  });
  await flush();
  assert.ok(harness.buttons().every((button) => !button.disabled));
  assert.equal(harness.nodes.get('optimized-prompt').value, review.optimized_prompt);

  harness.nodes.get('optimized-prompt').value = 'local edit that must survive';
  harness.dispatch({
    jsonrpc: '2.0',
    method: 'ui/notifications/tool-result',
    params: { review: { ...review, version: 2, optimized_prompt: 'replacement' } },
  });
  await flush();
  assert.equal(harness.nodes.get('optimized-prompt').value, 'local edit that must survive');
});

test('teardown acknowledges string and numeric IDs and never re-enables an in-flight action', async () => {
  for (const teardownId of ['teardown-string', 42]) {
    const harness = createHarness();
    await initialize(harness);

    harness.nodes.get('approve').click();
    await flush(20);
    const actionMessage = harness.posts.find((message) => message.method === 'ui/message');
    assert.ok(actionMessage, 'the approval should be in flight before teardown');
    assert.ok(harness.buttons().every((button) => button.disabled));

    harness.dispatch({ jsonrpc: '2.0', id: teardownId, method: 'ui/resource-teardown', params: {} });
    await flush();

    assert.ok(harness.posts.some((message) => message.id === teardownId && message.result && !message.error));
    assert.ok(harness.buttons().every((button) => button.disabled));
    assert.match(harness.nodes.get('result').textContent, /closed by the host/);
  }
});

test('compatibility bridge activates only after standard initialization fails', async () => {
  let initializationAttempts = 0;
  const harness = createHarness({
    legacy: true,
    onPostMessage(message, current) {
      if (message.method !== 'ui/initialize') return;
      initializationAttempts += 1;
      current.respond(message.id, {
        error: { message: initializationAttempts === 1 ? 'thread not found while resuming' : 'standard bridge unavailable' },
      });
    },
  });

  assert.ok(harness.buttons().every((button) => button.disabled));
  await flush(350);
  assert.equal(initializationAttempts, 2);
  assert.ok(harness.buttons().every((button) => !button.disabled));

  harness.nodes.get('approve').click();
  await flush(20);
  assert.equal(harness.posts.filter((message) => message.method === 'ui/message').length, 0);
  assert.equal(harness.legacyMessages.length, 1);
});
