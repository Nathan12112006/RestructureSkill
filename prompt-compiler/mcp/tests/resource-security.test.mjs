import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const mcpRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = await readFile(path.join(mcpRoot, 'public/prompt-review.html'), 'utf8');
const source = await readFile(path.join(mcpRoot, 'src/create-server.ts'), 'utf8') + await readFile(path.join(mcpRoot, 'src/tools/render-prompt-review.ts'), 'utf8');

test('review UI uses textContent/value and does not inject markup or use external resources', () => {
  assert.doesNotMatch(html, /innerHTML|outerHTML|insertAdjacentHTML|document\.write/);
  assert.match(html, /textContent/);
  assert.match(html, /textarea\.value/);
  assert.match(html, /Content-Security-Policy/);
  assert.match(html, /default-src 'none'/);
  assert.doesNotMatch(html, /fetch\s*\(|XMLHttpRequest|WebSocket|localStorage|sessionStorage/);
  assert.doesNotMatch(source, /console\.(log|info|debug)\s*\(|fetch\s*\(|XMLHttpRequest|WebSocket/);
});

test('UI has visible keyboard-usable controls, labels, focus handling, and duplicate guard', () => {
  for (const id of ['optimized-prompt', 'revision-request', 'approve', 'revision', 'original', 'cancel', 'result']) assert.match(html, new RegExp(`id="${id}"`));
  assert.match(html, /label for="optimized-prompt"/);
  assert.match(html, /focus-visible/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /let submitted = false/);
  assert.match(html, /if \(submitted \|\| !review\) return/);
  assert.match(html, /window\.parent\.postMessage/);
  assert.match(html, /event\.source === window\.parent/);
  assert.match(html, /ui\/initialize/);
  assert.match(html, /ui\/notifications\/tool-input/);
  assert.match(html, /ui\/notifications\/tool-result/);
  assert.match(html, /ui\/message/);
  assert.match(html, /let nextRequestId = 1/);
  assert.match(html, /const pendingRequests = new Map\(\)/);
  assert.match(html, /pendingRequests\.has\(data\.id\)/);
  assert.match(html, /review_id/);
  assert.match(html, /assumptionsNode\.replaceChildren\(\)/);
  assert.match(html, /result\.textContent = '';\s*result\.className = '';/);
  assert.match(html, /role: 'user'/);
  assert.match(html, /sendFollowUpMessage/);
  assert.match(html, /sendFollowUpMessage\(\{ prompt: message \}\)/);
  assert.match(source, /resourceDomains: \[\]/);
  assert.match(html, /revisionField\.focus\(\)/);
  assert.match(html, /revisionRequest\.length > MAX_PROMPT_CHARS/);
  assert.match(html, /revisionRequest \+ '\\nREVISION_REQUEST_END'/);
});

test('optimized prompt editor preserves readable list whitespace without rewriting text', () => {
  assert.match(html, /class="prompt-editor"/);
  assert.match(html, /\.prompt-editor\s*\{[^}]*white-space:\s*pre-wrap/s);
  assert.match(html, /\.prompt-editor\s*\{[^}]*overflow-wrap:\s*anywhere/s);
});
