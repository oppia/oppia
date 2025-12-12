# Viewing server and console logs (dev, tests, Docker)

This guide shows Oppia developers how to emit and inspect backend (server) and frontend (browser) logs when running the project locally, in tests, and inside Docker. Each workflow answers two questions: how to produce the logs and where to read them.

## Table of contents

- [Quick principles](#quick-principles)
- [Python workflows (local, non-Docker)](#python-workflows-local-non-docker)
- [Docker workflows](#docker-workflows)
- [Troubleshooting](#troubleshooting)
- [Best practices](#best-practices)

## Quick principles

- Prefer structured logging: use `logging.info()` / `logging.debug()` for backend code and `console.log()` / `console.error()` for frontend code.
- Keep emitting terminals in the foreground. All Oppia helper scripts stream logs to stdout; do not background them when debugging.
- Add verbosity flags (`--verbose`, `--server_log_level=info`) when you need more detail.
- For automated browser runs, rely on the existing helpers that forward console output; do not reinvent the hooks unless you need extra filtering.

## Python workflows (local, non-Docker)

### Dev server - backend logs

- **Emit logs**: Use `logging.info()`/`logging.error()` in controllers or `print()` inside ad-hoc scripts. The dev appserver respects Python logging levels; raise verbosity temporarily with `logging.getLogger().setLevel(logging.DEBUG)` if needed.
- **Where to look**: The terminal running `python -m scripts.start` shows request traces, stack traces, and `logging` output from `core/controllers` and other backend modules.

```bash
python -m scripts.start --no_browser --source_maps
```

Useful flags: `--save_datastore` keeps emulator state, `--disable_host_checking` lets you test from another device, and `--prod_env` mimics production caching.

### Dev server - frontend logs

- **Emit logs**: Add `console.log()` or `console.error()` in Angular components or services. Build-time issues surface from the webpack compiler triggered by `scripts.start`.
- **Where to look**: Two places.
  - The same terminal running `python -m scripts.start` prints webpack and Angular build output via `servers.managed_ng_build()` and `servers.managed_webpack_compiler()`.
  - Browser runtime logs appear in DevTools -> Console when you browse to `http://localhost:8181` (default port from `scripts.start`).

### Backend unit tests

- **Emit logs**: Use Python `logging` APIs or `print()` inside tests and application code. When debugging a single test, call `logging.getLogger().setLevel(logging.DEBUG)` at the top of the test case.
- **Where to look**: The terminal running the test command. Increase verbosity with `--verbose`.

```bash
python -m scripts.run_backend_tests --test_target=core.controllers.android_test --verbose
```

`--test_path=core/controllers` runs every `_test.py` under the folder. The wrapper already prints `logging` output prefixed with `LOG_INFO_TEST:` when `--verbose` is set.

### Frontend unit tests

- **Emit logs**: Add `console.log()` or `console.warn()` in the TypeScript spec or component under test. When running via the helper, pass `--verbose` to keep Karma's terminal open.
- **Where to look**: The terminal executing `python -m scripts.run_frontend_tests` streams Karma output, including forwarded `console` statements.

```bash
python -m scripts.run_frontend_tests \
  --specs_to_run=core/templates/pages/exploration-editor-page/editor-tab/exploration-editor-tab.component.spec.ts \
  --verbose --allow_no_spec
```

Flags to surface more logs: `--run_minified_tests` exercises both dev/prod bundles, `--run_on_changed_files_in_branch` narrows to touched specs, and `--download_combined_frontend_spec_file` saves the Karma bundle for offline inspection.

### e2e tests - backend logs

- **Emit logs**: Backend handlers can log with `logging.info()`; set a higher level for the dev appserver with `--server_log_level=info` when invoking the runner.
- **Where to look**: `python -m scripts.run_e2e_tests` launches the dev server on port 8181 (see `common.GAE_PORT_FOR_E2E_TESTING`). The script streams server output and WebdriverIO logs to the calling terminal.

```bash
python -m scripts.run_e2e_tests --suite=navigation --server_log_level=info --source_maps
```

If you prefer to observe server logs separately, start the dev server manually (`python -m scripts.start --no_auto_restart`) and run the suite with `--skip-build` so the runner reuses your server.

### e2e tests - frontend logs

- **Emit logs**: Insert `console.log()` in Angular code under test or temporarily relax the ignore list in `core/tests/webdriverio_utils/general.js`.
- **Where to look**: WebdriverIO fetches browser logs using `browser.getLogs('browser')`, and the helper asserts on unexpected errors:

```js
// core/tests/webdriverio_utils/general.js
var browserLogs = await browser.getLogs('browser');
var browserErrors = browserLogs.filter(
  logEntry => logEntry.level.value > CONSOLE_LOG_THRESHOLD
);
expect(browserErrors).toEqual([]);
```

Console output (including `console.log`) is printed in the terminal that executed `python -m scripts.run_e2e_tests`.

### Acceptance tests - backend logs

- **Emit logs**: Same as other backend runs; acceptance tests reuse the dev appserver. Pass `--server_log_level=info` to emit INFO logs when Puppeteer exercises flows.
- **Where to look**: The terminal running `python -m scripts.run_acceptance_tests` includes both dev appserver output and the acceptance harness stream.

```bash
python -m scripts.run_acceptance_tests --suite=exploration-editor --server_log_level=info --headless
```

`run_acceptance_tests` auto-compiles TypeScript specs and spins up Redis, Elasticsearch, and Firebase emulators, so there is no separate server terminal unless you start one manually.

### Acceptance tests - frontend logs

- **Emit logs**: Add `console.log()` in the UI under test. The acceptance harness ships a `ConsoleReporter` that already attaches to browser consoles.
- **Where to look**: Console messages are forwarded into the acceptance test stdout. Errors are turned into failures via `ConsoleReporter.reportConsoleErrors()`:

```ts
// core/tests/puppeteer-acceptance-tests/utilities/common/console-reporter.ts
page.on('console', async (message: PuppeteerConsoleMessage) => {
  const messageText = message.text();
  ConsoleReporter.consoleMessages.push({
    type: message.type(),
    text: messageText,
    url: page.url(),
  });
});
```

Tune the ignore list inside `CONSOLE_ERRORS_TO_IGNORE` if you need to allow a specific warning while debugging.

### Lighthouse tests - backend and frontend logs

- **Emit logs**: Use `logging` in backend endpoints hit by Lighthouse and `console.log()` in frontend code to observe runtime data. Lighthouse itself logs through Node.
- **Where to look**: Two terminals when run locally.
  - The dev appserver started by the script prints backend output (use `--skip_build` if you already have a server running).
  - The terminal running `python -m scripts.run_lighthouse_tests` shows LHCI output and Puppeteer console captures.

```bash
python -m scripts.run_lighthouse_tests --mode=performance --pages=splash,about --record_screen
```

The command above records the Puppeteer session and prints the path to the captured video. For accessibility checks, use `--mode=accessibility`.

## Docker workflows

Oppia's `docker-compose.yml` defines the key containers such as `dev-server` (backend, container `oppia-dev-server`), `webpack-compiler` (frontend build, container `oppia-webpack-compiler`), and supporting emulators. Use `docker compose` (v2 syntax) for the examples below. Note: Docker-based development remains supported, but always consult the wiki for the latest expectations.

### Dev server - backend logs (Docker)

- **Emit logs**: Same Python logging APIs as local runs.
- **Where to look**: Stream the backend container's stdout.

```bash
docker compose up -d dev-server
docker logs -f oppia-dev-server
```

Run `docker compose up dev-server` without `-d` if you want logs inline in your shell.

### Dev server - frontend logs (Docker)

- **Emit logs**: Use `console.log()` in frontend code. Build compiler output comes from the dedicated frontend containers.
- **Where to look**:

```bash
docker logs -f oppia-webpack-compiler
docker logs -f oppia-angular-build
```

These services rebuild automatically when files change because volumes mount the repo into the containers.

### Backend unit tests (Docker)

- **Emit logs**: Python logging inside tests/functions.
- **Where to look**: The `docker compose run` command streams stdout directly; the container name is derived from the service (not `oppia-dev-server` because a fresh container is created per run).

```bash
docker compose run --rm dev-server python -m scripts.run_backend_tests \
  --test_target=core.controllers.android_test --verbose
```

If you prefer to reuse the long-lived `oppia-dev-server` container, attach with `docker exec -it oppia-dev-server bash` and run the command inside; logs stay in that terminal.

### Frontend unit tests (Docker)

- **Emit logs**: `console.log()` in specs/components.
- **Where to look**: Run the helper from the backend image (it already contains Node, Chrome, and Python). Output streams to your shell.

```bash
docker compose run --rm dev-server python -m scripts.run_frontend_tests \
  --specs_to_run=core/templates/pages/exploration-editor-page/editor-tab/exploration-editor-tab.component.spec.ts \
  --verbose --allow_no_spec
```

Karma will launch Chrome inside the container; ensure your host has shared memory available (use `--shm-size=1g` via Compose override if Chrome crashes while logging).

### e2e tests - backend logs (Docker)

- **Emit logs**: Use Python logging in handlers, and pass `--server_log_level=info` when invoking the runner inside Docker.
- **Where to look**: Tail `oppia-dev-server` while the one-off container drives WebdriverIO.

```bash
docker compose up -d dev-server webpack-compiler firebase datastore redis elasticsearch
docker logs -f oppia-dev-server &
docker compose run --rm dev-server python -m scripts.run_e2e_tests \
  --suite=navigation --server_log_level=info --source_maps
wait
```

Kill the background `docker logs` process with `Ctrl+C` once the run completes.

### e2e tests - frontend logs (Docker)

- **Emit logs**: Frontend `console.log()` statements.
- **Where to look**: The WebdriverIO process inside the run container forwards logs back to your terminal. Errors detected by `checkForConsoleErrors()` will fail the suite, so you do not need to inspect the browser manually.

### Acceptance tests - backend logs (Docker)

- **Emit logs**: Same as local acceptance runs.
- **Where to look**: Tail the backend container while running the suite inside a disposable container.

```bash
docker compose up -d dev-server webpack-compiler firebase datastore redis elasticsearch
docker logs -f oppia-dev-server &
docker compose run --rm dev-server python -m scripts.run_acceptance_tests \
  --suite=exploration-editor --server_log_level=info --headless
wait
```

### Acceptance tests - frontend logs (Docker)

- **Emit logs**: `console.log()` anywhere in the UI under test.
- **Where to look**: Acceptance harness output appears in the `docker compose run` terminal. The Puppeteer `ConsoleReporter` executes inside the container exactly as it does locally, so failures list offending console lines.

### Lighthouse tests - backend and frontend logs (Docker)

- **Emit logs**: Logging in handlers hit by Lighthouse and `console.log()` in the UI.
- **Where to look**: Tail `oppia-dev-server` for backend traces and watch the disposable container's stdout for LHCI output.

```bash
docker compose up -d dev-server webpack-compiler firebase datastore redis elasticsearch
docker logs -f oppia-dev-server &
docker compose run --rm dev-server python -m scripts.run_lighthouse_tests --mode=accessibility --pages=splash
wait
```

If you need to inspect webpack warnings at the same time, run `docker logs -f oppia-webpack-compiler` in a separate terminal.

## Troubleshooting

- Backend logs missing: confirm the server is running in the foreground (`python -m scripts.start` or `docker compose up dev-server`). If it is daemonized, attach with `docker logs -f oppia-dev-server`.
- Frontend console silent in automated runs: ensure the appropriate helper is active (`general.checkForConsoleErrors` for WebdriverIO, `ConsoleReporter.trackConsoleMessagesInBrowser` for Puppeteer). Avoid swallowing console messages in the tests themselves.
- Container logs blank: check `docker ps` to verify the container is running and that you're using the exact container name. Remember `docker compose run` creates transient containers with generated names.
- Karma/Chrome exits immediately: increase shared memory (`docker compose run --rm --shm-size=2g dev-server ...`) so the browser can stream logs without crashing.

## Best practices

- Bump log levels temporarily (`logging.getLogger().setLevel(logging.DEBUG)` or `--server_log_level=info`) but reset them before committing.
- Run servers and test harnesses in separate terminals to correlate requests and console output without interleaving.
- Narrow the scope of tests (`--test_target`, `--specs_to_run`, `--suite`) when debugging noisy failures so the relevant logs stay visible.
- Remove or downgrade verbose `console.log()` / `logging.debug()` statements after diagnosing the issue to keep CI output concise.
