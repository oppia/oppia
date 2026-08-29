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
from core.domain import (
    skill_domain,
    skill_fetchers,
    skill_services,
    state_domain,
    translation_domain,
    translation_services,
    user_services,
)
from core.tests import test_utils


class ConceptCardDataHandlerTest(test_utils.GenericTestBase):
    """Tests the concept card data handler for a skill."""

    def setUp(self) -> None:
        """Before each individual test, create a dummy skill."""
        super().setUp()
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)

        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)

        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])

        self.skill_contents = skill_domain.SkillContents(
            state_domain.SubtitledHtml('1', '<p>Skill Explanation</p>'),
            state_domain.RecordedVoiceovers.from_dict(
                {
                    'voiceovers_mapping': {
                        '1': {},
                        '2': {},
                        '3': {},
                        '4': {},
                        '5': {},
                    }
                }
            ),
            translation_domain.WrittenTranslations.from_dict(
                {
                    'translations_mapping': {
                        '1': {},
                        '2': {},
                        '3': {},
                        '4': {},
                        '5': {},
                    }
                }
            ),
        )

        self.skill_contents_1 = skill_domain.SkillContents(
            state_domain.SubtitledHtml('1', '<p>Skill Explanation 1</p>'),
            state_domain.RecordedVoiceovers.from_dict(
                {
                    'voiceovers_mapping': {
                        '1': {},
                        '2': {},
                        '3': {},
                        '4': {},
                        '5': {},
                    }
                }
            ),
            translation_domain.WrittenTranslations.from_dict(
                {
                    'translations_mapping': {
                        '1': {},
                        '2': {},
                        '3': {},
                        '4': {},
                        '5': {},
                    }
                }
            ),
        )
        self.admin = user_services.get_user_actions_info(self.admin_id)
        self.skill_id = skill_services.get_new_skill_id()
        self.save_new_skill(
            self.skill_id,
            self.admin_id,
            description='Description',
            skill_contents=self.skill_contents,
        )
        self.skill_id_1 = skill_services.get_new_skill_id()
        self.save_new_skill(
            self.skill_id_1,
            self.admin_id,
            description='Description',
            skill_contents=self.skill_contents_1,
        )
        self.skill_id_2 = skill_services.get_new_skill_id()

    def test_get_concept_cards(self) -> None:
        json_response = self.get_json(
            '%s/%s'
            % (
                feconf.CONCEPT_CARD_DATA_URL_PREFIX,
                json.dumps([self.skill_id, self.skill_id_1]),
            )
        )
        self.assertEqual(2, len(json_response['concept_card_dicts']))
        self.assertEqual(
            '<p>Skill Explanation</p>',
            json_response['concept_card_dicts'][0]['explanation']['html'],
        )

        self.assertEqual(
            '<p>Skill Explanation 1</p>',
            json_response['concept_card_dicts'][1]['explanation']['html'],
        )

    def _add_explanation_translation(
        self,
        skill_id: str,
        language_code: str,
        translation_html: str,
        needs_update: bool = False,
    ) -> None:
        """Adds a translation of the skill's explanation.

        Args:
            skill_id: str. The ID of the skill to translate.
            language_code: str. The language to translate into.
            translation_html: str. The translated explanation.
            needs_update: bool. Whether the translation is stale.
        """
        skill = skill_fetchers.get_skill_by_id(skill_id)
        translation_services.add_new_translation(
            feconf.TranslatableEntityType.SKILL,
            skill_id,
            skill.version,
            language_code,
            skill.skill_contents.explanation.content_id,
            translation_domain.TranslatedContent(
                translation_html,
                translation_domain.TranslatableContentFormat.HTML,
                needs_update,
            ),
        )

    def test_get_concept_cards_in_a_translated_language(self) -> None:
        self._add_explanation_translation(
            self.skill_id, 'es', '<p>Explicación de la habilidad</p>'
        )

        json_response = self.get_json(
            '%s/%s'
            % (
                feconf.CONCEPT_CARD_DATA_URL_PREFIX,
                json.dumps([self.skill_id, self.skill_id_1]),
            ),
            params={'language_code': 'es'},
        )

        self.assertEqual(
            '<p>Explicación de la habilidad</p>',
            json_response['concept_card_dicts'][0]['explanation']['html'],
        )
        # The second skill has no translation, so it stays in English.
        self.assertEqual(
            '<p>Skill Explanation 1</p>',
            json_response['concept_card_dicts'][1]['explanation']['html'],
        )

    def test_get_concept_cards_translates_the_skill_description(self) -> None:
        skill = skill_fetchers.get_skill_by_id(self.skill_id)
        translation_services.add_new_translation(
            feconf.TranslatableEntityType.SKILL,
            self.skill_id,
            skill.version,
            'es',
            feconf.SKILL_DESCRIPTION_CONTENT_ID,
            translation_domain.TranslatedContent(
                'Descripcion de la habilidad',
                translation_domain.TranslatableContentFormat.UNICODE_STRING,
                False,
            ),
        )

        json_response = self.get_json(
            '%s/%s'
            % (
                feconf.CONCEPT_CARD_DATA_URL_PREFIX,
                json.dumps([self.skill_id, self.skill_id_1]),
            ),
            params={'language_code': 'es'},
        )

        self.assertEqual(
            'Descripcion de la habilidad',
            json_response['concept_card_dicts'][0]['skill_description'],
        )
        # The second skill has no translated description, so it stays in
        # English.
        self.assertEqual(
            skill_fetchers.get_skill_by_id(self.skill_id_1).description,
            json_response['concept_card_dicts'][1]['skill_description'],
        )

    def test_get_concept_cards_falls_back_to_english_when_untranslated(
        self,
    ) -> None:
        json_response = self.get_json(
            '%s/%s'
            % (
                feconf.CONCEPT_CARD_DATA_URL_PREFIX,
                json.dumps([self.skill_id]),
            ),
            params={'language_code': 'es'},
        )

        self.assertEqual(
            '<p>Skill Explanation</p>',
            json_response['concept_card_dicts'][0]['explanation']['html'],
        )

    def test_get_concept_cards_ignores_a_stale_translation(self) -> None:
        self._add_explanation_translation(
            self.skill_id,
            'es',
            '<p>Explicación desactualizada</p>',
            needs_update=True,
        )

        json_response = self.get_json(
            '%s/%s'
            % (
                feconf.CONCEPT_CARD_DATA_URL_PREFIX,
                json.dumps([self.skill_id]),
            ),
            params={'language_code': 'es'},
        )

        # A translation flagged as needing an update is out of date with the
        # English content, so English is shown instead.
        self.assertEqual(
            '<p>Skill Explanation</p>',
            json_response['concept_card_dicts'][0]['explanation']['html'],
        )

    def test_get_concept_cards_in_english_returns_original_content(
        self,
    ) -> None:
        self._add_explanation_translation(
            self.skill_id, 'es', '<p>Explicación de la habilidad</p>'
        )

        json_response = self.get_json(
            '%s/%s'
            % (
                feconf.CONCEPT_CARD_DATA_URL_PREFIX,
                json.dumps([self.skill_id]),
            ),
            params={'language_code': 'en'},
        )

        self.assertEqual(
            '<p>Skill Explanation</p>',
            json_response['concept_card_dicts'][0]['explanation']['html'],
        )

    def test_get_concept_cards_with_invalid_language_code(self) -> None:
        json_response = self.get_json(
            '%s/%s'
            % (
                feconf.CONCEPT_CARD_DATA_URL_PREFIX,
                json.dumps([self.skill_id]),
            ),
            params={'language_code': 'invalid_language_code'},
            expected_status_int=400,
        )

        self.assertIn('language_code', json_response['error'])

    def test_get_concept_cards_fails_when_skill_doesnt_exist(self) -> None:
        self.get_json(
            '%s/%s'
            % (
                feconf.CONCEPT_CARD_DATA_URL_PREFIX,
                json.dumps([self.skill_id_2]),
            ),
            expected_status_int=404,
        )

    def test_invalid_skill_id(self) -> None:
        skill_ids = [1, 2]
        json_response = self.get_json(
            '%s/%s'
            % (feconf.CONCEPT_CARD_DATA_URL_PREFIX, json.dumps(skill_ids)),
            expected_status_int=400,
        )

        self.assertEqual(json_response['error'], 'Skill id should be a string.')
