# coding: utf-8
#
# Copyright 2021 The Oppia Authors. All Rights Reserved.
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

"""Tests for translation service functions."""

from __future__ import annotations

from core import feconf
from core.domain import exp_domain
from core.domain import exp_fetchers
from core.domain import translation_domain
from core.domain import translation_fetchers
from core.domain import translation_services
from core.platform import models
from core.tests import test_utils

from typing import Sequence

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import translate_services
    from mypy_imports import translation_models


translate_services = models.Registry.import_translate_services()

(translation_models,) = models.Registry.import_models([
    models.Names.TRANSLATION])


class TranslationServiceTests(test_utils.GenericTestBase):

    def setUp(self) -> None:
        super().setUp()
        translation_models.MachineTranslationModel.create(
            'en', 'es', 'text to translate', 'texto para traducir')

    def test_get_machine_translation_with_same_source_and_target_language_code(
        self
    ) -> None:
        translated_text = (
            translation_services.get_and_cache_machine_translation(
                'en', 'en', 'text to translate')
        )
        self.assertEqual(translated_text, 'text to translate')
        translation = translation_fetchers.get_machine_translation(
            'en', 'en', 'text to translate')
        self.assertIsNone(translation)

    def test_machine_translation_with_non_allowlisted_language_returns_none(
        self
    ) -> None:
        translated_text = (
            translation_services.get_and_cache_machine_translation(
                'en', 'hi', 'text to translate')
        )
        self.assertIsNone(translated_text)
        translated_text = (
            translation_services.get_and_cache_machine_translation(
                'hi', 'en', 'text to translate')
        )
        self.assertIsNone(translated_text)
        # Ensure that no translation is cached when returning none (no
        # translation found).
        self.assertIsNone(
            translation_models.MachineTranslationModel.get_machine_translation(
                'en', 'hi', 'text to translated'
            )
        )
        self.assertIsNone(
            translation_models.MachineTranslationModel.get_machine_translation(
                'hi', 'en', 'text to translated'
            )
        )

    def test_get_machine_translation_checks_datastore_first(self) -> None:
        with self.swap_to_always_raise(
            translate_services.CLIENT, 'translate', error=AssertionError
        ):
            self.assertEqual(
                translation_services.get_and_cache_machine_translation(
                    'en', 'es', 'text to translate'),
                'texto para traducir'
            )

    def test_get_machine_translation_with_new_translation_saves_translation(
        self
    ) -> None:
        translated_text = (
            translation_services.get_and_cache_machine_translation(
                'en', 'fr', 'hello world')
        )
        self.assertEqual(translated_text, 'Bonjour le monde')
        translation = translation_fetchers.get_machine_translation(
            'en', 'fr', 'hello world')
        self.assertIsNotNone(translation)
        # Ruling out the possibility of None for mypy type checking.
        assert translation is not None
        self.assertEqual(translation.translated_text, 'Bonjour le monde')


class EntityTranslationServicesTest(test_utils.GenericTestBase):
    """Test class for the entity translation services."""

    def setUp(self) -> None:
        super().setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        self.EXP_ID = 'exp_id_123'
        self.exp = self.save_new_valid_exploration(self.EXP_ID, self.owner_id)

    def test_add_new_translation_creats_new_model_if_needed(self) -> None:
        entity_translation_models: Sequence[
            translation_models.EntityTranslationsModel
        ] = translation_models.EntityTranslationsModel.get_all().fetch()
        self.assertEqual(len(entity_translation_models), 0)

        translation_services.add_new_translation(
            feconf.TranslatableEntityType.EXPLORATION,
            self.EXP_ID,
            5,
            'hi',
            'content_5',
            translation_domain.TranslatedContent(
                'Translations in Hindi!',
                translation_domain.TranslatableContentFormat.HTML,
                False
            )
        )

        entity_translation_models = (
            translation_models.EntityTranslationsModel.get_all().fetch())
        self.assertEqual(len(entity_translation_models), 1)
        self.assertEqual(entity_translation_models[0].entity_id, self.EXP_ID)
        self.assertEqual(entity_translation_models[0].language_code, 'hi')

    def test_add_new_translation_adds_translations_to_existing_model(
        self
    ) -> None:
        translation_services.add_new_translation(
            feconf.TranslatableEntityType.EXPLORATION,
            self.EXP_ID,
            5,
            'hi',
            'content_5',
            translation_domain.TranslatedContent(
                'Translations in Hindi!',
                translation_domain.TranslatableContentFormat.HTML,
                False
            )
        )

        entity_translation_models: Sequence[
            translation_models.EntityTranslationsModel
        ] = translation_models.EntityTranslationsModel.get_all().fetch()
        self.assertEqual(len(entity_translation_models), 1)
        entity_translation_model = entity_translation_models[0]
        self.assertEqual(entity_translation_model.entity_id, self.EXP_ID)
        self.assertEqual(entity_translation_model.language_code, 'hi')
        self.assertEqual(
            list(entity_translation_model.translations), ['content_5'])

        translation_services.add_new_translation(
            feconf.TranslatableEntityType.EXPLORATION,
            self.EXP_ID,
            5,
            'hi',
            'default_outcome_2',
            translation_domain.TranslatedContent(
                'Translations in Hindi!',
                translation_domain.TranslatableContentFormat.HTML,
                False
            )
        )

        entity_translation_models = (
            translation_models.EntityTranslationsModel.get_all().fetch())
        self.assertEqual(len(entity_translation_models), 1)
        entity_translation_model = entity_translation_models[0]
        self.assertEqual(entity_translation_model.entity_id, self.EXP_ID)
        self.assertEqual(entity_translation_model.language_code, 'hi')
        self.assertEqual(
            list(entity_translation_model.translations.keys()),
            ['content_5', 'default_outcome_2']
        )

    def test_compute_translation_related_change_removes_translations(
        self
    ) -> None:
        translation_services.add_new_translation(
            feconf.TranslatableEntityType.EXPLORATION, self.EXP_ID, 5, 'hi',
            'content_5', translation_domain.TranslatedContent(
                'Translations in Hindi!',
                translation_domain.TranslatableContentFormat.HTML,
                False
            )
        )
        translation_services.add_new_translation(
            feconf.TranslatableEntityType.EXPLORATION, self.EXP_ID, 5, 'hi',
            'content_6', translation_domain.TranslatedContent(
                'Translations in Hindi!',
                translation_domain.TranslatableContentFormat.HTML,
                False
            )
        )

        entity_translation_models: Sequence[
            translation_models.EntityTranslationsModel
        ] = translation_models.EntityTranslationsModel.get_all().fetch()
        self.assertEqual(len(entity_translation_models), 1)
        entity_translation_model = entity_translation_models[0]
        self.assertEqual(entity_translation_model.entity_version, 5)
        self.assertEqual(
            list(entity_translation_model.translations.keys()),
            ['content_5', 'content_6']
        )

        self.exp.version = 6
        change_list = [exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_REMOVE_TRANSLATIONS,
            'content_id': 'content_5'
        })]
        entity_translations, _ = (
            translation_services.compute_translation_related_change(
                self.exp, change_list
            )
        )

        self.assertEqual(len(entity_translations), 1)
        entity_translation = entity_translations[0]
        self.assertEqual(
            list(entity_translation.translations.keys()),
            ['content_6']
        )

    def test_compute_translation_related_change_mark_translation_needs_update(
        self
    ) -> None:
        translation_services.add_new_translation(
            feconf.TranslatableEntityType.EXPLORATION, self.EXP_ID, 5, 'hi',
            'content_5', translation_domain.TranslatedContent(
                'Translations in Hindi!',
                translation_domain.TranslatableContentFormat.HTML,
                False
            )
        )
        translation_services.add_new_translation(
            feconf.TranslatableEntityType.EXPLORATION, self.EXP_ID, 5, 'hi',
            'content_6', translation_domain.TranslatedContent(
                'Translations in Hindi!',
                translation_domain.TranslatableContentFormat.HTML,
                False
            )
        )

        entity_translation_models: Sequence[
            translation_models.EntityTranslationsModel
        ] = translation_models.EntityTranslationsModel.get_all().fetch()
        self.assertEqual(len(entity_translation_models), 1)
        entity_translation_model = entity_translation_models[0]
        self.assertEqual(entity_translation_model.entity_version, 5)
        self.assertEqual([
            t['needs_update']
            for t in entity_translation_model.translations.values()
        ], [False, False])

        self.exp.version = 6
        change_list = [exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_MARK_TRANSLATIONS_NEEDS_UPDATE,
            'content_id': 'content_5'
        })]

        entity_translation_models, _ = (
            translation_services.compute_translation_related_change(
                self.exp, change_list
            )
        )

        self.assertEqual(len(entity_translation_models), 1)
        entity_translation = entity_translation_models[0]
        self.assertItemsEqual(
            [
                t['needs_update']
                for t in entity_translation.translations.values()
            ], [False, True]
        )

    def test_compute_translation_related_change_needs_update_for_language(
        self
    ) -> None:
        translation_services.add_new_translation(
            feconf.TranslatableEntityType.EXPLORATION, self.EXP_ID, 5, 'hi',
            'content_5', translation_domain.TranslatedContent(
                'Translations in Hindi!',
                translation_domain.TranslatableContentFormat.HTML,
                False
            )
        )
        translation_services.add_new_translation(
            feconf.TranslatableEntityType.EXPLORATION, self.EXP_ID, 5, 'hi',
            'content_6', translation_domain.TranslatedContent(
                'Translations in Hindi!',
                translation_domain.TranslatableContentFormat.HTML,
                False
            )
        )

        entity_translation_models: Sequence[
            translation_models.EntityTranslationsModel
        ] = translation_models.EntityTranslationsModel.get_all().fetch()
        self.assertEqual(len(entity_translation_models), 1)
        entity_translation_model = entity_translation_models[0]
        self.assertEqual(entity_translation_model.entity_version, 5)
        self.assertEqual([
            translation['needs_update']
            for translation in entity_translation_model.translations.values()
        ], [False, False])

        self.exp.version = 6
        change_list = [exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_MARK_TRANSLATION_NEEDS_UPDATE_FOR_LANGUAGE,
            'content_id': 'content_5',
            'language_code': 'hi'
        })]

        entity_translation_models, _ = (
            translation_services.compute_translation_related_change(
                self.exp, change_list
            )
        )

        self.assertEqual(len(entity_translation_models), 1)
        entity_translation = entity_translation_models[0]
        self.assertItemsEqual(
            [
                translation['needs_update']
                for translation in entity_translation.translations.values()
            ], [False, True]
        )

    def test_compute_translation_related_change_edits_existing_translation(
        self
    ) -> None:
        translation_services.add_new_translation(
            feconf.TranslatableEntityType.EXPLORATION, self.EXP_ID, 5, 'hi',
            'content_5', translation_domain.TranslatedContent(
                'Translations in Hindi!',
                translation_domain.TranslatableContentFormat.HTML,
                False
            )
        )
        translation_services.add_new_translation(
            feconf.TranslatableEntityType.EXPLORATION, self.EXP_ID, 5, 'hi',
            'content_6', translation_domain.TranslatedContent(
                'Translations in Hindi!',
                translation_domain.TranslatableContentFormat.HTML,
                False
            )
        )

        entity_translation_models: Sequence[
            translation_models.EntityTranslationsModel
        ] = translation_models.EntityTranslationsModel.get_all().fetch()
        self.assertEqual(len(entity_translation_models), 1)
        entity_translation_model = entity_translation_models[0]
        self.assertEqual(entity_translation_model.entity_version, 5)
        self.assertEqual([
            t['needs_update']
            for t in entity_translation_model.translations.values()
        ], [False, False])

        self.exp.version = 6
        change_list = [exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_EDIT_TRANSLATION,
            'content_id': 'content_5',
            'language_code': 'hi',
            'translation': translation_domain.TranslatedContent(
                'Updated translations in Hindi!',
                translation_domain.TranslatableContentFormat.HTML,
                False
            ).to_dict()
        })]

        entity_translation_models, _ = (
            translation_services.compute_translation_related_change(
                self.exp, change_list
            )
        )

        self.assertEqual(len(entity_translation_models), 1)
        entity_translation = entity_translation_models[0]
        self.assertEqual(
            entity_translation.translations['content_5']['content_value'],
            'Updated translations in Hindi!'
        )

    def test_compute_translation_related_change_adds_new_translation_model(
        self
    ) -> None:
        translation_services.add_new_translation(
            feconf.TranslatableEntityType.EXPLORATION, self.EXP_ID, 5, 'hi',
            'content_5', translation_domain.TranslatedContent(
                'Translations in Hindi!',
                translation_domain.TranslatableContentFormat.HTML,
                False
            )
        )
        translation_services.add_new_translation(
            feconf.TranslatableEntityType.EXPLORATION, self.EXP_ID, 5, 'hi',
            'content_6', translation_domain.TranslatedContent(
                'Translations in Hindi!',
                translation_domain.TranslatableContentFormat.HTML,
                False
            )
        )

        entity_translation_models: Sequence[
            translation_models.EntityTranslationsModel
        ] = translation_models.EntityTranslationsModel.get_all().fetch()
        self.assertEqual(len(entity_translation_models), 1)
        entity_translation_model = entity_translation_models[0]
        self.assertEqual(entity_translation_model.entity_version, 5)
        self.assertEqual([
            t['needs_update']
            for t in entity_translation_model.translations.values()
        ], [False, False])

        self.exp.version = 6
        change_list = [exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_EDIT_TRANSLATION,
            'content_id': 'content_5',
            'language_code': 'ar',
            'translation': translation_domain.TranslatedContent(
                'Updated translations in Hindi!',
                translation_domain.TranslatableContentFormat.HTML,
                False
            ).to_dict()
        })]

        entity_translation_models, _ = (
            translation_services.compute_translation_related_change(
                self.exp, change_list
            )
        )

        self.assertEqual(len(entity_translation_models), 2)
        self.assertTrue(
            'ar' in [et.language_code for et in entity_translation_models]
        )

    def test_compute_translation_related_changes_upon_revert(
        self
    ) -> None:
        translation_services.add_new_translation(
            feconf.TranslatableEntityType.EXPLORATION, self.EXP_ID, 5, 'hi',
            'content_1', translation_domain.TranslatedContent(
                'Translations in Hindi!',
                translation_domain.TranslatableContentFormat.HTML,
                False
            )
        )
        translation_services.add_new_translation(
            feconf.TranslatableEntityType.EXPLORATION, self.EXP_ID, 5, 'hi',
            'content_2', translation_domain.TranslatedContent(
                'Translations in Hindi!',
                translation_domain.TranslatableContentFormat.HTML,
                False
            )
        )
        translation_services.add_new_translation(
            feconf.TranslatableEntityType.EXPLORATION, self.EXP_ID, 6, 'hi',
            'content_3', translation_domain.TranslatedContent(
                'Translations in Hindi!',
                translation_domain.TranslatableContentFormat.HTML,
                False
            )
        )
        translation_services.add_new_translation(
            feconf.TranslatableEntityType.EXPLORATION, self.EXP_ID, 6, 'hi',
            'content_4', translation_domain.TranslatedContent(
                'Translations in Hindi!',
                translation_domain.TranslatableContentFormat.HTML,
                False
            )
        )
        translation_services.add_new_translation(
            feconf.TranslatableEntityType.EXPLORATION, self.EXP_ID, 6, 'hi',
            'content_5', translation_domain.TranslatedContent(
                'Translations in Hindi!',
                translation_domain.TranslatableContentFormat.HTML,
                False
            )
        )

        self.exp.version = 6
        entity_translation_models: Sequence[
            translation_models.EntityTranslationsModel
        ] = translation_models.EntityTranslationsModel.get_all().fetch()

        self.assertEqual(len(entity_translation_models), 2)
        self.assertEqual(len(
            entity_translation_models[0].translations), 2)
        self.assertEqual(len(
            entity_translation_models[1].translations), 3)

        current_exploration = exp_fetchers.get_exploration_by_id(self.EXP_ID)
        entity_translation_models, _ = (
            translation_services.compute_translation_related_changes_upon_revert( # pylint: disable=line-too-long
                current_exploration, 5
            )
        )

        self.assertEqual(len(entity_translation_models), 1)
        self.assertEqual(len(entity_translation_models[0].translations), 2)
        self.assertTrue(
            'hi' in [et.language_code for et in entity_translation_models]
        )

    def test_invalid_translation_change_raise_error(self) -> None:
        translation_services.add_new_translation(
            feconf.TranslatableEntityType.EXPLORATION, self.EXP_ID, 5, 'hi',
            'content_5', translation_domain.TranslatedContent(
                'Translations in Hindi!',
                translation_domain.TranslatableContentFormat.HTML,
                False
            )
        )
        self.exp.version = 6
        change_list = [exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
            'property_name': 'title',
            'new_value': 'A new title'
        })]

        with self.assertRaisesRegex(
            Exception,
            'Invalid translation change cmd: edit_exploration_property'
        ):
            translation_services.compute_translation_related_change(
                self.exp, change_list
            )

    def test_get_displayable_translation_languages_returns_correct_items(
        self
    ) -> None:
        expected_language_list = ['ak', 'bn', 'hi']
        for lang_code in expected_language_list:
            translation_services.add_new_translation(
                feconf.TranslatableEntityType.EXPLORATION,
                self.EXP_ID, 5, lang_code,
                'content_0', translation_domain.TranslatedContent(
                    'Translations in %s!' % lang_code,
                    translation_domain.TranslatableContentFormat.HTML,
                    False
                )
            )
        exp = exp_domain.Exploration.create_default_exploration(
            self.EXP_ID, 'exp title')
        exp.version = 5

        are_translations_displayable_swap = self.swap_to_always_return(
            exp, 'are_translations_displayable', True)
        with are_translations_displayable_swap:
            observed_language_list = (
                translation_services.get_displayable_translation_languages(
                    feconf.TranslatableEntityType.EXPLORATION,
                    exp
                )
            )
        self.assertItemsEqual(observed_language_list, expected_language_list)

        are_translations_displayable_swap = self.swap_to_always_return(
            exp, 'are_translations_displayable', False)
        with are_translations_displayable_swap:
            observed_language_list = (
                translation_services.get_displayable_translation_languages(
                    feconf.TranslatableEntityType.EXPLORATION,
                    exp
                )
            )
        self.assertItemsEqual(observed_language_list, [])

    def test_get_languages_with_complete_translation_returns_correct_lang(
        self
    ) -> None:
        expected_language_list = ['ak', 'bn']
        for lang_code in expected_language_list:
            translation_services.add_new_translation(
                feconf.TranslatableEntityType.EXPLORATION, self.EXP_ID,
                5, lang_code, 'content_0',
                translation_domain.TranslatedContent(
                    'Translations in %s!' % lang_code,
                    translation_domain.TranslatableContentFormat.HTML,
                    False
                )
            )
            translation_services.add_new_translation(
                feconf.TranslatableEntityType.EXPLORATION, self.EXP_ID, 5,
                lang_code, 'default_outcome_1',
                translation_domain.TranslatedContent(
                    'Translations in %s!' % lang_code,
                    translation_domain.TranslatableContentFormat.HTML,
                    False
                )
            )
        translation_services.add_new_translation(
            feconf.TranslatableEntityType.EXPLORATION, self.EXP_ID, 5, 'sq',
            'content_0', translation_domain.TranslatedContent(
                'Translations in sq!',
                translation_domain.TranslatableContentFormat.HTML,
                False
            )
        )

        exp = exp_domain.Exploration.create_default_exploration(
            self.EXP_ID, 'exp title')
        init_state = exp.states[exp.init_state_name]
        init_state.content.html = 'Content for translation'
        assert init_state.interaction.default_outcome is not None
        init_state.interaction.default_outcome.feedback.html = 'Content'
        exp.version = 5

        observed_language_list = (
            translation_services.get_languages_with_complete_translation(
                exp
            )
        )
        self.assertItemsEqual(observed_language_list, expected_language_list)

    def test_get_translatable_text_returns_correct_dict(self) -> None:
        exp = exp_domain.Exploration.create_default_exploration(
            self.EXP_ID, 'exp title')
        init_state = exp.states[exp.init_state_name]
        init_state.content.html = 'Content for translation'
        assert init_state.interaction.default_outcome is not None
        init_state.interaction.default_outcome.feedback.html = 'Content'
        exp.version = 5

        translation_services.add_new_translation(
            feconf.TranslatableEntityType.EXPLORATION, self.EXP_ID, 5, 'sq',
            'content_0', translation_domain.TranslatedContent(
                'Translations in sq!',
                translation_domain.TranslatableContentFormat.HTML,
                False
            )
        )

        observed_translatable_text = translation_services.get_translatable_text(
            exp, 'sq')
        self.assertEqual(
            list(observed_translatable_text.keys()),
            ['Introduction']
        )
        self.assertEqual(
            list(observed_translatable_text['Introduction'].keys()),
            ['default_outcome_1']
        )
