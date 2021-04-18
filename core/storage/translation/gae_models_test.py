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

"""Tests for MachineTranslation models."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.platform import models
from core.tests import test_utils

(base_models, translation_models) = models.Registry.import_models(
    [models.NAMES.base_model, models.NAMES.translation])


class MachineTranslationModelTests(test_utils.GenericTestBase):
    def test_create_model(self):
        model_id = translation_models.MachineTranslationModel.create(
            source_language_code='en',
            target_language_code='es',
            source_text='hello world',
            translated_text='hola mundo'
        )
        translation_model = (
            translation_models.MachineTranslationModel.get(model_id))
        self.assertEqual(translation_model.translated_text, 'hola mundo')

    def test_create_model_with_same_source_target_language_codes_returns_none(
            self):
        model_id = translation_models.MachineTranslationModel.create(
            source_language_code='en',
            target_language_code='en',
            source_text='hello world',
            translated_text='hello world'
        )
        self.assertIsNone(model_id)

    def test_get_machine_translation_with_existing_translation(self):
        translation_models.MachineTranslationModel.create(
            source_language_code='en',
            target_language_code='es',
            source_text='hello world',
            translated_text='hola mundo'
        )
        translation = (
            translation_models.MachineTranslationModel
            .get_machine_translation(
                source_language_code='en',
                target_language_code='es',
                source_text='hello world',
            )
        )
        self.assertIsNotNone(translation)
        self.assertEqual(translation.translated_text, 'hola mundo')

    def test_get_machine_translation_with_no_existing_translation_returns_none(
            self):
        translation = (
            translation_models.MachineTranslationModel
            .get_machine_translation(
                source_language_code='en',
                target_language_code='fr',
                source_text='hello world',
            )
        )
        self.assertIsNone(translation)

    def test_get_deletion_policy_not_applicable(self):
        self.assertEqual(
            translation_models.MachineTranslationModel.get_deletion_policy(),
            base_models.DELETION_POLICY.NOT_APPLICABLE)

    def test_get_model_association_to_user_not_corresponding_to_user(self):
        self.assertEqual(
            (
                translation_models.MachineTranslationModel
                .get_model_association_to_user()
            ),
            base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER)

    def test_get_export_policy_not_applicable(self):
        self.assertEqual(
            translation_models.MachineTranslationModel.get_export_policy(),
            {
                'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'hashed_source_text': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'source_text': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'source_language_code':
                    base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'target_language_code':
                    base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'translated_text': base_models.EXPORT_POLICY.NOT_APPLICABLE
            }
        )
