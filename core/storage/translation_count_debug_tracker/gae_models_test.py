# coding: utf-8
#
# Copyright 2025 The Oppia Authors. All Rights Reserved.
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

"""Tests for core.storage.translation_count_debug_tracker.gae_models."""

from __future__ import annotations
import datetime

from core.platform import models
from core.tests import test_utils

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import base_models
    from mypy_imports import translation_count_debug_tracker_models

(
    base_models,
    translation_count_debug_tracker_models) = models.Registry.import_models([
    models.Names.BASE_MODEL, models.Names.TRANSLATION_COUNT_DEBUG_TRACKER
])


class TranslationCountDebugTrackerModelUnitTest(test_utils.GenericTestBase):
    """Test the TranslationCountDebugTrackerModel class."""

    dt = datetime.datetime.utcnow()

    def setUp(self) -> None:
        super().setUp()
        # Create first model.
        translation_count_debug_tracker_models.TranslationCountDebugTrackerModel( # pylint: disable=line-too-long
            id='exp_id1.hi',
            exp_id='exp_id1',
            language_code='hi',
            events=[
                {
                    'type': 'translation_review',
                    'actual_content_count': 120,
                    'stored_content_count': 120,
                    'actual_translation_count': 80,
                    'stored_translation_count': 80,
                    'timestamp': self.dt.isoformat()
                },
                {
                    'type': 'exploration_update',
                    'actual_content_count': 122,
                    'stored_content_count': 122,
                    'actual_translation_count': 81,
                    'stored_translation_count': 81,
                    'timestamp': self.dt.isoformat()
                }
            ]
        ).put()
        # Create second model.
        translation_count_debug_tracker_models.TranslationCountDebugTrackerModel( # pylint: disable=line-too-long
            id='exp_id1.es',
            exp_id='exp_id1',
            language_code='es',
            events=[
                {
                    'type': 'translation_review',
                    'actual_content_count': 92,
                    'stored_content_count': 92,
                    'actual_translation_count': 12,
                    'stored_translation_count': 12,
                    'timestamp': self.dt.isoformat()
                }
            ]
        ).put()
        # Create third model.
        translation_count_debug_tracker_models.TranslationCountDebugTrackerModel( # pylint: disable=line-too-long
            id='exp_id2.hi',
            exp_id='exp_id2',
            language_code='hi',
            events=[
                {
                    'type': 'translation_review',
                    'actual_content_count': 62,
                    'stored_content_count': 62,
                    'actual_translation_count': 57,
                    'stored_translation_count': 52,
                    'timestamp': self.dt.isoformat()
                }
            ]
        ).put()

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            translation_count_debug_tracker_models
                .TranslationCountDebugTrackerModel
                    .get_deletion_policy(),
            base_models.DELETION_POLICY.NOT_APPLICABLE)

    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            translation_count_debug_tracker_models
                .TranslationCountDebugTrackerModel
                    .get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER
        )

    def test_get_export_policy(self) -> None:
        expected_export_policy_dict = {
            'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'exp_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'language_code': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'events': base_models.EXPORT_POLICY.NOT_APPLICABLE
        }
        self.assertEqual(
            translation_count_debug_tracker_models
                .TranslationCountDebugTrackerModel
                    .get_export_policy(),
            expected_export_policy_dict
        )

    def test_get_by_exploration_id_and_langauge_code(
        self) -> None:
        model1 = (
            translation_count_debug_tracker_models
                .TranslationCountDebugTrackerModel
                    .get_by_exp_id_and_langauge_code(
                    'exp_id1', 'hi'))

        self.assertIsNotNone(model1)
        if model1 is None:
            raise AssertionError('model1 should not be None')
        self.assertEqual(model1.exp_id, 'exp_id1')
        self.assertEqual(model1.language_code, 'hi')
        self.assertEqual(len(model1.events), 2)
        expected_events_model1 = [
                {
                    'type': 'translation_review',
                    'actual_content_count': 120,
                    'stored_content_count': 120,
                    'actual_translation_count': 80,
                    'stored_translation_count': 80,
                    'timestamp': self.dt.isoformat()
                },
                {
                    'type': 'exploration_update',
                    'actual_content_count': 122,
                    'stored_content_count': 122,
                    'actual_translation_count': 81,
                    'stored_translation_count': 81,
                    'timestamp': self.dt.isoformat()
                }
        ]
        self.assertEqual(model1.events, expected_events_model1)

    def test_get_multi_by_exp_id(self) -> None:
        models_list = (
            translation_count_debug_tracker_models
                .TranslationCountDebugTrackerModel
                    .get_multi_by_exp_id('exp_id1'))
        self.assertEqual(len(models_list), 2)

        models_list = sorted(models_list, key=lambda x: str(x.language_code))

        model1 = models_list[0]
        self.assertEqual(model1.exp_id, 'exp_id1')
        self.assertEqual(model1.language_code, 'es')
        self.assertEqual(len(model1.events), 1)
        expected_events_model1 = [
                {
                    'type': 'translation_review',
                    'actual_content_count': 92,
                    'stored_content_count': 92,
                    'actual_translation_count': 12,
                    'stored_translation_count': 12,
                    'timestamp': self.dt.isoformat()
                }
        ]
        self.assertEqual(model1.events, expected_events_model1)

        model2 = models_list[1]
        self.assertEqual(model2.exp_id, 'exp_id1')
        self.assertEqual(model2.language_code, 'hi')
        self.assertEqual(len(model2.events), 2)
        expected_events_model2 = [
                {
                    'type': 'translation_review',
                    'actual_content_count': 120,
                    'stored_content_count': 120,
                    'actual_translation_count': 80,
                    'stored_translation_count': 80,
                    'timestamp': self.dt.isoformat()
                },
                {
                    'type': 'exploration_update',
                    'actual_content_count': 122,
                    'stored_content_count': 122,
                    'actual_translation_count': 81,
                    'stored_translation_count': 81,
                    'timestamp': self.dt.isoformat()
                }
        ]
        self.assertEqual(model2.events, expected_events_model2)

    def test_get_multi_by_language_code(self) -> None:
        models_list = (
            translation_count_debug_tracker_models
                .TranslationCountDebugTrackerModel
                    .get_multi_by_language_code('hi'))
        self.assertEqual(len(models_list), 2)

        models_list = sorted(models_list, key=lambda x: str(x.exp_id))

        model1 = models_list[0]
        self.assertEqual(model1.exp_id, 'exp_id1')
        self.assertEqual(model1.language_code, 'hi')
        self.assertEqual(len(model1.events), 2)
        expected_events_model1 = [
                {
                    'type': 'translation_review',
                    'actual_content_count': 120,
                    'stored_content_count': 120,
                    'actual_translation_count': 80,
                    'stored_translation_count': 80,
                    'timestamp': self.dt.isoformat()
                },
                {
                    'type': 'exploration_update',
                    'actual_content_count': 122,
                    'stored_content_count': 122,
                    'actual_translation_count': 81,
                    'stored_translation_count': 81,
                    'timestamp': self.dt.isoformat()
                }
        ]
        self.assertEqual(model1.events, expected_events_model1)

        model2 = models_list[1]
        self.assertEqual(model2.exp_id, 'exp_id2')
        self.assertEqual(model2.language_code, 'hi')
        self.assertEqual(len(model2.events), 1)
        expected_events_model2 = [
                {
                    'type': 'translation_review',
                    'actual_content_count': 62,
                    'stored_content_count': 62,
                    'actual_translation_count': 57,
                    'stored_translation_count': 52,
                    'timestamp': self.dt.isoformat()
                }
        ]
        self.assertEqual(model2.events, expected_events_model2)
