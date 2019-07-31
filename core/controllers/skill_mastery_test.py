# Copyright 2019 The Oppia Authors. All Rights Reserved.
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

"""Tests for the Question Player controller."""

from core.domain import skill_services
from core.tests import test_utils
import feconf


class SkillMasteryDataHandlerTest(test_utils.GenericTestBase):
    """Tests update skill mastery degree."""

    def setUp(self):
        """Completes the setup for SkillMasteryDataHandler."""
        super(SkillMasteryDataHandlerTest, self).setUp()
        self.signup(self.NEW_USER_EMAIL, self.NEW_USER_USERNAME)
        self.user_id = self.get_user_id_from_email(self.NEW_USER_EMAIL)

        self.skill_id_1 = skill_services.get_new_skill_id()
        self.save_new_skill(
            self.skill_id_1, self.user_id, 'Skill Description 1')
        self.skill_id_2 = skill_services.get_new_skill_id()
        self.save_new_skill(
            self.skill_id_2, self.user_id, 'Skill Description 2')

    def test_put_with_valid_skill_mastery_dict(self):
        payload = {}
        degree_of_mastery_per_skill = {
            self.skill_id_1: 0.3,
            self.skill_id_2: 0.5
        }
        payload['degree_of_mastery_per_skill'] = degree_of_mastery_per_skill

        self.login(self.NEW_USER_EMAIL)
        csrf_token = self.get_new_csrf_token()
        self.put_json(
            '%s' % feconf.SKILL_MASTERY_DATA_URL,
            payload, csrf_token=csrf_token)

        self.logout()

    def test_put_with_invalid_type_returns_400(self):
        payload = {}
        degree_of_mastery_per_skill = [self.skill_id_1, self.skill_id_2]
        payload['degree_of_mastery_per_skill'] = degree_of_mastery_per_skill

        self.login(self.NEW_USER_EMAIL)
        csrf_token = self.get_new_csrf_token()
        json_response = self.put_json(
            '%s' % feconf.SKILL_MASTERY_DATA_URL,
            payload, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            json_response['error'],
            'Expected payload to contain degree_of_mastery_per_skill as a dict.'
        )

        self.logout()

    def test_put_with_no_degree_of_mastery_per_skill_returns_400(self):
        payload = {}

        self.login(self.NEW_USER_EMAIL)
        csrf_token = self.get_new_csrf_token()
        json_response = self.put_json(
            '%s' % feconf.SKILL_MASTERY_DATA_URL,
            payload, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            json_response['error'],
            'Expected payload to contain degree_of_mastery_per_skill as a dict.'
        )

        self.logout()

    def test_put_with_invalid_skill_ids_returns_400(self):
        payload = {}
        degree_of_mastery_per_skill = {
            'invalid_skill_id': 0.3
        }
        payload['degree_of_mastery_per_skill'] = degree_of_mastery_per_skill

        self.login(self.NEW_USER_EMAIL)
        csrf_token = self.get_new_csrf_token()
        json_response = self.put_json(
            '%s' % feconf.SKILL_MASTERY_DATA_URL,
            payload, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            json_response['error'], 'Invalid skill ID invalid_skill_id')

        self.logout()

    def test_put_with_nonexistent_skill_ids_returns_404(self):
        skill_id_3 = skill_services.get_new_skill_id()
        payload = {}
        degree_of_mastery_per_skill = {
            self.skill_id_1: 0.3,
            self.skill_id_2: 0.5,
            skill_id_3: 0.6
        }
        payload['degree_of_mastery_per_skill'] = degree_of_mastery_per_skill

        self.login(self.NEW_USER_EMAIL)
        csrf_token = self.get_new_csrf_token()
        self.put_json(
            '%s' % feconf.SKILL_MASTERY_DATA_URL,
            payload, csrf_token=csrf_token, expected_status_int=404)

        self.logout()

    def test_put_with_invalid_type_of_degree_of_mastery_returns_400(self):
        payload = {}
        degree_of_mastery_per_skill = {
            self.skill_id_1: 0.1,
            self.skill_id_2: {}
        }
        payload['degree_of_mastery_per_skill'] = degree_of_mastery_per_skill

        self.login(self.NEW_USER_EMAIL)
        csrf_token = self.get_new_csrf_token()
        json_response = self.put_json(
            '%s' % feconf.SKILL_MASTERY_DATA_URL,
            payload, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            json_response['error'],
            'Expected degree of mastery of skill %s to be a number, '
            'received %s.' % (self.skill_id_2, '{}'))

        degree_of_mastery_per_skill = {
            self.skill_id_1: 0.1,
            self.skill_id_2: True
        }
        payload['degree_of_mastery_per_skill'] = degree_of_mastery_per_skill

        json_response = self.put_json(
            '%s' % feconf.SKILL_MASTERY_DATA_URL,
            payload, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            json_response['error'],
            'Expected degree of mastery of skill %s to be a number, '
            'received %s.' % (self.skill_id_2, 'True'))

        self.logout()

    def test_put_with_invalid_value_of_degree_of_mastery_returns_400(self):
        payload = {}
        degree_of_mastery_per_skill = {
            self.skill_id_1: -0.4,
            self.skill_id_2: 0.5
        }
        payload['degree_of_mastery_per_skill'] = degree_of_mastery_per_skill

        self.login(self.NEW_USER_EMAIL)
        csrf_token = self.get_new_csrf_token()
        json_response = self.put_json(
            '%s' % feconf.SKILL_MASTERY_DATA_URL,
            payload, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            json_response['error'],
            'Expected degree of mastery of skill %s to be a float '
            'between 0.0 and 1.0, received %s.'
            % (self.skill_id_1, '-0.4'))

        self.logout()

    def test_put_with_no_logged_in_user_returns_401(self):
        payload = {}
        degree_of_mastery_per_skill = {
            self.skill_id_1: 0.3,
            self.skill_id_2: 0.5
        }
        payload['degree_of_mastery_per_skill'] = degree_of_mastery_per_skill

        csrf_token = self.get_new_csrf_token()
        json_response = self.put_json(
            '%s' % feconf.SKILL_MASTERY_DATA_URL,
            payload, csrf_token=csrf_token, expected_status_int=401)

        self.assertEqual(
            json_response['error'],
            'You must be logged in to access this resource.')
