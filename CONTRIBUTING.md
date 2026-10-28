# Contributing

1. Branch, then add or edit a note under `projects/`, `techniques/` or `tools/` following the README naming rules. New tags start as `status: proposed`.
2. Run `npm run manifest` and commit the updated `glossary.json`.
3. Open a pull request (merge request on GitLab). CI runs `npm run check`.
4. The owner reviews and merges; accepted tags are set to `active`.
5. Tag a release (`vX.Y`) when the vocabulary changes significantly.

Deprecating: set `status: deprecated` and `replaced_by: <facet>/<name>`. Never delete a note.
