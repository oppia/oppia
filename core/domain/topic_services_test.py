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

"""Tests for topic services."""

from __future__ import annotations

import os

from core import feconf
from core import utils
from core.constants import constants
from core.domain import exp_services
from core.domain import fs_services
from core.domain import question_domain
from core.domain import rights_manager
from core.domain import story_domain
from core.domain import story_services
from core.domain import subtopic_page_domain
from core.domain import subtopic_page_services
from core.domain import suggestion_services
from core.domain import topic_domain
from core.domain import topic_fetchers
from core.domain import topic_services
from core.domain import user_services
from core.platform import models
from core.tests import test_utils

from typing import Dict, List, Optional, Union

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import topic_models

(topic_models,) = models.Registry.import_models([
    models.Names.TOPIC
])


class TopicServicesUnitTests(test_utils.GenericTestBase):
    """Tests for topic services."""

    user_id: str = 'user_id'
    story_id_1: str = 'story_1'
    story_id_2: str = 'story_2'
    story_id_3: str = 'story_3'
    subtopic_id: int = 1
    skill_id_1: str = 'skill_1'
    skill_id_2: str = 'skill_2'
    skill_id_3: str = 'skill_3'

    def setUp(self) -> None:
        self.test_list: List[str] = []
        super().setUp()
        self.TOPIC_ID = topic_fetchers.get_new_topic_id()
        changelist = [topic_domain.TopicChange({
            'cmd': topic_domain.CMD_ADD_SUBTOPIC,
            'title': 'Title',
            'subtopic_id': 1,
            'url_fragment': 'fragment-one'
        })]
        self.save_new_topic(
            self.TOPIC_ID, self.user_id, name='Name',
            description='Description',
            canonical_story_ids=[self.story_id_1, self.story_id_2],
            additional_story_ids=[self.story_id_3],
            uncategorized_skill_ids=[self.skill_id_1, self.skill_id_2],
            subtopics=[], next_subtopic_id=1)
        self.save_new_story(self.story_id_1, self.user_id, self.TOPIC_ID)
        self.save_new_story(
            self.story_id_3,
            self.user_id,
            self.TOPIC_ID,
            title='Title 3',
            description='Description 3'
        )
        self.save_new_story(
            self.story_id_2,
            self.user_id,
            self.TOPIC_ID,
            title='Title 2',
            description='Description 2'
        )
        self.signup('a@example.com', 'A')
        self.signup('b@example.com', 'B')
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)

        self.user_id_a = self.get_user_id_from_email('a@example.com')
        self.user_id_b = self.get_user_id_from_email('b@example.com')
        self.user_id_admin = (
            self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL))
        topic_services.update_topic_and_subtopic_pages(
            self.user_id_admin, self.TOPIC_ID, changelist, 'Added a subtopic')

        self.topic = topic_fetchers.get_topic_by_id(self.TOPIC_ID)
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])
        self.set_topic_managers(
            [user_services.get_username(self.user_id_a)], self.TOPIC_ID)
        self.user_a = user_services.get_user_actions_info(self.user_id_a)
        self.user_b = user_services.get_user_actions_info(self.user_id_b)
        self.user_admin = user_services.get_user_actions_info(
            self.user_id_admin)

    def test_raises_error_if_guest_user_trying_to_deassign_roles_from_topic(
        self
    ) -> None:
        guest_user = user_services.get_user_actions_info(None)
        with self.assertRaisesRegex(
            Exception,
            'Guest users are not allowed to deassing users from all topics.'
        ):
            topic_services.deassign_user_from_all_topics(guest_user, 'user_id')

        with self.assertRaisesRegex(
            Exception,
            'Guest users are not allowed to deassing manager role from topic.'
        ):
            topic_services.deassign_manager_role_from_topic(
                guest_user, 'user_id', 'topic_id'
            )

    def test_get_story_titles_in_topic(self) -> None:
        story_titles = topic_services.get_story_titles_in_topic(
            self.topic)
        self.assertEqual(len(story_titles), 2)
        self.assertIn('Title', story_titles)
        self.assertIn('Title 2', story_titles)

    def test_update_story_and_topic_summary(self) -> None:
        change_list = [
            story_domain.StoryChange(
                {
                    'cmd': story_domain.CMD_UPDATE_STORY_PROPERTY,
                    'property_name': story_domain.STORY_PROPERTY_TITLE,
                    'old_value': 'Title',
                    'new_value': 'New Title'
                }
            )
        ]
        topic_services.update_story_and_topic_summary(
            self.user_id, self.story_id_1, change_list,
            'Updated story title', self.TOPIC_ID
        )
        story_titles = topic_services.get_story_titles_in_topic(
            self.topic)
        self.assertIn('New Title', story_titles)

    def test_compute_summary(self) -> None:
        topic_summary = topic_services.compute_summary_of_topic(self.topic)

        self.assertEqual(topic_summary.id, self.TOPIC_ID)
        self.assertEqual(topic_summary.name, 'Name')
        self.assertEqual(topic_summary.description, 'Description')
        self.assertEqual(topic_summary.canonical_story_count, 0)
        self.assertEqual(topic_summary.additional_story_count, 0)
        self.assertEqual(topic_summary.uncategorized_skill_count, 2)
        self.assertEqual(topic_summary.subtopic_count, 1)
        self.assertEqual(topic_summary.total_skill_count, 2)
        self.assertEqual(topic_summary.total_published_node_count, 0)
        self.assertEqual(topic_summary.thumbnail_filename, 'topic.svg')
        self.assertEqual(topic_summary.thumbnail_bg_color, '#C6DCDA')

    def test_raises_error_while_computing_topic_summary_with_invalid_data(
        self
    ) -> None:
        test_topic = self.topic
        test_topic.created_on = None
        with self.assertRaisesRegex(
            Exception,
            'No data available for when the topic was last updated.'
        ):
            topic_services.compute_summary_of_topic(self.topic)

    def test_get_topic_from_model(self) -> None:
        topic_model = topic_models.TopicModel.get(self.TOPIC_ID)
        topic = topic_fetchers.get_topic_from_model(topic_model)
        self.assertEqual(topic.to_dict(), self.topic.to_dict())

    def test_cannot_get_topic_from_model_with_invalid_schema_version(
        self
    ) -> None:
        topic_services.create_new_topic_rights('topic_id', self.user_id_a)
        commit_cmd = topic_domain.TopicChange({
            'cmd': topic_domain.CMD_CREATE_NEW,
            'name': 'name'
        })
        subtopic_dict = {
            'id': 1,
            'title': 'subtopic_title',
            'skill_ids': []
        }
        model = topic_models.TopicModel(
            id='topic_id',
            name='name',
            abbreviated_name='abbrev',
            url_fragment='name-one',
            description='description1',
            canonical_name='canonical_name',
            next_subtopic_id=1,
            language_code='en',
            subtopics=[subtopic_dict],
            subtopic_schema_version=0,
            story_reference_schema_version=0,
            page_title_fragment_for_web='fragm'
        )
        commit_cmd_dicts = [commit_cmd.to_dict()]
        model.commit(
            self.user_id_a, 'topic model created', commit_cmd_dicts)

        with self.assertRaisesRegex(
            Exception,
            'Sorry, we can only process v1-v%d subtopic schemas at '
            'present.' % feconf.CURRENT_SUBTOPIC_SCHEMA_VERSION):
            topic_fetchers.get_topic_from_model(model)

        topic_services.create_new_topic_rights('topic_id_2', self.user_id_a)
        model = topic_models.TopicModel(
            id='topic_id_2',
            name='name 2',
            abbreviated_name='abbrev',
            url_fragment='name-two',
            description='description',
            canonical_name='canonical_name_2',
            next_subtopic_id=1,
            language_code='en',
            subtopics=[subtopic_dict],
            subtopic_schema_version=1,
            story_reference_schema_version=0,
            page_title_fragment_for_web='fragm'
        )
        commit_cmd_dicts = [commit_cmd.to_dict()]
        model.commit(
            self.user_id_a, 'topic model created', commit_cmd_dicts)

        with self.assertRaisesRegex(
            Exception,
            'Sorry, we can only process v1-v%d story reference schemas at '
            'present.' % feconf.CURRENT_STORY_REFERENCE_SCHEMA_VERSION):
            topic_fetchers.get_topic_from_model(model)

    def test_cannot_create_topic_change_class_with_invalid_changelist(
        self
    ) -> None:
        with self.assertRaisesRegex(
            Exception, 'Missing cmd key in change dict'):
            topic_domain.TopicChange({
                'invalid_cmd': topic_domain.CMD_UPDATE_TOPIC_PROPERTY,
                'property_name': topic_domain.TOPIC_PROPERTY_DESCRIPTION,
                'old_value': 'Description',
                'new_value': 'New Description'
            })

    def test_cannot_rearrange_story_with_missing_index_values(self) -> None:
        with self.assertRaisesRegex(
            Exception, (
                'The following required attributes are missing: '
                'from_index, to_index')):
            topic_domain.TopicChange({
                'cmd': topic_domain.CMD_REARRANGE_CANONICAL_STORY,
            })

    def test_cannot_rearrange_story_with_missing_from_index_value(self) -> None:
        with self.assertRaisesRegex(
            Exception, (
                'The following required attributes are missing: '
                'from_index')):
            topic_domain.TopicChange({
                'cmd': topic_domain.CMD_REARRANGE_CANONICAL_STORY,
                'to_index': 1
            })

    def test_cannot_rearrange_story_with_missing_to_index_value(self) -> None:
        with self.assertRaisesRegex(
            Exception, (
                'The following required attributes are missing: to_index')):
            topic_domain.TopicChange({
                'cmd': topic_domain.CMD_REARRANGE_CANONICAL_STORY,
                'from_index': 1
            })

    def test_rearrange_canonical_stories_in_topic(self) -> None:
        story_id_new = 'story_id_new'
        topic_services.add_canonical_story(
            self.user_id_admin, self.TOPIC_ID, 'story_id_new')

        topic = topic_fetchers.get_topic_by_id(self.TOPIC_ID)
        self.assertEqual(len(topic.canonical_story_references), 3)
        self.assertEqual(
            topic.canonical_story_references[0].story_id, self.story_id_1)
        self.assertEqual(
            topic.canonical_story_references[1].story_id, self.story_id_2)
        self.assertEqual(
            topic.canonical_story_references[2].story_id, story_id_new)

        changelist = [topic_domain.TopicChange({
            'cmd': topic_domain.CMD_REARRANGE_CANONICAL_STORY,
            'from_index': 2,
            'to_index': 0
        })]

        topic_services.update_topic_and_subtopic_pages(
            self.user_id_admin, self.TOPIC_ID, changelist,
            'Rearranged canonical story on index 2 to index 0.')

        topic = topic_fetchers.get_topic_by_id(self.TOPIC_ID)
        self.assertEqual(len(topic.canonical_story_references), 3)
        self.assertEqual(
            topic.canonical_story_references[0].story_id, story_id_new)
        self.assertEqual(
            topic.canonical_story_references[1].story_id, self.story_id_1)
        self.assertEqual(
            topic.canonical_story_references[2].story_id, self.story_id_2)
        topic_commit_log_entry = (
            topic_models.TopicCommitLogEntryModel.get_commit(self.TOPIC_ID, 4)
        )
        # Ruling out the possibility of None for mypy type checking.
        assert topic_commit_log_entry is not None
        self.assertEqual(topic_commit_log_entry.commit_type, 'edit')
        self.assertEqual(topic_commit_log_entry.topic_id, self.TOPIC_ID)
        self.assertEqual(topic_commit_log_entry.user_id, self.user_id_admin)
        self.assertEqual(
            topic_commit_log_entry.commit_message,
            'Rearranged canonical story on index 2 to index 0.')

    def test_rearrange_skill_in_subtopic(self) -> None:
        topic_services.add_uncategorized_skill(
            self.user_id_admin, self.TOPIC_ID, self.skill_id_3)
        changelist = [topic_domain.TopicChange({
            'cmd': topic_domain.CMD_MOVE_SKILL_ID_TO_SUBTOPIC,
            'old_subtopic_id': None,
            'new_subtopic_id': 1,
            'skill_id': self.skill_id_1
        }), topic_domain.TopicChange({
            'cmd': topic_domain.CMD_MOVE_SKILL_ID_TO_SUBTOPIC,
            'old_subtopic_id': None,
            'new_subtopic_id': 1,
            'skill_id': self.skill_id_2
        }), topic_domain.TopicChange({
            'cmd': topic_domain.CMD_MOVE_SKILL_ID_TO_SUBTOPIC,
            'old_subtopic_id': None,
            'new_subtopic_id': 1,
            'skill_id': self.skill_id_3
        })]
        topic_services.update_topic_and_subtopic_pages(
            self.user_id_admin, self.TOPIC_ID, changelist,
            'Added skills to the subtopic.')

        topic = topic_fetchers.get_topic_by_id(self.TOPIC_ID)
        self.assertEqual(len(topic.subtopics[0].skill_ids), 3)
        skill_ids = topic.subtopics[0].skill_ids
        self.assertEqual(skill_ids[0], self.skill_id_1)
        self.assertEqual(skill_ids[1], self.skill_id_2)
        self.assertEqual(skill_ids[2], self.skill_id_3)

        changelist = [topic_domain.TopicChange({
            'cmd': topic_domain.CMD_REARRANGE_SKILL_IN_SUBTOPIC,
            'subtopic_id': 1,
            'from_index': 2,
            'to_index': 0
        })]
        topic_services.update_topic_and_subtopic_pages(
            self.user_id_admin, self.TOPIC_ID, changelist,
            'Rearranged skill from index 2 to index 0 for subtopic with id 1.')

        topic = topic_fetchers.get_topic_by_id(self.TOPIC_ID)
        self.assertEqual(len(topic.subtopics[0].skill_ids), 3)
        skill_ids = topic.subtopics[0].skill_ids
        self.assertEqual(skill_ids[0], self.skill_id_3)
        self.assertEqual(skill_ids[1], self.skill_id_1)
        self.assertEqual(skill_ids[2], self.skill_id_2)

        topic_commit_log_entry = (
            topic_models.TopicCommitLogEntryModel.get_commit(self.TOPIC_ID, 5)
        )
        # Ruling out the possibility of None for mypy type checking.
        assert topic_commit_log_entry is not None
        self.assertEqual(topic_commit_log_entry.commit_type, 'edit')
        self.assertEqual(topic_commit_log_entry.topic_id, self.TOPIC_ID)
        self.assertEqual(topic_commit_log_entry.user_id, self.user_id_admin)
        self.assertEqual(
            topic_commit_log_entry.commit_message,
            'Rearranged skill from index 2 to index 0 for subtopic with id 1.')

    def test_rearrange_subtopic(self) -> None:
        changelist = [topic_domain.TopicChange({
            'cmd': topic_domain.CMD_ADD_SUBTOPIC,
            'title': 'Title2',
            'subtopic_id': 2,
            'url_fragment': 'fragment-two'
        }), topic_domain.TopicChange({
            'cmd': topic_domain.CMD_UPDATE_SUBTOPIC_PROPERTY,
            'property_name': topic_domain.SUBTOPIC_PROPERTY_URL_FRAGMENT,
            'new_value': 'title-two',
            'old_value': '',
            'subtopic_id': 2
        }), topic_domain.TopicChange({
            'cmd': topic_domain.CMD_ADD_SUBTOPIC,
            'title': 'Title3',
            'subtopic_id': 3,
            'url_fragment': 'fragment-three'
        }), topic_domain.TopicChange({
            'cmd': topic_domain.CMD_UPDATE_SUBTOPIC_PROPERTY,
            'property_name': topic_domain.SUBTOPIC_PROPERTY_URL_FRAGMENT,
            'new_value': 'title-three',
            'old_value': '',
            'subtopic_id': 3
        })]
        topic_services.update_topic_and_subtopic_pages(
            self.user_id_admin, self.TOPIC_ID, changelist,
            'Added subtopics to the topic.')

        topic = topic_fetchers.get_topic_by_id(self.TOPIC_ID)
        self.assertEqual(len(topic.subtopics), 3)
        subtopics = topic.subtopics
        self.assertEqual(subtopics[0].id, 1)
        self.assertEqual(subtopics[1].id, 2)
        self.assertEqual(subtopics[2].id, 3)

        changelist = [topic_domain.TopicChange({
            'cmd': topic_domain.CMD_REARRANGE_SUBTOPIC,
            'from_index': 2,
            'to_index': 0
        })]
        topic_services.update_topic_and_subtopic_pages(
            self.user_id_admin, self.TOPIC_ID, changelist,
            'Rearranged subtopic from index 2 to index 0.')

        topic = topic_fetchers.get_topic_by_id(self.TOPIC_ID)
        self.assertEqual(len(topic.subtopics), 3)
        subtopics = topic.subtopics
        self.assertEqual(subtopics[0].id, 3)
        self.assertEqual(subtopics[1].id, 1)
        self.assertEqual(subtopics[2].id, 2)

        topic_commit_log_entry = (
            topic_models.TopicCommitLogEntryModel.get_commit(self.TOPIC_ID, 4)
        )
        # Ruling out the possibility of None for mypy type checking.
        assert topic_commit_log_entry is not None
        self.assertEqual(topic_commit_log_entry.commit_type, 'edit')
        self.assertEqual(topic_commit_log_entry.topic_id, self.TOPIC_ID)
        self.assertEqual(topic_commit_log_entry.user_id, self.user_id_admin)
        self.assertEqual(
            topic_commit_log_entry.commit_message,
            'Rearranged subtopic from index 2 to index 0.')

    def test_cannot_update_topic_property_with_invalid_changelist(self) -> None:
        with self.assertRaisesRegex(
            Exception, (
                'Value for property_name in cmd update_topic_property: '
                'invalid property is not allowed')):
            topic_domain.TopicChange({
                'cmd': topic_domain.CMD_UPDATE_TOPIC_PROPERTY,
                'property_name': 'invalid property',
                'old_value': 'Description',
                'new_value': 'New Description'
            })

    def test_cannot_update_subtopic_property_with_invalid_changelist(
        self
    ) -> None:
        with self.assertRaisesRegex(
            Exception, (
                'The following required attributes are '
                'missing: subtopic_id')):
            topic_domain.TopicChange({
                'cmd': topic_domain.CMD_UPDATE_SUBTOPIC_PROPERTY,
                'property_name': 'invalid property',
                'old_value': 'Description',
                'new_value': 'New Description'
            })

    def test_update_subtopic_property(self) -> None:
        topic = topic_fetchers.get_topic_by_id(self.TOPIC_ID)

        self.assertEqual(len(topic.subtopics), 1)
        self.assertEqual(topic.subtopics[0].title, 'Title')

        # Store a dummy image in filesystem.
        with utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'test_svg.svg'), 'rb',
            encoding=None) as f:
            raw_image = f.read()
        fs = fs_services.GcsFileSystem(feconf.ENTITY_TYPE_TOPIC, self.TOPIC_ID)
        fs.commit(
            '%s/image.svg' % (constants.ASSET_TYPE_THUMBNAIL), raw_image,
            mimetype='image/svg+xml')

        changelist = [topic_domain.TopicChange({
            'cmd': topic_domain.CMD_UPDATE_SUBTOPIC_PROPERTY,
            'property_name': 'title',
            'subtopic_id': 1,
            'old_value': 'Title',
            'new_value': 'New Title'
        }), topic_domain.TopicChange({
            'cmd': topic_domain.CMD_UPDATE_SUBTOPIC_PROPERTY,
            'property_name': 'thumbnail_filename',
            'subtopic_id': 1,
            'old_value': None,
            'new_value': 'image.svg'
        }), topic_domain.TopicChange({
            'cmd': topic_domain.CMD_UPDATE_SUBTOPIC_PROPERTY,
            'property_name': 'thumbnail_bg_color',
            'subtopic_id': 1,
            'old_value': None,
            'new_value': constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0]
        })]
        topic_services.update_topic_and_subtopic_pages(
            self.user_id_admin, self.TOPIC_ID, changelist,
            'Update title of subtopic.')
        topic = topic_fetchers.get_topic_by_id(self.TOPIC_ID)

        self.assertEqual(len(topic.subtopics), 1)
        self.assertEqual(topic.subtopics[0].title, 'New Title')
        self.assertEqual(topic.subtopics[0].thumbnail_filename, 'image.svg')
        self.assertEqual(
            topic.subtopics[0].thumbnail_bg_color,
            constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0])

    def test_cannot_create_topic_change_class_with_invalid_cmd(self) -> None:
        with self.assertRaisesRegex(
            Exception, 'Command invalid cmd is not allowed'):
            topic_domain.TopicChange({
                'cmd': 'invalid cmd',
                'property_name': 'title',
                'subtopic_id': 1,
                'old_value': 'Description',
                'new_value': 'New Description'
            })

    def test_publish_and_unpublish_story(self) -> None:
        topic = topic_fetchers.get_topic_by_id(self.TOPIC_ID)
        self.assertEqual(
            topic.canonical_story_references[0].story_is_published, False)
        self.assertEqual(
            topic.additional_story_references[0].story_is_published, False)
        topic_services.publish_story(
            self.TOPIC_ID, self.story_id_1, self.user_id_admin)
        topic_services.publish_story(
            self.TOPIC_ID, self.story_id_3, self.user_id_admin)
        topic = topic_fetchers.get_topic_by_id(self.TOPIC_ID)
        topic_summary = topic_fetchers.get_topic_summary_by_id(self.TOPIC_ID)
        # Ruling out the possibility of None for mypy type checking.
        assert topic_summary is not None
        self.assertEqual(
            topic.canonical_story_references[0].story_is_published, True)
        self.assertEqual(
            topic.additional_story_references[0].story_is_published, True)
        self.assertEqual(topic_summary.canonical_story_count, 1)
        self.assertEqual(topic_summary.additional_story_count, 1)

        topic_services.unpublish_story(
            self.TOPIC_ID, self.story_id_1, self.user_id_admin)
        topic_services.unpublish_story(
            self.TOPIC_ID, self.story_id_3, self.user_id_admin)
        topic = topic_fetchers.get_topic_by_id(self.TOPIC_ID)
        topic_summary = topic_fetchers.get_topic_summary_by_id(self.TOPIC_ID)
        # Ruling out the possibility of None for mypy type checking.
        assert topic_summary is not None
        self.assertEqual(
            topic.canonical_story_references[0].story_is_published, False)
        self.assertEqual(
            topic.additional_story_references[0].story_is_published, False)
        self.assertEqual(topic_summary.canonical_story_count, 0)
        self.assertEqual(topic_summary.additional_story_count, 0)

    def test_invalid_publish_and_unpublish_story(self) -> None:
        with self.assertRaisesRegex(
            Exception,
            'Entity for class TopicModel with id invalid_topic not found'
        ):
            topic_services.publish_story(
                'invalid_topic', 'story_id_new', self.user_id_admin)

        with self.assertRaisesRegex(
            Exception,
            'A topic with the given ID doesn\'t exist'
        ):
            topic_services.unpublish_story(
                'invalid_topic', 'story_id_new', self.user_id_admin)

        with self.assertRaisesRegex(
            Exception,
            'The user does not have enough rights to publish the story.'
        ):
            topic_services.publish_story(
                self.TOPIC_ID, self.story_id_3, self.user_id_b)

        with self.assertRaisesRegex(
            Exception,
            'The user does not have enough rights to unpublish the story.'
        ):
            topic_services.unpublish_story(
                self.TOPIC_ID, self.story_id_3, self.user_id_b)

        with self.assertRaisesRegex(
            Exception, 'A story with the given ID doesn\'t exist'):
            topic_services.publish_story(
                self.TOPIC_ID, 'invalid_story', self.user_id_admin)

        with self.assertRaisesRegex(
            Exception, 'A story with the given ID doesn\'t exist'):
            topic_services.unpublish_story(
                self.TOPIC_ID, 'invalid_story', self.user_id_admin)

        self.save_new_story(
            'story_10',
            self.user_id,
            self.TOPIC_ID,
            title='Title 2',
            description='Description 2'
        )
        with self.assertRaisesRegex(
            Exception, 'Story with given id doesn\'t exist in the topic'):
            topic_services.publish_story(
                self.TOPIC_ID, 'story_10', self.user_id_admin)

        with self.assertRaisesRegex(
            Exception, 'Story with given id doesn\'t exist in the topic'):
            topic_services.unpublish_story(
                self.TOPIC_ID, 'story_10', self.user_id_admin)

        # Throw error if a story node doesn't have an exploration.
        self.save_new_story(
            'story_id_new',
            self.user_id,
            self.TOPIC_ID,
            title='Title 2',
            description='Description 2'
        )
        topic_services.add_canonical_story(
            self.user_id_admin, self.TOPIC_ID, 'story_id_new')
        changelist = [
            story_domain.StoryChange({
                'cmd': story_domain.CMD_ADD_STORY_NODE,
                'node_id': 'node_1',
                'title': 'Title 1'
            })
        ]
        story_services.update_story(
            self.user_id_admin, 'story_id_new', changelist,
            'Added node.')

        with self.assertRaisesRegex(
            Exception, 'Story node with id node_1 does not contain an '
            'exploration id.'):
            topic_services.publish_story(
                self.TOPIC_ID, 'story_id_new', self.user_id_admin)

        # Throw error if exploration isn't published.
        self.save_new_default_exploration(
            'exp_id', self.user_id_admin, title='title')
        self.publish_exploration(self.user_id_admin, 'exp_id')

        change_list = [story_domain.StoryChange({
            'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
            'property_name': (
                story_domain.STORY_NODE_PROPERTY_EXPLORATION_ID),
            'node_id': 'node_1',
            'old_value': None,
            'new_value': 'exp_id'
        })]
        story_services.update_story(
            self.user_id_admin, 'story_id_new', change_list,
            'Updated story node.')

        self.set_moderators([self.CURRICULUM_ADMIN_USERNAME])
        self.user_admin = user_services.get_user_actions_info(
            self.user_id_admin)
        rights_manager.unpublish_exploration(self.user_admin, 'exp_id')
        with self.assertRaisesRegex(
            Exception, 'Exploration with ID exp_id is not public. Please '
            'publish explorations before adding them to a story.'):
            topic_services.publish_story(
                self.TOPIC_ID, 'story_id_new', self.user_id_admin)

        # Throws error if exploration doesn't exist.
        exp_services.delete_exploration(self.user_id_admin, 'exp_id')

        with self.assertRaisesRegex(
            Exception, 'Expected story to only reference valid explorations, '
            'but found a reference to an invalid exploration with ID: exp_id'):
            topic_services.publish_story(
                self.TOPIC_ID, 'story_id_new', self.user_id_admin)

    def test_update_topic(self) -> None:
        # Save a dummy image on filesystem, to be used as thumbnail.
        with utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'test_svg.svg'),
            'rb', encoding=None) as f:
            raw_image = f.read()
        fs = fs_services.GcsFileSystem(feconf.ENTITY_TYPE_TOPIC, self.TOPIC_ID)
        fs.commit(
            '%s/thumbnail.svg' % (constants.ASSET_TYPE_THUMBNAIL), raw_image,
            mimetype='image/svg+xml')

        # Test whether an admin can edit a topic.
        changelist = [topic_domain.TopicChange({
            'cmd': topic_domain.CMD_UPDATE_TOPIC_PROPERTY,
            'property_name': topic_domain.TOPIC_PROPERTY_DESCRIPTION,
            'old_value': 'Description',
            'new_value': 'New Description'
        }), topic_domain.TopicChange({
            'cmd': topic_domain.CMD_UPDATE_TOPIC_PROPERTY,
            'property_name': topic_domain.TOPIC_PROPERTY_ABBREVIATED_NAME,
            'old_value': '',
            'new_value': 'short-name'
        }), topic_domain.TopicChange({
            'cmd': topic_domain.CMD_UPDATE_TOPIC_PROPERTY,
            'property_name': topic_domain.TOPIC_PROPERTY_URL_FRAGMENT,
            'old_value': '',
            'new_value': 'url-name'
        }), topic_domain.TopicChange({
            'cmd': topic_domain.CMD_UPDATE_TOPIC_PROPERTY,
            'property_name': topic_domain.TOPIC_PROPERTY_THUMBNAIL_FILENAME,
            'old_value': '',
            'new_value': 'thumbnail.svg'
        }), topic_domain.TopicChange({
            'cmd': topic_domain.CMD_UPDATE_TOPIC_PROPERTY,
            'property_name': topic_domain.TOPIC_PROPERTY_THUMBNAIL_BG_COLOR,
            'old_value': '',
            'new_value': '#C6DCDA'
        }), topic_domain.TopicChange({
            'cmd': topic_domain.CMD_UPDATE_TOPIC_PROPERTY,
            'property_name': topic_domain.TOPIC_PROPERTY_META_TAG_CONTENT,
            'old_value': '',
            'new_value': 'topic meta tag content'
        }), topic_domain.TopicChange({
            'cmd': topic_domain.CMD_UPDATE_TOPIC_PROPERTY,
            'property_name': (
                topic_domain.TOPIC_PROPERTY_PRACTICE_TAB_IS_DISPLAYED),
            'old_value': False,
            'new_value': True
        }), topic_domain.TopicChange({
            'cmd': topic_domain.CMD_UPDATE_TOPIC_PROPERTY,
            'property_name': (
                topic_domain.TOPIC_PROPERTY_PAGE_TITLE_FRAGMENT_FOR_WEB),
            'old_value': '',
            'new_value': 'topic page title'
        }), topic_domain.TopicChange({
            'cmd': topic_domain.CMD_UPDATE_TOPIC_PROPERTY,
            'property_name': (
                topic_domain.TOPIC_PROPERTY_SKILL_IDS_FOR_DIAGNOSTIC_TEST),
            'old_value': ['test_skill_id'],
            'new_value': self.test_list
        })]
        topic_services.update_topic_and_subtopic_pages(
            self.user_id_admin, self.TOPIC_ID, changelist,
            'Updated Description.')
        topic = topic_fetchers.get_topic_by_id(self.TOPIC_ID)
        topic_summary = topic_fetchers.get_topic_summary_by_id(self.TOPIC_ID)
        # Ruling out the possibility of None for mypy type checking.
        assert topic_summary is not None
        self.assertEqual(topic.description, 'New Description')
        self.assertEqual(topic.abbreviated_name, 'short-name')
        self.assertEqual(topic.url_fragment, 'url-name')
        self.assertEqual(topic.thumbnail_filename, 'thumbnail.svg')
        self.assertEqual(topic.thumbnail_size_in_bytes, len(raw_image))
        self.assertEqual(topic.thumbnail_bg_color, '#C6DCDA')
        self.assertEqual(topic.version, 3)
        self.assertEqual(topic.practice_tab_is_displayed, True)
        self.assertEqual(topic.meta_tag_content, 'topic meta tag content')
        self.assertEqual(topic.page_title_fragment_for_web, 'topic page title')
        self.assertEqual(topic.skill_ids_for_diagnostic_test, [])
        self.assertEqual(topic_summary.version, 3)
        self.assertEqual(topic_summary.thumbnail_filename, 'thumbnail.svg')
        self.assertEqual(topic_summary.thumbnail_bg_color, '#C6DCDA')

        # Test whether a topic_manager can update a dummy thumbnail_filename.
        changelist = [topic_domain.TopicChange({
            'cmd': topic_domain.CMD_UPDATE_TOPIC_PROPERTY,
            'property_name': topic_domain.TOPIC_PROPERTY_THUMBNAIL_FILENAME,
            'old_value': '',
            'new_value': 'dummy_thumbnail.svg'
        })]
        with self.assertRaisesRegex(Exception, (
            'The thumbnail dummy_thumbnail.svg for topic with id '
            '%s does not exist in the filesystem.' % self.TOPIC_ID)):
            topic_services.update_topic_and_subtopic_pages(
                self.user_id_admin, self.TOPIC_ID, changelist,
                'Updated thumbnail filename.')

        # Test whether a topic_manager can edit a topic.
        changelist = [topic_domain.TopicChange({
            'cmd': topic_domain.CMD_UPDATE_TOPIC_PROPERTY,
            'property_name': topic_domain.TOPIC_PROPERTY_NAME,
            'old_value': 'Name',
            'new_value': 'New Name'
        })]
        topic_services.update_topic_and_subtopic_pages(
            self.user_id_a, self.TOPIC_ID, changelist, 'Updated Name.')
        topic = topic_fetchers.get_topic_by_id(self.TOPIC_ID)
        topic_summary = topic_fetchers.get_topic_summary_by_id(self.TOPIC_ID)
        # Ruling out the possibility of None for mypy type checking.
        assert topic_summary is not None
        self.assertEqual(topic.name, 'New Name')
        self.assertEqual(topic.canonical_name, 'new name')
        self.assertEqual(topic.version, 4)
        self.assertEqual(topic_summary.name, 'New Name')
        self.assertEqual(topic_summary.version, 4)

    def test_update_topic_and_subtopic_page(self) -> None:
        changelist: List[Union[
            topic_domain.TopicChange,
            subtopic_page_domain.SubtopicPageChange
        ]] = [topic_domain.TopicChange({
            'cmd': topic_domain.CMD_ADD_SUBTOPIC,
            'title': 'Title3',
            'subtopic_id': 3,
            'url_fragment': 'fragment-three'
        })]
        with self.assertRaisesRegex(
            Exception, 'The given new subtopic id 3 is not equal to '
            'the expected next subtopic id: 2'):
            topic_services.update_topic_and_subtopic_pages(
                self.user_id_admin, self.TOPIC_ID, changelist,
                'Added subtopic.')

        # Test whether the subtopic page was created for the above failed
        # attempt.
        subtopic_page = subtopic_page_services.get_subtopic_page_by_id(
            self.TOPIC_ID, 3, strict=False)
        self.assertIsNone(subtopic_page)

        # Test exception raised for simultaneous adding and removing of
        # subtopics.
        changelist = [
            topic_domain.TopicChange({
                'cmd': topic_domain.CMD_ADD_SUBTOPIC,
                'title': 'Title2',
                'subtopic_id': 2,
                'url_fragment': 'fragment-two'
            }),
            topic_domain.TopicChange({
                'cmd': topic_domain.CMD_DELETE_SUBTOPIC,
                'subtopic_id': 2
            })
        ]
        with self.assertRaisesRegex(
            Exception, 'The incoming changelist had simultaneous'
            ' creation and deletion of subtopics.'):
            topic_services.update_topic_and_subtopic_pages(
                self.user_id_admin, self.TOPIC_ID, changelist,
                'Added and deleted a subtopic.')

        # Test whether a subtopic page already existing in datastore can be
        # edited.
        changelist = [subtopic_page_domain.SubtopicPageChange({
            'cmd': subtopic_page_domain.CMD_UPDATE_SUBTOPIC_PAGE_PROPERTY,
            'property_name': (
                subtopic_page_domain.SUBTOPIC_PAGE_PROPERTY_PAGE_CONTENTS_HTML),
            'old_value': '',
            'subtopic_id': 1,
            'new_value': {
                'html': '<p>New Value</p>',
                'content_id': 'content'
            }
        })]
        topic_services.update_topic_and_subtopic_pages(
            self.user_id_admin, self.TOPIC_ID, changelist,
            'Updated html data')
        subtopic_page = subtopic_page_services.get_subtopic_page_by_id(
            self.TOPIC_ID, 1)
        self.assertEqual(
            subtopic_page.page_contents.subtitled_html.html,
            '<p>New Value</p>')

        # Test a sequence of changes with both topic and subtopic page changes.
        changelist = [
            topic_domain.TopicChange({
                'cmd': topic_domain.CMD_ADD_SUBTOPIC,
                'title': 'Title2',
                'subtopic_id': 2,
                'url_fragment': 'fragment-two'
            }),
            topic_domain.TopicChange({
                'cmd': topic_domain.CMD_DELETE_SUBTOPIC,
                'subtopic_id': 1
            }),
            subtopic_page_domain.SubtopicPageChange({
                'cmd': subtopic_page_domain.CMD_UPDATE_SUBTOPIC_PAGE_PROPERTY,
                'property_name': (
                    subtopic_page_domain
                    .SUBTOPIC_PAGE_PROPERTY_PAGE_CONTENTS_HTML),
                'old_value': {
                    'html': '',
                    'content_id': 'content'
                },
                'subtopic_id': 2,
                'new_value': {
                    'html': '<p>New Value</p>',
                    'content_id': 'content'
                }
            }),
            subtopic_page_domain.SubtopicPageChange({
                'cmd': subtopic_page_domain.CMD_UPDATE_SUBTOPIC_PAGE_PROPERTY,
                'property_name': (
                    subtopic_page_domain
                    .SUBTOPIC_PAGE_PROPERTY_PAGE_CONTENTS_AUDIO),
                'old_value': {
                    'voiceovers_mapping': {
                        'content': {}
                    }
                },
                'new_value': {
                    'voiceovers_mapping': {
                        'content': {
                            'en': {
                                'filename': 'test.mp3',
                                'file_size_bytes': 100,
                                'needs_update': False,
                                'duration_secs': 0.3
                            }
                        }
                    }
                },
                'subtopic_id': 2
            }),
            topic_domain.TopicChange({
                'cmd': topic_domain.CMD_MOVE_SKILL_ID_TO_SUBTOPIC,
                'old_subtopic_id': None,
                'new_subtopic_id': 2,
                'skill_id': self.skill_id_1
            })]
        topic_services.update_topic_and_subtopic_pages(
            self.user_id_admin, self.TOPIC_ID, changelist,
            'Added and removed a subtopic.')
        topic = topic_fetchers.get_topic_by_id(self.TOPIC_ID)
        self.assertEqual(len(topic.subtopics), 1)
        self.assertEqual(topic.next_subtopic_id, 3)
        self.assertEqual(topic.subtopics[0].title, 'Title2')
        self.assertEqual(topic.subtopics[0].skill_ids, [self.skill_id_1])

        # Test whether the subtopic page corresponding to the deleted subtopic
        # was also deleted.
        subtopic_page = subtopic_page_services.get_subtopic_page_by_id(
            self.TOPIC_ID, 1, strict=False)
        self.assertIsNone(subtopic_page)
        # Validate the newly created subtopic page.
        subtopic_page = subtopic_page_services.get_subtopic_page_by_id(
            self.TOPIC_ID, 2, strict=False)
        # Ruling out the possibility of None for mypy type checking.
        assert subtopic_page is not None
        self.assertEqual(
            subtopic_page.page_contents.subtitled_html.html,
            '<p>New Value</p>')
        self.assertEqual(
            subtopic_page.page_contents.recorded_voiceovers.to_dict(), {
                'voiceovers_mapping': {
                    'content': {
                        'en': {
                            'filename': 'test.mp3',
                            'file_size_bytes': 100,
                            'needs_update': False,
                            'duration_secs': 0.3
                        }
                    }
                }
            })

        # Making sure everything resets when an error is encountered anywhere.
        changelist = [
            topic_domain.TopicChange({
                'cmd': topic_domain.CMD_ADD_SUBTOPIC,
                'title': 'Title3',
                'subtopic_id': 3,
                'url_fragment': 'fragment-three'
            }),
            topic_domain.TopicChange({
                'cmd': topic_domain.CMD_ADD_SUBTOPIC,
                'title': 'Title4',
                'subtopic_id': 4,
                'url_fragment': 'fragment-four'
            }),
            topic_domain.TopicChange({
                'cmd': topic_domain.CMD_DELETE_SUBTOPIC,
                'subtopic_id': 2
            }),
            # The following is an invalid command as subtopic with id 2 was
            # deleted in previous step.
            subtopic_page_domain.SubtopicPageChange({
                'cmd': subtopic_page_domain.CMD_UPDATE_SUBTOPIC_PAGE_PROPERTY,
                'property_name': (
                    subtopic_page_domain
                    .SUBTOPIC_PAGE_PROPERTY_PAGE_CONTENTS_HTML),
                'old_value': '',
                'subtopic_id': 2,
                'new_value': {
                    'html': '<p>New Value</p>',
                    'content_id': 'content'
                }
            }),
        ]
        with self.assertRaisesRegex(
            Exception, 'The subtopic with id 2 doesn\'t exist'):
            topic_services.update_topic_and_subtopic_pages(
                self.user_id_admin, self.TOPIC_ID, changelist,
                'Done some changes.')

        # Make sure the topic object in datastore is not affected.
        topic = topic_fetchers.get_topic_by_id(self.TOPIC_ID)
        self.assertEqual(len(topic.subtopics), 1)
        self.assertEqual(topic.next_subtopic_id, 3)
        self.assertEqual(topic.subtopics[0].title, 'Title2')
        self.assertEqual(topic.subtopics[0].skill_ids, [self.skill_id_1])

        subtopic_page = subtopic_page_services.get_subtopic_page_by_id(
            self.TOPIC_ID, 3, strict=False)
        self.assertIsNone(subtopic_page)
        subtopic_page = subtopic_page_services.get_subtopic_page_by_id(
            self.TOPIC_ID, 4, strict=False)
        self.assertIsNone(subtopic_page)
        subtopic_page = subtopic_page_services.get_subtopic_page_by_id(
            self.TOPIC_ID, 2, strict=False)
        self.assertIsNotNone(subtopic_page)

    def test_update_topic_schema(self) -> None:
        orig_topic_dict = (
            topic_fetchers.get_topic_by_id(self.TOPIC_ID).to_dict())

        changelist = [topic_domain.TopicChange({
            'cmd': topic_domain.CMD_MIGRATE_SUBTOPIC_SCHEMA_TO_LATEST_VERSION,
            'from_version': 2,
            'to_version': 3,
        })]
        topic_services.update_topic_and_subtopic_pages(
            self.user_id_admin, self.TOPIC_ID, changelist, 'Update schema.')

        new_topic_dict = (
            topic_fetchers.get_topic_by_id(self.TOPIC_ID).to_dict())

        # Check version is updated.
        self.assertEqual(new_topic_dict['version'], 3)

        # Delete version and check that the two dicts are the same.
        del orig_topic_dict['version']
        del new_topic_dict['version']
        self.assertEqual(orig_topic_dict, new_topic_dict)

    def test_add_uncategorized_skill(self) -> None:
        topic_services.add_uncategorized_skill(
            self.user_id_admin, self.TOPIC_ID, 'skill_id_3')
        topic = topic_fetchers.get_topic_by_id(self.TOPIC_ID)
        self.assertEqual(
            topic.uncategorized_skill_ids,
            [self.skill_id_1, self.skill_id_2, 'skill_id_3'])
        topic_commit_log_entry = (
            topic_models.TopicCommitLogEntryModel.get_commit(self.TOPIC_ID, 3)
        )
        # Ruling out the possibility of None for mypy type checking.
        assert topic_commit_log_entry is not None
        self.assertEqual(topic_commit_log_entry.commit_type, 'edit')
        self.assertEqual(topic_commit_log_entry.topic_id, self.TOPIC_ID)
        self.assertEqual(topic_commit_log_entry.user_id, self.user_id_admin)
        self.assertEqual(
            topic_commit_log_entry.commit_message,
            'Added skill_id_3 to uncategorized skill ids')

    def test_delete_uncategorized_skill(self) -> None:
        topic_services.delete_uncategorized_skill(
            self.user_id_admin, self.TOPIC_ID, self.skill_id_1)
        topic = topic_fetchers.get_topic_by_id(self.TOPIC_ID)
        self.assertEqual(topic.uncategorized_skill_ids, [self.skill_id_2])
        topic_commit_log_entry = (
            topic_models.TopicCommitLogEntryModel.get_commit(self.TOPIC_ID, 3)
        )
        # Ruling out the possibility of None for mypy type checking.
        assert topic_commit_log_entry is not None
        self.assertEqual(topic_commit_log_entry.commit_type, 'edit')
        self.assertEqual(topic_commit_log_entry.topic_id, self.TOPIC_ID)
        self.assertEqual(topic_commit_log_entry.user_id, self.user_id_admin)
        self.assertEqual(
            topic_commit_log_entry.commit_message,
            'Removed %s from uncategorized skill ids' % self.skill_id_1)

    def test_delete_canonical_story(self) -> None:
        topic_services.delete_canonical_story(
            self.user_id_admin, self.TOPIC_ID, self.story_id_1)

        topic = topic_fetchers.get_topic_by_id(self.TOPIC_ID)
        self.assertEqual(len(topic.canonical_story_references), 1)
        self.assertEqual(
            topic.canonical_story_references[0].story_id, self.story_id_2)
        topic_commit_log_entry = (
            topic_models.TopicCommitLogEntryModel.get_commit(self.TOPIC_ID, 3)
        )
        # Ruling out the possibility of None for mypy type checking.
        assert topic_commit_log_entry is not None
        self.assertEqual(topic_commit_log_entry.commit_type, 'edit')
        self.assertEqual(topic_commit_log_entry.topic_id, self.TOPIC_ID)
        self.assertEqual(topic_commit_log_entry.user_id, self.user_id_admin)
        self.assertEqual(
            topic_commit_log_entry.commit_message,
            'Removed %s from canonical story ids' % self.story_id_1)

    def test_add_canonical_story(self) -> None:
        topic_services.add_canonical_story(
            self.user_id_admin, self.TOPIC_ID, 'story_id')
        topic = topic_fetchers.get_topic_by_id(self.TOPIC_ID)
        self.assertEqual(
            len(topic.canonical_story_references), 3)
        self.assertEqual(
            topic.canonical_story_references[2].story_id, 'story_id')
        topic_commit_log_entry = (
            topic_models.TopicCommitLogEntryModel.get_commit(self.TOPIC_ID, 3)
        )
        # Ruling out the possibility of None for mypy type checking.
        assert topic_commit_log_entry is not None
        self.assertEqual(topic_commit_log_entry.commit_type, 'edit')
        self.assertEqual(topic_commit_log_entry.topic_id, self.TOPIC_ID)
        self.assertEqual(topic_commit_log_entry.user_id, self.user_id_admin)
        self.assertEqual(
            topic_commit_log_entry.commit_message,
            'Added %s to canonical story ids' % 'story_id')

    def test_delete_additional_story(self) -> None:
        topic_services.delete_additional_story(
            self.user_id_admin, self.TOPIC_ID, self.story_id_3)
        topic = topic_fetchers.get_topic_by_id(self.TOPIC_ID)
        self.assertEqual(len(topic.additional_story_references), 0)

        topic_commit_log_entry = (
            topic_models.TopicCommitLogEntryModel.get_commit(self.TOPIC_ID, 3)
        )
        # Ruling out the possibility of None for mypy type checking.
        assert topic_commit_log_entry is not None
        self.assertEqual(topic_commit_log_entry.commit_type, 'edit')
        self.assertEqual(topic_commit_log_entry.topic_id, self.TOPIC_ID)
        self.assertEqual(topic_commit_log_entry.user_id, self.user_id_admin)
        self.assertEqual(
            topic_commit_log_entry.commit_message,
            'Removed %s from additional story ids' % self.story_id_3)

    def test_add_additional_story(self) -> None:
        topic_services.add_additional_story(
            self.user_id_admin, self.TOPIC_ID, 'story_id_4')
        topic = topic_fetchers.get_topic_by_id(self.TOPIC_ID)
        self.assertEqual(
            len(topic.additional_story_references), 2)
        self.assertEqual(
            topic.additional_story_references[1].story_id, 'story_id_4')
        topic_commit_log_entry = (
            topic_models.TopicCommitLogEntryModel.get_commit(self.TOPIC_ID, 3)
        )
        # Ruling out the possibility of None for mypy type checking.
        assert topic_commit_log_entry is not None
        self.assertEqual(topic_commit_log_entry.commit_type, 'edit')
        self.assertEqual(topic_commit_log_entry.topic_id, self.TOPIC_ID)
        self.assertEqual(topic_commit_log_entry.user_id, self.user_id_admin)
        self.assertEqual(
            topic_commit_log_entry.commit_message,
            'Added story_id_4 to additional story ids')

    def test_delete_topic(self) -> None:
        # Add suggestion for the topic to test if it is deleted too.
        question = self.save_new_question(
            'question_id',
            self.user_id_admin,
            self._create_valid_question_data('dest'),
            [self.skill_id_1])
        suggestion = suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_ADD_QUESTION,
            feconf.ENTITY_TYPE_TOPIC,
            self.TOPIC_ID,
            1,
            self.user_id_admin,
            {
                'cmd': question_domain.CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION,
                'skill_difficulty': 0.3,
                'skill_id': self.skill_id_1,
                'question_dict': question.to_dict()
            },
            'change'
        )

        self.assertIsNotNone(
            suggestion_services.get_suggestion_by_id(suggestion.suggestion_id))

        topic_services.delete_topic(self.user_id_admin, self.TOPIC_ID)
        self.assertIsNone(
            topic_fetchers.get_topic_by_id(self.TOPIC_ID, strict=False))
        self.assertIsNone(
            topic_fetchers.get_topic_summary_by_id(self.TOPIC_ID, strict=False))
        self.assertIsNone(
            subtopic_page_services.get_subtopic_page_by_id(
                self.TOPIC_ID, 1, strict=False))
        self.assertIsNone(
            suggestion_services.get_suggestion_by_id(
                suggestion.suggestion_id, strict=False
            )
        )

    def test_delete_subtopic_with_skill_ids(self) -> None:
        changelist = [topic_domain.TopicChange({
            'cmd': topic_domain.CMD_DELETE_SUBTOPIC,
            'subtopic_id': self.subtopic_id
        })]
        subtopic_page = subtopic_page_services.get_subtopic_page_by_id(
            self.TOPIC_ID, 1, strict=True)
        self.assertEqual(subtopic_page.id, self.TOPIC_ID + '-1')
        topic_services.update_topic_and_subtopic_pages(
            self.user_id_admin, self.TOPIC_ID, changelist,
            'Removed 1 subtopic.')
        subtopic_page_with_none = (
            subtopic_page_services.get_subtopic_page_by_id(
                self.TOPIC_ID, 1, strict=False
            )
        )
        self.assertIsNone(subtopic_page_with_none)
        topic = topic_fetchers.get_topic_by_id(self.TOPIC_ID)
        self.assertEqual(
            topic.uncategorized_skill_ids, [self.skill_id_1, self.skill_id_2])
        self.assertEqual(topic.subtopics, [])

    def test_update_subtopic_skill_ids(self) -> None:
        # Adds a subtopic and moves skill id from one to another.
        changelist = [
            topic_domain.TopicChange({
                'cmd': topic_domain.CMD_MOVE_SKILL_ID_TO_SUBTOPIC,
                'old_subtopic_id': None,
                'new_subtopic_id': self.subtopic_id,
                'skill_id': self.skill_id_1
            }),
            topic_domain.TopicChange({
                'cmd': topic_domain.CMD_MOVE_SKILL_ID_TO_SUBTOPIC,
                'old_subtopic_id': None,
                'new_subtopic_id': self.subtopic_id,
                'skill_id': self.skill_id_2
            }),
            topic_domain.TopicChange({
                'cmd': topic_domain.CMD_ADD_SUBTOPIC,
                'title': 'Title2',
                'subtopic_id': 2,
                'url_fragment': 'fragment-two'
            }),
            topic_domain.TopicChange({
                'cmd': topic_domain.CMD_MOVE_SKILL_ID_TO_SUBTOPIC,
                'old_subtopic_id': self.subtopic_id,
                'new_subtopic_id': 2,
                'skill_id': self.skill_id_2
            }),
            topic_domain.TopicChange({
                'cmd': topic_domain.CMD_UPDATE_SUBTOPIC_PROPERTY,
                'property_name': topic_domain.SUBTOPIC_PROPERTY_URL_FRAGMENT,
                'new_value': 'new-subtopic',
                'old_value': '',
                'subtopic_id': 2
            })]
        topic_services.update_topic_and_subtopic_pages(
            self.user_id_admin, self.TOPIC_ID, changelist,
            'Updated subtopic skill ids.')
        topic = topic_fetchers.get_topic_by_id(self.TOPIC_ID)
        subtopic_page = subtopic_page_services.get_subtopic_page_by_id(
            topic.id, 2)
        self.assertEqual(topic.uncategorized_skill_ids, [])
        self.assertEqual(topic.subtopics[0].skill_ids, [self.skill_id_1])
        self.assertEqual(topic.subtopics[1].skill_ids, [self.skill_id_2])
        self.assertEqual(topic.subtopics[1].id, 2)
        self.assertEqual(topic.next_subtopic_id, 3)
        self.assertEqual(subtopic_page.topic_id, topic.id)
        self.assertEqual(subtopic_page.id, self.TOPIC_ID + '-2')

        # Tests invalid case where skill id is not present in the old subtopic.
        changelist = [
            topic_domain.TopicChange({
                'cmd': topic_domain.CMD_MOVE_SKILL_ID_TO_SUBTOPIC,
                'old_subtopic_id': self.subtopic_id,
                'new_subtopic_id': 2,
                'skill_id': self.skill_id_2
            })
        ]
        with self.assertRaisesRegex(
            Exception,
            'Skill id %s is not present in the given old subtopic'
            % self.skill_id_2):
            topic_services.update_topic_and_subtopic_pages(
                self.user_id_admin, self.TOPIC_ID, changelist,
                'Updated subtopic skill ids.')

        # Tests invalid case where skill id is not an uncategorized skill id.
        changelist = [
            topic_domain.TopicChange({
                'cmd': topic_domain.CMD_MOVE_SKILL_ID_TO_SUBTOPIC,
                'old_subtopic_id': None,
                'new_subtopic_id': 2,
                'skill_id': 'skill_10'
            })
        ]
        with self.assertRaisesRegex(
            Exception,
            'Skill id skill_10 is not an uncategorized skill id'):
            topic_services.update_topic_and_subtopic_pages(
                self.user_id_admin, self.TOPIC_ID, changelist,
                'Updated subtopic skill ids.')

        # Tests invalid case where target subtopic doesn't exist.
        changelist = [topic_domain.TopicChange({
            'cmd': topic_domain.CMD_MOVE_SKILL_ID_TO_SUBTOPIC,
            'old_subtopic_id': self.subtopic_id,
            'new_subtopic_id': None,
            'skill_id': self.skill_id_1
        })]
        with self.assertRaisesRegex(
            Exception, 'The subtopic with id None does not exist.'):
            topic_services.update_topic_and_subtopic_pages(
                self.user_id_admin, self.TOPIC_ID, changelist,
                'Updated subtopic skill ids.')

        # Tests valid case skill id removal case.
        changelist = [
            topic_domain.TopicChange({
                'cmd': topic_domain.CMD_REMOVE_SKILL_ID_FROM_SUBTOPIC,
                'subtopic_id': 2,
                'skill_id': self.skill_id_2
            }),
            topic_domain.TopicChange({
                'cmd': topic_domain.CMD_REMOVE_SKILL_ID_FROM_SUBTOPIC,
                'subtopic_id': self.subtopic_id,
                'skill_id': self.skill_id_1
            })]
        topic_services.update_topic_and_subtopic_pages(
            self.user_id_admin, self.TOPIC_ID, changelist,
            'Updated subtopic skill ids.')
        topic = topic_fetchers.get_topic_by_id(self.TOPIC_ID)
        self.assertEqual(
            topic.uncategorized_skill_ids, [self.skill_id_2, self.skill_id_1])
        self.assertEqual(topic.subtopics[1].skill_ids, [])
        self.assertEqual(topic.subtopics[0].skill_ids, [])

        # Tests invalid case where skill id is not present in the subtopic
        # from which it is to be removed.
        changelist = [topic_domain.TopicChange({
            'cmd': topic_domain.CMD_REMOVE_SKILL_ID_FROM_SUBTOPIC,
            'subtopic_id': self.subtopic_id,
            'skill_id': 'skill_10'
        })]
        with self.assertRaisesRegex(
            Exception,
            'Skill id skill_10 is not present in the old subtopic'):
            topic_services.update_topic_and_subtopic_pages(
                self.user_id_admin, self.TOPIC_ID, changelist,
                'Updated subtopic skill ids.')

    def test_admin_can_manage_topic(self) -> None:
        topic_rights = topic_fetchers.get_topic_rights(self.TOPIC_ID)

        self.assertTrue(topic_services.check_can_edit_topic(
            self.user_admin, topic_rights))

    def test_filter_published_topic_ids(self) -> None:
        published_topic_ids = topic_services.filter_published_topic_ids([
            self.TOPIC_ID, 'invalid_id'])
        self.assertEqual(len(published_topic_ids), 0)
        changelist = [
            topic_domain.TopicChange({
                'cmd': topic_domain.CMD_MOVE_SKILL_ID_TO_SUBTOPIC,
                'old_subtopic_id': None,
                'new_subtopic_id': self.subtopic_id,
                'skill_id': 'skill_1'
            }),
            topic_domain.TopicChange({
                'cmd': topic_domain.CMD_UPDATE_TOPIC_PROPERTY,
                'property_name': (
                    topic_domain.TOPIC_PROPERTY_SKILL_IDS_FOR_DIAGNOSTIC_TEST),
                'old_value': self.test_list,
                'new_value': ['skill_1']
            })]
        topic_services.update_topic_and_subtopic_pages(
            self.user_id_admin, self.TOPIC_ID, changelist,
            'Updated subtopic skill ids.')
        topic_services.publish_topic(self.TOPIC_ID, self.user_id_admin)
        published_topic_ids = topic_services.filter_published_topic_ids([
            self.TOPIC_ID, 'invalid_id'])
        self.assertEqual(len(published_topic_ids), 1)
        self.assertEqual(published_topic_ids[0], self.TOPIC_ID)

    def test_publish_and_unpublish_topic(self) -> None:
        topic_rights = topic_fetchers.get_topic_rights(self.TOPIC_ID)
        self.assertFalse(topic_rights.topic_is_published)
        changelist = [
            topic_domain.TopicChange({
                'cmd': topic_domain.CMD_MOVE_SKILL_ID_TO_SUBTOPIC,
                'old_subtopic_id': None,
                'new_subtopic_id': self.subtopic_id,
                'skill_id': 'skill_1'
            }),
            topic_domain.TopicChange({
                'cmd': topic_domain.CMD_UPDATE_TOPIC_PROPERTY,
                'property_name': (
                    topic_domain.TOPIC_PROPERTY_SKILL_IDS_FOR_DIAGNOSTIC_TEST),
                'old_value': self.test_list,
                'new_value': ['skill_1']
            })]
        topic_services.update_topic_and_subtopic_pages(
            self.user_id_admin, self.TOPIC_ID, changelist,
            'Updated subtopic skill ids.')
        topic_services.publish_topic(self.TOPIC_ID, self.user_id_admin)

        with self.assertRaisesRegex(
            Exception,
            'The user does not have enough rights to unpublish the topic.'):
            topic_services.unpublish_topic(self.TOPIC_ID, self.user_id_a)

        topic_rights = topic_fetchers.get_topic_rights(self.TOPIC_ID)
        self.assertTrue(topic_rights.topic_is_published)

        topic_services.unpublish_topic(self.TOPIC_ID, self.user_id_admin)
        topic_rights = topic_fetchers.get_topic_rights(self.TOPIC_ID)
        self.assertFalse(topic_rights.topic_is_published)

        with self.assertRaisesRegex(
            Exception,
            'The user does not have enough rights to publish the topic.'):
            topic_services.publish_topic(self.TOPIC_ID, self.user_id_a)

    def test_create_new_topic_rights(self) -> None:
        topic_rights = topic_fetchers.get_topic_rights(self.TOPIC_ID)

        self.assertTrue(topic_services.check_can_edit_topic(
            self.user_a, topic_rights))
        self.assertFalse(topic_services.check_can_edit_topic(
            self.user_b, topic_rights))

    def test_non_admin_cannot_assign_roles(self) -> None:
        self.signup('x@example.com', 'X')
        self.signup('y@example.com', 'Y')

        user_id_x = self.get_user_id_from_email('x@example.com')
        user_id_y = self.get_user_id_from_email('y@example.com')

        user_x = user_services.get_user_actions_info(user_id_x)
        user_y = user_services.get_user_actions_info(user_id_y)
        with self.assertRaisesRegex(
            Exception,
            'UnauthorizedUserException: Could not assign new role.'):
            topic_services.assign_role(
                user_y, user_x, topic_domain.ROLE_MANAGER, self.TOPIC_ID)

        topic_rights = topic_fetchers.get_topic_rights(self.TOPIC_ID)
        self.assertFalse(topic_services.check_can_edit_topic(
            user_x, topic_rights))
        self.assertFalse(topic_services.check_can_edit_topic(
            user_y, topic_rights))

    def test_guest_user_cannot_assign_roles(self) -> None:
        guest_user = user_services.get_user_actions_info(None)
        with self.assertRaisesRegex(
            Exception,
            'Guest user is not allowed to assign roles to a user.'
        ):
            topic_services.assign_role(
                guest_user, self.user_b,
                topic_domain.ROLE_MANAGER, self.TOPIC_ID)

    def test_roles_of_guest_user_cannot_be_changed_until_guest_is_logged_in(
        self
    ) -> None:
        guest_user = user_services.get_user_actions_info(None)
        with self.assertRaisesRegex(
            Exception,
            'Cannot change the role of the Guest user.'
        ):
            topic_services.assign_role(
                self.user_admin, guest_user,
                topic_domain.ROLE_MANAGER, self.TOPIC_ID)

    def test_role_cannot_be_assigned_to_non_topic_manager(self) -> None:
        with self.assertRaisesRegex(
            Exception,
            'The assignee doesn\'t have enough rights to become a manager.'):
            topic_services.assign_role(
                self.user_admin, self.user_b,
                topic_domain.ROLE_MANAGER, self.TOPIC_ID)

    def test_manager_cannot_assign_roles(self) -> None:
        with self.assertRaisesRegex(
            Exception,
            'UnauthorizedUserException: Could not assign new role.'):
            topic_services.assign_role(
                self.user_a, self.user_b,
                topic_domain.ROLE_MANAGER, self.TOPIC_ID)

        topic_rights = topic_fetchers.get_topic_rights(self.TOPIC_ID)
        self.assertTrue(topic_services.check_can_edit_topic(
            self.user_a, topic_rights))
        self.assertFalse(topic_services.check_can_edit_topic(
            self.user_b, topic_rights))

    def test_cannot_save_new_topic_with_existing_name(self) -> None:
        with self.assertRaisesRegex(
            Exception, 'Topic with name \'Name\' already exists'):
            self.save_new_topic(
                'topic_2', self.user_id, name='Name',
                description='Description 2',
                canonical_story_ids=[], additional_story_ids=[],
                uncategorized_skill_ids=[], subtopics=[], next_subtopic_id=1)

    def test_does_not_update_subtopic_url_fragment_if_it_already_exists(
        self
    ) -> None:
        topic_id = topic_fetchers.get_new_topic_id()
        changelist = [topic_domain.TopicChange({
            'cmd': topic_domain.CMD_ADD_SUBTOPIC,
            'title': 'Title',
            'subtopic_id': 1,
            'url_fragment': 'fragment-one'
        }), topic_domain.TopicChange({
            'cmd': topic_domain.CMD_UPDATE_SUBTOPIC_PROPERTY,
            'property_name': topic_domain.SUBTOPIC_PROPERTY_URL_FRAGMENT,
            'new_value': 'original',
            'old_value': '',
            'subtopic_id': 1
        }), topic_domain.TopicChange({
            'cmd': topic_domain.CMD_ADD_SUBTOPIC,
            'title': 'Title',
            'subtopic_id': 2,
            'url_fragment': 'fragment-two'
        }), topic_domain.TopicChange({
            'cmd': topic_domain.CMD_UPDATE_SUBTOPIC_PROPERTY,
            'property_name': topic_domain.SUBTOPIC_PROPERTY_URL_FRAGMENT,
            'new_value': 'original',
            'old_value': '',
            'subtopic_id': 2
        })]
        self.save_new_topic(
            topic_id, self.user_id, name='topic-with-duplicate-subtopic',
            description='Description', canonical_story_ids=[],
            additional_story_ids=[], uncategorized_skill_ids=[],
            subtopics=[], next_subtopic_id=1, url_fragment='frag-dup-subtopic')
        with self.assertRaisesRegex(
            Exception,
            'Subtopic url fragments are not unique across subtopics '
            'in the topic'):
            topic_services.update_topic_and_subtopic_pages(
                self.user_id, topic_id, changelist, 'Update url fragment')

    def test_does_not_create_topic_url_fragment_if_it_already_exists(
        self
    ) -> None:
        topic_id_1 = topic_fetchers.get_new_topic_id()
        topic_id_2 = topic_fetchers.get_new_topic_id()
        self.save_new_topic(
            topic_id_1, self.user_id, name='topic 1',
            description='Description', canonical_story_ids=[],
            additional_story_ids=[], uncategorized_skill_ids=[],
            subtopics=[], next_subtopic_id=1, url_fragment='topic-frag-one')
        with self.assertRaisesRegex(
            Exception,
            'Topic with URL Fragment \'topic-frag-one\' already exists'):
            self.save_new_topic(
                topic_id_2, self.user_id, name='topic 2',
                description='Description', canonical_story_ids=[],
                additional_story_ids=[], uncategorized_skill_ids=[],
                subtopics=[], next_subtopic_id=1,
                url_fragment='topic-frag-one')

    def test_does_not_update_topic_if_url_fragment_already_exists(self) -> None:
        topic_id_1 = topic_fetchers.get_new_topic_id()
        topic_id_2 = topic_fetchers.get_new_topic_id()
        changelist = [topic_domain.TopicChange({
            'cmd': topic_domain.CMD_UPDATE_TOPIC_PROPERTY,
            'property_name': topic_domain.TOPIC_PROPERTY_URL_FRAGMENT,
            'new_value': 'topic-frag-one',
            'old_value': 'topic-frag-two',
        })]
        self.save_new_topic(
            topic_id_1, self.user_id, name='topic name 1',
            description='Description', canonical_story_ids=[],
            additional_story_ids=[], uncategorized_skill_ids=[],
            subtopics=[], next_subtopic_id=1, url_fragment='topic-frag-one')
        self.save_new_topic(
            topic_id_2, self.user_id, name='topic name 2',
            description='Description', canonical_story_ids=[],
            additional_story_ids=[], uncategorized_skill_ids=[],
            subtopics=[], next_subtopic_id=1, url_fragment='topic-frag-two')
        with self.assertRaisesRegex(
            Exception,
            'Topic with URL Fragment \'topic-frag-one\' already exists'):
            topic_services.update_topic_and_subtopic_pages(
                self.user_id, topic_id_2, changelist, 'Update url fragment')

    def test_does_not_update_topic_if_name_already_exists(self) -> None:
        topic_id_1 = topic_fetchers.get_new_topic_id()
        topic_id_2 = topic_fetchers.get_new_topic_id()
        changelist = [topic_domain.TopicChange({
            'cmd': topic_domain.CMD_UPDATE_TOPIC_PROPERTY,
            'property_name': topic_domain.TOPIC_PROPERTY_NAME,
            'new_value': 'topic 1',
            'old_value': 'topic 2',
        })]
        self.save_new_topic(
            topic_id_1, self.user_id, name='topic 1',
            description='Description', canonical_story_ids=[],
            additional_story_ids=[], uncategorized_skill_ids=[],
            subtopics=[], next_subtopic_id=1, url_fragment='topic-frag-one')
        self.save_new_topic(
            topic_id_2, self.user_id, name='topic 2',
            description='Description', canonical_story_ids=[],
            additional_story_ids=[], uncategorized_skill_ids=[],
            subtopics=[], next_subtopic_id=1, url_fragment='topic-frag-two')
        with self.assertRaisesRegex(
            Exception,
            'Topic with name \'topic 1\' already exists'):
            topic_services.update_topic_and_subtopic_pages(
                self.user_id, topic_id_2, changelist, 'Update name')

    def test_does_not_create_topic_if_name_is_non_string(self) -> None:
        topic_id = topic_fetchers.get_new_topic_id()
        changelist = [topic_domain.TopicChange({
            'cmd': topic_domain.CMD_UPDATE_TOPIC_PROPERTY,
            'property_name': topic_domain.TOPIC_PROPERTY_NAME,
            'new_value': 123,
            'old_value': 'topic name',
        })]
        self.save_new_topic(
            topic_id, self.user_id, name='topic name',
            description='Description', canonical_story_ids=[],
            additional_story_ids=[], uncategorized_skill_ids=[],
            subtopics=[], next_subtopic_id=1, url_fragment='topic-frag')
        with self.assertRaisesRegex(
            Exception, 'Name should be a string.'):
            topic_services.update_topic_and_subtopic_pages(
                self.user_id, topic_id, changelist, 'Update topic name')

    # TODO(#13059): Here we use MyPy ignore because after we fully type the
    # codebase we plan to get rid of the tests that intentionally test wrong
    # inputs that we can normally catch by typing.
    def test_url_fragment_existence_fails_for_non_string_url_fragment(
        self
    ) -> None:
        with self.assertRaisesRegex(
            Exception, 'Topic URL fragment should be a string.'):
            topic_services.does_topic_with_url_fragment_exist(123)  # type: ignore[arg-type]

    # TODO(#13059): Here we use MyPy ignore because after we fully type the
    # codebase we plan to get rid of the tests that intentionally test wrong
    # inputs that we can normally catch by typing.
    def test_name_existence_fails_for_non_string_name(self) -> None:
        with self.assertRaisesRegex(
            Exception, 'Name should be a string.'):
            topic_services.does_topic_with_name_exist(123)  # type: ignore[arg-type]

    def test_update_topic_language_code(self) -> None:
        topic = topic_fetchers.get_topic_by_id(self.TOPIC_ID)
        self.assertEqual(topic.language_code, 'en')

        changelist = [topic_domain.TopicChange({
            'cmd': topic_domain.CMD_UPDATE_TOPIC_PROPERTY,
            'property_name': topic_domain.TOPIC_PROPERTY_LANGUAGE_CODE,
            'old_value': 'en',
            'new_value': 'bn'
        })]
        topic_services.update_topic_and_subtopic_pages(
            self.user_id, self.TOPIC_ID, changelist, 'Change language code')

        topic = topic_fetchers.get_topic_by_id(self.TOPIC_ID)
        self.assertEqual(topic.language_code, 'bn')

    def test_cannot_update_topic_and_subtopic_pages_with_empty_changelist(
        self
    ) -> None:
        with self.assertRaisesRegex(
            Exception,
            'Unexpected error: received an invalid change list when trying to '
            'save topic'):
            topic_services.update_topic_and_subtopic_pages(
                self.user_id, self.TOPIC_ID, [], 'commit message')

    def test_cannot_update_topic_and_subtopic_pages_with_mismatch_of_versions(
        self
    ) -> None:
        topic_model = topic_models.TopicModel.get(self.TOPIC_ID)
        topic_model.version = 0
        topic_model.commit(self.user_id, 'changed version', [])

        changelist = [topic_domain.TopicChange({
            'cmd': topic_domain.CMD_UPDATE_TOPIC_PROPERTY,
            'property_name': topic_domain.TOPIC_PROPERTY_LANGUAGE_CODE,
            'old_value': 'en',
            'new_value': 'bn'
        })]

        with self.assertRaisesRegex(
            Exception,
            'Unexpected error: trying to update version 1 of topic '
            'from version 2. Please reload the page and try again.'):
            topic_services.update_topic_and_subtopic_pages(
                self.user_id, self.TOPIC_ID, changelist, 'change language_code')

        topic_model = topic_models.TopicModel.get(self.TOPIC_ID)
        topic_model.version = 100
        topic_model.commit(self.user_id, 'changed version', [])

        with self.assertRaisesRegex(
            Exception,
            'Trying to update version 101 of topic from version 2, '
            'which is too old. Please reload the page and try again.'):
            topic_services.update_topic_and_subtopic_pages(
                self.user_id, self.TOPIC_ID, changelist, 'change language_code')

    def test_cannot_update_topic_and_subtopic_pages_with_empty_commit_message(
        self
    ) -> None:
        changelist = [
            topic_domain.TopicChange({
                'cmd': topic_domain.CMD_MOVE_SKILL_ID_TO_SUBTOPIC,
                'old_subtopic_id': None,
                'new_subtopic_id': self.subtopic_id,
                'skill_id': 'skill_1'
            }),
            topic_domain.TopicChange({
                'cmd': topic_domain.CMD_UPDATE_TOPIC_PROPERTY,
                'property_name': (
                    topic_domain.TOPIC_PROPERTY_SKILL_IDS_FOR_DIAGNOSTIC_TEST),
                'old_value': self.test_list,
                'new_value': ['skill_1']
            })]
        # Test can have an empty commit message when not published.
        topic_services.update_topic_and_subtopic_pages(
            self.user_id_admin, self.TOPIC_ID, changelist,
            None)
        topic_services.publish_topic(self.TOPIC_ID, self.user_id_admin)
        # Test must have a commit message when published.
        with self.assertRaisesRegex(
            Exception, 'Expected a commit message, received none.'):
            topic_services.update_topic_and_subtopic_pages(
                self.user_id, self.TOPIC_ID, [], None)

    def test_cannot_publish_topic_with_no_topic_rights(self) -> None:
        with self.assertRaisesRegex(
            Exception, 'The given topic does not exist'):
            topic_services.publish_topic('invalid_topic_id', self.user_id_admin)

    def test_cannot_publish_a_published_topic(self) -> None:
        topic_rights = topic_fetchers.get_topic_rights(self.TOPIC_ID)
        self.assertFalse(topic_rights.topic_is_published)
        changelist = [
            topic_domain.TopicChange({
                'cmd': topic_domain.CMD_MOVE_SKILL_ID_TO_SUBTOPIC,
                'old_subtopic_id': None,
                'new_subtopic_id': self.subtopic_id,
                'skill_id': 'skill_1'
            }),
            topic_domain.TopicChange({
                'cmd': topic_domain.CMD_UPDATE_TOPIC_PROPERTY,
                'property_name': (
                    topic_domain.TOPIC_PROPERTY_SKILL_IDS_FOR_DIAGNOSTIC_TEST),
                'old_value': self.test_list,
                'new_value': ['skill_1']
            })]
        topic_services.update_topic_and_subtopic_pages(
            self.user_id_admin, self.TOPIC_ID, changelist,
            'Updated subtopic skill ids.')
        topic_services.publish_topic(self.TOPIC_ID, self.user_id_admin)
        topic_rights = topic_fetchers.get_topic_rights(self.TOPIC_ID)
        self.assertTrue(topic_rights.topic_is_published)

        with self.assertRaisesRegex(
            Exception, 'The topic is already published.'):
            topic_services.publish_topic(self.TOPIC_ID, self.user_id_admin)

    def test_cannot_unpublish_topic_with_no_topic_rights(self) -> None:
        with self.assertRaisesRegex(
            Exception, 'The given topic does not exist'):
            topic_services.unpublish_topic(
                'invalid_topic_id', self.user_id_admin)

    def test_cannot_unpublish_an_unpublished_topic(self) -> None:
        topic_rights = topic_fetchers.get_topic_rights(self.TOPIC_ID)
        self.assertFalse(topic_rights.topic_is_published)

        with self.assertRaisesRegex(
            Exception, 'The topic is already unpublished.'):
            topic_services.unpublish_topic(self.TOPIC_ID, self.user_id_admin)

    def test_cannot_edit_topic_with_no_topic_rights(self) -> None:
        self.assertFalse(topic_services.check_can_edit_topic(self.user_a, None))

    def test_cannot_assign_role_with_invalid_role(self) -> None:
        with self.assertRaisesRegex(Exception, 'Invalid role'):
            topic_services.assign_role(
                self.user_admin, self.user_a, 'invalid_role', self.TOPIC_ID)

    def test_deassign_user_from_all_topics(self) -> None:
        self.save_new_topic(
            'topic_2', self.user_id, name='Name 2',
            abbreviated_name='name-two', url_fragment='name-six',
            description='Description 2',
            canonical_story_ids=[], additional_story_ids=[],
            uncategorized_skill_ids=[], subtopics=[], next_subtopic_id=1)
        self.save_new_topic(
            'topic_3', self.user_id, name='Name 3',
            abbreviated_name='name-three', url_fragment='name-seven',
            description='Description 3',
            canonical_story_ids=[], additional_story_ids=[],
            uncategorized_skill_ids=[], subtopics=[], next_subtopic_id=1)

        topic_services.assign_role(
            self.user_admin, self.user_a,
            topic_domain.ROLE_MANAGER, 'topic_2')
        topic_rights = topic_fetchers.get_topic_rights_with_user(self.user_id_a)
        self.assertEqual(len(topic_rights), 2)

        topic_services.deassign_user_from_all_topics(
            self.user_admin, self.user_id_a)
        topic_rights = topic_fetchers.get_topic_rights_with_user(self.user_id_a)
        self.assertEqual(len(topic_rights), 0)

    def test_reassigning_manager_role_to_same_user(self) -> None:
        with self.assertRaisesRegex(
            Exception, 'This user already is a manager for this topic'):
            topic_services.assign_role(
                self.user_admin, self.user_a,
                topic_domain.ROLE_MANAGER, self.TOPIC_ID)

        topic_rights = topic_fetchers.get_topic_rights(self.TOPIC_ID)
        self.assertTrue(topic_services.check_can_edit_topic(
            self.user_a, topic_rights))
        self.assertFalse(topic_services.check_can_edit_topic(
            self.user_b, topic_rights))

    def test_assigning_none_role(self) -> None:
        topic_rights = topic_fetchers.get_topic_rights(self.TOPIC_ID)

        self.assertTrue(topic_services.check_can_edit_topic(
            self.user_a, topic_rights))
        self.assertFalse(topic_services.check_can_edit_topic(
            self.user_b, topic_rights))
        # Assigning None role to manager.
        topic_services.assign_role(
            self.user_admin, self.user_a,
            topic_domain.ROLE_NONE, self.TOPIC_ID)

        self.assertFalse(topic_services.check_can_edit_topic(
            self.user_a, topic_rights))
        self.assertFalse(topic_services.check_can_edit_topic(
            self.user_b, topic_rights))

        # Assigning None role to another role.
        topic_services.assign_role(
            self.user_admin, self.user_a,
            topic_domain.ROLE_NONE, self.TOPIC_ID)

        self.assertFalse(topic_services.check_can_edit_topic(
            self.user_b, topic_rights))

    def test_deassigning_manager_role(self) -> None:
        topic_rights = topic_fetchers.get_topic_rights(self.TOPIC_ID)

        self.assertTrue(topic_services.check_can_edit_topic(
            self.user_a, topic_rights))
        self.assertFalse(topic_services.check_can_edit_topic(
            self.user_b, topic_rights))

        topic_services.deassign_manager_role_from_topic(
            self.user_admin, self.user_id_a, self.TOPIC_ID)

        self.assertFalse(topic_services.check_can_edit_topic(
            self.user_a, topic_rights))
        self.assertFalse(topic_services.check_can_edit_topic(
            self.user_b, topic_rights))

    def test_deassigning_an_unassigned_user_from_topic_raise_exception(
        self
    ) -> None:
        topic_rights = topic_fetchers.get_topic_rights(self.TOPIC_ID)
        self.assertFalse(topic_services.check_can_edit_topic(
            self.user_b, topic_rights))

        with self.assertRaisesRegex(
            Exception, 'User does not have manager rights in topic.'):
            topic_services.deassign_manager_role_from_topic(
                self.user_admin, self.user_id_b, self.TOPIC_ID)

    def test_update_thumbnail_filename(self) -> None:
        self.assertEqual(self.topic.thumbnail_filename, 'topic.svg')
        # Test exception when thumbnail is not found on filesystem.
        with self.assertRaisesRegex(
            Exception,
            'The thumbnail img.svg for topic with id %s does not exist'
            ' in the filesystem.' % (self.TOPIC_ID)
        ):
            topic_services.update_thumbnail_filename(self.topic, 'img.svg')

        # Save the dummy image to the filesystem to be used as thumbnail.
        with utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'test_svg.svg'),
            'rb',
            encoding=None
        ) as f:
            raw_image = f.read()
        fs = fs_services.GcsFileSystem(feconf.ENTITY_TYPE_TOPIC, self.TOPIC_ID)
        fs.commit(
            '%s/img.svg' % (constants.ASSET_TYPE_THUMBNAIL), raw_image,
            mimetype='image/svg+xml')
        # Test successful update of thumbnail present in the filesystem.
        topic_services.update_thumbnail_filename(self.topic, 'img.svg')
        self.assertEqual(self.topic.thumbnail_filename, 'img.svg')
        self.assertEqual(self.topic.thumbnail_size_in_bytes, len(raw_image))

    def test_update_subtopic_thumbnail_filename(self) -> None:
        self.assertEqual(len(self.topic.subtopics), 1)
        self.assertEqual(
            self.topic.subtopics[0].thumbnail_filename, None)

        # Test Exception when the thumbnail is not found in filesystem.
        with self.assertRaisesRegex(
            Exception,
            'The thumbnail %s for subtopic with topic_id %s does not exist '
            'in the filesystem.' % ('new_image.svg', self.TOPIC_ID)
        ):
            topic_services.update_subtopic_thumbnail_filename(
                self.topic, 1, 'new_image.svg')

        # Test successful update of thumbnail_filename when the thumbnail
        # is found in the filesystem.
        with utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'test_svg.svg'),
            'rb',
            encoding=None
        ) as f:
            raw_image = f.read()
        fs = fs_services.GcsFileSystem(feconf.ENTITY_TYPE_TOPIC, self.TOPIC_ID)
        fs.commit(
            'thumbnail/new_image.svg', raw_image, mimetype='image/svg+xml')
        topic_services.update_subtopic_thumbnail_filename(
            self.topic, 1, 'new_image.svg')
        self.assertEqual(
            self.topic.subtopics[0].thumbnail_filename, 'new_image.svg')
        self.assertEqual(
            self.topic.subtopics[0].thumbnail_size_in_bytes, len(raw_image))

    def test_get_topic_id_to_diagnostic_test_skill_ids(self) -> None:
        fractions_id = topic_fetchers.get_new_topic_id()
        self.save_new_topic(
            fractions_id, self.user_id, name='Fractions',
            url_fragment='fractions', description='Description of fraction',
            canonical_story_ids=[self.story_id_1, self.story_id_2],
            additional_story_ids=[self.story_id_3],
            uncategorized_skill_ids=[self.skill_id_1, self.skill_id_2],
            subtopics=[], next_subtopic_id=1)
        old_value: List[str] = []
        changelist = [
            topic_domain.TopicChange({
                'cmd': topic_domain.CMD_UPDATE_TOPIC_PROPERTY,
                'property_name': (
                    topic_domain.TOPIC_PROPERTY_SKILL_IDS_FOR_DIAGNOSTIC_TEST),
                'old_value': old_value,
                'new_value': [self.skill_id_1]
            })]
        topic_services.update_topic_and_subtopic_pages(
            self.user_id_admin, fractions_id, changelist,
            'Adds diagnostic test.')

        additions_id = topic_fetchers.get_new_topic_id()
        self.save_new_topic(
            additions_id, self.user_id, name='Additions',
            url_fragment='additions', description='Description of addition.',
            canonical_story_ids=[self.story_id_1, self.story_id_2],
            additional_story_ids=[self.story_id_3],
            uncategorized_skill_ids=[self.skill_id_1, self.skill_id_2],
            subtopics=[], next_subtopic_id=1)
        changelist = [
            topic_domain.TopicChange({
                'cmd': topic_domain.CMD_UPDATE_TOPIC_PROPERTY,
                'property_name': (
                    topic_domain.TOPIC_PROPERTY_SKILL_IDS_FOR_DIAGNOSTIC_TEST),
                'old_value': old_value,
                'new_value': [self.skill_id_2]
            })]
        topic_services.update_topic_and_subtopic_pages(
            self.user_id_admin, additions_id, changelist,
            'Adds diagnostic test.')

        expected_dict = {
            fractions_id: [self.skill_id_1],
            additions_id: [self.skill_id_2]
        }
        self.assertEqual(
            topic_services.get_topic_id_to_diagnostic_test_skill_ids(
                [fractions_id, additions_id]), expected_dict)

        error_msg = (
            'No corresponding topic models exist for these topic IDs: %s.'
            % (', '.join(['']))
        )
        with self.assertRaisesRegex(Exception, error_msg):
            topic_services.get_topic_id_to_diagnostic_test_skill_ids(
                [additions_id, 'incorrect_topic_id'])

    def test_get_topic_id_to_topic_name_dict(self) -> None:
        fractions_id = topic_fetchers.get_new_topic_id()
        self.save_new_topic(
            fractions_id, self.user_id, name='Fractions',
            url_fragment='fractions', description='Description of fraction',
            canonical_story_ids=[self.story_id_1, self.story_id_2],
            additional_story_ids=[self.story_id_3],
            uncategorized_skill_ids=[self.skill_id_1, self.skill_id_2],
            subtopics=[], next_subtopic_id=1)
        old_value: List[str] = []
        changelist = [
            topic_domain.TopicChange({
                'cmd': topic_domain.CMD_UPDATE_TOPIC_PROPERTY,
                'property_name': (
                    topic_domain.TOPIC_PROPERTY_SKILL_IDS_FOR_DIAGNOSTIC_TEST),
                'old_value': old_value,
                'new_value': [self.skill_id_1]
            })]
        topic_services.update_topic_and_subtopic_pages(
            self.user_id_admin, fractions_id, changelist,
            'Adds diagnostic test.')

        additions_id = topic_fetchers.get_new_topic_id()
        self.save_new_topic(
            additions_id, self.user_id, name='Additions',
            url_fragment='additions', description='Description of addition.',
            canonical_story_ids=[self.story_id_1, self.story_id_2],
            additional_story_ids=[self.story_id_3],
            uncategorized_skill_ids=[self.skill_id_1, self.skill_id_2],
            subtopics=[], next_subtopic_id=1)
        changelist = [
            topic_domain.TopicChange({
                'cmd': topic_domain.CMD_UPDATE_TOPIC_PROPERTY,
                'property_name': (
                    topic_domain.TOPIC_PROPERTY_SKILL_IDS_FOR_DIAGNOSTIC_TEST),
                'old_value': old_value,
                'new_value': [self.skill_id_2]
            })]
        topic_services.update_topic_and_subtopic_pages(
            self.user_id_admin, additions_id, changelist,
            'Adds diagnostic test.')

        expected_dict = {
            fractions_id: 'Fractions',
            additions_id: 'Additions'
        }
        self.assertEqual(
            topic_services.get_topic_id_to_topic_name_dict(
                [fractions_id, additions_id]), expected_dict)

        error_msg = (
            'No corresponding topic models exist for these topic IDs: %s.'
            % (', '.join(['']))
        )
        with self.assertRaisesRegex(Exception, error_msg):
            topic_services.get_topic_id_to_topic_name_dict(
                [additions_id, 'incorrect_topic_id'])


# TODO(#7009): Remove this mock class and the SubtopicMigrationTests class
# once the actual functions for subtopic migrations are implemented.
class MockTopicObject(topic_domain.Topic):
    """Mocks Topic domain object."""

    @classmethod
    def _convert_story_reference_v1_dict_to_v2_dict(
        cls, story_reference: topic_domain.StoryReferenceDict
    ) -> topic_domain.StoryReferenceDict:
        """Converts v1 story reference dict to v2."""
        return story_reference


class SubtopicMigrationTests(test_utils.GenericTestBase):

    def test_migrate_subtopic_to_latest_schema(self) -> None:
        topic_services.create_new_topic_rights('topic_id', 'user_id_admin')
        commit_cmd = topic_domain.TopicChange({
            'cmd': topic_domain.CMD_CREATE_NEW,
            'name': 'name'
        })
        subtopic_v1_dict = {
            'id': 1,
            'title': 'subtopic_title',
            'skill_ids': []
        }
        subtopic_v4_dict: Dict[str, Union[str, int, Optional[List[str]]]] = {
            'id': 1,
            'thumbnail_filename': None,
            'thumbnail_bg_color': None,
            'thumbnail_size_in_bytes': None,
            'title': 'subtopic_title',
            'skill_ids': [],
            'url_fragment': 'subtopictitle'
        }
        model = topic_models.TopicModel(
            id='topic_id',
            name='name',
            abbreviated_name='abbrev',
            url_fragment='name-eight',
            canonical_name='Name',
            description='description1',
            next_subtopic_id=1,
            language_code='en',
            subtopics=[subtopic_v1_dict],
            subtopic_schema_version=1,
            story_reference_schema_version=1,
            page_title_fragment_for_web='fragm'
        )
        commit_cmd_dicts = [commit_cmd.to_dict()]
        model.commit(
            'user_id_admin', 'topic model created', commit_cmd_dicts)

        swap_topic_object = self.swap(topic_domain, 'Topic', MockTopicObject)
        current_schema_version_swap = self.swap(
            feconf, 'CURRENT_SUBTOPIC_SCHEMA_VERSION', 4)

        with swap_topic_object, current_schema_version_swap:
            topic = topic_fetchers.get_topic_from_model(model)

        self.assertEqual(topic.subtopic_schema_version, 4)
        self.assertEqual(topic.name, 'name')
        self.assertEqual(topic.canonical_name, 'name')
        self.assertEqual(topic.next_subtopic_id, 1)
        self.assertEqual(topic.language_code, 'en')
        self.assertEqual(len(topic.subtopics), 1)
        self.assertEqual(topic.subtopics[0].to_dict(), subtopic_v4_dict)


class StoryReferenceMigrationTests(test_utils.GenericTestBase):

    def test_migrate_story_reference_to_latest_schema(self) -> None:
        topic_services.create_new_topic_rights('topic_id', 'user_id_admin')
        commit_cmd = topic_domain.TopicChange({
            'cmd': topic_domain.CMD_CREATE_NEW,
            'name': 'name'
        })
        story_reference_dict = {
            'story_id': 'story_id',
            'story_is_published': False
        }
        model = topic_models.TopicModel(
            id='topic_id',
            name='name',
            abbreviated_name='abbrev',
            url_fragment='name-nine',
            canonical_name='Name',
            description='description1',
            next_subtopic_id=1,
            language_code='en',
            subtopics=[],
            subtopic_schema_version=1,
            story_reference_schema_version=1,
            canonical_story_references=[story_reference_dict],
            page_title_fragment_for_web='fragm'
        )
        commit_cmd_dicts = [commit_cmd.to_dict()]
        model.commit(
            'user_id_admin', 'topic model created', commit_cmd_dicts)

        swap_topic_object = self.swap(topic_domain, 'Topic', MockTopicObject)
        current_schema_version_swap = self.swap(
            feconf, 'CURRENT_STORY_REFERENCE_SCHEMA_VERSION', 2)

        with swap_topic_object, current_schema_version_swap:
            topic = topic_fetchers.get_topic_from_model(model)

        self.assertEqual(topic.story_reference_schema_version, 2)
        self.assertEqual(topic.name, 'name')
        self.assertEqual(topic.canonical_name, 'name')
        self.assertEqual(topic.next_subtopic_id, 1)
        self.assertEqual(topic.language_code, 'en')
        self.assertEqual(len(topic.canonical_story_references), 1)
        self.assertEqual(
            topic.canonical_story_references[0].to_dict(), story_reference_dict)
