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

from constants import constants
from core.domain import skill_services
from core.domain import topic_services
from core.domain import user_services
from core.tests import test_utils
import feconf
import utils


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
            [], [], [self.skill_id], [], 1)

    def _get_csrf_token_for_put(self):
        csrf_token = None
        url_prefix = feconf.SKILL_EDITOR_URL_PREFIX
        with self.swap(feconf, 'ENABLE_NEW_STRUCTURES', True):
            response = self.testapp.get('%s/%s' % (url_prefix, self.skill_id))
            csrf_token = self.get_csrf_token_from_response(response)
        return csrf_token

    def _mock_get_skill_by_id(self, unused_skill_id, **unused_kwargs):
        return None


    def _mock_update_skill(
            self, unused_committer_id, unused_skill_id, unused_change_list,
            unused_commit_message):
        raise utils.ValidationError()

    def _mock_get_skill_rights(self, unused_skill_id, **unused_kwargs):
        return None


class SkillEditorTest(BaseSkillEditorControllerTest):
    """Tests for SkillEditorPage."""

    def setUp(self):
        super(SkillEditorTest, self).setUp()
        self.url = '%s/%s' % (feconf.SKILL_EDITOR_URL_PREFIX, self.skill_id)

    def test_access_skill_editor_page(self):
        """Test access to editor pages for the sample skill."""

        with self.swap(constants, 'ENABLE_NEW_STRUCTURES', True):
            # Check that non-admins cannot access the editor page.
            self.login(self.NEW_USER_EMAIL)
            response = self.testapp.get(
                self.url, expect_errors=True)
            self.assertEqual(response.status_int, 401)
            self.logout()

            # Check that admins can access and edit in the editor page.
            self.login(self.ADMIN_EMAIL)
            response = self.testapp.get(self.url)
            self.assertEqual(response.status_int, 200)
            self.logout()

    def test_skill_editor_page_fails(self):
        self.login(self.ADMIN_EMAIL)
        # Check GET returns 404 when new strutures' pages are not enabled.
        with self.swap(feconf, 'ENABLE_NEW_STRUCTURES', False):
            response = self.testapp.get(self.url, expect_errors=True)
            self.assertEqual(response.status_int, 404)

        # Check GET returns 404 when cannot get skill by id.
        feconf_swap = self.swap(feconf, 'ENABLE_NEW_STRUCTURES', True)
        skill_services_swap = self.swap(
            skill_services, 'get_skill_by_id', self._mock_get_skill_by_id)
        with feconf_swap, skill_services_swap:
            self.login(self.ADMIN_EMAIL)
            response = self.testapp.get(self.url, expect_errors=True)
            self.assertEqual(response.status_int, 404)
        self.logout()


class SkillRightsHandlerTest(BaseSkillEditorControllerTest):
    """Tests for SkillRightsHandler."""

    def setUp(self):
        super(SkillRightsHandlerTest, self).setUp()
        self.url = '%s/%s' % (feconf.SKILL_RIGHTS_URL_PREFIX, self.skill_id)

    def test_skill_rights_handler_succeeds(self):
        self.login(self.ADMIN_EMAIL)
        # Check that admins can access and edit in the editor page.
        self.get_json(self.url)
        # Check GET returns JSON object with can_edit_skill_description set
        # to False if the user is not allowed to edit the skill description.
        def _get_all_actions(*_args):
            actions = list(self.admin.actions)
            actions.remove(role_services.ACTION_EDIT_SKILL_DESCRIPTION)
            return actions
        with self.swap(role_services, 'get_all_actions', _get_all_actions):
            json_resp = self.get_json(self.url)
            self.assertEqual(json_resp['can_edit_skill_description'], False)
        self.logout()

    def test_skill_rights_handler_fails(self):
        self.login(self.ADMIN_EMAIL)
        # Check GET returns 404 when the returned skill rights is None.
        skill_services_swap = self.swap(
            skill_services, 'get_skill_rights', self._mock_get_skill_rights)
        with skill_services_swap:
            response = self.testapp.get(self.url, expect_errors=True)
            self.assertEqual(response.status_int, 404)
        self.logout()


class EditableSkillDataHandlerTest(BaseSkillEditorControllerTest):
    """Tests for EditableSkillDataHandler."""

    def setUp(self):
        super(EditableSkillDataHandlerTest, self).setUp()
        self.url = \
            '%s/%s' % (feconf.SKILL_EDITOR_DATA_URL_PREFIX, self.skill_id)
        self.put_payload = {
            'version': 1,
            'commit_message': 'changed description',
            'change_dicts': [{
                'cmd': 'update_skill_property',
                'property_name': 'description',
                'old_value': 'Description',
                'new_value': 'New Description'
            }]
        }


    def test_editable_skill_handler_get_succeeds(self):
        self.login(self.ADMIN_EMAIL)
        with self.swap(feconf, 'ENABLE_NEW_STRUCTURES', True):
            # Check that admins can access the editable skill data.
            json_response = self.get_json(self.url)
            self.assertEqual(self.skill_id, json_response['skill']['id'])
        self.logout()

    def test_editable_skill_handler_get_fails(self):
        self.login(self.ADMIN_EMAIL)
        # Check GET returns 404 when new strutures' pages are not enabled.
        with self.swap(feconf, 'ENABLE_NEW_STRUCTURES', False):
            response = self.testapp.get(self.url, expect_errors=True)
            self.assertEqual(response.status_int, 404)
        # Check GET returns 404 when cannot get skill by id.
        feconf_swap = self.swap(feconf, 'ENABLE_NEW_STRUCTURES', True)
        skill_services_swap = self.swap(
            skill_services, 'get_skill_by_id', self._mock_get_skill_by_id)
        with feconf_swap, skill_services_swap:
            response = self.testapp.get(self.url, expect_errors=True)
            self.assertEqual(response.status_int, 404)
        self.logout()

    def test_editable_skill_handler_put_succeeds(self):
        self.login(self.ADMIN_EMAIL)
        with self.swap(feconf, 'ENABLE_NEW_STRUCTURES', True):
            csrf_token = self._get_csrf_token_for_put()
            # Check that admins can edit a skill.
            json_response = self.put_json(
                self.url, self.put_payload, csrf_token=csrf_token)
            self.assertEqual(self.skill_id, json_response['skill']['id'])
            self.assertEqual(
                'New Description', json_response['skill']['description'])
        self.logout()

    def test_editable_skill_handler_put_fails(self):
        self.login(self.ADMIN_EMAIL)
        with self.swap(feconf, 'ENABLE_NEW_STRUCTURES', True):
            csrf_token = self._get_csrf_token_for_put()
            # Check PUT returns 404 when new strutures' pages are not enabled.
            with self.swap(feconf, 'ENABLE_NEW_STRUCTURES', False):
                self.put_json(self.url, self.put_payload, csrf_token=csrf_token,
                              expect_errors=True, expected_status_int=404)
            # Check PUT returns 404 when cannot get skill by id.
            get_skill_by_id_swap = self.swap(
                skill_services, 'get_skill_by_id', self._mock_get_skill_by_id)
            with get_skill_by_id_swap:
                self.put_json(self.url, {}, csrf_token=csrf_token,
                              expect_errors=True, expected_status_int=404)
            # Check PUT returns 400 when an exception is raised updating the
            # skill.
            update_skill_swap = self.swap(
                skill_services, 'update_skill', self._mock_update_skill)
            with update_skill_swap:
                self.put_json(self.url, self.put_payload, csrf_token=csrf_token,
                              expect_errors=True, expected_status_int=400)
        self.logout()

    def test_editable_skill_handler_delete_succeeds(self):
        self.login(self.ADMIN_EMAIL)
        with self.swap(feconf, 'ENABLE_NEW_STRUCTURES', True):
            # Check that admins can delete a skill.
            self.delete_json(self.url)
        self.logout()

    def test_editable_skill_handler_delete_fails(self):
        self.login(self.ADMIN_EMAIL)
        with self.swap(feconf, 'ENABLE_NEW_STRUCTURES', True):
            # Check DELETE returns 404 when new strutures' pages are not
            # enabled.
            with self.swap(feconf, 'ENABLE_NEW_STRUCTURES', False):
                self.delete_json(self.url, expect_errors=True,
                                 expected_status_int=404)
        # Check DELETE returns 500 when the skill still has associated
        # questions.
        feconf_swap = self.swap(feconf, 'ENABLE_NEW_STRUCTURES', True)
        skill_has_questions_swap = self.swap(
            skill_services, 'skill_has_associated_questions', lambda x: True)
        with feconf_swap, skill_has_questions_swap:
            self.delete_json(self.url, expect_errors=True,
                             expected_status_int=500)
        self.logout()


class SkillPublishHandlerTest(BaseSkillEditorControllerTest):
    """Tests for SkillPublishHandler."""

    def setUp(self):
        super(SkillPublishHandlerTest, self).setUp()
        self.url = '%s/%s' % (feconf.SKILL_PUBLISH_URL_PREFIX, self.skill_id)

    def test_skill_publish_handler_succeeds(self):
        self.login(self.ADMIN_EMAIL)
        with self.swap(feconf, 'ENABLE_NEW_STRUCTURES', True):
            # Check that an admin can publish a skill.
            csrf_token = self._get_csrf_token_for_put()
            self.put_json(self.url, {'version': 1}, csrf_token=csrf_token)
        self.logout()

    def test_skill_publish_handler_fails(self):

        def _publish_skill(*_args):
            raise Exception()

        self.login(self.ADMIN_EMAIL)
        with self.swap(feconf, 'ENABLE_NEW_STRUCTURES', True):
            csrf_token = self._get_csrf_token_for_put()
            # Check that a skill cannot be published when the payload has no
            # version.
            self.put_json(self.url, {}, csrf_token=csrf_token,
                          expect_errors=True, expected_status_int=400)
            # Check that a skill cannot be published when the payload's version
            # is different from the skill's version.
            self.put_json(self.url, {'version': -1}, csrf_token=csrf_token,
                          expect_errors=True, expected_status_int=400)
            # Check that a non-existing skill cannot be published.
            url = '%s/non-existing-id' % (feconf.SKILL_PUBLISH_URL_PREFIX)
            self.put_json(url, {'version': 1}, csrf_token=csrf_token,
                          expect_errors=True, expected_status_int=500)

            # Check that the status is 401 when call to publish_skill raises an
            # exception.
            skill_services_swap = self.swap(
                skill_services, 'publish_skill', _publish_skill)
            with skill_services_swap:
                csrf_token = self._get_csrf_token_for_put()
                self.put_json(self.url, {'version': 1}, csrf_token=csrf_token,
                              expect_errors=True, expected_status_int=401)
        self.logout()
