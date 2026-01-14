# Scripts

This folder contains various Python scripts used for linting, testing, building, and maintaining the Oppia codebase.

## Table of Contents

- [Getting Started](#getting-started)
- [Installation Scripts](#installation-scripts)
- [Server Scripts](#server-scripts)
- [Testing Scripts](#testing-scripts)
- [Linting Scripts](#linting-scripts)
- [Build Scripts](#build-scripts)
- [Git Hooks](#git-hooks)
- [Utility Scripts](#utility-scripts)
- [Subdirectories](#subdirectories)

## Getting Started

Before running any scripts, ensure you have installed the required dependencies:

```bash
python -m scripts.install_third_party_libs
```

For development dependencies, also run:

```bash
python -m scripts.install_python_dev_dependencies
```

## Installation Scripts

| Script                                  | Description                                            |
| --------------------------------------- | ------------------------------------------------------ |
| `install_third_party_libs.py`           | Installs all third-party libraries required for Oppia. |
| `install_python_prod_dependencies.py`   | Installs Python production dependencies.               |
| `install_python_dev_dependencies.py`    | Installs Python development dependencies.              |
| `install_dependencies_json_packages.py` | Installs packages defined in dependencies.json.        |
| `install_prerequisites.sh`              | Shell script to install system prerequisites.          |

## Server Scripts

| Script              | Description                                   |
| ------------------- | --------------------------------------------- |
| `start.py`          | Starts the Oppia development server.          |
| `servers.py`        | Contains server management utilities.         |
| `run_portserver.py` | Runs the port server for managing test ports. |

**Example: Starting the development server**

```bash
python -m scripts.start
```

## Testing Scripts

| Script                       | Description                                      |
| ---------------------------- | ------------------------------------------------ |
| `run_backend_tests.py`       | Runs backend Python tests.                       |
| `run_frontend_tests.py`      | Runs frontend Karma/Jasmine tests.               |
| `run_e2e_tests.py`           | Runs WebdriverIO end-to-end tests.               |
| `run_acceptance_tests.py`    | Runs Puppeteer acceptance tests.                 |
| `run_typescript_checks.py`   | Runs TypeScript type checks.                     |
| `run_mypy_checks.py`         | Runs mypy type checks for Python.                |
| `run_lighthouse_tests.py`    | Runs Lighthouse performance/accessibility tests. |
| `run_custom_eslint_tests.py` | Runs tests for custom ESLint rules.              |
| `run_presubmit_checks.py`    | Runs all presubmit checks before pushing.        |

**Example: Running backend tests**

```bash
python -m scripts.run_backend_tests --test_target core.domain.user_services_test
```

**Example: Running frontend tests**

```bash
python -m scripts.run_frontend_tests
```

## Linting Scripts

The `linters/` subdirectory contains the linting infrastructure. To run lint checks:

```bash
python -m scripts.linters.run_lint_checks
```

For more details, see the [linters/README.md](linters/README.md) if available.

## Build Scripts

| Script                           | Description                                    |
| -------------------------------- | ---------------------------------------------- |
| `build.py`                       | Builds the Oppia application for production.   |
| `clean.py`                       | Cleans up generated files and build artifacts. |
| `create_expression_parser.py`    | Generates the expression parser.               |
| `generate_root_files_mapping.py` | Generates root files mapping for the build.    |
| `extend_index_yaml.py`           | Extends the index.yaml for datastore indexes.  |

## Git Hooks

| Script               | Description                           |
| -------------------- | ------------------------------------- |
| `pre_commit_hook.py` | Runs checks before each commit.       |
| `pre_push_hook.py`   | Runs checks before pushing to remote. |

These hooks are automatically installed when you set up your development environment.

## Utility Scripts

| Script                     | Description                             |
| -------------------------- | --------------------------------------- |
| `common.py`                | Common utilities used across scripts.   |
| `concurrent_task_utils.py` | Utilities for running concurrent tasks. |
| `git_changes_utils.py`     | Utilities for working with git changes. |
| `scripts_test_utils.py`    | Test utilities for script tests.        |

### Coverage and Quality Check Scripts

| Script                                  | Description                                     |
| --------------------------------------- | ----------------------------------------------- |
| `check_backend_test_coverage.py`        | Checks backend test coverage.                   |
| `check_frontend_test_coverage.py`       | Checks frontend test coverage.                  |
| `check_backend_associated_test_file.py` | Ensures backend files have associated tests.    |
| `check_backend_test_times.py`           | Monitors backend test execution times.          |
| `check_tests_are_captured_in_ci.py`     | Ensures tests are included in CI configuration. |
| `check_ci_test_suites_to_run.py`        | Determines which CI test suites to run.         |
| `check_github_workflow_status.py`       | Checks GitHub workflow status.                  |
| `third_party_size_check.py`             | Checks the size of third-party dependencies.    |
| `inactive_issue_checker.py`             | Checks for inactive issues.                     |

## Subdirectories

| Directory          | Description                                     |
| ------------------ | ----------------------------------------------- |
| `linters/`         | Contains linting scripts and custom lint rules. |
| `release_scripts/` | Contains scripts for release management.        |

## Notes

- Use the `--skip_install` flag with test scripts to skip dependency installation if dependencies are already installed.
- All scripts are designed to be run from the repository root using `python -m scripts.<script_name>`.
- Each script has a corresponding `*_test.py` file containing its tests.

For more detailed information about development workflows, refer to the [Oppia Wiki](https://github.com/oppia/oppia/wiki).
