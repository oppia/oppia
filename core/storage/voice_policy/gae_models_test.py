# coding: utf-8
#
# Copyright 2024 The Oppia Authors. All Rights Reserved.
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

"""Models for storing language accent codes for Oppia-supported voiceovers."""

from __future__ import annotations

from core.platform import models
from core.tests import test_utils

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import base_models
    from mypy_imports import voice_policy_models

(base_models, voice_policy_models) = models.Registry.import_models([
    models.Names.BASE_MODEL, models.Names.VOICE_POLICY
])


class VoiceoverPolicyModelTest(test_utils.GenericTestBase):
    """Unit tests for VoiceoverPolicyModel class."""

    def test_get_export_policy_not_applicable(self) -> None:
        self.assertEqual(
            voice_policy_models.VoiceoverPolicyModel.get_export_policy(),
            {
                'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'language_code_mapping': (
                    base_models.EXPORT_POLICY.NOT_APPLICABLE)
            }
        )

    def test_get_deletion_policy_not_applicable(self) -> None:
        self.assertEqual(
            voice_policy_models.VoiceoverPolicyModel.get_deletion_policy(),
            base_models.DELETION_POLICY.NOT_APPLICABLE)

    def test_get_model_association_to_user_not_corresponding_to_user(
        self
    ) -> None:
        self.assertEqual(
            (
                voice_policy_models.VoiceoverPolicyModel
                .get_model_association_to_user()
            ),
            base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER)

    def test_get_voiceover_policy_model_returns_correctly(self) -> None:
        language_code_mapping_dict = {
            'en': {
                'en-US': False
            },
            'hi': {
                'hi-In': False
            }
        }
        voice_policy_models.VoiceoverPolicyModel(
            language_code_mapping=language_code_mapping_dict).put()

        voice_policy_model = (
            voice_policy_models.VoiceoverPolicyModel.get_model())
        assert voice_policy_model is not None

        self.assertDictEqual(
            voice_policy_model.language_code_mapping,
            language_code_mapping_dict)
