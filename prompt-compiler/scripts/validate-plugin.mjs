import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REQUIRED_REFERENCES = [
  'output-contract.md',
  'target-profiles.md',
  'semantic-preservation.md',
  'approval-workflow.md',
  'action-protocol.md',
  'context-selection.md',
  'automatic-mode-templates.md',
  'mcp-review.md',
  'examples.md',
];

const REQUIRED_DOCUMENTS = [
  'README.md',
  'AGENTS.md',
  'HANDOFF.md',
  'docs/architecture.md',
  'docs/product-decisions.md',
  'docs/phase-2-design.md',
  'docs/milestone-2-audit.md',
  'docs/milestone-2-completion-report.md',
  'docs/milestone-3-completion-report.md',
  'tests/expected-behaviors.md',
  'tests/manual-test-checklist.md',
];

const FORBIDDEN_DIRECTORIES = [
  'src',
  'server',
  'backend',
  'database',
  'api',
  'mcp-server',
  'review-ui',
  'ui',
  'frontend',
  'auth',
  'persistence',
  'profiles',
];

const PLACEHOLDER_PATTERNS = [
  /YOUR_API_KEY/i,
  /TODO_AUTHOR/i,
  /example\.com/i,
  /sk-/,
];

const MODEL_PROVIDER_DEPENDENCY_PATTERNS = [
  /(^|[/@-])openai([/@-]|$)/i,
  /anthropic/i,
  /google-generativeai/i,
  /generative-ai/i,
  /cohere/i,
  /mistral/i,
  /groq/i,
  /replicate/i,
  /huggingface/i,
  /ollama/i,
  /together-ai/i,
  /xai/i,
];

const TEXT_EXTENSIONS = new Set([
  '.cjs', '.css', '.html', '.js', '.json', '.jsx', '.md', '.mjs', '.ts',
  '.tsx', '.txt', '.toml', '.yaml', '.yml',
]);

const CHECK_COUNT = 48;

const MILESTONE_2_FIXTURE_COUNTS = Object.freeze({
  'simple-answer-only': 10,
  'vague-codex': 10,
  'detailed-code-change': 10,
  'file-analysis': 8,
  research: 6,
  'external-action': 6,
  destructive: 5,
  'quoted-prompt-injection': 5,
});

const FIXTURE_REQUIRED_FIELDS = [
  'id', 'input', 'expected_target', 'expected_mode',
  'expected_impact', 'must_preserve', 'must_include_meaning',
  'must_not_invent', 'underlying_task_allowed_during_review',
];

function semver(value) {
  return typeof value === 'string' &&
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(value);
}

async function readJson(filePath) {
  try {
    return JSON.parse(await readFile(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function frontmatter(contents) {
  if (!contents.startsWith('---\n')) return null;
  const end = contents.indexOf('\n---', 4);
  if (end < 0) return null;
  const fields = {};
  for (const line of contents.slice(4, end).split('\n')) {
    const match = line.match(/^([A-Za-z][\w-]*):\s*(.*)$/);
    if (match) fields[match[1]] = match[2].replace(/^['"]|['"]$/g, '').trim();
  }
  return fields;
}

async function collectFiles(root, current = root, files = []) {
  let entries;
  try {
    entries = await readdir(current, { withFileTypes: true });
  } catch {
    return files;
  }
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const fullPath = path.join(current, entry.name);
    if (entry.isDirectory()) await collectFiles(root, fullPath, files);
    else files.push(fullPath);
  }
  return files;
}

async function validateTextSafety(root, errors) {
  const files = await collectFiles(root);
  for (const filePath of files) {
    const relative = path.relative(root, filePath);
    if (relative === 'mcp/dist' || relative.startsWith(`mcp${path.sep}dist${path.sep}`)) continue;
    // HANDOFF.md is a faithful copy of the specification, which necessarily
    // contains the literal forbidden-marker examples listed by the spec.
    if (relative === 'HANDOFF.md') continue;
    // The validator and its tests contain the marker patterns intentionally so
    // they can detect them in isolated fixtures.
    if (relative === path.join('scripts', 'validate-plugin.mjs') ||
        relative === path.join('tests', 'validate-plugin.test.mjs')) continue;
    if (!TEXT_EXTENSIONS.has(path.extname(filePath).toLowerCase())) continue;
    let contents;
    try {
      contents = await readFile(filePath, 'utf8');
    } catch {
      continue;
    }
    if (contents.includes('\0')) continue;
    for (const pattern of PLACEHOLDER_PATTERNS) {
      if (pattern.test(contents)) {
        errors.push(`placeholder marker found in ${relative}`);
        break;
      }
    }
  }
}

async function validateDependencies(root, errors) {
  const files = await collectFiles(root);
  for (const filePath of files) {
    if (!['package.json', 'package-lock.json', 'npm-shrinkwrap.json', 'yarn.lock', 'pnpm-lock.yaml'].includes(path.basename(filePath))) continue;
    let contents;
    try { contents = await readFile(filePath, 'utf8'); } catch { continue; }
    for (const pattern of MODEL_PROVIDER_DEPENDENCY_PATTERNS) {
      if (pattern.test(contents)) {
        errors.push(`model-provider SDK dependency marker found in ${path.relative(root, filePath)}`);
        break;
      }
    }
  }
  const packageJson = await readJson(path.join(root, 'package.json'));
  if (!packageJson || typeof packageJson !== 'object') return;
  for (const section of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']) {
    for (const dependency of Object.keys(packageJson[section] ?? {})) {
      if (MODEL_PROVIDER_DEPENDENCY_PATTERNS.some((pattern) => pattern.test(dependency))) {
        errors.push(`model-provider SDK dependency '${dependency}' is not allowed`);
      }
    }
  }
  const nodeModules = path.join(root, 'node_modules');
  try {
    const installed = await readdir(nodeModules, { withFileTypes: true });
    for (const entry of installed) {
      const packageNames = entry.name.startsWith('@')
        ? (await readdir(path.join(nodeModules, entry.name), { withFileTypes: true })).map((child) => `${entry.name}/${child.name}`)
        : [entry.name];
      for (const packageName of packageNames) {
        if (MODEL_PROVIDER_DEPENDENCY_PATTERNS.some((pattern) => pattern.test(packageName))) {
          errors.push(`installed model-provider SDK '${packageName}' is not allowed`);
        }
      }
    }
  } catch {
    // No node_modules directory is the expected dependency-free state.
  }
}

async function validateFixtures(root, errors) {
  const fixturePath = path.join(root, 'tests', 'fixtures.json');
  const fixtures = await readJson(fixturePath);
  if (!fixtures || !Array.isArray(fixtures.cases)) return;
  if (fixtures.cases.length < 60) errors.push('tests/fixtures.json must contain at least 60 cases for Milestone 2');
  const categoryCounts = new Map();
  for (const item of fixtures.cases) {
    if (!item || typeof item !== 'object') {
      errors.push('tests/fixtures.json contains a non-object case');
      continue;
    }
    for (const field of FIXTURE_REQUIRED_FIELDS) {
      if (!(field in item)) errors.push(`fixture ${item.id ?? '<unknown>'} is missing ${field}`);
    }
    if (typeof item.input !== 'string' || !item.input.length) errors.push(`fixture ${item.id ?? '<unknown>'} must have non-empty input text`);
    if (!Array.isArray(item.must_preserve) || !Array.isArray(item.must_include_meaning) || !Array.isArray(item.must_not_invent)) {
      errors.push(`fixture ${item.id ?? '<unknown>'} must use arrays for semantic criteria`);
    }
    if (item.underlying_task_allowed_during_review !== false) errors.push(`fixture ${item.id ?? '<unknown>'} must disallow underlying task during review`);
    categoryCounts.set(item.category, (categoryCounts.get(item.category) ?? 0) + 1);
  }
  for (const [category, expected] of Object.entries(MILESTONE_2_FIXTURE_COUNTS)) {
    const actual = categoryCounts.get(category) ?? 0;
    if (actual !== expected) errors.push(`tests/fixtures.json category ${category} must contain exactly ${expected} cases (found ${actual})`);
  }

  const negativePath = path.join(root, 'tests', 'negative-triggers.json');
  const negative = await readJson(negativePath);
  if (!negative || !Array.isArray(negative.cases)) {
    errors.push('Missing or invalid tests/negative-triggers.json');
  } else {
    if (negative.cases.length < 30) errors.push('tests/negative-triggers.json must contain at least 30 cases');
    for (const item of negative.cases) {
      if (!item?.id || typeof item.input !== 'string' || item.expected_implicit_activation !== false) {
        errors.push(`negative trigger ${item?.id ?? '<unknown>'} must have input and expected_implicit_activation=false`);
      }
    }
  }
}

async function validatePackage(root, errors) {
  const packageJson = await readJson(path.join(root, 'package.json'));
  if (!packageJson) {
    errors.push('Missing or invalid package.json');
    return;
  }
  if (packageJson.type !== 'module') errors.push('package.json type must be module');
  if (packageJson.version !== '0.3.0') errors.push('package.json version must equal 0.3.0 for Milestone 3');
  if (packageJson.scripts?.test !== 'node --test') errors.push('package.json must use Node built-in test runner');
  if (packageJson.scripts?.validate !== 'node scripts/validate-plugin.mjs') errors.push('package.json validate script is incorrect');
  for (const section of ['dependencies', 'devDependencies', 'optionalDependencies']) {
    if (packageJson[section] && Object.keys(packageJson[section]).length) errors.push(`root package.json ${section} must remain empty; MCP dependencies belong under mcp/`);
  }
}

async function validateMcp(root, errors) {
  const manifest = await readJson(path.join(root, '.codex-plugin', 'plugin.json'));
  if (manifest?.mcpServers !== './.mcp.json') errors.push('Manifest mcpServers must equal ./.mcp.json for Milestone 3');
  const mcpConfig = await readJson(path.join(root, '.mcp.json'));
  const server = mcpConfig?.mcpServers?.['prompt-compiler'];
  if (!server || server.command !== 'node' || server.cwd !== '.' || JSON.stringify(server.args) !== JSON.stringify(['./mcp/dist/stdio.js'])) {
    errors.push('.mcp.json must define the bundled local prompt-compiler stdio server');
  }
  const mcpRoot = path.join(root, 'mcp');
  const mcpPackage = await readJson(path.join(mcpRoot, 'package.json'));
  if (!mcpPackage || mcpPackage.version !== '0.3.0' || mcpPackage.type !== 'module') errors.push('mcp/package.json must be an ES module at version 0.3.0');
  for (const dependency of ['@modelcontextprotocol/sdk', 'zod']) {
    if (!mcpPackage?.dependencies?.[dependency]) errors.push(`mcp/package.json is missing dependency ${dependency}`);
  }
  for (const dependency of ['esbuild', 'typescript']) {
    if (!mcpPackage?.devDependencies?.[dependency]) errors.push(`mcp/package.json is missing build dependency ${dependency}`);
  }
  for (const script of ['build', 'typecheck', 'test']) {
    if (!mcpPackage?.scripts?.[script]) errors.push(`mcp/package.json is missing ${script} script`);
  }
  for (const relative of [
    'package-lock.json', 'tsconfig.json', 'src/create-server.ts', 'src/schema.ts',
    'src/errors.ts', 'src/review-fallback.ts', 'src/stdio.ts',
    'src/tools/render-prompt-review.ts', 'public/prompt-review.html',
    'dist/stdio.js', 'dist/create-server.js', 'dist/review-fallback.js', 'dist/prompt-review.html',
  ]) {
    try { await stat(path.join(mcpRoot, relative)); }
    catch { errors.push(`Missing MCP artifact mcp/${relative}`); }
  }
  const mcpSources = await Promise.all([
    readFile(path.join(mcpRoot, 'src/create-server.ts'), 'utf8').catch(() => ''),
    readFile(path.join(mcpRoot, 'src/schema.ts'), 'utf8').catch(() => ''),
    readFile(path.join(mcpRoot, 'src/tools/render-prompt-review.ts'), 'utf8').catch(() => ''),
    readFile(path.join(mcpRoot, 'public/prompt-review.html'), 'utf8').catch(() => ''),
  ]);
  const source = mcpSources.join('\n');
  for (const marker of ['McpServer', 'registerTool', 'registerResource', 'render_prompt_review', 'ui://prompt-compiler/prompt-review-v1.html', 'text/html;profile=mcp-app', 'readOnlyHint', 'destructiveHint', 'openWorldHint', 'textContent', 'ui/message']) {
    if (!source.includes(marker)) errors.push(`MCP implementation is missing ${marker}`);
  }
  if (/\b(fetch|XMLHttpRequest|WebSocket)\s*\(/.test(source)) errors.push('MCP implementation must not make network calls');
  if (/console\.(log|info|debug)\s*\(/.test(source)) errors.push('MCP implementation must not log raw payloads');
}

/**
 * Validate a Prompt Compiler repository without changing it.
 * @param {string} repositoryRoot absolute or relative plugin root
 * @returns {Promise<string[]>} human-readable validation errors
 */
export async function validateRepository(repositoryRoot) {
  const root = path.resolve(repositoryRoot);
  const errors = [];
  const manifestPath = path.join(root, '.codex-plugin', 'plugin.json');
  const manifest = await readJson(manifestPath);

  if (!manifest) {
    errors.push('Missing or invalid .codex-plugin/plugin.json');
  } else {
    if (manifest.name !== 'prompt-compiler') errors.push('Manifest name must equal prompt-compiler');
    if (!semver(manifest.version)) errors.push('Manifest version must be valid semantic version');
    if (!/^0\.3\.0(?:\+[0-9A-Za-z.-]+)?$/.test(manifest.version)) errors.push('Manifest version must have 0.3.0 base with optional SemVer build metadata');
    if (manifest.skills !== './skills/') errors.push('Manifest skills path must equal ./skills/');
    if (!manifest.description || typeof manifest.description !== 'string') errors.push('Manifest description must be non-empty');
    if (!manifest.author || manifest.author.name !== 'Codex') errors.push('Manifest author.name must equal Codex');
    if (!manifest.interface || manifest.interface.developerName !== 'Codex') errors.push('Manifest interface.developerName must equal Codex');
    for (const forbiddenField of ['apps', 'hooks', 'homepage', 'repository']) {
      if (forbiddenField in manifest) errors.push(`Manifest must not contain ${forbiddenField}`);
    }
    for (const forbiddenField of ['websiteURL', 'privacyPolicyURL', 'termsOfServiceURL', 'logo', 'logoDark', 'screenshots']) {
      if (manifest.interface && forbiddenField in manifest.interface) errors.push(`Manifest interface must not contain ${forbiddenField}`);
    }
  }

  const skillRoot = path.join(root, 'skills', 'prompt-compiler');
  const skillPath = path.join(skillRoot, 'SKILL.md');
  let skillContents = null;
  try { skillContents = await readFile(skillPath, 'utf8'); } catch { errors.push('Missing skills/prompt-compiler/SKILL.md'); }
  if (skillContents !== null) {
    const fields = frontmatter(skillContents);
    if (!fields) errors.push('SKILL.md must begin with valid YAML frontmatter');
    else {
      if (fields.name !== 'prompt-compiler') errors.push('Skill frontmatter name must equal prompt-compiler');
      if (!fields.description) errors.push('Skill frontmatter description must be non-empty');
    }
  }

  for (const reference of REQUIRED_REFERENCES) {
    try { await stat(path.join(skillRoot, 'references', reference)); }
    catch { errors.push(`Missing skills/prompt-compiler/references/${reference}`); }
  }
  try {
    const skillEntries = (await readdir(path.join(root, 'skills'), { withFileTypes: true }))
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'));
    if (skillEntries.length !== 1 || skillEntries[0]?.name !== 'prompt-compiler') {
      errors.push('Repository must contain exactly one prompt-compiler skill');
    }
  } catch {
    errors.push('Missing skills directory');
  }
  try { await stat(path.join(skillRoot, 'agents', 'openai.yaml')); }
  catch { errors.push('Missing skills/prompt-compiler/agents/openai.yaml'); }
  try { await stat(path.join(root, 'tests', 'fixtures.json')); }
  catch { errors.push('Missing tests/fixtures.json'); }
  for (const document of REQUIRED_DOCUMENTS) {
    try { await stat(path.join(root, document)); }
    catch { errors.push(`Missing ${document}`); }
  }

  for (const forbidden of FORBIDDEN_DIRECTORIES) {
    try { await stat(path.join(root, forbidden)); errors.push(`Forbidden directory exists: ${forbidden}`); }
    catch { /* absent is expected */ }
  }

  const openaiYaml = await readFile(path.join(skillRoot, 'agents', 'openai.yaml'), 'utf8').catch(() => '');
  if (!openaiYaml.includes('allow_implicit_invocation: true')) errors.push('CLI discovery must be enabled for Prompt Compiler');
  if (!openaiYaml.includes('$prompt-compiler')) errors.push('agents/openai.yaml default_prompt must mention $prompt-compiler');

  const skillReferences = await readFile(skillPath, 'utf8').catch(() => '');
  for (const reference of ['action-protocol.md', 'context-selection.md', 'automatic-mode-templates.md']) {
    if (!skillReferences.includes(`references/${reference}`)) errors.push(`SKILL.md must reference ${reference}`);
  }
  const protocol = await readFile(path.join(skillRoot, 'references', 'action-protocol.md'), 'utf8').catch(() => '');
  for (const action of ['APPROVE_AND_RUN', 'REQUEST_REVISION', 'USE_ORIGINAL', 'CANCEL']) {
    if (!protocol.includes(`PROMPT_COMPILER_ACTION: ${action}`)) errors.push(`action protocol is missing ${action}`);
  }
  for (const marker of ['REVIEW_ID:', 'PROMPT_VERSION:', 'APPROVED_PROMPT_SHA256:', 'APPROVED_PROMPT_BEGIN', 'APPROVED_PROMPT_END']) {
    if (!protocol.includes(marker)) errors.push(`action protocol is missing ${marker}`);
  }
  if (!protocol.includes('UNAVAILABLE') || !protocol.includes('whitespace') || !protocol.includes('cancelled')) {
    errors.push('action protocol must document hashes, exact body preservation, and cancellation');
  }
  const contextPolicy = await readFile(path.join(skillRoot, 'references', 'context-selection.md'), 'utf8').catch(() => '');
  for (const label of ['Current request', 'Earlier user message', 'ChatGPT Project Instructions', 'Codex AGENTS.md', 'Prompt Compiler profile', 'Plugin default']) {
    if (!contextPolicy.includes(label)) errors.push(`context-selection.md is missing provenance label ${label}`);
  }
  const templates = await readFile(path.join(skillRoot, 'references', 'automatic-mode-templates.md'), 'utf8').catch(() => '');
  for (const marker of ['prompt-compiler:start', 'prompt-compiler:end', 'For each new task in this project', 'skip prompt review for this request']) {
    if (!templates.includes(marker)) errors.push(`automatic-mode-templates.md is missing ${marker}`);
  }
  if (!templates.includes('never') || !templates.includes('automatically write')) errors.push('automatic-mode templates must state they are returned for user use and never auto-written');
  if (!skillReferences.includes('skip prompt review for this request') || !skillReferences.includes('nonpersistent')) errors.push('SKILL.md must document the nonpersistent one-request bypass');
  const outputContract = await readFile(path.join(skillRoot, 'references', 'output-contract.md'), 'utf8').catch(() => '');
  if (!outputContract.includes('Review ID: <opaque-id>') || !outputContract.includes('## Action protocol options') || !outputContract.includes('Source: <one exact provenance label>')) {
    errors.push('output-contract.md must expose review ID, provenance format, and action protocol options');
  }

  await validateFixtures(root, errors);
  await validatePackage(root, errors);
  await validateMcp(root, errors);
  await validateTextSafety(root, errors);
  await validateDependencies(root, errors);
  return [...new Set(errors)];
}

async function main() {
  const root = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const errors = await validateRepository(root);
  if (errors.length) {
    console.error('Prompt Compiler validation failed.\n');
    for (const error of errors) console.error(`- ${error}`);
    process.exitCode = 1;
    return;
  }
  console.log('Prompt Compiler validation passed.');
  console.log(`Checked ${CHECK_COUNT} requirements.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
