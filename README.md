# tag-glossary

Shared glossary for a three-facet Obsidian tag scheme, so scheduled agents can roll up work across vaults.

| Facet | Tag | Meaning |
| --- | --- | --- |
| projects | `#projects/<name>` | A project or initiative |
| techniques | `#techniques/<capability>` | A capability or method, independent of tool |
| tools | `#tools/<name>` | A product or project name |

Each tag is one note in `projects/`, `techniques/` or `tools/`, named `<name>.md`. The `aliases` front matter equals the tag (for example `["#techniques/job-scheduling"]`) so Tag Wrangler treats the note as the tag page.

## Naming rules
- Lowercase, hyphen-separated, no spaces.
- Techniques are named by capability, not tool.
- Tools are named by product or project name.
- Never delete a tag. Mark it `status: deprecated` and set `replaced_by`.

## Note format
```
---
tag: techniques/job-scheduling
aliases: ["#techniques/job-scheduling"]
facet: techniques
status: active        # active | proposed | deprecated
replaced_by:          # for deprecated tags
owner: dave
---

# techniques/job-scheduling

Definition: one or two sentences.

Use when: ...
Don't use when: ...
Related: [[tools/hermes-agent]]
```

## Manifest
`glossary.json` lists every tag with facet, status, replaced_by, path and a sha256 content hash. The Obsidian plugin reads it first so it only imports new or changed notes. Regenerate with `npm run manifest`; CI runs `npm run check`.

See [CONTRIBUTING.md](CONTRIBUTING.md) to propose a tag.
