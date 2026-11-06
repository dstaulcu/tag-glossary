# Contributing

1. Make a short-lived branch (no long-lived team branches; everything lands on `main`).
2. Add or edit a note under `core/<facet>/` (core group only) or `teams/<team>/<facet>/` following the README naming rules. New tags start as `status: proposed`. A new team needs a `teams/<team>/team.md` and a CODEOWNERS line.
3. Run `npm run manifest` and commit the updated `glossary.json`.
4. Open a pull request (merge request on GitLab). CI runs `npm run check`. CODEOWNERS routes review to the core group or the team.
5. Accepted tags are set to `active`. Tag a release (`vX.Y`) when the vocabulary changes significantly.

Deprecating: set `status: deprecated` and `replaced_by: <facet>/<name>`. Never delete a note.

New facets: open an issue or pull request against `core/facets.md`; the core group decides.

History note: when the registry moved to the four-facet layout, the earlier plural tags (`projects/`, `techniques/`, `tools/`) were renamed in place to `project/`, `tactic/`, `tool/` once, because there were no other adopters. Do not rename tags this way again.
