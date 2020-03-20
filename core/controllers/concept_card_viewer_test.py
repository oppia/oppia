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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from constants import constants
from core.domain import skill_domain
from core.domain import skill_services
from core.domain import state_domain
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
            state_domain.SubtitledHtml(
                '1', '<p>Skill Explanation</p>'), [
                    state_domain.SubtitledHtml('2', '<p>Example 1</p>'),
                    state_domain.SubtitledHtml('3', '<p>Example 2</p>')],
            state_domain.RecordedVoiceovers.from_dict(
                {'voiceovers_mapping': {'1': {}, '2': {}, '3': {}}}),
            state_domain.WrittenTranslations.from_dict({
                'translations_mapping': {'1': {}, '2': {}, '3': {}}
            }))
        self.skill_contents_1 = skill_domain.SkillContents(
            state_domain.SubtitledHtml(
                '1', '<p>Skill Explanation 1</p>'), [
                    state_domain.SubtitledHtml('2', '<p>Example 3</p>'),
                    state_domain.SubtitledHtml('3', '<p>Example 4</p>')],
            state_domain.RecordedVoiceovers.from_dict(
                {'voiceovers_mapping': {'1': {}, '2': {}, '3': {}}}),
            state_domain.WrittenTranslations.from_dict({
                'translations_mapping': {'1': {}, '2': {}, '3': {}}
            }))
        self.admin = user_services.UserActionsInfo(self.admin_id)
        self.skill_id = skill_services.get_new_skill_id()
        self.save_new_skill(
            self.skill_id, self.admin_id, description='Description',
            skill_contents=self.skill_contents)
        self.skill_id_1 = skill_services.get_new_skill_id()
        self.save_new_skill(
            self.skill_id_1, self.admin_id, description='Description',
            skill_contents=self.skill_contents_1)
        self.skill_id_2 = skill_services.get_new_skill_id()

    def test_get_concept_cards(self):
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_PLAYERS', True):
            json_response = self.get_json(
                '%s/%s,%s' % (
                    feconf.CONCEPT_CARD_DATA_URL_PREFIX,
                    self.skill_id, self.skill_id_1)
                )
            self.assertEqual(2, len(json_response['concept_card_dicts']))
            self.assertEqual(
                '<p>Skill Explanation</p>',
                json_response['concept_card_dicts'][0]['explanation']['html'])
            self.assertEqual(
                [{
                    'content_id': '2',
                    'html': '<p>Example 1</p>'
                }, {
                    'content_id': '3',
                    'html': '<p>Example 2</p>'
                }],
                json_response['concept_card_dicts'][0]['worked_examples'])

            self.assertEqual(
                '<p>Skill Explanation 1</p>',
                json_response['concept_card_dicts'][1]['explanation']['html'])
            self.assertEqual(
                [{
                    'content_id': '2',
                    'html': '<p>Example 3</p>'
                }, {
                    'content_id': '3',
                    'html': '<p>Example 4</p>'
                }],
                json_response['concept_card_dicts'][1]['worked_examples'])

    def test_get_concept_cards_fails_when_new_structures_not_enabled(self):
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_PLAYERS', False):
            self.get_json(
                '%s/%s' % (feconf.CONCEPT_CARD_DATA_URL_PREFIX, self.skill_id),
                expected_status_int=404)

    def test_get_concept_cards_fails_when_skill_doesnt_exist(self):
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_PLAYERS', True):
            self.get_json(
                '%s/%s' % (
                    feconf.CONCEPT_CARD_DATA_URL_PREFIX, self.skill_id_2),
                expected_status_int=404)
