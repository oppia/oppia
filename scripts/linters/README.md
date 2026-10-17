# Filename conventions

`filename_linter.py` validates TypeScript, HTML, and CSS filenames under
`core/templates/` and `extensions/`. It is called by
`GeneralPurposeLinter.perform_all_lint_checks()` through the existing local and
CI lint workflow. Existing global lint exclusions still apply.

Run the existing lint command for a file or directory:

```sh
python -m scripts.linters.run_lint_checks --path core/templates/services/
```

## Standard patterns

The policies follow the period-separated kebab-case format in the
[frontend naming guide](https://github.com/oppia/oppia/wiki/The-File-Naming-Convention-and-Directory-Structure),
with explicit patterns for the additional roles and special files in this
checkout.

- Use a lowercase kebab-case feature stem, for example `lesson-card`.
- TypeScript files use `<feature>.<role>.ts`, with `.spec` immediately before
  `.ts` for unit specs. Roles are listed in `TYPESCRIPT_ROLES`: components,
  services, models, guards, modules, directives, pipes, constants, factories,
  initializers, imports, controllers, and filters.
- HTML files use `.component.html`, `.directive.html`, `.template.html`, or
  `.mainpage.html`.
- Component/directive styles use `.component.css` or `.directive.css`.
- Routing modules and integration specs have explicit compound patterns:
  `app.routing.module.ts`, `app.routing.module.spec.ts`, and
  `schema-based-editors.integration.spec.ts`.

The rules check **basenames**, not directory casing. They do not force all
guards to be auth guards or derive their feature stem from a page directory.
They do not inspect file contents, check spelling, require companion files,
or verify which implementation a spec tests. Spec pairing and application
file renames are separate migration work tracked in #27577.

## Special-purpose files

Special cases are explicit patterns with path restrictions, not broad ignores:

- Interaction entry files follow `<InteractionId>/<InteractionId>.ts` under
  `extensions/interactions/`, preserving the case-sensitive interaction ID.
- Utility files under `core/templates/utility/` use kebab-case `.ts` names.
- Schema validators, test helpers, translation infrastructure, and existing
  infrastructure entry points have restricted patterns.
- Declaration files use kebab-case `.d.ts` names, with an exact-path exception
  for CodeMirror's `diff_match_patch.d.ts`.
- Shared library templates and the form test fixture have restricted patterns.
- Value-generator templates preserve their identifiers in their own directory.
- Global styles and interaction static styles have their own directory-scoped
  conventions.

An unknown name **within a configured scope fails**. There is no unrestricted
fallback for `.ts` files that could hide `example-service.ts`,
`example.services.ts`, or a misspelled role suffix.

## Adding a naming pattern

Rules are typed, immutable configuration; the matching engine is independent
of the initial frontend roles and extensions.

1. Add a `FilenamePattern` to the appropriate rule's `patterns`, supplying a
   descriptive `name` and a compiled `filename_regex`. For a new ordinary
   TypeScript role, adding it to `TYPESCRIPT_ROLES` also includes its spec form.
2. Supply a `path_regex` if the convention is valid only in particular paths.
   Both regexes use `fullmatch`, not substring matching. Path expressions use
   repository-relative paths with forward slashes.
3. For a new scope or extension, add a `FilenameRule` to `FILENAME_RULES`, with
   directory prefixes (ending in `/`), lowercase extensions, patterns, and an
   actionable error description. Patterns in one rule are alternatives; overlapping rules
   are cumulative, so a file must satisfy each applicable rule.
4. Add positive and negative tests, including path boundaries and compound
   suffixes. Update this documentation and review the existing files affected
   by the new rule. No change to `check_filenames()` is needed.

For example, a future resolver pattern could be:

```python
FilenamePattern(
    name='Resolver files',
    filename_regex=re.compile(r'%s\.resolver(?:\.spec)?\.ts' % KEBAB_CASE_REGEX),
)
```

`filename_linter_test.py` demonstrates extending both patterns and file
extensions without changing the engine.

## Existing violations

`filename_linter_allowlist.json` contains exact existing paths and explanations
so the linter can land before the filename migration. It is **not** a list of
allowed patterns. Never add wildcards or automatically accept new violations.
Additions require maintainer review; migration PRs should remove entries as
files are renamed or deleted.

Tests require each entry to exist, be within the configured scope, still fail
the standard rules, and include a reason referencing #27577. They also check
sorting and duplicate entries. These integrity checks run in tests rather than
repeatedly scanning the repository during every local lint task.

The linter deliberately does not change Git's file-selection behavior. The
default local runner currently selects added/copied/modified files, not entries
Git recognizes as renames. During migration, pass renamed destination paths
with `--files` or use `--path`. Repository-wide CI uses
`--shard other --verbose`, so it checks the full lintable file set. Changing
the Git rename selector is a separate concern.
