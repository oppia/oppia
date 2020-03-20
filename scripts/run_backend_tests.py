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

    --generate_coverage_report generates a coverage report as part of the final
        test output (but it makes the tests slower).

Note: If you've made some changes and tests are failing to run at all, this
might mean that you have introduced a circular dependency (e.g. module A
imports module B, which imports module C, which imports module A). This needs
to be fixed before the tests will run.
"""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import argparse
import datetime
import importlib
import inspect
import multiprocessing
import os
import re
import subprocess
import sys
import threading
import time

import python_utils

from . import common
from . import setup
from . import setup_gae


DIRS_TO_ADD_TO_SYS_PATH = [
    os.path.join(common.OPPIA_TOOLS_DIR, 'pylint-1.9.4'),
    os.path.join(
        common.OPPIA_TOOLS_DIR, 'google_appengine_1.9.67', 'google_appengine'),
    os.path.join(common.OPPIA_TOOLS_DIR, 'webtest-2.0.33'),
    os.path.join(
        common.OPPIA_TOOLS_DIR, 'google_appengine_1.9.67', 'google_appengine',
        'lib', 'webob_0_9'),
    os.path.join(common.OPPIA_TOOLS_DIR, 'browsermob-proxy-0.7.1'),
    os.path.join(common.OPPIA_TOOLS_DIR, 'selenium-3.13.0'),
    os.path.join(common.OPPIA_TOOLS_DIR, 'Pillow-6.0.0'),
    os.path.join(common.OPPIA_TOOLS_DIR, 'psutil-%s' % common.PSUTIL_VERSION),
    common.CURR_DIR,
    os.path.join(common.THIRD_PARTY_DIR, 'backports.functools_lru_cache-1.5'),
    os.path.join(common.THIRD_PARTY_DIR, 'beautifulsoup4-4.7.1'),
    os.path.join(common.THIRD_PARTY_DIR, 'bleach-3.1.0'),
    os.path.join(common.THIRD_PARTY_DIR, 'callbacks-0.3.0'),
    os.path.join(common.THIRD_PARTY_DIR, 'gae-cloud-storage-1.9.22.1'),
    os.path.join(common.THIRD_PARTY_DIR, 'gae-mapreduce-1.9.22.0'),
    os.path.join(common.THIRD_PARTY_DIR, 'gae-pipeline-1.9.22.1'),
    os.path.join(common.THIRD_PARTY_DIR, 'graphy-1.0.0'),
    os.path.join(common.THIRD_PARTY_DIR, 'html5lib-python-1.0.1'),
    os.path.join(common.THIRD_PARTY_DIR, 'mutagen-1.42.0'),
    os.path.join(common.THIRD_PARTY_DIR, 'simplejson-3.16.0'),
    os.path.join(common.THIRD_PARTY_DIR, 'six-1.12.0'),
    os.path.join(common.THIRD_PARTY_DIR, 'soupsieve-1.9.1'),
    os.path.join(common.THIRD_PARTY_DIR, 'webencodings-0.5.1'),
]

COVERAGE_DIR = os.path.join(
    os.getcwd(), os.pardir, 'oppia_tools',
    'coverage-%s' % common.COVERAGE_VERSION)
COVERAGE_MODULE_PATH = os.path.join(
    os.getcwd(), os.pardir, 'oppia_tools',
    'coverage-%s' % common.COVERAGE_VERSION, 'coverage')

TEST_RUNNER_PATH = os.path.join(os.getcwd(), 'core', 'tests', 'gae_suite.py')
LOG_LOCK = threading.Lock()
ALL_ERRORS = []
# This should be the same as core.test_utils.LOG_LINE_PREFIX.
LOG_LINE_PREFIX = 'LOG_INFO_TEST: '
_LOAD_TESTS_DIR = os.path.join(os.getcwd(), 'core', 'tests', 'load_tests')

MAX_CONCURRENT_RUNS = 25

_PARSER = argparse.ArgumentParser(description="""
Run this script from the oppia root folder:
    python -m scripts.run_backend_tests
IMPORTANT: Only one of --test_path and --test_target should be specified.
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
_PARSER.add_argument(
    '--generate_coverage_report',
    help='optional; if specified, generates a coverage report',
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


def log(message, show_time=False):
    """Logs a message to the terminal.

    If show_time is True, prefixes the message with the current time.
    """
    with LOG_LOCK:
        if show_time:
            python_utils.PRINT(
                datetime.datetime.utcnow().strftime('%H:%M:%S'), message)
        else:
            python_utils.PRINT(message)


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
        log('')
        for line in last_stdout:
            if line.startswith(LOG_LINE_PREFIX):
                log('INFO: %s' % line[len(LOG_LINE_PREFIX):])
        log('')

    result = '%s%s' % (last_stdout_str, last_stderr_str)

    if p.returncode != 0:
        raise Exception('Error %s\n%s' % (p.returncode, result))

    return result


class TaskThread(threading.Thread):
    """Runs a task in its own thread."""

    def __init__(self, func, verbose, semaphore, name=None):
        super(TaskThread, self).__init__()
        self.func = func
        self.output = None
        self.exception = None
        self.verbose = verbose
        self.name = name
        self.semaphore = semaphore
        self.finished = False

    def run(self):
        try:
            self.output = self.func()
            if self.verbose:
                log('LOG %s:' % self.name, show_time=True)
                log(self.output)
                log('----------------------------------------')
            log('FINISHED %s: %.1f secs' %
                (self.name, time.time() - self.start_time), show_time=True)
        except Exception as e:
            self.exception = e
            if 'KeyboardInterrupt' not in python_utils.convert_to_bytes(
                    self.exception.args[0]):
                log('ERROR %s: %.1f secs' %
                    (self.name, time.time() - self.start_time), show_time=True)
        finally:
            self.semaphore.release()
            self.finished = True


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

        return run_shell_cmd(exc_list)


def _check_all_tasks(tasks):
    """Checks the results of all tasks."""
    running_tasks_data = []

    for task in tasks:
        if task.isAlive():
            running_tasks_data.append('  %s (started %s)' % (
                task.name,
                time.strftime('%H:%M:%S', time.localtime(task.start_time))
            ))

        if task.exception:
            ALL_ERRORS.append(task.exception)

    if running_tasks_data:
        log('----------------------------------------')
        log('Tasks still running:')
        for task_details in running_tasks_data:
            log(task_details)


def _execute_tasks(tasks, semaphore):
    """Starts all tasks and checks the results.
    Runs no more than the allowable limit defined in the semaphore.

    Args:
        tasks: list(TestingTaskSpec). The tasks to run.
        semaphore: threading.Semaphore. The object that controls how many tasks
            can run at any time.
    """
    remaining_tasks = [] + tasks
    currently_running_tasks = []

    while remaining_tasks:
        task = remaining_tasks.pop()
        semaphore.acquire()
        task.start()
        task.start_time = time.time()
        currently_running_tasks.append(task)

        if len(remaining_tasks) % 5 == 0:
            if remaining_tasks:
                log('----------------------------------------')
                log('Number of unstarted tasks: %s' % len(remaining_tasks))
            _check_all_tasks(currently_running_tasks)
        log('----------------------------------------')

    for task in currently_running_tasks:
        task.join()

    _check_all_tasks(currently_running_tasks)


def _get_all_test_targets(test_path=None, include_load_tests=True):
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
            all_base_classes = [base_class.__name__ for base_class in
                                (inspect.getmro(clazz))]
            # Check that it is a subclass of 'AppEngineTestBase'.
            if 'AppEngineTestBase' in all_base_classes:
                class_names.append(name)

        return [
            '%s.%s' % (test_target_path, class_name)
            for class_name in class_names]

    base_path = os.path.join(os.getcwd(), test_path or '')
    result = []
    excluded_dirs = ['.git', 'third_party', 'core/tests', 'node_modules']
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


def main(args=None):
    """Run the tests."""
    parsed_args = _PARSER.parse_args(args=args)

    setup.main(args=[])
    setup_gae.main(args=[])

    for directory in DIRS_TO_ADD_TO_SYS_PATH:
        if not os.path.exists(os.path.dirname(directory)):
            raise Exception('Directory %s does not exist.' % directory)

        # The directories should only be inserted starting at index 1. See
        # https://stackoverflow.com/a/10095099 and
        # https://stackoverflow.com/q/10095037 for more details.
        sys.path.insert(1, directory)

    import dev_appserver
    dev_appserver.fix_sys_path()

    if parsed_args.generate_coverage_report:
        python_utils.PRINT(
            'Checking whether coverage is installed in %s'
            % common.OPPIA_TOOLS_DIR)
        if not os.path.exists(
                os.path.join(
                    common.OPPIA_TOOLS_DIR,
                    'coverage-%s' % common.COVERAGE_VERSION)):
            raise Exception('Coverage is not installed, please run the start '
                            'script.')

        pythonpath_components = [COVERAGE_DIR]
        if os.environ.get('PYTHONPATH'):
            pythonpath_components.append(os.environ.get('PYTHONPATH'))

        os.environ['PYTHONPATH'] = os.pathsep.join(pythonpath_components)

    if parsed_args.test_target and parsed_args.test_path:
        raise Exception('At most one of test_path and test_target '
                        'should be specified.')
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
    else:
        include_load_tests = not parsed_args.exclude_load_tests
        all_test_targets = _get_all_test_targets(
            test_path=parsed_args.test_path,
            include_load_tests=include_load_tests)

    # Prepare tasks.
    concurrent_count = min(multiprocessing.cpu_count(), MAX_CONCURRENT_RUNS)
    semaphore = threading.Semaphore(concurrent_count)

    task_to_taskspec = {}
    tasks = []
    for test_target in all_test_targets:
        test = TestingTaskSpec(
            test_target, parsed_args.generate_coverage_report)
        task = TaskThread(
            test.run, parsed_args.verbose, semaphore, name=test_target)
        task_to_taskspec[task] = test
        tasks.append(task)

    task_execution_failed = False
    try:
        _execute_tasks(tasks, semaphore)
    except Exception:
        task_execution_failed = True

    for task in tasks:
        if task.exception:
            log(python_utils.convert_to_bytes(task.exception.args[0]))

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
                    r'Ran ([0-9]+) tests? in ([0-9\.]+)s', task.output)
                test_count = int(tests_run_regex_match.group(1))
                test_time = float(tests_run_regex_match.group(2))
                python_utils.PRINT(
                    'SUCCESS   %s: %d tests (%.1f secs)' %
                    (spec.test_target, test_count, test_time))
            except Exception:
                python_utils.PRINT(
                    'An unexpected error occurred. '
                    'Task output:\n%s' % task.output)

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
        if coverage_result.group('total') != '100':
            raise Exception('Backend test coverage is not 100%')

    python_utils.PRINT('')
    python_utils.PRINT('Done!')


if __name__ == '__main__':
    main()
