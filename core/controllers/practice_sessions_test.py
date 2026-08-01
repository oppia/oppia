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

"""Tests for the practice sessions page."""

from __future__ import annotations

import unittest.mock

from core import feconf
from core.constants import constants
from core.domain import (
    story_domain,
    story_fetchers,
    story_services,
    topic_domain,
    topic_services,
    user_services,
)
from core.tests import test_utils

from typing import List, cast


class BasePracticeSessionsControllerTests(test_utils.GenericTestBase):

    def setUp(self) -> None:
        """Completes the sign-up process for the various users."""
        super().setUp()
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])
        self.admin = user_services.get_user_actions_info(self.admin_id)

        self.topic_id = 'topic'
        self.topic_id_1 = 'topic1'
        self.skill_id1 = 'skill_id_1'
        self.skill_id2 = 'skill_id_2'

        self.save_new_skill(
            self.skill_id1, self.admin_id, description='Skill 1'
        )
        self.save_new_skill(
            self.skill_id2, self.admin_id, description='Skill 2'
        )

        self.topic = topic_domain.Topic.create_default_topic(
            self.topic_id,
            'public_topic_name',
            'public-topic-name',
            'description',
            'fragm',
        )
        self.topic.subtopics.append(
            topic_domain.Subtopic(
                1,
                'subtopic_name',
                [self.skill_id1],
                'image.svg',
                constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0],
                21131,
                'subtopic-name-one',
            )
        )
        self.topic.subtopics.append(
            topic_domain.Subtopic(
                2,
                'subtopic_name_2',
                [self.skill_id2],
                'image.svg',
                constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0],
                21131,
                'subtopic-name-two',
            )
        )
        self.topic.next_subtopic_id = 3
        self.topic.skill_ids_for_diagnostic_test = [self.skill_id1]
        self.topic.thumbnail_filename = 'Topic.svg'
        self.topic.thumbnail_bg_color = constants.ALLOWED_THUMBNAIL_BG_COLORS[
            'topic'
        ][0]
        topic_services.save_new_topic(self.admin_id, self.topic)

        self.topic = topic_domain.Topic.create_default_topic(
            self.topic_id_1,
            'private_topic_name',
            'private-topic-name',
            'description',
            'fragm',
        )
        self.topic.thumbnail_filename = 'Topic.svg'
        self.topic.thumbnail_bg_color = constants.ALLOWED_THUMBNAIL_BG_COLORS[
            'topic'
        ][0]
        topic_services.save_new_topic(self.admin_id, self.topic)

        topic_services.publish_topic(self.topic_id, self.admin_id)


class PracticeSessionsPageDataHandlerTests(BasePracticeSessionsControllerTests):

    def test_get_returns_all_subtopic_skills_when_no_params(self) -> None:
        json_response = self.get_json(
            '%s/staging/%s'
            % (feconf.PRACTICE_SESSION_DATA_URL_PREFIX, 'public-topic-name'),
        )
        self.assertEqual(json_response['topic_name'], 'public_topic_name')
        self.assertEqual(
            json_response['skill_ids_to_descriptions_map'],
            {'skill_id_1': 'Skill 1', 'skill_id_2': 'Skill 2'},
        )

    def test_get_fails_when_skill_ids_dont_exist(self) -> None:
        topic = topic_domain.Topic.create_default_topic(
            'topic_id_3',
            'topic_without_skills',
            'noskills',
            'description',
            'fragm',
        )
        topic.thumbnail_filename = 'Topic.svg'
        topic.thumbnail_bg_color = constants.ALLOWED_THUMBNAIL_BG_COLORS[
            'topic'
        ][0]
        topic.subtopics.append(
            topic_domain.Subtopic(
                1,
                'subtopic_name',
                ['non_existent_skill'],
                'image.svg',
                constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0],
                21131,
                'subtopic-name-three',
            )
        )
        topic.next_subtopic_id = 2
        topic.skill_ids_for_diagnostic_test = ['non_existent_skill']
        topic_services.save_new_topic(self.admin_id, topic)
        topic_services.publish_topic('topic_id_3', self.admin_id)
        self.get_json(
            '%s/staging/%s?selected_subtopic_ids=[1]'
            % (feconf.PRACTICE_SESSION_DATA_URL_PREFIX, 'noskills'),
            expected_status_int=404,
        )

    def test_any_user_can_access_practice_sessions_data(self) -> None:
        # Adding invalid subtopic IDs as well, which should get ignored.
        json_response = self.get_json(
            '%s/staging/%s?selected_subtopic_ids=[1,2,3,4]'
            % (feconf.PRACTICE_SESSION_DATA_URL_PREFIX, 'public-topic-name')
        )
        self.assertEqual(json_response['topic_name'], 'public_topic_name')
        self.assertEqual(len(json_response['skill_ids_to_descriptions_map']), 2)
        self.assertEqual(
            json_response['skill_ids_to_descriptions_map']['skill_id_1'],
            'Skill 1',
        )
        self.assertEqual(
            json_response['skill_ids_to_descriptions_map']['skill_id_2'],
            'Skill 2',
        )

    def test_get_ignores_unselected_existing_subtopic_ids(self) -> None:
        json_response = self.get_json(
            '%s/staging/%s?selected_subtopic_ids=[1]'
            % (feconf.PRACTICE_SESSION_DATA_URL_PREFIX, 'public-topic-name')
        )

        self.assertEqual(json_response['topic_name'], 'public_topic_name')
        self.assertEqual(len(json_response['skill_ids_to_descriptions_map']), 1)
        self.assertEqual(
            json_response['skill_ids_to_descriptions_map']['skill_id_1'],
            'Skill 1',
        )

    def test_no_user_can_access_unpublished_topic_practice_session_data(
        self,
    ) -> None:
        self.get_json(
            '%s/staging/%s?selected_subtopic_ids=["1","2"]'
            % (feconf.PRACTICE_SESSION_DATA_URL_PREFIX, 'private-topic-name'),
            expected_status_int=404,
        )

    def test_get_fails_when_topic_doesnt_exist(self) -> None:
        self.get_json(
            '%s/staging/%s?selected_subtopic_ids=[1,2]'
            % (feconf.PRACTICE_SESSION_DATA_URL_PREFIX, 'invalid'),
            expected_status_int=404,
        )

    def test_get_fails_when_json_loads_fails(self) -> None:
        response = self.get_json(
            '%s/staging/%s?selected_subtopic_ids=1,2'
            % (feconf.PRACTICE_SESSION_DATA_URL_PREFIX, 'invalid'),
            expected_status_int=400,
        )
        error_msg = (
            'At \'http://localhost/practice_session/data/staging/invalid?'
            'selected_subtopic_ids=1,2\' these errors are happening:\n'
            'Schema validation for \'selected_subtopic_ids\' failed: '
            'Extra data: line 1 column 2 (char 1)'
        )
        self.assertEqual(response['error'], error_msg)

    def test_get_succeeds_with_node_id(self) -> None:
        story_id = 'story_id'
        exp_id = 'exp_1'
        self.save_new_valid_exploration(exp_id, self.admin_id)
        self.publish_exploration(self.admin_id, exp_id)
        self.save_new_story(story_id, self.admin_id, self.topic_id)
        topic_services.add_canonical_story(
            self.admin_id, self.topic_id, story_id
        )
        story_services.update_story(
            self.admin_id,
            story_id,
            [
                story_domain.StoryChange(
                    {
                        'cmd': story_domain.CMD_ADD_STORY_NODE,
                        'node_id': 'node_1',
                        'title': 'Chapter 1',
                    }
                ),
                story_domain.StoryChange(
                    {
                        'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
                        'property_name': (
                            story_domain.STORY_NODE_PROPERTY_EXPLORATION_ID
                        ),
                        'node_id': 'node_1',
                        'old_value': None,
                        'new_value': exp_id,
                    }
                ),
            ],
            'Added node.',
        )
        topic_services.publish_story(self.topic_id, story_id, self.admin_id)
        story_services.update_story(
            self.admin_id,
            story_id,
            [
                story_domain.StoryChange(
                    {
                        'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
                        'property_name': (
                            story_domain.STORY_NODE_PROPERTY_ACQUIRED_SKILL_IDS
                        ),
                        'node_id': 'node_1',
                        # Here we use cast because the empty list's type cannot
                        # be inferred, and List[str] is needed to match
                        # AcceptableChangeDictTypes.
                        'old_value': cast(List[str], []),
                        'new_value': [self.skill_id1, self.skill_id2],
                    }
                ),
            ],
            'Added acquired skill IDs.',
        )

        json_response = self.get_json(
            '%s/staging/%s/1'
            % (feconf.PRACTICE_SESSION_DATA_URL_PREFIX, 'public-topic-name'),
        )
        self.assertEqual(json_response['topic_name'], 'public_topic_name')
        self.assertEqual(len(json_response['skill_ids_to_descriptions_map']), 2)
        self.assertEqual(
            json_response['skill_ids_to_descriptions_map'][self.skill_id1],
            'Skill 1',
        )
        self.assertEqual(
            json_response['skill_ids_to_descriptions_map'][self.skill_id2],
            'Skill 2',
        )

    def test_get_returns_empty_skill_ids_for_nonexistent_node_id(
        self,
    ) -> None:
        story_id = 'story_id'
        deleted_story_id = 'del_story'
        exp_id = 'exp_1'
        exp_id_2 = 'exp_2'
        self.save_new_valid_exploration(exp_id, self.admin_id)
        self.publish_exploration(self.admin_id, exp_id)
        self.save_new_story(story_id, self.admin_id, self.topic_id)
        topic_services.add_canonical_story(
            self.admin_id, self.topic_id, story_id
        )
        story_services.update_story(
            self.admin_id,
            story_id,
            [
                story_domain.StoryChange(
                    {
                        'cmd': story_domain.CMD_ADD_STORY_NODE,
                        'node_id': 'node_1',
                        'title': 'Chapter 1',
                    }
                ),
                story_domain.StoryChange(
                    {
                        'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
                        'property_name': (
                            story_domain.STORY_NODE_PROPERTY_EXPLORATION_ID
                        ),
                        'node_id': 'node_1',
                        'old_value': None,
                        'new_value': exp_id,
                    }
                ),
            ],
            'Added node.',
        )
        topic_services.publish_story(self.topic_id, story_id, self.admin_id)

        self.save_new_valid_exploration(exp_id_2, self.admin_id)
        self.publish_exploration(self.admin_id, exp_id_2)
        self.save_new_story(deleted_story_id, self.admin_id, self.topic_id)
        topic_services.add_canonical_story(
            self.admin_id, self.topic_id, deleted_story_id
        )
        topic_services.publish_story(
            self.topic_id, deleted_story_id, self.admin_id
        )
        story_services.delete_story(self.admin_id, deleted_story_id)

        json_response = self.get_json(
            '%s/staging/%s/nonexistent_node'
            % (
                feconf.PRACTICE_SESSION_DATA_URL_PREFIX,
                'public-topic-name',
            ),
        )
        self.assertEqual(json_response['topic_name'], 'public_topic_name')
        self.assertEqual(len(json_response['skill_ids_to_descriptions_map']), 0)

    def test_get_returns_empty_skill_ids_for_nonexistent_arc_id(
        self,
    ) -> None:
        story_id = 'story_id_2'
        deleted_story_id = 'del_story'
        exp_id = 'exp_2'
        exp_id_2 = 'exp_3'
        self.save_new_valid_exploration(exp_id, self.admin_id)
        self.publish_exploration(self.admin_id, exp_id)
        self.save_new_story(story_id, self.admin_id, self.topic_id)
        topic_services.add_canonical_story(
            self.admin_id, self.topic_id, story_id
        )
        story_services.update_story(
            self.admin_id,
            story_id,
            [
                story_domain.StoryChange(
                    {
                        'cmd': story_domain.CMD_ADD_STORY_NODE,
                        'node_id': 'node_1',
                        'title': 'Chapter 1',
                    }
                ),
                story_domain.StoryChange(
                    {
                        'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
                        'property_name': (
                            story_domain.STORY_NODE_PROPERTY_EXPLORATION_ID
                        ),
                        'node_id': 'node_1',
                        'old_value': None,
                        'new_value': exp_id,
                    }
                ),
            ],
            'Added node.',
        )
        topic_services.publish_story(self.topic_id, story_id, self.admin_id)
        story_services.update_story(
            self.admin_id,
            story_id,
            [
                story_domain.StoryChange(
                    {
                        'cmd': story_domain.CMD_CREATE_ARC,
                        'arc_id': 'arc_1',
                        'title': 'Arc 1',
                        'description': 'First arc',
                        'node_ids': ['node_1'],
                    }
                ),
            ],
            'Added arc.',
        )

        self.save_new_valid_exploration(exp_id_2, self.admin_id)
        self.publish_exploration(self.admin_id, exp_id_2)
        self.save_new_story(deleted_story_id, self.admin_id, self.topic_id)
        topic_services.add_canonical_story(
            self.admin_id, self.topic_id, deleted_story_id
        )
        topic_services.publish_story(
            self.topic_id, deleted_story_id, self.admin_id
        )
        story_services.delete_story(self.admin_id, deleted_story_id)

        json_response = self.get_json(
            '%s/staging/%s/arc/nonexistent_arc'
            % (
                feconf.PRACTICE_SESSION_DATA_URL_PREFIX,
                'public-topic-name',
            ),
        )
        self.assertEqual(json_response['topic_name'], 'public_topic_name')
        self.assertEqual(len(json_response['skill_ids_to_descriptions_map']), 0)

    def test_get_succeeds_with_arc_id(self) -> None:
        story_id = 'story_id_2'
        exp_id = 'exp_2'
        self.save_new_valid_exploration(exp_id, self.admin_id)
        self.publish_exploration(self.admin_id, exp_id)
        self.save_new_story(story_id, self.admin_id, self.topic_id)
        topic_services.add_canonical_story(
            self.admin_id, self.topic_id, story_id
        )
        story_services.update_story(
            self.admin_id,
            story_id,
            [
                story_domain.StoryChange(
                    {
                        'cmd': story_domain.CMD_ADD_STORY_NODE,
                        'node_id': 'node_1',
                        'title': 'Chapter 1',
                    }
                ),
                story_domain.StoryChange(
                    {
                        'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
                        'property_name': (
                            story_domain.STORY_NODE_PROPERTY_EXPLORATION_ID
                        ),
                        'node_id': 'node_1',
                        'old_value': None,
                        'new_value': exp_id,
                    }
                ),
            ],
            'Added node.',
        )
        topic_services.publish_story(self.topic_id, story_id, self.admin_id)
        story_services.update_story(
            self.admin_id,
            story_id,
            [
                story_domain.StoryChange(
                    {
                        'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
                        'property_name': (
                            story_domain.STORY_NODE_PROPERTY_ACQUIRED_SKILL_IDS
                        ),
                        'node_id': 'node_1',
                        # Here we use cast because the empty list's type cannot
                        # be inferred, and List[str] is needed to match
                        # AcceptableChangeDictTypes.
                        'old_value': cast(List[str], []),
                        'new_value': [self.skill_id1, self.skill_id2],
                    }
                ),
                story_domain.StoryChange(
                    {
                        'cmd': story_domain.CMD_CREATE_ARC,
                        'arc_id': 'arc_1',
                        'title': 'Arc 1',
                        'description': 'First arc',
                        'node_ids': ['node_1'],
                    }
                ),
            ],
            'Added acquired skill IDs and arc.',
        )

        json_response = self.get_json(
            '%s/staging/%s/arc/1'
            % (feconf.PRACTICE_SESSION_DATA_URL_PREFIX, 'public-topic-name'),
        )
        self.assertEqual(json_response['topic_name'], 'public_topic_name')
        self.assertEqual(len(json_response['skill_ids_to_descriptions_map']), 2)
        self.assertEqual(
            json_response['skill_ids_to_descriptions_map'][self.skill_id1],
            'Skill 1',
        )
        self.assertEqual(
            json_response['skill_ids_to_descriptions_map'][self.skill_id2],
            'Skill 2',
        )

    def test_get_succeeds_with_raw_arc_id(self) -> None:
        story_id = 'story_id_2'
        exp_id = 'exp_2'
        self.save_new_valid_exploration(exp_id, self.admin_id)
        self.publish_exploration(self.admin_id, exp_id)
        self.save_new_story(story_id, self.admin_id, self.topic_id)
        topic_services.add_canonical_story(
            self.admin_id, self.topic_id, story_id
        )
        story_services.update_story(
            self.admin_id,
            story_id,
            [
                story_domain.StoryChange(
                    {
                        'cmd': story_domain.CMD_ADD_STORY_NODE,
                        'node_id': 'node_1',
                        'title': 'Chapter 1',
                    }
                ),
                story_domain.StoryChange(
                    {
                        'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
                        'property_name': (
                            story_domain.STORY_NODE_PROPERTY_EXPLORATION_ID
                        ),
                        'node_id': 'node_1',
                        'old_value': None,
                        'new_value': exp_id,
                    }
                ),
            ],
            'Added node.',
        )
        topic_services.publish_story(self.topic_id, story_id, self.admin_id)
        story_services.update_story(
            self.admin_id,
            story_id,
            [
                story_domain.StoryChange(
                    {
                        'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
                        'property_name': (
                            story_domain.STORY_NODE_PROPERTY_ACQUIRED_SKILL_IDS
                        ),
                        'node_id': 'node_1',
                        # Here we use cast because the empty list's type cannot
                        # be inferred, and List[str] is needed to match
                        # AcceptableChangeDictTypes.
                        'old_value': cast(List[str], []),
                        'new_value': [self.skill_id1, self.skill_id2],
                    }
                ),
                story_domain.StoryChange(
                    {
                        'cmd': story_domain.CMD_CREATE_ARC,
                        'arc_id': 'default_arc',
                        'title': 'Default Arc',
                        'description': 'Default arc',
                        'node_ids': ['node_1'],
                    }
                ),
            ],
            'Added acquired skill IDs and arc.',
        )

        json_response = self.get_json(
            '%s/staging/%s/arc/default_arc'
            % (feconf.PRACTICE_SESSION_DATA_URL_PREFIX, 'public-topic-name'),
        )
        self.assertEqual(json_response['topic_name'], 'public_topic_name')
        self.assertEqual(len(json_response['skill_ids_to_descriptions_map']), 2)
        self.assertEqual(
            json_response['skill_ids_to_descriptions_map'][self.skill_id1],
            'Skill 1',
        )
        self.assertEqual(
            json_response['skill_ids_to_descriptions_map'][self.skill_id2],
            'Skill 2',
        )

    def test_get_succeeds_with_arc_position(self) -> None:
        story_id = 'story_id_2'
        exp_id = 'exp_2'
        self.save_new_valid_exploration(exp_id, self.admin_id)
        self.publish_exploration(self.admin_id, exp_id)
        self.save_new_story(story_id, self.admin_id, self.topic_id)
        topic_services.add_canonical_story(
            self.admin_id, self.topic_id, story_id
        )
        story_services.update_story(
            self.admin_id,
            story_id,
            [
                story_domain.StoryChange(
                    {
                        'cmd': story_domain.CMD_ADD_STORY_NODE,
                        'node_id': 'node_1',
                        'title': 'Chapter 1',
                    }
                ),
                story_domain.StoryChange(
                    {
                        'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
                        'property_name': (
                            story_domain.STORY_NODE_PROPERTY_EXPLORATION_ID
                        ),
                        'node_id': 'node_1',
                        'old_value': None,
                        'new_value': exp_id,
                    }
                ),
            ],
            'Added node.',
        )
        topic_services.publish_story(self.topic_id, story_id, self.admin_id)
        story_services.update_story(
            self.admin_id,
            story_id,
            [
                story_domain.StoryChange(
                    {
                        'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
                        'property_name': (
                            story_domain.STORY_NODE_PROPERTY_ACQUIRED_SKILL_IDS
                        ),
                        'node_id': 'node_1',
                        # Here we use cast because the empty list's type cannot
                        # be inferred, and List[str] is needed to match
                        # AcceptableChangeDictTypes.
                        'old_value': cast(List[str], []),
                        'new_value': [self.skill_id1, self.skill_id2],
                    }
                ),
                story_domain.StoryChange(
                    {
                        'cmd': story_domain.CMD_CREATE_ARC,
                        'arc_id': 'default_arc',
                        'title': 'Default Arc',
                        'description': 'Default arc',
                        'node_ids': ['node_1'],
                    }
                ),
            ],
            'Added acquired skill IDs and arc.',
        )

        json_response = self.get_json(
            '%s/staging/%s/arc/1'
            % (feconf.PRACTICE_SESSION_DATA_URL_PREFIX, 'public-topic-name'),
        )
        self.assertEqual(json_response['topic_name'], 'public_topic_name')
        self.assertEqual(len(json_response['skill_ids_to_descriptions_map']), 2)
        self.assertEqual(
            json_response['skill_ids_to_descriptions_map'][self.skill_id1],
            'Skill 1',
        )
        self.assertEqual(
            json_response['skill_ids_to_descriptions_map'][self.skill_id2],
            'Skill 2',
        )

    def test_get_succeeds_with_second_arc_position(self) -> None:
        story_id = 'story_id_2'
        exp_id = 'exp_2'
        exp_id_2 = 'exp_2_b'
        self.save_new_valid_exploration(exp_id, self.admin_id)
        self.publish_exploration(self.admin_id, exp_id)
        self.save_new_valid_exploration(exp_id_2, self.admin_id)
        self.publish_exploration(self.admin_id, exp_id_2)
        self.save_new_story(story_id, self.admin_id, self.topic_id)
        topic_services.add_canonical_story(
            self.admin_id, self.topic_id, story_id
        )
        story_services.update_story(
            self.admin_id,
            story_id,
            [
                story_domain.StoryChange(
                    {
                        'cmd': story_domain.CMD_ADD_STORY_NODE,
                        'node_id': 'node_1',
                        'title': 'Chapter 1',
                    }
                ),
                story_domain.StoryChange(
                    {
                        'cmd': story_domain.CMD_ADD_STORY_NODE,
                        'node_id': 'node_2',
                        'title': 'Chapter 2',
                    }
                ),
                story_domain.StoryChange(
                    {
                        'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
                        'property_name': (
                            story_domain.STORY_NODE_PROPERTY_EXPLORATION_ID
                        ),
                        'node_id': 'node_1',
                        'old_value': None,
                        'new_value': exp_id,
                    }
                ),
                story_domain.StoryChange(
                    {
                        'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
                        'property_name': (
                            story_domain.STORY_NODE_PROPERTY_EXPLORATION_ID
                        ),
                        'node_id': 'node_2',
                        'old_value': None,
                        'new_value': exp_id_2,
                    }
                ),
            ],
            'Added nodes.',
        )
        topic_services.publish_story(self.topic_id, story_id, self.admin_id)
        story_services.update_story(
            self.admin_id,
            story_id,
            [
                story_domain.StoryChange(
                    {
                        'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
                        'property_name': (
                            story_domain.STORY_NODE_PROPERTY_ACQUIRED_SKILL_IDS
                        ),
                        'node_id': 'node_1',
                        # Here we use cast because the empty list's type cannot
                        # be inferred, and List[str] is needed to match
                        # AcceptableChangeDictTypes.
                        'old_value': cast(List[str], []),
                        'new_value': [self.skill_id1],
                    }
                ),
                story_domain.StoryChange(
                    {
                        'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
                        'property_name': (
                            story_domain.STORY_NODE_PROPERTY_ACQUIRED_SKILL_IDS
                        ),
                        'node_id': 'node_2',
                        # Here we use cast because the empty list's type cannot
                        # be inferred, and List[str] is needed to match
                        # AcceptableChangeDictTypes.
                        'old_value': cast(List[str], []),
                        'new_value': [self.skill_id2],
                    }
                ),
                story_domain.StoryChange(
                    {
                        'cmd': story_domain.CMD_CREATE_ARC,
                        'arc_id': 'default_arc',
                        'title': 'Default Arc',
                        'description': 'Default arc',
                        'node_ids': ['node_1'],
                    }
                ),
                story_domain.StoryChange(
                    {
                        'cmd': story_domain.CMD_CREATE_ARC,
                        'arc_id': 'arc_2',
                        'title': 'Arc 2',
                        'description': 'Second arc',
                        'node_ids': ['node_2'],
                    }
                ),
            ],
            'Added acquired skill IDs and arcs.',
        )

        json_response = self.get_json(
            '%s/staging/%s/arc/2'
            % (feconf.PRACTICE_SESSION_DATA_URL_PREFIX, 'public-topic-name'),
        )
        self.assertEqual(json_response['topic_name'], 'public_topic_name')
        self.assertEqual(len(json_response['skill_ids_to_descriptions_map']), 1)
        self.assertEqual(
            json_response['skill_ids_to_descriptions_map'][self.skill_id2],
            'Skill 2',
        )

    def test_get_returns_empty_for_zero_node_id(self) -> None:
        json_response = self.get_json(
            '%s/staging/%s/0'
            % (feconf.PRACTICE_SESSION_DATA_URL_PREFIX, 'public-topic-name'),
        )
        self.assertEqual(json_response['topic_name'], 'public_topic_name')
        self.assertEqual(len(json_response['skill_ids_to_descriptions_map']), 0)

    def test_get_returns_empty_for_large_node_id(self) -> None:
        json_response = self.get_json(
            '%s/staging/%s/999'
            % (feconf.PRACTICE_SESSION_DATA_URL_PREFIX, 'public-topic-name'),
        )
        self.assertEqual(json_response['topic_name'], 'public_topic_name')
        self.assertEqual(len(json_response['skill_ids_to_descriptions_map']), 0)

    def test_get_returns_empty_for_invalid_arc_number(self) -> None:
        json_response = self.get_json(
            '%s/staging/%s/arc/abc'
            % (feconf.PRACTICE_SESSION_DATA_URL_PREFIX, 'public-topic-name'),
        )
        self.assertEqual(json_response['topic_name'], 'public_topic_name')
        self.assertEqual(len(json_response['skill_ids_to_descriptions_map']), 0)

    def test_get_returns_empty_for_zero_arc_index(self) -> None:
        json_response = self.get_json(
            '%s/staging/%s/arc/0'
            % (feconf.PRACTICE_SESSION_DATA_URL_PREFIX, 'public-topic-name'),
        )
        self.assertEqual(json_response['topic_name'], 'public_topic_name')
        self.assertEqual(len(json_response['skill_ids_to_descriptions_map']), 0)

    def test_get_returns_empty_for_large_arc_index(self) -> None:
        json_response = self.get_json(
            '%s/staging/%s/arc/999'
            % (feconf.PRACTICE_SESSION_DATA_URL_PREFIX, 'public-topic-name'),
        )
        self.assertEqual(json_response['topic_name'], 'public_topic_name')
        self.assertEqual(len(json_response['skill_ids_to_descriptions_map']), 0)

    def test_get_node_skills_with_deleted_story_in_topic(self) -> None:
        story_id = 'story_id'
        deleted_story_id = 'del_story'
        exp_id = 'exp_1'
        exp_id_2 = 'exp_2'
        self.save_new_valid_exploration(exp_id, self.admin_id)
        self.publish_exploration(self.admin_id, exp_id)
        self.save_new_story(story_id, self.admin_id, self.topic_id)
        topic_services.add_canonical_story(
            self.admin_id, self.topic_id, story_id
        )
        story_services.update_story(
            self.admin_id,
            story_id,
            [
                story_domain.StoryChange(
                    {
                        'cmd': story_domain.CMD_ADD_STORY_NODE,
                        'node_id': 'node_1',
                        'title': 'Chapter 1',
                    }
                ),
                story_domain.StoryChange(
                    {
                        'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
                        'property_name': (
                            story_domain.STORY_NODE_PROPERTY_EXPLORATION_ID
                        ),
                        'node_id': 'node_1',
                        'old_value': None,
                        'new_value': exp_id,
                    }
                ),
            ],
            'Added node.',
        )
        topic_services.publish_story(self.topic_id, story_id, self.admin_id)
        story_services.update_story(
            self.admin_id,
            story_id,
            [
                story_domain.StoryChange(
                    {
                        'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
                        'property_name': (
                            story_domain.STORY_NODE_PROPERTY_ACQUIRED_SKILL_IDS
                        ),
                        'node_id': 'node_1',
                        # Here we use cast because the empty list's type
                        # cannot be inferred, and List[str] is needed to
                        # match AcceptableChangeDictTypes.
                        'old_value': cast(List[str], []),
                        'new_value': [self.skill_id1],
                    }
                ),
            ],
            'Added acquired skill IDs.',
        )

        self.save_new_valid_exploration(exp_id_2, self.admin_id)
        self.publish_exploration(self.admin_id, exp_id_2)
        self.save_new_story(deleted_story_id, self.admin_id, self.topic_id)
        topic_services.add_canonical_story(
            self.admin_id, self.topic_id, deleted_story_id
        )
        topic_services.publish_story(
            self.topic_id, deleted_story_id, self.admin_id
        )
        story_services.delete_story(self.admin_id, deleted_story_id)

        json_response = self.get_json(
            '%s/staging/%s/1'
            % (feconf.PRACTICE_SESSION_DATA_URL_PREFIX, 'public-topic-name'),
        )
        self.assertEqual(json_response['topic_name'], 'public_topic_name')
        self.assertEqual(len(json_response['skill_ids_to_descriptions_map']), 1)

    def test_get_arc_skills_with_deleted_story_in_topic(self) -> None:
        story_id = 'story_id'
        deleted_story_id = 'del_story'
        exp_id = 'exp_1'
        exp_id_2 = 'exp_2'
        self.save_new_valid_exploration(exp_id, self.admin_id)
        self.publish_exploration(self.admin_id, exp_id)
        self.save_new_story(story_id, self.admin_id, self.topic_id)
        topic_services.add_canonical_story(
            self.admin_id, self.topic_id, story_id
        )
        story_services.update_story(
            self.admin_id,
            story_id,
            [
                story_domain.StoryChange(
                    {
                        'cmd': story_domain.CMD_ADD_STORY_NODE,
                        'node_id': 'node_1',
                        'title': 'Chapter 1',
                    }
                ),
                story_domain.StoryChange(
                    {
                        'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
                        'property_name': (
                            story_domain.STORY_NODE_PROPERTY_EXPLORATION_ID
                        ),
                        'node_id': 'node_1',
                        'old_value': None,
                        'new_value': exp_id,
                    }
                ),
            ],
            'Added node.',
        )
        topic_services.publish_story(self.topic_id, story_id, self.admin_id)
        story_services.update_story(
            self.admin_id,
            story_id,
            [
                story_domain.StoryChange(
                    {
                        'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
                        'property_name': (
                            story_domain.STORY_NODE_PROPERTY_ACQUIRED_SKILL_IDS
                        ),
                        'node_id': 'node_1',
                        # Here we use cast because the empty list's type
                        # cannot be inferred, and List[str] is needed to
                        # match AcceptableChangeDictTypes.
                        'old_value': cast(List[str], []),
                        'new_value': [self.skill_id1],
                    }
                ),
                story_domain.StoryChange(
                    {
                        'cmd': story_domain.CMD_CREATE_ARC,
                        'arc_id': 'arc_1',
                        'title': 'Arc 1',
                        'description': 'First arc',
                        'node_ids': ['node_1'],
                    }
                ),
            ],
            'Added acquired skill IDs and arc.',
        )

        self.save_new_valid_exploration(exp_id_2, self.admin_id)
        self.publish_exploration(self.admin_id, exp_id_2)
        self.save_new_story(deleted_story_id, self.admin_id, self.topic_id)
        topic_services.add_canonical_story(
            self.admin_id, self.topic_id, deleted_story_id
        )
        topic_services.publish_story(
            self.topic_id, deleted_story_id, self.admin_id
        )
        story_services.delete_story(self.admin_id, deleted_story_id)

        json_response = self.get_json(
            '%s/staging/%s/arc/1'
            % (feconf.PRACTICE_SESSION_DATA_URL_PREFIX, 'public-topic-name'),
        )
        self.assertEqual(json_response['topic_name'], 'public_topic_name')
        self.assertEqual(len(json_response['skill_ids_to_descriptions_map']), 1)

    def test_get_arc_skills_no_matching_arc_in_stories(self) -> None:
        story_id = 'story_id'
        deleted_story_id = 'del_story'
        exp_id = 'exp_1'
        exp_id_2 = 'exp_2'
        self.save_new_valid_exploration(exp_id, self.admin_id)
        self.publish_exploration(self.admin_id, exp_id)
        self.save_new_story(story_id, self.admin_id, self.topic_id)
        topic_services.add_canonical_story(
            self.admin_id, self.topic_id, story_id
        )
        story_services.update_story(
            self.admin_id,
            story_id,
            [
                story_domain.StoryChange(
                    {
                        'cmd': story_domain.CMD_ADD_STORY_NODE,
                        'node_id': 'node_1',
                        'title': 'Chapter 1',
                    }
                ),
                story_domain.StoryChange(
                    {
                        'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
                        'property_name': (
                            story_domain.STORY_NODE_PROPERTY_EXPLORATION_ID
                        ),
                        'node_id': 'node_1',
                        'old_value': None,
                        'new_value': exp_id,
                    }
                ),
            ],
            'Added node.',
        )
        topic_services.publish_story(self.topic_id, story_id, self.admin_id)

        self.save_new_valid_exploration(exp_id_2, self.admin_id)
        self.publish_exploration(self.admin_id, exp_id_2)
        self.save_new_story(deleted_story_id, self.admin_id, self.topic_id)
        topic_services.add_canonical_story(
            self.admin_id, self.topic_id, deleted_story_id
        )
        story_services.update_story(
            self.admin_id,
            deleted_story_id,
            [
                story_domain.StoryChange(
                    {
                        'cmd': story_domain.CMD_ADD_STORY_NODE,
                        'node_id': 'node_1',
                        'title': 'Chapter 1',
                    }
                ),
                story_domain.StoryChange(
                    {
                        'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
                        'property_name': (
                            story_domain.STORY_NODE_PROPERTY_EXPLORATION_ID
                        ),
                        'node_id': 'node_1',
                        'old_value': None,
                        'new_value': exp_id_2,
                    }
                ),
                story_domain.StoryChange(
                    {
                        'cmd': story_domain.CMD_CREATE_ARC,
                        'arc_id': 'arc_1',
                        'title': 'Arc 1',
                        'description': 'First arc',
                        'node_ids': ['node_1'],
                    }
                ),
            ],
            'Added arc.',
        )
        topic_services.publish_story(
            self.topic_id, deleted_story_id, self.admin_id
        )
        story_services.delete_story(self.admin_id, deleted_story_id)

        json_response = self.get_json(
            '%s/staging/%s/arc/1'
            % (feconf.PRACTICE_SESSION_DATA_URL_PREFIX, 'public-topic-name'),
        )
        self.assertEqual(json_response['topic_name'], 'public_topic_name')
        self.assertEqual(len(json_response['skill_ids_to_descriptions_map']), 0)

    def test_get_arc_skills_deleted_story_before_valid_story(self) -> None:
        story_id = 'story_id'
        deleted_story_id = 'del_story'
        exp_id = 'exp_1'
        exp_id_2 = 'exp_2'
        self.save_new_valid_exploration(exp_id, self.admin_id)
        self.publish_exploration(self.admin_id, exp_id)
        self.save_new_story(deleted_story_id, self.admin_id, self.topic_id)
        topic_services.add_canonical_story(
            self.admin_id, self.topic_id, deleted_story_id
        )
        topic_services.publish_story(
            self.topic_id, deleted_story_id, self.admin_id
        )
        story_services.delete_story(self.admin_id, deleted_story_id)

        self.save_new_valid_exploration(exp_id_2, self.admin_id)
        self.publish_exploration(self.admin_id, exp_id_2)
        self.save_new_story(story_id, self.admin_id, self.topic_id)
        topic_services.add_canonical_story(
            self.admin_id, self.topic_id, story_id
        )
        story_services.update_story(
            self.admin_id,
            story_id,
            [
                story_domain.StoryChange(
                    {
                        'cmd': story_domain.CMD_ADD_STORY_NODE,
                        'node_id': 'node_1',
                        'title': 'Chapter 1',
                    }
                ),
                story_domain.StoryChange(
                    {
                        'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
                        'property_name': (
                            story_domain.STORY_NODE_PROPERTY_EXPLORATION_ID
                        ),
                        'node_id': 'node_1',
                        'old_value': None,
                        'new_value': exp_id_2,
                    }
                ),
            ],
            'Added node.',
        )
        topic_services.publish_story(self.topic_id, story_id, self.admin_id)
        story_services.update_story(
            self.admin_id,
            story_id,
            [
                story_domain.StoryChange(
                    {
                        'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
                        'property_name': (
                            story_domain.STORY_NODE_PROPERTY_ACQUIRED_SKILL_IDS
                        ),
                        'node_id': 'node_1',
                        # Here we use cast because the empty list's type
                        # cannot be inferred, and List[str] is needed to
                        # match AcceptableChangeDictTypes.
                        'old_value': cast(List[str], []),
                        'new_value': [self.skill_id1],
                    }
                ),
                story_domain.StoryChange(
                    {
                        'cmd': story_domain.CMD_CREATE_ARC,
                        'arc_id': 'arc_1',
                        'title': 'Arc 1',
                        'description': 'First arc',
                        'node_ids': ['node_1'],
                    }
                ),
            ],
            'Added acquired skill IDs and arc.',
        )

        json_response = self.get_json(
            '%s/staging/%s/arc/1'
            % (feconf.PRACTICE_SESSION_DATA_URL_PREFIX, 'public-topic-name'),
        )
        self.assertEqual(json_response['topic_name'], 'public_topic_name')
        self.assertEqual(len(json_response['skill_ids_to_descriptions_map']), 1)

    def test_get_arc_skills_non_matching_arc_in_earlier_story(self) -> None:
        story_a_id = 'story_a'
        story_b_id = 'story_b'
        exp_id_a = 'exp_a'
        exp_id_b = 'exp_b'
        self.save_new_valid_exploration(exp_id_a, self.admin_id)
        self.publish_exploration(self.admin_id, exp_id_a)
        self.save_new_story(story_a_id, self.admin_id, self.topic_id)
        topic_services.add_canonical_story(
            self.admin_id, self.topic_id, story_a_id
        )
        story_services.update_story(
            self.admin_id,
            story_a_id,
            [
                story_domain.StoryChange(
                    {
                        'cmd': story_domain.CMD_ADD_STORY_NODE,
                        'node_id': 'node_1',
                        'title': 'Chapter 1',
                    }
                ),
                story_domain.StoryChange(
                    {
                        'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
                        'property_name': (
                            story_domain.STORY_NODE_PROPERTY_EXPLORATION_ID
                        ),
                        'node_id': 'node_1',
                        'old_value': None,
                        'new_value': exp_id_a,
                    }
                ),
                story_domain.StoryChange(
                    {
                        'cmd': story_domain.CMD_CREATE_ARC,
                        'arc_id': 'arc_1',
                        'title': 'Arc 1',
                        'description': 'First arc',
                        'node_ids': ['node_1'],
                    }
                ),
            ],
            'Added node and arc.',
        )
        topic_services.publish_story(self.topic_id, story_a_id, self.admin_id)
        story_services.update_story(
            self.admin_id,
            story_a_id,
            [
                story_domain.StoryChange(
                    {
                        'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
                        'property_name': (
                            story_domain.STORY_NODE_PROPERTY_ACQUIRED_SKILL_IDS
                        ),
                        'node_id': 'node_1',
                        # Here we use cast because the empty list's type
                        # cannot be inferred, and List[str] is needed to
                        # match AcceptableChangeDictTypes.
                        'old_value': cast(List[str], []),
                        'new_value': [self.skill_id1],
                    }
                ),
            ],
            'Added acquired skill IDs.',
        )

        self.save_new_valid_exploration(exp_id_b, self.admin_id)
        self.publish_exploration(self.admin_id, exp_id_b)
        self.save_new_story(story_b_id, self.admin_id, self.topic_id)
        topic_services.add_canonical_story(
            self.admin_id, self.topic_id, story_b_id
        )
        story_services.update_story(
            self.admin_id,
            story_b_id,
            [
                story_domain.StoryChange(
                    {
                        'cmd': story_domain.CMD_ADD_STORY_NODE,
                        'node_id': 'node_1',
                        'title': 'Chapter 2',
                    }
                ),
                story_domain.StoryChange(
                    {
                        'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
                        'property_name': (
                            story_domain.STORY_NODE_PROPERTY_EXPLORATION_ID
                        ),
                        'node_id': 'node_1',
                        'old_value': None,
                        'new_value': exp_id_b,
                    }
                ),
                story_domain.StoryChange(
                    {
                        'cmd': story_domain.CMD_CREATE_ARC,
                        'arc_id': 'arc_2',
                        'title': 'Arc 2',
                        'description': 'Second arc',
                        'node_ids': ['node_1'],
                    }
                ),
            ],
            'Added node and arc.',
        )
        topic_services.publish_story(self.topic_id, story_b_id, self.admin_id)
        story_services.update_story(
            self.admin_id,
            story_b_id,
            [
                story_domain.StoryChange(
                    {
                        'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
                        'property_name': (
                            story_domain.STORY_NODE_PROPERTY_ACQUIRED_SKILL_IDS
                        ),
                        'node_id': 'node_1',
                        # Here we use cast because the empty list's type
                        # cannot be inferred, and List[str] is needed to
                        # match AcceptableChangeDictTypes.
                        'old_value': cast(List[str], []),
                        'new_value': [self.skill_id2],
                    }
                ),
            ],
            'Added acquired skill IDs.',
        )

        json_response = self.get_json(
            '%s/staging/%s/arc/1'
            % (feconf.PRACTICE_SESSION_DATA_URL_PREFIX, 'public-topic-name'),
        )
        self.assertEqual(json_response['topic_name'], 'public_topic_name')
        self.assertEqual(len(json_response['skill_ids_to_descriptions_map']), 1)
        self.assertEqual(
            json_response['skill_ids_to_descriptions_map'][self.skill_id1],
            'Skill 1',
        )

    def test_get_arc_skills_duplicate_arc_ids_across_stories(self) -> None:
        story_a_id = 'story_a'
        story_b_id = 'story_b'
        exp_id_a = 'exp_a'
        exp_id_b = 'exp_b'
        self.save_new_valid_exploration(exp_id_a, self.admin_id)
        self.publish_exploration(self.admin_id, exp_id_a)
        self.save_new_story(story_a_id, self.admin_id, self.topic_id)
        topic_services.add_canonical_story(
            self.admin_id, self.topic_id, story_a_id
        )
        story_services.update_story(
            self.admin_id,
            story_a_id,
            [
                story_domain.StoryChange(
                    {
                        'cmd': story_domain.CMD_ADD_STORY_NODE,
                        'node_id': 'node_1',
                        'title': 'Chapter 1',
                    }
                ),
                story_domain.StoryChange(
                    {
                        'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
                        'property_name': (
                            story_domain.STORY_NODE_PROPERTY_EXPLORATION_ID
                        ),
                        'node_id': 'node_1',
                        'old_value': None,
                        'new_value': exp_id_a,
                    }
                ),
                story_domain.StoryChange(
                    {
                        'cmd': story_domain.CMD_CREATE_ARC,
                        'arc_id': 'arc_1',
                        'title': 'Arc 1',
                        'description': 'First arc',
                        'node_ids': ['node_1'],
                    }
                ),
            ],
            'Added node and arc.',
        )
        topic_services.publish_story(self.topic_id, story_a_id, self.admin_id)
        story_services.update_story(
            self.admin_id,
            story_a_id,
            [
                story_domain.StoryChange(
                    {
                        'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
                        'property_name': (
                            story_domain.STORY_NODE_PROPERTY_ACQUIRED_SKILL_IDS
                        ),
                        'node_id': 'node_1',
                        # Here we use cast because the empty list's type
                        # cannot be inferred, and List[str] is needed to
                        # match AcceptableChangeDictTypes.
                        'old_value': cast(List[str], []),
                        'new_value': [self.skill_id1],
                    }
                ),
            ],
            'Added acquired skill IDs.',
        )

        self.save_new_valid_exploration(exp_id_b, self.admin_id)
        self.publish_exploration(self.admin_id, exp_id_b)
        self.save_new_story(story_b_id, self.admin_id, self.topic_id)
        topic_services.add_canonical_story(
            self.admin_id, self.topic_id, story_b_id
        )
        story_services.update_story(
            self.admin_id,
            story_b_id,
            [
                story_domain.StoryChange(
                    {
                        'cmd': story_domain.CMD_ADD_STORY_NODE,
                        'node_id': 'node_1',
                        'title': 'Chapter 2',
                    }
                ),
                story_domain.StoryChange(
                    {
                        'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
                        'property_name': (
                            story_domain.STORY_NODE_PROPERTY_EXPLORATION_ID
                        ),
                        'node_id': 'node_1',
                        'old_value': None,
                        'new_value': exp_id_b,
                    }
                ),
                story_domain.StoryChange(
                    {
                        'cmd': story_domain.CMD_CREATE_ARC,
                        'arc_id': 'arc_1',
                        'title': 'Arc 1',
                        'description': 'Same arc id in second story',
                        'node_ids': ['node_1'],
                    }
                ),
            ],
            'Added node and arc.',
        )
        topic_services.publish_story(self.topic_id, story_b_id, self.admin_id)
        story_services.update_story(
            self.admin_id,
            story_b_id,
            [
                story_domain.StoryChange(
                    {
                        'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
                        'property_name': (
                            story_domain.STORY_NODE_PROPERTY_ACQUIRED_SKILL_IDS
                        ),
                        'node_id': 'node_1',
                        # Here we use cast because the empty list's type
                        # cannot be inferred, and List[str] is needed to
                        # match AcceptableChangeDictTypes.
                        'old_value': cast(List[str], []),
                        'new_value': [self.skill_id2],
                    }
                ),
            ],
            'Added acquired skill IDs.',
        )

        json_response = self.get_json(
            '%s/staging/%s/arc/1'
            % (feconf.PRACTICE_SESSION_DATA_URL_PREFIX, 'public-topic-name'),
        )
        self.assertEqual(json_response['topic_name'], 'public_topic_name')
        self.assertEqual(len(json_response['skill_ids_to_descriptions_map']), 1)
        self.assertEqual(
            json_response['skill_ids_to_descriptions_map'][self.skill_id1],
            'Skill 1',
        )

    def test_get_arc_skills_arc_not_found_in_any_story(self) -> None:
        story_id = 'story_id'
        exp_id = 'exp_1'
        self.save_new_valid_exploration(exp_id, self.admin_id)
        self.publish_exploration(self.admin_id, exp_id)
        self.save_new_story(story_id, self.admin_id, self.topic_id)
        topic_services.add_canonical_story(
            self.admin_id, self.topic_id, story_id
        )
        story_services.update_story(
            self.admin_id,
            story_id,
            [
                story_domain.StoryChange(
                    {
                        'cmd': story_domain.CMD_ADD_STORY_NODE,
                        'node_id': 'node_1',
                        'title': 'Chapter 1',
                    }
                ),
                story_domain.StoryChange(
                    {
                        'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
                        'property_name': (
                            story_domain.STORY_NODE_PROPERTY_EXPLORATION_ID
                        ),
                        'node_id': 'node_1',
                        'old_value': None,
                        'new_value': exp_id,
                    }
                ),
                story_domain.StoryChange(
                    {
                        'cmd': story_domain.CMD_CREATE_ARC,
                        'arc_id': 'arc_1',
                        'title': 'Arc 1',
                        'description': 'First arc',
                        'node_ids': ['node_1'],
                    }
                ),
            ],
            'Added node and arc.',
        )
        topic_services.publish_story(self.topic_id, story_id, self.admin_id)

        original_get_stories = story_fetchers.get_stories_by_ids
        call_count = [0]

        def mock_get_stories(
            story_ids: List[str],
        ) -> List[story_domain.Story | None]:
            call_count[0] += 1
            if call_count[0] == 2:
                return [None]
            return list(original_get_stories(story_ids))

        with unittest.mock.patch.object(
            story_fetchers,
            'get_stories_by_ids',
            side_effect=mock_get_stories,
        ):
            json_response = self.get_json(
                '%s/staging/%s/arc/1'
                % (
                    feconf.PRACTICE_SESSION_DATA_URL_PREFIX,
                    'public-topic-name',
                ),
            )
            self.assertEqual(json_response['topic_name'], 'public_topic_name')
            self.assertEqual(
                len(json_response['skill_ids_to_descriptions_map']), 0
            )
