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

"""Unit tests for scripts/linters/html_linter.py."""

from __future__ import annotations

import multiprocessing
import os

from core.tests import test_utils

from typing_extensions import Final

from . import html_linter
from . import pre_commit_linter

NAME_SPACE: Final = multiprocessing.Manager().Namespace()
NAME_SPACE.files = pre_commit_linter.FileCache()  # type: ignore[no-untyped-call]
FILE_CACHE: Final = NAME_SPACE.files

LINTER_TESTS_DIR: Final = os.path.join(
    os.getcwd(), 'scripts', 'linters', 'test_files'
)
VALID_HTML_FILEPATH: Final = os.path.join(LINTER_TESTS_DIR, 'valid.html')
INVALID_STYLE_INDENTATION_HTML_FILEPATH: Final = os.path.join(
    LINTER_TESTS_DIR, 'invalid_style_indentation.html')
INVALID_INDENTATION_HTML_FILEPATH: Final = os.path.join(
    LINTER_TESTS_DIR, 'invalid_indentation.html')
INVALID_QUOTES_HTML_FILEPATH: Final = os.path.join(
    LINTER_TESTS_DIR, 'invalid_quotes.html')
INVALID_ALIGNMENT_HTML_FILEPATH: Final = os.path.join(
    LINTER_TESTS_DIR, 'invalid_alignment_of_tags.html')
INVALID_MISSING_HTML_TAG_HTML_FILEPATH: Final = os.path.join(
    LINTER_TESTS_DIR, 'invalid_missing_html_tag.html')
INVALID_TAG_MISMATCH_HTML_FILEPATH: Final = os.path.join(
    LINTER_TESTS_DIR, 'invalid_tag_mismatch.html')
INVALID_MISMATCH_INDENTATION_HTML_FILEPATH: Final = os.path.join(
    LINTER_TESTS_DIR, 'invalid_mismatch_indentation.html')
INVALID_MISMATCHED_TAGS_HTML_FILEPATH: Final = os.path.join(
    LINTER_TESTS_DIR, 'invalid_mismatched_tags.html')
INVALID_SPACE_AROUND_ATTRIBUTE_HTML_FILEPATH: Final = os.path.join(
    LINTER_TESTS_DIR, 'invalid_space_around_attribute.html')
INVALID_SPACE_AROUND_INNERHTML_ATTRIBUTE_HTML_FILEPATH: Final = os.path.join(
    LINTER_TESTS_DIR, 'invalid_space_around_innerhtml_attribute.html')
INVALID_SPACE_AROUND_DUPLICATE_ATTRIBUTE_HTML_FILEPATH: Final = os.path.join(
    LINTER_TESTS_DIR, 'invalid_space_around_duplicate_attribute.html')


class CustomHTMLParserTests(test_utils.LinterTestBase):
    """Tests for CustomHTMLParser class."""

    def test_custom_linter_with_invalid_style_indentation(self) -> None:
        lint_task_report = html_linter.HTMLLintChecksManager(
            [INVALID_STYLE_INDENTATION_HTML_FILEPATH], FILE_CACHE
            ).check_html_tags_and_attributes()
        self.assert_same_list_elements([
            'invalid_style_indentation.html --> Expected indentation of 6,'
            ' found indentation of 4 for content of style tag on line 7'
            ], lint_task_report.trimmed_messages)
        self.assertEqual('HTML tag and attribute', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_custom_linter_with_invalid_indentation(self) -> None:
        lint_task_report = html_linter.HTMLLintChecksManager(
            [INVALID_INDENTATION_HTML_FILEPATH], FILE_CACHE
            ).check_html_tags_and_attributes()
        self.assert_same_list_elements([
            'Expected indentation of 10, found indentation of 12 for '
            'classroom-page tag on line 14'], lint_task_report.trimmed_messages)
        self.assertEqual('HTML tag and attribute', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_custom_linter_with_invalid_quotes(self) -> None:
        lint_task_report = html_linter.HTMLLintChecksManager(
            [INVALID_QUOTES_HTML_FILEPATH], FILE_CACHE
            ).check_html_tags_and_attributes()
        self.assert_same_list_elements([
            'The value color:white; of attribute '
            'style for the tag content on line 12 should be enclosed '
            'within double quotes.'], lint_task_report.trimmed_messages)
        self.assertEqual('HTML tag and attribute', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_custom_linter_with_invalid_alignment(self) -> None:
        lint_task_report = html_linter.HTMLLintChecksManager(
            [INVALID_ALIGNMENT_HTML_FILEPATH], FILE_CACHE
            ).check_html_tags_and_attributes()
        self.assert_same_list_elements([
            'Attribute for tag content on line 13 should align with the '
            'leftmost attribute on line 12'], lint_task_report.trimmed_messages)
        self.assertEqual('HTML tag and attribute', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_custom_linter_with_invalid_tags(self) -> None:
        with self.assertRaisesRegex(
            html_linter.TagMismatchException, 'Error in line 2 of file'):
            html_linter.HTMLLintChecksManager(
                [INVALID_MISMATCHED_TAGS_HTML_FILEPATH], FILE_CACHE
                ).perform_all_lint_checks()

    def test_custom_linter_with_tag_mismatch(self) -> None:
        with self.assertRaisesRegex(
            html_linter.TagMismatchException, 'Error in line 13 of file'):
            html_linter.HTMLLintChecksManager(
                [INVALID_TAG_MISMATCH_HTML_FILEPATH], FILE_CACHE
                ).perform_all_lint_checks()

    def test_custom_linter_with_mismatched_indentation(self) -> None:
        lint_task_report = html_linter.HTMLLintChecksManager(
            [INVALID_MISMATCH_INDENTATION_HTML_FILEPATH], FILE_CACHE
            ).check_html_tags_and_attributes()
        self.assert_same_list_elements([
            'Indentation for end tag content on line 18 does not match the'
            ' indentation of the start tag content on line 12'
            ], lint_task_report.trimmed_messages)
        self.assertEqual('HTML tag and attribute', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_custom_without_html_end_tag(self) -> None:
        with self.assertRaisesRegex(
            html_linter.TagMismatchException, 'Error in file'):
            html_linter.HTMLLintChecksManager(
                [INVALID_MISSING_HTML_TAG_HTML_FILEPATH], FILE_CACHE
                ).perform_all_lint_checks()

    def test_space_around_attribute_name_reports_correctly(self) -> None:
        lint_task_report = html_linter.HTMLLintChecksManager(
            [INVALID_SPACE_AROUND_ATTRIBUTE_HTML_FILEPATH], FILE_CACHE
        ).check_html_tags_and_attributes()
        self.assert_same_list_elements([
            'Attribute class for tag div on line 4 ',
            'has unwanted white spaces around it'
        ], lint_task_report.trimmed_messages)
        self.assertTrue(lint_task_report)

    def test_space_around_attr_having_camelcase_name_reports_correctly(
        self
    ) -> None:
        lint_task_report = html_linter.HTMLLintChecksManager(
            [INVALID_SPACE_AROUND_INNERHTML_ATTRIBUTE_HTML_FILEPATH], FILE_CACHE
        ).check_html_tags_and_attributes()
        self.assert_same_list_elements([
            'Attribute [innerhtml] for tag h1 on line 5 ',
            'has unwanted white spaces around it'
        ], lint_task_report.trimmed_messages)
        self.assertTrue(lint_task_report)

    def test_space_around_duplicate_attr_reports_correctly(self) -> None:
        lint_task_report = html_linter.HTMLLintChecksManager(
            [INVALID_SPACE_AROUND_DUPLICATE_ATTRIBUTE_HTML_FILEPATH], FILE_CACHE
        ).check_html_tags_and_attributes()
        self.assert_same_list_elements([
            'Attribute class for tag div on line 4 ',
            'has unwanted white spaces around it'
        ], lint_task_report.trimmed_messages)
        self.assertTrue(lint_task_report)

    def test_valid_html_file_with_custom_linter(self) -> None:
        lint_task_report = html_linter.HTMLLintChecksManager(
            [VALID_HTML_FILEPATH], FILE_CACHE).check_html_tags_and_attributes()
        self.assertEqual(
            ['SUCCESS  HTML tag and attribute check passed'],
            lint_task_report.get_report())
        self.assertEqual('HTML tag and attribute', lint_task_report.name)
        self.assertFalse(lint_task_report.failed)

    def test_custom_linter_with_no_files(self) -> None:
        lint_task_report = html_linter.HTMLLintChecksManager(
            [], FILE_CACHE).perform_all_lint_checks()
        self.assertEqual(
            [
                'There are no HTML files to lint.',
                'SUCCESS  HTML lint check passed'],
            lint_task_report[0].get_report())
        self.assertEqual('HTML lint', lint_task_report[0].name)
        self.assertFalse(lint_task_report[0].failed)

    def test_third_party_linter_with_no_files(self) -> None:
        lint_task_report = html_linter.ThirdPartyHTMLLintChecksManager(
            []).perform_all_lint_checks()
        self.assertEqual(
            [
                'There are no HTML files to lint.',
                'SUCCESS  HTML lint check passed'],
            lint_task_report[0].get_report())
        self.assertEqual('HTML lint', lint_task_report[0].name)
        self.assertFalse(lint_task_report[0].failed)

    def test_third_party_linter_with_lint_errors(self) -> None:
        lint_task_report = html_linter.ThirdPartyHTMLLintChecksManager(
            [INVALID_QUOTES_HTML_FILEPATH]).lint_html_files()
        self.assert_same_list_elements(
            ['line 10, col 20, line contains trailing whitespace'],
            lint_task_report.trimmed_messages)
        self.assertEqual('HTMLLint', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_third_party_perform_all_lint_checks(self) -> None:
        lint_task_report = html_linter.ThirdPartyHTMLLintChecksManager(
            [INVALID_QUOTES_HTML_FILEPATH]).perform_all_lint_checks()
        self.assertTrue(isinstance(lint_task_report, list))

    def test_get_linters_with_success(self) -> None:
        custom_linter, third_party_linter = html_linter.get_linters(
            [VALID_HTML_FILEPATH], FILE_CACHE)
        self.assertTrue(
            isinstance(custom_linter, html_linter.HTMLLintChecksManager))
        self.assertTrue(
            isinstance(
                third_party_linter,
                html_linter.ThirdPartyHTMLLintChecksManager))
