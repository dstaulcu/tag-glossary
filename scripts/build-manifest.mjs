// Generates glossary.json (manifest v2) by merging core/ and every teams/<team>/ folder.
// Usage: node scripts/build-manifest.mjs [--check]
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const FACETS = ['project', 'community', 'tactic', 'tool'];
const STATUSES = ['active', 'proposed', 'deprecated'];
const NAME = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const check = process.argv.includes('--check');

function frontMatter(text) {
  const m = /^---\n([\s\S]*?)\n---/.exec(text);
  const meta = {};
  if (!m) return meta;
  for (const line of m[1].split('\n')) {
    const kv = /^([A-Za-z_]+):\s*(.*?)\s*(?:#.*)?$/.exec(line);
    if (kv) meta[kv[1]] = kv[2].replace(/^["']|["']$/g, '');
  }
  return meta;
}

function aliasList(text) {
  const m = /^aliases:\s*\[(.*)\]\s*$/m.exec(text);
  return m ? [...m[1].matchAll(/"([^"]+)"|'([^']+)'/g)].map((x) => x[1] ?? x[2]) : [];
}

function definition(text) {
  const m = /^Definition:[ \t]*(.*)$/m.exec(text);
  return m ? m[1].trim() : '';
}

const errors = [];
const tags = [];
const teams = [];

function scan(source, baseDir, baseRel) {
  for (const facet of readdirSync(baseDir).filter((d) => statSync(join(baseDir, d)).isDirectory()).sort()) {
    if (!FACETS.includes(facet)) {
      errors.push(`${baseRel}/${facet}: unknown facet folder (facets: ${FACETS.join(', ')})`);
      continue;
    }
    const dir = join(baseDir, facet);
    for (const file of readdirSync(dir).filter((f) => f.endsWith('.md')).sort()) {
      const path = `${baseRel}/${facet}/${file}`;
      const text = readFileSync(join(dir, file), 'utf8');
      if (text.includes('\r')) errors.push(`${path}: contains CR characters (use LF)`);
      const meta = frontMatter(text);
      const tag = `${facet}/${file.slice(0, -3)}`;
      if (meta.tag !== tag) errors.push(`${path}: tag should be "${tag}"`);
      if (meta.facet !== facet) errors.push(`${path}: facet should be "${facet}"`);
      if (!NAME.test(file.slice(0, -3))) errors.push(`${path}: name must be lowercase-hyphenated`);
      if (!text.includes(`aliases: ["#${tag}"]`)) errors.push(`${path}: aliases must be ["#${tag}"]`);
      if (!STATUSES.includes(meta.status)) errors.push(`${path}: status must be one of ${STATUSES.join('|')}`);
      tags.push({
        tag,
        facet,
        source,
        status: meta.status ?? '',
        replaced_by: meta.replaced_by || null,
        aliases: aliasList(text),
        definition: definition(text),
        path,
        hash: createHash('sha256').update(text).digest('hex'),
      });
    }
  }
}

if (!existsSync(join(root, 'core'))) errors.push('core/ is missing');
else scan('core', join(root, 'core'), 'core');

const teamsDir = join(root, 'teams');
if (existsSync(teamsDir)) {
  for (const id of readdirSync(teamsDir).filter((d) => statSync(join(teamsDir, d)).isDirectory()).sort()) {
    if (!NAME.test(id)) errors.push(`teams/${id}: team folder must be lowercase-hyphenated`);
    const teamFile = join(teamsDir, id, 'team.md');
    if (!existsSync(teamFile)) {
      errors.push(`teams/${id}: team.md is missing`);
      continue;
    }
    const meta = frontMatter(readFileSync(teamFile, 'utf8'));
    teams.push({ id, name: meta.name || id, description: meta.description || '' });
    scan(id, join(teamsDir, id), `teams/${id}`);
  }
}

const seen = new Map();
for (const t of tags) {
  if (seen.has(t.tag)) errors.push(`${t.path}: tag "${t.tag}" is already defined in ${seen.get(t.tag)}`);
  else seen.set(t.tag, t.path);
}
for (const t of tags) {
  if (t.status === 'deprecated' && !t.replaced_by) errors.push(`${t.path}: deprecated tags need replaced_by`);
  if (t.replaced_by && !seen.has(t.replaced_by)) errors.push(`${t.path}: replaced_by "${t.replaced_by}" does not exist`);
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

const manifestPath = join(root, 'glossary.json');
const next = JSON.stringify({ version: 2, facets: FACETS, teams, tags }, null, 2) + '\n';
if (check) {
  const current = existsSync(manifestPath) ? readFileSync(manifestPath, 'utf8') : '';
  if (current !== next) {
    console.error('glossary.json is stale. Run: npm run manifest');
    process.exit(1);
  }
  console.log(`glossary.json up to date (${tags.length} tags, ${teams.length} teams)`);
} else {
  writeFileSync(manifestPath, next);
  console.log(`Wrote glossary.json (${tags.length} tags, ${teams.length} teams)`);
}
