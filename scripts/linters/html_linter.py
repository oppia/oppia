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

"""Lint checks for HTML files."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import os
import subprocess
import sys

import python_utils

from . import linter_utils
from .. import common

# pylint: disable=wrong-import-position
import html.parser # isort:skip
# pylint: enable=wrong-import-position


class TagMismatchException(Exception):
    """Error class for mismatch between start and end tags."""
    pass


class CustomHTMLParser(html.parser.HTMLParser):
    """Custom HTML parser to check indentation."""

    def __init__(self, filepath, file_lines, debug, failed=False):
        """Define various variables to parse HTML.

        Args:
            filepath: str. path of the file.
            file_lines: list(str). list of the lines in the file.
            debug: bool. if true prints tag_stack for the file.
            failed: bool. true if the HTML indentation check fails.
        """
        html.parser.HTMLParser.__init__(self)
        self.tag_stack = []
        self.debug = debug
        self.failed = failed
        self.filepath = filepath
        self.file_lines = file_lines
        self.indentation_level = 0
        self.indentation_width = 2
        self.void_elements = [
            'area', 'base', 'br', 'col', 'embed',
            'hr', 'img', 'input', 'link', 'meta',
            'param', 'source', 'track', 'wbr']

    def handle_starttag(self, tag, attrs):
        """Handle start tag of a HTML line.

        Args:
            tag: str. start tag of a HTML line.
            attrs: list(str). list of attributes in the start tag.
        """
        line_number, column_number = self.getpos()
        # Check the indentation of the tag.
        expected_indentation = self.indentation_level * self.indentation_width
        tag_line = self.file_lines[line_number - 1].lstrip()
        opening_tag = '<' + tag

        # Check the indentation for content of style tag.
        if tag_line.startswith(opening_tag) and tag == 'style':
            # Getting next line after style tag.
            next_line = self.file_lines[line_number]
            next_line_expected_indentation = (
                self.indentation_level + 1) * self.indentation_width
            next_line_column_number = len(next_line) - len(next_line.lstrip())

            if next_line_column_number != next_line_expected_indentation:
                python_utils.PRINT(
                    '%s --> Expected indentation '
                    'of %s, found indentation of %s '
                    'for content of %s tag on line %s ' % (
                        self.filepath, next_line_expected_indentation,
                        next_line_column_number, tag, line_number + 1))
                python_utils.PRINT('')
                self.failed = True

        if tag_line.startswith(opening_tag) and (
                column_number != expected_indentation):
            python_utils.PRINT(
                '%s --> Expected indentation '
                'of %s, found indentation of %s '
                'for %s tag on line %s ' % (
                    self.filepath, expected_indentation,
                    column_number, tag, line_number))
            python_utils.PRINT('')
            self.failed = True

        if tag not in self.void_elements:
            self.tag_stack.append((tag, line_number, column_number))
            self.indentation_level += 1

        if self.debug:
            python_utils.PRINT('DEBUG MODE: Start tag_stack')
            python_utils.PRINT(self.tag_stack)

        # Check the indentation of the attributes of the tag.
        indentation_of_first_attribute = (
            column_number + len(tag) + 2)
        starttag_text = self.get_starttag_text()

        # Check whether the values of all attributes are placed
        # in double quotes.
        for attr, value in attrs:
            # Not all attributes will have a value.
            # Therefore the check should run only for those
            # attributes which have a value.
            if value:
                expected_value = '"' + value + '"'

                # &quot; is rendered as a double quote by the parser.
                if '&quot;' in starttag_text:
                    rendered_text = starttag_text.replace('&quot;', '"')
                else:
                    rendered_text = starttag_text

                if not expected_value in rendered_text:
                    self.failed = True
                    python_utils.PRINT(
                        '%s --> The value %s of attribute '
                        '%s for the tag %s on line %s should '
                        'be enclosed within double quotes.' % (
                            self.filepath, value, attr,
                            tag, line_number))
                    python_utils.PRINT('')

        for line_num, line in enumerate(starttag_text.splitlines()):
            if line_num == 0:
                continue

            leading_spaces_count = len(line) - len(line.lstrip())
            list_of_attrs = []

            for attr, _ in attrs:
                list_of_attrs.append(attr)

            if not line.lstrip().startswith(tuple(list_of_attrs)):
                continue
            if indentation_of_first_attribute != leading_spaces_count:
                line_num_of_error = line_number + line_num
                python_utils.PRINT(
                    '%s --> Attribute for tag %s on line '
                    '%s should align with the leftmost '
                    'attribute on line %s ' % (
                        self.filepath, tag,
                        line_num_of_error, line_number))
                python_utils.PRINT('')
                self.failed = True

    def handle_endtag(self, tag):
        """Handle end tag of a HTML line.

        Args:
            tag: str. end tag of a HTML line.
        """
        line_number, _ = self.getpos()
        tag_line = self.file_lines[line_number - 1]
        leading_spaces_count = len(tag_line) - len(tag_line.lstrip())

        try:
            last_starttag, last_starttag_line_num, last_starttag_col_num = (
                self.tag_stack.pop())
        except IndexError:
            raise TagMismatchException('Error in line %s of file %s\n' % (
                line_number, self.filepath))

        if last_starttag != tag:
            raise TagMismatchException('Error in line %s of file %s\n' % (
                line_number, self.filepath))

        if leading_spaces_count != last_starttag_col_num and (
                last_starttag_line_num != line_number):
            python_utils.PRINT(
                '%s --> Indentation for end tag %s on line '
                '%s does not match the indentation of the '
                'start tag %s on line %s ' % (
                    self.filepath, tag, line_number,
                    last_starttag, last_starttag_line_num))
            python_utils.PRINT('')
            self.failed = True

        self.indentation_level -= 1

        if self.debug:
            python_utils.PRINT('DEBUG MODE: End tag_stack')
            python_utils.PRINT(self.tag_stack)

    def handle_data(self, data):
        """Handle indentation level.

        Args:
            data: str. contents of HTML file to be parsed.
        """
        data_lines = data.split('\n')
        opening_block = tuple(
            ['{% block', '{% macro', '{% if', '% for', '% if'])
        ending_block = tuple(['{% end', '{%- end', '% } %>'])
        for data_line in data_lines:
            data_line = data_line.lstrip()
            if data_line.startswith(opening_block):
                self.indentation_level += 1
            elif data_line.startswith(ending_block):
                self.indentation_level -= 1


class HTMLLintChecksManager(python_utils.OBJECT):
    """Manages all the HTML linting functions.

    Attributes:
        files_to_lint: list(str). A list of filepaths to lint.
        verbose_mode_enabled: bool. True if verbose mode is enabled.
    """
    def __init__(
            self, files_to_lint, verbose_mode_enabled):
        """Constructs a HTMLLintChecksManager object.

        Args:
            files_to_lint: list(str). A list of filepaths to lint.
            verbose_mode_enabled: bool. True if verbose mode is enabled.
        """
        self.files_to_lint = files_to_lint
        self.verbose_mode_enabled = verbose_mode_enabled

    @property
    def html_filepaths(self):
        """Return all html filepaths."""
        return self.files_to_lint

    @property
    def all_filepaths(self):
        """Return all filepaths."""
        return self.html_filepaths

    def _check_html_tags_and_attributes(self, debug=False):
        """This function checks the indentation of lines in HTML files."""

        if self.verbose_mode_enabled:
            python_utils.PRINT('Starting HTML tag and attribute check')
            python_utils.PRINT('----------------------------------------')

        html_files_to_lint = self.html_filepaths
        stdout = sys.stdout

        failed = False
        summary_messages = []

        with linter_utils.redirect_stdout(stdout):
            for filepath in html_files_to_lint:
                file_content = FILE_CACHE.read(filepath)
                file_lines = FILE_CACHE.readlines(filepath)
                parser = CustomHTMLParser(filepath, file_lines, debug)
                parser.feed(file_content)

                if len(parser.tag_stack) != 0:
                    raise TagMismatchException('Error in file %s\n' % filepath)

                if parser.failed:
                    failed = True

            if failed:
                summary_message = (
                    '%s HTML tag and attribute check failed, fix the HTML '
                    'files listed above.' % linter_utils.FAILED_MESSAGE_PREFIX)
                python_utils.PRINT(summary_message)
                summary_messages.append(summary_message)
            else:
                summary_message = (
                    '%s HTML tag and attribute check passed' % (
                        linter_utils.SUCCESS_MESSAGE_PREFIX))

                python_utils.PRINT(summary_message)
                summary_messages.append(summary_message)

            python_utils.PRINT('')

        return summary_messages

    def perform_all_lint_checks(self):
        """Perform all the lint checks and returns the messages returned by all
        the checks.

        Returns:
            all_messages: str. All the messages returned by the lint checks.
        """

        if not self.all_filepaths:
            python_utils.PRINT('')
            python_utils.PRINT('There are no HTML files to lint.')
            return []

        # The html tags and attributes check has an additional
        # debug mode which when enabled prints the tag_stack for each file.
        return self._check_html_tags_and_attributes()


class ThirdPartyHTMLLintChecksManager(python_utils.OBJECT):
    """Manages all the HTML linting functions.

    Attributes:
        files_to_lint: list(str). A list of filepaths to lint.
        verbose_mode_enabled: bool. True if verbose mode is enabled.
    """
    def __init__(
            self, files_to_lint, verbose_mode_enabled):
        """Constructs a ThirdPartyHTMLLintChecksManager object.

        Args:
            files_to_lint: list(str). A list of filepaths to lint.
            verbose_mode_enabled: bool. True if verbose mode is enabled.
        """
        super(ThirdPartyHTMLLintChecksManager, self).__init__()
        self.files_to_lint = files_to_lint
        self.verbose_mode_enabled = verbose_mode_enabled

    @property
    def html_filepaths(self):
        """Return other filepaths."""
        return self.files_to_lint

    @property
    def all_filepaths(self):
        """Return all filepaths."""
        return self.html_filepaths

    def _lint_html_files(self):
        """This function is used to check HTML files for linting errors."""
        node_path = os.path.join(common.NODE_PATH, 'bin', 'node')
        htmllint_path = os.path.join(
            'node_modules', 'htmllint-cli', 'bin', 'cli.js')

        error_summary = []
        total_error_count = 0
        summary_messages = []
        stdout = sys.stdout
        htmllint_cmd_args = [node_path, htmllint_path, '--rc=.htmllintrc']
        html_files_to_lint = self.html_filepaths
        if self.verbose_mode_enabled:
            python_utils.PRINT('Starting HTML linter...')
            python_utils.PRINT('----------------------------------------')
        python_utils.PRINT('')
        if not self.verbose_mode_enabled:
            python_utils.PRINT('Linting HTML files.')
        for filepath in html_files_to_lint:
            proc_args = htmllint_cmd_args + [filepath]
            if self.verbose_mode_enabled:
                python_utils.PRINT('Linting %s file' % filepath)
            with linter_utils.redirect_stdout(stdout):
                proc = subprocess.Popen(
                    proc_args, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

                encoded_linter_stdout, _ = proc.communicate()
                linter_stdout = encoded_linter_stdout.decode(encoding='utf-8')
                # This line splits the output of the linter and extracts digits
                # from it. The digits are stored in a list. The second last
                # digit in the list represents the number of errors in the file.
                error_count = (
                    [int(s) for s in linter_stdout.split() if s.isdigit()][-2])
                if error_count:
                    error_summary.append(error_count)
                    python_utils.PRINT(linter_stdout)

        with linter_utils.redirect_stdout(stdout):
            if self.verbose_mode_enabled:
                python_utils.PRINT('----------------------------------------')
            for error_count in error_summary:
                total_error_count += error_count
            total_files_checked = len(html_files_to_lint)
            if total_error_count:
                python_utils.PRINT('(%s files checked, %s errors found)' % (
                    total_files_checked, total_error_count))
                summary_message = (
                    '%s HTML linting failed, fix the HTML files listed above'
                    '.' % linter_utils.FAILED_MESSAGE_PREFIX)
                summary_messages.append(summary_message)
            else:
                summary_message = (
                    '%s HTML linting passed' % (
                        linter_utils.SUCCESS_MESSAGE_PREFIX))
                summary_messages.append(summary_message)

            python_utils.PRINT('')
            python_utils.PRINT(summary_message)
            python_utils.PRINT('HTML linting finished.')
            python_utils.PRINT('')

        return summary_messages

    def perform_all_lint_checks(self):
        """Perform all the lint checks and returns the messages returned by all
        the checks.

        Returns:
            all_messages: str. All the messages returned by the lint checks.
        """
        if not self.all_filepaths:
            python_utils.PRINT('')
            python_utils.PRINT(
                'There are no HTML files to lint.')
            return []

        return self._lint_html_files()


def get_linters(files_to_lint, verbose_mode_enabled=False):
    """Creates HTMLLintChecksManager and ThirdPartyHTMLLintChecksManager
        objects and returns them.

    Args:
        files_to_lint: list(str). A list of filepaths to lint.
        verbose_mode_enabled: bool. True if verbose mode is enabled.

    Returns:
        tuple(HTMLLintChecksManager, ThirdPartyHTMLLintChecksManager). A 2-tuple
        of custom and third_party linter objects.
    """
    custom_linter = HTMLLintChecksManager(
        files_to_lint, verbose_mode_enabled)

    third_party_linter = ThirdPartyHTMLLintChecksManager(
        files_to_lint, verbose_mode_enabled)

    return custom_linter, third_party_linter
