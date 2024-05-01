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

from core import android_validation_constants
from core import feconf
from core import utils
from core.constants import constants
from core.domain import topic_domain
from core.domain import user_services
from core.tests import test_utils


class TopicDomainUnitTests(test_utils.GenericTestBase):
    """Tests for topic domain objects."""

    topic_id = 'topic_id'

    def setUp(self) -> None:
        super().setUp()
        self.signup('a@example.com', 'A')
        self.signup('b@example.com', 'B')
        self.topic = topic_domain.Topic.create_default_topic(
            self.topic_id, 'Name', 'abbrev', 'description', 'fragm')
        self.topic.subtopics = [
            topic_domain.Subtopic(
                1, 'Title', ['skill_id_1'], 'image.svg',
                constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0], 21131,
                'dummy-subtopic-url')]
        self.topic.next_subtopic_id = 2
        self.topic.skill_ids_for_diagnostic_test = ['skill_id_1']

        self.user_id_a = self.get_user_id_from_email('a@example.com')
        self.user_id_b = self.get_user_id_from_email('b@example.com')

        self.user_a = user_services.get_user_actions_info(self.user_id_a)
        self.user_b = user_services.get_user_actions_info(self.user_id_b)

    def test_create_default_topic(self) -> None:
        """Tests the create_default_topic() function."""
        topic = topic_domain.Topic.create_default_topic(
            self.topic_id, 'Name', 'abbrev', 'description', 'fragm')
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
            'page_title_fragment_for_web': 'fragm',
            'skill_ids_for_diagnostic_test': []
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
        with self.assertRaisesRegex(
            Exception, 'The subtopic with id -2 does not exist.'
        ):
            self.topic.get_subtopic_index(-2)

    def test_validation_story_id_with_invalid_data(self) -> None:
        story_reference = (
            topic_domain.StoryReference.create_default_story_reference(
                '#6*5&A0%'))
        with self.assertRaisesRegex(
            utils.ValidationError, 'Invalid story ID:'
        ):
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
        with self.assertRaisesRegex(
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
        with self.assertRaisesRegex(
            Exception, 'Expected from_index value to be with-in bounds.'):
            self.topic.rearrange_canonical_story(10, 0)

        with self.assertRaisesRegex(
            Exception, 'Expected from_index value to be with-in bounds.'):
            self.topic.rearrange_canonical_story(-1, 0)

        with self.assertRaisesRegex(
            Exception, 'Expected to_index value to be with-in bounds.'):
            self.topic.rearrange_canonical_story(0, 10)

        with self.assertRaisesRegex(
            Exception, 'Expected to_index value to be with-in bounds.'):
            self.topic.rearrange_canonical_story(0, -1)

    def test_rearrange_canonical_story_fail_with_identical_index_values(
        self
    ) -> None:
        with self.assertRaisesRegex(
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
        with self.assertRaisesRegex(
            Exception, 'Expected from_index value to be with-in bounds.'):
            self.topic.rearrange_skill_in_subtopic(1, 10, 1)

        with self.assertRaisesRegex(
            Exception, 'Expected from_index value to be with-in bounds.'):
            self.topic.rearrange_skill_in_subtopic(1, -1, 0)

        with self.assertRaisesRegex(
            Exception, 'Expected to_index value to be with-in bounds.'):
            self.topic.rearrange_skill_in_subtopic(1, 0, 10)

        with self.assertRaisesRegex(
            Exception, 'Expected to_index value to be with-in bounds.'):
            self.topic.rearrange_skill_in_subtopic(1, 0, -10)

    def test_rearrange_skill_in_subtopic_fail_with_identical_index_values(
        self
    ) -> None:
        with self.assertRaisesRegex(
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
        with self.assertRaisesRegex(
            Exception, 'Expected from_index value to be with-in bounds.'):
            self.topic.rearrange_subtopic(10, 1)

        with self.assertRaisesRegex(
            Exception, 'Expected from_index value to be with-in bounds.'):
            self.topic.rearrange_subtopic(-1, 0)

        with self.assertRaisesRegex(
            Exception, 'Expected to_index value to be with-in bounds.'):
            self.topic.rearrange_subtopic(0, 10)

        with self.assertRaisesRegex(
            Exception, 'Expected to_index value to be with-in bounds.'):
            self.topic.rearrange_subtopic(0, -10)

    def test_rearrange_subtopic_fail_with_identical_index_values(self) -> None:
        with self.assertRaisesRegex(
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
        with self.assertRaisesRegex(
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
        with self.assertRaisesRegex(
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
        with self.assertRaisesRegex(
            Exception, 'The story_id story_id_2 is already present in the '
            'additional story references list of the topic.'):
            self.topic.add_additional_story('story_id_2')

    # Here we use MyPy ignore because we override the definition of the function
    # from the parent class, but that is fine as _assert_validation_error is
    # supposed to be customizable and thus we add an ignore.
    def _assert_validation_error(  # type: ignore[override]
        self,
        expected_error_substring: str
    ) -> None:
        """Checks that the topic passes strict validation."""
        with self.assertRaisesRegex(
            utils.ValidationError, expected_error_substring):
            self.topic.validate()

    def _assert_strict_validation_error(
        self,
        expected_error_substring: str
    ) -> None:
        """Checks that the topic passes prepublish validation."""
        with self.assertRaisesRegex(
            utils.ValidationError, expected_error_substring):
            self.topic.validate(strict=True)

    def _assert_valid_topic_id(
        self,
        expected_error_substring: str,
        topic_id: str
    ) -> None:
        """Checks that the skill passes strict validation."""
        with self.assertRaisesRegex(
            utils.ValidationError, expected_error_substring):
            topic_domain.Topic.require_valid_topic_id(topic_id)

    def _assert_valid_name_for_topic(
        self,
        expected_error_substring: str,
        name: str
    ) -> None:
        """Checks that the topic passes strict validation."""
        with self.assertRaisesRegex(
            utils.ValidationError, expected_error_substring):
            topic_domain.Topic.require_valid_name(name)

    def _assert_valid_thumbnail_filename_for_topic(
        self,
        expected_error_substring: str,
        thumbnail_filename: str
    ) -> None:
        """Checks that topic passes validation for thumbnail filename."""
        with self.assertRaisesRegex(
            utils.ValidationError, expected_error_substring):
            topic_domain.Topic.require_valid_thumbnail_filename(
                thumbnail_filename)

    def _assert_valid_thumbnail_filename_for_subtopic(
        self,
        expected_error_substring: str,
        thumbnail_filename: str
    ) -> None:
        """Checks that subtopic passes validation for thumbnail filename."""
        with self.assertRaisesRegex(
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
        self.topic.skill_ids_for_diagnostic_test = []
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

    def test_subtopic_url_fragment_validation(self) -> None:
        self.topic.subtopics[0].url_fragment = 'a' * 26
        self._assert_validation_error(
            'Expected subtopic url fragment to be less '
            'than or equal to %d characters' %
            android_validation_constants.MAX_CHARS_IN_SUBTOPIC_URL_FRAGMENT)

        self.topic.subtopics[0].url_fragment = ''
        self._assert_validation_error(
            'Expected subtopic url fragment to be non '
            'empty')

        self.topic.subtopics[0].url_fragment = 'invalidFragment'
        self._assert_validation_error(
            'Invalid url fragment: %s' % self.topic.subtopics[0].url_fragment)

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
        with self.assertRaisesRegex(
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

    def test_validation_fails_with_story_is_published_set_to_non_bool_value(
        self
    ) -> None:
        self.topic.canonical_story_references = [
            topic_domain.StoryReference.create_default_story_reference(
                'story_id')
        ]
        # TODO(#13059): Here we use MyPy ignore because after we fully type the
        # codebase we plan to get rid of the tests that intentionally test wrong
        # inputs that we can normally catch by typing.
        # Here, a bool value is expected but for test purpose we're assigning it
        # a string type. Thus to avoid MyPy error, we added an ignore here.
        self.topic.canonical_story_references[0].story_is_published = 'no' # type: ignore[assignment]
        self._assert_validation_error(
            'story_is_published value should be boolean type')

    def test_validation_fails_with_empty_url_fragment(self) -> None:
        self.topic.url_fragment = ''
        validation_message = 'Topic URL Fragment field should not be empty.'
        with self.assertRaisesRegex(
            utils.ValidationError, validation_message):
            self.topic.validate()

    def test_validation_fails_with_lengthy_url_fragment(self) -> None:
        self.topic.url_fragment = 'a' * 25
        url_fragment_char_limit = constants.MAX_CHARS_IN_TOPIC_URL_FRAGMENT
        validation_message = (
            'Topic URL Fragment field should not exceed %d characters, '
            'received %s.' % (
                url_fragment_char_limit, self.topic.url_fragment))
        with self.assertRaisesRegex(
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
        with self.assertRaisesRegex(
            Exception,
            'The skill id skill_id_1 already exists in subtopic with id 1'):
            self.topic.add_uncategorized_skill_id('skill_id_1')
        self.topic.add_uncategorized_skill_id('skill_id_3')
        self.assertEqual(self.topic.uncategorized_skill_ids, ['skill_id_3'])

    def test_remove_uncategorized_skill_id(self) -> None:
        self.topic.uncategorized_skill_ids = ['skill_id_5']
        with self.assertRaisesRegex(
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
        with self.assertRaisesRegex(
            Exception,
            'Skill id skill_id_3 is not an uncategorized skill id'):
            self.topic.move_skill_id_to_subtopic(None, 1, 'skill_id_3')

    def test_get_subtopic_index(self) -> None:
        self.assertEqual(self.topic.get_subtopic_index(1), 0)

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
        with self.assertRaisesRegex(
            Exception, 'Command invalid cmd is not allowed'):
            topic_domain.TopicRightsChange({
                'cmd': 'invalid cmd'
            })

    def test_cannot_create_topic_rights_change_class_with_invalid_changelist(
        self
    ) -> None:
        with self.assertRaisesRegex(
            Exception, 'Missing cmd key in change dict'):
            topic_domain.TopicRightsChange({})

    def test_create_new_topic_rights_change_class(self) -> None:
        topic_rights = topic_domain.TopicRightsChange({
            'cmd': 'create_new'
        })

        self.assertEqual(topic_rights.to_dict(), {'cmd': 'create_new'})

    def test_update_language_code(self) -> None:
        self.assertEqual(self.topic.language_code, 'en')
        self.topic.update_language_code('bn')
        self.assertEqual(self.topic.language_code, 'bn')

    def test_update_abbreviated_name(self) -> None:
        self.assertEqual(self.topic.abbreviated_name, 'Name')
        self.topic.update_abbreviated_name('abbrev')
        self.assertEqual(self.topic.abbreviated_name, 'abbrev')

    def test_update_thumbnail_bg_color(self) -> None:
        self.assertEqual(self.topic.thumbnail_bg_color, None)
        self.topic.update_thumbnail_bg_color('#C6DCDA')
        self.assertEqual(self.topic.thumbnail_bg_color, '#C6DCDA')

    def test_cannot_add_uncategorized_skill_with_existing_uncategorized_skill(
        self
    ) -> None:
        self.assertEqual(self.topic.uncategorized_skill_ids, [])
        self.topic.uncategorized_skill_ids = ['skill_id1']
        with self.assertRaisesRegex(
            Exception,
            'The skill id skill_id1 is already an uncategorized skill.'):
            self.topic.add_uncategorized_skill_id('skill_id1')

    def test_update_subtopic_title(self) -> None:
        self.assertEqual(len(self.topic.subtopics), 1)
        self.assertEqual(self.topic.subtopics[0].title, 'Title')

        self.topic.update_subtopic_title(1, 'new title')
        self.assertEqual(self.topic.subtopics[0].title, 'new title')

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
        with self.assertRaisesRegex(
            Exception,
            'Skill id skill_id_1 is already present in the target subtopic'):
            self.topic.move_skill_id_to_subtopic(1, 2, 'skill_id_1')

    def test_skill_id_not_present_old_subtopic(self) -> None:
        self.topic.subtopics = [
            topic_domain.Subtopic(
                1, 'Title', ['skill_id_1'], 'image.svg',
                constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0], 21131,
                'dummy-subtopic-one'),
            topic_domain.Subtopic(
                2, 'Another title', ['skill_id_1'], 'image.svg',
                constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0], 21131,
                'dummy-subtopic-two')]
        with self.assertRaisesRegex(
            Exception,
            'Skill id skill_not_exist is not present in the given old subtopic'
        ):
            self.topic.move_skill_id_to_subtopic(1, 2, 'skill_not_exist')

    def test_validate_topic_bad_story_reference(self) -> None:
        self.topic.canonical_story_references = [
            topic_domain.StoryReference.create_default_story_reference(
                'story_id'),
            topic_domain.StoryReference.create_default_story_reference(
                'story_id_1')
        ]
        self.topic.additional_story_references = [
            topic_domain.StoryReference.create_default_story_reference(
                'story_id_2#'),
            topic_domain.StoryReference.create_default_story_reference(
                'story_id_3')
        ]
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Invalid story ID: story_id_2#'
        ):
            self.topic.validate()

    def test_story_ref_to_dict(self) -> None:
        test_story_dict = {
            'story_id': 'story_id_1',
            'story_is_published': False
        }
        story_ref_obj = (
            topic_domain.StoryReference.
            create_default_story_reference('story_id_1')
        )
        story_ref_dict = story_ref_obj.to_dict()
        self.assertDictEqual(test_story_dict, story_ref_dict)

    def test_story_ref_from_dict(self) -> None:
        test_story_dict = topic_domain.StoryReference(
            'story_id_1', False
        ).to_dict()
        test_story_obj = topic_domain.StoryReference.from_dict(test_story_dict)
        self.assertEqual(test_story_obj.story_id, 'story_id_1')
        self.assertEqual(test_story_obj.story_is_published, False)

    def test_create_default_subtopic(self) -> None:
        subtopic_id = 1
        subtopic_title = 'subtopic_title'
        url_frag = 'url_frag'
        subtopic_obj = topic_domain.Subtopic.create_default_subtopic(
            subtopic_id,
            subtopic_title,
            url_frag
        )
        self.assertEqual(subtopic_id, subtopic_obj.id)
        self.assertEqual(subtopic_title, subtopic_obj.title)
        self.assertEqual(url_frag, subtopic_obj.url_fragment)

    def test_remove_skill_id_not_present_exception(self) -> None:
        skill_id = 'skill_id_123'
        topic = self.topic
        with self.assertRaisesRegex(
            Exception,
            'Skill id %s is not present in the old subtopic' % skill_id
        ):
            topic.remove_skill_id_from_subtopic(1, skill_id)

    def test_update_subtopic_thumbnail(self) -> None:
        """Tests that when we update the subtopic thumbail size
        and filename that those attributes of the object come
        back with the updated values.
        """
        self.topic.subtopics = [
            topic_domain.Subtopic(
                1, 'Title', ['skill_id_1'], 'image.svg',
                constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0], 21131,
                'dummy-subtopic-one'
            ),
            topic_domain.Subtopic(
                2, 'Another title', ['skill_id_2'], 'image.svg',
                constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0], 21131,
                'dummy-subtopic-two'
            )
        ]
        new_filename = 'new_filename.svg'
        new_filesize = 12345
        subtopic_index = self.topic.get_subtopic_index(1)
        self.assertNotEqual(
            new_filename,
            self.topic.subtopics[subtopic_index].thumbnail_filename
        )
        self.assertNotEqual(
            new_filesize,
            self.topic.subtopics[subtopic_index].thumbnail_size_in_bytes
        )
        self.topic.update_subtopic_thumbnail_filename_and_size(
            1, new_filename, new_filesize
        )
        self.assertEqual(
            new_filename,
            self.topic.subtopics[subtopic_index].thumbnail_filename
        )
        self.assertEqual(
            new_filesize,
            self.topic.subtopics[subtopic_index].thumbnail_size_in_bytes
        )

    def test_delete_subtopic(self) -> None:
        """Tests that when we delete a subtopic, its skill_id gets moved to
        uncategorized, that subtopic doesn't exist on the topic and that
        there are the correct number of subtopics on the topic.
        """
        subtopic_id_to_delete = 1
        skill_id_moved = 'skill_id_1'
        self.topic.subtopics = [
            topic_domain.Subtopic(
                1, 'Title', ['skill_id_1'], 'image.svg',
                constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0], 21131,
                'dummy-subtopic-one'),
            topic_domain.Subtopic(
                2, 'Another title', ['skill_id_2'], 'image.svg',
                constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0], 21131,
                'dummy-subtopic-two')]
        self.assertNotEqual(1, len(self.topic.subtopics))
        self.assertNotEqual(
            [skill_id_moved],
            self.topic.uncategorized_skill_ids
        )
        self.topic.delete_subtopic(subtopic_id_to_delete)
        self.assertEqual(1, len(self.topic.subtopics))
        self.assertEqual([skill_id_moved], self.topic.uncategorized_skill_ids)
        with self.assertRaisesRegex(
            Exception,
            'The subtopic with id %s does not exist.' % subtopic_id_to_delete
        ):
            self.topic.get_subtopic_index(1)

    def test_move_skill_id_from_subtopic_to_subtopic(self) -> None:
        """Checks that move_skill_id_to_subtopic works when moving a skill_id
        from an existing subtopic to a new subtopic returns the expected
        updated values for skill_ids associated with each subtopic.
        """
        expected_subtopic1_skills: list[str] = []
        expected_subtopic2_skills = ['skill_id_2', 'skill_id_1']
        self.topic.subtopics = [
            topic_domain.Subtopic(
                1, 'Title', ['skill_id_1'], 'image.svg',
                constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0], 21131,
                'dummy-subtopic-one'),
            topic_domain.Subtopic(
                2, 'Another title', ['skill_id_2'], 'image.svg',
                constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0], 21131,
                'dummy-subtopic-two')]
        self.assertNotEqual(
            self.topic.subtopics[0].skill_ids,
            expected_subtopic1_skills
        )
        self.assertNotEqual(
            self.topic.subtopics[1].skill_ids,
            expected_subtopic2_skills
        )
        self.topic.move_skill_id_to_subtopic(1, 2, 'skill_id_1')
        self.assertEqual(
            self.topic.subtopics[0].skill_ids,
            expected_subtopic1_skills
        )
        self.assertEqual(
            self.topic.subtopics[1].skill_ids,
            expected_subtopic2_skills
        )

    def test_move_skill_id_from_uncategorized_to_subtopic(self) -> None:
        """Checks that move_skill_id_to_subtopic works when moving a skill_id
        from an existing subtopic to a new subtopic returns the expected
        updated values for skill_ids associated with each subtopic.
        """
        expected_subtopic_skills = ['skill_id_2', 'skill_id_3']
        expected_uncategorized_skills: list[str] = []
        self.topic.uncategorized_skill_ids = ['skill_id_3']
        self.topic.subtopics = [
            topic_domain.Subtopic(
                1, 'Title', ['skill_id_1'], 'image.svg',
                constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0], 21131,
                'dummy-subtopic-one'),
            topic_domain.Subtopic(
                2, 'Another title', ['skill_id_2'], 'image.svg',
                constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0], 21131,
                'dummy-subtopic-two')]
        self.assertNotEqual(
            self.topic.subtopics[1].skill_ids,
            expected_subtopic_skills
        )
        self.assertNotEqual(
            self.topic.uncategorized_skill_ids,
            expected_uncategorized_skills
        )
        self.topic.move_skill_id_to_subtopic(None, 2, 'skill_id_3')
        self.assertEqual(
            self.topic.subtopics[1].skill_ids,
            expected_subtopic_skills
        )
        self.assertEqual(
            self.topic.uncategorized_skill_ids,
            expected_uncategorized_skills
        )

    def test_add_subtopic(self) -> None:
        """Checkts that if next_subtopic_id isn't correct
        an exception is raised. Also checks for the sub topic
        getting added to the topic.
        """
        incorrect_new_subtopic_id = 3
        correct_new_subtopic_id = 2
        expected_subtopic_id = self.topic.next_subtopic_id
        with self.assertRaisesRegex(
            Exception,
            'The given new subtopic id %s is not equal to the expected next '
            'subtopic id: %s' % (
                incorrect_new_subtopic_id,
                expected_subtopic_id
            )
        ):
            self.topic.add_subtopic(
                incorrect_new_subtopic_id,
                'subtopic_3',
                'url_frag'
            )
        self.topic.add_subtopic(
            correct_new_subtopic_id,
            'subtopic_title',
            'url_frag'
            )
        self.assertEqual(2, len(self.topic.subtopics))

    def test_update_practice_tab_is_displayed(self) -> None:
        self.assertFalse(self.topic.practice_tab_is_displayed)
        self.topic.update_practice_tab_is_displayed(True)
        self.assertTrue(self.topic.practice_tab_is_displayed)

    def test_update_page_title_fragment_for_web(self) -> None:
        updated_frag = 'updated fragment'
        self.assertNotEqual(
            self.topic.page_title_fragment_for_web,
            updated_frag
        )
        self.topic.update_page_title_fragment_for_web(updated_frag)
        self.assertEqual(self.topic.page_title_fragment_for_web, updated_frag)

    def test_update_meta_tag_content(self) -> None:
        updated_meta_tag = 'updated meta tag'
        self.assertNotEqual(self.topic.meta_tag_content, updated_meta_tag)
        self.topic.update_meta_tag_content(updated_meta_tag)
        self.assertEqual(self.topic.meta_tag_content, updated_meta_tag)

    def test_update_description(self) -> None:
        updated_desc = 'updated description'
        self.assertNotEqual(self.topic.description, updated_desc)
        self.topic.update_description(updated_desc)
        self.assertEqual(self.topic.description, updated_desc)

    def test_update_thumbnail_file_and_size(self) -> None:
        updated_file_name = 'file_name.svg'
        updated_size = 1234
        self.assertNotEqual(self.topic.thumbnail_filename, updated_file_name)
        self.assertNotEqual(self.topic.thumbnail_size_in_bytes, updated_size)
        self.topic.update_thumbnail_filename_and_size(
            updated_file_name,
            updated_size
        )
        self.assertEqual(self.topic.thumbnail_filename, updated_file_name)
        self.assertEqual(self.topic.thumbnail_size_in_bytes, updated_size)

    def test_update_url_fragment(self) -> None:
        url_frag = 'url fragment'
        self.assertNotEqual(self.topic.url_fragment, url_frag)
        self.topic.update_url_fragment(url_frag)
        self.assertEqual(self.topic.url_fragment, url_frag)

    def test_update_name(self) -> None:
        updated_name = 'updated name'
        self.assertNotEqual(self.topic.name, updated_name)
        self.topic.update_name(updated_name)
        self.assertEqual(self.topic.name, updated_name)

    def test_update_name_bytes(self) -> None:
        updated_name = b'updated name'
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Name should be a string.'
        ):
            # TODO(#13059): Here we use MyPy ignore because after we fully type
            # the codebase we plan to get rid of the tests that intentionally
            # test wrong inputs that we can normally catch by typing.
            self.topic.update_name(updated_name) # type: ignore[arg-type]

    @classmethod
    def _schema_update_vers_dict(
        cls,
        current_schema: int,
        topic: topic_domain.Topic
    ) -> topic_domain.VersionedSubtopicsDict:
        """Sets up the VersionendSubtopicsDict for the schema update tests."""
        topic.update_subtopic_title(1, 'abcdefghijklmnopqrstuvwxyz')
        subtopic_dict = topic.subtopics[topic.get_subtopic_index(1)].to_dict()
        vers_subtopic_dict = topic_domain.VersionedSubtopicsDict(
            {
                'schema_version': current_schema,
                'subtopics': [subtopic_dict]
            }
        )
        topic.update_subtopics_from_model(
            vers_subtopic_dict,
            current_schema,
            topic.id
        )
        return vers_subtopic_dict

    def test_subtopic_schema_v1_to_v2(self) -> None:
        current_schema = 1
        vers_subtopic_dict = TopicDomainUnitTests._schema_update_vers_dict(
            current_schema,
            self.topic
        )
        self.assertEqual(
            vers_subtopic_dict['subtopics'][0]['thumbnail_filename'],
            None
        )
        self.assertEqual(
            vers_subtopic_dict['subtopics'][0]['thumbnail_bg_color'],
            None
        )
        self.assertEqual(
            vers_subtopic_dict['schema_version'],
            current_schema + 1
        )

    def test_subtopic_schema_v2_to_v3(self) -> None:
        expected_frag = 'abcdefghijklmnopqrstuvwxy'
        current_schema = 2
        vers_subtopic_dict = TopicDomainUnitTests._schema_update_vers_dict(
            current_schema,
            self.topic
        )
        self.assertEqual(
            vers_subtopic_dict['subtopics'][0]['url_fragment'],
            expected_frag
        )
        self.assertEqual(
            vers_subtopic_dict['schema_version'],
            current_schema + 1
        )

    def test_subtopic_schema_v3_to_v4(self) -> None:
        current_schema = 3
        self.topic.thumbnail_size_in_bytes = 12345
        vers_subtopic_dict = TopicDomainUnitTests._schema_update_vers_dict(
            current_schema,
            self.topic
        )
        self.assertEqual(
            vers_subtopic_dict['subtopics'][0]['thumbnail_size_in_bytes'],
            None
        )

    class MockTopicObject(topic_domain.Topic):
        """Mocks Topic domain object."""

        @classmethod
        def _convert_story_reference_v1_dict_to_v2_dict(
            cls, story_reference: topic_domain.StoryReferenceDict
        ) -> topic_domain.StoryReferenceDict:
            """Converts v1 story reference dict to v2."""
            return story_reference

    def test_story_schema_update(self) -> None:
        story_id = 'story_id'
        story_published = True
        schema_version = 1
        story_ref_dict = topic_domain.StoryReference(
            story_id,
            story_published
        ).to_dict()
        vers_story_ref_dict = topic_domain.VersionedStoryReferencesDict(
            {
                'schema_version': 1,
                'story_references': [story_ref_dict]
            }
        )
        swap_topic_object = self.swap(
            topic_domain,
            'Topic',
            self.MockTopicObject
        )
        current_schema_version_swap = self.swap(
            feconf, 'CURRENT_STORY_REFERENCE_SCHEMA_VERSION', 2)
        with swap_topic_object, current_schema_version_swap:
            topic_domain.Topic.update_story_references_from_model(
                vers_story_ref_dict,
                schema_version
            )
        self.assertEqual(
            vers_story_ref_dict['schema_version'],
            2
        )

    def test_is_valid_topic_id(self) -> None:
        """This test is needed for complete branch coverage.
        We need to go from the if statement and directly exit
        the method.
        """
        topic_id = 'abcdefghijkl'
        try:
            topic_domain.Topic.require_valid_topic_id(topic_id)
        except utils.ValidationError:
            self.fail('This test should pass and not raise an exception')

    def test_invalid_topic_id(self) -> None:
        topic_id = 'a'
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Topic id %s is invalid' % topic_id
        ):
            topic_domain.Topic.require_valid_topic_id(topic_id)

    def _setup_stories(self, topic: topic_domain.Topic) -> None:
        """This setups up stories for various story tests."""
        topic.canonical_story_references = [
            topic_domain.StoryReference.create_default_story_reference(
                'story_id'),
            topic_domain.StoryReference.create_default_story_reference(
                'story_id_1'),
            topic_domain.StoryReference.create_default_story_reference(
                'story_id_2')
        ]
        topic.additional_story_references = [
            topic_domain.StoryReference.create_default_story_reference(
                'story_id_10'),
            topic_domain.StoryReference.create_default_story_reference(
                'story_id_11'),
            topic_domain.StoryReference.create_default_story_reference(
                'story_id_12')
        ]

    def test_publish_story(self) -> None:
        topic = self.topic
        self._setup_stories(topic)
        topic.publish_story('story_id')
        self.assertEqual(
            topic.canonical_story_references[0].story_is_published,
            True
        )
        topic.publish_story('story_id_10')
        self.assertEqual(
            topic.additional_story_references[0].story_is_published,
            True
        )

    def test_publish_story_not_exist(self) -> None:
        topic = self.topic
        self._setup_stories(topic)
        with self.assertRaisesRegex(
            Exception,
            'Story with given id doesn\'t exist in the topic'
        ):
            topic.publish_story('story_id_110')

    def test_unpublish_story(self) -> None:
        topic = self.topic
        self._setup_stories(topic)
        topic.publish_story('story_id_11')
        topic.unpublish_story('story_id_11')
        topic.publish_story('story_id')
        topic.unpublish_story('story_id')
        self.assertEqual(
            topic.additional_story_references[0].story_is_published,
            False
        )
        self.assertEqual(
            topic.canonical_story_references[1].story_is_published,
            False
        )

    def test_validate_same_subtopic_url(self) -> None:
        self.topic.subtopics = [
            topic_domain.Subtopic(
                1, 'Title', ['skill_id_1'], 'image.svg',
                constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0], 21131,
                'dummy-subtopic-one'),
            topic_domain.Subtopic(
                1, 'Another title', ['skill_id_2'], 'image.svg',
                constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0], 21131,
                'dummy-subtopic-two')]
        self.topic.subtopics[0].url_fragment = 'abc'
        self.topic.subtopics[1].url_fragment = 'abc'
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Subtopic url fragments are not unique across '
            'subtopics in the topic'
        ):
            self.topic.validate()

    def test_validate_no_story_references(self) -> None:
        """This is needed for branch coverage when there are no
        story references and validate is run on a topic.
        """
        self.topic.canonical_story_references = []
        self.topic.additional_story_references = []
        try:
            self.topic.validate()
        except Exception:
            self.fail('There are no story references for topic')

    def test_unpublish_story_not_exist(self) -> None:
        topic = self.topic
        self._setup_stories(topic)
        with self.assertRaisesRegex(
            Exception,
            'Story with given id doesn\'t exist in the topic'
        ):
            topic.unpublish_story('story_id_110')

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

    def test_serialize_with_created_on_last_updated_set(self) -> None:
        """Checks that serializing and then deserializing a default topic
        works as intended by leaving the topic unchanged. Added values
        for self.topic.created_on and last_updated.
        """
        self.topic.created_on = datetime.datetime.now()
        self.topic.last_updated = datetime.datetime.now()
        self.assertEqual(
            self.topic.to_dict(),
            topic_domain.Topic.deserialize(
                self.topic.serialize()).to_dict())

    def test_skill_ids_for_diagnostic_test_update(self) -> None:
        """Checks the update method for the skill_ids_for_diagnostic_test field
        for a topic.
        """
        self.topic.subtopics[0].skill_ids = []
        self.assertEqual(
            self.topic.skill_ids_for_diagnostic_test, ['skill_id_1'])
        self.topic.update_skill_ids_for_diagnostic_test([])
        self.assertEqual(self.topic.skill_ids_for_diagnostic_test, [])

    def test_skill_ids_for_diagnostic_test_validation(self) -> None:
        """Checks the validation of skill_ids_for_diagnostic_test field
        for a topic.
        """
        self.topic.update_skill_ids_for_diagnostic_test(['test_skill_id'])
        error_msg = (
            'The skill_ids {\'test_skill_id\'} are selected for the '
            'diagnostic test but they are not associated with the topic.')
        self._assert_validation_error(error_msg)

    def test_min_skill_ids_for_diagnostic_test_validation(self) -> None:
        """Validates empty skill_ids_for_diagnostic_test field must raise
        exception.
        """
        self.topic.thumbnail_filename = 'filename.svg'
        self.topic.thumbnail_bg_color = (
            constants.ALLOWED_THUMBNAIL_BG_COLORS['topic'][0])
        self.topic.skill_ids_for_diagnostic_test = []
        error_msg = (
            'The skill_ids_for_diagnostic_test field should not be empty.')
        self._assert_strict_validation_error(error_msg)

    def test_max_skill_ids_for_diagnostic_test_validation(self) -> None:
        """Validates maximum length for the skill_ids_for_diagnostic_test field
        for a topic.
        """
        skill_ids = ['skill_1', 'skill_2', 'skill_3', 'skill_4']
        self.topic.subtopics[0].skill_ids = skill_ids
        self.topic.skill_ids_for_diagnostic_test = skill_ids
        error_msg = (
            'The skill_ids_for_diagnostic_test field should contain at most 3 '
            'skill_ids.')
        self._assert_validation_error(error_msg)

    def test_removing_uncatgorized_skill_removes_diagnostic_test_skill_if_any(
        self
    ) -> None:
        """Validates the skill id removal from uncategorized skills must also
        remove from the diagnostic tests if any.
        """
        self.assertEqual(self.topic.uncategorized_skill_ids, [])

        self.topic.remove_skill_id_from_subtopic(1, 'skill_id_1')
        self.assertEqual(
            self.topic.skill_ids_for_diagnostic_test, ['skill_id_1'])
        self.assertEqual(self.topic.uncategorized_skill_ids, ['skill_id_1'])
        self.assertEqual(
            self.topic.skill_ids_for_diagnostic_test, ['skill_id_1'])

        self.topic.remove_uncategorized_skill_id('skill_id_1')
        self.assertEqual(self.topic.uncategorized_skill_ids, [])
        self.assertEqual(self.topic.skill_ids_for_diagnostic_test, [])


class TopicChangeTests(test_utils.GenericTestBase):

    def test_topic_change_object_with_missing_cmd(self) -> None:
        with self.assertRaisesRegex(
            utils.ValidationError, 'Missing cmd key in change dict'):
            topic_domain.TopicChange({'invalid': 'data'})

    def test_topic_change_object_with_invalid_cmd(self) -> None:
        with self.assertRaisesRegex(
            utils.ValidationError, 'Command invalid is not allowed'):
            topic_domain.TopicChange({'cmd': 'invalid'})

    def test_topic_change_object_with_missing_attribute_in_cmd(self) -> None:
        with self.assertRaisesRegex(
            utils.ValidationError, (
                'The following required attributes are missing: '
                'new_value, old_value')):
            topic_domain.TopicChange({
                'cmd': 'update_topic_property',
                'property_name': 'name',
            })

    def test_topic_change_object_with_extra_attribute_in_cmd(self) -> None:
        with self.assertRaisesRegex(
            utils.ValidationError, (
                'The following extra attributes are present: invalid')):
            topic_domain.TopicChange({
                'cmd': 'add_subtopic',
                'title': 'title',
                'subtopic_id': 'subtopic_id',
                'url_fragment': 'url-fragment',
                'invalid': 'invalid'
            })

    def test_topic_change_object_with_invalid_topic_property(self) -> None:
        with self.assertRaisesRegex(
            utils.ValidationError, (
                'Value for property_name in cmd update_topic_property: '
                'invalid is not allowed')):
            topic_domain.TopicChange({
                'cmd': 'update_topic_property',
                'property_name': 'invalid',
                'old_value': 'old_value',
                'new_value': 'new_value',
            })

    def test_topic_change_object_with_invalid_subtopic_property(self) -> None:
        with self.assertRaisesRegex(
            utils.ValidationError, (
                'Value for property_name in cmd update_subtopic_property: '
                'invalid is not allowed')):
            topic_domain.TopicChange({
                'cmd': 'update_subtopic_property',
                'subtopic_id': 'subtopic_id',
                'property_name': 'invalid',
                'old_value': 'old_value',
                'new_value': 'new_value',
            })

    def test_topic_change_object_with_invalid_subtopic_page_property(
        self
    ) -> None:
        with self.assertRaisesRegex(
            utils.ValidationError, (
                'Value for property_name in cmd update_subtopic_page_property: '
                'invalid is not allowed')):
            topic_domain.TopicChange({
                'cmd': 'update_subtopic_page_property',
                'subtopic_id': 'subtopic_id',
                'property_name': 'invalid',
                'old_value': 'old_value',
                'new_value': 'new_value',
            })

    def test_topic_change_object_with_add_subtopic(self) -> None:
        topic_change_object = topic_domain.TopicChange({
            'cmd': 'add_subtopic',
            'subtopic_id': 'subtopic_id',
            'title': 'title',
            'url_fragment': 'url-fragment'
        })

        self.assertEqual(topic_change_object.cmd, 'add_subtopic')
        self.assertEqual(topic_change_object.subtopic_id, 'subtopic_id')
        self.assertEqual(topic_change_object.title, 'title')
        self.assertEqual(topic_change_object.url_fragment, 'url-fragment')

    def test_topic_change_object_with_delete_subtopic(self) -> None:
        topic_change_object = topic_domain.TopicChange({
            'cmd': 'delete_subtopic',
            'subtopic_id': 'subtopic_id'
        })

        self.assertEqual(topic_change_object.cmd, 'delete_subtopic')
        self.assertEqual(topic_change_object.subtopic_id, 'subtopic_id')

    def test_topic_change_object_with_add_uncategorized_skill_id(self) -> None:
        topic_change_object = topic_domain.TopicChange({
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
        topic_change_object = topic_domain.TopicChange({
            'cmd': 'remove_uncategorized_skill_id',
            'uncategorized_skill_id': 'uncategorized_skill_id'
        })

        self.assertEqual(
            topic_change_object.cmd, 'remove_uncategorized_skill_id')
        self.assertEqual(
            topic_change_object.uncategorized_skill_id,
            'uncategorized_skill_id')

    def test_topic_change_object_with_move_skill_id_to_subtopic(self) -> None:
        topic_change_object = topic_domain.TopicChange({
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
        topic_change_object = topic_domain.TopicChange({
            'cmd': 'remove_skill_id_from_subtopic',
            'skill_id': 'skill_id',
            'subtopic_id': 'subtopic_id'
        })

        self.assertEqual(
            topic_change_object.cmd, 'remove_skill_id_from_subtopic')
        self.assertEqual(topic_change_object.skill_id, 'skill_id')
        self.assertEqual(topic_change_object.subtopic_id, 'subtopic_id')

    def test_topic_change_object_with_update_subtopic_property(self) -> None:
        topic_change_object = topic_domain.TopicChange({
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
        topic_change_object = topic_domain.TopicChange({
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
        topic_change_object = topic_domain.TopicChange({
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
        topic_change_object = topic_domain.TopicChange({
            'cmd': 'create_new',
            'name': 'name',
        })

        self.assertEqual(topic_change_object.cmd, 'create_new')
        self.assertEqual(topic_change_object.name, 'name')

    def test_topic_change_object_with_migrate_subtopic_schema_to_latest_version(
        self
    ) -> None:
        topic_change_object = topic_domain.TopicChange({
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
        topic_change_object = topic_domain.TopicChange(topic_change_dict)
        self.assertEqual(topic_change_object.to_dict(), topic_change_dict)


class TopicRightsChangeTests(test_utils.GenericTestBase):

    def test_topic_rights_change_object_with_missing_cmd(self) -> None:
        with self.assertRaisesRegex(
            utils.ValidationError, 'Missing cmd key in change dict'):
            topic_domain.TopicRightsChange({'invalid': 'data'})

    def test_topic_change_rights_object_with_invalid_cmd(self) -> None:
        with self.assertRaisesRegex(
            utils.ValidationError, 'Command invalid is not allowed'):
            topic_domain.TopicRightsChange({'cmd': 'invalid'})

    def test_topic_rights_change_object_with_missing_attribute_in_cmd(
        self
    ) -> None:
        with self.assertRaisesRegex(
            utils.ValidationError, (
                'The following required attributes are missing: '
                'new_role, old_role')):
            topic_domain.TopicRightsChange({
                'cmd': 'change_role',
                'assignee_id': 'assignee_id',
            })

    def test_topic_rights_change_object_with_extra_attribute_in_cmd(
        self
    ) -> None:
        with self.assertRaisesRegex(
            utils.ValidationError, (
                'The following extra attributes are present: invalid')):
            topic_domain.TopicRightsChange({
                'cmd': 'publish_topic',
                'invalid': 'invalid'
            })

    def test_topic_rights_change_object_with_invalid_role(self) -> None:
        with self.assertRaisesRegex(
            utils.ValidationError, (
                'Value for old_role in cmd change_role: '
                'invalid is not allowed')):
            topic_domain.TopicRightsChange({
                'cmd': 'change_role',
                'assignee_id': 'assignee_id',
                'old_role': 'invalid',
                'new_role': topic_domain.ROLE_MANAGER
            })

    def test_topic_rights_change_object_with_create_new(self) -> None:
        topic_rights_change_object = topic_domain.TopicRightsChange({
            'cmd': 'create_new'
        })

        self.assertEqual(topic_rights_change_object.cmd, 'create_new')

    def test_topic_rights_change_object_with_change_role(self) -> None:
        topic_rights_change_object = topic_domain.TopicRightsChange({
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
        topic_rights_change_object = topic_domain.TopicRightsChange({
            'cmd': 'publish_topic'
        })

        self.assertEqual(topic_rights_change_object.cmd, 'publish_topic')

    def test_topic_rights_change_object_with_unpublish_topic(self) -> None:
        topic_rights_change_object = topic_domain.TopicRightsChange({
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
        topic_rights_change_object = topic_domain.TopicRightsChange(
            topic_rights_change_dict)
        self.assertEqual(
            topic_rights_change_object.to_dict(), topic_rights_change_dict)


class TopicSummaryTests(test_utils.GenericTestBase):

    def setUp(self) -> None:
        super().setUp()
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

    # Here we use MyPy ignore because we override the definition of the function
    # from the parent class, but that is fine as _assert_validation_error is
    # supposed to be customizable and thus we add an ignore.
    def _assert_validation_error(  # type: ignore[override]
        self,
        expected_error_substring: str
    ) -> None:
        """Checks that the topic summary passes validation.

        Args:
            expected_error_substring: str. String that should be a substring
                of the expected error message.
        """
        with self.assertRaisesRegex(
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

        self.topic_summary.thumbnail_filename = None
        self._assert_validation_error(
            'Topic thumbnail image is not provided.')

        self.topic_summary.thumbnail_bg_color = None
        self.topic_summary.thumbnail_filename = 'test.svg'
        self._assert_validation_error(
            'Topic thumbnail background color is not specified.')

    def test_validation_fails_with_empty_name(self) -> None:
        self.topic_summary.name = ''
        self._assert_validation_error('Name field should not be empty')

    def test_validation_fails_with_empty_url_fragment(self) -> None:
        self.topic_summary.url_fragment = ''
        validation_message = 'Topic URL Fragment field should not be empty.'
        with self.assertRaisesRegex(
            utils.ValidationError, validation_message):
            self.topic_summary.validate()

    def test_validation_fails_with_lenghty_url_fragment(self) -> None:
        self.topic_summary.url_fragment = 'a' * 25
        url_fragment_char_limit = constants.MAX_CHARS_IN_TOPIC_URL_FRAGMENT
        validation_message = (
            'Topic URL Fragment field should not exceed %d characters, '
            'received %s.' % (
                url_fragment_char_limit, self.topic_summary.url_fragment))
        with self.assertRaisesRegex(
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
        super().setUp()
        self.signup('a@example.com', 'A')
        self.signup('b@example.com', 'B')
        self.user_id_a = self.get_user_id_from_email('a@example.com')
        self.user_id_b = self.get_user_id_from_email('b@example.com')

        self.topic_summary = topic_domain.TopicRights(
            'topic_id', [self.user_id_a], False)

    def test_is_manager(self) -> None:
        self.assertTrue(self.topic_summary.is_manager(self.user_id_a))
        self.assertFalse(self.topic_summary.is_manager(self.user_id_b))


class TopicChapterCountsTests(test_utils.GenericTestBase):
    """Tests for Topic Chapter Counts domain object."""

    def test_topic_chapter_counts_object_is_created(self) -> None:
        topic_chapter_counts = topic_domain.TopicChapterCounts(
            2, 3, [4, 5], [2, 2])
        self.assertEqual(topic_chapter_counts.total_upcoming_chapters_count, 2)
        self.assertEqual(topic_chapter_counts.total_overdue_chapters_count, 3)
        self.assertEqual(
            topic_chapter_counts.total_chapter_counts_for_each_story, [4, 5])
        self.assertEqual(
            topic_chapter_counts.published_chapter_counts_for_each_story,
            [2, 2])
