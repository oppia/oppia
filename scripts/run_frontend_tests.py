# Copyright 2019 The Oppia Authors. All Rights Reserved.
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

"""This script runs unit tests for frontend JavaScript code (using Karma)."""

from __future__ import annotations

import argparse
import os
import subprocess
import sys

from scripts import common
from scripts import git_changes_utils
from typing import Optional, Sequence, Set

from . import build
from . import check_frontend_test_coverage
from . import install_third_party_libs

# These is a relative path from the oppia/ folder. They are relative because the
# dtslint command prepends the current working directory to the path, even if
# the given path is absolute.
DTSLINT_TYPE_TESTS_DIR_RELATIVE_PATH = os.path.join('typings', 'tests')
TYPESCRIPT_DIR_RELATIVE_PATH = os.path.join('node_modules', 'typescript', 'lib')
MAX_ATTEMPTS = 2

_PARSER = argparse.ArgumentParser(
    description="""
Run this script from the oppia root folder:
    python -m scripts.run_frontend_tests
The root folder MUST be named 'oppia'.
Note: You can replace 'it' with 'fit' or 'describe' with 'fdescribe' to run
a single test or test suite.
""")

_PARSER.add_argument(
    '--dtslint_only',
    help='optional; if specified, only runs dtslint type tests.',
    action='store_true'
)
_PARSER.add_argument(
    '--skip_install',
    help='optional; if specified, skips installing dependencies',
    action='store_true')
_PARSER.add_argument(
    '--verbose',
    help='optional; if specified, enables the karma terminal and prints all the'
    ' logs.',
    action='store_true')
_PARSER.add_argument(
    '--run_minified_tests',
    help='optional; if specified, runs frontend karma tests on both minified '
    'and non-minified code',
    action='store_true')
_PARSER.add_argument(
    '--check_coverage',
    help='optional; if specified, checks frontend test coverage',
    action='store_true'
)
_PARSER.add_argument(
    '--download_combined_frontend_spec_file',
    help='optional; if specified, downloads the combined frontend file',
    action='store_true'
)
_PARSER.add_argument(
    '--run_on_changed_files_in_branch',
    help='optional; if specified, runs the frontend karma tests on the '
    'files that were changed in the current branch.',
    action='store_true'
)
_PARSER.add_argument(
    '--specs_to_run',
    help='optional; if specified, runs the specified test specs. This '
    'should be a comma-separated list of spec file paths.',
)
_PARSER.add_argument(
    '--allow_no_spec',
    help='optional; if specified, exits with status code 0 if no specs are '
    'found to run.',
    action='store_true'
)


def run_dtslint_type_tests() -> None:
    """Runs the dtslint type tests in typings/tests."""
    print('Running dtslint type tests.')

    # Pass the local version of typescript. Otherwise, dtslint will download and
    # install all versions of typescript.
    cmd = ['./node_modules/dtslint/bin/index.js',
           DTSLINT_TYPE_TESTS_DIR_RELATIVE_PATH,
           '--localTs',
           TYPESCRIPT_DIR_RELATIVE_PATH]
    task = subprocess.Popen(cmd, stdout=subprocess.PIPE)
    output_lines = []
    # The value of `process.stdout` should not be None since we passed
    # the `stdout=subprocess.PIPE` argument to `Popen`.
    assert task.stdout is not None
    # Reads and prints realtime output from the subprocess until it terminates.
    while True:
        line = task.stdout.readline()
        # No more output from the subprocess, and the subprocess has ended.
        if len(line) == 0 and task.poll() is not None:
            break
        if line:
            print(line, end='')
            output_lines.append(line)
    print('Done!')
    if task.returncode:
        sys.exit('The dtslint (type tests) failed.')


def get_file_spec(file_path: str) -> str | None:
    """Returns the spec file path for a given file path.

    Args:
        file_path: str. The path of the file.

    Returns:
        str | None. The path of the spec file if it exists, otherwise None.
        If the file is not a TypeScript or JavaScript file, None is returned.
    """
    if (
        file_path.endswith(('.spec.ts', '.spec.js', 'Spec.ts', 'Spec.js')) and
        os.path.exists(file_path)
    ):
        return file_path

    if file_path.endswith(('.ts', '.js')):
        spec_file_path = '%s.spec%s' % (file_path[:-3], file_path[-3:])
        if os.path.exists(spec_file_path):
            return spec_file_path

        spec_file_path = file_path.replace('.ts', 'Spec.ts').replace(
            '.js', 'Spec.js')
        if os.path.exists(spec_file_path):
            return spec_file_path

    return None


def main(args: Optional[Sequence[str]] = None) -> None:
    """Runs the frontend tests."""
    parsed_args = _PARSER.parse_args(args=args)

    run_dtslint_type_tests()
    if parsed_args.dtslint_only:
        return

    if not parsed_args.skip_install:
        install_third_party_libs.main()

    common.setup_chrome_bin_env_variable()
    # We need to create an empty hashes.json file for the build so that
    # we don't get the error "assets/hashes.json file doesn't exist".
    build.save_hashes_to_file({})
    common.print_each_string_after_two_new_lines([
        'View interactive frontend test coverage reports by navigating to',
        '../karma_coverage_reports',
        'on your filesystem.',
        'Running test in development environment'])

    cmd = [
        common.NODE_BIN_PATH, '--max-old-space-size=4096',
        os.path.join(common.NODE_MODULES_PATH, 'karma', 'bin', 'karma'),
        'start', os.path.join('core', 'tests', 'karma.conf.ts')]

    specs_to_run: Set[str] = set()
    if parsed_args.specs_to_run:
        for spec in parsed_args.specs_to_run.split(','):
            spec_file = get_file_spec(spec.strip())
            if spec_file:
                specs_to_run.add(spec_file)
            elif not parsed_args.allow_no_spec:
                raise ValueError(
                    'No spec file found for the file: %s' % spec
                )

    if parsed_args.run_on_changed_files_in_branch:
        remote = git_changes_utils.get_local_git_repository_remote_name()
        if not remote:
            sys.exit('Error: No remote repository found.')
        refs = git_changes_utils.get_refs()
        collected_files = git_changes_utils.get_changed_files(
            refs, remote)
        for _, (_, acmrt_files) in collected_files.items():
            if not acmrt_files:
                continue

            files_to_run = git_changes_utils.get_js_or_ts_files_from_diff(
                acmrt_files)
            for file_path in files_to_run:
                spec_file = get_file_spec(file_path)
                if spec_file:
                    specs_to_run.add(spec_file)
        staged_files = git_changes_utils.get_staged_acmrt_files()
        staged_files_to_run = git_changes_utils.get_js_or_ts_files_from_diff(
            staged_files)
        for file_path in staged_files_to_run:
            spec_file = get_file_spec(file_path)
            if spec_file:
                specs_to_run.add(spec_file)

    if (
        (parsed_args.specs_to_run or
        parsed_args.run_on_changed_files_in_branch) and
        not specs_to_run
    ):
        print('No valid specs found to run.')
        exit_code = 0 if parsed_args.allow_no_spec else 1
        sys.exit(exit_code)

    if specs_to_run:
        print('Running the following specs:', specs_to_run)
        cmd.append('--specs_to_run=%s' % ','.join(sorted(specs_to_run)))

    if parsed_args.run_minified_tests:
        print('Running test in production environment')

        build.main(args=['--prod_env', '--minify_third_party_libs_only'])

        cmd.append('--prodEnv')
    else:
        build.main(args=[])

    if parsed_args.verbose:
        cmd.append('--terminalEnabled')

    for attempt in range(MAX_ATTEMPTS):
        print(f'Attempt {attempt + 1} of {MAX_ATTEMPTS}')
        task = subprocess.Popen(cmd, stdout=subprocess.PIPE)
        output_lines = []
        # The value of `process.stdout` should not be None since we passed
        # the `stdout=subprocess.PIPE` argument to `Popen`.
        assert task.stdout is not None
        # Prevents the wget command from running multiple times.
        combined_spec_file_started_downloading = False
        # This variable will be used to define the wget command to download
        # the combined-test.spec.js file.
        download_task = None
        # Reads and prints realtime output from the subprocess until it
        # terminates.
        while True:
            line = task.stdout.readline()
            # No more output from the subprocess, and the subprocess has ended.
            if len(line) == 0 and task.poll() is not None:
                break
            # Suppressing the karma web-server logs.
            if line and not '[web-server]:' in line.decode('utf-8'):
                # Standard output is in bytes, we need to decode
                # the line to print it.
                print(line.decode('utf-8'), end='')
                output_lines.append(line)
            # Download the combined-tests.js file from the web-server.
            if ('Executed' in line.decode('utf-8') and
                not combined_spec_file_started_downloading and
                parsed_args.download_combined_frontend_spec_file):
                download_task = subprocess.Popen(
                    ['wget',
                    (
                        'http://localhost:9876/base/core/templates/'
                        'combined-tests.spec.js'
                    ),
                    '-P',
                    os.path.join('../karma_coverage_reports')])
                # Wait for the wget command to download the
                # combined-tests.spec.js file to complete.
                download_task.wait()
                combined_spec_file_started_downloading = True
        # Standard output is in bytes, we need to decode the line to print it.
        concatenated_output = ''.join(
            line.decode('utf-8') for line in output_lines)
        if download_task:
            # The result of the download is printed at the end for
            # easy access to it.
            if download_task.returncode:
                print('Failed to download the combined-tests.spec.js file.')
            else:
                print(
                    'Downloaded the combined-tests.spec.js file and stored'
                    'in ../karma_coverage_reports')
        print('Done!')

        if 'Trying to get the Angular injector' in concatenated_output:
            print(
                'If you run into the error "Trying to get the Angular '
                'injector", please see https://github.com/oppia/oppia/wiki/'
                'Frontend-unit-tests-guide#how-to-handle-common-errors'
                ' for details on how to fix it.')

        if 'Disconnected , because no message' in concatenated_output:
            print(
                'Detected chrome disconnected flake (#16607), so rerunning '
                'if attempts allow.')
        else:
            break

    if parsed_args.check_coverage:
        if task.returncode:
            sys.exit(
                'The frontend tests failed. Please fix it before running the'
                ' test coverage check.')
        else:
            check_frontend_test_coverage_args = []
            if len(specs_to_run) > 0:
                check_frontend_test_coverage_args.append(
                    '--files_to_check=%s' % ','.join(sorted(specs_to_run))
                )
            check_frontend_test_coverage.main(
                check_frontend_test_coverage_args
            )
    elif task.returncode:
        sys.exit(task.returncode)


if __name__ == '__main__':  # pragma: no cover
    main()
