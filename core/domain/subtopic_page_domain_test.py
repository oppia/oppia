# coding: utf-8
#
# Copyright 2018 The Oppia Authors. All Rights Reserved.
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

"""Tests for subtopic page domain objects."""

from constants import constants
from core.domain import subtopic_page_domain
from core.tests import test_utils
import utils


class SubtopicPageDomainUnitTests(test_utils.GenericTestBase):
    """Tests for subtopic page domain objects."""
    topic_id = 'topic_id'
    subtopic_id = 1

    def setUp(self):
        super(SubtopicPageDomainUnitTests, self).setUp()
        self.subtopic_page = (
            subtopic_page_domain.SubtopicPage.create_default_subtopic_page(
                self.subtopic_id, self.topic_id))

    def test_create_default_subtopic_page(self):
        """Tests the create_default_topic() function."""
        subtopic_page = (
            subtopic_page_domain.SubtopicPage.create_default_subtopic_page(
                self.subtopic_id, self.topic_id))
        expected_subtopic_page_dict = {
            'id': 'topic_id-1',
            'topic_id': 'topic_id',
            'html_data': '',
            'language_code': constants.DEFAULT_LANGUAGE_CODE,
            'version': 0
        }
        self.assertEqual(subtopic_page.to_dict(), expected_subtopic_page_dict)

    def test_get_subtopic_page_id(self):
        self.assertEqual(
            subtopic_page_domain.SubtopicPage.get_subtopic_page_id('abc', 1),
            'abc-1')

    def test_get_subtopic_id_from_subtopic_page_id(self):
        self.assertEqual(
            self.subtopic_page.get_subtopic_id_from_subtopic_page_id(), 1)

    def _assert_validation_error(self, expected_error_substring):
        """Checks that the topic passes strict validation."""
        with self.assertRaisesRegexp(
            utils.ValidationError, expected_error_substring):
            self.subtopic_page.validate()

    def test_subtopic_topic_id_validation(self):
        self.subtopic_page.topic_id = 1
        self._assert_validation_error('Expected topic_id to be a string')

    def test_subtopic_html_data_validation(self):
        self.subtopic_page.html_data = 1
        self._assert_validation_error('Expected html data to be a string')

    def test_language_code_validation(self):
        self.subtopic_page.language_code = 0
        self._assert_validation_error('Expected language code to be a string')

        self.subtopic_page.language_code = 'xz'
        self._assert_validation_error('Invalid language code')
