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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.domain import skill_services
from core.domain import story_fetchers
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
        self.save_new_skill(
            self.skill_id, self.admin_id, description='Skill Description')
        self.skill_id_2 = skill_services.get_new_skill_id()
        self.save_new_skill(
            self.skill_id_2, self.admin_id, description='Skill Description 2')
        self.topic_id = topic_services.get_new_topic_id()
        self.save_new_topic(
            self.topic_id, self.admin_id, name='Name',
            abbreviated_name='abbrev', thumbnail_filename=None,
            description='Description', canonical_story_ids=[],
            additional_story_ids=[],
            uncategorized_skill_ids=[self.skill_id, self.skill_id_2],
            subtopics=[], next_subtopic_id=1)
        changelist = [topic_domain.TopicChange({
            'cmd': topic_domain.CMD_ADD_SUBTOPIC,
            'title': 'Title',
            'subtopic_id': 1
        })]
        topic_services.update_topic_and_subtopic_pages(
            self.admin_id, self.topic_id, changelist, 'Added subtopic.')


class TopicEditorStoryHandlerTests(BaseTopicEditorControllerTests):

    def test_handler_updates_story_summary_dicts(self):
        self.login(self.ADMIN_EMAIL)

        topic_id = topic_services.get_new_topic_id()
        canonical_story_id = story_services.get_new_story_id()
        additional_story_id = story_services.get_new_story_id()

        # 'self.topic_id' does not contain any canonical_story_summary_dicts
        # or additional_story_summary_dicts.
        response = self.get_json(
            '%s/%s' % (feconf.TOPIC_EDITOR_STORY_URL, self.topic_id))

        self.assertEqual(response['canonical_story_summary_dicts'], [])
        self.assertEqual(response['additional_story_summary_dicts'], [])

        self.save_new_topic(
            topic_id, self.admin_id, name='New name',
            abbreviated_name='abbrev', thumbnail_filename=None,
            description='New description',
            canonical_story_ids=[canonical_story_id],
            additional_story_ids=[additional_story_id],
            uncategorized_skill_ids=[self.skill_id],
            subtopics=[], next_subtopic_id=1)

        self.save_new_story(
            canonical_story_id, self.admin_id, 'title', 'description',
            'note', topic_id)
        self.save_new_story(
            additional_story_id, self.admin_id, 'another title',
            'another description', 'another note', topic_id)

        topic_services.publish_story(
            topic_id, canonical_story_id, self.admin_id)

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
            canonical_story_summary_dict['id'], canonical_story_id)
        self.assertEqual(
            canonical_story_summary_dict['story_is_published'], True)

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

    def test_story_creation(self):
        self.login(self.ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()
        json_response = self.post_json(
            '%s/%s' % (feconf.TOPIC_EDITOR_STORY_URL, self.topic_id),
            {'title': 'Story title'},
            csrf_token=csrf_token)
        story_id = json_response['storyId']
        self.assertEqual(len(story_id), 12)
        self.assertIsNotNone(
            story_fetchers.get_story_by_id(story_id, strict=False))
        self.logout()


class SubtopicPageEditorTests(BaseTopicEditorControllerTests):

    def test_get_can_not_access_handler_with_invalid_topic_id(self):
        self.login(self.ADMIN_EMAIL)

        self.get_json(
            '%s/%s/%s' % (
                feconf.SUBTOPIC_PAGE_EDITOR_DATA_URL_PREFIX,
                self.topic_id, topic_services.get_new_topic_id()),
            expected_status_int=404)

        self.logout()

    def test_editable_subtopic_page_get(self):
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


class TopicEditorTests(BaseTopicEditorControllerTests):

    def test_get_can_not_access_topic_page_with_invalid_topic_id(self):
        self.login(self.ADMIN_EMAIL)

        self.get_html_response(
            '%s/%s' % (
                feconf.TOPIC_EDITOR_URL_PREFIX,
                topic_services.get_new_topic_id()), expected_status_int=404)

        self.logout()

    def test_access_topic_editor_page(self):
        """Test access to editor pages for the sample topic."""

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
        skill_services.delete_skill(self.admin_id, self.skill_id_2)
        # Check that non-admins cannot access the editable topic data.
        self.login(self.NEW_USER_EMAIL)
        self.get_json(
            '%s/%s' % (
                feconf.TOPIC_EDITOR_DATA_URL_PREFIX, self.topic_id),
            expected_status_int=401)
        self.logout()

        # Check that admins can access the editable topic data.
        self.login(self.ADMIN_EMAIL)
        with self.swap(feconf, 'CAN_SEND_EMAILS', True):
            messages = self.mail_stub.get_sent_messages(
                to=feconf.ADMIN_EMAIL_ADDRESS)
            self.assertEqual(len(messages), 0)
            json_response = self.get_json(
                '%s/%s' % (
                    feconf.TOPIC_EDITOR_DATA_URL_PREFIX, self.topic_id))
            self.assertEqual(self.topic_id, json_response['topic_dict']['id'])
            self.assertEqual(
                'Skill Description',
                json_response['skill_id_to_description_dict'][self.skill_id])

            messages = self.mail_stub.get_sent_messages(
                to=feconf.ADMIN_EMAIL_ADDRESS)
            expected_email_html_body = (
                'The deleted skills: %s are still'
                ' present in topic with id %s' % (
                    self.skill_id_2, self.topic_id))
            self.assertEqual(len(messages), 1)
            self.assertIn(
                expected_email_html_body,
                messages[0].html.decode())

        self.logout()

        # Check that editable topic handler is accessed only when a topic id
        # passed has an associated topic.
        self.login(self.ADMIN_EMAIL)

        self.get_json(
            '%s/%s' % (
                feconf.TOPIC_EDITOR_DATA_URL_PREFIX,
                topic_services.get_new_topic_id()), expected_status_int=404)

        self.logout()

    def test_editable_topic_handler_put_raises_error_with_invalid_name(self):
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
        self.login(self.ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()

        json_response = self.put_json(
            '%s/%s' % (
                feconf.TOPIC_EDITOR_DATA_URL_PREFIX, self.topic_id),
            change_cmd, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(json_response['error'], 'Name should be a string.')

    def test_editable_topic_handler_put(self):
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
                'cmd': 'add_subtopic',
                'subtopic_id': 2,
                'title': 'Title2'
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
                                'needs_update': False
                            }
                        }
                    }
                },
                'subtopic_id': 2
            }]
        }
        self.login(self.ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()
        skill_services.delete_skill(self.admin_id, self.skill_id_2)

        with self.swap(feconf, 'CAN_SEND_EMAILS', True):
            messages = self.mail_stub.get_sent_messages(
                to=feconf.ADMIN_EMAIL_ADDRESS)
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

            messages = self.mail_stub.get_sent_messages(
                to=feconf.ADMIN_EMAIL_ADDRESS)
            expected_email_html_body = (
                'The deleted skills: %s are still'
                ' present in topic with id %s' % (
                    self.skill_id_2, self.topic_id))
            self.assertEqual(len(messages), 1)
            self.assertIn(
                expected_email_html_body,
                messages[0].html.decode())

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
                            'needs_update': False
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
        self.login(self.ADMIN_EMAIL)

        json_response = self.put_json(
            '%s/%s' % (
                feconf.TOPIC_EDITOR_DATA_URL_PREFIX, self.topic_id),
            {'version': None}, csrf_token=csrf_token,
            expected_status_int=400)
        self.assertEqual(
            json_response['error'],
            'Invalid POST request: a version must be specified.')

        self.logout()

        # Check topic can not be edited when payload version differs from
        # topic version.
        self.login(self.ADMIN_EMAIL)

        topic_id_1 = topic_services.get_new_topic_id()
        self.save_new_topic(
            topic_id_1, self.admin_id, name='Name 1',
            abbreviated_name='abbrev', thumbnail_filename=None,
            description='Description 1', canonical_story_ids=[],
            additional_story_ids=[],
            uncategorized_skill_ids=[self.skill_id],
            subtopics=[], next_subtopic_id=1)

        json_response = self.put_json(
            '%s/%s' % (
                feconf.TOPIC_EDITOR_DATA_URL_PREFIX, topic_id_1),
            {'version': '3'}, csrf_token=csrf_token,
            expected_status_int=400)

        self.assertEqual(
            json_response['error'],
            'Trying to update version 1 of topic from version 3, '
            'which is too old. Please reload the page and try again.')

        self.logout()

    def test_editable_topic_handler_put_for_assigned_topic_manager(self):
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
                'cmd': 'add_subtopic',
                'subtopic_id': 2,
                'title': 'Title2'
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
                                'needs_update': False
                            }
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

    def test_guest_can_not_delete_topic(self):
        response = self.delete_json(
            '%s/%s' % (
                feconf.TOPIC_EDITOR_DATA_URL_PREFIX, self.topic_id),
            expected_status_int=401)
        self.assertEqual(
            response['error'],
            'You must be logged in to access this resource.')

    def test_editable_topic_handler_delete(self):
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

        # Check that topic can not be deleted when the topic id passed does
        # not have a topic associated with it.
        self.login(self.ADMIN_EMAIL)

        self.delete_json(
            '%s/%s' % (
                feconf.TOPIC_EDITOR_DATA_URL_PREFIX,
                topic_services.get_new_topic_id()), expected_status_int=404)

        self.logout()


class TopicPublishSendMailHandlerTests(BaseTopicEditorControllerTests):

    def test_send_mail(self):
        self.login(self.ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()
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
            self):
        self.login(self.ADMIN_EMAIL)

        json_response = self.get_json(
            '%s/%s' % (
                feconf.TOPIC_RIGHTS_URL_PREFIX,
                topic_services.get_new_topic_id()), expected_status_int=400)
        self.assertEqual(
            json_response['error'],
            'Expected a valid topic id to be provided.')

        self.logout()


class TopicPublishHandlerTests(BaseTopicEditorControllerTests):

    def test_get_can_not_access_handler_with_invalid_publish_status(self):
        self.login(self.ADMIN_EMAIL)

        csrf_token = self.get_new_csrf_token()
        response = self.put_json(
            '%s/%s' % (
                feconf.TOPIC_STATUS_URL_PREFIX, self.topic_id),
            {'publish_status': 'invalid_status'}, csrf_token=csrf_token,
            expected_status_int=400)
        self.assertEqual(
            response['error'],
            'Publish status should only be true or false.')

        self.logout()

    def test_publish_and_unpublish_topic(self):
        """Test the publish and unpublish functionality."""
        self.login(self.ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()
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

    def test_get_can_not_access_handler_with_invalid_topic_id(self):
        self.login(self.ADMIN_EMAIL)

        csrf_token = self.get_new_csrf_token()

        new_topic_id = topic_services.get_new_topic_id()
        self.put_json(
            '%s/%s' % (
                feconf.TOPIC_STATUS_URL_PREFIX, new_topic_id),
            {'publish_status': True}, csrf_token=csrf_token,
            expected_status_int=404)

    def test_cannot_publish_a_published_exploration(self):
        self.login(self.ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()
        self.put_json(
            '%s/%s' % (
                feconf.TOPIC_STATUS_URL_PREFIX, self.topic_id),
            {'publish_status': True}, csrf_token=csrf_token)
        topic_rights = topic_services.get_topic_rights(self.topic_id)
        self.assertTrue(topic_rights.topic_is_published)

        response = self.put_json(
            '%s/%s' % (
                feconf.TOPIC_STATUS_URL_PREFIX, self.topic_id),
            {'publish_status': True}, csrf_token=csrf_token,
            expected_status_int=401)
        self.assertEqual(response['error'], 'The topic is already published.')

    def test_cannot_unpublish_an_unpublished_exploration(self):
        self.login(self.ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()
        topic_rights = topic_services.get_topic_rights(self.topic_id)
        self.assertFalse(topic_rights.topic_is_published)

        response = self.put_json(
            '%s/%s' % (
                feconf.TOPIC_STATUS_URL_PREFIX, self.topic_id),
            {'publish_status': False}, csrf_token=csrf_token,
            expected_status_int=401)
        self.assertEqual(response['error'], 'The topic is already unpublished.')
