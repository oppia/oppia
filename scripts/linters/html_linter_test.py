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

from . import html_linter
from . import pre_commit_linter

NAME_SPACE = multiprocessing.Manager().Namespace()
PROCESSES = multiprocessing.Manager().dict()
NAME_SPACE.files = pre_commit_linter.FileCache()
FILE_CACHE = NAME_SPACE.files

LINTER_TESTS_DIR = os.path.join(os.getcwd(), 'scripts', 'linters', 'test_files')
EXTRA_REPORTED_SAFE_PIPE_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'extra-reported-safe-pipe-usage.html')
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
INVALID_SAFE_PIPE_USAGE_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid-safe-pipe-usage.html')
UNACCOUNTED_SAFE_PIPE_USAGE_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'unaccounted-safe-pipe-usage.html')


class CustomHTMLParserTests(test_utils.LinterTestBase):
    """Tests for CustomHTMLParser class."""

    def test_custom_linter_with_invalid_style_indentation(self):
        with self.print_swap:
            html_linter.HTMLLintChecksManager(
                [INVALID_STYLE_INDENTATION_HTML_FILEPATH], FILE_CACHE, True,
                debug=True).perform_all_lint_checks()
        self.assert_same_list_elements([
            'invalid_style_indentation.html --> Expected indentation of 6,'
            ' found indentation of 4 for content of style tag on line 7'
            ], self.linter_stdout)
        self.assert_failed_messages_count(self.linter_stdout, 1)

    def test_custom_linter_with_invalid_indentation(self):
        with self.print_swap:
            html_linter.HTMLLintChecksManager(
                [INVALID_INDENTATION_HTML_FILEPATH], FILE_CACHE, True,
                debug=True).perform_all_lint_checks()
        self.assert_same_list_elements([
            'Expected indentation of 10, found indentation of 12 for '
            'classroom-page tag on line 14'], self.linter_stdout)
        self.assert_failed_messages_count(self.linter_stdout, 1)

    def test_custom_linter_with_invalid_quotes(self):
        with self.print_swap:
            html_linter.HTMLLintChecksManager(
                [INVALID_QUOTES_HTML_FILEPATH], FILE_CACHE, True,
                debug=True).perform_all_lint_checks()
        self.assert_same_list_elements([
            'The value color:white; of attribute '
            'style for the tag content on line 12 should be enclosed '
            'within double quotes.'], self.linter_stdout)
        self.assert_failed_messages_count(self.linter_stdout, 1)

    def test_custom_linter_with_invalid_alignment(self):
        with self.print_swap:
            html_linter.HTMLLintChecksManager(
                [INVALID_ALIGNMENT_HTML_FILEPATH], FILE_CACHE, True,
                debug=True).perform_all_lint_checks()
        self.assert_same_list_elements([
            'Attribute for tag content on line 13 should align with the '
            'leftmost attribute on line 12'], self.linter_stdout)
        self.assert_failed_messages_count(self.linter_stdout, 1)

    def test_custom_linter_with_invalid_tags(self):
        with self.print_swap:
            with self.assertRaisesRegexp(
                html_linter.TagMismatchException, 'Error in line 2 of file'):
                html_linter.HTMLLintChecksManager(
                    [INVALID_MISMATCHED_TAGS_HTML_FILEPATH], FILE_CACHE, True,
                    debug=True).perform_all_lint_checks()

    def test_custom_linter_with_tag_mismatch(self):
        with self.print_swap:
            with self.assertRaisesRegexp(
                html_linter.TagMismatchException, 'Error in line 13 of file'):
                html_linter.HTMLLintChecksManager(
                    [INVALID_TAG_MISMATCH_HTML_FILEPATH], FILE_CACHE, True,
                    debug=True).perform_all_lint_checks()

    def test_custom_linter_with_mismatched_indentation(self):
        with self.print_swap:
            html_linter.HTMLLintChecksManager(
                [INVALID_MISMATCH_INDENTATION_HTML_FILEPATH], FILE_CACHE, True,
                debug=True).perform_all_lint_checks()
        self.assert_same_list_elements([
            'Indentation for end tag content on line 18 does not match the'
            ' indentation of the start tag content on line 12'
            ], self.linter_stdout)
        self.assert_failed_messages_count(self.linter_stdout, 1)

    def test_custom_without_html_end_tag(self):
        with self.print_swap:
            with self.assertRaisesRegexp(
                html_linter.TagMismatchException, 'Error in file'):
                html_linter.HTMLLintChecksManager(
                    [INVALID_MISSING_HTML_TAG_HTML_FILEPATH], FILE_CACHE, True,
                    debug=True).perform_all_lint_checks()

    def test_valid_html_file_with_custom_linter(self):
        with self.print_swap:
            html_linter.HTMLLintChecksManager(
                [VALID_HTML_FILEPATH], FILE_CACHE, True,
                debug=True).perform_all_lint_checks()
        self.assert_same_list_elements(
            ['SUCCESS'], self.linter_stdout)
        self.assert_failed_messages_count(self.linter_stdout, 0)

    def test_custom_linter_with_no_files(self):
        with self.print_swap:
            html_linter.HTMLLintChecksManager(
                [], FILE_CACHE, True,
                debug=True).perform_all_lint_checks()
        self.assert_same_list_elements(
            ['There are no HTML files to lint.'], self.linter_stdout)
        self.assert_failed_messages_count(self.linter_stdout, 0)
    
    def test_invalid_safe_pipe_usage(self):
        with self.print_swap:
            html_linter.HTMLLintChecksManager(
                [INVALID_SAFE_PIPE_USAGE_FILEPATH], FILE_CACHE, True,
                debug=True).perform_all_lint_checks()
        self.assert_same_list_elements([(
            'The safe pipe used in %s is unwarranted, please remove it!'
            % (INVALID_SAFE_PIPE_USAGE_FILEPATH.split('/')[-1]))],
            self.linter_stdout)
    
    def test_unaccounted_safe_pipe_usage(self):
        with self.print_swap:
            html_linter.HTMLLintChecksManager(
                [UNACCOUNTED_SAFE_PIPE_USAGE_FILEPATH], FILE_CACHE, True,
                debug=True).perform_all_lint_checks()
        self.assert_same_list_elements([(
            'There are some unaccounted instances of safe pipe'
            ' usage in the file %s. Please remove them!'
            % (UNACCOUNTED_SAFE_PIPE_USAGE_FILEPATH.split('/')[-1]))],
            self.linter_stdout)
        
    def test_extra_reported_safe_pipe_usage(self):
        with self.print_swap:
            html_linter.HTMLLintChecksManager(
                [EXTRA_REPORTED_SAFE_PIPE_FILEPATH], FILE_CACHE, True,
                debug=True).perform_all_lint_checks()
        self.assert_same_list_elements([(
            'There are number of instances of safe pipe in %s '
            'doesn\'t match the ammount specified in warranted'
            '_safe_pipe_usages.py!'
            % (EXTRA_REPORTED_SAFE_PIPE_FILEPATH.split('/')[-1]))],
            self.linter_stdout)

    def test_third_party_linter_with_no_files(self):
        with self.print_swap:
            html_linter.ThirdPartyHTMLLintChecksManager(
                [], True).perform_all_lint_checks()
        self.assert_same_list_elements(
            ['There are no HTML files to lint.'],
            self.linter_stdout)
        self.assert_failed_messages_count(self.linter_stdout, 0)

    def test_third_party_linter_with_verbose_mode_enabled(self):
        with self.print_swap:
            html_linter.ThirdPartyHTMLLintChecksManager(
                [VALID_HTML_FILEPATH], True).perform_all_lint_checks()
        self.assert_same_list_elements(
            ['SUCCESS  HTML linting passed'],
            self.linter_stdout)
        self.assert_failed_messages_count(self.linter_stdout, 0)

    def test_third_party_linter_with_verbose_mode_disabled(self):
        with self.print_swap:
            html_linter.ThirdPartyHTMLLintChecksManager(
                [VALID_HTML_FILEPATH], False).perform_all_lint_checks()
        self.assert_same_list_elements(
            ['SUCCESS  HTML linting passed'],
            self.linter_stdout)
        self.assert_failed_messages_count(self.linter_stdout, 0)

    def test_third_party_linter_with_lint_errors(self):
        with self.print_swap:
            html_linter.ThirdPartyHTMLLintChecksManager(
                [INVALID_QUOTES_HTML_FILEPATH], True).perform_all_lint_checks()
        self.assert_same_list_elements(
            ['line 10, col 20, line contains trailing whitespace'],
            self.linter_stdout)
        self.assert_failed_messages_count(self.linter_stdout, 1)

    def test_get_linters_with_success(self):
        custom_linter, third_party_linter = html_linter.get_linters(
            [VALID_HTML_FILEPATH], FILE_CACHE, verbose_mode_enabled=True)
        self.assertTrue(
            isinstance(custom_linter, html_linter.HTMLLintChecksManager))
        self.assertTrue(
            isinstance(
                third_party_linter,
                html_linter.ThirdPartyHTMLLintChecksManager))
