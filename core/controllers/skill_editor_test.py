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

from core.controllers import skill_editor
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

    def _mock_get_skill_by_id(self, skill_id, strict=True, version=None):
        return None

    def _mock_update_skill(committer_id, skill_id, change_list, commit_message):
        raise utils.ValidationError()

    def _get_csrf_token_for_put(self):
        csrf_token = None
        url_prefix = feconf.SKILL_EDITOR_URL_PREFIX
        with self.swap(feconf, 'ENABLE_NEW_STRUCTURES', True):
            response = self.testapp.get('%s/%s' % (url_prefix, self.skill_id))
            csrf_token = self.get_csrf_token_from_response(response)
        return csrf_token


class SkillEditorTest(BaseSkillEditorControllerTest):

    def test_access_skill_editor_page(self):
        """Test access to editor pages for the sample skill."""

        url_prefix = feconf.SKILL_EDITOR_URL_PREFIX
        with self.swap(feconf, 'ENABLE_NEW_STRUCTURES', True):
            # Check that non-admins cannot access the editor page.
            self.login(self.NEW_USER_EMAIL)
            response = self.testapp.get(
                '%s/%s' % (url_prefix, self.skill_id), expect_errors=True)
            self.assertEqual(response.status_int, 401)
            self.logout()

            # Check that admins can access and edit in the editor page.
            self.login(self.ADMIN_EMAIL)
            response = self.testapp.get(
                '%s/%s' % (url_prefix, self.skill_id))
            self.assertEqual(response.status_int, 200)
            self.logout()

    def test_skill_editor_page_not_enable_new_structures(self):
        # Check that the skill editor cannot be accessed when new structures'
        # pages are not enabled.
        with self.swap(feconf, 'ENABLE_NEW_STRUCTURES', False):
            self.login(self.ADMIN_EMAIL)
            response = self.testapp.get(
                '%s/%s' % (feconf.SKILL_EDITOR_URL_PREFIX, self.skill_id),
                expect_errors=True)
            self.assertEqual(response.status_int, 404)
            self.logout()

    def test_skill_editor_page_skill_is_none(self):
        """TODO"""

        feconf_swap = self.swap(feconf, 'ENABLE_NEW_STRUCTURES', True)
        skill_services_swap = self.swap(
            skill_services, 'get_skill_by_id', self._mock_get_skill_by_id)
        url_prefix = feconf.SKILL_EDITOR_URL_PREFIX

        with feconf_swap, skill_services_swap:
            self.login(self.ADMIN_EMAIL)
            response = self.testapp.get(
                '%s/%s' % (url_prefix, self.skill_id), expect_errors=True)
            self.assertEqual(response.status_int, 404)
            self.logout()


class SkillRightsHandlerTest(BaseSkillEditorControllerTest):

    def setUp(self):
        """"""

        super(SkillRightsHandlerTest, self).setUp()
        self.url = '%s/%s' % (feconf.SKILL_RIGHTS_URL_PREFIX, self.skill_id)

    def test_skill_rights_handler(self):
        """TODO."""

        with self.swap(feconf, 'ENABLE_NEW_STRUCTURES', True):
            # Check that non-admins cannot access the editor page.
            self.login(self.NEW_USER_EMAIL)
            response = self.testapp.get(self.url, expect_errors=True)
            self.assertEqual(response.status_int, 401)
            self.logout()

            # Check that admins can access and edit in the editor page.
            self.login(self.ADMIN_EMAIL)
            self.get_json(self.url)
            self.logout()

    def test_skill_rights_handler_skill_rights_is_none(self):
        """TODO."""

        def mock_get_skill_rights(skill_id, strict=True):
            return None

        feconf_swap = self.swap(feconf, 'ENABLE_NEW_STRUCTURES', True)
        skill_services_swap = self.swap(
            skill_services, 'get_skill_rights', mock_get_skill_rights)
        with feconf_swap, skill_services_swap:
            self.login(self.ADMIN_EMAIL)
            response = self.testapp.get(self.url, expect_errors=True)
            self.assertEqual(response.status_int, 404)
            self.logout()


class EditableSkillDataHandlerTest(BaseSkillEditorControllerTest):

    def setUp(self):
        """"""

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

    def test_editable_skill_handler_get(self):
        """"""

        # Check that non-admins cannot access the editable skill data.
        with self.swap(feconf, 'ENABLE_NEW_STRUCTURES', True):
            self.login(self.NEW_USER_EMAIL)
            response = self.testapp.get(self.url, expect_errors=True)
            self.assertEqual(response.status_int, 401)
            self.logout()

            # Check that admins can access the editable skill data.
            self.login(self.ADMIN_EMAIL)
            json_response = self.get_json(self.url)
            self.assertEqual(self.skill_id, json_response['skill']['id'])
            self.logout()

        # Check GET returns 404 when new strutures' pages are not enabled.
        with self.swap(feconf, 'ENABLE_NEW_STRUCTURES', False):
            self.login(self.ADMIN_EMAIL)
            response = self.testapp.get(self.url, expect_errors=True)
            self.assertEqual(response.status_int, 404)
            self.logout()

    def test_editable_skill_handler_get_skill_is_none(self):
        """TODO"""

        feconf_swap = self.swap(feconf, 'ENABLE_NEW_STRUCTURES', True)
        skill_services_swap = self.swap(
            skill_services, 'get_skill_by_id', self._mock_get_skill_by_id)
        with feconf_swap, skill_services_swap:
            self.login(self.ADMIN_EMAIL)
            response = self.testapp.get(self.url, expect_errors=True)
            self.assertEqual(response.status_int, 404)
            self.logout()

    def test_editable_skill_handler_put(self):
        """"""

        with self.swap(feconf, 'ENABLE_NEW_STRUCTURES', True):
            self.login(self.ADMIN_EMAIL)
            csrf_token = self._get_csrf_token_for_put()

            # Check PUT returns 404 when new strutures' pages are not enabled.
            with self.swap(feconf, 'ENABLE_NEW_STRUCTURES', False):
                self.put_json(self.url, self.put_payload, csrf_token=csrf_token,
                    expect_errors=True, expected_status_int=404)

            json_response = self.put_json(
                self.url, self.put_payload, csrf_token=csrf_token)
            self.assertEqual(self.skill_id, json_response['skill']['id'])
            self.assertEqual(
                'New Description', json_response['skill']['description'])
            self.logout()

            # Check that non-admins cannot edit a skill.
            self.login(self.NEW_USER_EMAIL)
            json_response = self.put_json(
                self.url, self.put_payload, csrf_token=csrf_token, expect_errors=True,
                expected_status_int=401)
            self.assertEqual(json_response['status_code'], 401)
            self.logout()

    def test_editable_skill_handler_put_skill_is_none(self):
        """TODO"""

        feconf_swap = self.swap(feconf, 'ENABLE_NEW_STRUCTURES', True)
        skill_services_swap = self.swap(
            skill_services, 'get_skill_by_id', self._mock_get_skill_by_id)
        with feconf_swap:
            self.login(self.ADMIN_EMAIL)
            csrf_token = self._get_csrf_token_for_put()
            with skill_services_swap:
                self.put_json(self.url, {}, csrf_token=csrf_token,
                    expect_errors=True, expected_status_int=404)
            self.logout()

    def test_editable_skill_handler_put_raise_utils_validation_error(self):
        """TODO"""

        feconf_swap = self.swap(feconf, 'ENABLE_NEW_STRUCTURES', True)
        skill_services_swap = self.swap(
            skill_services, 'update_skill', self._mock_update_skill)
        with feconf_swap, skill_services_swap:
            self.login(self.ADMIN_EMAIL)
            csrf_token = self._get_csrf_token_for_put()
            self.put_json(self.url, self.put_payload, csrf_token=csrf_token,
                expect_errors=True, expected_status_int=500)
            self.logout()

    def test_editable_skill_handler_delete(self):
        url_prefix = feconf.SKILL_EDITOR_DATA_URL_PREFIX
        with self.swap(feconf, 'ENABLE_NEW_STRUCTURES', True):
            # Check that admins can delete a skill.
            self.login(self.ADMIN_EMAIL)
            self.delete_json('%s/%s' % (url_prefix, self.skill_id))
            self.logout()

            # Check that non-admins cannot delete a skill.
            self.login(self.NEW_USER_EMAIL)
            response = self.testapp.delete(
                '%s/%s' % (url_prefix, self.skill_id), expect_errors=True)
            self.assertEqual(response.status_int, 401)
            self.logout()

        # Check DELETE returns 404 when new strutures' pages are not enabled.
        with self.swap(feconf, 'ENABLE_NEW_STRUCTURES', False):
            self.login(self.ADMIN_EMAIL)
            self.delete_json('%s/%s' % (url_prefix, self.skill_id),
                             expect_errors=True, expected_status_int=404)
            self.logout()

    def test_editable_skill_handler_delete_skill_has_associated_questions(self):
        """TODO"""

        feconf_swap = self.swap(feconf, 'ENABLE_NEW_STRUCTURES', True)
        skill_services_swap = self.swap(
            skill_services, 'skill_has_associated_questions', lambda x: True)

        with feconf_swap, skill_services_swap:
            self.login(self.ADMIN_EMAIL)
            self.delete_json(
                '%s/%s' % (feconf.SKILL_EDITOR_DATA_URL_PREFIX, self.skill_id),
                expect_errors=True, expected_status_int=500)
            self.logout()

    def test_skill_publish_handler(self):
        """Test access to editor pages for the sample skill."""
        self.login(self.ADMIN_EMAIL)
        url_prefix = feconf.SKILL_PUBLISH_URL_PREFIX
        with self.swap(feconf, 'ENABLE_NEW_STRUCTURES', True):
            csrf_token = self._get_csrf_token_for_put()
            payload = {'version': 1}
            # Check that an admin can publish a skill.
            self.put_json(
                '%s/%s' % (url_prefix, self.skill_id), payload,
                csrf_token=csrf_token)

            # Check that a non-existing skill cannot be published.
            self.put_json(
                '%s/%s' % (url_prefix, 'non-existing-id'), payload,
                csrf_token=csrf_token, expect_errors=True,
                expected_status_int=500)

            # Check that a skill cannot be published when the payload has no
            # version.
            self.put_json(
                '%s/%s' % (url_prefix, self.skill_id), {},
                csrf_token=csrf_token, expect_errors=True,
                expected_status_int=400)

            # Check that a skill cannot be published when the payload's version
            # is different from the skill's version.
            self.put_json(
                '%s/%s' % (url_prefix, self.skill_id),
                {'version': -1}, csrf_token=csrf_token, expect_errors=True,
                expected_status_int=400)

            self.logout()
