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

"""Tests for the handler that returns concept card for a skill."""

from constants import constants
from core.domain import skill_domain
from core.domain import skill_services
from core.domain import user_services
from core.tests import test_utils
import feconf


class ConceptCardDataHandlerTest(test_utils.GenericTestBase):
    """Tests the concept card data handler for a skill."""

    def setUp(self):
        """Before each individual test, create a dummy skill."""
        super(ConceptCardDataHandlerTest, self).setUp()
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)

        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)

        self.set_admins([self.ADMIN_USERNAME])

        self.skill_contents = skill_domain.SkillContents(
            'Skill Explanation', ['Example 1', 'Example 2'])
        self.admin = user_services.UserActionsInfo(self.admin_id)
        self.skill_id = skill_services.get_new_skill_id()
        self.save_new_skill(
            self.skill_id, self.admin_id, 'Description',
            skill_contents=self.skill_contents)

    def test_get_concept_card(self):
        with self.swap(constants, 'ENABLE_NEW_STRUCTURES', True):
            json_response = self.get_json(
                '%s/%s' % (feconf.CONCEPT_CARD_DATA_URL_PREFIX, self.skill_id))
            self.assertEqual(
                'Skill Explanation',
                json_response['concept_card_dict']['explanation'])
            self.assertEqual(
                ['Example 1', 'Example 2'],
                json_response['concept_card_dict']['worked_examples'])

    def test_get_concept_card_fails_when_new_structures_not_enabled(self):
        with self.swap(constants, 'ENABLE_NEW_STRUCTURES', False):
            response = self.testapp.get(
                '%s/%s' % (feconf.CONCEPT_CARD_DATA_URL_PREFIX, self.skill_id),
                expect_errors=True)
            self.assertEqual(response.status_int, 404)
