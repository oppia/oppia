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

"""Unit tests for scripts/update_changelog_and_credits.py."""
from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import os

from core.tests import test_utils
import python_utils

from . import update_changelog_and_credits

RELEASE_TEST_DIR = os.path.join('core', 'tests', 'release_sources', '')

MOCK_RELEASE_SUMMARY_FILEPATH = os.path.join(
    RELEASE_TEST_DIR, 'release_summary.md')

MOCK_CHANGELOG_FILEPATH = os.path.join(RELEASE_TEST_DIR, 'CHANGELOG')
MOCK_AUTHORS_FILEPATH = os.path.join(RELEASE_TEST_DIR, 'AUTHORS')
MOCK_CONTRIBUTORS_FILEPATH = os.path.join(RELEASE_TEST_DIR, 'CONTRIBUTORS')
MOCK_ABOUT_PAGE_FILEPATH = os.path.join(
    RELEASE_TEST_DIR, 'about-page.directive.html')

MOCK_UPDATED_CHANGELOG_FILEPATH = os.path.join(
    RELEASE_TEST_DIR, 'UPDATED_CHANGELOG')
MOCK_UPDATED_AUTHORS_FILEPATH = os.path.join(
    RELEASE_TEST_DIR, 'UPDATED_AUTHORS')
MOCK_UPDATED_CONTRIBUTORS_FILEPATH = os.path.join(
    RELEASE_TEST_DIR, 'UPDATED_CONTRIBUTORS')
MOCK_UPDATED_ABOUT_PAGE_FILEPATH = os.path.join(
    RELEASE_TEST_DIR, 'updated-about-page.directive.html')


class ChangelogAndCreditsUpdateTests(test_utils.GenericTestBase):
    """Test the methods for automatic update of changelog and credits."""
    def setUp(self):
        super(ChangelogAndCreditsUpdateTests, self).setUp()
        with python_utils.open_file(MOCK_RELEASE_SUMMARY_FILEPATH, 'r') as f:
            self.release_summary_lines = f.readlines()

    def test_update_changelog(self):
        with python_utils.open_file(MOCK_CHANGELOG_FILEPATH, 'r') as f:
            changelog_filelines = f.readlines()
        with python_utils.open_file(MOCK_UPDATED_CHANGELOG_FILEPATH, 'r') as f:
            expected_filelines = f.readlines()
        changelog_swap = self.swap(
            update_changelog_and_credits, 'CHANGELOG_FILEPATH',
            MOCK_CHANGELOG_FILEPATH)
        date_swap = self.swap(
            update_changelog_and_credits, 'CURRENT_DATE',
            '29 Aug 2019')
        with changelog_swap, date_swap:
            update_changelog_and_credits.update_changelog(
                self.release_summary_lines, '1.2.3')
        with python_utils.open_file(MOCK_CHANGELOG_FILEPATH, 'r') as f:
            actual_filelines = f.readlines()
        with python_utils.open_file(MOCK_CHANGELOG_FILEPATH, 'w') as f:
            for line in changelog_filelines:
                f.write(line)
        self.assertEqual(actual_filelines, expected_filelines)

    def test_update_authors(self):
        with python_utils.open_file(MOCK_AUTHORS_FILEPATH, 'r') as f:
            authors_filelines = f.readlines()
        with python_utils.open_file(MOCK_UPDATED_AUTHORS_FILEPATH, 'r') as f:
            expected_filelines = f.readlines()
        with self.swap(
            update_changelog_and_credits, 'AUTHORS_FILEPATH',
            MOCK_AUTHORS_FILEPATH):
            update_changelog_and_credits.update_authors(
                self.release_summary_lines)
        with python_utils.open_file(MOCK_AUTHORS_FILEPATH, 'r') as f:
            actual_filelines = f.readlines()
        with python_utils.open_file(MOCK_AUTHORS_FILEPATH, 'w') as f:
            for line in authors_filelines:
                f.write(line)
        self.assertEqual(actual_filelines, expected_filelines)

    def test_update_contributors(self):
        with python_utils.open_file(MOCK_CONTRIBUTORS_FILEPATH, 'r') as f:
            contributors_filelines = f.readlines()
        with python_utils.open_file(
            MOCK_UPDATED_CONTRIBUTORS_FILEPATH, 'r') as f:
            expected_filelines = f.readlines()
        with self.swap(
            update_changelog_and_credits, 'CONTRIBUTORS_FILEPATH',
            MOCK_CONTRIBUTORS_FILEPATH):
            update_changelog_and_credits.update_contributors(
                self.release_summary_lines)
        with python_utils.open_file(MOCK_CONTRIBUTORS_FILEPATH, 'r') as f:
            actual_filelines = f.readlines()
        with python_utils.open_file(MOCK_CONTRIBUTORS_FILEPATH, 'w') as f:
            for line in contributors_filelines:
                f.write(line)
        self.assertEqual(actual_filelines, expected_filelines)

    def test_update_developer_names(self):
        with python_utils.open_file(MOCK_ABOUT_PAGE_FILEPATH, 'r') as f:
            about_page_filelines = f.readlines()
        with python_utils.open_file(
            MOCK_UPDATED_ABOUT_PAGE_FILEPATH, 'r') as f:
            expected_filelines = f.readlines()
        with self.swap(
            update_changelog_and_credits, 'ABOUT_PAGE_FILEPATH',
            MOCK_ABOUT_PAGE_FILEPATH):
            update_changelog_and_credits.update_developer_names(
                self.release_summary_lines)
        with python_utils.open_file(MOCK_ABOUT_PAGE_FILEPATH, 'r') as f:
            actual_filelines = f.readlines()
        with python_utils.open_file(MOCK_ABOUT_PAGE_FILEPATH, 'w') as f:
            for line in about_page_filelines:
                f.write(line)
        self.assertEqual(actual_filelines, expected_filelines)

    def test_missing_section_in_release_summary(self):
        invalid_ordering = {
            '### section1:\n': '### section2: \n'
        }
        ordering_swap = self.swap(
            update_changelog_and_credits, 'EXPECTED_ORDERING',
            invalid_ordering)
        with ordering_swap, self.assertRaisesRegexp(
            Exception, (
                'Expected release_summary to have ### section1: section to '
                'ensure that automatic updates to changelog and credits are '
                'correct.')):
            update_changelog_and_credits.check_ordering_of_sections(
                self.release_summary_lines)

    def test_invalid_ordering_of_sections_in_release_summary(self):
        invalid_ordering = {
            '### New Authors:\n': '### section2: \n'
        }
        ordering_swap = self.swap(
            update_changelog_and_credits, 'EXPECTED_ORDERING',
            invalid_ordering)
        with ordering_swap, self.assertRaisesRegexp(
            Exception, (
                'Expected ### New Authors: section to be followed by ### '
                'section2: section in release_summary to ensure that automatic '
                'updates to changelog and credits are correct.')):
            update_changelog_and_credits.check_ordering_of_sections(
                self.release_summary_lines)

    def test_missing_span_in_about_page(self):
        about_page_lines = [
            '<p>Invalid</p>\n', '<ul>\n', '  <li>line</li>\n', '</ul>\n']
        with self.assertRaisesRegexp(
            Exception, (
                'Expected about-page.directive.html to have <span>A</span>.')):
            update_changelog_and_credits.find_indentation(about_page_lines)

    def test_missing_li_in_about_page(self):
        about_page_lines = [
            '<span>A</span>\n', '<ul>\n', '  <p>Invalid line</p>\n', '</ul>\n']
        with self.assertRaisesRegexp(
            Exception, (
                'Expected <span>A</span> text to be followed by an unordered '
                'list in about-page.directive.html')):
            update_changelog_and_credits.find_indentation(about_page_lines)
