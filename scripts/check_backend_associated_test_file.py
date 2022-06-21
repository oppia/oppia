# Copyright 2022 The Oppia Authors. All Rights Reserved.
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

"""This script checks if every backend file has an associated test file."""

from __future__ import annotations

import logging
import os
import sys

TOPMOST_LEVEL_PATH = './'

# These files are data files for testing and have no logic to be tested.
FILES_WITHOUT_ASSOCIATED_TEST_FILES = [
    'scripts/linters/test_files/invalid_annotations.py',
    'scripts/linters/test_files/invalid_author.py',
    'scripts/linters/test_files/invalid_copyright.py',
    'scripts/linters/test_files/invalid_docstring.py',
    'scripts/linters/test_files/invalid_import_order.py',
    'scripts/linters/test_files/invalid_merge_conflict.py',
    'scripts/linters/test_files/invalid_ndb.py',
    'scripts/linters/test_files/invalid_no_newline.py',
    'scripts/linters/test_files/invalid_pycodestyle_error.py',
    'scripts/linters/test_files/invalid_pylint_id.py',
    'scripts/linters/test_files/invalid_python_three.py',
    'scripts/linters/test_files/invalid_request.py',
    'scripts/linters/test_files/invalid_tabs.py',
    'scripts/linters/test_files/invalid_todo.py',
    'scripts/linters/test_files/invalid_urlopen.py',
    'scripts/linters/test_files/valid.py',
    'scripts/linters/test_files/valid_py_ignore_pragma.py',
    'core/tests/build_sources/extensions/CodeRepl.py',
    'core/tests/build_sources/extensions/DragAndDropSortInput.py',
    'core/tests/data/failing_tests.py',
    'core/tests/data/image_constants.py',
    'core/tests/data/unicode_and_str_handler.py',
]


def main() -> None:
    """Finds the non-empty backend files that lack an associated test file."""
    all_backend_files = []
    for (root, _, files) in os.walk(TOPMOST_LEVEL_PATH):
        for file in files:
            full_path = os.path.join(root, file)
            _, file_extension = os.path.splitext(full_path)
            if (file_extension == '.py') and (
                'third_party' not in full_path) and (
                    'node_modules' not in full_path):
                all_backend_files.append(full_path)

    all_backend_files.sort()
    files_without_test = []
    for file in all_backend_files:
        if '_test.py' not in file:
            test_file = file.replace('.py', '_test.py')
            if test_file not in all_backend_files:
                files_without_test.append(file)

    non_empty_files = []
    for file in files_without_test:
        line_count = 0
        with open(file, 'r', encoding='utf8') as f:
            line_count = len(f.readlines())
        if line_count > 0:
            non_empty_files.append(file[2:])

    errors = ''
    for file in non_empty_files:
        if file not in FILES_WITHOUT_ASSOCIATED_TEST_FILES:
            errors += (
                '\033[1m{}\033[0m does not have an associated test file.'
                ' Make sure it\'s fully tested by it\'s associated test'
                ' file.\n'.format(file))

    if errors:
        print('---------------------------------------------')
        print('Some backend files lack associated test file.')
        print('---------------------------------------------')
        logging.error(errors)
        sys.exit(1)
    else:
        print('-----------------------------------------------')
        print('All backend files have an associated test file.')
        print('-----------------------------------------------')


if __name__ == '__main__':
    main()
