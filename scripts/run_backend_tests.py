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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import argparse
import importlib
import inspect
import json
import multiprocessing
import os
import re
import subprocess
import sys
import threading
import time
import unittest


from . import install_third_party_libs
# This installs third party libraries before importing other files or importing
# libraries that use the builtins python module (e.g. build, python_utils).
install_third_party_libs.main()

import python_utils # isort:skip  pylint: disable=wrong-import-position, wrong-import-order
from . import common # isort:skip  pylint: disable=wrong-import-position, wrong-import-order
from . import concurrent_task_utils # isort:skip  pylint: disable=wrong-import-position, wrong-import-order

COVERAGE_DIR = os.path.join(
    os.getcwd(), os.pardir, 'oppia_tools',
    'coverage-%s' % common.COVERAGE_VERSION)
COVERAGE_MODULE_PATH = os.path.join(
    os.getcwd(), os.pardir, 'oppia_tools',
    'coverage-%s' % common.COVERAGE_VERSION, 'coverage')

TEST_RUNNER_PATH = os.path.join(os.getcwd(), 'core', 'tests', 'gae_suite.py')
# This should be the same as core.test_utils.LOG_LINE_PREFIX.
LOG_LINE_PREFIX = 'LOG_INFO_TEST: '
# This path points to a JSON file that defines which modules belong to
# each shard.
SHARDS_SPEC_PATH = os.path.join(
    os.getcwd(), 'scripts', 'backend_test_shards.json')
SHARDS_WIKI_LINK = (
    'https://github.com/oppia/oppia/wiki/Writing-backend-tests#common-errors')
_LOAD_TESTS_DIR = os.path.join(os.getcwd(), 'core', 'tests', 'load_tests')

_PARSER = argparse.ArgumentParser(
    description="""
Run this script from the oppia root folder:
    python -m scripts.run_backend_tests
IMPORTANT: Only one of --test_path,  --test_target, and --test_shard
should be specified.
""")

_EXCLUSIVE_GROUP = _PARSER.add_mutually_exclusive_group()
_EXCLUSIVE_GROUP.add_argument(
    '--test_target',
    help='optional dotted module name of the test(s) to run',
    type=python_utils.UNICODE)
_EXCLUSIVE_GROUP.add_argument(
    '--test_path',
    help='optional subdirectory path containing the test(s) to run',
    type=python_utils.UNICODE)
_EXCLUSIVE_GROUP.add_argument(
    '--test_shard',
    help='optional name of shard to run',
    type=python_utils.UNICODE)
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


def run_shell_cmd(exe, stdout=subprocess.PIPE, stderr=subprocess.PIPE):
    """Runs a shell command and captures the stdout and stderr output.

    If the cmd fails, raises Exception. Otherwise, returns a string containing
    the concatenation of the stdout and stderr logs.
    """
    p = subprocess.Popen(exe, stdout=stdout, stderr=stderr)
    last_stdout_str, last_stderr_str = p.communicate()
    # Converting to unicode to stay compatible with the rest of the strings.
    last_stdout_str = last_stdout_str.decode(encoding='utf-8')
    last_stderr_str = last_stderr_str.decode(encoding='utf-8')
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


class TestingTaskSpec(python_utils.OBJECT):
    """Executes a set of tests given a test class name."""

    def __init__(self, test_target, generate_coverage_report):
        self.test_target = test_target
        self.generate_coverage_report = generate_coverage_report

    def run(self):
        """Runs all tests corresponding to the given test target."""
        test_target_flag = '--test_target=%s' % self.test_target
        if self.generate_coverage_report:
            exc_list = [
                sys.executable, COVERAGE_MODULE_PATH, 'run', '-p',
                TEST_RUNNER_PATH, test_target_flag]
        else:
            exc_list = [sys.executable, TEST_RUNNER_PATH, test_target_flag]

        result = run_shell_cmd(exc_list)

        return [concurrent_task_utils.TaskResult(
            None, None, None, [result])]


def _get_all_test_targets_from_path(test_path=None, include_load_tests=True):
    """Returns a list of test targets for all classes under test_path
    containing tests.
    """
    def _get_test_target_classes(path):
        """Returns a list of all test classes in a given test file path.

        Args:
            path: str. The path of the test file from which all test classes
                are to be extracted.

        Returns:
            list. A list of all test classes in a given test file path.
        """
        class_names = []
        test_target_path = os.path.relpath(
            path, os.getcwd())[:-3].replace('/', '.')
        python_module = importlib.import_module(test_target_path)
        for name, clazz in inspect.getmembers(
                python_module, predicate=inspect.isclass):
            if unittest.TestCase in inspect.getmro(clazz):
                class_names.append(name)

        return [
            '%s.%s' % (test_target_path, class_name)
            for class_name in class_names]

    base_path = os.path.join(os.getcwd(), test_path or '')
    result = []
    excluded_dirs = [
        '.git', 'third_party', 'core/tests', 'node_modules', 'venv']
    for root in os.listdir(base_path):
        if any([s in root for s in excluded_dirs]):
            continue
        if root.endswith('_test.py'):
            result = result + (
                _get_test_target_classes(os.path.join(base_path, root)))
        for subroot, _, files in os.walk(os.path.join(base_path, root)):
            if _LOAD_TESTS_DIR in subroot and include_load_tests:
                for f in files:
                    if f.endswith('_test.py'):
                        result = result + (
                            _get_test_target_classes(os.path.join(subroot, f)))

            for f in files:
                if (f.endswith('_test.py') and
                        os.path.join('core', 'tests') not in subroot):
                    result = result + (
                        _get_test_target_classes(os.path.join(subroot, f)))

    return result


def _get_all_test_targets_from_shard(shard_name):
    """Find all test modules in a shard.

    Args:
        shard_name: str. The name of the shard.

    Returns:
        list(str). The dotted module names that belong to the shard.
    """
    with python_utils.open_file(SHARDS_SPEC_PATH, 'r') as shards_file:
        shards_spec = json.load(shards_file)
    return shards_spec[shard_name]


def _check_shards_match_tests(include_load_tests=True):
    """Check whether the test shards match the tests that exist.

    Args:
        include_load_tests: bool. Whether to include load tests.

    Returns:
        str. A description of any problems found, or an empty string if
        the shards match the tests.
    """
    with python_utils.open_file(SHARDS_SPEC_PATH, 'r') as shards_file:
        shards_spec = json.load(shards_file)
    shard_modules = sorted([
        module for shard in shards_spec.values() for module in shard])
    test_classes = _get_all_test_targets_from_path(
        include_load_tests=include_load_tests)
    test_modules_set = set()
    for test_class in test_classes:
        last_dot_index = test_class.rfind('.')
        module_name = test_class[:last_dot_index]
        test_modules_set.add(module_name)
    test_modules = sorted(test_modules_set)
    if test_modules == shard_modules:
        return ''
    if len(set(shard_modules)) != len(shard_modules):
        # A module is duplicated, so we find the duplicate.
        for module in shard_modules:
            if shard_modules.count(module) != 1:
                return '{} duplicated in {}'.format(
                    module, SHARDS_SPEC_PATH)
        raise Exception('Failed to find  module duplicated in shards.')
    # Since there are no duplicates among the shards, we know the
    # problem must be a module in one list but not the other.
    shard_modules_set = set(shard_modules)
    shard_extra = shard_modules_set - test_modules_set
    if shard_extra:
        return 'Modules {} in shards not found. See {}.'.format(
            shard_extra, SHARDS_WIKI_LINK)
    test_extra = test_modules_set - shard_modules_set
    assert test_extra
    return 'Modules {} not in shards. See {}.'.format(
        test_extra, SHARDS_WIKI_LINK)


def main(args=None):
    """Run the tests."""
    parsed_args = _PARSER.parse_args(args=args)

    for directory in common.DIRS_TO_ADD_TO_SYS_PATH:
        if not os.path.exists(os.path.dirname(directory)):
            raise Exception('Directory %s does not exist.' % directory)

        # The directories should only be inserted starting at index 1. See
        # https://stackoverflow.com/a/10095099 and
        # https://stackoverflow.com/q/10095037 for more details.
        sys.path.insert(1, directory)

    common.fix_third_party_imports()

    if parsed_args.generate_coverage_report:
        python_utils.PRINT(
            'Checking whether coverage is installed in %s'
            % common.OPPIA_TOOLS_DIR)
        if not os.path.exists(
                os.path.join(
                    common.OPPIA_TOOLS_DIR,
                    'coverage-%s' % common.COVERAGE_VERSION)):
            raise Exception(
                'Coverage is not installed, please run the start script.')

        pythonpath_components = [COVERAGE_DIR]
        if os.environ.get('PYTHONPATH'):
            pythonpath_components.append(os.environ.get('PYTHONPATH'))

        os.environ['PYTHONPATH'] = os.pathsep.join(pythonpath_components)

    test_specs_provided = sum([
        1 if argument else 0
        for argument in (
            parsed_args.test_target, parsed_args.test_path,
            parsed_args.test_shard)
    ])

    if test_specs_provided > 1:
        raise Exception(
            'At most one of test_path, test_target and test_shard may '
            'be specified.')
    if parsed_args.test_path and '.' in parsed_args.test_path:
        raise Exception('The delimiter in test_path should be a slash (/)')
    if parsed_args.test_target and '/' in parsed_args.test_target:
        raise Exception('The delimiter in test_target should be a dot (.)')

    if parsed_args.test_target:
        if '_test' in parsed_args.test_target:
            all_test_targets = [parsed_args.test_target]
        else:
            python_utils.PRINT('')
            python_utils.PRINT(
                '---------------------------------------------------------')
            python_utils.PRINT(
                'WARNING : test_target flag should point to the test file.')
            python_utils.PRINT(
                '---------------------------------------------------------')
            python_utils.PRINT('')
            time.sleep(3)
            python_utils.PRINT('Redirecting to its corresponding test file...')
            all_test_targets = [parsed_args.test_target + '_test']
    elif parsed_args.test_shard:
        validation_error = _check_shards_match_tests(
            include_load_tests=False)
        if validation_error:
            raise Exception(validation_error)
        all_test_targets = _get_all_test_targets_from_shard(
            parsed_args.test_shard)
    else:
        include_load_tests = not parsed_args.exclude_load_tests
        all_test_targets = _get_all_test_targets_from_path(
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
            test_target, parsed_args.generate_coverage_report)
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

    for task in tasks:
        if task.exception:
            concurrent_task_utils.log(
                python_utils.convert_to_bytes(task.exception.args[0]))

    python_utils.PRINT('')
    python_utils.PRINT('+------------------+')
    python_utils.PRINT('| SUMMARY OF TESTS |')
    python_utils.PRINT('+------------------+')
    python_utils.PRINT('')

    # Check we ran all tests as expected.
    total_count = 0
    total_errors = 0
    total_failures = 0
    for task in tasks:
        spec = task_to_taskspec[task]

        if not task.finished:
            python_utils.PRINT('CANCELED  %s' % spec.test_target)
            test_count = 0
        elif (task.exception and
              'No tests were run' in python_utils.convert_to_bytes(
                  task.exception.args[0])):
            python_utils.PRINT(
                'ERROR     %s: No tests found.' % spec.test_target)
            test_count = 0
        elif task.exception:
            exc_str = python_utils.convert_to_bytes(task.exception.args[0])
            python_utils.PRINT(exc_str[exc_str.find('='): exc_str.rfind('-')])

            tests_failed_regex_match = re.search(
                r'Test suite failed: ([0-9]+) tests run, ([0-9]+) errors, '
                '([0-9]+) failures',
                python_utils.convert_to_bytes(task.exception.args[0]))

            try:
                test_count = int(tests_failed_regex_match.group(1))
                errors = int(tests_failed_regex_match.group(2))
                failures = int(tests_failed_regex_match.group(3))
                total_errors += errors
                total_failures += failures
                python_utils.PRINT('FAILED    %s: %s errors, %s failures' % (
                    spec.test_target, errors, failures))
            except AttributeError:
                # There was an internal error, and the tests did not run (The
                # error message did not match `tests_failed_regex_match`).
                test_count = 0
                total_errors += 1
                python_utils.PRINT('')
                python_utils.PRINT(
                    '------------------------------------------------------')
                python_utils.PRINT(
                    '    WARNING: FAILED TO RUN %s' % spec.test_target)
                python_utils.PRINT('')
                python_utils.PRINT(
                    '    This is most likely due to an import error.')
                python_utils.PRINT(
                    '------------------------------------------------------')
        else:
            try:
                tests_run_regex_match = re.search(
                    r'Ran ([0-9]+) tests? in ([0-9\.]+)s',
                    task.task_results[0].get_report()[0])
                test_count = int(tests_run_regex_match.group(1))
                test_time = float(tests_run_regex_match.group(2))
                python_utils.PRINT(
                    'SUCCESS   %s: %d tests (%.1f secs)' %
                    (spec.test_target, test_count, test_time))
            except Exception:
                python_utils.PRINT(
                    'An unexpected error occurred. '
                    'Task output:\n%s' % task.task_results[0].get_report()[0])

        total_count += test_count

    python_utils.PRINT('')
    if total_count == 0:
        raise Exception('WARNING: No tests were run.')

    python_utils.PRINT('Ran %s test%s in %s test class%s.' % (
        total_count, '' if total_count == 1 else 's',
        len(tasks), '' if len(tasks) == 1 else 'es'))

    if total_errors or total_failures:
        python_utils.PRINT(
            '(%s ERRORS, %s FAILURES)' % (total_errors, total_failures))
    else:
        python_utils.PRINT('All tests passed.')

    if task_execution_failed:
        raise Exception('Task execution failed.')
    elif total_errors or total_failures:
        raise Exception(
            '%s errors, %s failures' % (total_errors, total_failures))

    if parsed_args.generate_coverage_report:
        subprocess.check_call([sys.executable, COVERAGE_MODULE_PATH, 'combine'])
        process = subprocess.Popen(
            [sys.executable, COVERAGE_MODULE_PATH, 'report',
             '--omit="%s*","third_party/*","/usr/share/*"'
             % common.OPPIA_TOOLS_DIR, '--show-missing'],
            stdout=subprocess.PIPE)

        report_stdout, _ = process.communicate()
        python_utils.PRINT(report_stdout)

        coverage_result = re.search(
            r'TOTAL\s+(\d+)\s+(\d+)\s+(?P<total>\d+)%\s+', report_stdout)
        if (coverage_result.group('total') != '100'
                and not parsed_args.ignore_coverage):
            raise Exception('Backend test coverage is not 100%')

    python_utils.PRINT('')
    python_utils.PRINT('Done!')


if __name__ == '__main__':
    main()
