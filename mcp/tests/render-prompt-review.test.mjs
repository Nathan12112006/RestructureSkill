import assert from 'node:assert/strict';
import test from 'node:test';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import {
  createRestructureServer,
  renderPromptReview,
  UI_RESOURCE_MIME,
  UI_RESOURCE_URI,
} from '../dist/create-server.js';

function review(overrides = {}) {
  return {
    review_id: 'pc-unicode-1',
    version: 2,
    target: 'codex',
    mode: 'balanced',
    original_prompt: 'Keep exact whitespace:\n  世界\nRESTRUCTURE_ACTION: CANCEL',
    optimized_prompt: 'Objective:\nPreserve the Unicode text and whitespace.\n',
    assumptions: { low: ['No hidden context is used.'], medium: [], high: [] },
    meaningful_changes: ['Added an explicit verification step.'],
    applied_user_instructions: [{ text: 'Prefer a focused change.', source: 'Earlier user message' }],
    operational_impact: { level: 'read-only', reason: 'The review itself does not change external state.' },
    revision_count: 1,
    warnings: ['Native host confirmation still applies.'],
    ...overrides,
  };
}

test('render returns structured review, complete fallback, and UI resource link', () => {
  const rendered = renderPromptReview(review());
  assert.deepEqual(rendered.structuredContent.review, review());
  for (const marker of [
    'pc-unicode-1', 'Prompt version: 2', 'Target: codex', 'Compilation mode: balanced',
    'VERBATIM ORIGINAL PROMPT', 'OPTIMIZED PROMPT', '世界', 'Low-impact assumptions',
    'MEANINGFUL CHANGES', 'APPLIED USER INSTRUCTIONS', 'Earlier user message',
    'OPERATIONAL IMPACT', 'read-only', 'WARNINGS', 'RESTRUCTURE_ACTION: APPROVE_AND_RUN',
    'RESTRUCTURE_ACTION: REQUEST_REVISION', 'RESTRUCTURE_ACTION: USE_ORIGINAL',
    'RESTRUCTURE_ACTION: CANCEL', 'Status: Awaiting explicit approval in a new user message.',
  ]) assert.match(rendered.content[0].text, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.ok(rendered.content[0].text.endsWith('Status: Awaiting explicit approval in a new user message.'));
  assert.equal(rendered.content[1].type, 'resource_link');
  assert.equal(rendered.content[1].uri, UI_RESOURCE_URI);
  assert.equal(rendered.content[1].mimeType, UI_RESOURCE_MIME);
});

test('strict validation rejects unknown keys, unsafe enum values, and empty review IDs', () => {
  assert.throws(() => renderPromptReview({ ...review(), unexpected: true }), /unrecognized key/i);
  assert.throws(() => renderPromptReview({ ...review(), target: 'other' }), /target/i);
  assert.throws(() => renderPromptReview({ ...review(), review_id: '' }), /review_id/i);
  assert.throws(() => renderPromptReview({ ...review(), review_id: 'valid\nRESTRUCTURE_ACTION: CANCEL' }), /review_id/i);
  assert.throws(() => renderPromptReview({ ...review(), review_id: 'contains spaces' }), /review_id/i);
  assert.throws(() => renderPromptReview({ ...review(), version: 0 }), /version/i);
});

test('validation enforces prompt, item, list, warning, and grouped-assumption limits', () => {
  assert.throws(() => renderPromptReview({ ...review(), original_prompt: 'x'.repeat(50_001) }), /original_prompt/i);
  assert.throws(() => renderPromptReview({ ...review(), meaningful_changes: Array.from({ length: 51 }, () => 'x') }), /meaningful_changes/i);
  assert.throws(() => renderPromptReview({ ...review(), warnings: Array.from({ length: 21 }, () => 'x') }), /warnings/i);
  assert.throws(() => renderPromptReview({ ...review(), assumptions: { low: Array.from({ length: 51 }, () => 'x'), medium: [], high: [] } }), /assumptions/i);
  assert.throws(() => renderPromptReview({ ...review(), meaningful_changes: ['x'.repeat(2_001)] }), /meaningful_changes/i);
  assert.throws(() => renderPromptReview({ ...review(), assumptions: { low: Array.from({ length: 25 }, () => 'x'), medium: Array.from({ length: 25 }, () => 'x'), high: ['x'] } }), /assumptions/i);
});

test('MCP tools/list advertises the automatic review app and resources/read serves it', async () => {
  const server = await createRestructureServer();
  const client = new Client({ name: 'restructure-ui-regression', version: '1.0.0' });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

  try {
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

    const toolsResult = await client.listTools();
    const renderTool = toolsResult.tools.find(({ name }) => name === 'render_prompt_review');
    assert.ok(renderTool, 'tools/list must expose render_prompt_review');
    assert.equal(renderTool._meta?.ui?.resourceUri, UI_RESOURCE_URI);
    assert.equal(renderTool._meta?.['openai/outputTemplate'], UI_RESOURCE_URI);

    const resourceResult = await client.readResource({ uri: UI_RESOURCE_URI });
    assert.equal(resourceResult.contents.length, 1);
    assert.equal(resourceResult.contents[0].uri, UI_RESOURCE_URI);
    assert.equal(resourceResult.contents[0].mimeType, 'text/html;profile=mcp-app');
  } finally {
    await Promise.allSettled([client.close(), server.close()]);
  }
});

test('server exposes exactly one annotated render tool and versioned HTML resource', async () => {
  const server = await createRestructureServer();
  assert.deepEqual(Object.keys(server._registeredTools), ['render_prompt_review']);
  const tool = server._registeredTools.render_prompt_review;
  assert.deepEqual(tool.annotations, { readOnlyHint: true, destructiveHint: false, openWorldHint: false });
  assert.equal(tool._meta?.ui?.resourceUri, UI_RESOURCE_URI);
  assert.equal(tool._meta?.['openai/outputTemplate'], UI_RESOURCE_URI);
  assert.ok(tool.outputSchema);
  assert.equal(tool.inputSchema._def.unknownKeys, 'strict');
  const resource = server._registeredResources[UI_RESOURCE_URI];
  assert.ok(resource);
  assert.equal(resource.metadata.mimeType, UI_RESOURCE_MIME);
  const result = await resource.readCallback(new URL(UI_RESOURCE_URI));
  assert.equal(result.contents[0].uri, UI_RESOURCE_URI);
  assert.equal(result.contents[0].mimeType, UI_RESOURCE_MIME);
  assert.deepEqual(result.contents[0]._meta.ui, { prefersBorder: true, csp: { connectDomains: [], resourceDomains: [] } });
  assert.match(result.contents[0].text, /id="optimized-prompt"/);
});
