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

"""Tests for the topic editor page."""

from __future__ import annotations

import datetime
import os

from core import feature_flag_list
from core import feconf
from core import utils
from core.constants import constants
from core.domain import platform_parameter_list
from core.domain import skill_services
from core.domain import story_domain
from core.domain import story_fetchers
from core.domain import story_services
from core.domain import topic_domain
from core.domain import topic_fetchers
from core.domain import topic_services
from core.domain import user_services
from core.tests import test_utils

from typing import List


class BaseTopicEditorControllerTests(test_utils.GenericTestBase):

    def setUp(self) -> None:
        """Completes the sign-up process for the various users."""
        super().setUp()
        self.signup(self.TOPIC_MANAGER_EMAIL, self.TOPIC_MANAGER_USERNAME)
        self.signup(self.NEW_USER_EMAIL, self.NEW_USER_USERNAME)
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)

        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)
        self.topic_manager_id = self.get_user_id_from_email(
            self.TOPIC_MANAGER_EMAIL)
        self.new_user_id = self.get_user_id_from_email(
            self.NEW_USER_EMAIL)

        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])

        self.topic_manager = user_services.get_user_actions_info(
            self.topic_manager_id)
        self.admin = user_services.get_user_actions_info(self.admin_id)
        self.new_user = user_services.get_user_actions_info(self.new_user_id)
        self.skill_id = skill_services.get_new_skill_id()
        self.save_new_skill(
            self.skill_id, self.admin_id, description='Skill Description')
        self.skill_id_2 = skill_services.get_new_skill_id()
        self.save_new_skill(
            self.skill_id_2, self.admin_id, description='Skill Description 2')
        self.topic_id = topic_fetchers.get_new_topic_id()
        self.topic_id_with_no_classroom = topic_fetchers.get_new_topic_id()
        self.save_new_topic(
            self.topic_id, self.admin_id, name='Name',
            abbreviated_name='topic-one', url_fragment='topic-one',
            description='Description', canonical_story_ids=[],
            additional_story_ids=[],
            uncategorized_skill_ids=[self.skill_id, self.skill_id_2],
            subtopics=[], next_subtopic_id=1)
        self.save_new_topic(
            self.topic_id_with_no_classroom, self.admin_id, name='New-Topic',
            abbreviated_name='new-topic', url_fragment='new-topic',
            description='Description', canonical_story_ids=[],
            additional_story_ids=[],
            uncategorized_skill_ids=[self.skill_id, self.skill_id_2],
            subtopics=[], next_subtopic_id=1)
        old_value: List[str] = []
        changelist = [topic_domain.TopicChange({
            'cmd': topic_domain.CMD_ADD_SUBTOPIC,
            'title': 'Title',
            'subtopic_id': 1,
            'url_fragment': 'dummy-subtopic'
        }), topic_domain.TopicChange({
            'cmd': topic_domain.CMD_MOVE_SKILL_ID_TO_SUBTOPIC,
            'old_subtopic_id': None,
            'new_subtopic_id': 1,
            'skill_id': self.skill_id
        }), topic_domain.TopicChange({
            'cmd': topic_domain.CMD_UPDATE_TOPIC_PROPERTY,
            'property_name': (
                topic_domain.TOPIC_PROPERTY_SKILL_IDS_FOR_DIAGNOSTIC_TEST),
            'old_value': old_value,
            'new_value': [self.skill_id]
        })]
        topic_services.update_topic_and_subtopic_pages(
            self.admin_id, self.topic_id, changelist, 'Added subtopic.')
        topic_services.update_topic_and_subtopic_pages(
            self.admin_id, self.topic_id_with_no_classroom, changelist,
            'Added subtopic.'
        )

        self.set_topic_managers([self.TOPIC_MANAGER_USERNAME], self.topic_id)
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        self.save_new_valid_classroom(
            topic_id_to_prerequisite_topic_ids={
                self.topic_id: []
            }
        )
        self.logout()


class TopicEditorStoryHandlerTests(BaseTopicEditorControllerTests):

    @test_utils.enable_feature_flags([
        feature_flag_list.FeatureNames
        .SERIAL_CHAPTER_LAUNCH_CURRICULUM_ADMIN_VIEW
    ])
    def test_handler_updates_story_summary_dicts(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        self.save_new_valid_exploration(
            'exp-1', self.admin_id, title='Title 1', end_state_name='End')
        self.publish_exploration(self.admin_id, 'exp-1')
        self.save_new_valid_exploration(
            'exp-2', self.admin_id, title='Title 2', end_state_name='End')
        self.publish_exploration(self.admin_id, 'exp-2')
        self.save_new_valid_exploration(
            'exp-3', self.admin_id, title='Title 3', end_state_name='End')
        self.publish_exploration(self.admin_id, 'exp-3')

        topic_id = topic_fetchers.get_new_topic_id()
        canonical_story_id_1 = story_services.get_new_story_id()
        canonical_story_id_2 = story_services.get_new_story_id()
        canonical_story_id_3 = story_services.get_new_story_id()
        additional_story_id = story_services.get_new_story_id()

        # 'self.topic_id' does not contain any canonical_story_summary_dicts
        # or additional_story_summary_dicts.
        response = self.get_json(
            '%s/%s' % (feconf.TOPIC_EDITOR_STORY_URL, self.topic_id))
        story = story_domain.Story.create_default_story(
            canonical_story_id_1, 'title', 'description', topic_id,
            'url-fragment')
        story.meta_tag_content = 'story meta content'
        node_1: story_domain.StoryNodeDict = {
            'outline': 'outline',
            'exploration_id': 'exp-1',
            'destination_node_ids': [],
            'outline_is_finalized': False,
            'acquired_skill_ids': [],
            'id': 'node_1',
            'title': 'Chapter 1',
            'description': '',
            'prerequisite_skill_ids': [],
            'thumbnail_filename': 'image.svg',
            'thumbnail_bg_color': constants.ALLOWED_THUMBNAIL_BG_COLORS[
                'chapter'][0],
            'thumbnail_size_in_bytes': 21131,
            'status': constants.STORY_NODE_STATUS_PUBLISHED,
            'planned_publication_date_msecs': None,
            'first_publication_date_msecs': 1672684200000.0,
            'last_modified_msecs': 1672684200000.0,
            'unpublishing_reason': None
        }
        node_2: story_domain.StoryNodeDict = {
            'outline': 'outline',
            'exploration_id': 'exp-2',
            'destination_node_ids': [],
            'outline_is_finalized': False,
            'acquired_skill_ids': [],
            'id': 'node_2',
            'title': 'Chapter 2',
            'description': '',
            'prerequisite_skill_ids': [],
            'thumbnail_filename': 'image.svg',
            'thumbnail_bg_color': constants.ALLOWED_THUMBNAIL_BG_COLORS[
                'chapter'][0],
            'thumbnail_size_in_bytes': 21131,
            'status': constants.STORY_NODE_STATUS_DRAFT,
            'planned_publication_date_msecs': 1672770600000.0,
            'first_publication_date_msecs': None,
            'last_modified_msecs': 1672684200000.0,
            'unpublishing_reason': None
        }
        node_3: story_domain.StoryNodeDict = {
            'outline': 'outline',
            'exploration_id': 'exp-3',
            'destination_node_ids': [],
            'outline_is_finalized': False,
            'acquired_skill_ids': [],
            'id': 'node_3',
            'title': 'Chapter 3',
            'description': '',
            'prerequisite_skill_ids': [],
            'thumbnail_filename': 'image.svg',
            'thumbnail_bg_color': constants.ALLOWED_THUMBNAIL_BG_COLORS[
                'chapter'][0],
            'thumbnail_size_in_bytes': 21131,
            'status': constants.STORY_NODE_STATUS_READY_TO_PUBLISH,
            'planned_publication_date_msecs': 1690655400000.0,
            'first_publication_date_msecs': None,
            'last_modified_msecs': 1672684200000.0,
            'unpublishing_reason': None
        }
        story.story_contents.nodes = [
            story_domain.StoryNode.from_dict(node_1),
            story_domain.StoryNode.from_dict(node_2),
            story_domain.StoryNode.from_dict(node_3)
        ]
        story.story_contents.initial_node_id = 'node_1'
        story.story_contents.next_node_id = 'node_4'

        self.assertEqual(response['canonical_story_summary_dicts'], [])
        self.assertEqual(response['additional_story_summary_dicts'], [])

        self.save_new_topic(
            topic_id, self.admin_id, name='New name',
            abbreviated_name='topic-two', url_fragment='topic-two',
            description='New description',
            canonical_story_ids=[canonical_story_id_1, canonical_story_id_2,
                canonical_story_id_3],
            additional_story_ids=[additional_story_id],
            uncategorized_skill_ids=[self.skill_id],
            subtopics=[], next_subtopic_id=1)

        story_services.save_new_story(self.admin_id, story)
        self.save_new_story(
            canonical_story_id_2,
            self.admin_id,
            topic_id,
            title='title 2',
            description='description 2',
            notes='note 2'
        )
        self.save_new_story(
            additional_story_id,
            self.admin_id,
            topic_id,
            title='another title',
            description='another description',
            notes='another note'
        )

        story_summary = story_domain.StorySummary(
            story_id=canonical_story_id_3,
            title='title 3',
            description='description 3',
            language_code='en',
            version=1,
            node_titles=[],
            thumbnail_bg_color=constants.ALLOWED_THUMBNAIL_BG_COLORS[
                'story'][0],
            thumbnail_filename='img.svg',
            url_fragment='url',
            story_model_created_on=datetime.datetime.today(),
            story_model_last_updated=datetime.datetime.today()
        )
        story_services.save_story_summary(story_summary)

        topic_services.publish_story(
            topic_id, canonical_story_id_1, self.admin_id)
        topic_services.publish_story(
            topic_id, canonical_story_id_2, self.admin_id)

        def mock_get_current_time_in_millisecs() -> int:
            return 1690555400000

        with self.swap(
            utils, 'get_current_time_in_millisecs',
            mock_get_current_time_in_millisecs):
            response = self.get_json(
                '%s/%s' % (feconf.TOPIC_EDITOR_STORY_URL, topic_id))
            canonical_story_summary_dict = response[
                'canonical_story_summary_dicts'][0]
            additional_story_summary_dict = response[
                'additional_story_summary_dicts'][0]

            self.assertEqual(
                canonical_story_summary_dict['description'], 'description')
            self.assertEqual(canonical_story_summary_dict['title'], 'title')
            self.assertEqual(
                canonical_story_summary_dict['id'], canonical_story_id_1)
            self.assertEqual(
                canonical_story_summary_dict['story_is_published'], True)
            self.assertEqual(
                canonical_story_summary_dict['total_chapters_count'], 3)
            self.assertEqual(
                canonical_story_summary_dict['published_chapters_count'], 1)
            self.assertEqual(
                canonical_story_summary_dict['upcoming_chapters_count'], 1)
            self.assertEqual(
                canonical_story_summary_dict['overdue_chapters_count'], 1)

            self.assertEqual(
                additional_story_summary_dict['description'],
                'another description')
            self.assertEqual(
                additional_story_summary_dict['title'], 'another title')
            self.assertEqual(
                additional_story_summary_dict['id'], additional_story_id)
            self.assertEqual(
                additional_story_summary_dict['story_is_published'], False)

        self.logout()

    def test_story_creation_with_valid_description(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()
        payload = {
            'title': 'Story title',
            'description': 'Story Description',
            'filename': 'test_svg.svg',
            'thumbnailBgColor': '#F8BF74',
            'story_url_fragment': 'story-frag-one'
        }

        with utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'test_svg.svg'), 'rb',
            encoding=None
        ) as f:
            raw_image = f.read()

        json_response = self.post_json(
            '%s/%s' % (feconf.TOPIC_EDITOR_STORY_URL, self.topic_id), payload,
            csrf_token=csrf_token,
            upload_files=[('image', 'unused_filename', raw_image)])

        story_id = json_response['storyId']
        self.assertEqual(len(story_id), 12)
        self.assertIsNotNone(
            story_fetchers.get_story_by_id(story_id, strict=False))
        self.logout()

    def test_story_creation_with_invalid_description(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()
        payload = {
            'title': 'Story title',
            'description': 'Story Description' * 60,
            'filename': 'test_svg.svg',
            'thumbnailBgColor': '#F8BF74',
            'story_url_fragment': 'story-frag-one'
        }

        with utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'test_svg.svg'), 'rb',
            encoding=None
        ) as f:
            raw_image = f.read()

        json_response = self.post_json(
            '%s/%s' % (feconf.TOPIC_EDITOR_STORY_URL, self.topic_id), payload,
            csrf_token=csrf_token,
            upload_files=[('image', 'unused_filename', raw_image)],
            expected_status_int=400)

        invalid_description = 'Story Description' * 60
        self.assertIn(
            'Schema validation for \'description\' failed: '
            'Validation failed: has_length_at_most '
            f'({{\'max_value\': {constants.MAX_CHARS_IN_STORY_DESCRIPTION}}}) '
            f'for object {invalid_description}',
            json_response['error'],
        )

        self.logout()

    def test_story_creation_fails_with_invalid_image(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()
        payload = {
            'title': 'Story title',
            'description': 'Story Description',
            'filename': 'cafe.flac',
            'thumbnailBgColor': '#F8BF74',
            'story_url_fragment': 'story-frag-two'
        }

        with utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'cafe.flac'), 'rb',
            encoding=None
        ) as f:
            raw_image = f.read()

        json_response = self.post_json(
            '%s/%s' % (feconf.TOPIC_EDITOR_STORY_URL, self.topic_id), payload,
            csrf_token=csrf_token,
            upload_files=[('image', 'unused_filename', raw_image)],
            expected_status_int=400)

        self.assertEqual(
            json_response['error'], 'Image exceeds file size limit of 100 KB.')

    def test_story_creation_fails_with_duplicate_story_url_fragment(
        self
    ) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()
        payload = {
            'title': 'Story title',
            'description': 'Story Description',
            'filename': 'test_svg.svg',
            'thumbnailBgColor': '#F8BF74',
            'story_url_fragment': 'original'
        }
        self.save_new_story(
            story_services.get_new_story_id(),
            self.admin_id,
            topic_fetchers.get_new_topic_id(),
            title='title',
            description='description',
            notes='note',
            url_fragment='original'
        )

        with utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'test_svg.svg'), 'rb',
            encoding=None
        ) as f:
            raw_image = f.read()

        json_response = self.post_json(
            '%s/%s' % (feconf.TOPIC_EDITOR_STORY_URL, self.topic_id), payload,
            csrf_token=csrf_token,
            upload_files=[('image', 'unused_filename', raw_image)],
            expected_status_int=400)

        self.assertEqual(
            json_response['error'],
            'Story url fragment is not unique across the site.')


class SubtopicPageEditorTests(BaseTopicEditorControllerTests):

    def test_get_can_not_access_handler_with_invalid_topic_id(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)

        self.get_json(
            '%s/%s/%s' % (
                feconf.SUBTOPIC_PAGE_EDITOR_DATA_URL_PREFIX,
                self.topic_id, topic_fetchers.get_new_topic_id()),
            expected_status_int=404)

        self.logout()

    def test_editable_subtopic_page_get(self) -> None:
        # Check that non-admins and non-topic managers cannot access the
        # editable subtopic data.
        self.login(self.NEW_USER_EMAIL)
        self.get_json(
            '%s/%s/%s' % (
                feconf.SUBTOPIC_PAGE_EDITOR_DATA_URL_PREFIX,
                self.topic_id, 1), expected_status_int=401)
        self.logout()

        # Check that topic managers not assigned to this topic can
        # access its subtopic pages.
        self.login(self.TOPIC_MANAGER_EMAIL)
        json_response = self.get_json(
            '%s/%s/%s' % (
                feconf.SUBTOPIC_PAGE_EDITOR_DATA_URL_PREFIX,
                self.topic_id, 1))
        self.assertEqual({
            'subtitled_html': {
                'html': '',
                'content_id': 'content'
            },
            'recorded_voiceovers': {
                'voiceovers_mapping': {
                    'content': {}
                }
            },
            'written_translations': {
                'translations_mapping': {
                    'content': {}
                }
            }
        }, json_response['subtopic_page']['page_contents'])
        self.logout()

        # Check that topic managers can access the subtopic page.
        self.login(self.TOPIC_MANAGER_EMAIL)
        json_response = self.get_json(
            '%s/%s/%s' % (
                feconf.SUBTOPIC_PAGE_EDITOR_DATA_URL_PREFIX,
                self.topic_id, 1))
        self.assertEqual({
            'subtitled_html': {
                'html': '',
                'content_id': 'content'
            },
            'recorded_voiceovers': {
                'voiceovers_mapping': {
                    'content': {}
                }
            },
            'written_translations': {
                'translations_mapping': {
                    'content': {}
                }
            },
        }, json_response['subtopic_page']['page_contents'])
        self.logout()

        # Check that admins can access the editable subtopic data.
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        json_response = self.get_json(
            '%s/%s/%s' % (
                feconf.SUBTOPIC_PAGE_EDITOR_DATA_URL_PREFIX,
                self.topic_id, 1))
        self.assertEqual({
            'subtitled_html': {
                'html': '',
                'content_id': 'content'
            },
            'recorded_voiceovers': {
                'voiceovers_mapping': {
                    'content': {}
                }
            },
            'written_translations': {
                'translations_mapping': {
                    'content': {}
                }
            }
        }, json_response['subtopic_page']['page_contents'])
        self.logout()


class TopicEditorTests(
        BaseTopicEditorControllerTests, test_utils.EmailTestBase):

    @test_utils.set_platform_parameters(
        [(platform_parameter_list.ParamName.SERVER_CAN_SEND_EMAILS, True)]
    )
    def test_editable_topic_handler_get(self) -> None:
        skill_services.delete_skill(self.admin_id, self.skill_id_2)
        # Check that non-admins cannot access the editable topic data.
        self.login(self.NEW_USER_EMAIL)
        self.get_json(
            '%s/%s' % (
                feconf.TOPIC_EDITOR_DATA_URL_PREFIX, self.topic_id),
            expected_status_int=401)
        self.logout()

        # Check that admins can access the editable topic data.
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        messages = self._get_sent_email_messages(
            feconf.ADMIN_EMAIL_ADDRESS)
        self.assertEqual(len(messages), 0)
        json_response = self.get_json(
            '%s/%s' % (
                feconf.TOPIC_EDITOR_DATA_URL_PREFIX, self.topic_id))
        self.assertEqual(self.topic_id, json_response['topic_dict']['id'])
        self.assertTrue(
            self.skill_id in json_response['skill_question_count_dict'])
        self.assertEqual(
            json_response['skill_question_count_dict'][self.skill_id], 0)
        self.assertTrue(
            self.skill_id_2 in json_response['skill_question_count_dict'])
        self.assertEqual(
            json_response['skill_question_count_dict'][self.skill_id_2], 0)
        self.assertEqual(
            'Skill Description',
            json_response['skill_id_to_description_dict'][self.skill_id])

        messages = self._get_sent_email_messages(
            feconf.ADMIN_EMAIL_ADDRESS)
        expected_email_html_body = (
            'The deleted skills: %s are still'
            ' present in topic with id %s' % (
                self.skill_id_2, self.topic_id))
        self.assertEqual(len(messages), 2)
        self.assertIn(expected_email_html_body, messages[0].html)

        self.logout()

        # Check that editable topic handler is accessed only when a topic id
        # passed has an associated topic.
        self.login(self.CURRICULUM_ADMIN_EMAIL)

        self.get_json(
            '%s/%s' % (
                feconf.TOPIC_EDITOR_DATA_URL_PREFIX,
                topic_fetchers.get_new_topic_id()), expected_status_int=404)

        self.logout()

    def test_editable_topic_handler_put_fails_with_long_commit_message(
        self
    ) -> None:
        commit_msg = 'a' * (constants.MAX_COMMIT_MESSAGE_LENGTH + 1)
        change_cmd = {
            'version': 2,
            'commit_message': commit_msg,
            'topic_and_subtopic_page_change_dicts': [{
                'cmd': 'update_topic_property',
                'property_name': 'name',
                'old_value': '',
                'new_value': 0
            }]
        }
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()

        json_response = self.put_json(
            '%s/%s' % (
                feconf.TOPIC_EDITOR_DATA_URL_PREFIX, self.topic_id),
            change_cmd, csrf_token=csrf_token, expected_status_int=400)
        self.assertIn(
            'Schema validation for \'commit_message\' failed: '
            'Validation failed: has_length_at_most '
            f'({{\'max_value\': {constants.MAX_COMMIT_MESSAGE_LENGTH}}}) '
            f'for object {commit_msg}',
            json_response['error'],
        )

    def test_editable_topic_handler_put_raises_error_with_invalid_name(
        self
    ) -> None:
        change_cmd = {
            'version': 2,
            'commit_message': 'Changed name',
            'topic_and_subtopic_page_change_dicts': [{
                'cmd': 'update_topic_property',
                'property_name': 'name',
                'old_value': '',
                'new_value': 0
            }]
        }
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()

        json_response = self.put_json(
            '%s/%s' % (
                feconf.TOPIC_EDITOR_DATA_URL_PREFIX, self.topic_id),
            change_cmd, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(json_response['error'], 'Name should be a string.')

    @test_utils.set_platform_parameters(
        [(platform_parameter_list.ParamName.SERVER_CAN_SEND_EMAILS, True)]
    )
    def test_editable_topic_handler_put(self) -> None:
        # Check that admins can edit a topic.
        change_cmd = {
            'version': 2,
            'commit_message': 'Some changes and added a subtopic.',
            'topic_and_subtopic_page_change_dicts': [{
                'cmd': 'update_topic_property',
                'property_name': 'name',
                'old_value': '',
                'new_value': 'A new name'
            }, {
                'cmd': 'update_subtopic_page_property',
                'property_name': 'page_contents_html',
                'old_value': {
                    'html': '',
                    'content_id': 'content'
                },
                'subtopic_id': 1,
                'new_value': {
                    'html': '<p>New Data</p>',
                    'content_id': 'content'
                }
            }, {
                'cmd': 'update_subtopic_property',
                'property_name': 'url_fragment',
                'new_value': 'subtopic-one',
                'old_value': '',
                'subtopic_id': 1
            }, {
                'cmd': 'add_subtopic',
                'subtopic_id': 2,
                'title': 'Title2',
                'url_fragment': 'subtopic-fragment-two'
            }, {
                'cmd': 'update_subtopic_property',
                'property_name': 'url_fragment',
                'new_value': 'subtopic-two',
                'old_value': '',
                'subtopic_id': 2
            }, {
                'cmd': 'update_subtopic_page_property',
                'property_name': 'page_contents_html',
                'old_value': {
                    'html': '',
                    'content_id': 'content'
                },
                'new_value': {
                    'html': '<p>New Value</p>',
                    'content_id': 'content'
                },
                'subtopic_id': 2
            }, {
                'cmd': 'update_subtopic_page_property',
                'property_name': 'page_contents_audio',
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
                                'duration_secs': 0.34342
                            }
                        }
                    }
                },
                'subtopic_id': 2
            }]
        }
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()
        skill_services.delete_skill(self.admin_id, self.skill_id_2)

        messages = self._get_sent_email_messages(
            feconf.ADMIN_EMAIL_ADDRESS)
        self.assertEqual(len(messages), 0)
        json_response = self.put_json(
            '%s/%s' % (
                feconf.TOPIC_EDITOR_DATA_URL_PREFIX, self.topic_id),
            change_cmd, csrf_token=csrf_token)
        self.assertEqual(self.topic_id, json_response['topic_dict']['id'])
        self.assertEqual('A new name', json_response['topic_dict']['name'])
        self.assertEqual(2, len(json_response['topic_dict']['subtopics']))
        self.assertEqual(
            'Skill Description',
            json_response['skill_id_to_description_dict'][self.skill_id])

        messages = self._get_sent_email_messages(
            feconf.ADMIN_EMAIL_ADDRESS)
        expected_email_html_body = (
            'The deleted skills: %s are still'
            ' present in topic with id %s' % (
                self.skill_id_2, self.topic_id))
        self.assertEqual(len(messages), 1)
        self.assertIn(expected_email_html_body, messages[0].html)

        # Test if the corresponding subtopic pages were created.
        json_response = self.get_json(
            '%s/%s/%s' % (
                feconf.SUBTOPIC_PAGE_EDITOR_DATA_URL_PREFIX,
                self.topic_id, 1))
        self.assertEqual({
            'subtitled_html': {
                'html': '<p>New Data</p>',
                'content_id': 'content'
            },
            'recorded_voiceovers': {
                'voiceovers_mapping': {
                    'content': {}
                }
            },
            'written_translations': {
                'translations_mapping': {
                    'content': {}
                }
            }
        }, json_response['subtopic_page']['page_contents'])
        json_response = self.get_json(
            '%s/%s/%s' % (
                feconf.SUBTOPIC_PAGE_EDITOR_DATA_URL_PREFIX,
                self.topic_id, 2))
        self.assertEqual({
            'subtitled_html': {
                'html': '<p>New Value</p>',
                'content_id': 'content'
            },
            'recorded_voiceovers': {
                'voiceovers_mapping': {
                    'content': {
                        'en': {
                            'file_size_bytes': 100,
                            'filename': 'test.mp3',
                            'needs_update': False,
                            'duration_secs': 0.34342
                        }
                    }
                }
            },
            'written_translations': {
                'translations_mapping': {
                    'content': {}
                }
            }
        }, json_response['subtopic_page']['page_contents'])
        self.logout()

        # Test that any topic manager cannot edit the topic.
        self.login(self.TOPIC_MANAGER_EMAIL)
        self.put_json(
            '%s/%s' % (
                feconf.TOPIC_EDITOR_DATA_URL_PREFIX, self.topic_id),
            change_cmd, csrf_token=csrf_token, expected_status_int=401)
        self.logout()

        # Check that non-admins and non-topic managers cannot edit a topic.
        self.put_json(
            '%s/%s' % (
                feconf.TOPIC_EDITOR_DATA_URL_PREFIX, self.topic_id),
            change_cmd, csrf_token=csrf_token, expected_status_int=401)

        # Check that topic can not be edited when version is None.
        self.login(self.CURRICULUM_ADMIN_EMAIL)

        json_response = self.put_json(
            '%s/%s' % (
                feconf.TOPIC_EDITOR_DATA_URL_PREFIX, self.topic_id),
            {
                'version': None,
                'commit_message': 'Some changes and added a subtopic.',
                'topic_and_subtopic_page_change_dicts': [{
                    'cmd': 'update_topic_property',
                    'property_name': 'name',
                    'old_value': '',
                    'new_value': 'A new name'
                }]
            }, csrf_token=csrf_token,
            expected_status_int=400)

        self.assertIn(
            'Missing key in handler args: version.',
            json_response['error'],
        )

        self.logout()

        # Check topic can not be edited when payload version differs from
        # topic version.
        self.login(self.CURRICULUM_ADMIN_EMAIL)

        topic_id_1 = topic_fetchers.get_new_topic_id()
        self.save_new_topic(
            topic_id_1, self.admin_id, name='Name 1',
            abbreviated_name='topic-three', url_fragment='topic-three',
            description='Description 1', canonical_story_ids=[],
            additional_story_ids=[],
            uncategorized_skill_ids=[self.skill_id],
            subtopics=[], next_subtopic_id=1)

        json_response = self.put_json(
            '%s/%s' % (
                feconf.TOPIC_EDITOR_DATA_URL_PREFIX, topic_id_1),
            {
                'version': 3,
                'commit_message': 'Some changes and added a subtopic.',
                'topic_and_subtopic_page_change_dicts': [{
                    'cmd': 'update_topic_property',
                    'property_name': 'name',
                    'old_value': '',
                    'new_value': 'A new name'
                }]
            }, csrf_token=csrf_token,
            expected_status_int=400)

        self.assertEqual(
            json_response['error'],
            'Trying to update version 1 of topic from version 3, '
            'which is too old. Please reload the page and try again.')

        self.logout()

    def test_editable_topic_handler_put_for_assigned_topic_manager(
        self
    ) -> None:
        change_cmd = {
            'version': 2,
            'commit_message': 'Some changes and added a subtopic.',
            'topic_and_subtopic_page_change_dicts': [{
                'cmd': 'update_topic_property',
                'property_name': 'name',
                'old_value': '',
                'new_value': 'A new name'
            }, {
                'cmd': 'update_subtopic_page_property',
                'property_name': 'page_contents_html',
                'old_value': {
                    'html': '',
                    'content_id': 'content'
                },
                'subtopic_id': 1,
                'new_value': {
                    'html': '<p>New Data</p>',
                    'content_id': 'content'
                }
            }, {
                'cmd': 'update_subtopic_property',
                'property_name': 'url_fragment',
                'new_value': 'subtopic-one',
                'old_value': '',
                'subtopic_id': 1
            }, {
                'cmd': 'add_subtopic',
                'subtopic_id': 2,
                'title': 'Title2',
                'url_fragment': 'subtopic-frag-two'
            }, {
                'cmd': 'update_subtopic_property',
                'property_name': 'url_fragment',
                'new_value': 'subtopic-two',
                'old_value': '',
                'subtopic_id': 2
            }, {
                'cmd': 'update_subtopic_page_property',
                'property_name': 'page_contents_html',
                'old_value': {
                    'html': '',
                    'content_id': 'content'
                },
                'new_value': {
                    'html': '<p>New Value</p>',
                    'content_id': 'content'
                },
                'subtopic_id': 2
            }, {
                'cmd': 'update_subtopic_page_property',
                'property_name': 'page_contents_audio',
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
                                'duration_secs': 0.34342
                            }
                        }
                    }
                },
                'subtopic_id': 2
            }]
        }

        self.login(self.TOPIC_MANAGER_EMAIL)
        csrf_token = self.get_new_csrf_token()
        # Check that the topic manager can edit the topic now.
        json_response = self.put_json(
            '%s/%s' % (
                feconf.TOPIC_EDITOR_DATA_URL_PREFIX, self.topic_id),
            change_cmd, csrf_token=csrf_token)
        self.assertEqual(self.topic_id, json_response['topic_dict']['id'])
        self.assertEqual('A new name', json_response['topic_dict']['name'])
        self.assertEqual(2, len(json_response['topic_dict']['subtopics']))
        self.logout()

    def test_guest_can_not_delete_topic(self) -> None:
        response = self.delete_json(
            '%s/%s' % (
                feconf.TOPIC_EDITOR_DATA_URL_PREFIX, self.topic_id),
            expected_status_int=401)
        self.assertEqual(
            response['error'],
            'You must be logged in to access this resource.')

    def test_cannot_delete_invalid_topic(self) -> None:
        # Check that an invalid topic can not be deleted.
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        self.delete_json(
            '%s/%s' % (
                feconf.TOPIC_EDITOR_DATA_URL_PREFIX,
                'invalid_id'), expected_status_int=404)
        self.logout()

    def test_editable_topic_handler_delete(self) -> None:
        # Check that admins can delete a topic.
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        self.delete_json(
            '%s/%s' % (
                feconf.TOPIC_EDITOR_DATA_URL_PREFIX,
                self.topic_id_with_no_classroom
            ),
            expected_status_int=200)
        self.logout()

        # Check that non-admins cannot delete a topic.
        self.login(self.NEW_USER_EMAIL)
        self.delete_json(
            '%s/%s' % (
                feconf.TOPIC_EDITOR_DATA_URL_PREFIX,
                self.topic_id_with_no_classroom
            ),
            expected_status_int=401)
        self.logout()

        # Check that topic can not be deleted when the topic id passed does
        # not have a topic associated with it.
        self.login(self.CURRICULUM_ADMIN_EMAIL)

        self.delete_json(
            '%s/%s' % (
                feconf.TOPIC_EDITOR_DATA_URL_PREFIX,
                topic_fetchers.get_new_topic_id()), expected_status_int=404)

        self.logout()


class TopicPublishSendMailHandlerTests(
        BaseTopicEditorControllerTests, test_utils.EmailTestBase):

    @test_utils.set_platform_parameters(
        [(platform_parameter_list.ParamName.SERVER_CAN_SEND_EMAILS, True)]
    )
    def test_send_mail(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()

        self.put_json(
            '%s/%s' % (
                feconf.TOPIC_SEND_MAIL_URL_PREFIX, self.topic_id),
            {'topic_name': 'Topic Name'}, csrf_token=csrf_token)
        messages = self._get_sent_email_messages(
            feconf.ADMIN_EMAIL_ADDRESS)
        expected_email_html_body = (
            'wants to publish topic: Topic Name at URL %s/%s, please review'
            ' and publish if it looks good.'
            % (feconf.TOPIC_EDITOR_URL_PREFIX, self.topic_id))
        self.assertEqual(len(messages), 1)
        self.assertIn(expected_email_html_body, messages[0].html)


class TopicRightsHandlerTests(BaseTopicEditorControllerTests):

    def test_get_topic_rights(self) -> None:
        """Test the get topic rights functionality."""
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        # Test whether admin can access topic rights.
        json_response = self.get_json(
            '%s/%s' % (
                feconf.TOPIC_RIGHTS_URL_PREFIX, self.topic_id))
        self.assertEqual(json_response['published'], False)
        self.assertEqual(json_response['can_publish_topic'], True)
        self.logout()

        self.login(self.NEW_USER_EMAIL)
        # Test that other users cannot access topic rights.
        self.get_json(
            '%s/%s' % (
                feconf.TOPIC_RIGHTS_URL_PREFIX, self.topic_id),
            expected_status_int=401)
        self.logout()

    def test_can_not_get_topic_rights_when_topic_id_has_no_associated_topic(
        self
    ) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)

        json_response = self.get_json(
            '%s/%s' % (
                feconf.TOPIC_RIGHTS_URL_PREFIX,
                topic_fetchers.get_new_topic_id()), expected_status_int=400)
        self.assertEqual(
            json_response['error'],
            'Expected a valid topic id to be provided.')

        self.logout()


class TopicPublishHandlerTests(BaseTopicEditorControllerTests):

    def test_get_can_not_access_handler_with_invalid_publish_status(
        self
    ) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        invalid = 'invalid_status'
        csrf_token = self.get_new_csrf_token()
        response = self.put_json(
            '%s/%s' % (
                feconf.TOPIC_STATUS_URL_PREFIX, self.topic_id),
            {'publish_status': invalid}, csrf_token=csrf_token,
            expected_status_int=400)
        self.assertIn(
            'Schema validation for \'publish_status\' failed: '
            f'Expected bool, received {invalid}',
            response['error'],
        )

        self.logout()

    def test_publish_and_unpublish_topic(self) -> None:
        """Test the publish and unpublish functionality."""
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()
        # Test whether admin can publish and unpublish a topic.
        self.put_json(
            '%s/%s' % (
                feconf.TOPIC_STATUS_URL_PREFIX,
                self.topic_id_with_no_classroom
            ),
            {'publish_status': True}, csrf_token=csrf_token)
        topic_rights = topic_fetchers.get_topic_rights(
            self.topic_id_with_no_classroom)
        self.assertTrue(topic_rights.topic_is_published)

        self.put_json(
            '%s/%s' % (
                feconf.TOPIC_STATUS_URL_PREFIX,
                self.topic_id_with_no_classroom
            ),
            {'publish_status': False}, csrf_token=csrf_token)
        topic_rights = topic_fetchers.get_topic_rights(
            self.topic_id_with_no_classroom)
        self.assertFalse(topic_rights.topic_is_published)
        self.logout()

        self.login(self.NEW_USER_EMAIL)
        # Test that other users cannot access topic rights.
        self.put_json(
            '%s/%s' % (
                feconf.TOPIC_STATUS_URL_PREFIX,
                self.topic_id_with_no_classroom
            ),
            {'publish_status': False}, csrf_token=csrf_token,
            expected_status_int=401)

        self.logout()

    def test_get_can_not_access_handler_with_invalid_topic_id(
        self
    ) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)

        csrf_token = self.get_new_csrf_token()

        new_topic_id = topic_fetchers.get_new_topic_id()
        self.put_json(
            '%s/%s' % (
                feconf.TOPIC_STATUS_URL_PREFIX, new_topic_id),
            {'publish_status': True}, csrf_token=csrf_token,
            expected_status_int=404)

    def test_cannot_publish_a_published_exploration(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()
        self.put_json(
            '%s/%s' % (
                feconf.TOPIC_STATUS_URL_PREFIX, self.topic_id),
            {'publish_status': True}, csrf_token=csrf_token)
        topic_rights = topic_fetchers.get_topic_rights(self.topic_id)
        self.assertTrue(topic_rights.topic_is_published)

        response = self.put_json(
            '%s/%s' % (
                feconf.TOPIC_STATUS_URL_PREFIX, self.topic_id),
            {'publish_status': True}, csrf_token=csrf_token,
            expected_status_int=401)
        self.assertEqual(response['error'], 'The topic is already published.')

    def test_cannot_unpublish_an_unpublished_exploration(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()
        topic_rights = topic_fetchers.get_topic_rights(
            self.topic_id_with_no_classroom)
        self.assertFalse(topic_rights.topic_is_published)

        response = self.put_json(
            '%s/%s' % (
                feconf.TOPIC_STATUS_URL_PREFIX, self.topic_id_with_no_classroom
            ),
            {'publish_status': False}, csrf_token=csrf_token,
            expected_status_int=401)
        self.assertEqual(
            response['error'],
            'The topic is already unpublished.'
        )

    def test_cannot_unpublish_or_delete_topic_which_is_assigned_to_a_classroom(
            self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()
        self.put_json(
            '%s/%s' % (
                feconf.TOPIC_STATUS_URL_PREFIX, self.topic_id
            ),
            {'publish_status': True}, csrf_token=csrf_token
        )
        topic_rights = topic_fetchers.get_topic_rights(self.topic_id)
        self.assertTrue(topic_rights.topic_is_published)
        error_message = (
            'The topic is assigned to the math classroom. '
            'Contact the curriculum admins to remove it from '
            'the classroom first.'
        )

        response = self.put_json(
            '%s/%s' % (
                feconf.TOPIC_STATUS_URL_PREFIX, self.topic_id),
            {'publish_status': False}, csrf_token=csrf_token,
            expected_status_int=401)
        self.assertEqual(response['error'], error_message)

        response = self.delete_json(
            '%s/%s' % (
                feconf.TOPIC_EDITOR_DATA_URL_PREFIX, self.topic_id),
            expected_status_int=500)
        self.assertEqual(response['error'], error_message)


class TopicUrlFragmentHandlerTest(BaseTopicEditorControllerTests):
    """Tests for TopicUrlFragmentHandler."""

    def test_topic_url_fragment_handler_when_unique(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)

        topic_url_fragment = 'fragment'

        # Topic url fragment does not exist yet.
        json_response = self.get_json(
            '%s/%s' % (
                feconf.TOPIC_URL_FRAGMENT_HANDLER,
                topic_url_fragment))
        self.assertEqual(json_response['topic_url_fragment_exists'], False)

        # Publish the topic.
        self.save_new_topic(
            self.topic_id, self.admin_id, name='Topic Name',
            abbreviated_name='Topic Name',
            url_fragment=topic_url_fragment,
            description='Description', canonical_story_ids=[],
            additional_story_ids=[],
            uncategorized_skill_ids=[self.skill_id, self.skill_id_2],
            subtopics=[], next_subtopic_id=1)

        # Unique topic url fragment does not exist.
        topic_url_fragment = 'topic-fragment'

        json_response = self.get_json(
            '%s/%s' % (
                feconf.TOPIC_URL_FRAGMENT_HANDLER,
                topic_url_fragment))
        self.assertEqual(json_response['topic_url_fragment_exists'], False)

        self.logout()

    def test_topic_url_fragment_handler_when_duplicate(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)

        topic_url_fragment = 'fragment'

        # Topic url fragment does not exist yet.
        json_response = self.get_json(
            '%s/%s' % (
                feconf.TOPIC_URL_FRAGMENT_HANDLER,
                topic_url_fragment))
        self.assertEqual(json_response['topic_url_fragment_exists'], False)

        # Publish the topic.
        self.save_new_topic(
            self.topic_id, self.admin_id, name='Topic Name',
            abbreviated_name='Topic Name',
            url_fragment=topic_url_fragment,
            description='Description', canonical_story_ids=[],
            additional_story_ids=[],
            uncategorized_skill_ids=[self.skill_id, self.skill_id_2],
            subtopics=[], next_subtopic_id=1)

        # Topic url fragment exists since we've already published it.
        json_response = self.get_json(
            '%s/%s' % (
                feconf.TOPIC_URL_FRAGMENT_HANDLER,
                topic_url_fragment))
        self.assertEqual(json_response['topic_url_fragment_exists'], True)

        self.logout()


class TopicNameHandlerTest(BaseTopicEditorControllerTests):
    """Tests for TopicNameHandler."""

    def test_topic_name_handler_when_unique(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)

        topic_name = 'Topic Name'

        # Topic name does not exist yet.
        json_response = self.get_json(
            '%s/%s' % (feconf.TOPIC_NAME_HANDLER, topic_name))
        self.assertEqual(json_response['topic_name_exists'], False)

        # Publish the topic.
        self.save_new_topic(
            self.topic_id, self.admin_id, name=topic_name,
            abbreviated_name=topic_name, url_fragment='my-topic',
            description='Description', canonical_story_ids=[],
            additional_story_ids=[],
            uncategorized_skill_ids=[self.skill_id, self.skill_id_2],
            subtopics=[], next_subtopic_id=1)

        # Unique topic name does not exists.
        topic_name = 'Unique Topic Name'

        json_response = self.get_json(
            '%s/%s' % (feconf.TOPIC_NAME_HANDLER, topic_name))
        self.assertEqual(json_response['topic_name_exists'], False)

        self.logout()

    def test_topic_name_handler_when_duplicate(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)

        topic_name = 'Topic Name'

        # Topic name does not exist yet.
        json_response = self.get_json(
            '%s/%s' % (feconf.TOPIC_NAME_HANDLER, topic_name))
        self.assertEqual(json_response['topic_name_exists'], False)

        # Publish the topic.
        self.save_new_topic(
            self.topic_id, self.admin_id, name=topic_name,
            abbreviated_name=topic_name, url_fragment='my-topic',
            description='Description', canonical_story_ids=[],
            additional_story_ids=[],
            uncategorized_skill_ids=[self.skill_id, self.skill_id_2],
            subtopics=[], next_subtopic_id=1)

        # Topic name exists since we've already published it.
        json_response = self.get_json(
            '%s/%s' % (feconf.TOPIC_NAME_HANDLER, topic_name))
        self.assertEqual(json_response['topic_name_exists'], True)

        self.logout()


class TopicIdToTopicNameHandlerTest(test_utils.GenericTestBase):
    """Tests for TopicIdToTopicNameHandlerTest."""

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.add_user_role(
            self.CURRICULUM_ADMIN_USERNAME, feconf.ROLE_ID_CURRICULUM_ADMIN)
        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)

        self.topic = topic_domain.Topic.create_default_topic(
            'topic_id', 'Dummy Topic', 'abbrev', 'description', 'fragm')
        self.topic.thumbnail_filename = 'thumbnail.svg'
        self.topic.thumbnail_bg_color = '#C6DCDA'
        self.topic.subtopics = [
            topic_domain.Subtopic(
                1, 'Title', ['skill_id_1'], 'image.svg',
                constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0], 21131,
                'dummy-subtopic-three')]
        self.topic.next_subtopic_id = 2
        self.topic.skill_ids_for_diagnostic_test = ['skill_id_1']
        topic_services.save_new_topic(self.admin_id, self.topic)

    def test_topic_id_to_topic_name_handler_returns_correctly(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)

        url = '%s/?comma_separated_topic_ids=%s' % (
            feconf.TOPIC_ID_TO_TOPIC_NAME, 'topic_id'
        )
        json_response = self.get_json(url)
        self.assertEqual(
            json_response['topic_id_to_topic_name'],
            {'topic_id': 'Dummy Topic'}
        )

        url = '%s/?comma_separated_topic_ids=%s' % (
            feconf.TOPIC_ID_TO_TOPIC_NAME, 'incorrect_topic_id')
        json_response = self.get_json(url, expected_status_int=500)
        self.assertEqual(
            json_response['error'],
            'No corresponding topic models exist for these topic IDs: '
            'incorrect_topic_id.'
        )

        url = '%s/?comma_separated_topic_ids=%s' % (
            feconf.TOPIC_ID_TO_TOPIC_NAME, '')
        json_response = self.get_json(url)
        self.assertEqual(
            json_response['topic_id_to_topic_name'], {})
