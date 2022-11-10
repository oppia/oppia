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

from __future__ import annotations
import json

from core import feconf
from core.domain import skill_domain
from core.domain import skill_services
from core.domain import state_domain
from core.domain import user_services
from core.tests import test_utils


class ConceptCardDataHandlerTest(test_utils.GenericTestBase):
    """Tests the concept card data handler for a skill."""

    def setUp(self) -> None:
        """Before each individual test, create a dummy skill."""
        super().setUp()
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)

        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)

        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])

        example_1 = skill_domain.WorkedExample(
            state_domain.SubtitledHtml('2', '<p>Example Question 1</p>'),
            state_domain.SubtitledHtml('3', '<p>Example Explanation 1</p>')
        )
        example_2 = skill_domain.WorkedExample(
            state_domain.SubtitledHtml('4', '<p>Example Question 2</p>'),
            state_domain.SubtitledHtml('5', '<p>Example Explanation 2</p>')
        )
        self.skill_contents = skill_domain.SkillContents(
            state_domain.SubtitledHtml(
                '1', '<p>Skill Explanation</p>'), [example_1, example_2],
            state_domain.RecordedVoiceovers.from_dict({
                'voiceovers_mapping': {
                    '1': {}, '2': {}, '3': {}, '4': {}, '5': {}
                }
            }),
            state_domain.WrittenTranslations.from_dict({
                'translations_mapping': {
                    '1': {}, '2': {}, '3': {}, '4': {}, '5': {}
                }
            })
        )

        self.skill_contents_1 = skill_domain.SkillContents(
            state_domain.SubtitledHtml(
                '1', '<p>Skill Explanation 1</p>'), [example_1, example_2],
            state_domain.RecordedVoiceovers.from_dict({
                'voiceovers_mapping': {
                    '1': {}, '2': {}, '3': {}, '4': {}, '5': {}
                }
            }),
            state_domain.WrittenTranslations.from_dict({
                'translations_mapping': {
                    '1': {}, '2': {}, '3': {}, '4': {}, '5': {}
                }
            })
        )
        self.admin = user_services.get_user_actions_info(self.admin_id)
        self.skill_id = skill_services.get_new_skill_id()
        self.save_new_skill(
            self.skill_id, self.admin_id, description='Description',
            skill_contents=self.skill_contents)
        self.skill_id_1 = skill_services.get_new_skill_id()
        self.save_new_skill(
            self.skill_id_1, self.admin_id, description='Description',
            skill_contents=self.skill_contents_1)
        self.skill_id_2 = skill_services.get_new_skill_id()

    def test_get_concept_cards(self) -> None:
        json_response = self.get_json(
            '%s/%s' % (
                feconf.CONCEPT_CARD_DATA_URL_PREFIX,
                json.dumps([self.skill_id, self.skill_id_1])
            ))
        self.assertEqual(2, len(json_response['concept_card_dicts']))
        self.assertEqual(
            '<p>Skill Explanation</p>',
            json_response['concept_card_dicts'][0]['explanation']['html'])
        self.assertEqual(
            [skill_domain.WorkedExample(
                state_domain.SubtitledHtml(
                    '2', '<p>Example Question 1</p>'),
                state_domain.SubtitledHtml(
                    '3', '<p>Example Explanation 1</p>')
            ).to_dict(), skill_domain.WorkedExample(
                state_domain.SubtitledHtml(
                    '4', '<p>Example Question 2</p>'),
                state_domain.SubtitledHtml(
                    '5', '<p>Example Explanation 2</p>')
            ).to_dict()],
            json_response['concept_card_dicts'][0]['worked_examples'])

        self.assertEqual(
            '<p>Skill Explanation 1</p>',
            json_response['concept_card_dicts'][1]['explanation']['html'])
        self.assertEqual(
            [skill_domain.WorkedExample(
                state_domain.SubtitledHtml(
                    '2', '<p>Example Question 1</p>'),
                state_domain.SubtitledHtml(
                    '3', '<p>Example Explanation 1</p>')
            ).to_dict(), skill_domain.WorkedExample(
                state_domain.SubtitledHtml(
                    '4', '<p>Example Question 2</p>'),
                state_domain.SubtitledHtml(
                    '5', '<p>Example Explanation 2</p>')
            ).to_dict()],
            json_response['concept_card_dicts'][1]['worked_examples'])

    def test_get_concept_cards_fails_when_skill_doesnt_exist(self) -> None:
        self.get_json(
            '%s/%s' % (
                feconf.CONCEPT_CARD_DATA_URL_PREFIX,
                json.dumps([self.skill_id_2])),
            expected_status_int=404)

    def test_invalid_skill_id(self) -> None:
        skill_ids = [1, 2]
        json_response = self.get_json(
            '%s/%s' % (
                feconf.CONCEPT_CARD_DATA_URL_PREFIX,
                json.dumps(skill_ids)), expected_status_int=400)

        self.assertEqual(json_response['error'], 'Skill id should be a string.')
