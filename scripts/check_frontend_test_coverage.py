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

"""Check for decrease in coverage from 100% of frontend files."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import os
import re
import shutil
import subprocess
import sys

import python_utils

from . import fully_covered_files

LCOV_FILE_PATH = os.path.join(os.pardir, 'karma_coverage_reports', 'lcov.info')
PR_LCOV_FILE_PATH = os.path.join(os.curdir, 'tmp', 'pr-lcov.info')
FULLY_COVERED_TESTS = fully_covered_files.fully_covered_files_array


def run_frontend_tests_script():
    """Run the frontend tests script using subprocess."""
    subprocess.check_call([
        'python', '-m', 'scripts.run_frontend_tests'])


def create_tmp_folder():
    """Creates a temporary folder."""
    if not os.path.exists('./tmp'):
        os.mkdir('./tmp')


def delete_tmp_folder():
    """Delete the temporary folder."""
    if os.path.exists('./tmp'):
        shutil.rmtree('./tmp')


def filter_lines(line):
    """Check if the line has file path (SF) or total lines (LF) or covered
    lines (LH) of the test.

    Args:
        line: str. A line from lcov file.

    Returns:
        Boolean. If the line has the file path or total lines or covered lines
        of the test.
    """
    return ('SF' in line or 'LH' in line or 'LF' in line)


def get_test_file_name(test_path):
    """Get the file name from the absolute path.

    Args:
        test_path: string. The file's absolute path.

    Returns:
        String. The file path.
    """
    if not test_path:
        sys.stderr.write(
            'The test path is empty or null.'
            'It\'s not possible to diff the test coverage correctly.')
        sys.exit(1)

    file_name = os.path.split(test_path)[1]
    return file_name


def get_lcov_file_tests(file_path):
    """Get all tests from a lcov file, and filters it to return only:
    - File path
    - File total lines
    - File covered lines

    Args:
        file_path: string. The path of lcov file.

    Returns:
        String array. An array with all tests filtered, including only important
        data for the diff.
    """
    with python_utils.open_file(file_path, 'r') as f:
        tests_array = f.read().split('end_of_record')
        tests_array_filtered = []

        for test in tests_array:
            lines = [line for line in test.splitlines() if filter_lines(line)]
            if len(lines) > 0:
                tests_array_filtered.append(lines)

        return tests_array_filtered


def get_coverage_dict_tests():
    """Build a dict with all covered files from develop branch.

    Returns:
        Dictionary. A dict containing file path, total lines and covered lines
        of each tested file.

    Raises:
        Exception: If DEV_LCOV_FILE_PATH doesn't exist.
    """
    coverage_dict = {}

    if not os.path.exists(PR_LCOV_FILE_PATH):
        raise Exception(
            'File at path {} doesn\'t exist'.format(PR_LCOV_FILE_PATH))

    tests = get_lcov_file_tests(PR_LCOV_FILE_PATH)
    for lines in tests:
        total_lines = re.match('(\d+)', lines[1].split(':')[1]).group(1)
        covered_lines = re.match('(\d+)', lines[2].split(':')[1]).group(1)

        test_name = get_test_file_name(lines[0])
        coverage_dict[test_name] = [
            int(total_lines),
            int(covered_lines)
        ]

    return coverage_dict        


def remove_item_from_whitelist(test_name):
    index = FULLY_COVERED_TESTS.index(test_name)
    FULLY_COVERED_TESTS.pop(index)


def check_coverage_changes():
    """Checks if the whitelist for fully covered files needs to be changed by:
    - New file insertion
    - File renaming
    - File deletion

    Raises:
        Exception: If PR_LCOV_FILE_PATH doesn't exist.
    """
    if not os.path.exists(PR_LCOV_FILE_PATH):
        raise Exception('File at path {} doesn\'t exist'.format(
            PR_LCOV_FILE_PATH))

    covered_tests = get_coverage_dict_tests()
    errors = ''

    for test_name in covered_tests:
        total_lines = covered_tests[test_name][0]
        covered_lines = covered_tests[test_name][1]

        if test_name in FULLY_COVERED_TESTS:
            if total_lines != covered_lines:
                errors += ('\033[1m{}\033[0m file is in the whitelist but its'
                ' coverage decreased. Make sure it is fully coverage'
                ' again.\n'.format(test_name))

            remove_item_from_whitelist(test_name)
        else:
            if total_lines == covered_lines:
                errors += ('\033[1m{}\033[0m file is fully coverage and it\'s'
                ' not included in the whitelist. Please add the file name in'
                ' the whilelist manually.\n'.format(test_name))

    if len(FULLY_COVERED_TESTS) > 0:
        for test_name in FULLY_COVERED_TESTS:
            errors += ('\033[1m{}\033[0m is in the whitelist but it doesn\'t'
            ' exist anymore. If you have renamed it, please make sure to'
            ' remove the old file name and add the new file name in the'
            ' whitelist.\n'.format(test_name))

    delete_tmp_folder()

    if errors:
        python_utils.PRINT('------------------------------------')
        python_utils.PRINT('Frontend Coverage Checks Not Passed.')
        python_utils.PRINT('------------------------------------')
        python_utils.PRINT(errors)
        sys.exit(1)
    else:
        python_utils.PRINT('------------------------------------')
        python_utils.PRINT('All Frontend Coverage Checks Passed.')
        python_utils.PRINT('------------------------------------')


def main():
    """Runs all the steps for checking if there is any decrease of 100% covered
    files. Only PR branches is going to be checked, develop branch doesn't need
    this check because it has the correct whitelist of the fully covered tests.
    Master branch doesn't need the check neither, because the whitelist in
    develop should already be checked during the PR review.
    """
    current_branch = subprocess.check_output([
        'git', 'rev-parse', '--abbrev-ref', 'HEAD']).strip()

    if current_branch != 'develop' and current_branch != 'master':
        run_frontend_tests_script()

        create_tmp_folder()

        shutil.copyfile(
            LCOV_FILE_PATH,
            PR_LCOV_FILE_PATH)

        check_coverage_changes()


if __name__ == '__main__':
    main()
