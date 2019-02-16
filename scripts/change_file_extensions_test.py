# coding: utf-8
#
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

"""Unit tests for scripts/change_file_extensions.py."""

import os
import shutil
import tempfile

from core.tests import test_utils
from scripts import change_file_extensions


class ChangeExtensionsTest(test_utils.GenericTestBase):
    """Test the change extension method."""

    def setUp(self):
        """Create dummy folders for testing and run the change extensions method
        on the dummy files.
        """
        super(ChangeExtensionsTest, self).setUp()

        self.rename_dir = tempfile.mkdtemp(suffix='dir_used_in_renaming')
        self.non_rename_dir = tempfile.mkdtemp(
            suffix='dir_not_used_in_renaming')

        os.mkdir('%s/subdir' % self.rename_dir)
        os.mkdir('%s/subdir' % self.non_rename_dir)

        self.js_file_in_dir = 'js_file_in_dir.js'
        self.js_file_in_subdir = 'js_file_in_subdir.js'
        self.python_test_file = 'python_test_file.py'
        self.ts_test_file = 'ts_test_file.ts'

        self.js_file_in_dir_content = 'var a = 123;'
        self.js_file_in_subdir_content = (
            'function myFunction(p1, p2) {\n'
            '  return p1 * p2;\n'
            '}')
        self.python_test_file_content = 'print \'I am test file!\''
        self.ts_test_file_content = 'var a = 123;'

        with open(
            '%s/%s' % (self.rename_dir, self.js_file_in_dir), 'w') as f:
            f.write(self.js_file_in_dir_content)

        with open(
            '%s/subdir/%s' % (
                self.rename_dir, self.js_file_in_subdir), 'w') as f:
            f.write(self.js_file_in_subdir_content)

        with open('%s/%s' % (self.rename_dir, self.python_test_file), 'w') as f:
            f.write(self.python_test_file_content)

        with open('%s/%s' % (self.rename_dir, self.ts_test_file), 'w') as f:
            f.write(self.ts_test_file_content)

        with open(
            '%s/%s' % (self.non_rename_dir, self.js_file_in_dir), 'w') as f:
            f.write(self.js_file_in_dir_content)

        with open(
            '%s/subdir/%s' % (
                self.non_rename_dir, self.js_file_in_subdir), 'w') as f:
            f.write(self.js_file_in_subdir_content)

        with open(
            '%s/%s' % (self.non_rename_dir, self.python_test_file), 'w') as f:
            f.write(self.python_test_file_content)

        with open('%s/%s' % (self.non_rename_dir, self.ts_test_file), 'w') as f:
            f.write(self.ts_test_file_content)

    def test_extensions_are_changed_only_in_specified_directory(self):
        """Test that change extensions method renames only js file in the
        specified directory.
        """

        change_file_extensions.change_extension(
            [self.rename_dir],
            '.js',
            '.ts')

        actual_files_in_dir_used_in_renaming = []
        for (dirpath, _, filenames) in os.walk(self.rename_dir):
            for filename in filenames:
                actual_files_in_dir_used_in_renaming.append(
                    os.path.join(dirpath, filename))
        expected_files_in_dir_used_in_renaming = [
            '%s/python_test_file.py' % self.rename_dir,
            '%s/js_file_in_dir.ts' % self.rename_dir,
            '%s/ts_test_file.ts' % self.rename_dir,
            '%s/subdir/js_file_in_subdir.ts' % self.rename_dir]

        self.assertEqual(
            set(actual_files_in_dir_used_in_renaming),
            set(expected_files_in_dir_used_in_renaming))

        actual_files_in_dir_not_used_in_renaming = []
        for (dirpath, _, filenames) in os.walk(self.non_rename_dir):
            for filename in filenames:
                actual_files_in_dir_not_used_in_renaming.append(
                    os.path.join(dirpath, filename))
        expected_files_in_dir_not_used_in_renaming = [
            '%s/python_test_file.py' % self.non_rename_dir,
            '%s/js_file_in_dir.js' % self.non_rename_dir,
            '%s/ts_test_file.ts' % self.non_rename_dir,
            '%s/subdir/js_file_in_subdir.js' % self.non_rename_dir]

        self.assertEqual(
            set(actual_files_in_dir_not_used_in_renaming),
            set(expected_files_in_dir_not_used_in_renaming))

    def test_no_change_made_is_to_file_contents_after_renaming(self):
        """Test that file content remains unchanged."""

        change_file_extensions.change_extension(
            [self.rename_dir],
            '.js',
            '.ts')

        with open(
            '%s/js_file_in_dir.ts' % self.rename_dir, 'r') as f:
            self.assertEqual(self.js_file_in_dir_content, f.read())

        with open(
            '%s/subdir/js_file_in_subdir.ts' % self.rename_dir, 'r') as f:
            self.assertEqual(self.js_file_in_subdir_content, f.read())

        with open('%s/%s' % (self.rename_dir, self.python_test_file), 'r') as f:
            self.assertEqual(self.python_test_file_content, f.read())

        with open('%s/%s' % (self.rename_dir, self.ts_test_file), 'r') as f:
            self.assertEqual(self.ts_test_file_content, f.read())

        with open(
            '%s/%s' % (self.non_rename_dir, self.js_file_in_dir), 'r') as f:
            self.assertEqual(self.js_file_in_dir_content, f.read())

        with open(
            '%s/subdir/%s' % (
                self.non_rename_dir, self.js_file_in_subdir), 'r') as f:
            self.assertEqual(self.js_file_in_subdir_content, f.read())

        with open(
            '%s/%s' % (self.non_rename_dir, self.python_test_file), 'r') as f:
            self.assertEqual(self.python_test_file_content, f.read())

        with open('%s/%s' % (self.non_rename_dir, self.ts_test_file), 'r') as f:
            self.assertEqual(self.ts_test_file_content, f.read())

    def tearDown(self):
        """Remove the dummy directories."""
        super(ChangeExtensionsTest, self).tearDown()
        shutil.rmtree(self.rename_dir)
        shutil.rmtree(self.non_rename_dir)
