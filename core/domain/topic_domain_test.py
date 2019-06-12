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

from constants import constants
from core.domain import skill_domain
from core.domain import state_domain
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
            self.topic_id, 'Name')
        self.topic.subtopics = [
            topic_domain.Subtopic(1, 'Title', ['skill_id_1'])]
        self.topic.next_subtopic_id = 2

        self.user_id_a = self.get_user_id_from_email('a@example.com')
        self.user_id_b = self.get_user_id_from_email('b@example.com')

        self.user_a = user_services.UserActionsInfo(self.user_id_a)
        self.user_b = user_services.UserActionsInfo(self.user_id_b)

    def test_create_default_topic(self):
        """Tests the create_default_topic() function."""
        topic = topic_domain.Topic.create_default_topic(self.topic_id, 'Name')
        expected_topic_dict = {
            'id': self.topic_id,
            'name': 'Name',
            'description': feconf.DEFAULT_TOPIC_DESCRIPTION,
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
            1, 'Title', ['skill_id_1'])]
        subtopics = self.topic.get_all_subtopics()
        self.assertEqual(
            subtopics, [{
                'skill_ids': ['skill_id_1'],
                'id': 1,
                'title': 'Title'}])

    def test_delete_story(self):
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

    def _assert_validation_error(self, expected_error_substring):
        """Checks that the topic passes strict validation."""
        with self.assertRaisesRegexp(
            utils.ValidationError, expected_error_substring):
            self.topic.validate()

    def _assert_valid_topic_id(self, expected_error_substring, topic_id):
        """Checks that the skill passes strict validation."""
        with self.assertRaisesRegexp(
            utils.ValidationError, expected_error_substring):
            topic_domain.Topic.require_valid_topic_id(topic_id)

    def test_valid_topic_id(self):
        self._assert_valid_topic_id('Topic id should be a string', 10)
        self._assert_valid_topic_id('Topic id abc is invalid', 'abc')

    def test_subtopic_title_validation(self):
        self.topic.subtopics[0].title = 1
        self._assert_validation_error('Expected subtopic title to be a string')

    def test_subtopic_id_validation(self):
        self.topic.subtopics[0].id = 'invalid_id'
        self._assert_validation_error('Expected subtopic id to be an int')

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

    def test_subtopic_schema_version_type_validation(self):
        self.topic.subtopic_schema_version = 'invalid_version'
        self._assert_validation_error(
            'Expected schema version to be an integer')

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
            topic_domain.Subtopic('id_2', 'Title2', ['skill_id_2']))
        with self.assertRaisesRegexp(
            Exception,
            'The skill id skill_id_1 already exists in subtopic with id 1'):
            self.topic.add_uncategorized_skill_id('skill_id_1')
        self.topic.add_uncategorized_skill_id('skill_id_3')
        self.assertEqual(self.topic.uncategorized_skill_ids, ['skill_id_3'])

    def test_fail_to_add_unpublished_skill_id(self):
        self.save_new_skill(
            'skill_a', self.user_id_a, 'Description A', misconceptions=[],
            skill_contents=skill_domain.SkillContents(
                state_domain.SubtitledHtml(
                    '1', 'Explanation'), [
                        state_domain.SubtitledHtml('2', 'Example 1')],
                {'1': {}, '2': {}},
                state_domain.WrittenTranslations.from_dict(
                    {'translations_mapping': {'1': {}, '2': {}}})))
        with self.assertRaisesRegexp(
            Exception,
            'Cannot assign unpublished skills to a topic'):
            self.topic.add_uncategorized_skill_id('skill_a')


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
        with self.assertRaisesRegexp(Exception, 'Invalid change_dict'):
            topic_domain.TopicRightsChange({
                'cmd': 'invalid cmd'
            })

    def test_cannot_create_topic_rights_change_class_with_invalid_changelist(
            self):
        with self.assertRaisesRegexp(Exception, 'Invalid change_dict'):
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

    def test_update_additional_story_ids(self):
        self.assertEqual(self.topic.additional_story_ids, [])
        self.topic.update_additional_story_ids(['story_id_1', 'story_id_2'])
        self.assertEqual(
            self.topic.additional_story_ids, ['story_id_1', 'story_id_2'])

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
            topic_domain.Subtopic(1, 'Title', ['skill_id_1']),
            topic_domain.Subtopic(2, 'Another title', ['skill_id_1'])]
        with self.assertRaisesRegexp(
            Exception,
            'Skill id skill_id_1 is already present in the target subtopic'):
            self.topic.move_skill_id_to_subtopic(1, 2, 'skill_id_1')
