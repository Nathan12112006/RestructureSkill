import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

async function normalized(relativePath) {
  const contents = await readFile(path.join(repositoryRoot, relativePath), 'utf8');
  return contents.replace(/\s+/g, ' ');
}

test('behaviour tuning separates MCP generation from text-only opt-in', async () => {
  const skill = await normalized('skills/restructure/SKILL.md');
  const contract = await normalized('skills/restructure/references/output-contract.md');
  const mcpReview = await normalized('skills/restructure/references/mcp-review.md');

  assert.match(skill, /For an MCP review, the host model generates .* alongside every optimized prompt/i);
  assert.match(skill, /separate review value/i);
  assert.match(skill, /starts with behaviour tuning unchecked/i);
  assert.match(skill, /When MCP or its UI is unavailable, the host generates .* only after .* explicitly requests/i);
  assert.match(skill, /Silence means do not generate, show, or append/i);
  assert.match(skill, /never persisted or inferred for later reviews/i);
  assert.match(skill, /must not invent facts or credentials, broaden scope or permissions/i);
  assert.match(contract, /separate `behaviour_tuning_prompt` review value/i);
  assert.match(contract, /exact approved body/i);
  assert.match(mcpReview, /MCP server only validates and presents .* makes no model calls/i);
});
