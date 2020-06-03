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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import multiprocessing
import os

from core.tests import test_utils
import python_utils

from . import html_linter
from . import pre_commit_linter

NAME_SPACE = multiprocessing.Manager().Namespace()
PROCESSES = multiprocessing.Manager().dict()
NAME_SPACE.files = pre_commit_linter.FileCache()
FILE_CACHE = NAME_SPACE.files

LINTER_TESTS_DIR = os.path.join(os.getcwd(), 'core', 'tests', 'linter_tests')
VALID_HTML_FILEPATH = os.path.join(LINTER_TESTS_DIR, 'valid.html')
INVALID_STYLE_INDENTATION_HTML_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid_style_indentation.html')
INVALID_INDENTATION_HTML_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid_indentation.html')
INVALID_QUOTES_HTML_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid_quotes.html')
INVALID_ALIGNMENT_HTML_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid_alignment_of_tags.html')
INVALID_MISSING_HTML_TAG_HTML_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid_missing_html_tag.html')
INVALID_TAG_MISMATCH_HTML_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid_tag_mismatch.html')
INVALID_MISMATCH_INDENTATION_HTML_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid_mismatch_indentation.html')
INVALID_MISMATCHED_TAGS_HTML_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid_mismatched_tags.html')


def appears_in_linter_stdout(phrases, linter_stdout):
    """Checks to see if all of the phrases appear in at least one of the
    linter_stdout outputs.

    Args:
        phrases: list(str). A list of phrases we are trying to find in
        one of the linter_stdout outputs. For example, python linting
        outputs a success string that includes data we don't have easy
        access to, like how long the test took, so we may want to search
        for a substring of that success string in linter_stdout.

        linter_stdout: list(str). A list of the output results from the
        linter's execution. Note that anything placed into the "result"
        queue in pre_commit_linter will be in the same index.

    Returns:
        bool. True if and only if all of the phrases appear in at least
        one of the results stored in linter_stdout.
    """
    for output in linter_stdout:
        if all(phrase in output for phrase in phrases):
            return True
    return False


class CustomHTMLParserTests(test_utils.GenericTestBase):
    """Tests for CustomHTMLParser class."""

    def setUp(self):
        super(CustomHTMLParserTests, self).setUp()
        self.linter_stdout = []
        def mock_print(*args):
            """Mock for python_utils.PRINT. Append the values to print to
            linter_stdout list.

            Args:
                *args: Variable length argument list of values to print in
                the same line of output.
            """
            self.linter_stdout.append(
                ' '.join(python_utils.UNICODE(arg) for arg in args))
        self.print_swap = self.swap(python_utils, 'PRINT', mock_print)

    def test_custom_linter_with_invalid_style_indentation(self):
        with self.print_swap:
            html_linter.HTMLLintChecksManager(
                [INVALID_STYLE_INDENTATION_HTML_FILEPATH], FILE_CACHE, True,
                debug=True).perform_all_lint_checks()
        self.assertTrue(
            appears_in_linter_stdout(
                ['invalid_style_indentation.html --> Expected indentation of 6,'
                 ' found indentation of 4 for content of style tag on line 6'],
                self.linter_stdout))

    def test_custom_linter_with_invalid_indentation(self):
        with self.print_swap:
            html_linter.HTMLLintChecksManager(
                [INVALID_INDENTATION_HTML_FILEPATH], FILE_CACHE, True,
                debug=True).perform_all_lint_checks()
        self.assertTrue(
            appears_in_linter_stdout(
                ['Expected indentation of 10, found indentation of 12 for '
                 'classroom-page tag on line 13'],
                self.linter_stdout))

    def test_custom_linter_with_invalid_quotes(self):
        with self.print_swap:
            html_linter.HTMLLintChecksManager(
                [INVALID_QUOTES_HTML_FILEPATH], FILE_CACHE, True,
                debug=True).perform_all_lint_checks()
        self.assertTrue(
            appears_in_linter_stdout(
                ['The value color:white; of attribute '
                 'style for the tag content on line 11 should be enclosed '
                 'within double quotes.'],
                self.linter_stdout))

    def test_custom_linter_with_invalid_alignment(self):
        with self.print_swap:
            html_linter.HTMLLintChecksManager(
                [INVALID_ALIGNMENT_HTML_FILEPATH], FILE_CACHE, True,
                debug=True).perform_all_lint_checks()
        self.assertTrue(
            appears_in_linter_stdout(
                ['Attribute for tag content on line 12 should align with the '
                 'leftmost attribute on line 11'],
                self.linter_stdout))

    def test_custom_linter_with_invalid_tags(self):
        with self.print_swap:
            with self.assertRaises(html_linter.TagMismatchException) as e:
                html_linter.HTMLLintChecksManager(
                    [INVALID_MISMATCHED_TAGS_HTML_FILEPATH], FILE_CACHE, True,
                    debug=True).perform_all_lint_checks()
        self.assertTrue('Error in line 2 of file' in e.exception.message)

    def test_custom_linter_with_tag_mismatch(self):
        with self.print_swap:
            with self.assertRaises(html_linter.TagMismatchException) as e:
                html_linter.HTMLLintChecksManager(
                    [INVALID_TAG_MISMATCH_HTML_FILEPATH], FILE_CACHE, True,
                    debug=True).perform_all_lint_checks()
        self.assertTrue('Error in line 12 of file' in e.exception.message)

    def test_custom_linter_with_mismatched_indentation(self):
        with self.print_swap:
            html_linter.HTMLLintChecksManager(
                [INVALID_MISMATCH_INDENTATION_HTML_FILEPATH], FILE_CACHE, True,
                debug=True).perform_all_lint_checks()
        self.assertTrue(
            appears_in_linter_stdout(
                ['Indentation for end tag content on line 17 does not match the'
                 ' indentation of the start tag content on line 11'],
                self.linter_stdout))

    def test_custom_without_html_end_tag(self):
        with self.print_swap:
            with self.assertRaises(html_linter.TagMismatchException) as e:
                html_linter.HTMLLintChecksManager(
                    [INVALID_MISSING_HTML_TAG_HTML_FILEPATH], FILE_CACHE, True,
                    debug=True).perform_all_lint_checks()
        self.assertTrue('Error in file' in e.exception.message)

    def test_valid_html_file_with_custom_linter(self):
        with self.print_swap:
            html_linter.HTMLLintChecksManager(
                [VALID_HTML_FILEPATH], FILE_CACHE, True,
                debug=True).perform_all_lint_checks()
        self.assertTrue(
            appears_in_linter_stdout(
                ['SUCCESS'], self.linter_stdout))

    def test_custom_linter_with_no_files(self):
        with self.print_swap:
            html_linter.HTMLLintChecksManager(
                [], FILE_CACHE, True,
                debug=True).perform_all_lint_checks()
        self.assertTrue(
            appears_in_linter_stdout(
                ['There are no HTML files to lint.'], self.linter_stdout))

    def test_third_party_linter_with_no_files(self):
        with self.print_swap:
            html_linter.ThirdPartyHTMLLintChecksManager(
                [], True).perform_all_lint_checks()
        self.assertTrue(
            appears_in_linter_stdout(
                ['There are no HTML files to lint.'],
                self.linter_stdout))

    def test_third_party_linter_with_verbose_mode_enabled(self):
        with self.print_swap:
            html_linter.ThirdPartyHTMLLintChecksManager(
                [VALID_HTML_FILEPATH], True).perform_all_lint_checks()
        self.assertTrue(
            appears_in_linter_stdout(
                ['SUCCESS   HTML linting passed'],
                self.linter_stdout))

    def test_third_party_linter_with_verbose_mode_disabled(self):
        with self.print_swap:
            html_linter.ThirdPartyHTMLLintChecksManager(
                [VALID_HTML_FILEPATH], False).perform_all_lint_checks()
        self.assertTrue(
            appears_in_linter_stdout(
                ['SUCCESS   HTML linting passed'],
                self.linter_stdout))

    def test_third_party_linter_with_lint_errors(self):
        with self.print_swap:
            html_linter.ThirdPartyHTMLLintChecksManager(
                [INVALID_QUOTES_HTML_FILEPATH], True).perform_all_lint_checks()
        self.assertTrue(
            appears_in_linter_stdout(
                ['line 9, col 20, line contains trailing whitespace'],
                self.linter_stdout))

    def test_get_linters(self):
        custom_linter, third_party_linter = html_linter.get_linters(
            [VALID_HTML_FILEPATH], FILE_CACHE, verbose_mode_enabled=True)
        self.assertTrue(
            isinstance(custom_linter, html_linter.HTMLLintChecksManager))
        self.assertTrue(
            isinstance(
                third_party_linter,
                html_linter.ThirdPartyHTMLLintChecksManager))
