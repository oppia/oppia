# Copyright 2014 The Oppia Authors. All Rights Reserved.
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

"""Script for running backend tests in parallel.

This should not be run directly. Instead, navigate to the oppia/ folder and
execute:

    python -m scripts.run_backend_tests

You can also append the following options to the above command:

    --verbose prints the output of the tests to the console.

    --test_target=core.controllers.editor_test runs only the tests in the
        core.controllers.editor_test module. (You can change
        "core.controllers.editor_test" to any valid module path.)

    --test_path=core/controllers runs all tests in test files in the
        core/controllers directory. (You can change "core/controllers" to any
        valid subdirectory path.)

    --test_shard=1 runs all tests in shard 1.

    --generate_coverage_report generates a coverage report as part of the final
        test output (but it makes the tests slower).

    --ignore_coverage only has an affect when --generate_coverage_report
        is specified. In that case, the tests will not fail just because
        code coverage is not 100%.

Note: If you've made some changes and tests are failing to run at all, this
might mean that you have introduced a circular dependency (e.g. module A
imports module B, which imports module C, which imports module A). This needs
to be fixed before the tests will run.
"""

from __future__ import annotations

import argparse
import contextlib
import json
import multiprocessing
import os
import random
import re
import socket
import string
import subprocess
import sys
import threading
import time

from typing import Dict, Final, List, Optional, Tuple, cast

from . import install_third_party_libs

from core import feconf, utils  # isort:skip  pylint: disable=wrong-import-position, wrong-import-order

# This installs third party libraries before importing other files or importing
# libraries that use the builtins python module (e.g. build, utils).
install_third_party_libs.main()

from . import common  # isort:skip  pylint: disable=wrong-import-position, wrong-import-order
from . import concurrent_task_utils  # isort:skip  pylint: disable=wrong-import-position, wrong-import-order
from . import servers  # isort:skip  pylint: disable=wrong-import-position, wrong-import-order

COVERAGE_EXCLUSION_LIST_PATH: Final = os.path.join(
    os.getcwd(), 'scripts', 'backend_tests_incomplete_coverage.txt'
)

TEST_RUNNER_PATH: Final = os.path.join(
    os.getcwd(), 'core', 'tests', 'gae_suite.py'
)
# This should be the same as core.test_utils.LOG_LINE_PREFIX.
LOG_LINE_PREFIX: Final = 'LOG_INFO_TEST: '
# This path points to a JSON file that defines which modules belong to
# each shard.
SHARDS_SPEC_PATH: Final = os.path.join(
    os.getcwd(), 'scripts', 'backend_test_shards.json'
)
SHARDS_WIKI_LINK: Final = (
    'https://github.com/oppia/oppia/wiki/Writing-backend-tests#common-errors'
)
_LOAD_TESTS_DIR: Final = os.path.join(
    os.getcwd(), 'core', 'tests', 'load_tests'
)

_PARSER: Final = argparse.ArgumentParser(
    description="""
Run this script from the oppia root folder:
    python -m scripts.run_backend_tests
IMPORTANT: Only one of --test_path,  --test_target, and --test_shard
should be specified.
""")

_EXCLUSIVE_GROUP: Final = _PARSER.add_mutually_exclusive_group()
_EXCLUSIVE_GROUP.add_argument(
    '--test_target',
    help='optional dotted module name of the test(s) to run',
    type=str)
_EXCLUSIVE_GROUP.add_argument(
    '--test_path',
    help='optional subdirectory path containing the test(s) to run',
    type=str)
_EXCLUSIVE_GROUP.add_argument(
    '--test_shard',
    help='optional name of shard to run',
    type=str)
_PARSER.add_argument(
    '--generate_coverage_report',
    help='optional; if specified, generates a coverage report',
    action='store_true')
_PARSER.add_argument(
    '--ignore_coverage',
    help='optional; if specified, tests will not fail due to coverage',
    action='store_true')
_PARSER.add_argument(
    '--exclude_load_tests',
    help='optional; if specified, exclude load tests from being run',
    action='store_true')
_PARSER.add_argument(
    '-v',
    '--verbose',
    help='optional; if specified, display the output of the tests being run',
    action='store_true')


def run_shell_cmd(
    exe: List[str],
    stdout: int = subprocess.PIPE,
    stderr: int = subprocess.PIPE,
    env: Optional[Dict[str, str]] = None
) -> str:
    """Runs a shell command and captures the stdout and stderr output.

    If the cmd fails, raises Exception. Otherwise, returns a string containing
    the concatenation of the stdout and stderr logs.
    """
    p = subprocess.Popen(exe, stdout=stdout, stderr=stderr, env=env)
    last_stdout_bytes, last_stderr_bytes = p.communicate()
    # Standard and error output is in bytes, we need to decode them to be
    # compatible with rest of the code. Sometimes we get invalid bytes, in which
    # case we replace them with U+FFFD.
    last_stdout_str = last_stdout_bytes.decode('utf-8', 'replace')
    last_stderr_str = last_stderr_bytes.decode('utf-8', 'replace')
    last_stdout = last_stdout_str.split('\n')

    if LOG_LINE_PREFIX in last_stdout_str:
        concurrent_task_utils.log('')
        for line in last_stdout:
            if line.startswith(LOG_LINE_PREFIX):
                concurrent_task_utils.log(
                    'INFO: %s' % line[len(LOG_LINE_PREFIX):])
        concurrent_task_utils.log('')

    result = '%s%s' % (last_stdout_str, last_stderr_str)

    if p.returncode != 0:
        raise Exception('Error %s\n%s' % (p.returncode, result))

    return result


class TestingTaskSpec:
    """Executes a set of tests given a test class name."""

    def __init__(
        self,
        test_target: str,
        generate_coverage_report: bool
    ) -> None:
        self.test_target = test_target
        self.generate_coverage_report = generate_coverage_report

    def run(self) -> List[concurrent_task_utils.TaskResult]:
        """Runs all tests corresponding to the given test target."""
        env = os.environ.copy()
        test_target_flag = '--test_target=%s' % self.test_target
        if self.generate_coverage_report:
            exc_list = [
                sys.executable, '-m', 'coverage', 'run',
                '--branch', TEST_RUNNER_PATH, test_target_flag
            ]
            rand = ''.join(random.choices(string.ascii_lowercase, k=16))
            data_file = '.coverage.%s.%s.%s' % (
                socket.gethostname(), os.getpid(), rand)
            env['COVERAGE_FILE'] = data_file
            concurrent_task_utils.log('Coverage data for %s is in %s' % (
                self.test_target, data_file))
        else:
            exc_list = [sys.executable, TEST_RUNNER_PATH, test_target_flag]

        try:
            result = run_shell_cmd(exc_list, env=env)
        except Exception as e:
            # Occasionally, tests fail spuriously because of an issue in grpc
            # (see e.g. https://github.com/oppia/oppia/runs/7462764522) that
            # causes a random polling error to be surfaced. Since this doesn't
            # represent a 'real' test failure, we do a single extra run if we
            # see that.
            if 'ev_epollex_linux.cc' in str(e):
                result = run_shell_cmd(exc_list, env=env)
            else:
                raise e

        messages = [result]

        if self.generate_coverage_report:
            covered_path = self.test_target.replace('.', '/')
            covered_path = covered_path[:-len('_test')]
            covered_path += '.py'
            if os.path.exists(covered_path):
                report, coverage = check_coverage(
                    False, data_file=data_file, include=(covered_path,))
            else:
                # Some test files (e.g. scripts/script_import_test.py)
                # have no corresponding code file, so we treat them as
                # fully covering their (nonexistent) associated code
                # file.
                report = ''
                coverage = 100.0
            messages.append(report)
            messages.append(str(coverage))

        return [concurrent_task_utils.TaskResult('', False, [], messages)]


def get_all_test_targets_from_path(
    test_path: Optional[str] = None,
    include_load_tests: bool = True
) -> List[str]:
    """Returns a list of test targets for all classes under test_path
    containing tests.
    """
    base_path = os.path.join(os.getcwd(), test_path or '')
    paths = []
    excluded_dirs = [
        '.git', 'third_party', 'node_modules', 'venv',
        'core/tests/data', 'core/tests/build_sources']
    for root in os.listdir(base_path):
        if any(s in root for s in excluded_dirs):
            continue
        if root.endswith('_test.py'):
            paths.append(os.path.join(base_path, root))
        for subroot, _, files in os.walk(os.path.join(base_path, root)):
            if any(s in subroot for s in excluded_dirs):
                continue
            if _LOAD_TESTS_DIR in subroot and not include_load_tests:
                continue
            for f in files:
                if f.endswith('_test.py'):
                    paths.append(os.path.join(subroot, f))
    result = [
        os.path.relpath(path, start=os.getcwd())[:-3].replace('/', '.')
        for path in paths]
    return result


def get_all_test_targets_from_shard(shard_name: str) -> List[str]:
    """Find all test modules in a shard.

    Args:
        shard_name: str. The name of the shard.

    Returns:
        list(str). The dotted module names that belong to the shard.
    """
    with utils.open_file(SHARDS_SPEC_PATH, 'r') as shards_file:
        # Here we use cast because we are narrowing down the type
        # since we know the type of shards_spec as it is the content
        # of the file backend_test_shards.json.
        shards_spec = cast(
            Dict[str, List[str]],
            json.load(shards_file)
        )
    return shards_spec[shard_name]


def check_shards_match_tests(include_load_tests: bool = True) -> str:
    """Check whether the test shards match the tests that exist.

    Args:
        include_load_tests: bool. Whether to include load tests.

    Returns:
        str. A description of any problems found, or an empty string if
        the shards match the tests.

    Raises:
        Exception. Failed to find duplicated module in shards.
    """
    with utils.open_file(SHARDS_SPEC_PATH, 'r') as shards_file:
        shards_spec = json.load(shards_file)
    shard_modules = sorted([
        module for shard in shards_spec.values() for module in shard])
    test_modules = get_all_test_targets_from_path(
        include_load_tests=include_load_tests)
    test_modules_set = set(test_modules)
    test_modules = sorted(test_modules_set)
    if test_modules == shard_modules:
        return ''
    if len(set(shard_modules)) != len(shard_modules):
        # A module is duplicated, so we find the duplicate.
        # All elements in a set are unique and when
        # len(set(shard_modules)) != len(shard_modules), there has to be
        # at least one duplicate module in shard_modules.
        # We add no-cover for the branch condition where the loop terminates
        # instead of being exited early by return statement.
        for module in shard_modules: # pragma: no cover
            if shard_modules.count(module) != 1:
                return '{} duplicated in {}'.format(
                    module, SHARDS_SPEC_PATH)
        raise Exception(
            'Failed to find  module duplicated in shards.') # pragma: no cover

    # Since there are no duplicates among the shards, we know the
    # problem must be a module in one list but not the other.
    shard_modules_set = set(shard_modules)
    shard_extra = shard_modules_set - test_modules_set
    if shard_extra:
        return (
            'Modules {} are in the backend test shards but missing from the '
            'filesystem. See {}.'
        ).format(shard_extra, SHARDS_WIKI_LINK)
    test_extra = test_modules_set - shard_modules_set
    assert test_extra
    return (
        'Modules {} are present on the filesystem but are not listed in the '
        'backend test shards. See {}.'
    ).format(test_extra, SHARDS_WIKI_LINK)


def load_coverage_exclusion_list(path: str) -> List[str]:
    """Load modules excluded from per-file coverage checks.

    Args:
        path: str. Path to file with exclusion list. File should have
            one dotted module name per line. Blank lines and lines
            starting with `#` are ignored.

    Returns:
        list(str). Dotted names of excluded modules.
    """
    exclusion_list = []
    with open(path, 'r', encoding='utf-8') as exclusion_file:
        for line in exclusion_file:
            line = line.strip()
            if line and not line.startswith('#'):
                exclusion_list.append(line)
    return exclusion_list


def check_test_results(
    tasks: List[concurrent_task_utils.TaskThread],
    task_to_taskspec: Dict[concurrent_task_utils.TaskThread, TestingTaskSpec],
    generate_coverage_report: bool
) -> Tuple[int, int, int, int]:
    """Run tests and parse coverage reports."""
    coverage_exclusions = load_coverage_exclusion_list(
        COVERAGE_EXCLUSION_LIST_PATH)

    # Check we ran all tests as expected.
    total_count = 0
    total_errors = 0
    total_failures = 0
    incomplete_coverage = 0
    for task in tasks:
        test_count = 0
        spec = task_to_taskspec[task]

        if not task.finished:
            print('CANCELED  %s' % spec.test_target)
        elif task.exception and isinstance(
                task.exception, subprocess.CalledProcessError):
            print('ERROR: Error raised by subprocess.\n%s' % task.exception)
            raise task.exception
        elif task.exception and 'No tests were run' in task.exception.args[0]:
            print('ERROR     %s: No tests found.' % spec.test_target)
        elif task.exception:
            exc_str = task.exception.args[0]
            print(exc_str[exc_str.find('='): exc_str.rfind('-')])

            tests_failed_regex_match = re.search(
                r'Test suite failed: ([0-9]+) tests run, ([0-9]+) errors, '
                '([0-9]+) failures',
                task.exception.args[0]
            )

            try:
                if not tests_failed_regex_match:
                    raise Exception(
                        'The error message did not match '
                        'tests_failed_regex_match'
                    )
                test_count = int(tests_failed_regex_match.group(1))
                errors = int(tests_failed_regex_match.group(2))
                failures = int(tests_failed_regex_match.group(3))
                total_errors += errors
                total_failures += failures
                print('FAILED    %s: %s errors, %s failures' % (
                    spec.test_target, errors, failures))
            except Exception as e:
                # There was an internal error, and the tests did not run (The
                # error message did not match `tests_failed_regex_match`).
                total_errors += 1
                print('')
                print('------------------------------------------------------')
                print('    WARNING: FAILED TO RUN %s' % spec.test_target)
                print('')
                print('    This is most likely due to an import error.')
                print('------------------------------------------------------')
                raise task.exception from e
        else:
            try:
                tests_run_regex_match = re.search(
                    r'Ran ([0-9]+) tests? in ([0-9\.]+)s',
                    task.task_results[0].get_report()[0])
                if not tests_run_regex_match:
                    raise Exception(
                        'The error message did not match tests_run_regex_match'
                    )
                test_count = int(tests_run_regex_match.group(1))
                test_time = float(tests_run_regex_match.group(2))
                print(
                    'SUCCESS   %s: %d tests (%.1f secs)' %
                    (spec.test_target, test_count, test_time))
            except Exception:
                print(
                    'An unexpected error occurred. '
                    'Task output:\n%s' % task.task_results[0].get_report()[0])
            if generate_coverage_report:
                coverage = task.task_results[0].get_report()[-2]
                if (
                        spec.test_target not in coverage_exclusions
                        and float(coverage) != 100.0):
                    incomplete_coverage += 1
        total_count += test_count

    return total_count, total_errors, total_failures, incomplete_coverage


def print_coverage_report(
    tasks: List[concurrent_task_utils.TaskThread],
    task_to_taskspec: Dict[concurrent_task_utils.TaskThread, TestingTaskSpec]
    ) -> int:
    """Run tests and parse coverage reports."""
    incomplete_coverage = 0
    coverage_exclusions = load_coverage_exclusion_list(
    COVERAGE_EXCLUSION_LIST_PATH)
    for task in tasks:
        if task.finished and not task.exception:
            coverage = task.task_results[0].get_report()[-2]
            spec = task_to_taskspec[task]
            if (
                    spec.test_target not in coverage_exclusions
                    and float(coverage) != 100.0):
                print('INCOMPLETE PER-FILE COVERAGE (%s%%): %s' % (
                    coverage, spec.test_target))
                incomplete_coverage += 1
                print(task.task_results[0].get_report()[-3])
    return incomplete_coverage


def main(args: Optional[List[str]] = None) -> None:
    """Run the tests."""
    parsed_args = _PARSER.parse_args(args=args)

    for directory in common.DIRS_TO_ADD_TO_SYS_PATH:
        if not os.path.exists(os.path.dirname(directory)):
            raise Exception('Directory %s does not exist.' % directory)

        # The directories should only be inserted starting at index 1. See
        # https://stackoverflow.com/a/10095099 and
        # https://stackoverflow.com/q/10095037 for more details.
        sys.path.insert(1, directory)

    # These environmental variables are required to allow Google Cloud Tasks to
    # operate in a local development environment without connecting to the
    # internet. These environment variables allow Cloud APIs to be instantiated.
    os.environ['CLOUDSDK_CORE_PROJECT'] = 'dummy-cloudsdk-project-id'
    os.environ['APPLICATION_ID'] = 'dummy-cloudsdk-project-id'

    if parsed_args.test_path and '.' in parsed_args.test_path:
        raise Exception('The delimiter in test_path should be a slash (/)')
    if parsed_args.test_target and '/' in parsed_args.test_target:
        raise Exception('The delimiter in test_target should be a dot (.)')

    with contextlib.ExitStack() as stack:
        if not feconf.OPPIA_IS_DOCKERIZED:
            stack.enter_context(
                servers.managed_cloud_datastore_emulator(clear_datastore=True))
            stack.enter_context(servers.managed_redis_server())
        if parsed_args.test_target:
            # Check if target either ends with '_test' which means a path to
            # a test file has been provided or has '_test.' in it which means
            # a path to a particular test class or a method in a test file has
            # been provided. If the path provided does not exist, error is
            # raised when we try to execute the tests.
            if (
                parsed_args.test_target.endswith('_test')
                or '_test.' in parsed_args.test_target
            ):
                all_test_targets = [parsed_args.test_target]
            else:
                print('')
                print('------------------------------------------------------')
                print(
                    'WARNING : test_target flag should point to the test file.')
                print('------------------------------------------------------')
                print('')
                time.sleep(3)
                print('Redirecting to its corresponding test file...')
                all_test_targets = [parsed_args.test_target + '_test']
        elif parsed_args.test_shard:
            validation_error = check_shards_match_tests(
                include_load_tests=True)
            if validation_error:
                raise Exception(validation_error)
            all_test_targets = get_all_test_targets_from_shard(
                parsed_args.test_shard)
        else:
            include_load_tests = not parsed_args.exclude_load_tests
            all_test_targets = get_all_test_targets_from_path(
                test_path=parsed_args.test_path,
                include_load_tests=include_load_tests)

        # Prepare tasks.
        max_concurrent_runs = 25
        concurrent_count = min(multiprocessing.cpu_count(), max_concurrent_runs)
        semaphore = threading.Semaphore(concurrent_count)

        task_to_taskspec = {}
        tasks = []
        for test_target in all_test_targets:
            test = TestingTaskSpec(
                test_target,
                parsed_args.generate_coverage_report)
            task = concurrent_task_utils.create_task(
                test.run, parsed_args.verbose, semaphore, name=test_target,
                report_enabled=False)
            task_to_taskspec[task] = test
            tasks.append(task)

        task_execution_failed = False
        try:
            concurrent_task_utils.execute_tasks(tasks, semaphore)
        except Exception:
            task_execution_failed = True

    print('')
    print('+------------------+')
    print('| SUMMARY OF TESTS |')
    print('+------------------+')
    print('')

    (
        total_count, total_errors, total_failures, incomplete_coverage
    ) = check_test_results(
        tasks, task_to_taskspec, parsed_args.generate_coverage_report)

    print('')
    if total_count == 0:
        raise Exception('WARNING: No tests were run.')

    print('Ran %s test%s in %s test class%s.' % (
        total_count, '' if total_count == 1 else 's',
        len(tasks), '' if len(tasks) == 1 else 's'))

    if total_errors or total_failures:
        print('(%s ERRORS, %s FAILURES)' % (total_errors, total_failures))
    else:
        print('All tests passed.')
        # Add one line for aesthetics.
        print('')

    if task_execution_failed:
        raise Exception('Task execution failed.')

    if total_errors or total_failures:
        raise Exception(
            '%s errors, %s failures' % (total_errors, total_failures))

    if parsed_args.generate_coverage_report:
        print_coverage_report(tasks, task_to_taskspec)

    if incomplete_coverage:
        raise Exception(
            '%s tests incompletely cover associated code files.' %
            incomplete_coverage)

    if parsed_args.generate_coverage_report:
        subprocess.check_call([sys.executable, '-m', 'coverage', 'combine'])
        report_stdout, coverage = check_coverage(True)
        print(report_stdout)

        if (coverage != 100
                and not parsed_args.ignore_coverage):
            raise Exception('Backend test coverage is not 100%')

    print('')
    print('Done!')


def check_coverage(
    combine: bool,
    data_file: Optional[str] = None,
    include: Optional[Tuple[str, ...]] = tuple()
) -> Tuple[str, float]:
    """Check code coverage of backend tests.

    Args:
        combine: bool. Whether to run `coverage combine` first to
            combine coverage data from multiple test runs.
        data_file: str|None. Path to the coverage data file to use.
        include: tuple(str). Paths of code files to consider when
            computing coverage. If an empty tuple is provided, all code
            files will be used.

    Returns:
        str, float. Tuple of the coverage report and the coverage
        percentage.

    Raises:
        RuntimeError. Subprocess failure.
    """
    if combine:
        combine_process = subprocess.run(
            [sys.executable, '-m', 'coverage', 'combine'],
            capture_output=True, encoding='utf-8', check=False)
        no_combine = combine_process.stdout.strip() == 'No data to combine'
        if (combine_process.returncode and not no_combine):
            raise RuntimeError(
                'Failed to combine coverage because subprocess failed.'
                '\n%s' % combine_process)

    cmd = [
        sys.executable, '-m', 'coverage', 'report',
         '--omit="%s*","third_party/*","/usr/share/*"'
         % common.OPPIA_TOOLS_DIR, '--show-missing']
    if include:
        cmd.append('--include=%s' % ','.join(include))

    env = os.environ.copy()
    if data_file:
        env['COVERAGE_FILE'] = data_file

    process = subprocess.run(
        cmd, capture_output=True, encoding='utf-8', env=env,
        check=False)
    if process.stdout.strip() == 'No data to report.':
        # File under test is exempt from coverage according to the
        # --omit flag or .coveragerc.
        coverage = 100.0
    elif process.returncode:
        raise RuntimeError(
            'Failed to calculate coverage because subprocess failed. %s'
            % process
        )
    else:
        coverage_result = re.search(
            r'TOTAL\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(?P<total>\d+)%\s+',
            process.stdout)
        coverage = (
            float(coverage_result.group('total')) if coverage_result else 0.0
        )

    return process.stdout, coverage


if __name__ == '__main__': # pragma: no cover
    main()
