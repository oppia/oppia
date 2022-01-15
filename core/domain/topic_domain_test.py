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

"""Tests for topic domain objects."""

from __future__ import annotations

import datetime
import os

from core import feconf
from core import python_utils
from core import utils
from core.constants import constants
from core.domain import fs_domain
from core.domain import topic_domain
from core.domain import user_services
from core.tests import test_utils


class TopicDomainUnitTests(test_utils.GenericTestBase):
    """Tests for topic domain objects."""

    topic_id = 'topic_id'

    def setUp(self) -> None:
        super(TopicDomainUnitTests, self).setUp()
        self.signup('a@example.com', 'A')
        self.signup('b@example.com', 'B')
        self.topic = topic_domain.Topic.create_default_topic(
            self.topic_id, 'Name', 'abbrev', 'description')
        self.topic.subtopics = [
            topic_domain.Subtopic(
                1, 'Title', ['skill_id_1'], 'image.svg',
                constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0], 21131,
                'dummy-subtopic-url')]
        self.topic.next_subtopic_id = 2

        self.user_id_a = self.get_user_id_from_email('a@example.com')  # type: ignore[no-untyped-call]
        self.user_id_b = self.get_user_id_from_email('b@example.com')  # type: ignore[no-untyped-call]

        self.user_a = user_services.get_user_actions_info(self.user_id_a)  # type: ignore[no-untyped-call]
        self.user_b = user_services.get_user_actions_info(self.user_id_b)  # type: ignore[no-untyped-call]

    def test_create_default_topic(self) -> None:
        """Tests the create_default_topic() function."""
        topic = topic_domain.Topic.create_default_topic(
            self.topic_id, 'Name', 'abbrev', 'description')
        expected_topic_dict: topic_domain.TopicDict = {
            'id': self.topic_id,
            'name': 'Name',
            'abbreviated_name': 'Name',
            'url_fragment': 'abbrev',
            'thumbnail_filename': None,
            'thumbnail_bg_color': None,
            'thumbnail_size_in_bytes': None,
            'description': 'description',
            'canonical_story_references': [],
            'additional_story_references': [],
            'uncategorized_skill_ids': [],
            'subtopics': [],
            'next_subtopic_id': 1,
            'language_code': constants.DEFAULT_LANGUAGE_CODE,
            'subtopic_schema_version': feconf.CURRENT_SUBTOPIC_SCHEMA_VERSION,
            'story_reference_schema_version': (
                feconf.CURRENT_STORY_REFERENCE_SCHEMA_VERSION),
            'version': 0,
            'practice_tab_is_displayed': False,
            'meta_tag_content': '',
            'page_title_fragment_for_web': ''
        }
        self.assertEqual(topic.to_dict(), expected_topic_dict)

    def test_get_all_skill_ids(self) -> None:
        self.topic.uncategorized_skill_ids = ['skill_id_2', 'skill_id_3']
        self.assertEqual(
            self.topic.get_all_skill_ids(),
            ['skill_id_2', 'skill_id_3', 'skill_id_1'])

    def test_get_all_uncategorized_skill_ids(self) -> None:
        self.topic.uncategorized_skill_ids = ['skill_id_1', 'skill_id_2']
        self.assertEqual(
            self.topic.get_all_uncategorized_skill_ids(),
            ['skill_id_1', 'skill_id_2'])

    def test_get_all_subtopics(self) -> None:
        subtopics = self.topic.get_all_subtopics()
        self.assertEqual(
            subtopics, [{
                'skill_ids': ['skill_id_1'],
                'id': 1,
                'thumbnail_filename': 'image.svg',
                'thumbnail_bg_color': '#FFFFFF',
                'thumbnail_size_in_bytes': 21131,
                'title': 'Title',
                'url_fragment': 'dummy-subtopic-url'}])

    def test_get_subtopic_index_fail_with_invalid_subtopic_id(self) -> None:
        with self.assertRaisesRegex(  # type: ignore[no-untyped-call]
            Exception, 'The subtopic with id -2 does not exist.'
        ):
            self.topic.get_subtopic_index(-2)

    def test_validation_story_id_with_invalid_data(self) -> None:
        story_reference = (
            topic_domain.StoryReference.create_default_story_reference(
            ''))
        with self.assertRaisesRegex(  # type: ignore[no-untyped-call]
            utils.ValidationError, 'Story id should not be empty'):
            story_reference.validate()

    def test_delete_canonical_story(self) -> None:
        self.topic.canonical_story_references = [
            topic_domain.StoryReference.create_default_story_reference(
                'story_id'),
            topic_domain.StoryReference.create_default_story_reference(
                'story_id_1'),
            topic_domain.StoryReference.create_default_story_reference(
                'story_id_2')
        ]
        self.topic.delete_canonical_story('story_id_1')
        canonical_story_ids = self.topic.get_canonical_story_ids()
        self.assertEqual(
            canonical_story_ids, ['story_id', 'story_id_2'])
        with self.assertRaisesRegex(  # type: ignore[no-untyped-call]
            Exception, 'The story_id story_id_5 is not present in the canonical'
            ' story references list of the topic.'):
            self.topic.delete_canonical_story('story_id_5')

    def test_rearrange_canonical_story_fail_with_out_of_bound_indexes(
        self
    ) -> None:
        self.topic.canonical_story_references = [
            topic_domain.StoryReference.create_default_story_reference(
                'story_id_1')
        ]
        with self.assertRaisesRegex(  # type: ignore[no-untyped-call]
            Exception, 'Expected from_index value to be with-in bounds.'):
            self.topic.rearrange_canonical_story(10, 0)

        with self.assertRaisesRegex(  # type: ignore[no-untyped-call]
            Exception, 'Expected from_index value to be with-in bounds.'):
            self.topic.rearrange_canonical_story(-1, 0)

        with self.assertRaisesRegex(  # type: ignore[no-untyped-call]
            Exception, 'Expected to_index value to be with-in bounds.'):
            self.topic.rearrange_canonical_story(0, 10)

        with self.assertRaisesRegex(  # type: ignore[no-untyped-call]
            Exception, 'Expected to_index value to be with-in bounds.'):
            self.topic.rearrange_canonical_story(0, -1)

    def test_rearrange_canonical_story_fail_with_identical_index_values(
        self
    ) -> None:
        with self.assertRaisesRegex(  # type: ignore[no-untyped-call]
            Exception, 'Expected from_index and to_index values to be '
                       'different.'):
            self.topic.rearrange_canonical_story(1, 1)

    def test_rearrange_canonical_story(self) -> None:
        self.topic.canonical_story_references = [
            topic_domain.StoryReference.create_default_story_reference(
                'story_id_1'),
            topic_domain.StoryReference.create_default_story_reference(
                'story_id_2'),
            topic_domain.StoryReference.create_default_story_reference(
                'story_id_3')
        ]
        canonical_story_ids = self.topic.get_canonical_story_ids()

        self.assertEqual(canonical_story_ids[0], 'story_id_1')
        self.assertEqual(canonical_story_ids[1], 'story_id_2')
        self.assertEqual(canonical_story_ids[2], 'story_id_3')

        self.topic.rearrange_canonical_story(1, 0)
        canonical_story_ids = self.topic.get_canonical_story_ids()
        self.assertEqual(canonical_story_ids[0], 'story_id_2')
        self.assertEqual(canonical_story_ids[1], 'story_id_1')
        self.assertEqual(canonical_story_ids[2], 'story_id_3')

        self.topic.rearrange_canonical_story(2, 1)
        canonical_story_ids = self.topic.get_canonical_story_ids()
        self.assertEqual(canonical_story_ids[0], 'story_id_2')
        self.assertEqual(canonical_story_ids[1], 'story_id_3')
        self.assertEqual(canonical_story_ids[2], 'story_id_1')

        self.topic.rearrange_canonical_story(2, 0)
        canonical_story_ids = self.topic.get_canonical_story_ids()
        self.assertEqual(canonical_story_ids[0], 'story_id_1')
        self.assertEqual(canonical_story_ids[1], 'story_id_2')
        self.assertEqual(canonical_story_ids[2], 'story_id_3')

    def test_rearrange_skill_in_subtopic_fail_with_out_of_bound_indexes(
        self
    ) -> None:
        with self.assertRaisesRegex(  # type: ignore[no-untyped-call]
            Exception, 'Expected from_index value to be with-in bounds.'):
            self.topic.rearrange_skill_in_subtopic(1, 10, 1)

        with self.assertRaisesRegex(  # type: ignore[no-untyped-call]
            Exception, 'Expected from_index value to be with-in bounds.'):
            self.topic.rearrange_skill_in_subtopic(1, -1, 0)

        with self.assertRaisesRegex(  # type: ignore[no-untyped-call]
            Exception, 'Expected to_index value to be with-in bounds.'):
            self.topic.rearrange_skill_in_subtopic(1, 0, 10)

        with self.assertRaisesRegex(  # type: ignore[no-untyped-call]
            Exception, 'Expected to_index value to be with-in bounds.'):
            self.topic.rearrange_skill_in_subtopic(1, 0, -10)

    def test_rearrange_skill_in_subtopic_fail_with_identical_index_values(
        self
    ) -> None:
        with self.assertRaisesRegex(  # type: ignore[no-untyped-call]
            Exception, 'Expected from_index and to_index values to be '
                       'different.'):
            self.topic.rearrange_skill_in_subtopic(1, 1, 1)

    def test_rearrange_skill_in_subtopic(self) -> None:
        self.topic.subtopics = [
            topic_domain.Subtopic(
                1, 'Title', ['skill_id_1', 'skill_id_2', 'skill_id_3'],
                'image.svg',
                constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0], 21131,
                'dummy-subtopic-three')]

        skill_ids = self.topic.subtopics[0].skill_ids

        self.assertEqual(skill_ids[0], 'skill_id_1')
        self.assertEqual(skill_ids[1], 'skill_id_2')
        self.assertEqual(skill_ids[2], 'skill_id_3')

        self.topic.rearrange_skill_in_subtopic(1, 1, 0)
        self.assertEqual(skill_ids[0], 'skill_id_2')
        self.assertEqual(skill_ids[1], 'skill_id_1')
        self.assertEqual(skill_ids[2], 'skill_id_3')

        self.topic.rearrange_skill_in_subtopic(1, 2, 1)
        self.assertEqual(skill_ids[0], 'skill_id_2')
        self.assertEqual(skill_ids[1], 'skill_id_3')
        self.assertEqual(skill_ids[2], 'skill_id_1')

        self.topic.rearrange_skill_in_subtopic(1, 2, 0)
        self.assertEqual(skill_ids[0], 'skill_id_1')
        self.assertEqual(skill_ids[1], 'skill_id_2')
        self.assertEqual(skill_ids[2], 'skill_id_3')

    def test_rearrange_subtopic_fail_with_out_of_bound_indexes(self) -> None:
        with self.assertRaisesRegex(  # type: ignore[no-untyped-call]
            Exception, 'Expected from_index value to be with-in bounds.'):
            self.topic.rearrange_subtopic(10, 1)

        with self.assertRaisesRegex(  # type: ignore[no-untyped-call]
            Exception, 'Expected from_index value to be with-in bounds.'):
            self.topic.rearrange_subtopic(-1, 0)

        with self.assertRaisesRegex(  # type: ignore[no-untyped-call]
            Exception, 'Expected to_index value to be with-in bounds.'):
            self.topic.rearrange_subtopic(0, 10)

        with self.assertRaisesRegex(  # type: ignore[no-untyped-call]
            Exception, 'Expected to_index value to be with-in bounds.'):
            self.topic.rearrange_subtopic(0, -10)

    def test_rearrange_subtopic_fail_with_identical_index_values(self) -> None:
        with self.assertRaisesRegex(  # type: ignore[no-untyped-call]
            Exception, 'Expected from_index and to_index values to be '
                       'different.'):
            self.topic.rearrange_subtopic(1, 1)

    def test_rearrange_subtopic(self) -> None:
        self.topic.subtopics = [
            topic_domain.Subtopic(
                1, 'Title1', [], None, None, None, 'title-one'),
            topic_domain.Subtopic(
                2, 'Title2', [], None, None, None, 'title-two'),
            topic_domain.Subtopic(
                3, 'Title3', [], None, None, None, 'title-three')]

        subtopics = self.topic.subtopics

        self.assertEqual(subtopics[0].id, 1)
        self.assertEqual(subtopics[1].id, 2)
        self.assertEqual(subtopics[2].id, 3)

        self.topic.rearrange_subtopic(1, 0)
        self.assertEqual(subtopics[0].id, 2)
        self.assertEqual(subtopics[1].id, 1)
        self.assertEqual(subtopics[2].id, 3)

        self.topic.rearrange_subtopic(2, 1)
        self.assertEqual(subtopics[0].id, 2)
        self.assertEqual(subtopics[1].id, 3)
        self.assertEqual(subtopics[2].id, 1)

        self.topic.rearrange_subtopic(2, 0)
        self.assertEqual(subtopics[0].id, 1)
        self.assertEqual(subtopics[1].id, 2)
        self.assertEqual(subtopics[2].id, 3)

    def test_get_all_story_references(self) -> None:
        self.topic.canonical_story_references = [
            topic_domain.StoryReference.create_default_story_reference(
                'story_id'),
            topic_domain.StoryReference.create_default_story_reference(
                'story_id_1')
        ]
        self.topic.additional_story_references = [
            topic_domain.StoryReference.create_default_story_reference(
                'story_id_2'),
            topic_domain.StoryReference.create_default_story_reference(
                'story_id_3')
        ]
        all_story_references = self.topic.get_all_story_references()
        self.assertEqual(len(all_story_references), 4)
        self.assertEqual(all_story_references[0].story_id, 'story_id')
        self.assertEqual(all_story_references[1].story_id, 'story_id_1')
        self.assertEqual(all_story_references[2].story_id, 'story_id_2')
        self.assertEqual(all_story_references[3].story_id, 'story_id_3')

    def test_add_canonical_story(self) -> None:
        self.topic.canonical_story_references = [
            topic_domain.StoryReference.create_default_story_reference(
                'story_id'),
            topic_domain.StoryReference.create_default_story_reference(
                'story_id_1')
        ]
        self.topic.add_canonical_story('story_id_2')
        canonical_story_ids = self.topic.get_canonical_story_ids()
        self.assertEqual(
            canonical_story_ids,
            ['story_id', 'story_id_1', 'story_id_2'])
        with self.assertRaisesRegex(  # type: ignore[no-untyped-call]
            Exception, 'The story_id story_id_2 is already present in the '
            'canonical story references list of the topic.'):
            self.topic.add_canonical_story('story_id_2')

    def test_delete_additional_story(self) -> None:
        self.topic.additional_story_references = [
            topic_domain.StoryReference.create_default_story_reference(
                'story_id'),
            topic_domain.StoryReference.create_default_story_reference(
                'story_id_1'),
            topic_domain.StoryReference.create_default_story_reference(
                'story_id_2')
        ]
        self.topic.delete_additional_story('story_id_1')
        additional_story_ids = self.topic.get_additional_story_ids()
        self.assertEqual(
            additional_story_ids, ['story_id', 'story_id_2'])
        with self.assertRaisesRegex(  # type: ignore[no-untyped-call]
            Exception,
            'The story_id story_id_5 is not present in the additional'
            ' story references list of the topic.'):
            self.topic.delete_additional_story('story_id_5')

    def test_add_additional_story(self) -> None:
        self.topic.additional_story_references = [
            topic_domain.StoryReference.create_default_story_reference(
                'story_id'),
            topic_domain.StoryReference.create_default_story_reference(
                'story_id_1')
        ]
        self.topic.add_additional_story('story_id_2')
        additional_story_ids = self.topic.get_additional_story_ids()
        self.assertEqual(
            additional_story_ids,
            ['story_id', 'story_id_1', 'story_id_2'])
        with self.assertRaisesRegex(  # type: ignore[no-untyped-call]
            Exception, 'The story_id story_id_2 is already present in the '
            'additional story references list of the topic.'):
            self.topic.add_additional_story('story_id_2')

    def _assert_validation_error(  # type: ignore[override]
        self,
        expected_error_substring: str
    ) -> None:
        """Checks that the topic passes strict validation."""
        with self.assertRaisesRegex(  # type: ignore[no-untyped-call]
            utils.ValidationError, expected_error_substring):
            self.topic.validate()

    def _assert_strict_validation_error(
        self,
        expected_error_substring: str
    ) -> None:
        """Checks that the topic passes prepublish validation."""
        with self.assertRaisesRegex(  # type: ignore[no-untyped-call]
            utils.ValidationError, expected_error_substring):
            self.topic.validate(strict=True)

    def _assert_valid_topic_id(
        self,
        expected_error_substring: str,
        topic_id: str
    ) -> None:
        """Checks that the skill passes strict validation."""
        with self.assertRaisesRegex(  # type: ignore[no-untyped-call]
            utils.ValidationError, expected_error_substring):
            topic_domain.Topic.require_valid_topic_id(topic_id)

    def _assert_valid_name_for_topic(
        self,
        expected_error_substring: str,
        name: str
    ) -> None:
        """Checks that the topic passes strict validation."""
        with self.assertRaisesRegex(  # type: ignore[no-untyped-call]
            utils.ValidationError, expected_error_substring):
            topic_domain.Topic.require_valid_name(name)

    def _assert_valid_thumbnail_filename_for_topic(
        self,
        expected_error_substring: str,
        thumbnail_filename: str
    ) -> None:
        """Checks that topic passes validation for thumbnail filename."""
        with self.assertRaisesRegex(  # type: ignore[no-untyped-call]
            utils.ValidationError, expected_error_substring):
            topic_domain.Topic.require_valid_thumbnail_filename(
                thumbnail_filename)

    def _assert_valid_thumbnail_filename_for_subtopic(
        self,
        expected_error_substring: str,
        thumbnail_filename: str
    ) -> None:
        """Checks that subtopic passes validation for thumbnail filename."""
        with self.assertRaisesRegex(  # type: ignore[no-untyped-call]
            utils.ValidationError, expected_error_substring):
            topic_domain.Subtopic.require_valid_thumbnail_filename(
                thumbnail_filename)

    def test_valid_topic_id(self) -> None:
        self._assert_valid_topic_id('Topic id abc is invalid', 'abc')

    def test_valid_name_topic(self) -> None:
        self._assert_valid_name_for_topic(
            'Name field should not be empty', '')
        self._assert_valid_name_for_topic(
            'Topic name should be at most 39 characters, received '
            'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
            'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')

    def test_thumbnail_filename_validation_for_topic(self) -> None:
        self._assert_valid_thumbnail_filename_for_topic(
            'Thumbnail filename should not start with a dot.', '.name')
        self._assert_valid_thumbnail_filename_for_topic(
            'Thumbnail filename should not include slashes or '
            'consecutive dot characters.', 'file/name')
        self._assert_valid_thumbnail_filename_for_topic(
            'Thumbnail filename should not include slashes or '
            'consecutive dot characters.', 'file..name')
        self._assert_valid_thumbnail_filename_for_topic(
            'Thumbnail filename should include an extension.', 'name')
        self._assert_valid_thumbnail_filename_for_topic(
            'Expected a filename ending in svg, received name.jpg', 'name.jpg')

    def test_subtopic_strict_validation(self) -> None:
        self.topic.thumbnail_filename = 'filename.svg'
        self.topic.thumbnail_bg_color = (
            constants.ALLOWED_THUMBNAIL_BG_COLORS['topic'][0])
        self.topic.subtopics[0].skill_ids = []
        self._assert_strict_validation_error(
            'Subtopic with title Title does not have any skills linked')

        self.topic.subtopics = []
        self._assert_strict_validation_error(
            'Topic should have at least 1 subtopic.')

    def test_subtopic_title_validation(self) -> None:
        self.topic.subtopics[0].title = (
            'abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefgh'
            'ijklmnopqrstuvwxyz')
        self._assert_validation_error(
            'Expected subtopic title to be less than 64 characters')

    def test_thumbnail_filename_validation_for_subtopic(self) -> None:
        self._assert_valid_thumbnail_filename_for_subtopic(
            'Thumbnail filename should not start with a dot.', '.name')
        self._assert_valid_thumbnail_filename_for_subtopic(
            'Thumbnail filename should not include slashes or '
            'consecutive dot characters.', 'file/name')
        self._assert_valid_thumbnail_filename_for_subtopic(
            'Thumbnail filename should not include slashes or '
            'consecutive dot characters.', 'file..name')
        self._assert_valid_thumbnail_filename_for_subtopic(
            'Thumbnail filename should include an extension.', 'name')
        self._assert_valid_thumbnail_filename_for_subtopic(
            'Expected a filename ending in svg, received name.jpg', 'name.jpg')

    def test_topic_thumbnail_filename_in_strict_mode(self) -> None:
        self.topic.thumbnail_bg_color = None
        with self.assertRaisesRegex(  # type: ignore[no-untyped-call]
            utils.ValidationError,
            'Expected thumbnail filename to be a string, received None.'):
            self.topic.validate(strict=True)

    def test_topic_thumbnail_bg_validation(self) -> None:
        self.topic.thumbnail_bg_color = '#FFFFFF'
        self._assert_validation_error(
            'Topic thumbnail background color #FFFFFF is not supported.')

    def test_topic_thumbnail_filename_or_thumbnail_bg_color_is_none(
        self
    ) -> None:
        self.topic.thumbnail_bg_color = '#C6DCDA'
        self.topic.thumbnail_filename = None
        self._assert_validation_error(
            'Topic thumbnail image is not provided.')
        self.topic.thumbnail_bg_color = None
        self.topic.thumbnail_filename = 'test.svg'
        self._assert_validation_error(
            'Topic thumbnail background color is not specified.')

    def test_subtopic_thumbnail_bg_validation(self) -> None:
        self.topic.subtopics[0].thumbnail_bg_color = '#CACACA'
        self._assert_validation_error(
            'Subtopic thumbnail background color #CACACA is not supported.')

    def test_subtopic_thumbnail_filename_or_thumbnail_bg_color_is_none(
        self
    ) -> None:
        self.topic.subtopics[0].thumbnail_bg_color = '#FFFFFF'
        self.topic.subtopics[0].thumbnail_filename = None
        self._assert_validation_error(
            'Subtopic thumbnail image is not provided.')
        self.topic.subtopics[0].thumbnail_bg_color = None
        self.topic.subtopics[0].thumbnail_filename = 'test.svg'
        self._assert_validation_error(
            'Subtopic thumbnail background color is not specified.')

    def test_subtopic_thumbnail_size_in_bytes_validation(self) -> None:
        self.topic.subtopics[0].thumbnail_size_in_bytes = 0
        self._assert_validation_error(
            'Subtopic thumbnail size in bytes cannot be zero.')

    def test_subtopic_skill_ids_validation(self) -> None:
        self.topic.subtopics[0].skill_ids = ['skill_id', 'skill_id']
        self._assert_validation_error(
            'Expected all skill ids to be distinct.')

    def test_name_validation(self) -> None:
        self.topic.name = ''
        self._assert_validation_error('Name field should not be empty')
        self.topic.name = 'Very long and therefore invalid topic name'
        self._assert_validation_error(
            'Topic name should be at most 39 characters')

    def test_validation_fails_with_empty_url_fragment(self) -> None:
        self.topic.url_fragment = ''
        validation_message = 'Topic URL Fragment field should not be empty.'
        with self.assertRaisesRegex(  # type: ignore[no-untyped-call]
            utils.ValidationError, validation_message):
            self.topic.validate()

    def test_validation_fails_with_lengthy_url_fragment(self) -> None:
        self.topic.url_fragment = 'a' * 25
        url_fragment_char_limit = constants.MAX_CHARS_IN_TOPIC_URL_FRAGMENT
        validation_message = (
            'Topic URL Fragment field should not exceed %d characters, '
            'received %s.' % (
                url_fragment_char_limit, self.topic.url_fragment))
        with self.assertRaisesRegex(  # type: ignore[no-untyped-call]
            utils.ValidationError, validation_message):
            self.topic.validate()

    def test_subtopic_schema_version_validation(self) -> None:
        self.topic.subtopic_schema_version = 0
        self._assert_validation_error(
            'Expected subtopic schema version to be %s'
            % (feconf.CURRENT_SUBTOPIC_SCHEMA_VERSION))

    def test_description_validation(self) -> None:
        self.topic.description = (
            'Lorem ipsum dolor sit amet, consectetuer '
            'adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. '
            'Dum sociis natoque penatibus et magnis dis parturient montes, '
            'nascetur ridiculus mus. Donec quam felis, ultricies nec, '
            'pellentesque eu,'
        )
        self._assert_validation_error(
            'Topic description should be at most 240 characters.')

    def test_next_subtopic_id_validation(self) -> None:
        self.topic.next_subtopic_id = 1
        self._assert_validation_error(
            'The id for subtopic 1 is greater than or equal to '
            'next_subtopic_id 1')

    def test_language_code_validation(self) -> None:
        self.topic.language_code = 'xz'
        self._assert_validation_error('Invalid language code')

    def test_canonical_story_references_validation(self) -> None:
        self.topic.canonical_story_references = [
            topic_domain.StoryReference.create_default_story_reference(
                'story_id'),
            topic_domain.StoryReference.create_default_story_reference(
                'story_id_1'),
            topic_domain.StoryReference.create_default_story_reference(
                'story_id_1')
        ]
        self._assert_validation_error(
            'Expected all canonical story ids to be distinct.')

    def test_additional_story_references_validation(self) -> None:
        self.topic.additional_story_references = [
            topic_domain.StoryReference.create_default_story_reference(
                'story_id'),
            topic_domain.StoryReference.create_default_story_reference(
                'story_id_1'),
            topic_domain.StoryReference.create_default_story_reference(
                'story_id_1')
        ]
        self._assert_validation_error(
            'Expected all additional story ids to be distinct.')

    def test_additional_canonical_story_intersection_validation(self) -> None:
        self.topic.additional_story_references = [
            topic_domain.StoryReference.create_default_story_reference(
                'story_id'),
            topic_domain.StoryReference.create_default_story_reference(
                'story_id_1'),
        ]
        self.topic.canonical_story_references = [
            topic_domain.StoryReference.create_default_story_reference(
                'story_id'),
            topic_domain.StoryReference.create_default_story_reference(
                'story_id_2')
        ]
        self._assert_validation_error(
            'Expected additional story ids list and canonical story '
            'ids list to be mutually exclusive.')

    def test_add_uncategorized_skill_id(self) -> None:
        self.topic.subtopics.append(
            topic_domain.Subtopic(
                1, 'Title2', ['skill_id_2'], 'image.svg',
                constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0], 21131,
                'dummy-title-two'))
        with self.assertRaisesRegex(  # type: ignore[no-untyped-call]
            Exception,
            'The skill id skill_id_1 already exists in subtopic with id 1'):
            self.topic.add_uncategorized_skill_id('skill_id_1')
        self.topic.add_uncategorized_skill_id('skill_id_3')
        self.assertEqual(self.topic.uncategorized_skill_ids, ['skill_id_3'])

    def test_remove_uncategorized_skill_id(self) -> None:
        self.topic.uncategorized_skill_ids = ['skill_id_5']
        with self.assertRaisesRegex(  # type: ignore[no-untyped-call]
            Exception,
            'The skill id skill_id_3 is not present in the topic'):
            self.topic.remove_uncategorized_skill_id('skill_id_3')
        self.topic.remove_uncategorized_skill_id('skill_id_5')
        self.assertEqual(self.topic.uncategorized_skill_ids, [])

    def test_move_skill_id_to_subtopic(self) -> None:
        self.topic.uncategorized_skill_ids = ['skill_id_1']
        self.topic.subtopics[0].skill_ids = ['skill_id_2']
        self.topic.move_skill_id_to_subtopic(None, 1, 'skill_id_1')
        self.assertEqual(self.topic.uncategorized_skill_ids, [])
        self.assertEqual(
            self.topic.subtopics[0].skill_ids, ['skill_id_2', 'skill_id_1'])

        self.topic.uncategorized_skill_ids = ['skill_id_1']
        self.topic.subtopics[0].skill_ids = ['skill_id_2']
        with self.assertRaisesRegex(  # type: ignore[no-untyped-call]
            Exception,
            'Skill id skill_id_3 is not an uncategorized skill id'):
            self.topic.move_skill_id_to_subtopic(None, 1, 'skill_id_3')

    def test_get_subtopic_index(self) -> None:
        self.assertEqual(self.topic.get_subtopic_index(1), 0)

    def test_to_dict(self) -> None:
        user_ids = [self.user_id_a, self.user_id_b]
        topic_rights = topic_domain.TopicRights(self.topic_id, user_ids, False)
        expected_dict = {
            'topic_id': self.topic_id,
            'manager_names': ['A', 'B'],
            'topic_is_published': False
        }

        self.assertEqual(expected_dict, topic_rights.to_dict())

    def test_is_manager(self) -> None:
        user_ids = [self.user_id_a, self.user_id_b]
        assert user_ids[0] is not None
        assert user_ids[1] is not None
        topic_rights = topic_domain.TopicRights(self.topic_id, user_ids, False)
        self.assertTrue(topic_rights.is_manager(self.user_id_a))
        self.assertTrue(topic_rights.is_manager(self.user_id_b))
        self.assertFalse(topic_rights.is_manager('fakeuser'))

    def test_cannot_create_topic_rights_change_class_with_invalid_cmd(
        self
    ) -> None:
        with self.assertRaisesRegex(  # type: ignore[no-untyped-call]
            Exception, 'Command invalid cmd is not allowed'):
            topic_domain.TopicRightsChange({  # type: ignore[no-untyped-call]
                'cmd': 'invalid cmd'
            })

    def test_cannot_create_topic_rights_change_class_with_invalid_changelist(
        self
    ) -> None:
        with self.assertRaisesRegex(  # type: ignore[no-untyped-call]
            Exception, 'Missing cmd key in change dict'):
            topic_domain.TopicRightsChange({})  # type: ignore[no-untyped-call]

    def test_create_new_topic_rights_change_class(self) -> None:
        topic_rights = topic_domain.TopicRightsChange({  # type: ignore[no-untyped-call]
            'cmd': 'create_new'
        })

        self.assertEqual(topic_rights.to_dict(), {'cmd': 'create_new'})  # type: ignore[no-untyped-call]

    def test_update_language_code(self) -> None:
        self.assertEqual(self.topic.language_code, 'en')
        self.topic.update_language_code('bn')
        self.assertEqual(self.topic.language_code, 'bn')

    def test_update_abbreviated_name(self) -> None:
        self.assertEqual(self.topic.abbreviated_name, 'Name')
        self.topic.update_abbreviated_name('abbrev')
        self.assertEqual(self.topic.abbreviated_name, 'abbrev')

    def test_update_thumbnail_filename(self) -> None:
        self.assertEqual(self.topic.thumbnail_filename, None)
        # Test exception when thumbnail is not found on filesystem.
        with self.assertRaisesRegex(  # type: ignore[no-untyped-call]
            Exception,
            'The thumbnail img.svg for topic with id %s does not exist'
            ' in the filesystem.' % (self.topic_id)):
            self.topic.update_thumbnail_filename('img.svg')

        # Save the dummy image to the filesystem to be used as thumbnail.
        with python_utils.open_file(  # type: ignore[no-untyped-call]
            os.path.join(feconf.TESTS_DATA_DIR, 'test_svg.svg'),
            'rb', encoding=None) as f:
            raw_image = f.read()
        fs = fs_domain.AbstractFileSystem(  # type: ignore[no-untyped-call]
            fs_domain.GcsFileSystem(  # type: ignore[no-untyped-call]
                feconf.ENTITY_TYPE_TOPIC, self.topic.id))
        fs.commit(  # type: ignore[no-untyped-call]
            '%s/img.svg' % (constants.ASSET_TYPE_THUMBNAIL), raw_image,
            mimetype='image/svg+xml')

        # Test successful update of thumbnail present in the filesystem.
        self.topic.update_thumbnail_filename('img.svg')
        self.assertEqual(self.topic.thumbnail_filename, 'img.svg')
        self.assertEqual(self.topic.thumbnail_size_in_bytes, len(raw_image))

    def test_update_thumbnail_bg_color(self) -> None:
        self.assertEqual(self.topic.thumbnail_bg_color, None)
        self.topic.update_thumbnail_bg_color('#C6DCDA')
        self.assertEqual(self.topic.thumbnail_bg_color, '#C6DCDA')

    def test_cannot_add_uncategorized_skill_with_existing_uncategorized_skill(
        self
    ) -> None:
        self.assertEqual(self.topic.uncategorized_skill_ids, [])
        self.topic.uncategorized_skill_ids = ['skill_id1']
        with self.assertRaisesRegex(  # type: ignore[no-untyped-call]
            Exception,
            'The skill id skill_id1 is already an uncategorized skill.'):
            self.topic.add_uncategorized_skill_id('skill_id1')

    def test_update_subtopic_title(self) -> None:
        self.assertEqual(len(self.topic.subtopics), 1)
        self.assertEqual(self.topic.subtopics[0].title, 'Title')

        self.topic.update_subtopic_title(1, 'new title')
        self.assertEqual(self.topic.subtopics[0].title, 'new title')

    def test_update_subtopic_thumbnail_filename(self) -> None:
        self.assertEqual(len(self.topic.subtopics), 1)
        self.assertEqual(
            self.topic.subtopics[0].thumbnail_filename, 'image.svg')
        self.assertEqual(
            self.topic.subtopics[0].thumbnail_size_in_bytes, 21131)

        # Test Exception when the thumbnail is not found in filesystem.
        with self.assertRaisesRegex(  # type: ignore[no-untyped-call]
            Exception, 'The thumbnail %s for subtopic with topic_id %s does'
            ' not exist in the filesystem.' % (
                'new_image.svg', self.topic_id)):
            self.topic.update_subtopic_thumbnail_filename(1, 'new_image.svg')

        # Test successful update of thumbnail_filename when the thumbnail
        # is found in the filesystem.
        with python_utils.open_file(  # type: ignore[no-untyped-call]
            os.path.join(feconf.TESTS_DATA_DIR, 'test_svg.svg'), 'rb',
            encoding=None) as f:
            raw_image = f.read()
        fs = fs_domain.AbstractFileSystem(  # type: ignore[no-untyped-call]
            fs_domain.GcsFileSystem(  # type: ignore[no-untyped-call]
                feconf.ENTITY_TYPE_TOPIC, self.topic_id))
        fs.commit(  # type: ignore[no-untyped-call]
            'thumbnail/new_image.svg', raw_image, mimetype='image/svg+xml')
        self.topic.update_subtopic_thumbnail_filename(1, 'new_image.svg')
        self.assertEqual(
            self.topic.subtopics[0].thumbnail_filename, 'new_image.svg')
        self.assertEqual(
            self.topic.subtopics[0].thumbnail_size_in_bytes, len(raw_image))

    def test_update_subtopic_url_fragment(self) -> None:
        self.assertEqual(len(self.topic.subtopics), 1)
        self.assertEqual(
            self.topic.subtopics[0].url_fragment, 'dummy-subtopic-url')
        self.topic.update_subtopic_url_fragment(1, 'new-subtopic-url')
        self.assertEqual(
            self.topic.subtopics[0].url_fragment, 'new-subtopic-url')

    def test_update_subtopic_thumbnail_bg_color(self) -> None:
        self.assertEqual(len(self.topic.subtopics), 1)
        self.topic.subtopics[0].thumbnail_bg_color = None
        self.assertEqual(
            self.topic.subtopics[0].thumbnail_bg_color, None)
        self.topic.update_subtopic_thumbnail_bg_color(1, '#FFFFFF')
        self.assertEqual(
            self.topic.subtopics[0].thumbnail_bg_color, '#FFFFFF')

    def test_cannot_move_existing_skill_to_subtopic(self) -> None:
        self.topic.subtopics = [
            topic_domain.Subtopic(
                1, 'Title', ['skill_id_1'], 'image.svg',
                constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0], 21131,
                'dummy-subtopic-one'),
            topic_domain.Subtopic(
                2, 'Another title', ['skill_id_1'], 'image.svg',
                constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0], 21131,
                'dummy-subtopic-two')]
        with self.assertRaisesRegex(  # type: ignore[no-untyped-call]
            Exception,
            'Skill id skill_id_1 is already present in the target subtopic'):
            self.topic.move_skill_id_to_subtopic(1, 2, 'skill_id_1')

    def test_topic_export_import_returns_original_object(self) -> None:
        """Checks that to_dict and from_dict preserves all the data within a
        Topic during export and import.
        """
        topic_dict = self.topic.to_dict()
        topic_from_dict = topic_domain.Topic.from_dict(topic_dict)
        self.assertEqual(topic_from_dict.to_dict(), topic_dict)

    def test_serialize_and_deserialize_returns_unchanged_topic(self) -> None:
        """Checks that serializing and then deserializing a default topic
        works as intended by leaving the topic unchanged.
        """
        self.assertEqual(
            self.topic.to_dict(),
            topic_domain.Topic.deserialize(
                self.topic.serialize()).to_dict())


class TopicChangeTests(test_utils.GenericTestBase):

    def test_topic_change_object_with_missing_cmd(self) -> None:
        with self.assertRaisesRegex(  # type: ignore[no-untyped-call]
            utils.ValidationError, 'Missing cmd key in change dict'):
            topic_domain.TopicChange({'invalid': 'data'})  # type: ignore[no-untyped-call]

    def test_topic_change_object_with_invalid_cmd(self) -> None:
        with self.assertRaisesRegex(  # type: ignore[no-untyped-call]
            utils.ValidationError, 'Command invalid is not allowed'):
            topic_domain.TopicChange({'cmd': 'invalid'})  # type: ignore[no-untyped-call]

    def test_topic_change_object_with_missing_attribute_in_cmd(self) -> None:
        with self.assertRaisesRegex(  # type: ignore[no-untyped-call]
            utils.ValidationError, (
                'The following required attributes are missing: '
                'new_value, old_value')):
            topic_domain.TopicChange({  # type: ignore[no-untyped-call]
                'cmd': 'update_topic_property',
                'property_name': 'name',
            })

    def test_topic_change_object_with_extra_attribute_in_cmd(self) -> None:
        with self.assertRaisesRegex(  # type: ignore[no-untyped-call]
            utils.ValidationError, (
                'The following extra attributes are present: invalid')):
            topic_domain.TopicChange({  # type: ignore[no-untyped-call]
                'cmd': 'add_subtopic',
                'title': 'title',
                'subtopic_id': 'subtopic_id',
                'invalid': 'invalid'
            })

    def test_topic_change_object_with_invalid_topic_property(self) -> None:
        with self.assertRaisesRegex(  # type: ignore[no-untyped-call]
            utils.ValidationError, (
                'Value for property_name in cmd update_topic_property: '
                'invalid is not allowed')):
            topic_domain.TopicChange({  # type: ignore[no-untyped-call]
                'cmd': 'update_topic_property',
                'property_name': 'invalid',
                'old_value': 'old_value',
                'new_value': 'new_value',
            })

    def test_topic_change_object_with_invalid_subtopic_property(self) -> None:
        with self.assertRaisesRegex(  # type: ignore[no-untyped-call]
            utils.ValidationError, (
                'Value for property_name in cmd update_subtopic_property: '
                'invalid is not allowed')):
            topic_domain.TopicChange({  # type: ignore[no-untyped-call]
                'cmd': 'update_subtopic_property',
                'subtopic_id': 'subtopic_id',
                'property_name': 'invalid',
                'old_value': 'old_value',
                'new_value': 'new_value',
            })

    def test_topic_change_object_with_invalid_subtopic_page_property(
        self
    ) -> None:
        with self.assertRaisesRegex(  # type: ignore[no-untyped-call]
            utils.ValidationError, (
                'Value for property_name in cmd update_subtopic_page_property: '
                'invalid is not allowed')):
            topic_domain.TopicChange({  # type: ignore[no-untyped-call]
                'cmd': 'update_subtopic_page_property',
                'subtopic_id': 'subtopic_id',
                'property_name': 'invalid',
                'old_value': 'old_value',
                'new_value': 'new_value',
            })

    def test_topic_change_object_with_add_subtopic(self) -> None:
        topic_change_object = topic_domain.TopicChange({  # type: ignore[no-untyped-call]
            'cmd': 'add_subtopic',
            'subtopic_id': 'subtopic_id',
            'title': 'title'
        })

        self.assertEqual(topic_change_object.cmd, 'add_subtopic')
        self.assertEqual(topic_change_object.subtopic_id, 'subtopic_id')
        self.assertEqual(topic_change_object.title, 'title')

    def test_topic_change_object_with_delete_subtopic(self) -> None:
        topic_change_object = topic_domain.TopicChange({  # type: ignore[no-untyped-call]
            'cmd': 'delete_subtopic',
            'subtopic_id': 'subtopic_id'
        })

        self.assertEqual(topic_change_object.cmd, 'delete_subtopic')
        self.assertEqual(topic_change_object.subtopic_id, 'subtopic_id')

    def test_topic_change_object_with_add_uncategorized_skill_id(self) -> None:
        topic_change_object = topic_domain.TopicChange({  # type: ignore[no-untyped-call]
            'cmd': 'add_uncategorized_skill_id',
            'new_uncategorized_skill_id': 'new_uncategorized_skill_id'
        })

        self.assertEqual(topic_change_object.cmd, 'add_uncategorized_skill_id')
        self.assertEqual(
            topic_change_object.new_uncategorized_skill_id,
            'new_uncategorized_skill_id')

    def test_topic_change_object_with_remove_uncategorized_skill_id(
        self
    ) -> None:
        topic_change_object = topic_domain.TopicChange({  # type: ignore[no-untyped-call]
            'cmd': 'remove_uncategorized_skill_id',
            'uncategorized_skill_id': 'uncategorized_skill_id'
        })

        self.assertEqual(
            topic_change_object.cmd, 'remove_uncategorized_skill_id')
        self.assertEqual(
            topic_change_object.uncategorized_skill_id,
            'uncategorized_skill_id')

    def test_topic_change_object_with_move_skill_id_to_subtopic(self) -> None:
        topic_change_object = topic_domain.TopicChange({  # type: ignore[no-untyped-call]
            'cmd': 'move_skill_id_to_subtopic',
            'skill_id': 'skill_id',
            'old_subtopic_id': 'old_subtopic_id',
            'new_subtopic_id': 'new_subtopic_id'
        })

        self.assertEqual(topic_change_object.cmd, 'move_skill_id_to_subtopic')
        self.assertEqual(topic_change_object.skill_id, 'skill_id')
        self.assertEqual(topic_change_object.old_subtopic_id, 'old_subtopic_id')
        self.assertEqual(topic_change_object.new_subtopic_id, 'new_subtopic_id')

    def test_topic_change_object_with_remove_skill_id_from_subtopic(
        self
    ) -> None:
        topic_change_object = topic_domain.TopicChange({  # type: ignore[no-untyped-call]
            'cmd': 'remove_skill_id_from_subtopic',
            'skill_id': 'skill_id',
            'subtopic_id': 'subtopic_id'
        })

        self.assertEqual(
            topic_change_object.cmd, 'remove_skill_id_from_subtopic')
        self.assertEqual(topic_change_object.skill_id, 'skill_id')
        self.assertEqual(topic_change_object.subtopic_id, 'subtopic_id')

    def test_topic_change_object_with_update_subtopic_property(self) -> None:
        topic_change_object = topic_domain.TopicChange({  # type: ignore[no-untyped-call]
            'cmd': 'update_subtopic_property',
            'subtopic_id': 'subtopic_id',
            'property_name': 'title',
            'new_value': 'new_value',
            'old_value': 'old_value'
        })

        self.assertEqual(topic_change_object.cmd, 'update_subtopic_property')
        self.assertEqual(topic_change_object.subtopic_id, 'subtopic_id')
        self.assertEqual(topic_change_object.property_name, 'title')
        self.assertEqual(topic_change_object.new_value, 'new_value')
        self.assertEqual(topic_change_object.old_value, 'old_value')

    def test_topic_change_object_with_update_subtopic_page_property(
        self
    ) -> None:
        topic_change_object = topic_domain.TopicChange({  # type: ignore[no-untyped-call]
            'cmd': 'update_subtopic_page_property',
            'subtopic_id': 'subtopic_id',
            'property_name': 'page_contents_html',
            'new_value': 'new_value',
            'old_value': 'old_value'
        })

        self.assertEqual(
            topic_change_object.cmd, 'update_subtopic_page_property')
        self.assertEqual(topic_change_object.subtopic_id, 'subtopic_id')
        self.assertEqual(
            topic_change_object.property_name, 'page_contents_html')
        self.assertEqual(topic_change_object.new_value, 'new_value')
        self.assertEqual(topic_change_object.old_value, 'old_value')

    def test_topic_change_object_with_update_topic_property(self) -> None:
        topic_change_object = topic_domain.TopicChange({  # type: ignore[no-untyped-call]
            'cmd': 'update_topic_property',
            'property_name': 'name',
            'new_value': 'new_value',
            'old_value': 'old_value'
        })

        self.assertEqual(topic_change_object.cmd, 'update_topic_property')
        self.assertEqual(topic_change_object.property_name, 'name')
        self.assertEqual(topic_change_object.new_value, 'new_value')
        self.assertEqual(topic_change_object.old_value, 'old_value')

    def test_topic_change_object_with_create_new(self) -> None:
        topic_change_object = topic_domain.TopicChange({  # type: ignore[no-untyped-call]
            'cmd': 'create_new',
            'name': 'name',
        })

        self.assertEqual(topic_change_object.cmd, 'create_new')
        self.assertEqual(topic_change_object.name, 'name')

    def test_topic_change_object_with_migrate_subtopic_schema_to_latest_version(
        self
    ) -> None:
        topic_change_object = topic_domain.TopicChange({  # type: ignore[no-untyped-call]
            'cmd': 'migrate_subtopic_schema_to_latest_version',
            'from_version': 'from_version',
            'to_version': 'to_version',
        })

        self.assertEqual(
            topic_change_object.cmd,
            'migrate_subtopic_schema_to_latest_version')
        self.assertEqual(topic_change_object.from_version, 'from_version')
        self.assertEqual(topic_change_object.to_version, 'to_version')

    def test_to_dict(self) -> None:
        topic_change_dict = {
            'cmd': 'create_new',
            'name': 'name'
        }
        topic_change_object = topic_domain.TopicChange(topic_change_dict)  # type: ignore[no-untyped-call]
        self.assertEqual(topic_change_object.to_dict(), topic_change_dict)  # type: ignore[no-untyped-call]


class TopicRightsChangeTests(test_utils.GenericTestBase):

    def test_topic_rights_change_object_with_missing_cmd(self) -> None:
        with self.assertRaisesRegex(  # type: ignore[no-untyped-call]
            utils.ValidationError, 'Missing cmd key in change dict'):
            topic_domain.TopicRightsChange({'invalid': 'data'})  # type: ignore[no-untyped-call]

    def test_topic_change_rights_object_with_invalid_cmd(self) -> None:
        with self.assertRaisesRegex(  # type: ignore[no-untyped-call]
            utils.ValidationError, 'Command invalid is not allowed'):
            topic_domain.TopicRightsChange({'cmd': 'invalid'})  # type: ignore[no-untyped-call]

    def test_topic_rights_change_object_with_missing_attribute_in_cmd(
        self
    ) -> None:
        with self.assertRaisesRegex(  # type: ignore[no-untyped-call]
            utils.ValidationError, (
                'The following required attributes are missing: '
                'new_role, old_role')):
            topic_domain.TopicRightsChange({  # type: ignore[no-untyped-call]
                'cmd': 'change_role',
                'assignee_id': 'assignee_id',
            })

    def test_topic_rights_change_object_with_extra_attribute_in_cmd(
        self
    ) -> None:
        with self.assertRaisesRegex(  # type: ignore[no-untyped-call]
            utils.ValidationError, (
                'The following extra attributes are present: invalid')):
            topic_domain.TopicRightsChange({  # type: ignore[no-untyped-call]
                'cmd': 'publish_topic',
                'invalid': 'invalid'
            })

    def test_topic_rights_change_object_with_invalid_role(self) -> None:
        with self.assertRaisesRegex(  # type: ignore[no-untyped-call]
            utils.ValidationError, (
                'Value for old_role in cmd change_role: '
                'invalid is not allowed')):
            topic_domain.TopicRightsChange({  # type: ignore[no-untyped-call]
                'cmd': 'change_role',
                'assignee_id': 'assignee_id',
                'old_role': 'invalid',
                'new_role': topic_domain.ROLE_MANAGER
            })

    def test_topic_rights_change_object_with_create_new(self) -> None:
        topic_rights_change_object = topic_domain.TopicRightsChange({  # type: ignore[no-untyped-call]
            'cmd': 'create_new'
        })

        self.assertEqual(topic_rights_change_object.cmd, 'create_new')

    def test_topic_rights_change_object_with_change_role(self) -> None:
        topic_rights_change_object = topic_domain.TopicRightsChange({  # type: ignore[no-untyped-call]
            'cmd': 'change_role',
            'assignee_id': 'assignee_id',
            'old_role': topic_domain.ROLE_NONE,
            'new_role': topic_domain.ROLE_MANAGER
        })

        self.assertEqual(topic_rights_change_object.cmd, 'change_role')
        self.assertEqual(topic_rights_change_object.assignee_id, 'assignee_id')
        self.assertEqual(
            topic_rights_change_object.old_role, topic_domain.ROLE_NONE)
        self.assertEqual(
            topic_rights_change_object.new_role, topic_domain.ROLE_MANAGER)

    def test_topic_rights_change_object_with_publish_topic(self) -> None:
        topic_rights_change_object = topic_domain.TopicRightsChange({  # type: ignore[no-untyped-call]
            'cmd': 'publish_topic'
        })

        self.assertEqual(topic_rights_change_object.cmd, 'publish_topic')

    def test_topic_rights_change_object_with_unpublish_topic(self) -> None:
        topic_rights_change_object = topic_domain.TopicRightsChange({  # type: ignore[no-untyped-call]
            'cmd': 'unpublish_topic'
        })

        self.assertEqual(topic_rights_change_object.cmd, 'unpublish_topic')

    def test_to_dict(self) -> None:
        topic_rights_change_dict = {
            'cmd': 'change_role',
            'assignee_id': 'assignee_id',
            'old_role': topic_domain.ROLE_NONE,
            'new_role': topic_domain.ROLE_MANAGER
        }
        topic_rights_change_object = topic_domain.TopicRightsChange(  # type: ignore[no-untyped-call]
            topic_rights_change_dict)
        self.assertEqual(
            topic_rights_change_object.to_dict(), topic_rights_change_dict)  # type: ignore[no-untyped-call]


class TopicSummaryTests(test_utils.GenericTestBase):

    def setUp(self) -> None:
        super(TopicSummaryTests, self).setUp()
        current_time = datetime.datetime.utcnow()
        time_in_millisecs = utils.get_time_in_millisecs(current_time)
        self.topic_summary_dict = {
            'url_fragment': 'url-frag',
            'id': 'topic_id',
            'name': 'name',
            'description': 'topic description',
            'language_code': 'en',
            'version': 1,
            'canonical_story_count': 1,
            'additional_story_count': 1,
            'uncategorized_skill_count': 1,
            'subtopic_count': 1,
            'total_skill_count': 1,
            'total_published_node_count': 1,
            'thumbnail_filename': 'image.svg',
            'thumbnail_bg_color': '#C6DCDA',
            'topic_model_created_on': time_in_millisecs,
            'topic_model_last_updated': time_in_millisecs,
        }

        self.topic_summary = topic_domain.TopicSummary(
            'topic_id', 'name', 'name', 'en', 'topic description',
            1, 1, 1, 1, 1, 1, 1, 'image.svg', '#C6DCDA', 'url-frag',
            current_time, current_time)

    def _assert_validation_error(  # type: ignore[override]
        self,
        expected_error_substring: str
    ) -> None:
        """Checks that the topic summary passes validation.

        Args:
            expected_error_substring: str. String that should be a substring
                of the expected error message.
        """
        with self.assertRaisesRegex(  # type: ignore[no-untyped-call]
            utils.ValidationError, expected_error_substring):
            self.topic_summary.validate()

    def test_topic_summary_gets_created(self) -> None:
        self.assertEqual(
            self.topic_summary.to_dict(), self.topic_summary_dict)

    def test_validation_passes_with_valid_properties(self) -> None:
        self.topic_summary.validate()

    def test_thumbnail_bg_validation(self) -> None:
        self.topic_summary.thumbnail_bg_color = '#FFFFFF'
        self._assert_validation_error(
            'Topic thumbnail background color #FFFFFF is not supported.')

    def test_thumbnail_filename_or_thumbnail_bg_color_is_none(self) -> None:
        self.topic_summary.thumbnail_bg_color = '#C6DCDA'
        self.topic_summary.thumbnail_filename = None  # type: ignore[assignment]
        self._assert_validation_error(
            'Topic thumbnail image is not provided.')
        self.topic_summary.thumbnail_bg_color = None  # type: ignore[assignment]
        self.topic_summary.thumbnail_filename = 'test.svg'
        self._assert_validation_error(
            'Topic thumbnail background color is not specified.')

    def test_validation_fails_with_empty_name(self) -> None:
        self.topic_summary.name = ''
        self._assert_validation_error('Name field should not be empty')

    def test_validation_fails_with_empty_url_fragment(self) -> None:
        self.topic_summary.url_fragment = ''
        validation_message = 'Topic URL Fragment field should not be empty.'
        with self.assertRaisesRegex(  # type: ignore[no-untyped-call]
            utils.ValidationError, validation_message):
            self.topic_summary.validate()

    def test_validation_fails_with_lenghty_url_fragment(self) -> None:
        self.topic_summary.url_fragment = 'a' * 25
        url_fragment_char_limit = constants.MAX_CHARS_IN_TOPIC_URL_FRAGMENT
        validation_message = (
            'Topic URL Fragment field should not exceed %d characters, '
            'received %s.' % (
                url_fragment_char_limit, self.topic_summary.url_fragment))
        with self.assertRaisesRegex(  # type: ignore[no-untyped-call]
            utils.ValidationError, validation_message):
            self.topic_summary.validate()

    def test_validation_fails_with_empty_canonical_name(self) -> None:
        self.topic_summary.canonical_name = ''
        self._assert_validation_error(
            'Canonical name field should not be empty')

    def test_validation_fails_with_unallowed_language_code(self) -> None:
        self.topic_summary.language_code = 'invalid'
        self._assert_validation_error('Invalid language code: invalid')

    def test_validation_fails_with_negative_canonical_story_count(self) -> None:
        self.topic_summary.canonical_story_count = -1
        self._assert_validation_error(
            'Expected canonical_story_count to be non-negative, '
            'received \'-1\'')

    def test_validation_fails_with_negative_additional_story_count(
        self
    ) -> None:
        self.topic_summary.additional_story_count = -1
        self._assert_validation_error(
            'Expected additional_story_count to be non-negative, '
            'received \'-1\'')

    def test_validation_fails_with_negative_uncategorized_skill_count(
        self
    ) -> None:
        self.topic_summary.uncategorized_skill_count = -1
        self._assert_validation_error(
            'Expected uncategorized_skill_count to be non-negative, '
            'received \'-1\'')

    def test_validation_fails_with_negative_total_skill_count(self) -> None:
        self.topic_summary.total_skill_count = -1
        self._assert_validation_error(
            'Expected total_skill_count to be non-negative, received \'-1\'')

    def test_validation_fails_with_invalid_total_skill_count_value(
        self
    ) -> None:
        self.topic_summary.total_skill_count = 5
        self.topic_summary.uncategorized_skill_count = 10
        self._assert_validation_error(
            'Expected total_skill_count to be greater than or equal to '
            'uncategorized_skill_count 10, received \'5\'')

    def test_validation_fails_with_negative_total_published_node_count(
        self
    ) -> None:
        self.topic_summary.total_published_node_count = -1
        self._assert_validation_error(
            'Expected total_published_node_count to be non-negative, '
            'received \'-1\'')

    def test_validation_fails_with_negative_subtopic_count(self) -> None:
        self.topic_summary.subtopic_count = -1
        self._assert_validation_error(
            'Expected subtopic_count to be non-negative, received \'-1\'')


class TopicRightsTests(test_utils.GenericTestBase):

    def setUp(self) -> None:
        super(TopicRightsTests, self).setUp()
        self.signup('a@example.com', 'A')
        self.signup('b@example.com', 'B')
        self.user_id_a = self.get_user_id_from_email('a@example.com')  # type: ignore[no-untyped-call]
        self.user_id_b = self.get_user_id_from_email('b@example.com')  # type: ignore[no-untyped-call]
        self.topic_summary_dict = {
            'topic_id': 'topic_id',
            'manager_names': ['A'],
            'topic_is_published': False,
        }

        self.topic_summary = topic_domain.TopicRights(
            'topic_id', [self.user_id_a], False)

    def test_topic_summary_gets_created(self) -> None:
        self.assertEqual(
            self.topic_summary.to_dict(), self.topic_summary_dict)

    def test_is_manager(self) -> None:
        self.assertTrue(self.topic_summary.is_manager(self.user_id_a))
        self.assertFalse(self.topic_summary.is_manager(self.user_id_b))
