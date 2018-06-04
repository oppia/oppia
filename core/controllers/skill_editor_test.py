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

"""Tests for the skill editor page."""

from core.domain import skill_services
from core.domain import topic_services
from core.domain import user_services
from core.tests import test_utils
import feconf


class BaseSkillEditorControllerTest(test_utils.GenericTestBase):

    def setUp(self):
        """Completes the sign-up process for the various users."""
        super(BaseSkillEditorControllerTest, self).setUp()
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.signup(self.NEW_USER_EMAIL, self.NEW_USER_USERNAME)

        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.new_user_id = self.get_user_id_from_email(self.NEW_USER_EMAIL)

        self.set_admins([self.ADMIN_USERNAME])

        self.admin = user_services.UserActionsInfo(self.admin_id)
        self.skill_id = skill_services.get_new_skill_id()
        self.save_new_skill(self.skill_id, self.admin_id, 'Description')
        self.topic_id = topic_services.get_new_topic_id()
        self.save_new_topic(
            self.topic_id, self.admin_id, 'Name', 'Description',
            [], [], [self.skill_id])


class SkillEditorTest(BaseSkillEditorControllerTest):

    def test_access_skill_editor_page(self):
        """Test access to editor pages for the sample skill."""

        with self.swap(feconf, 'ENABLE_NEW_STRUCTURES', True):
            # Check that non-admins cannot access the editor page.
            self.login(self.NEW_USER_EMAIL)
            response = self.testapp.get(
                '%s/%s/%s' % (
                    feconf.SKILL_EDITOR_URL_PREFIX, self.skill_id, ' '),
                expect_errors=True)
            self.assertEqual(response.status_int, 401)

            response = self.testapp.get(
                '%s/%s/%s' % (
                    feconf.SKILL_EDITOR_URL_PREFIX, self.skill_id,
                    self.topic_id),
                expect_errors=True)
            self.assertEqual(response.status_int, 401)
            self.logout()

            # Check that admins can access and edit in the editor
            # page.
            self.login(self.ADMIN_EMAIL)
            response = self.testapp.get(
                '%s/%s/%s' % (
                    feconf.SKILL_EDITOR_URL_PREFIX, self.skill_id, ' '))
            self.assertEqual(response.status_int, 200)

            response = self.testapp.get(
                '%s/%s/%s' % (
                    feconf.SKILL_EDITOR_URL_PREFIX, self.skill_id,
                    self.topic_id))
            self.assertEqual(response.status_int, 200)
            self.logout()

    def test_editable_skill_handler_get(self):
        # Check that non-admins cannot access the editable skill data.
        with self.swap(feconf, 'ENABLE_NEW_STRUCTURES', True):
            self.login(self.NEW_USER_EMAIL)
            response = self.testapp.get(
                '%s/%s/%s' % (
                    feconf.SKILL_EDITOR_DATA_URL_PREFIX, self.skill_id, ' '),
                expect_errors=True)
            self.assertEqual(response.status_int, 401)
            self.logout()

            # Check that admins can access the editable skill data.
            self.login(self.ADMIN_EMAIL)
            json_response = self.get_json(
                '%s/%s/%s' % (
                    feconf.SKILL_EDITOR_DATA_URL_PREFIX, self.skill_id, ' '))
            self.assertEqual(self.skill_id, json_response['skill']['id'])
            self.logout()

    def test_editable_skill_handler_put(self):
        # Check that admins can edit a skill.
        change_cmd = {
            'version': 1,
            'commit_message': 'changed description',
            'change_dicts': [{
                'cmd': 'update_skill_property',
                'property_name': 'description',
                'old_value': 'Description',
                'new_value': 'New Description'
            }]
        }
        self.login(self.ADMIN_EMAIL)
        with self.swap(feconf, 'ENABLE_NEW_STRUCTURES', True):
            response = self.testapp.get(
                '%s/%s/%s' % (
                    feconf.SKILL_EDITOR_URL_PREFIX, self.skill_id, ' '))
            csrf_token = self.get_csrf_token_from_response(response)

            json_response = self.put_json(
                '%s/%s/%s' % (
                    feconf.SKILL_EDITOR_DATA_URL_PREFIX, self.skill_id, ' '),
                change_cmd, csrf_token=csrf_token)
            self.assertEqual(self.skill_id, json_response['skill']['id'])
            self.assertEqual(
                'New Description', json_response['skill']['description'])
            self.logout()

            # Check that non-admins cannot edit a skill.
            self.login(self.NEW_USER_EMAIL)
            json_response = self.put_json(
                '%s/%s/%s' % (
                    feconf.SKILL_EDITOR_DATA_URL_PREFIX, self.skill_id, ' '),
                change_cmd, csrf_token=csrf_token, expect_errors=True,
                expected_status_int=401)
            self.assertEqual(json_response['status_code'], 401)
            self.logout()

    def test_editable_skill_handler_delete(self):
        with self.swap(feconf, 'ENABLE_NEW_STRUCTURES', True):
            # Check that admins can delete a skill.
            self.login(self.ADMIN_EMAIL)
            response = self.testapp.delete(
                '%s/%s/%s' % (
                    feconf.SKILL_EDITOR_DATA_URL_PREFIX, self.skill_id, ' '))
            self.assertEqual(response.status_int, 200)
            self.logout()

            # Check that non-admins cannot delete a skill.
            self.login(self.NEW_USER_EMAIL)
            response = self.testapp.delete(
                '%s/%s/%s' % (
                    feconf.SKILL_EDITOR_DATA_URL_PREFIX, self.skill_id, ' '),
                expect_errors=True)
            self.assertEqual(response.status_int, 401)
            self.logout()

    def test_editable_skill_handler_delete_from_topic(self):
        with self.swap(feconf, 'ENABLE_NEW_STRUCTURES', True):
            # Check that admins can delete a skill.
            self.login(self.ADMIN_EMAIL)
            response = self.testapp.delete(
                '%s/%s/%s' % (
                    feconf.SKILL_EDITOR_DATA_URL_PREFIX, self.skill_id,
                    self.topic_id))
            self.assertEqual(response.status_int, 200)
            topic = topic_services.get_topic_by_id(self.topic_id)
            self.assertEqual(topic.skill_ids, [])
            self.logout()

            # Check that non-admins cannot delete a skill.
            self.login(self.NEW_USER_EMAIL)
            response = self.testapp.delete(
                '%s/%s/%s' % (
                    feconf.SKILL_EDITOR_DATA_URL_PREFIX, self.skill_id,
                    self.topic_id), expect_errors=True)
            self.assertEqual(response.status_int, 401)
            self.logout()
