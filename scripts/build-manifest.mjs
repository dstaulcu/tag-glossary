// Generates glossary.json from the notes under projects/, techniques/ and tools/.
// Usage: node scripts/build-manifest.mjs [--check]
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const FACETS = ['projects', 'techniques', 'tools'];
const STATUSES = ['active', 'proposed', 'deprecated'];
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

const errors = [];
const tags = [];
for (const facet of FACETS) {
  const dir = join(root, facet);
  if (!existsSync(dir)) continue;
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.md')).sort()) {
    const path = `${facet}/${file}`;
    const text = readFileSync(join(dir, file), 'utf8');
    if (text.includes('\r')) errors.push(`${path}: contains CR characters (use LF)`);
    const meta = frontMatter(text);
    const tag = `${facet}/${file.slice(0, -3)}`;
    if (meta.tag !== tag) errors.push(`${path}: tag should be "${tag}"`);
    if (meta.facet !== facet) errors.push(`${path}: facet should be "${facet}"`);
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(file.slice(0, -3))) errors.push(`${path}: name must be lowercase-hyphenated`);
    if (!text.includes(`aliases: ["#${tag}"]`)) errors.push(`${path}: aliases must be ["#${tag}"]`);
    if (!STATUSES.includes(meta.status)) errors.push(`${path}: status must be one of ${STATUSES.join('|')}`);
    tags.push({
      tag,
      facet,
      status: meta.status ?? '',
      replaced_by: meta.replaced_by || null,
      path,
      hash: createHash('sha256').update(text).digest('hex'),
    });
  }
}
const known = new Set(tags.map((t) => t.tag));
for (const t of tags) {
  if (t.status === 'deprecated' && !t.replaced_by) errors.push(`${t.path}: deprecated tags need replaced_by`);
  if (t.replaced_by && !known.has(t.replaced_by)) errors.push(`${t.path}: replaced_by "${t.replaced_by}" does not exist`);
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

const manifestPath = join(root, 'glossary.json');
const next = JSON.stringify({ version: 1, tags }, null, 2) + '\n';
if (check) {
  const current = existsSync(manifestPath) ? readFileSync(manifestPath, 'utf8') : '';
  if (current !== next) {
    console.error('glossary.json is stale. Run: npm run manifest');
    process.exit(1);
  }
  console.log(`glossary.json up to date (${tags.length} tags)`);
} else {
  writeFileSync(manifestPath, next);
  console.log(`Wrote glossary.json (${tags.length} tags)`);
}
