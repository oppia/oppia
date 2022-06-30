# coding: utf-8
#
# Copyright 2020 The Oppia Authors. All Rights Reserved.
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

"""Script for running tests for custom eslint checks."""

from __future__ import annotations

import os
import re
import subprocess
import sys

from scripts import common


def main() -> None:
    """Run the tests."""
    node_path = os.path.join(common.NODE_PATH, 'bin', 'node')
    nyc_path = os.path.join('node_modules', 'nyc', 'bin', 'nyc.js')
    mocha_path = os.path.join('node_modules', 'mocha', 'bin', 'mocha')
    filepath = 'scripts/linters/custom_eslint_checks/rules/'
    proc_args = [node_path, nyc_path, mocha_path, filepath]

    proc = subprocess.Popen(
        proc_args, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

    encoded_tests_stdout, encoded_tests_stderr = proc.communicate()
    # Standard and error output is in bytes, we need to decode the line to
    # print it.
    tests_stdout = encoded_tests_stdout.decode('utf-8')
    tests_stderr = encoded_tests_stderr.decode('utf-8')
    if tests_stderr:
        print(tests_stderr)
        sys.exit(1)
    print(tests_stdout)
    if 'failing' in tests_stdout:
        print('---------------------------')
        print('Tests not passed')
        print('---------------------------')
        sys.exit(1)
    else:
        print('---------------------------')
        print('All tests passed')
        print('---------------------------')

    coverage_result = re.search(
        r'All files\s*\|\s*(?P<stmts>\S+)\s*\|\s*(?P<branch>\S+)\s*\|\s*'
        r'(?P<funcs>\S+)\s*\|\s*(?P<lines>\S+)\s*\|\s*', tests_stdout)
    # Here coverage_result variable may contain None value which can give error
    # while accessing methods from the variable. Hence added the below assert.
    assert coverage_result is not None
    if (coverage_result.group('stmts') != '100' or
            coverage_result.group('branch') != '100' or
            coverage_result.group('funcs') != '100' or
            coverage_result.group('lines') != '100'):
        raise Exception('Eslint test coverage is not 100%')


if __name__ == '__main__':  # pragma: no cover
    main()
