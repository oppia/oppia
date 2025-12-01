## Quick context for AI coding agents

Oppia is a large full‑stack web application built with Python (backend) and
Angular/TypeScript (frontend). The codebase uses Google App Engine for storage
and platform integration. The Oppia project documentation and installation
instructions are maintained on the project wiki — treat
https://github.com/oppia/oppia/wiki as the source-of-truth for setup steps and
environment choices.

Key directories to inspect:

- `core/` — backend controllers, domain services, storage models and server-side
  templates (see `core/controllers`, `core/domain`, `core/storage`).
- `core/templates/` — Angular templates, directives and page-level components
  (e.g. `core/templates/pages/exploration-player-page/`).
- `assets/` — frontend TypeScript sources, constants and build tooling used by
  the Angular app.
- `extensions/` — pluggable components (rich text, others).
- `scripts/` — developer tooling, linters and test runners.

Developer workflows (explicit, repeatable commands):

Follow the Oppia wiki for full installation guidance. Below are the most common
local steps that are safe, minimal, and widely used; use the wiki for full
environment setup and troubleshooting.

- Install Python dependencies:

  python -m scripts.install_third_party_libs

- Run backend unit tests locally:

  python -m scripts.run_backend_tests --test-target <path_or_testname>

  (This is the same test runner used by CI.)

- Lint and style checks (local):

  python -m scripts.linters.run_lint_checks
  npx prettier --check .

Project-specific conventions and patterns (discoverable in the tree):

- Backend structure: controllers provide request handlers; business logic lives
  in `core/domain/*` service classes. Look for `handler` naming patterns and
  `*_services` in domain files.
- Storage / platform: code assumes Google App Engine-style storage models under
  `core/storage` and platform helpers in `core/platform`.
- Frontend: see the `core/templates` folder.
  -- Tests mapping: tests are split into backend unit tests (`core/tests`),
  frontend unit tests, Puppeteer-based acceptance tests
  (`core/tests/puppeteer-acceptance-tests`) and WebdriverIO e2e
  (`core/tests/wdio.conf.js`). The WebdriverIO e2e tests are intended to be
  deprecated in favour of the Puppeteer tests after we have confirmed parity
  in coverage.
  -- Tooling pinning: Node and other tools are provided under `oppia_tools/`
  (e.g. `node-16.13.0`). In general we prefer using the pinned versions in
  CI and in local development so that we can keep the environment consistent.

Integration points / external dependencies:

- Google App Engine concepts (datastore, platform services).
- Firebase (used in tests and cloud tooling).
- Tool pinning: Node and other tools are provided under `oppia_tools/` (e.g.
  `node-16.13.0`) in CI; when running locally prefer a system or nvm-managed
  Node 16 matching CI.
  -- CI: workflows live in `.github/workflows/` (see badges in
  `.github/README.md`); CI runs may run in different execution environments
  than your local machine.

Small examples for agents to be effective quickly:

-- To run a focused backend test for a file locally:
`python -m scripts.run_backend_tests --test-target <path_or_testname>`.
-- When editing frontend deps or build config locally: install Node 16 (nvm),
then run `yarn install --pure-lockfile` from `assets/` and follow the steps
for running frontend scripts described on the wiki.
-- Lint and style checks are enforced via scripts under `scripts/`; prefer
running them via the local Python venv to match CI tool versions.

What to watch out for / common pitfalls:

- CI and historical tooling pin versions under `oppia_tools/` (Node 16, yarn,
  etc.). When working locally, match CI versions where possible (nvm for Node),
  or consult the wiki for the exact tool versions.
- Some scripts targets assume that tools are installed in `oppia_tools/`, which
  is typically the immediate parent of the `oppia/` root folder; when running
  locally you may need to adapt paths accordingly.
- Tests or pre-commit hooks may run scripts that expect CI-like environments;
  if a local run fails, consult the wiki or run the failing script in a clean
  venv to see the detailed error.
- When writing comments, follow Oppia comment style: start with a capital
  letter, end with a period. See custom rule in
  `scripts/linters/custom_eslint_checks/rules/comment-style.js` as well.

Files to open first when exploring code paths:

- `scripts/` (linters, test runners), `core/` (backend logic), `core/templates/`
  and `assets/` (frontend).

If anything above is unclear or you want the agent to include examples for
editing/running a specific subsystem (backend handler, a frontend component, or
an e2e test), tell me which area and I will expand or iterate.
