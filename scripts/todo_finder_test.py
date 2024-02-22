# Copyright 2024 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the 'License');
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an 'AS-IS' BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Unit tests for scripts/todo_finder."""

from __future__ import annotations

import os
import shutil
import textwrap

from core.tests import test_utils

from . import todo_finder


class TodoFinderTests(test_utils.GenericTestBase):
    """Unit tests for testing the todo_finder script."""

    def setUp(self) -> None:
        super().setUp()
        if os.path.isdir(os.path.join(os.getcwd(), 'dummy_dir')):
            shutil.rmtree('dummy_dir')
        os.mkdir('dummy_dir', mode=0o777)
        with open('dummy_dir/file1.txt', 'w', encoding='utf-8') as file:
            content = (
                """
                Test Line 1
                // TODO(#43242): Test Description 1
                # TODO(#1234)
                # TODO(#23432)
                # TODO(#12314): Test Description 2
                # TODO(#12334): Test Description 3
                # TODO(#1234): Test Description 4
                # TODO(#12345): Test Description 5
                // TODO(#12314): Test Description 6
                // TODO(#12341): Test Description 7
                // TODO(#123412): Test Description 8
                // TODO(#123413): Test Description 9
                // Some Random Comment TODO(#51223): Test Description
                // TODO(#123414): Test Description 10
                // TODO(#123415): Test Description 11
                # TODO(   #34412): Test Description 12
                Test Line 2
                Test Line 3
                # TODO(#34414   ): Test Description 13
                // TODO(#21524): Test Description 14
                // Some Random Comment TODO(#51243): Test Description
                """).lstrip('\n')
            file.write(textwrap.dedent(content))
        with open('dummy_dir/file2.txt', 'w', encoding='utf-8') as file:
            content = (
                """
                Test Line 1
                # TODO(#41412): Test Description 1
                # TODO(#1234): Test Description 2
                # TODO(#1233): Test Description 3
                # TODO(#1235): Test Description 4
                # TODO(#4215   ): Test Description 5
                // Random Comment
                """).lstrip('\n')
            file.write(textwrap.dedent(content))
        open('dummy_dir/zip1.zip', 'w', encoding='utf-8').close()
        open('dummy_dir/ico1.ico', 'w', encoding='utf-8').close()
        open('dummy_dir/png1.png', 'w', encoding='utf-8').close()

    def tearDown(self) -> None:
        super().tearDown()
        shutil.rmtree('dummy_dir')

    def test_should_exclude_bad_files(self) -> None:
        search_files = todo_finder.get_search_files('dummy_dir')
        expected_search_files = [
            'dummy_dir/file1.txt',
            'dummy_dir/file2.txt'
        ]
        self.assertEqual(search_files, expected_search_files)

    def test_get_all_todos(self) -> None:
        todos = todo_finder.get_todos('dummy_dir')
        expected_todos = [
            {
                'file_path': 'dummy_dir/file1.txt',
                'line_content': '// TODO(#43242): Test Description 1',
                'line_number': 2
            },
            {
                'file_path': 'dummy_dir/file1.txt',
                'line_content': '# TODO(#1234)',
                'line_number': 3
            },
            {
                'file_path': 'dummy_dir/file1.txt',
                'line_content': '# TODO(#23432)',
                'line_number': 4
            },
            {
                'file_path': 'dummy_dir/file1.txt',
                'line_content': '# TODO(#12314): Test Description 2',
                'line_number': 5
            },
            {
                'file_path': 'dummy_dir/file1.txt',
                'line_content': '# TODO(#12334): Test Description 3',
                'line_number': 6
            },
            {
                'file_path': 'dummy_dir/file1.txt',
                'line_content': '# TODO(#1234): Test Description 4',
                'line_number': 7
            },
            {
                'file_path': 'dummy_dir/file1.txt',
                'line_content': '# TODO(#12345): Test Description 5',
                'line_number': 8
            },
            {
                'file_path': 'dummy_dir/file1.txt',
                'line_content': '// TODO(#12314): Test Description 6',
                'line_number': 9
            },
            {
                'file_path': 'dummy_dir/file1.txt',
                'line_content': '// TODO(#12341): Test Description 7',
                'line_number': 10
            },
            {
                'file_path': 'dummy_dir/file1.txt',
                'line_content': '// TODO(#123412): Test Description 8',
                'line_number': 11
            },
            {
                'file_path': 'dummy_dir/file1.txt',
                'line_content': '// TODO(#123413): Test Description 9',
                'line_number': 12
            },
            {
                'file_path': 'dummy_dir/file1.txt',
                'line_content':
                    '// Some Random Comment TODO(#51223): Test Description',
                'line_number': 13
            },
            {
                'file_path': 'dummy_dir/file1.txt',
                'line_content': '// TODO(#123414): Test Description 10',
                'line_number': 14
            },
            {
                'file_path': 'dummy_dir/file1.txt',
                'line_content': '// TODO(#123415): Test Description 11',
                'line_number': 15
            },
            {
                'file_path': 'dummy_dir/file1.txt',
                'line_content': '# TODO(   #34412): Test Description 12',
                'line_number': 16
            },
            {
                'file_path': 'dummy_dir/file1.txt',
                'line_content': '# TODO(#34414   ): Test Description 13',
                'line_number': 19
            },
            {
                'file_path': 'dummy_dir/file1.txt',
                'line_content': '// TODO(#21524): Test Description 14',
                'line_number': 20
            },
            {
                'file_path': 'dummy_dir/file1.txt',
                'line_content':
                    '// Some Random Comment TODO(#51243): Test Description',
                'line_number': 21
            },
            {
                'file_path': 'dummy_dir/file2.txt',
                'line_content': '# TODO(#41412): Test Description 1',
                'line_number': 2
            },
            {
                'file_path': 'dummy_dir/file2.txt',
                'line_content': '# TODO(#1234): Test Description 2',
                'line_number': 3
            },
            {
                'file_path': 'dummy_dir/file2.txt',
                'line_content': '# TODO(#1233): Test Description 3',
                'line_number': 4
            },
            {
                'file_path': 'dummy_dir/file2.txt',
                'line_content': '# TODO(#1235): Test Description 4',
                'line_number': 5
            },
            {
                'file_path': 'dummy_dir/file2.txt',
                'line_content': '# TODO(#4215   ): Test Description 5',
                'line_number': 6
            }
        ]
        self.assertCountEqual(todos, expected_todos)

    def test_get_all_correctly_formatted_todos(self) -> None:
        todos = todo_finder.get_todos('dummy_dir')
        correctly_formatted_todos = (
            todo_finder.get_correctly_formated_todos(todos))
        expected_correctly_formated_todos = [
            {
                'file_path': 'dummy_dir/file1.txt',
                'line_content': '// TODO(#43242): Test Description 1',
                'line_number': 2
            },
            {
                'file_path': 'dummy_dir/file1.txt',
                'line_content': '# TODO(#12314): Test Description 2',
                'line_number': 5
            },
            {
                'file_path': 'dummy_dir/file1.txt',
                'line_content': '# TODO(#12334): Test Description 3',
                'line_number': 6
            },
            {
                'file_path': 'dummy_dir/file1.txt',
                'line_content': '# TODO(#1234): Test Description 4',
                'line_number': 7
            },
            {
                'file_path': 'dummy_dir/file1.txt',
                'line_content': '# TODO(#12345): Test Description 5',
                'line_number': 8
            },
            {
                'file_path': 'dummy_dir/file1.txt',
                'line_content': '// TODO(#12314): Test Description 6',
                'line_number': 9
            },
            {
                'file_path': 'dummy_dir/file1.txt',
                'line_content': '// TODO(#12341): Test Description 7',
                'line_number': 10
            },
            {
                'file_path': 'dummy_dir/file1.txt',
                'line_content': '// TODO(#123412): Test Description 8',
                'line_number': 11
            },
            {
                'file_path': 'dummy_dir/file1.txt',
                'line_content': '// TODO(#123413): Test Description 9',
                'line_number': 12
            },
            {
                'file_path': 'dummy_dir/file1.txt',
                'line_content':
                    '// Some Random Comment TODO(#51223): Test Description',
                'line_number': 13
            },
            {
                'file_path': 'dummy_dir/file1.txt',
                'line_content': '// TODO(#123414): Test Description 10',
                'line_number': 14
            },
            {
                'file_path': 'dummy_dir/file1.txt',
                'line_content': '// TODO(#123415): Test Description 11',
                'line_number': 15
            },
            {
                'file_path': 'dummy_dir/file1.txt',
                'line_content': '// TODO(#21524): Test Description 14',
                'line_number': 20
            },
            {
                'file_path': 'dummy_dir/file1.txt',
                'line_content':
                    '// Some Random Comment TODO(#51243): Test Description',
                'line_number': 21
            },
            {
                'file_path': 'dummy_dir/file2.txt',
                'line_content': '# TODO(#41412): Test Description 1',
                'line_number': 2
            },
            {
                'file_path': 'dummy_dir/file2.txt',
                'line_content': '# TODO(#1234): Test Description 2',
                'line_number': 3
            },
            {
                'file_path': 'dummy_dir/file2.txt',
                'line_content': '# TODO(#1233): Test Description 3',
                'line_number': 4
            },
            {
                'file_path': 'dummy_dir/file2.txt',
                'line_content': '# TODO(#1235): Test Description 4',
                'line_number': 5
            }
        ]
        self.assertCountEqual(
            correctly_formatted_todos,
            expected_correctly_formated_todos)

    def test_get_issue_number_from_todo(self) -> None:
        invalid_issue_number_one = todo_finder.get_issue_number_from_todo(
            '// TODO(#12343):')
        self.assertEqual(invalid_issue_number_one, None)

        invalid_issue_number_two = todo_finder.get_issue_number_from_todo(
            '# TODO(#12342)')
        self.assertEqual(invalid_issue_number_two, None)

        invalid_issue_number_three = todo_finder.get_issue_number_from_todo(
            '# TODO(12345)')
        self.assertEqual(invalid_issue_number_three, None)

        invalid_issue_number_four = todo_finder.get_issue_number_from_todo(
            '# TODO(12341): Test Description')
        self.assertEqual(invalid_issue_number_four, None)

        invalid_issue_number_five = todo_finder.get_issue_number_from_todo(
            '# todo(#12345): Test Description')
        self.assertEqual(invalid_issue_number_five, None)

        invalid_issue_number_six = todo_finder.get_issue_number_from_todo(
            '# TODO(#12344 ): Test Description')
        self.assertEqual(invalid_issue_number_six, None)

        invalid_issue_number_seven = todo_finder.get_issue_number_from_todo(
            '# TODO( #12321): Test Description ')
        self.assertEqual(invalid_issue_number_seven, None)

        valid_issue_number = todo_finder.get_issue_number_from_todo(
            '// TODO(#1234): Test Description')
        self.assertEqual(valid_issue_number, '1234')
