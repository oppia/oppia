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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.domain import exp_domain
from core.domain import exp_fetchers
from core.domain import exp_services
from core.domain import translation_fetchers
from core.domain import translation_services
from core.platform import models
from core.tests import test_utils

cloud_translate_services = models.Registry.import_cloud_translate_services()

(translation_models,) = models.Registry.import_models([
    models.NAMES.translation])


class TranslationServiceTests(test_utils.GenericTestBase):

    def setUp(self):
        super(TranslationServiceTests, self).setUp()
        translation_models.MachineTranslatedTextModel.create(
            'en', 'es', 'text to translate', 'texto para traducir')

        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)

        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        self.set_admins([self.ADMIN_USERNAME])

        self.exp_id = exp_fetchers.get_new_exploration_id()
        exp = self.save_new_valid_exploration(
            self.exp_id,
            self.owner_id,
            title='title',
            category='category',
            end_state_name='End State'
        )

        self.publish_exploration(self.owner_id, exp.id)
        exp_services.update_exploration(
            self.owner_id, self.exp_id, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'property_name': exp_domain.STATE_PROPERTY_CONTENT,
                'state_name': 'Introduction',
                'new_value': {
                    'content_id': 'content',
                    'html': 'Please continue.'
                }
            })], 'Changes content.')

    def test_machine_translation_with_invalid_language_code_raises_exception(
            self):
        with self.assertRaisesRegexp(
            ValueError, 'Invalid target language code: invalid_language_code'
        ):
            translation_services.get_machine_translation_for_content_id(
                self.exp_id,
                'Introduction',
                'content',
                'invalid_language_code'
            )

    def test_get_machine_translation_checks_datastore_first(self):
        with self.swap_to_always_raise(
            cloud_translate_services.CLIENT,
            'translate',
            error=AssertionError):
            self.assertEqual(
                translation_services.get_machine_translation(
                    'en', 'es', 'text to translate'),
                'texto para traducir'
            )

    def test_get_machine_translation_with_new_translation_saves_translation(
            self):
        translated_text = translation_services.get_machine_translation(
            'en', 'fr', 'hello world')
        self.assertEqual(translated_text, 'Bonjour le monde')
        translation = translation_fetchers.get_translation_for_text(
            'en', 'fr', 'hello world')
        self.assertIsNotNone(translation)
        self.assertEqual(translation.translated_text, 'Bonjour le monde')

    def test_get_machine_translation_for_content_id_with_valid_input(self):
        translated_text = (
            translation_services.get_machine_translation_for_content_id(
                self.exp_id, 'Introduction', 'content', 'es')
        )
        self.assertEqual(translated_text, 'Por favor continua.')

    def test_get_machine_translation_for_content_id_with_invalid_exploration_id_returns_none(self): # pylint: disable=line-too-long
        translated_text = (
            translation_services.get_machine_translation_for_content_id(
                'invalid_exp_id', 'Introduction', 'content', 'es')
        )
        self.assertIsNone(translated_text)

    def test_get_machine_translation_for_content_id_with_invalid_state_name_returns_none(self): # pylint: disable=line-too-long
        translated_text = (
            translation_services.get_machine_translation_for_content_id(
                self.exp_id, 'invalid_state_name', 'content', 'es')
        )
        self.assertIsNone(translated_text)

    def test_get_machine_translation_for_content_id_with_invalid_content_id_returns_none(self): # pylint: disable=line-too-long
        translated_text = (
            translation_services.get_machine_translation_for_content_id(
                self.exp_id, 'Introduction', 'invalid_content_id', 'es')
        )
        self.assertIsNone(translated_text)
