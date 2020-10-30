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

import html.parser
import os
import subprocess

import python_utils

from .. import common
from .. import concurrent_task_utils


class TagMismatchException(Exception):
    """Error class for mismatch between start and end tags."""

    pass


class CustomHTMLParser(html.parser.HTMLParser):
    """Custom HTML parser to check indentation."""

    def __init__(self, filepath, file_lines, failed=False):
        """Define various variables to parse HTML.

        Args:
            filepath: str. Path of the file.
            file_lines: list(str). List of the lines in the file.
            failed: bool. True if the HTML indentation check fails.
        """
        html.parser.HTMLParser.__init__(self)
        self.error_messages = []
        self.tag_stack = []
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
            tag: str. Start tag of a HTML line.
            attrs: list(str). List of attributes in the start tag.
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
                error_message = (
                    '%s --> Expected indentation '
                    'of %s, found indentation of %s '
                    'for content of %s tag on line %s ' % (
                        self.filepath, next_line_expected_indentation,
                        next_line_column_number, tag, line_number + 1))
                self.error_messages.append(error_message)
                self.failed = True

        if tag_line.startswith(opening_tag) and (
                column_number != expected_indentation):
            error_message = (
                '%s --> Expected indentation '
                'of %s, found indentation of %s '
                'for %s tag on line %s ' % (
                    self.filepath, expected_indentation,
                    column_number, tag, line_number))
            self.error_messages.append(error_message)
            self.failed = True

        if tag not in self.void_elements:
            self.tag_stack.append((tag, line_number, column_number))
            self.indentation_level += 1

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
                # &quot; is rendered as a double quote by the parser.
                if '&quot;' in starttag_text:
                    expected_value = value
                    rendered_text = starttag_text.replace('&quot;', '"')
                else:
                    expected_value = '"' + value + '"'
                    rendered_text = starttag_text

                if not expected_value in rendered_text:
                    self.failed = True
                    error_message = (
                        '%s --> The value %s of attribute '
                        '%s for the tag %s on line %s should '
                        'be enclosed within double quotes.' % (
                            self.filepath, value, attr,
                            tag, line_number))
                    self.error_messages.append(error_message)

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
                error_message = (
                    '%s --> Attribute for tag %s on line '
                    '%s should align with the leftmost '
                    'attribute on line %s ' % (
                        self.filepath, tag,
                        line_num_of_error, line_number))
                self.error_messages.append(error_message)
                self.failed = True

    def handle_endtag(self, tag):
        """Handle end tag of a HTML line.

        Args:
            tag: str. End tag of a HTML line.
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
            error_message = (
                '%s --> Indentation for end tag %s on line '
                '%s does not match the indentation of the '
                'start tag %s on line %s ' % (
                    self.filepath, tag, line_number,
                    last_starttag, last_starttag_line_num))
            self.error_messages.append(error_message)
            self.failed = True

        self.indentation_level -= 1

    def handle_data(self, data):
        """Handle indentation level.

        Args:
            data: str. Contents of HTML file to be parsed.
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
    """Manages all the HTML linting functions."""

    def __init__(self, files_to_lint, file_cache):
        """Constructs a HTMLLintChecksManager object.

        Args:
            files_to_lint: list(str). A list of filepaths to lint.
            file_cache: object(FileCache). Provides thread-safe access to cached
                file content.
        """
        self.files_to_lint = files_to_lint
        self.file_cache = file_cache

    @property
    def html_filepaths(self):
        """Return all html filepaths."""
        return self.files_to_lint

    @property
    def all_filepaths(self):
        """Return all filepaths."""
        return self.html_filepaths

    def check_html_tags_and_attributes(self):
        """This function checks the indentation of lines in HTML files.

        Returns:
            TaskResult. A TaskResult object representing the result of the lint
            check.
        """
        html_files_to_lint = self.html_filepaths
        failed = False
        error_messages = []
        name = 'HTML tag and attribute'

        for filepath in html_files_to_lint:
            file_content = self.file_cache.read(filepath)
            file_lines = self.file_cache.readlines(filepath)
            parser = CustomHTMLParser(filepath, file_lines)
            parser.feed(file_content)

            if len(parser.tag_stack) != 0:
                raise TagMismatchException('Error in file %s\n' % filepath)

            if parser.failed:
                error_messages.extend(parser.error_messages)
                failed = True
        return concurrent_task_utils.TaskResult(
            name, failed, error_messages, error_messages)

    def perform_all_lint_checks(self):
        """Perform all the lint checks and returns the messages returned by all
        the checks.

        Returns:
            list(TaskResult). A list of TaskResult objects representing the
            results of the lint checks.
        """

        if not self.all_filepaths:
            return [
                concurrent_task_utils.TaskResult(
                    'HTML lint', False, [],
                    ['There are no HTML files to lint.'])]

        return [self.check_html_tags_and_attributes()]


class ThirdPartyHTMLLintChecksManager(python_utils.OBJECT):
    """Manages all the HTML linting functions."""

    def __init__(self, files_to_lint):
        """Constructs a ThirdPartyHTMLLintChecksManager object.

        Args:
            files_to_lint: list(str). A list of filepaths to lint.
        """
        super(ThirdPartyHTMLLintChecksManager, self).__init__()
        self.files_to_lint = files_to_lint

    @property
    def html_filepaths(self):
        """Return other filepaths."""
        return self.files_to_lint

    @property
    def all_filepaths(self):
        """Return all filepaths."""
        return self.html_filepaths

    @staticmethod
    def _get_trimmed_error_output(html_lint_output):
        """Remove extra bits from htmllint error messages.

        Args:
            html_lint_output: str. Output returned by the html linter.

        Returns:
            str. A string with the trimmed error messages.
        """
        trimmed_error_messages = []
        # Extracting messages by removing number of files linted and number of
        # error messages from the end of message. Becuase we have second last
        # line containing error and file count.
        # Example: [htmllint] found 1 errors out of 1 files
        # and last line is an empty string. Hence removing last two lines from
        # the message.
        html_output_lines = html_lint_output.split('\n')
        empty_string_present = html_output_lines[-1] == ''
        htmllint_present = html_output_lines[-2].startswith('[htmllint]')

        if empty_string_present and htmllint_present:
            html_output_lines = html_output_lines[:-2]

        for line in html_output_lines:
            trimmed_error_messages.append(line)
        return '\n'.join(trimmed_error_messages) + '\n'

    def lint_html_files(self):
        """This function is used to check HTML files for linting errors.

        Returns:
            TaskResult. A TaskResult object representing the result of the lint
            check.
        """
        node_path = os.path.join(common.NODE_PATH, 'bin', 'node')
        htmllint_path = os.path.join(
            'node_modules', 'htmllint-cli', 'bin', 'cli.js')

        failed = False
        name = 'HTMLLint'
        error_messages = []
        full_error_messages = []
        htmllint_cmd_args = [node_path, htmllint_path, '--rc=.htmllintrc']
        html_files_to_lint = self.html_filepaths
        for filepath in html_files_to_lint:
            proc_args = htmllint_cmd_args + [filepath]
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
                failed = True
                full_error_messages.append(linter_stdout)
                error_messages.append(
                    self._get_trimmed_error_output(linter_stdout))

        return concurrent_task_utils.TaskResult(
            name, failed, error_messages, full_error_messages)

    def perform_all_lint_checks(self):
        """Perform all the lint checks and returns the messages returned by all
        the checks.

        Returns:
            list(TaskResult). A list of TaskResult objects representing the
            results of the lint checks.
        """
        if not self.all_filepaths:
            return [
                concurrent_task_utils.TaskResult(
                    'HTML lint', False, [],
                    ['There are no HTML files to lint.'])]

        return [self.lint_html_files()]


def get_linters(files_to_lint, file_cache):
    """Creates HTMLLintChecksManager and ThirdPartyHTMLLintChecksManager
        objects and returns them.

    Args:
        files_to_lint: list(str). A list of filepaths to lint.
        file_cache: object(FileCache). Provides thread-safe access to cached
            file content.

    Returns:
        tuple(HTMLLintChecksManager, ThirdPartyHTMLLintChecksManager). A 2-tuple
        of custom and third_party linter objects.
    """
    custom_linter = HTMLLintChecksManager(files_to_lint, file_cache)

    third_party_linter = ThirdPartyHTMLLintChecksManager(files_to_lint)

    return custom_linter, third_party_linter
