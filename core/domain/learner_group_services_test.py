# coding: utf-8
#
# Copyright 2022 The Oppia Authors. All Rights Reserved.
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

"""Tests for the learner group services."""

from __future__ import annotations

from core.constants import constants
from core.domain import config_services
from core.domain import learner_group_fetchers
from core.domain import learner_group_services
from core.domain import topic_domain
from core.domain import topic_services
from core.platform import models
from core.tests import test_utils

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import user_models

(user_models,) = models.Registry.import_models([models.Names.USER])


class LearnerGroupServicesUnitTests(test_utils.GenericTestBase):
    """Tests for skill fetchers."""

    FACILITATOR_ID = 'facilitator_user_1'
    LEARNER_ID = 'learner_user_1'
    TOPIC_ID_0 = 'topic_id_0'
    TOPIC_ID_1 = 'topic_id_1'
    STORY_ID_0 = 'story_id_0'
    STORY_ID_1 = 'story_id_1'
    STORY_ID_2 = 'story_id_2'

    def setUp(self) -> None:
        super().setUp()
        self.signup(
            self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(
            self.CURRICULUM_ADMIN_EMAIL)
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])

        self.LEARNER_GROUP_ID = (
            learner_group_fetchers.get_new_learner_group_id()
        )
        self.LEARNER_GROUP_ID_2 = (
            learner_group_fetchers.get_new_learner_group_id()
        )

        self.learner_group = learner_group_services.create_learner_group(
            self.LEARNER_GROUP_ID, 'Learner Group Name', 'Description',
            [self.FACILITATOR_ID], [self.LEARNER_ID], ['subtopic_id_1'],
            ['story_id_1'])
        self.learner_group_2 = learner_group_services.create_learner_group(
            self.LEARNER_GROUP_ID_2, 'Learner Group 2', 'Description 2',
            [self.FACILITATOR_ID], [self.LEARNER_ID], ['subtopic_id_1'],
            ['story_id_1'])

        # Set up topics, subtopics and stories for learner group syllabus.
        topic = topic_domain.Topic.create_default_topic(
            self.TOPIC_ID_0, 'Place Values', 'abbrev', 'description', 'fragm')
        topic.thumbnail_filename = 'thumbnail.svg'
        topic.thumbnail_bg_color = '#C6DCDA'
        topic.subtopics = [
            topic_domain.Subtopic(
                1, 'Naming Numbers', ['skill_id_1'], 'image.svg',
                constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0], 21131,
                'dummy-subtopic-url')]
        topic.next_subtopic_id = 2
        topic.skill_ids_for_diagnostic_test = ['skill_id_1']
        topic_services.save_new_topic(self.admin_id, topic)
        self.save_new_story(
            self.STORY_ID_0, self.admin_id, self.TOPIC_ID_0,
            'Story test 0')
        topic_services.add_canonical_story(
            self.admin_id, self.TOPIC_ID_0, self.STORY_ID_0)

        # Publish the topic and its stories.
        topic_services.publish_topic(self.TOPIC_ID_0, self.admin_id)
        topic_services.publish_story(
            self.TOPIC_ID_0, self.STORY_ID_0, self.admin_id)

        # Create another topic.
        topic = topic_domain.Topic.create_default_topic(
            self.TOPIC_ID_1, 'Negative Numbers', 'abbrev-one',
            'description 1', 'fragm')
        topic.thumbnail_filename = 'thumbnail.svg'
        topic.thumbnail_bg_color = '#C6DCDA'
        topic.subtopics = [
            topic_domain.Subtopic(
                1, 'Intro to negative numbers', ['skill_id_1'], 'image.svg',
                constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0], 21131,
                'dummy-subtopic-url-one')]
        topic.next_subtopic_id = 2
        topic.skill_ids_for_diagnostic_test = ['skill_id_1']

        topic_services.save_new_topic(self.admin_id, topic)
        self.save_new_story(
            self.STORY_ID_1, self.admin_id, self.TOPIC_ID_1,
            'Story test 1')
        topic_services.add_canonical_story(
            self.admin_id, self.TOPIC_ID_1, self.STORY_ID_1)

        # Publish the topic and its stories.
        topic_services.publish_topic(self.TOPIC_ID_1, self.admin_id)
        topic_services.publish_story(
            self.TOPIC_ID_1, self.STORY_ID_1, self.admin_id)

    def test_create_learner_group(self) -> None:
        self.assertIsNotNone(self.learner_group)
        self.assertEqual(self.learner_group.group_id, self.LEARNER_GROUP_ID)
        self.assertEqual(self.learner_group.title, 'Learner Group Name')
        self.assertEqual(self.learner_group.description, 'Description')
        self.assertEqual(
            self.learner_group.facilitator_user_ids, [self.FACILITATOR_ID])
        self.assertEqual(
            self.learner_group.invited_learner_user_ids, [self.LEARNER_ID])
        self.assertEqual(
            self.learner_group.subtopic_page_ids, ['subtopic_id_1'])
        self.assertEqual(self.learner_group.story_ids, ['story_id_1'])

    def test_is_learner_group_feature_enabled(self) -> None:
        config_services.set_property(
            self.admin_id, 'learner_groups_are_enabled', True)
        self.assertTrue(
            learner_group_services.is_learner_group_feature_enabled())

        config_services.set_property(
            self.admin_id, 'learner_groups_are_enabled', False)
        self.assertFalse(
            learner_group_services.is_learner_group_feature_enabled())

    def test_update_learner_group(self) -> None:
        updated_group = learner_group_services.update_learner_group(
            self.LEARNER_GROUP_ID, 'Updated Group Name', 'Updated Description',
            [self.FACILITATOR_ID], [], ['new_learner_id'],
            ['subtopic_id_1', 'subtopic_id_2'], ['story_id_1', 'story_id_2'])

        self.assertIsNotNone(updated_group)
        self.assertEqual(updated_group.group_id, self.LEARNER_GROUP_ID)
        self.assertEqual(updated_group.title, 'Updated Group Name')
        self.assertEqual(updated_group.description, 'Updated Description')
        self.assertEqual(
            updated_group.facilitator_user_ids, [self.FACILITATOR_ID]
        )
        self.assertEqual(
            updated_group.invited_learner_user_ids, ['new_learner_id']
        )
        self.assertEqual(
            updated_group.subtopic_page_ids,
            ['subtopic_id_1', 'subtopic_id_2']
        )
        self.assertEqual(updated_group.story_ids, ['story_id_1', 'story_id_2'])

    def test_is_user_facilitator(self) -> None:
        self.assertTrue(
            learner_group_services.is_user_facilitator(
                self.FACILITATOR_ID, self.LEARNER_GROUP_ID))

        self.assertFalse(
            learner_group_services.is_user_facilitator(
                self.LEARNER_ID, self.LEARNER_GROUP_ID))

    def test_is_user_learner(self) -> None:
        self.assertFalse(
            learner_group_services.is_user_learner(
                self.FACILITATOR_ID, self.LEARNER_GROUP_ID))
        self.assertFalse(
            learner_group_services.is_user_learner(
                self.LEARNER_ID, self.LEARNER_GROUP_ID))

        learner_group_services.add_learner_to_learner_group(
            self.LEARNER_GROUP_ID, self.LEARNER_ID, True)

        self.assertTrue(
            learner_group_services.is_user_learner(
                self.LEARNER_ID, self.LEARNER_GROUP_ID))

    def test_get_matching_syllabus_to_add_with_default_filters(self) -> None:
        # Test 1: Default filters with topic name matching.
        matching_syllabus = (
            learner_group_services.get_matching_learner_group_syllabus_to_add(
                self.LEARNER_GROUP_ID, 'Place', 'All',
                'All', constants.DEFAULT_LANGUAGE_CODE
            )
        )
        story_summary_dicts = matching_syllabus['story_summary_dicts']
        self.assertEqual(len(story_summary_dicts), 1)
        self.assertEqual(story_summary_dicts[0]['id'], self.STORY_ID_0)
        self.assertEqual(story_summary_dicts[0]['title'], 'Story test 0')

        subtopic_summary_dicts = matching_syllabus['subtopic_summary_dicts']
        self.assertEqual(len(subtopic_summary_dicts), 1)
        self.assertEqual(subtopic_summary_dicts[0]['subtopic_id'], 1)
        self.assertEqual(
            subtopic_summary_dicts[0]['subtopic_title'], 'Naming Numbers')

    def test_get_syllabus_to_add_with_matching_subtopic_name(self) -> None:
        # Test 2: Skill type filter with subtopic name matching.
        matching_syllabus = (
            learner_group_services.get_matching_learner_group_syllabus_to_add(
                self.LEARNER_GROUP_ID, 'Naming', 'Skill',
                'All', constants.DEFAULT_LANGUAGE_CODE
            )
        )

        story_summary_dicts = matching_syllabus['story_summary_dicts']
        self.assertEqual(len(story_summary_dicts), 0)

        subtopic_summary_dicts = matching_syllabus['subtopic_summary_dicts']
        self.assertEqual(len(subtopic_summary_dicts), 1)
        self.assertEqual(subtopic_summary_dicts[0]['subtopic_id'], 1)
        self.assertEqual(subtopic_summary_dicts[0][
            'subtopic_title'], 'Naming Numbers')

    def test_get_syllabus_to_add_with_matching_story_name(self) -> None:
        # Test 3: Story type filter with story name matching.
        matching_syllabus = (
            learner_group_services.get_matching_learner_group_syllabus_to_add(
                self.LEARNER_GROUP_ID, 'Story test', 'Story',
                'All', constants.DEFAULT_LANGUAGE_CODE
            )
        )
        # Story test 1 is already part of the group syllabus
        # so it should not be returned in the filtered syllabus.
        story_summary_dicts = matching_syllabus['story_summary_dicts']
        self.assertEqual(len(story_summary_dicts), 1)
        self.assertEqual(story_summary_dicts[0]['id'], self.STORY_ID_0)
        self.assertEqual(story_summary_dicts[0]['title'], 'Story test 0')

        subtopic_summary_dicts = (
                matching_syllabus['subtopic_summary_dicts']
            )
        self.assertEqual(len(subtopic_summary_dicts), 0)

    def test_get_matching_syllabus_to_add_with_classroom_filter(self) -> None:
        # Test 4: Classroom name filter.
        matching_syllabus = (
            learner_group_services.get_matching_learner_group_syllabus_to_add(
                self.LEARNER_GROUP_ID, 'Place', 'All',
                'math', constants.DEFAULT_LANGUAGE_CODE
            )
        )
        # No stories or subtopics are returned as the topics were not added
        # to the classroom.
        story_summary_dicts = matching_syllabus['story_summary_dicts']
        self.assertEqual(len(story_summary_dicts), 0)

        subtopic_summary_dicts = matching_syllabus['subtopic_summary_dicts']
        self.assertEqual(len(subtopic_summary_dicts), 0)

    def test_get_matching_syllabus_to_add_with_language_filter(self) -> None:
        # Test 5: Language filter.
        matching_syllabus = (
            learner_group_services.get_matching_learner_group_syllabus_to_add(
                self.LEARNER_GROUP_ID, 'Place', 'All', 'All', 'pt-br'
            )
        )
        # No stories or subtopics are returned as the topics are all
        # of default language.
        story_summary_dicts = matching_syllabus['story_summary_dicts']
        self.assertEqual(len(story_summary_dicts), 0)

        subtopic_summary_dicts = matching_syllabus['subtopic_summary_dicts']
        self.assertEqual(len(subtopic_summary_dicts), 0)

    def test_add_learner_to_learner_group(self) -> None:
        # Test for invited learner.
        learner_grp = learner_group_fetchers.get_learner_group_by_id(
            self.LEARNER_GROUP_ID)
        # Ruling out the possibility of None for mypy type checking.
        assert learner_grp is not None

        learner_grps_user_model = user_models.LearnerGroupsUserModel.get(
            self.LEARNER_ID, strict=True)
        self.assertEqual(
            learner_grp.invited_learner_user_ids, [self.LEARNER_ID])
        self.assertEqual(
            learner_grp.learner_user_ids, [])
        self.assertEqual(
            learner_grps_user_model.learner_groups_user_details, [])

        learner_group_services.add_learner_to_learner_group(
            self.LEARNER_GROUP_ID, self.LEARNER_ID, True)

        learner_grp = learner_group_fetchers.get_learner_group_by_id(
            self.LEARNER_GROUP_ID)
        # Ruling out the possibility of None for mypy type checking.
        assert learner_grp is not None

        learner_grps_user_model = user_models.LearnerGroupsUserModel.get(
            self.LEARNER_ID, strict=True)

        self.assertEqual(
            learner_grp.invited_learner_user_ids, [])
        self.assertEqual(
            learner_grp.learner_user_ids, [self.LEARNER_ID])
        self.assertEqual(
            learner_grps_user_model.learner_groups_user_details,
            [
                {
                    'group_id': self.LEARNER_GROUP_ID,
                    'progress_sharing_is_turned_on': True
                }
            ]
        )

        # Test for univited learner.
        with self.assertRaisesRegex(
            Exception,
            'Learner was not invited to join the learner group.'
        ):
            learner_group_services.add_learner_to_learner_group(
                self.LEARNER_GROUP_ID, 'uninvited_learner_id', False)

    def test_remove_learner_group(self) -> None:
        # Ruling out the possibility of None for mypy type checking.
        assert self.LEARNER_GROUP_ID is not None

        self.assertIsNotNone(
            learner_group_fetchers.get_learner_group_by_id(
                self.LEARNER_GROUP_ID))

        learner_group_services.remove_learner_group(self.LEARNER_GROUP_ID)

        self.assertIsNone(
            learner_group_fetchers.get_learner_group_by_id(
                self.LEARNER_GROUP_ID))

    def test_remove_invited_learners_from_learner_group(self) -> None:
        # Ruling out the possibility of None for mypy type checking.
        assert self.LEARNER_GROUP_ID is not None

        user_model = user_models.LearnerGroupsUserModel.get(
            self.LEARNER_ID, strict=True)
        self.assertEqual(
            user_model.invited_to_learner_groups_ids,
            [self.LEARNER_GROUP_ID, self.LEARNER_GROUP_ID_2])

        learner_group_services.invite_learners_to_learner_group(
            'group_id_2', [self.LEARNER_ID])

        user_model = user_models.LearnerGroupsUserModel.get(
            self.LEARNER_ID, strict=True)
        self.assertEqual(
            user_model.invited_to_learner_groups_ids,
            [self.LEARNER_GROUP_ID, self.LEARNER_GROUP_ID_2, 'group_id_2'])

        learner_group_services.remove_invited_learners_from_learner_group(
            self.LEARNER_GROUP_ID, [self.LEARNER_ID], True)

        user_model = user_models.LearnerGroupsUserModel.get(
            self.LEARNER_ID, strict=True)
        self.assertEqual(
            user_model.invited_to_learner_groups_ids,
            [self.LEARNER_GROUP_ID_2, 'group_id_2'])

    def test_invite_learners_to_learner_group(self) -> None:
        # Ruling out the possibility of None for mypy type checking.
        assert self.LEARNER_GROUP_ID is not None

        new_learner_id = 'new_learner_id'
        user_model_1 = user_models.LearnerGroupsUserModel.get(
            self.LEARNER_ID, strict=True)
        self.assertEqual(
            user_model_1.invited_to_learner_groups_ids,
            [self.LEARNER_GROUP_ID, self.LEARNER_GROUP_ID_2])
        user_model_2 = user_models.LearnerGroupsUserModel.get(
            new_learner_id, strict=False)
        self.assertIsNone(user_model_2)

        learner_group_services.invite_learners_to_learner_group(
            'group_id_2', [self.LEARNER_ID, new_learner_id])

        user_model_1 = user_models.LearnerGroupsUserModel.get(
            self.LEARNER_ID, strict=True)
        self.assertEqual(
            user_model_1.invited_to_learner_groups_ids,
            [self.LEARNER_GROUP_ID, self.LEARNER_GROUP_ID_2, 'group_id_2'])

        user_model_2 = user_models.LearnerGroupsUserModel.get(
            new_learner_id, strict=True)
        self.assertEqual(
            user_model_2.invited_to_learner_groups_ids,
            ['group_id_2'])

    def test_can_already_invited_user_be_invited_to_learner_group(
        self
    ) -> None:
        (is_valid_invite, error_message) = (
            learner_group_services.can_user_be_invited(
                self.LEARNER_ID, 'username1', self.LEARNER_GROUP_ID))
        self.assertFalse(is_valid_invite)
        self.assertEqual(
            error_message,
            'User with username username1 has been already invited to '
            'join the group'
        )

    def test_can_user_be_invited_to_a_new_learner_group(self) -> None:
        (is_valid_invite, error_message) = (
            learner_group_services.can_user_be_invited(
                self.LEARNER_ID, 'username1', ''))
        self.assertTrue(is_valid_invite)
        self.assertEqual(error_message, '')

    def test_can_facilitator_be_invited_to_learner_group(self) -> None:
        (is_valid_invite, error_message) = (
            learner_group_services.can_user_be_invited(
                self.FACILITATOR_ID, 'facilitator_name',
                self.LEARNER_GROUP_ID))
        self.assertFalse(is_valid_invite)
        self.assertEqual(
            error_message,
            'User with username facilitator_name is already a facilitator.'
        )

    def test_can_a_learner_be_invited_to_learner_group(self) -> None:
        learner_group_services.add_learner_to_learner_group(
            self.LEARNER_GROUP_ID, self.LEARNER_ID, True)
        (is_valid_invite, error_message) = (
            learner_group_services.can_user_be_invited(
                self.LEARNER_ID, 'username1', self.LEARNER_GROUP_ID))
        self.assertFalse(is_valid_invite)
        self.assertEqual(
            error_message,
            'User with username username1 is already a learner.'
        )

    def test_can_uninvolved_user_be_invited_to_learner_group(self) -> None:
        (is_valid_invite, error_message) = (
            learner_group_services.can_user_be_invited(
                'uninvolved_user_id', 'username2', self.LEARNER_GROUP_ID))
        self.assertTrue(is_valid_invite)
        self.assertEqual(error_message, '')

    def test_remove_learners_from_learner_group(self) -> None:
        learner_group_services.add_learner_to_learner_group(
            self.LEARNER_GROUP_ID, self.LEARNER_ID, True)

        self.learner_group = learner_group_services.update_learner_group(
            self.LEARNER_GROUP_ID, self.learner_group.title,
            self.learner_group.description,
            self.learner_group.facilitator_user_ids, [],
            ['learner2', 'learner3'], self.learner_group.subtopic_page_ids,
            self.learner_group.story_ids)
        learner_group_services.add_learner_to_learner_group(
            self.LEARNER_GROUP_ID, 'learner2', True)
        learner_group_services.add_learner_to_learner_group(
            self.LEARNER_GROUP_ID, 'learner3', False)

        learner_group = learner_group_fetchers.get_learner_group_by_id(
            self.LEARNER_GROUP_ID)
        # Ruling out the possibility of None for mypy type checking.
        assert learner_group is not None
        self.assertEqual(
            learner_group.learner_user_ids,
            ['learner2', 'learner3'])
        learner_group_services.remove_learners_from_learner_group(
            self.LEARNER_GROUP_ID, ['learner2', 'learner3'], True)

        learner_group = learner_group_fetchers.get_learner_group_by_id(
            self.LEARNER_GROUP_ID)
        # Ruling out the possibility of None for mypy type checking.
        assert learner_group is not None
        self.assertEqual(learner_group.learner_user_ids, [])

    def test_remove_subtopic_page_reference_from_learner_groups(self) -> None:
        self.learner_group = learner_group_services.update_learner_group(
            self.LEARNER_GROUP_ID, self.learner_group.title,
            self.learner_group.description,
            self.learner_group.facilitator_user_ids, [],
            [self.LEARNER_ID], ['topic1:2', 'topic1:1'],
            self.learner_group.story_ids)

        (
            learner_group_services
                .remove_subtopic_page_reference_from_learner_groups(
                    'topic1', 2
                )
        )

        learner_group = learner_group_fetchers.get_learner_group_by_id(
            self.LEARNER_GROUP_ID)
        # Ruling out the possibility of None for mypy type checking.
        assert learner_group is not None
        self.assertEqual(learner_group.subtopic_page_ids, ['topic1:1'])

    def test_remove_story_reference_from_learner_groups(self) -> None:
        self.learner_group = learner_group_services.update_learner_group(
            self.LEARNER_GROUP_ID, self.learner_group.title,
            self.learner_group.description,
            self.learner_group.facilitator_user_ids, [],
            [self.LEARNER_ID], ['topic1:2', 'topic1:1'],
            ['story_id1', 'story_id2'])

        learner_group_services.remove_story_reference_from_learner_groups(
            'story_id1')

        learner_group = learner_group_fetchers.get_learner_group_by_id(
            self.LEARNER_GROUP_ID)
        # Ruling out the possibility of None for mypy type checking.
        assert learner_group is not None
        self.assertEqual(learner_group.story_ids, ['story_id2'])

    def test_update_progress_sharing_permission(self) -> None:
        learner_group_services.add_learner_to_learner_group(
            self.LEARNER_GROUP_ID, self.LEARNER_ID, True)
        learner_group_services.add_learner_to_learner_group(
            self.LEARNER_GROUP_ID_2, self.LEARNER_ID, False)

        self.assertEqual(
            learner_group_fetchers.can_multi_learners_share_progress(
                [self.LEARNER_ID], self.LEARNER_GROUP_ID
            ), [True]
        )

        learner_group_services.update_progress_sharing_permission(
            self.LEARNER_ID, self.LEARNER_GROUP_ID, False)

        self.assertEqual(
            learner_group_fetchers.can_multi_learners_share_progress(
                [self.LEARNER_ID], self.LEARNER_GROUP_ID
            ), [False]
        )
