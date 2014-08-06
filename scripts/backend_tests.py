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

    bash scripts/test.sh
"""

import argparse
import datetime
import os
import re
import subprocess
import threading
import time

import common


EXPECTED_TEST_COUNT = 320

COVERAGE_PATH = os.path.join(os.getcwd(), '..', 'oppia_tools', 'coverage-3.6', 'coverage')
TEST_RUNNER_PATH = os.path.join(os.getcwd(), 'core', 'tests', 'gae_suite.py')
LOG_LOCK = threading.Lock()
ALL_ERRORS = []

_PARSER = argparse.ArgumentParser()
# Note that the 'coverage report' option slows the tests down considerably, so
# it is turned off by default.
_PARSER.add_argument(
    '--generate_coverage_report',
    help='optional; if specified, generates a coverage report',
    action='store_true')
_PARSER.add_argument(
    '--test_target',
    help='optional dotted module name of the test(s) to run',
    type=str)
_PARSER.add_argument(
    '--test_path',
    help='optional subdirectory path containing the test(s) to run',
    type=str)
_PARSER.add_argument(
    '--omit_slow_tests',
    help='whether to omit tests that are flagged as slow',
    action='store_true')


def log(message, show_datetime=True):
    with LOG_LOCK:
        if show_datetime:
            line = '%s %s' % (
                datetime.datetime.now().strftime('%Y/%m/%d %H:%M:%S'), message)
        else:
            line = unicode(message)
        print line


def run_shell_cmd(
        exe, strict=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE):
    """Runs a shell command and captures the stdout and stderr output."""
    p = subprocess.Popen(exe, stdout=stdout, stderr=stderr)
    last_stdout, last_stderr = p.communicate()
    result = ''.join(list(last_stdout) + list(last_stderr))

    if p.returncode != 0:
        print result

    if p.returncode != 0 and strict:
        raise Exception('Error %s\n%s' % (p.returncode, result))
    return p.returncode, result


class TaskThread(threading.Thread):
    """Runs a task in a separate thread."""

    def __init__(self, func, name=None):
        super(TaskThread, self).__init__()
        self.func = func
        self.exception = None
        self.name = name

    @classmethod
    def start_all_tasks(cls, tasks):
        """Starts all tasks."""
        for task in tasks:
            task.start()
            task.start_time = time.time()

    @classmethod
    def check_all_tasks(cls, tasks):
        """Checks results of all tasks; fails on the first exception found."""
        first_error = None
        first_failed_task = None

        running_tasks_data = []

        for task in tasks:
            if task.isAlive():
                running_tasks_data.append(
                    '  %s (started %s)' % (task.name, time.strftime('%H:%M:%S', time.localtime(task.start_time))))

            if task.exception:
                first_error = task.exception
                ALL_ERRORS.append(task.exception)
                first_failed_task = task

        if running_tasks_data:
            log('Tasks still running:')
            for task_details in running_tasks_data:
                log(task_details)

    @classmethod
    def execute_task_list(cls, tasks):
        """Starts all tasks and checks the results."""
        cls.start_all_tasks(tasks)
        # Note that the main thread (i.e. the original process that runs this script) is
        # also counted in threading.active_count().
        while threading.active_count() > 1:
            time.sleep(10)
            log('Number of active test threads: %s' % (threading.active_count() - 1))
            cls.check_all_tasks(tasks)

    def run(self):
        try:
            self.func()
            log('FINISHED %s: %.1f secs' % (self.name, time.time() - self.start_time))
        except Exception as e:
            self.exception = e
            log('ERROR %s: %.1f secs' % (self.name, time.time() - self.start_time))


class FunctionalTestTask(object):
    """Executes a set of tests given a test class name."""

    def __init__(self, test_class_name, generate_coverage_report):
        self.test_class_name = test_class_name
        self.generate_coverage_report = generate_coverage_report

    def run(self):
        test_target_flag = '--test_target=%s' % self.test_class_name

        if self.generate_coverage_report:
            exc_list = [
                'python', COVERAGE_PATH, '-xp', TEST_RUNNER_PATH,
                test_target_flag]
        else:
            exc_list = ['python', TEST_RUNNER_PATH, test_target_flag]

        unused_result, self.output = run_shell_cmd(exc_list)


def _convert_to_test_target(path):
    # Remove .py suffix. Replace all / with .
    return os.path.relpath(path, os.getcwd())[:-3].replace('/', '.')


def main():
    # Check that the current directory is 'oppia/'.
    common.require_cwd_to_be_oppia()

    parsed_args = _PARSER.parse_args()
    generate_coverage_report = parsed_args.generate_coverage_report

    ALL_TEST_PATHS = []

    for root in os.listdir(os.path.join(os.getcwd())):
        if any([s in root for s in ['.git', 'third_party', 'core/tests']]):
            continue

        if root.endswith('_test.py'):
            ALL_TEST_PATHS.append(_convert_to_test_target(root))
        for r, d, files in os.walk(os.path.join(os.getcwd(), root)):
            for f in files:
                if f.endswith('_test.py') and os.path.join('core', 'tests') not in r:
                    ALL_TEST_PATHS.append(_convert_to_test_target(os.path.join(r, f)))

    # Prepare tasks.
    task_to_test = {}
    tasks = []
    for test_class_name in ALL_TEST_PATHS:
        test = FunctionalTestTask(test_class_name, generate_coverage_report)
        task = TaskThread(test.run, name='%s' % test_class_name)
        task_to_test[task] = test
        tasks.append(task)

    # Execute tasks.
    try:
        TaskThread.execute_task_list(tasks)
    except:
        for task in tasks:
            if task.exception:
                exc_str = unicode(task.exception)
                log(exc_str[exc_str.find('='):exc_str.rfind('-')], show_datetime=False)

        print 'Tests had errors.'
        raise

    # Check we ran all tests as expected.
    total_count = 0
    for task in tasks:
        if task.exception:
            exc_str = unicode(task.exception)
            log(exc_str[exc_str.find('=') : exc_str.rfind('-')], show_datetime=False)
            continue

        test = task_to_test[task]

        search_result = re.search(r'Ran ([0-9]+) tests? in ([0-9\.]+)s', test.output)
        if not search_result:
            print test.test_class_name
            print test.output
            test_count = 0
            print 'NO TESTS RUN: %s' % test.test_class_name
        else:
            test_count = int(search_result.group(1))
            test_time = float(search_result.group(2))
            print 'SUCCESS %s: %d tests (%.1f secs)' % (test.test_class_name, test_count, test_time)

        if test_count == 0:
            log('%s\n\nERROR: ran unexpected test class %s' % (
                test.output, test.test_class_name))

        total_count += test_count

    log('Ran %s tests in %s test classes.' % (total_count, len(tasks)),
        show_datetime=False)
    if (parsed_args.test_path is None and parsed_args.test_target is None
            and not parsed_args.omit_slow_tests
            and total_count != EXPECTED_TEST_COUNT):
        raise Exception(
            'Error: Expected %s tests to be run, not %s.' %
            (EXPECTED_TEST_COUNT, total_count))
   

if __name__ == '__main__':
    main()
