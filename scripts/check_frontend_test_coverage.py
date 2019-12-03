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

"""Check for any decreasement of 100% covered files in the frontend"""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import os
import shutil
import subprocess
import sys

import python_utils


def change_git_branch(branch):
    """Changes git branch.

    Args:
      branch: string. Name of the branch to be changed.
    """
    task = subprocess.Popen(['git', 'checkout', branch])

    task.communicate()
    task.wait()

    if branch == 'develop':
        # This line is executed because CircleCI keeps the commits from PR
        # branch when changing branchs. Ref ->
        # (https://discuss.circleci.com/t/changing-git-branches-causes-
        # commits-from-one-branch-to-carry-over-to-the-next/13562)
        reset = subprocess.Popen(['git', 'reset', '--hard', 'origin/develop'])

        reset.communicate()
        reset.wait()


def run_frontend_tests_script():
    """Run the frontend tests script using subprocess."""
    task = subprocess.Popen(['python', '-m', 'scripts.run_frontend_tests'])

    task.communicate()
    task.wait()


def create_tmp_folder():
    """Creates a temporary folder."""
    if not os.path.exists('./tmp'):
        os.mkdir('./tmp')


def delete_tmp_folder():
    """Delete the temporary folder."""
    if os.path.exists('./tmp'):
        shutil.rmtree('./tmp')


def filter_lines(line):
    """Check if the line has file path or total lines or covered lines
        of the test.

    Args:
        line: str. A line from lcov file.

    Returns:
        True or false.
    """
    return bool(line.find('SF') >= 0 or line.find('LH') >= 0 or
                line.find('LF') >= 0)


def get_test_file_name(test_path):
    """Get the file name from the absolute path.

    Args:
        test_path: string. The file's absolute path.

    Returns:
        file_name(str). The file name.
    """
    return test_path[test_path.rindex('/') + 1:]


def get_lcov_file_tests(file_path):
    """Get all tests from a lcov file, and filters it to return only:
    - File path
    - File total lines
    - File covered lines

    Args:
      file_path: string. The path of lcov file.

    Returns:
      An array with all tests filtered, including ony important data for the
      diff.
    """
    with python_utils.open_file(file_path, 'r') as f:
        tests_array = f.read().split('end_of_record')
        tests_array_filtered = []

        for test in tests_array:
            lines = [line for line in test.splitlines() if filter_lines(line)]
            if len(lines) > 0:
                tests_array_filtered.append(lines)

        return tests_array_filtered


def build_tests_fully_coverage_dict():
    """Build a dict with only fully covered files from develop branch.

    Returns:
        A dict containing file path, total lines and covered lines of each
        tested file.
    """
    coverage_dict = {}
    file_path = './tmp/dev-lcov.info'
    file_exists = os.path.exists(file_path)

    if file_exists is True:
        tests = get_lcov_file_tests(file_path)
        for lines in tests:
            lf = lines[1].split(':')[1]
            lh = lines[2].split(':')[1]

            if lf == lh:
                test_name = get_test_file_name(lines[0])
                coverage_dict[test_name] = [
                    int(lf),
                    int(lh)
                ]

        return coverage_dict
    else:
        raise Exception('File at path {} doesn\'t exist'.format(file_path))


def lcov_files_diff():
    """Check if any 100% covered file had the coverage dropped."""
    fully_covered_tests = build_tests_fully_coverage_dict()

    file_path = './tmp/pr-lcov.info'
    file_exists = os.path.exists(file_path)

    if file_exists is True:
        tests = get_lcov_file_tests(file_path)
        for lines in tests:
            test_name = get_test_file_name(lines[0])

            if test_name in fully_covered_tests:
                lf = lines[1].split(':')[1]
                lh = lines[2].split(':')[1]

                test = fully_covered_tests[test_name]
                lf_test = test[0]

                if lf_test == int(lf) and int(lf) != int(lh):
                    sys.stderr.write(
                        'The {} file is fully covered and it has '
                        'decreased after the changes \n'.format(test_name))
                    sys.exit(1)

    else:
        raise Exception('File at path {} doesn\'t exist'.format(file_path))


def main():
    """The first function to be executated."""
    current_branch = subprocess.check_output([
        'git',
        'rev-parse',
        '--abbrev-ref',
        'HEAD'
    ]).strip()

    if current_branch != 'develop' and current_branch != 'master':
        run_frontend_tests_script()

        create_tmp_folder()

        shutil.copyfile(
            '../karma_coverage_reports/lcov.info',
            './tmp/pr-lcov.info')

        change_git_branch('develop')

        run_frontend_tests_script()

        shutil.copyfile(
            '../karma_coverage_reports/lcov.info',
            './tmp/dev-lcov.info')

        lcov_files_diff()

        change_git_branch(current_branch)

        delete_tmp_folder()


if __name__ == '__main__':
    main()
