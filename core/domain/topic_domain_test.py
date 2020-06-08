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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime

from constants import constants
from core.domain import topic_domain
from core.domain import user_services
from core.tests import test_utils
import feconf
import utils


class TopicDomainUnitTests(test_utils.GenericTestBase):
    """Tests for topic domain objects."""
    topic_id = 'topic_id'

    def setUp(self):
        super(TopicDomainUnitTests, self).setUp()
        self.signup('a@example.com', 'A')
        self.signup('b@example.com', 'B')
        self.topic = topic_domain.Topic.create_default_topic(
            self.topic_id, 'Name', 'abbrev', 'description')
        self.topic.subtopics = [
            topic_domain.Subtopic(
                1, 'Title', ['skill_id_1'], 'image.svg',
                constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0])]
        self.topic.next_subtopic_id = 2

        self.user_id_a = self.get_user_id_from_email('a@example.com')
        self.user_id_b = self.get_user_id_from_email('b@example.com')

        self.user_a = user_services.UserActionsInfo(self.user_id_a)
        self.user_b = user_services.UserActionsInfo(self.user_id_b)

    def test_create_default_topic(self):
        """Tests the create_default_topic() function."""
        topic = topic_domain.Topic.create_default_topic(
            self.topic_id, 'Name', 'abbrev', 'description')
        expected_topic_dict = {
            'id': self.topic_id,
            'name': 'Name',
            'abbreviated_name': 'abbrev',
            'thumbnail_filename': None,
            'thumbnail_bg_color': None,
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
            'version': 0
        }
        self.assertEqual(topic.to_dict(), expected_topic_dict)

    def test_get_all_skill_ids(self):
        self.topic.uncategorized_skill_ids = ['skill_id_2', 'skill_id_3']
        self.assertEqual(
            self.topic.get_all_skill_ids(),
            ['skill_id_2', 'skill_id_3', 'skill_id_1'])

    def test_get_all_uncategorized_skill_ids(self):
        self.topic.uncategorized_skill_ids = ['skill_id_1', 'skill_id_2']
        self.assertEqual(
            self.topic.get_all_uncategorized_skill_ids(),
            ['skill_id_1', 'skill_id_2'])

    def test_get_all_subtopics(self):
        self.topic.subtopics = [topic_domain.Subtopic(
            1, 'Title', ['skill_id_1'], 'image.svg',
            constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0])]
        subtopics = self.topic.get_all_subtopics()
        self.assertEqual(
            subtopics, [{
                'skill_ids': ['skill_id_1'],
                'id': 1,
                'thumbnail_filename': 'image.svg',
                'thumbnail_bg_color': '#FFFFFF',
                'title': 'Title'}])

    def test_delete_canonical_story(self):
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
        with self.assertRaisesRegexp(
            Exception, 'The story_id story_id_5 is not present in the canonical'
            ' story references list of the topic.'):
            self.topic.delete_canonical_story('story_id_5')

    def test_get_all_story_references(self):
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


    def test_add_canonical_story(self):
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
        with self.assertRaisesRegexp(
            Exception, 'The story_id story_id_2 is already present in the '
            'canonical story references list of the topic.'):
            self.topic.add_canonical_story('story_id_2')

    def test_delete_additional_story(self):
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
        with self.assertRaisesRegexp(
            Exception,
            'The story_id story_id_5 is not present in the additional'
            ' story references list of the topic.'):
            self.topic.delete_additional_story('story_id_5')

    def test_add_additional_story(self):
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
        with self.assertRaisesRegexp(
            Exception, 'The story_id story_id_2 is already present in the '
            'additional story references list of the topic.'):
            self.topic.add_additional_story('story_id_2')

    def _assert_validation_error(self, expected_error_substring):
        """Checks that the topic passes strict validation."""
        with self.assertRaisesRegexp(
            utils.ValidationError, expected_error_substring):
            self.topic.validate()

    def _assert_strict_validation_error(self, expected_error_substring):
        """Checks that the topic passes prepublish validation."""
        with self.assertRaisesRegexp(
            utils.ValidationError, expected_error_substring):
            self.topic.validate(strict=True)

    def _assert_valid_topic_id(self, expected_error_substring, topic_id):
        """Checks that the skill passes strict validation."""
        with self.assertRaisesRegexp(
            utils.ValidationError, expected_error_substring):
            topic_domain.Topic.require_valid_topic_id(topic_id)

    def _assert_valid_abbreviated_name(
            self, expected_error_substring, name):
        """Checks that the topic passes strict validation."""
        with self.assertRaisesRegexp(
            utils.ValidationError, expected_error_substring):
            topic_domain.Topic.require_valid_abbreviated_name(name)

    def _assert_valid_thumbnail_filename_for_topic(
            self, expected_error_substring, thumbnail_filename):
        """Checks that topic passes validation for thumbnail filename."""
        with self.assertRaisesRegexp(
            utils.ValidationError, expected_error_substring):
            topic_domain.Topic.require_valid_thumbnail_filename(
                thumbnail_filename)

    def _assert_valid_thumbnail_filename_for_subtopic(
            self, expected_error_substring, thumbnail_filename):
        """Checks that subtopic passes validation for thumbnail filename."""
        with self.assertRaisesRegexp(
            utils.ValidationError, expected_error_substring):
            topic_domain.Subtopic.require_valid_thumbnail_filename(
                thumbnail_filename)

    def test_valid_topic_id(self):
        self._assert_valid_topic_id('Topic id should be a string', 10)
        self._assert_valid_topic_id('Topic id abc is invalid', 'abc')

    def test_thumbnail_filename_validation_for_topic(self):
        self._assert_valid_thumbnail_filename_for_topic(
            'Expected thumbnail filename to be a string, received 10', 10)
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

    def test_subtopic_strict_validation(self):
        self.topic.thumbnail_filename = 'filename.svg'
        self.topic.thumbnail_bg_color = (
            constants.ALLOWED_THUMBNAIL_BG_COLORS['topic'][0])
        self.topic.subtopics[0].skill_ids = []
        self._assert_strict_validation_error(
            'Subtopic with title Title does not have any skills linked')

    def test_subtopic_title_validation(self):
        self.topic.subtopics[0].title = 1
        self._assert_validation_error('Expected subtopic title to be a string')

        self.topic.subtopics[0].title = (
            'abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefgh'
            'ijklmnopqrstuvwxyz')
        self._assert_validation_error(
            'Expected subtopic title to be less than 64 characters')

    def test_story_id_validation(self):
        self.topic.canonical_story_references = [
            topic_domain.StoryReference(123, True)
        ]
        self._assert_validation_error('Expected story id to be a string')

    def test_story_is_published_validation(self):
        self.topic.canonical_story_references = [
            topic_domain.StoryReference('story_id', 'published')
        ]
        self._assert_validation_error(
            'Expected story_is_published to be a boolean')

    def test_subtopic_id_validation(self):
        self.topic.subtopics[0].id = 'invalid_id'
        self._assert_validation_error('Expected subtopic id to be an int')

    def test_thumbnail_filename_validation_for_subtopic(self):
        self._assert_valid_thumbnail_filename_for_subtopic(
            'Expected thumbnail filename to be a string, received 10', 10)
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

    def test_topic_thumbnail_filename_in_strict_mode(self):
        self.topic.thumbnail_bg_color = None
        with self.assertRaisesRegexp(
            utils.ValidationError,
            'Expected thumbnail filename to be a string, received None.'):
            self.topic.validate(strict=True)

    def test_topic_thumbnail_bg_validation(self):
        self.topic.thumbnail_bg_color = '#FFFFFF'
        self._assert_validation_error(
            'Topic thumbnail background color #FFFFFF is not supported.')

    def test_topic_thumbnail_filename_or_thumbnail_bg_color_is_none(self):
        self.topic.thumbnail_bg_color = '#C6DCDA'
        self.topic.thumbnail_filename = None
        self._assert_validation_error(
            'Topic thumbnail image is not provided.')
        self.topic.thumbnail_bg_color = None
        self.topic.thumbnail_filename = 'test.svg'
        self._assert_validation_error(
            'Topic thumbnail background color is not specified.')

    def test_subtopic_thumbnail_bg_validation(self):
        self.topic.subtopics[0].thumbnail_bg_color = '#CACACA'
        self._assert_validation_error(
            'Subtopic thumbnail background color #CACACA is not supported.')

    def test_subtopic_thumbnail_filename_or_thumbnail_bg_color_is_none(self):
        self.topic.subtopics[0].thumbnail_bg_color = '#FFFFFF'
        self.topic.subtopics[0].thumbnail_filename = None
        self._assert_validation_error(
            'Subtopic thumbnail image is not provided.')
        self.topic.subtopics[0].thumbnail_bg_color = None
        self.topic.subtopics[0].thumbnail_filename = 'test.svg'
        self._assert_validation_error(
            'Subtopic thumbnail background color is not specified.')

    def test_subtopic_skill_ids_validation(self):
        self.topic.subtopics[0].skill_ids = 'abc'
        self._assert_validation_error('Expected skill ids to be a list')
        self.topic.subtopics[0].skill_ids = ['skill_id', 'skill_id']
        self._assert_validation_error(
            'Expected all skill ids to be distinct.')
        self.topic.subtopics[0].skill_ids = [1, 2]
        self._assert_validation_error('Expected each skill id to be a string')

    def test_subtopics_validation(self):
        self.topic.subtopics = 'abc'
        self._assert_validation_error('Expected subtopics to be a list')

    def test_name_validation(self):
        self.topic.name = 1
        self._assert_validation_error('Name should be a string')
        self.topic.name = ''
        self._assert_validation_error('Name field should not be empty')
        self.topic.name = 'Very long and therefore invalid topic name'
        self._assert_validation_error(
            'Topic name should be at most 39 characters')

    def test_subtopic_schema_version_type_validation(self):
        self.topic.subtopic_schema_version = 'invalid_version'
        self._assert_validation_error(
            'Expected subtopic schema version to be an integer')

    def test_story_reference_schema_version_type_validation(self):
        self.topic.story_reference_schema_version = 'invalid_version'
        self._assert_validation_error(
            'Expected story reference schema version to be an integer')

    def test_subtopic_schema_version_validation(self):
        self.topic.subtopic_schema_version = 0
        self._assert_validation_error(
            'Expected subtopic schema version to be %s'
            % (feconf.CURRENT_SUBTOPIC_SCHEMA_VERSION))

    def test_subtopic_type_validation(self):
        self.topic.subtopics = ['subtopic']
        self._assert_validation_error(
            'Expected each subtopic to be a Subtopic object')

    def test_description_validation(self):
        self.topic.description = 1
        self._assert_validation_error('Expected description to be a string')
        self.topic.description = (
            'Lorem ipsum dolor sit amet, consectetuer '
            'adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. '
            'Dum sociis natoque penatibus et magnis dis parturient montes, '
            'nascetur ridiculus mus. Donec quam felis, ultricies nec, '
            'pellentesque eu,'
        )
        self._assert_validation_error(
            'Topic description should be at most 240 characters.')

    def test_next_subtopic_id_validation(self):
        self.topic.next_subtopic_id = '1'
        self._assert_validation_error('Expected next_subtopic_id to be an int')
        self.topic.next_subtopic_id = 1
        self._assert_validation_error(
            'The id for subtopic 1 is greater than or equal to '
            'next_subtopic_id 1')

    def test_language_code_validation(self):
        self.topic.language_code = 0
        self._assert_validation_error('Expected language code to be a string')

        self.topic.language_code = 'xz'
        self._assert_validation_error('Invalid language code')

    def test_canonical_story_references_validation(self):
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
        self.topic.canonical_story_references = 'story_id'
        self._assert_validation_error(
            'Expected canonical story references to be a list')

    def test_additional_story_references_validation(self):
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
        self.topic.additional_story_references = 'story_id'
        self._assert_validation_error(
            'Expected additional story references to be a list')

    def test_additional_canonical_story_intersection_validation(self):
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

    def test_uncategorized_skill_ids_validation(self):
        self.topic.uncategorized_skill_ids = 'uncategorized_skill_id'
        self._assert_validation_error(
            'Expected uncategorized skill ids to be a list')

    def test_add_uncategorized_skill_id(self):
        self.topic.subtopics.append(
            topic_domain.Subtopic(
                'id_2', 'Title2', ['skill_id_2'], 'image.svg',
                constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0]))
        with self.assertRaisesRegexp(
            Exception,
            'The skill id skill_id_1 already exists in subtopic with id 1'):
            self.topic.add_uncategorized_skill_id('skill_id_1')
        self.topic.add_uncategorized_skill_id('skill_id_3')
        self.assertEqual(self.topic.uncategorized_skill_ids, ['skill_id_3'])

    def test_remove_uncategorized_skill_id(self):
        self.topic.uncategorized_skill_ids = ['skill_id_5']
        with self.assertRaisesRegexp(
            Exception,
            'The skill id skill_id_3 is not present in the topic'):
            self.topic.remove_uncategorized_skill_id('skill_id_3')
        self.topic.remove_uncategorized_skill_id('skill_id_5')
        self.assertEqual(self.topic.uncategorized_skill_ids, [])

    def test_move_skill_id_to_subtopic(self):
        self.topic.uncategorized_skill_ids = ['skill_id_1']
        self.topic.subtopics[0].skill_ids = ['skill_id_2']
        self.topic.move_skill_id_to_subtopic(None, 1, 'skill_id_1')
        self.assertEqual(self.topic.uncategorized_skill_ids, [])
        self.assertEqual(
            self.topic.subtopics[0].skill_ids, ['skill_id_2', 'skill_id_1'])

        self.topic.uncategorized_skill_ids = ['skill_id_1']
        self.topic.subtopics[0].skill_ids = ['skill_id_2']
        with self.assertRaisesRegexp(
            Exception,
            'Skill id skill_id_3 is not an uncategorized skill id'):
            self.topic.move_skill_id_to_subtopic(None, 'id_1', 'skill_id_3')

    def test_get_subtopic_index(self):
        self.assertIsNone(self.topic.get_subtopic_index(2))
        self.assertEqual(self.topic.get_subtopic_index(1), 0)

    def test_to_dict(self):
        user_ids = [self.user_id_a, self.user_id_b]
        topic_rights = topic_domain.TopicRights(self.topic_id, user_ids, False)
        expected_dict = {
            'topic_id': self.topic_id,
            'manager_names': ['A', 'B'],
            'topic_is_published': False
        }

        self.assertEqual(expected_dict, topic_rights.to_dict())

    def test_is_manager(self):
        user_ids = [self.user_id_a, self.user_id_b]
        topic_rights = topic_domain.TopicRights(self.topic_id, user_ids, False)
        self.assertTrue(topic_rights.is_manager(self.user_id_a))
        self.assertTrue(topic_rights.is_manager(self.user_id_b))
        self.assertFalse(topic_rights.is_manager('fakeuser'))

    def test_cannot_create_topic_rights_change_class_with_invalid_cmd(self):
        with self.assertRaisesRegexp(
            Exception, 'Command invalid cmd is not allowed'):
            topic_domain.TopicRightsChange({
                'cmd': 'invalid cmd'
            })

    def test_cannot_create_topic_rights_change_class_with_invalid_changelist(
            self):
        with self.assertRaisesRegexp(
            Exception, 'Missing cmd key in change dict'):
            topic_domain.TopicRightsChange({})

    def test_create_new_topic_rights_change_class(self):
        topic_rights = topic_domain.TopicRightsChange({
            'cmd': 'create_new'
        })

        self.assertEqual(topic_rights.to_dict(), {'cmd': 'create_new'})

    def test_update_language_code(self):
        self.assertEqual(self.topic.language_code, 'en')
        self.topic.update_language_code('bn')
        self.assertEqual(self.topic.language_code, 'bn')

    def test_update_abbreviated_name(self):
        self.assertEqual(self.topic.abbreviated_name, 'abbrev')
        self.topic.update_abbreviated_name('name')
        self.assertEqual(self.topic.abbreviated_name, 'name')

    def test_update_thumbnail_filename(self):
        self.assertEqual(self.topic.thumbnail_filename, None)
        self.topic.update_thumbnail_filename('img.svg')
        self.assertEqual(self.topic.thumbnail_filename, 'img.svg')

    def test_update_thumbnail_bg_color(self):
        self.assertEqual(self.topic.thumbnail_bg_color, None)
        self.topic.update_thumbnail_bg_color('#C6DCDA')
        self.assertEqual(self.topic.thumbnail_bg_color, '#C6DCDA')

    def test_cannot_add_uncategorized_skill_with_existing_uncategorized_skill(
            self):
        self.assertEqual(self.topic.uncategorized_skill_ids, [])
        self.topic.uncategorized_skill_ids = ['skill_id1']
        with self.assertRaisesRegexp(
            Exception,
            'The skill id skill_id1 is already an uncategorized skill.'):
            self.topic.add_uncategorized_skill_id('skill_id1')

    def test_cannot_delete_subtopic_with_invalid_subtopic_id(self):
        with self.assertRaisesRegexp(
            Exception, 'A subtopic with id invalid_id doesn\'t exist.'):
            self.topic.delete_subtopic('invalid_id')

    def test_cannot_update_subtopic_title_with_invalid_subtopic_id(self):
        with self.assertRaisesRegexp(
            Exception, 'The subtopic with id invalid_id does not exist.'):
            self.topic.update_subtopic_title('invalid_id', 'new title')

    def test_update_subtopic_title(self):
        self.assertEqual(len(self.topic.subtopics), 1)
        self.assertEqual(self.topic.subtopics[0].title, 'Title')

        self.topic.update_subtopic_title(1, 'new title')
        self.assertEqual(self.topic.subtopics[0].title, 'new title')

    def test_update_subtopic_thumbnail_filename(self):
        self.assertEqual(len(self.topic.subtopics), 1)
        self.assertEqual(
            self.topic.subtopics[0].thumbnail_filename, 'image.svg')
        self.topic.update_subtopic_thumbnail_filename(1, 'new_image.svg')
        self.assertEqual(
            self.topic.subtopics[0].thumbnail_filename, 'new_image.svg')

        with self.assertRaisesRegexp(
            Exception, 'The subtopic with id invalid_id does not exist.'):
            self.topic.update_subtopic_thumbnail_filename(
                'invalid_id', 'new title')

    def test_update_subtopic_thumbnail_bg_color(self):
        self.assertEqual(len(self.topic.subtopics), 1)
        self.topic.subtopics[0].thumbnail_bg_color = None
        self.assertEqual(
            self.topic.subtopics[0].thumbnail_bg_color, None)
        self.topic.update_subtopic_thumbnail_bg_color(1, '#FFFFFF')
        self.assertEqual(
            self.topic.subtopics[0].thumbnail_bg_color, '#FFFFFF')

        with self.assertRaisesRegexp(
            Exception, 'The subtopic with id invalid_id does not exist.'):
            self.topic.update_subtopic_thumbnail_bg_color(
                'invalid_id', '#FFFFFF')

    def test_cannot_remove_skill_id_from_subtopic_with_invalid_subtopic_id(
            self):
        with self.assertRaisesRegexp(
            Exception, 'The subtopic with id invalid_id does not exist.'):
            self.topic.remove_skill_id_from_subtopic('invalid_id', 'skill_id1')

    def test_cannot_move_skill_id_to_subtopic_with_invalid_subtopic_id(self):
        with self.assertRaisesRegexp(
            Exception, 'The subtopic with id old_subtopic_id does not exist.'):
            self.topic.move_skill_id_to_subtopic(
                'old_subtopic_id', 'new_subtopic_id', 'skill_id1')

    def test_cannot_move_existing_skill_to_subtopic(self):
        self.topic.subtopics = [
            topic_domain.Subtopic(
                1, 'Title', ['skill_id_1'], 'image.svg',
                constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0]),
            topic_domain.Subtopic(
                2, 'Another title', ['skill_id_1'], 'image.svg',
                constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0])]
        with self.assertRaisesRegexp(
            Exception,
            'Skill id skill_id_1 is already present in the target subtopic'):
            self.topic.move_skill_id_to_subtopic(1, 2, 'skill_id_1')


class TopicChangeTests(test_utils.GenericTestBase):

    def test_topic_change_object_with_missing_cmd(self):
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Missing cmd key in change dict'):
            topic_domain.TopicChange({'invalid': 'data'})

    def test_topic_change_object_with_invalid_cmd(self):
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Command invalid is not allowed'):
            topic_domain.TopicChange({'cmd': 'invalid'})

    def test_topic_change_object_with_missing_attribute_in_cmd(self):
        with self.assertRaisesRegexp(
            utils.ValidationError, (
                'The following required attributes are missing: '
                'new_value, old_value')):
            topic_domain.TopicChange({
                'cmd': 'update_topic_property',
                'property_name': 'name',
            })

    def test_topic_change_object_with_extra_attribute_in_cmd(self):
        with self.assertRaisesRegexp(
            utils.ValidationError, (
                'The following extra attributes are present: invalid')):
            topic_domain.TopicChange({
                'cmd': 'add_subtopic',
                'title': 'title',
                'subtopic_id': 'subtopic_id',
                'invalid': 'invalid'
            })

    def test_topic_change_object_with_invalid_topic_property(self):
        with self.assertRaisesRegexp(
            utils.ValidationError, (
                'Value for property_name in cmd update_topic_property: '
                'invalid is not allowed')):
            topic_domain.TopicChange({
                'cmd': 'update_topic_property',
                'property_name': 'invalid',
                'old_value': 'old_value',
                'new_value': 'new_value',
            })

    def test_topic_change_object_with_invalid_subtopic_property(self):
        with self.assertRaisesRegexp(
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

    def test_topic_change_object_with_add_subtopic(self):
        topic_change_object = topic_domain.TopicChange({
            'cmd': 'add_subtopic',
            'subtopic_id': 'subtopic_id',
            'title': 'title'
        })

        self.assertEqual(topic_change_object.cmd, 'add_subtopic')
        self.assertEqual(topic_change_object.subtopic_id, 'subtopic_id')
        self.assertEqual(topic_change_object.title, 'title')

    def test_topic_change_object_with_delete_subtopic(self):
        topic_change_object = topic_domain.TopicChange({
            'cmd': 'delete_subtopic',
            'subtopic_id': 'subtopic_id'
        })

        self.assertEqual(topic_change_object.cmd, 'delete_subtopic')
        self.assertEqual(topic_change_object.subtopic_id, 'subtopic_id')

    def test_topic_change_object_with_add_uncategorized_skill_id(self):
        topic_change_object = topic_domain.TopicChange({
            'cmd': 'add_uncategorized_skill_id',
            'new_uncategorized_skill_id': 'new_uncategorized_skill_id'
        })

        self.assertEqual(topic_change_object.cmd, 'add_uncategorized_skill_id')
        self.assertEqual(
            topic_change_object.new_uncategorized_skill_id,
            'new_uncategorized_skill_id')

    def test_topic_change_object_with_remove_uncategorized_skill_id(self):
        topic_change_object = topic_domain.TopicChange({
            'cmd': 'remove_uncategorized_skill_id',
            'uncategorized_skill_id': 'uncategorized_skill_id'
        })

        self.assertEqual(
            topic_change_object.cmd, 'remove_uncategorized_skill_id')
        self.assertEqual(
            topic_change_object.uncategorized_skill_id,
            'uncategorized_skill_id')

    def test_topic_change_object_with_move_skill_id_to_subtopic(self):
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

    def test_topic_change_object_with_remove_skill_id_from_subtopic(self):
        topic_change_object = topic_domain.TopicChange({
            'cmd': 'remove_skill_id_from_subtopic',
            'skill_id': 'skill_id',
            'subtopic_id': 'subtopic_id'
        })

        self.assertEqual(
            topic_change_object.cmd, 'remove_skill_id_from_subtopic')
        self.assertEqual(topic_change_object.skill_id, 'skill_id')
        self.assertEqual(topic_change_object.subtopic_id, 'subtopic_id')

    def test_topic_change_object_with_update_subtopic_property(self):
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

    def test_topic_change_object_with_update_topic_property(self):
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

    def test_topic_change_object_with_create_new(self):
        topic_change_object = topic_domain.TopicChange({
            'cmd': 'create_new',
            'name': 'name',
        })

        self.assertEqual(topic_change_object.cmd, 'create_new')
        self.assertEqual(topic_change_object.name, 'name')

    def test_topic_change_object_with_migrate_subtopic_schema_to_latest_version(
            self):
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

    def test_to_dict(self):
        topic_change_dict = {
            'cmd': 'create_new',
            'name': 'name'
        }
        topic_change_object = topic_domain.TopicChange(topic_change_dict)
        self.assertEqual(topic_change_object.to_dict(), topic_change_dict)


class TopicRightsChangeTests(test_utils.GenericTestBase):

    def test_topic_rights_change_object_with_missing_cmd(self):
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Missing cmd key in change dict'):
            topic_domain.TopicRightsChange({'invalid': 'data'})

    def test_topic_change_rights_object_with_invalid_cmd(self):
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Command invalid is not allowed'):
            topic_domain.TopicRightsChange({'cmd': 'invalid'})

    def test_topic_rights_change_object_with_missing_attribute_in_cmd(self):
        with self.assertRaisesRegexp(
            utils.ValidationError, (
                'The following required attributes are missing: '
                'new_role, old_role')):
            topic_domain.TopicRightsChange({
                'cmd': 'change_role',
                'assignee_id': 'assignee_id',
            })

    def test_topic_rights_change_object_with_extra_attribute_in_cmd(self):
        with self.assertRaisesRegexp(
            utils.ValidationError, (
                'The following extra attributes are present: invalid')):
            topic_domain.TopicRightsChange({
                'cmd': 'publish_topic',
                'invalid': 'invalid'
            })

    def test_topic_rights_change_object_with_invalid_role(self):
        with self.assertRaisesRegexp(
            utils.ValidationError, (
                'Value for old_role in cmd change_role: '
                'invalid is not allowed')):
            topic_domain.TopicRightsChange({
                'cmd': 'change_role',
                'assignee_id': 'assignee_id',
                'old_role': 'invalid',
                'new_role': topic_domain.ROLE_MANAGER
            })

    def test_topic_rights_change_object_with_create_new(self):
        topic_rights_change_object = topic_domain.TopicRightsChange({
            'cmd': 'create_new'
        })

        self.assertEqual(topic_rights_change_object.cmd, 'create_new')

    def test_topic_rights_change_object_with_change_role(self):
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

    def test_topic_rights_change_object_with_publish_topic(self):
        topic_rights_change_object = topic_domain.TopicRightsChange({
            'cmd': 'publish_topic'
        })

        self.assertEqual(topic_rights_change_object.cmd, 'publish_topic')

    def test_topic_rights_change_object_with_unpublish_topic(self):
        topic_rights_change_object = topic_domain.TopicRightsChange({
            'cmd': 'unpublish_topic'
        })

        self.assertEqual(topic_rights_change_object.cmd, 'unpublish_topic')

    def test_to_dict(self):
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

    def setUp(self):
        super(TopicSummaryTests, self).setUp()
        current_time = datetime.datetime.utcnow()
        time_in_millisecs = utils.get_time_in_millisecs(current_time)
        self.topic_summary_dict = {
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
            'topic_model_created_on': time_in_millisecs,
            'topic_model_last_updated': time_in_millisecs
        }

        self.topic_summary = topic_domain.TopicSummary(
            'topic_id', 'name', 'name', 'en', 'topic description',
            1, 1, 1, 1, 1, 1, current_time, current_time)

    def test_topic_summary_gets_created(self):
        self.assertEqual(
            self.topic_summary.to_dict(), self.topic_summary_dict)

    def test_validation_passes_with_valid_properties(self):
        self.topic_summary.validate()

    def test_validation_fails_with_invalid_name(self):
        self.topic_summary.name = 0
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Name should be a string.'):
            self.topic_summary.validate()

    def test_validation_fails_with_empty_name(self):
        self.topic_summary.name = ''
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Name field should not be empty'):
            self.topic_summary.validate()

    def test_validation_fails_with_invalid_description(self):
        self.topic_summary.description = 3
        with self.assertRaisesRegexp(
            utils.ValidationError,
            'Expected description to be a string, received 3'):
            self.topic_summary.validate()

    def test_validation_fails_with_invalid_canonical_name(self):
        self.topic_summary.canonical_name = 0
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Canonical name should be a string.'):
            self.topic_summary.validate()

    def test_validation_fails_with_empty_canonical_name(self):
        self.topic_summary.canonical_name = ''
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Canonical name field should not be empty'):
            self.topic_summary.validate()

    def test_validation_fails_with_invalid_language_code(self):
        self.topic_summary.language_code = 0
        with self.assertRaisesRegexp(
            utils.ValidationError,
            'Expected language code to be a string, received 0'):
            self.topic_summary.validate()

    def test_validation_fails_with_unallowed_language_code(self):
        self.topic_summary.language_code = 'invalid'
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Invalid language code: invalid'):
            self.topic_summary.validate()

    def test_validation_fails_with_invalid_canonical_story_count(self):
        self.topic_summary.canonical_story_count = '10'
        with self.assertRaisesRegexp(
            utils.ValidationError,
            'Expected canonical story count to be an integer, received \'10\''):
            self.topic_summary.validate()

    def test_validation_fails_with_negative_canonical_story_count(self):
        self.topic_summary.canonical_story_count = -1
        with self.assertRaisesRegexp(
            utils.ValidationError, (
                'Expected canonical_story_count to be non-negative, '
                'received \'-1\'')):
            self.topic_summary.validate()

    def test_validation_fails_with_invalid_additional_story_count(self):
        self.topic_summary.additional_story_count = '10'
        with self.assertRaisesRegexp(
            utils.ValidationError, (
                'Expected additional story count to be an '
                'integer, received \'10\'')):
            self.topic_summary.validate()

    def test_validation_fails_with_negative_additional_story_count(self):
        self.topic_summary.additional_story_count = -1
        with self.assertRaisesRegexp(
            utils.ValidationError, (
                'Expected additional_story_count to be non-negative, '
                'received \'-1\'')):
            self.topic_summary.validate()

    def test_validation_fails_with_invalid_uncategorized_skill_count(self):
        self.topic_summary.uncategorized_skill_count = '10'
        with self.assertRaisesRegexp(
            utils.ValidationError, (
                'Expected uncategorized skill count to be an integer, '
                'received \'10\'')):
            self.topic_summary.validate()

    def test_validation_fails_with_negative_uncategorized_skill_count(self):
        self.topic_summary.uncategorized_skill_count = -1
        with self.assertRaisesRegexp(
            utils.ValidationError, (
                'Expected uncategorized_skill_count to be non-negative, '
                'received \'-1\'')):
            self.topic_summary.validate()

    def test_validation_fails_with_invalid_total_skill_count(self):
        self.topic_summary.total_skill_count = '10'
        with self.assertRaisesRegexp(
            utils.ValidationError,
            'Expected total skill count to be an integer, received \'10\''):
            self.topic_summary.validate()

    def test_validation_fails_with_negative_total_skill_count(self):
        self.topic_summary.total_skill_count = -1
        with self.assertRaisesRegexp(
            utils.ValidationError, (
                'Expected total_skill_count to be non-negative, '
                'received \'-1\'')):
            self.topic_summary.validate()

    def test_validation_fails_with_invalid_total_skill_count_value(self):
        self.topic_summary.total_skill_count = 5
        self.topic_summary.uncategorized_skill_count = 10
        with self.assertRaisesRegexp(
            utils.ValidationError, (
                'Expected total_skill_count to be greater than or equal to '
                'uncategorized_skill_count 10, received \'5\'')):
            self.topic_summary.validate()

    def test_validation_fails_with_invalid_subtopic_count(self):
        self.topic_summary.subtopic_count = '10'
        with self.assertRaisesRegexp(
            utils.ValidationError,
            'Expected subtopic count to be an integer, received \'10\''):
            self.topic_summary.validate()

    def test_validation_fails_with_negative_subtopic_count(self):
        self.topic_summary.subtopic_count = -1
        with self.assertRaisesRegexp(
            utils.ValidationError, (
                'Expected subtopic_count to be non-negative, '
                'received \'-1\'')):
            self.topic_summary.validate()


class TopicRightsTests(test_utils.GenericTestBase):

    def setUp(self):
        super(TopicRightsTests, self).setUp()
        self.signup('a@example.com', 'A')
        self.signup('b@example.com', 'B')
        self.user_id_a = self.get_user_id_from_email('a@example.com')
        self.user_id_b = self.get_user_id_from_email('b@example.com')
        self.topic_summary_dict = {
            'topic_id': 'topic_id',
            'manager_names': ['A'],
            'topic_is_published': False,
        }

        self.topic_summary = topic_domain.TopicRights(
            'topic_id', [self.user_id_a], False)

    def test_topic_summary_gets_created(self):
        self.assertEqual(
            self.topic_summary.to_dict(), self.topic_summary_dict)

    def test_is_manager(self):
        self.assertTrue(self.topic_summary.is_manager(self.user_id_a))
        self.assertFalse(self.topic_summary.is_manager(self.user_id_b))
