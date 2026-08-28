import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const mcpRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = await readFile(path.join(mcpRoot, 'public/prompt-review.html'), 'utf8');
const source = await readFile(path.join(mcpRoot, 'src/create-server.ts'), 'utf8') + await readFile(path.join(mcpRoot, 'src/tools/render-prompt-review.ts'), 'utf8');

test('review UI contains a syntactically valid embedded script', () => {
  const script = html.match(/<script>([\s\S]*?)<\/script>/);
  assert.ok(script, 'expected one embedded script');
  assert.doesNotThrow(() => new Function(script[1]));
});

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
  for (const id of ['optimized-prompt', 'behaviour-tuning-option', 'behaviour-tuning-enabled', 'behaviour-tuning-controls', 'behaviour-tuning-prompt', 'revision-request', 'approve', 'revision', 'original', 'cancel', 'result']) assert.match(html, new RegExp(`id="${id}"`));
  assert.match(html, /label for="optimized-prompt"/);
  assert.match(html, /label for="behaviour-tuning-enabled"/);
  assert.match(html, /label for="behaviour-tuning-prompt"/);
  assert.match(html, /type="checkbox" id="behaviour-tuning-enabled"/);
  assert.match(html, /id="behaviour-tuning-option"[^>]* hidden/);
  assert.match(html, /id="behaviour-tuning-controls"[^>]* hidden/);
  assert.match(html, /aria-describedby="behaviour-tuning-help"/);
  assert.match(html, /focus-visible/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /let submitted = false/);
  assert.match(html, /Status: Awaiting explicit approval in a new user message\./);
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

test('UI completes the MCP Apps handshake before sending actions and handles teardown', () => {
  assert.match(html, /protocolVersion:\s*'2026-01-26'/);
  assert.match(html, /appInfo:\s*\{\s*name:\s*'restructure-review',\s*version:\s*'1\.0\.0'\s*\}/s);
  assert.match(html, /appCapabilities:\s*\{[\s\S]*availableDisplayModes:\s*\[\s*'inline'\s*\]/);
  assert.match(html, /ui\/notifications\/initialized/);
  assert.match(html, /bridgeReady/);
  assert.match(html, /if \(!bridgeReady\)/);
  assert.match(html, /const initializeBridge = async \(\) =>/);
  assert.match(html, /let legacyFallbackReady = false/);
  assert.match(html, /legacyFallbackReady = !isParentBridge\(\) && hasLegacyMessageBridge\(\)/);
  assert.match(html, /else if \(legacyFallbackReady && hasLegacyMessageBridge\(\)\)/);
  assert.match(html, /if \(initialized && !submitted && !appTornDown\) \{\s*setButtons\(!review\)/s);
  assert.match(html, /data\.result[\s\S]*isError/);
  assert.match(html, /ui\/resource-teardown/);
  assert.match(html, /typeof data\.id === 'number' \|\| typeof data\.id === 'string'/);
  assert.match(html, /rejectPendingRequests/);
  assert.match(html, /removeEventListener\('message'/);
});

test('UI retries only initialization and never automatically resends an action', () => {
  for (const message of ['thread not found', 'needs_resume', 'no rollout found', 'not loaded']) {
    assert.match(html, new RegExp(message.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')));
  }
  assert.match(html, /MAX_THREAD_RESUME_RETRIES\s*=\s*1/);
  assert.match(html, /may have been received/);
  assert.match(html, /not retried/);
  assert.match(html, /No review action was retried automatically/);
  assert.doesNotMatch(html, /retrying this action once/);
  assert.match(html, /if \(appTornDown\) return;\s*submitted = false;/s);
});

test('optimized prompt keeps the structured read view and hides its editor until edit is expanded', () => {
  assert.match(html, /<h2>Optimized prompt<\/h2>/);
  assert.match(html, /id="optimized-prompt-preview"/);
  assert.match(html, /<details class="editor-details">\s*<summary>Edit exact prompt<\/summary>[\s\S]*?<textarea id="optimized-prompt"/);
  assert.doesNotMatch(html, /id="composed-prompt"/);
  assert.match(html, /const renderPromptPreview = \(value\) =>/);
  assert.match(html, /document\.createElement\('h3'\)/);
  assert.match(html, /document\.createElement\(listType\)/);
  assert.match(html, /document\.createElement\('li'\)/);
  assert.match(html, /item\.textContent =/);
  assert.match(html, /renderPromptPreview\(textarea\.value\)/);
  assert.match(html, /const composePrompt = \(\) =>/);
  assert.match(html, /textarea\.addEventListener\('input', \(\) => renderPromptPreview\(textarea\.value\)\)/);
  assert.match(html, /const edited = textarea\.value/);
  assert.match(html, /class="prompt-editor"/);
  assert.match(html, /\.prompt-editor\s*\{[^}]*white-space:\s*pre-wrap/s);
  assert.match(html, /\.prompt-editor\s*\{[^}]*overflow-wrap:\s*anywhere/s);
});
