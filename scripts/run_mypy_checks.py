# coding: utf-8
#
# Copyright 2021 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS-IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""MyPy test runner script."""

from __future__ import annotations

import argparse
import os
import re
import subprocess
import sys

from scripts import common

from typing import Final, List, Optional, Tuple

# List of directories whose files won't be type-annotated ever.
EXCLUDED_DIRECTORIES: Final = [
    'proto_files/',
    'scripts/linters/test_files/',
    'third_party/',
    'venv/',
    '.direnv/',
    # The files in 'build_sources' and 'data' directories can be
    # ignored while type checking, because these files are only
    # used as resources for the tests.
    'core/tests/build_sources/',
    'core/tests/data/',
]

# Files that are known to contain code mypy currently reports as
# unreachable (via --warn-unreachable), due to its inability to
# narrow certain type patterns (see issue #21747). Each file here
# should have (or link to) a tracking "good first issue" to fix the
# narrowing and get removed from this list. Do NOT add a file here
# to silence a *different* kind of mypy error - only unreachable-code
# errors from these files are suppressed; every other mypy error in
# these files, and every error (including new unreachable errors) in
# every other file, still fails the build.
NOT_FULLY_COVERED_FILES_FOR_UNREACHABLE_CODE: Final = [
    'extensions/objects/models/objects.py',
    'core/schema_utils.py',
    'core/storage/user/gae_models.py',
    'core/storage/suggestion/gae_models.py',
    'core/storage/blog/gae_models.py',
    'core/domain/html_validation_service.py',
    'core/domain/story_domain.py',
    'core/domain/draft_upgrade_services.py',
    'core/domain/email_services.py',
    'core/domain/user_services.py',
    'core/domain/topic_services.py',
    'core/domain/suggestion_services.py',
    'core/domain/suggestion_registry.py',
    'core/domain/story_services.py',
    'core/domain/skill_services.py',
    'core/domain/question_services.py',
    'core/domain/opportunity_services.py',
    'core/domain/exp_services.py',
    'core/domain/collection_services.py',
    'core/domain/learner_progress_services.py',
    'core/jobs/batch_jobs/number_with_units_audit_jobs.py',
    'core/domain/app_feedback_report_services.py',
    'core/controllers/story_viewer.py',
    'core/controllers/library.py',
    'core/controllers/reader.py',
    'core/jobs/transforms/validation/base_validation.py',
    'core/controllers/access_validators.py',
    'scripts/run_typescript_checks_test.py',
    'scripts/run_frontend_tests_test.py',
    'core/storage/base_model/gae_models_test.py',
    'core/domain/user_services_test.py',
    'core/domain/takeout_service_test.py',
    'core/domain/question_fetchers_test.py',
    'core/domain/event_services_test.py',
    'core/controllers/reader_test.py',
]

CONFIG_FILE_PATH: Final = os.path.join('.', 'mypy.ini')

# Matches lines like:
# core/domain/exp_services.py:672: error: ... [unreachable]
# stubs/yaml/__init__.pyi:9: error: ...
# Also tolerates optional column and end-line:end-column suffixes
# (file.py:LINE:COL: error: ... or file.py:LINE:COL:ENDLINE:ENDCOL: error: ...)
# in case mypy.ini or the invocation ever turns on show_column_numbers/
# show_error_end - the current config doesn't, but the parser shouldn't
# silently go blind if that changes.
_UNREACHABLE_LINE_REGEX: Final = re.compile(
    r'^(?P<filepath>[^:]+\.pyi?):\d+(?::\d+(?::\d+:\d+)?)?: error: '
    r'.* \[unreachable\]\s*$'
)

_PARSER: Final = argparse.ArgumentParser(
    description='Python type checking using mypy script.'
)
_PARSER.add_argument(
    '--files', help='Files to type-check', action='store', nargs='+'
)


def get_mypy_cmd(files: Optional[List[str]]) -> List[str]:
    """Return the appropriate command to be run.

    Args:
        files: Optional[List[str]]. List of files provided to check for MyPy
            type checking, or None if no file is provided explicitly.

    Returns:
        list(str). List of command line arguments.
    """
    mypy_cmd = 'mypy'

    if files:
        cmd = [
            mypy_cmd,
            '--config-file',
            CONFIG_FILE_PATH,
            '--warn-unreachable',
        ] + files
    else:
        excluded_files_regex = '|'.join(EXCLUDED_DIRECTORIES)
        cmd = [
            mypy_cmd,
            '--exclude',
            excluded_files_regex,
            '--config-file',
            CONFIG_FILE_PATH,
            '--warn-unreachable',
            '.',
        ]
    return cmd


def _is_allowlisted(filepath: str) -> bool:
    """Checks whether the given mypy-reported filepath (which may use
    either OS-specific separators) matches an entry in the unreachable-
    code allowlist.
    """
    normalized = filepath.replace(os.sep, '/')
    return normalized in NOT_FULLY_COVERED_FILES_FOR_UNREACHABLE_CODE


_ERROR_LINE_REGEX: Final = re.compile(
    r'^[^:]+\.pyi?:\d+(?::\d+(?::\d+:\d+)?)?: error: '
)
_SUMMARY_LINE_REGEX: Final = re.compile(r'^Found \d+ errors? in \d+ files?')


def filter_unreachable_errors_for_allowlisted_files(
    mypy_output: str, check_stale_entries: bool
) -> Tuple[str, int, bool]:
    """Removes '[unreachable]' error lines that originate from files on
    the allowlist, leaving every other line (including unreachable
    errors from non-allowlisted files) untouched. Also rewrites mypy's
    trailing summary line to reflect the filtered error count, since
    mypy generates that line itself and it would otherwise still show
    the pre-filter count.

    Args:
        mypy_output: str. Raw stdout produced by mypy.
        check_stale_entries: bool. Whether to flag allowlist entries
            that produced no unreachable error this run. Only valid
            when mypy was run against the full repo - a targeted
            `--files` run doesn't scan most allowlisted files at all,
            so their absence from the output means nothing.

    Returns:
        Tuple[str, int, bool]. The filtered output, the count of
        remaining (non-suppressed) per-line errors, and whether any
        allowlisted file's unreachable error was actually suppressed
        during this run.
    """
    kept_lines = []
    remaining_error_count = 0
    allowlisted_files_hit = set()
    for line in mypy_output.splitlines():
        unreachable_match = _UNREACHABLE_LINE_REGEX.match(line)
        if unreachable_match and _is_allowlisted(
            unreachable_match.group('filepath')
        ):
            allowlisted_files_hit.add(
                unreachable_match.group('filepath').replace(os.sep, '/')
            )
            continue
        if _SUMMARY_LINE_REGEX.match(line):
            # Drop mypy's own summary line; we regenerate it below from
            # the errors that actually survived filtering.
            continue
        if _ERROR_LINE_REGEX.match(line):
            remaining_error_count += 1
        kept_lines.append(line)

    # Flag allowlist entries that no longer produce any unreachable
    # error - these should be removed so the allowlist doesn't quietly
    # accumulate stale, already-fixed entries. Only meaningful on a
    # full-repo run; see the check_stale_entries docstring above.
    if check_stale_entries:
        stale_entries = (
            set(NOT_FULLY_COVERED_FILES_FOR_UNREACHABLE_CODE)
            - allowlisted_files_hit
        )
        if stale_entries:
            remaining_error_count += len(stale_entries)
            stale_entries_str = ', '.join(sorted(stale_entries))
            kept_lines.append(
                'error: The following files no longer produce unreachable-'
                'code errors and must be removed from '
                'NOT_FULLY_COVERED_FILES_FOR_UNREACHABLE_CODE in '
                f'scripts/run_mypy_checks.py: {stale_entries_str}'
            )

    if remaining_error_count:
        kept_lines.append(
            f'Found {remaining_error_count} error(s) '
            'after filtering allowlisted unreachable code.'
        )
    else:
        kept_lines.append(
            'Success: no issues found after filtering '
            'allowlisted unreachable code.'
        )
    return (
        '\n'.join(kept_lines),
        remaining_error_count,
        bool(allowlisted_files_hit),
    )


def main(args: Optional[List[str]] = None) -> int:
    """Runs the MyPy type checks."""
    parsed_args = _PARSER.parse_args(args=args)

    for directory in common.DIRS_TO_ADD_TO_SYS_PATH:
        # The directories should only be inserted starting at index 1. See
        # https://stackoverflow.com/a/10095099 and
        # https://stackoverflow.com/q/10095037 for more details.
        sys.path.insert(1, directory)

    mypy_cmd = get_mypy_cmd(parsed_args.files)

    print('Starting Mypy type checks.')
    process = subprocess.Popen(
        mypy_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE
    )
    stdout, stderr = process.communicate()
    # Standard and error output is in bytes, we need to decode the line to
    # print it.
    raw_stdout = stdout.decode('utf-8')
    filtered_stdout, remaining_error_count, suppressed_something = (
        filter_unreachable_errors_for_allowlisted_files(
            raw_stdout, check_stale_entries=not parsed_args.files
        )
    )
    print(filtered_stdout)
    print(stderr.decode('utf-8'))

    mypy_originally_failed = process.returncode != 0
    if mypy_originally_failed and not suppressed_something:
        # Mypy failed for a reason we didn't suppress anything for (a
        # bad invocation, a config error, a non-unreachable error type,
        # etc.) - trust mypy's own verdict rather than our error count,
        # since we have no evidence this run's failure has anything to
        # do with the allowlist.
        mypy_check_passed = False
    else:
        mypy_check_passed = remaining_error_count == 0

    if mypy_check_passed:
        print('Mypy type checks successful.')
        return 0
    else:
        print(
            'Mypy type checks unsuccessful. Please fix the errors. '
            'For more information, visit: '
            'https://github.com/oppia/oppia/wiki/Backend-Type-Annotations'
        )
        sys.exit(1)


if __name__ == '__main__':  # pragma: no cover
    main()
