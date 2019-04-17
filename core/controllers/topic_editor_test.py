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

from constants import constants
from core.domain import question_services
from core.domain import skill_services
from core.domain import story_services
from core.domain import topic_domain
from core.domain import topic_services
from core.domain import user_services
from core.tests import test_utils
import feconf


class BaseTopicEditorControllerTests(test_utils.GenericTestBase):

    def setUp(self):
        """Completes the sign-up process for the various users."""
        super(BaseTopicEditorControllerTests, self).setUp()
        self.signup(self.TOPIC_MANAGER_EMAIL, self.TOPIC_MANAGER_USERNAME)
        self.signup(self.NEW_USER_EMAIL, self.NEW_USER_USERNAME)
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)

        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.topic_manager_id = self.get_user_id_from_email(
            self.TOPIC_MANAGER_EMAIL)
        self.new_user_id = self.get_user_id_from_email(
            self.NEW_USER_EMAIL)

        self.set_admins([self.ADMIN_USERNAME])
        self.set_topic_managers([self.TOPIC_MANAGER_USERNAME])

        self.topic_manager = user_services.UserActionsInfo(
            self.topic_manager_id)
        self.admin = user_services.UserActionsInfo(self.admin_id)
        self.new_user = user_services.UserActionsInfo(self.new_user_id)
        self.skill_id = skill_services.get_new_skill_id()
        self.save_new_skill(self.skill_id, self.admin_id, 'Skill Description')
        self.topic_id = topic_services.get_new_topic_id()
        self.save_new_topic(
            self.topic_id, self.admin_id, 'Name', 'Description', [], [],
            [self.skill_id], [], 1)
        changelist = [topic_domain.TopicChange({
            'cmd': topic_domain.CMD_ADD_SUBTOPIC,
            'title': 'Title',
            'subtopic_id': 1
        })]
        topic_services.update_topic_and_subtopic_pages(
            self.admin_id, self.topic_id, changelist, 'Added subtopic.')


class TopicEditorStoryHandlerTests(BaseTopicEditorControllerTests):

    def test_story_creation(self):
        self.login(self.ADMIN_EMAIL)
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_EDITORS', True):
            response = self.get_html_response(
                '%s/%s' % (feconf.TOPIC_EDITOR_URL_PREFIX, self.topic_id))
            csrf_token = self.get_csrf_token_from_response(response)
            json_response = self.post_json(
                '%s/%s' % (feconf.TOPIC_EDITOR_STORY_URL, self.topic_id),
                {'title': 'Story title'},
                csrf_token=csrf_token)
            story_id = json_response['storyId']
            self.assertEqual(len(story_id), 12)
            self.assertIsNotNone(
                story_services.get_story_by_id(story_id, strict=False))
        self.logout()


class TopicEditorQuestionHandlerTests(BaseTopicEditorControllerTests):

    def test_get(self):
        # Create 5 questions linked to the same skill.
        for i in range(0, 3): #pylint: disable=unused-variable
            question_id = question_services.get_new_question_id()
            self.save_new_question(
                question_id, self.admin_id,
                self._create_valid_question_data('ABC'))
            question_services.create_new_question_skill_link(
                question_id, self.skill_id, 0.5)

        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_EDITORS', True):
            self.login(self.ADMIN_EMAIL)
            with self.swap(constants, 'NUM_QUESTIONS_PER_PAGE', 1):
                json_response = self.get_json(
                    '%s/%s?cursor=' % (
                        feconf.TOPIC_EDITOR_QUESTION_URL, self.topic_id
                    ))
                question_summary_dicts = json_response['question_summary_dicts']
                self.assertEqual(len(question_summary_dicts), 1)
                next_start_cursor = json_response['next_start_cursor']
                json_response = self.get_json(
                    '%s/%s?cursor=%s' % (
                        feconf.TOPIC_EDITOR_QUESTION_URL, self.topic_id,
                        next_start_cursor
                    ))
                question_summary_dicts_2 = (
                    json_response['question_summary_dicts'])
                self.assertEqual(len(question_summary_dicts_2), 1)
                self.assertEqual(
                    question_summary_dicts[0]['skill_description'],
                    'Skill Description')
                self.assertNotEqual(
                    question_summary_dicts[0]['summary']['id'],
                    question_summary_dicts_2[0]['summary']['id'])
            self.logout()

            self.login(self.TOPIC_MANAGER_EMAIL)
            self.get_json(
                '%s/%s?cursor=' % (
                    feconf.TOPIC_EDITOR_QUESTION_URL, self.topic_id))
            self.logout()

            topic_services.assign_role(
                self.admin, self.topic_manager, topic_domain.ROLE_MANAGER,
                self.topic_id)

            self.login(self.TOPIC_MANAGER_EMAIL)
            json_response = self.get_json(
                '%s/%s' % (
                    feconf.TOPIC_EDITOR_QUESTION_URL, self.topic_id
                ))
            question_summary_dicts = json_response['question_summary_dicts']
            self.assertEqual(len(question_summary_dicts), 3)
            self.logout()

            self.login(self.NEW_USER_EMAIL)
            self.get_json(
                '%s/%s?cursor=' % (
                    feconf.TOPIC_EDITOR_QUESTION_URL, self.topic_id
                ), expected_status_int=401)
            self.logout()


class SubtopicPageEditorTests(BaseTopicEditorControllerTests):

    def test_editable_subtopic_page_get(self):
        # Check that non-admins and non-topic managers cannot access the
        # editable subtopic data.
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_EDITORS', True):
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
                'content_ids_to_audio_translations': {
                    'content': {}
                },
                'written_translations': {
                    'translations_mapping': {
                        'content': {}
                    }
                }
            }, json_response['subtopic_page']['page_contents'])
            self.logout()

            topic_services.assign_role(
                self.admin, self.topic_manager, topic_domain.ROLE_MANAGER,
                self.topic_id)

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
                'content_ids_to_audio_translations': {
                    'content': {}
                },
                'written_translations': {
                    'translations_mapping': {
                        'content': {}
                    }
                },
            }, json_response['subtopic_page']['page_contents'])
            self.logout()

            # Check that admins can access the editable subtopic data.
            self.login(self.ADMIN_EMAIL)
            json_response = self.get_json(
                '%s/%s/%s' % (
                    feconf.SUBTOPIC_PAGE_EDITOR_DATA_URL_PREFIX,
                    self.topic_id, 1))
            self.assertEqual({
                'subtitled_html': {
                    'html': '',
                    'content_id': 'content'
                },
                'content_ids_to_audio_translations': {
                    'content': {}
                },
                'written_translations': {
                    'translations_mapping': {
                        'content': {}
                    }
                }
            }, json_response['subtopic_page']['page_contents'])
            self.logout()


class TopicEditorTests(BaseTopicEditorControllerTests):

    def test_access_topic_editor_page(self):
        """Test access to editor pages for the sample topic."""

        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_EDITORS', True):
            # Check that non-admin and topic_manager cannot access the editor
            # page.
            self.login(self.NEW_USER_EMAIL)
            self.get_html_response(
                '%s/%s' % (
                    feconf.TOPIC_EDITOR_URL_PREFIX, self.topic_id),
                expected_status_int=401)
            self.logout()

            # Check that admins can access the editor page.
            self.login(self.ADMIN_EMAIL)
            self.get_html_response(
                '%s/%s' % (feconf.TOPIC_EDITOR_URL_PREFIX, self.topic_id))
            self.logout()

            # Check that any topic manager can access the editor page.
            self.login(self.TOPIC_MANAGER_EMAIL)
            self.get_html_response(
                '%s/%s' % (feconf.TOPIC_EDITOR_URL_PREFIX, self.topic_id))
            self.logout()


    def test_editable_topic_handler_get(self):
        # Check that non-admins cannot access the editable topic data.
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_EDITORS', True):
            self.login(self.NEW_USER_EMAIL)
            self.get_json(
                '%s/%s' % (
                    feconf.TOPIC_EDITOR_DATA_URL_PREFIX, self.topic_id),
                expected_status_int=401)
            self.logout()

            # Check that admins can access the editable topic data.
            self.login(self.ADMIN_EMAIL)

            json_response = self.get_json(
                '%s/%s' % (
                    feconf.TOPIC_EDITOR_DATA_URL_PREFIX, self.topic_id))
            self.assertEqual(self.topic_id, json_response['topic_dict']['id'])
            self.assertEqual(
                'Skill Description',
                json_response['skill_id_to_description_dict'][self.skill_id])
            self.logout()

    def test_editable_topic_handler_put(self):
        # Check that admins can edit a topic.
        change_cmd = {
            'version': 2,
            'commit_message': 'Some changes and added a subtopic.',
            'topic_and_subtopic_page_change_dicts': [{
                'change_affects_subtopic_page': False,
                'cmd': 'update_topic_property',
                'property_name': 'name',
                'old_value': '',
                'new_value': 'A new name'
            }, {
                'change_affects_subtopic_page': True,
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
                'change_affects_subtopic_page': False,
                'cmd': 'add_subtopic',
                'subtopic_id': 2,
                'title': 'Title2'
            }, {
                'change_affects_subtopic_page': True,
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
                'change_affects_subtopic_page': True,
                'cmd': 'update_subtopic_page_property',
                'property_name': 'page_contents_audio',
                'old_value': {
                    'content': {}
                },
                'new_value': {
                    'content': {
                        'en': {
                            'filename': 'test.mp3',
                            'file_size_bytes': 100,
                            'needs_update': False
                        }
                    }
                },
                'subtopic_id': 2
            }]
        }
        self.login(self.ADMIN_EMAIL)
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_EDITORS', True):
            response = self.get_html_response(
                '%s/%s' % (feconf.TOPIC_EDITOR_URL_PREFIX, self.topic_id))
            csrf_token = self.get_csrf_token_from_response(response)

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
                'content_ids_to_audio_translations': {
                    'content': {}
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
                'content_ids_to_audio_translations': {
                    'content': {
                        'en': {
                            'file_size_bytes': 100,
                            'filename': 'test.mp3',
                            'needs_update': False
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

    def test_editable_topic_handler_put_for_assigned_topic_manager(self):
        change_cmd = {
            'version': 2,
            'commit_message': 'Some changes and added a subtopic.',
            'topic_and_subtopic_page_change_dicts': [{
                'change_affects_subtopic_page': False,
                'cmd': 'update_topic_property',
                'property_name': 'name',
                'old_value': '',
                'new_value': 'A new name'
            }, {
                'change_affects_subtopic_page': True,
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
                'change_affects_subtopic_page': False,
                'cmd': 'add_subtopic',
                'subtopic_id': 2,
                'title': 'Title2'
            }, {
                'change_affects_subtopic_page': True,
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
                'change_affects_subtopic_page': True,
                'cmd': 'update_subtopic_page_property',
                'property_name': 'page_contents_audio',
                'old_value': {
                    'content': {}
                },
                'new_value': {
                    'content': {
                        'en': {
                            'filename': 'test.mp3',
                            'file_size_bytes': 100,
                            'needs_update': False
                        }
                    }
                },
                'subtopic_id': 2
            }]
        }
        # Assign the topic manager to the topic.
        topic_services.assign_role(
            self.admin, self.topic_manager, topic_domain.ROLE_MANAGER,
            self.topic_id)

        self.login(self.TOPIC_MANAGER_EMAIL)
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_EDITORS', True):
            response = self.get_html_response(
                '%s/%s' % (feconf.TOPIC_EDITOR_URL_PREFIX, self.topic_id))
            csrf_token = self.get_csrf_token_from_response(response)
            # Check that the topic manager can edit the topic now.
            json_response = self.put_json(
                '%s/%s' % (
                    feconf.TOPIC_EDITOR_DATA_URL_PREFIX, self.topic_id),
                change_cmd, csrf_token=csrf_token)
            self.assertEqual(self.topic_id, json_response['topic_dict']['id'])
            self.assertEqual('A new name', json_response['topic_dict']['name'])
            self.assertEqual(2, len(json_response['topic_dict']['subtopics']))
            self.logout()

    def test_editable_topic_handler_delete(self):
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_EDITORS', True):
            # Check that admins can delete a topic.
            self.login(self.ADMIN_EMAIL)
            self.delete_json(
                '%s/%s' % (
                    feconf.TOPIC_EDITOR_DATA_URL_PREFIX, self.topic_id),
                expected_status_int=200)
            self.logout()

            # Check that non-admins cannot delete a topic.
            self.login(self.NEW_USER_EMAIL)
            self.delete_json(
                '%s/%s' % (
                    feconf.TOPIC_EDITOR_DATA_URL_PREFIX, self.topic_id),
                expected_status_int=401)
            self.logout()


class TopicManagerRightsHandlerTests(BaseTopicEditorControllerTests):

    def test_assign_topic_manager_role(self):
        """Test the assign topic manager role for a topic functionality."""
        self.login(self.ADMIN_EMAIL)
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_EDITORS', True):
            response = self.get_html_response(
                '%s/%s' % (feconf.TOPIC_EDITOR_URL_PREFIX, self.topic_id))
            csrf_token = self.get_csrf_token_from_response(response)

            # Test for when assignee does not have sufficient rights to become a
            # manager for a topic.
            self.put_json(
                '%s/%s/%s' % (
                    feconf.TOPIC_MANAGER_RIGHTS_URL_PREFIX, self.topic_id,
                    self.new_user_id),
                {}, csrf_token=csrf_token, expected_status_int=401)

            # Test for valid case.
            self.put_json(
                '%s/%s/%s' % (
                    feconf.TOPIC_MANAGER_RIGHTS_URL_PREFIX, self.topic_id,
                    self.topic_manager_id),
                {}, csrf_token=csrf_token)
            self.logout()

            # Test for when committer doesn't have sufficient rights to assign
            # someone as manager.
            self.put_json(
                '%s/%s/%s' % (
                    feconf.TOPIC_MANAGER_RIGHTS_URL_PREFIX, self.topic_id,
                    self.new_user_id),
                {}, csrf_token=csrf_token, expected_status_int=401)


class TopicPublishSendMailHandlerTests(BaseTopicEditorControllerTests):

    def test_send_mail(self):
        self.login(self.ADMIN_EMAIL)
        response = self.get_html_response(
            '%s/%s' % (feconf.TOPIC_EDITOR_URL_PREFIX, self.topic_id))
        csrf_token = self.get_csrf_token_from_response(response)
        with self.swap(feconf, 'CAN_SEND_EMAILS', True):
            self.put_json(
                '%s/%s' % (
                    feconf.TOPIC_SEND_MAIL_URL_PREFIX, self.topic_id),
                {'topic_name': 'Topic Name'}, csrf_token=csrf_token)
        messages = self.mail_stub.get_sent_messages(
            to=feconf.ADMIN_EMAIL_ADDRESS)
        expected_email_html_body = (
            'wants to publish topic: Topic Name at URL %s, please review'
            ' and publish if it looks good.'
            % (feconf.TOPIC_EDITOR_URL_PREFIX + '/' + self.topic_id))
        self.assertEqual(len(messages), 1)
        self.assertIn(
            expected_email_html_body,
            messages[0].html.decode())


class TopicRightsHandlerTests(BaseTopicEditorControllerTests):

    def test_get_topic_rights(self):
        """Test the get topic rights functionality."""
        self.login(self.ADMIN_EMAIL)
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_EDITORS', True):
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


class TopicPublishHandlerTests(BaseTopicEditorControllerTests):

    def test_publish_and_unpublish_topic(self):
        """Test the publish and unpublish functionality."""
        self.login(self.ADMIN_EMAIL)
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_EDITORS', True):
            response = self.get_html_response(
                '%s/%s' % (feconf.TOPIC_EDITOR_URL_PREFIX, self.topic_id))
            csrf_token = self.get_csrf_token_from_response(response)
            # Test whether admin can publish and unpublish a topic.
            self.put_json(
                '%s/%s' % (
                    feconf.TOPIC_STATUS_URL_PREFIX, self.topic_id),
                {'publish_status': True}, csrf_token=csrf_token)
            topic_rights = topic_services.get_topic_rights(self.topic_id)
            self.assertTrue(topic_rights.topic_is_published)

            self.put_json(
                '%s/%s' % (
                    feconf.TOPIC_STATUS_URL_PREFIX, self.topic_id),
                {'publish_status': False}, csrf_token=csrf_token)
            topic_rights = topic_services.get_topic_rights(self.topic_id)
            self.assertFalse(topic_rights.topic_is_published)
            self.logout()

            self.login(self.NEW_USER_EMAIL)
            # Test that other users cannot access topic rights.
            self.put_json(
                '%s/%s' % (
                    feconf.TOPIC_STATUS_URL_PREFIX, self.topic_id),
                {'publish_status': False}, csrf_token=csrf_token,
                expected_status_int=401)
            self.logout()
