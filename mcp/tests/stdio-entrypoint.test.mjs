import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const mcpRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('bundled stdio entrypoint initializes and exposes the review tool and resource', async () => {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [path.join(mcpRoot, 'dist', 'stdio.js')],
    cwd: mcpRoot,
    stderr: 'pipe',
  });
  const stderr = [];
  transport.stderr?.on('data', (chunk) => stderr.push(String(chunk)));
  const client = new Client({ name: 'restructure-stdio-smoke', version: '1.0.0' });

  try {
    await client.connect(transport);
    const tools = await client.listTools();
    const renderTool = tools.tools.find(({ name }) => name === 'render_prompt_review');
    assert.ok(renderTool, 'stdio tools/list must expose render_prompt_review');
    const resourceUri = renderTool._meta?.ui?.resourceUri;
    assert.equal(resourceUri, 'ui://restructure/prompt-review-v1.html');

    const resource = await client.readResource({ uri: resourceUri });
    assert.equal(resource.contents.length, 1);
    assert.equal(resource.contents[0].mimeType, 'text/html;profile=mcp-app');
  } finally {
    await client.close();
  }

  assert.equal(stderr.join(''), '');
});
