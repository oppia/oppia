# Copyright 2015 The Oppia Authors. All Rights Reserved.
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

"""Tests for the subtopic viewer page."""

from core.domain import topic_domain
from core.domain import topic_services
from core.domain import user_services
from core.tests import test_utils
import feconf


class BaseSubtopicPageTest(test_utils.GenericTestBase):

    def setUp(self):
        super(BaseSubtopicPageTest, self).setUp()

        changelist = [topic_domain.TopicChange({
            'cmd': topic_domain.CMD_ADD_SUBTOPIC,
            'title': 'Subtopic Title',
            'subtopic_id': 1
        })]

        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.set_admins([self.ADMIN_USERNAME])
        self.admin = user_services.UserActionsInfo(self.admin_id)

        self.signup(self.NEW_USER_EMAIL, self.NEW_USER_USERNAME)
        self.new_user_id = self.get_user_id_from_email(self.NEW_USER_EMAIL)

        self.topic_id_public = 'topic_public'
        self.topic_id_private = 'topic_private'

        self.topic = topic_domain.Topic.create_default_topic(
            self.topic_id_public, 'public_topic_name')
        topic_services.save_new_topic(self.admin_id, self.topic)

        self.topic = topic_domain.Topic.create_default_topic(
            self.topic_id_private, 'private_topic_name')
        topic_services.save_new_topic(self.admin_id, self.topic)

        topic_services.update_topic_and_subtopic_pages(
            self.admin_id, self.topic_id_public, changelist, 'Added a subtopic')
        topic_services.update_topic_and_subtopic_pages(
            self.admin_id,
            self.topic_id_private,
            changelist,
            'Added a subtopic')

        topic_services.publish_topic(self.topic_id_public, self.admin_id)


class SubtopicPageViewerTest(BaseSubtopicPageTest):
    def test_subtopic_page_in_published_topic_is_viewable_to_guests(self):
        with self.swap(feconf, 'ENABLE_NEW_STRUCTURES', True):
            response = self.testapp.get(
                '%s/%s/%s' % (
                    feconf.SUBTOPIC_VIEWER_URL_PREFIX,
                    self.topic_id_public,
                    1))
            self.assertEqual(response.status_int, 200)

    def test_subtopic_page_in_published_topic_is_viewable_to_logged_in_users(
            self):
        self.login(self.NEW_USER_EMAIL)
        with self.swap(feconf, 'ENABLE_NEW_STRUCTURES', True):
            response = self.testapp.get(
                '%s/%s/%s' % (
                    feconf.SUBTOPIC_VIEWER_URL_PREFIX,
                    self.topic_id_public, 1))
            self.assertEqual(response.status_int, 200)
            self.logout()

    def test_subtopic_page_in_unpublished_topic_is_not_viewable(self):
        with self.swap(feconf, 'ENABLE_NEW_STRUCTURES', True):
            response = self.testapp.get(
                '%s/%s/%s' % (
                    feconf.SUBTOPIC_VIEWER_URL_PREFIX,
                    self.topic_id_private, 1),
                expect_errors=True)
            self.assertEqual(response.status_int, 404)


class SubtopicPageDataHandlerTest(BaseSubtopicPageTest):
    def test_get(self):
        with self.swap(feconf, 'ENABLE_NEW_STRUCTURES', True):
            response = self.get_json(
                '%s/%s/%s' % (
                    feconf.SUBTOPIC_VIEWER_DATA_URL_PREFIX,
                    self.topic_id_public,
                    1))
            self.assertEqual(response['subtopic_title'], 'Subtopic Title')
            self.assertEqual(response['topic_name'], 'public_topic_name')
            self.assertEqual(response['language_code'], 'en')
            self.assertEqual(response['subtopic_html_data'], '')
