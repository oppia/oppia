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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import os
import re
import subprocess
import sys

import python_utils
from scripts import common


def main():
    """Run the tests."""
    node_path = os.path.join(common.NODE_PATH, 'bin', 'node')
    nyc_path = os.path.join('node_modules', 'nyc', 'bin', 'nyc.js')
    mocha_path = os.path.join('node_modules', 'mocha', 'bin', 'mocha')
    filepath = 'scripts/linters/custom_eslint_checks/rules/'
    proc_args = [node_path, nyc_path, mocha_path, filepath]

    proc = subprocess.Popen(
        proc_args, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

    encoded_tests_stdout, encoded_tests_stderr = proc.communicate()
    tests_stdout = encoded_tests_stdout.decode(encoding='utf-8')
    tests_stderr = encoded_tests_stderr.decode(encoding='utf-8')
    if tests_stderr:
        python_utils.PRINT(tests_stderr)
        sys.exit(1)
    python_utils.PRINT(tests_stdout)
    if 'failing' in tests_stdout:
        python_utils.PRINT('---------------------------')
        python_utils.PRINT('Tests not passed')
        python_utils.PRINT('---------------------------')
        sys.exit(1)
    else:
        python_utils.PRINT('---------------------------')
        python_utils.PRINT('All tests passed')
        python_utils.PRINT('---------------------------')

    coverage_result = re.search = re.search(
        r'All files\s*\|\s*(?P<stmts>\S+)\s*\|\s*(?P<branch>\S+)\s*\|\s*'
        r'(?P<funcs>\S+)\s*\|\s*(?P<lines>\S+)\s*\|\s*', tests_stdout)
    if (coverage_result.group('stmts') != '100' or
            coverage_result.group('branch') != '100' or
            coverage_result.group('funcs') != '100' or
            coverage_result.group('lines') != '100'):
        raise Exception('Eslint test coverage is not 100%')


if __name__ == '__main__':
    main()
