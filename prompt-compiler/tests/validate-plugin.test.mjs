import { cp, mkdtemp, readFile, rm, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { validateRepository } from '../scripts/validate-plugin.mjs';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function withFixture(mutator) {
  const temporaryRoot = await mkdtemp(path.join(tmpdir(), 'prompt-compiler-'));
  await cp(repositoryRoot, temporaryRoot, {
    recursive: true,
    filter: (source) => {
      const segments = path.normalize(source).split(path.sep);
      return !segments.includes('.git') && !segments.includes('node_modules');
    },
  });
  try {
    if (mutator) await mutator(temporaryRoot);
    return await validateRepository(temporaryRoot);
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
}

async function remove(filePath) { await rm(filePath, { recursive: true, force: true }); }

test('valid repository passes', async () => {
  assert.deepEqual(await withFixture(), []);
});

test('missing manifest fails', async () => {
  const errors = await withFixture((root) => remove(path.join(root, '.codex-plugin', 'plugin.json')));
  assert.match(errors.join('\n'), /plugin\.json/i);
});

test('invalid JSON fails', async () => {
  const errors = await withFixture((root) => writeFile(path.join(root, '.codex-plugin', 'plugin.json'), '{', 'utf8'));
  assert.match(errors.join('\n'), /plugin\.json/i);
});

test('wrong manifest name fails', async () => {
  const errors = await withFixture(async (root) => {
    const file = path.join(root, '.codex-plugin', 'plugin.json');
    const manifest = JSON.parse(await readFile(file, 'utf8'));
    manifest.name = 'wrong-name';
    await writeFile(file, JSON.stringify(manifest), 'utf8');
  });
  assert.match(errors.join('\n'), /name must equal prompt-compiler/);
});

test('missing SKILL.md fails', async () => {
  const errors = await withFixture((root) => remove(path.join(root, 'skills', 'prompt-compiler', 'SKILL.md')));
  assert.match(errors.join('\n'), /SKILL\.md/i);
});

test('missing skill description fails', async () => {
  const errors = await withFixture(async (root) => {
    const file = path.join(root, 'skills', 'prompt-compiler', 'SKILL.md');
    const skill = await readFile(file, 'utf8');
    await writeFile(file, skill.replace(/^description:.*$/m, 'description:'), 'utf8');
  });
  assert.match(errors.join('\n'), /description must be non-empty/);
});

test('incorrect skill name fails', async () => {
  const errors = await withFixture(async (root) => {
    const file = path.join(root, 'skills', 'prompt-compiler', 'SKILL.md');
    const skill = await readFile(file, 'utf8');
    await writeFile(file, skill.replace(/^name: prompt-compiler$/m, 'name: other-skill'), 'utf8');
  });
  assert.match(errors.join('\n'), /Skill frontmatter name/);
});

test('missing reference file fails', async () => {
  const errors = await withFixture((root) => remove(path.join(root, 'skills', 'prompt-compiler', 'references', 'examples.md')));
  assert.match(errors.join('\n'), /references\/examples\.md/);
});

test('forbidden server directory fails', async () => {
  const errors = await withFixture((root) => mkdir(path.join(root, 'server')));
  assert.match(errors.join('\n'), /Forbidden.*server/);
});

test('API-key placeholder fails', async () => {
  const errors = await withFixture((root) => writeFile(path.join(root, 'README.md'), 'YOUR_API_KEY', 'utf8'));
  assert.match(errors.join('\n'), /placeholder marker/);
});

test('OpenAI SDK dependency fails', async () => {
  const errors = await withFixture(async (root) => {
    const file = path.join(root, 'package.json');
    const packageJson = JSON.parse(await readFile(file, 'utf8'));
    packageJson.devDependencies = { openai: '^1.0.0' };
    await writeFile(file, JSON.stringify(packageJson), 'utf8');
  });
  assert.match(errors.join('\n'), /model-provider SDK dependency/);
});

test('implicit invocation and missing explicit trigger fail', async () => {
  const errors = await withFixture(async (root) => {
    const file = path.join(root, 'skills', 'prompt-compiler', 'agents', 'openai.yaml');
    const yaml = await readFile(file, 'utf8');
    await writeFile(file, yaml.replace('$prompt-compiler', 'Prompt Compiler').replace('false', 'true'), 'utf8');
  });
  assert.match(errors.join('\n'), /Implicit invocation|default_prompt/);
});

test('faithful HANDOFF marker examples do not trigger false positives', async () => {
  assert.deepEqual(await withFixture(), []);
});

test('Milestone 3 package version is enforced', async () => {
  const errors = await withFixture(async (root) => {
    const file = path.join(root, 'package.json');
    const packageJson = JSON.parse(await readFile(file, 'utf8'));
    packageJson.version = '0.1.0';
    await writeFile(file, JSON.stringify(packageJson), 'utf8');
  });
  assert.match(errors.join('\n'), /package\.json version.*0\.3\.0/);
});

test('plugin manifest accepts the Codex cachebuster build metadata', async () => {
  const errors = await withFixture(async (root) => {
    const file = path.join(root, '.codex-plugin', 'plugin.json');
    const manifest = JSON.parse(await readFile(file, 'utf8'));
    manifest.version = '0.3.0+codex.local-test';
    await writeFile(file, JSON.stringify(manifest), 'utf8');
  });
  assert.deepEqual(errors, []);
});

test('Milestone 2 negative trigger corpus remains required', async () => {
  const errors = await withFixture((root) => remove(path.join(root, 'tests', 'negative-triggers.json')));
  assert.match(errors.join('\n'), /negative-triggers\.json/);
});

test('Milestone 2 fixture schema is enforced', async () => {
  const errors = await withFixture(async (root) => {
    const file = path.join(root, 'tests', 'fixtures.json');
    const fixtures = JSON.parse(await readFile(file, 'utf8'));
    delete fixtures.cases[0].must_include_meaning;
    await writeFile(file, JSON.stringify(fixtures), 'utf8');
  });
  assert.match(errors.join('\n'), /missing must_include_meaning/);
});

test('Milestone 2 protocol and template markers are enforced', async () => {
  const errors = await withFixture(async (root) => {
    const file = path.join(root, 'skills', 'prompt-compiler', 'references', 'action-protocol.md');
    const protocol = await readFile(file, 'utf8');
    await writeFile(file, protocol.replace('PROMPT_COMPILER_ACTION: CANCEL', 'PROMPT_COMPILER_ACTION: OMITTED'), 'utf8');
  });
  assert.match(errors.join('\n'), /action protocol is missing CANCEL/);
});

test('review output requires provenance format', async () => {
  const errors = await withFixture(async (root) => {
    const file = path.join(root, 'skills', 'prompt-compiler', 'references', 'output-contract.md');
    const contract = await readFile(file, 'utf8');
    await writeFile(file, contract.replace('Source: <one exact provenance label>', 'Source: <label>'), 'utf8');
  });
  assert.match(errors.join('\n'), /output-contract\.md must expose review ID, provenance format/);
});

test('workflow requires a structured nontrivial prompt and terminal review boundary', async () => {
  const skill = await readFile(path.join(repositoryRoot, 'skills', 'prompt-compiler', 'SKILL.md'), 'utf8');
  const output = await readFile(path.join(repositoryRoot, 'skills', 'prompt-compiler', 'references', 'output-contract.md'), 'utf8');
  assert.match(skill, /short labeled sections and\/or bullet lists/i);
  assert.match(skill, /stop immediately after presenting the review/i);
  assert.match(skill, /no more tools, analysis, or underlying work/i);
  assert.match(skill, /exact approved body as the sole operative request/i);
  assert.match(output, /simple one-sentence prompts may stay simple/i);
});
