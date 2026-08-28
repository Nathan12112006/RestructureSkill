import assert from 'node:assert/strict';
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
  review_id: 'runtime-test',
  target: 'chatgpt',
  mode: 'strict',
  version: 1,
  revision_count: 0,
  original_prompt: 'original prompt',
  optimized_prompt: 'optimized prompt',
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
    const listener = this.listeners.get('click');
    if (listener) listener({ currentTarget: this });
  }
}

function createHarness({ onPostMessage, legacy = false, initialReview = review } = {}) {
  const ids = [
    'result', 'optimized-prompt', 'optimized-prompt-preview', 'revision-request',
    'target', 'mode', 'version', 'review-id', 'revision-count', 'original-prompt',
    'assumptions', 'meaningful-changes', 'applied-instructions', 'operational-impact',
    'warnings', 'approve', 'revision', 'original', 'cancel',
  ];
  const nodes = new Map(ids.map((id) => [id, new FakeNode(id === 'optimized-prompt' || id === 'revision-request' ? 'textarea' : 'div', id)]));
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

test('approval snapshots its review identity while the hash is pending', async () => {
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
          review_id: 'different-review',
          version: 9,
          optimized_prompt: 'prompt from a different review',
        },
      },
    },
  });
  await flush();

  const action = harness.posts.find((message) => message.method === 'ui/message');
  assert.ok(action, 'the mounted review should emit one approval action');
  const body = action.params.content[0].text;
  assert.match(body, /REVIEW_ID: runtime-test/);
  assert.match(body, /PROMPT_VERSION: 1/);
  assert.match(body, /edited prompt from the mounted review/);
  assert.doesNotMatch(body, /different-review|prompt from a different review/);
  assert.equal(harness.nodes.get('optimized-prompt').value, 'edited prompt from the mounted review');
});

test('notifications mount one valid review and cannot replace it', async () => {
  const harness = createHarness({ initialReview: null });
  await initialize(harness);
  assert.ok(harness.buttons().every((button) => button.disabled));

  harness.dispatch({
    jsonrpc: '2.0',
    method: 'ui/notifications/tool-input',
    params: { review: { ...review, review_id: 'invalid review id' } },
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
    params: { review: { ...review, review_id: 'replacement-review', optimized_prompt: 'replacement' } },
  });
  await flush();
  assert.equal(harness.nodes.get('optimized-prompt').value, 'local edit that must survive');
});

test('teardown acknowledges string and numeric IDs and never re-enables an in-flight action', async () => {
  for (const teardownId of ['teardown-string', 42]) {
    const harness = createHarness();
    await initialize(harness);

    harness.nodes.get('approve').click();
    await flush();
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
  await flush();
  assert.equal(harness.posts.filter((message) => message.method === 'ui/message').length, 0);
  assert.equal(harness.legacyMessages.length, 1);
});
