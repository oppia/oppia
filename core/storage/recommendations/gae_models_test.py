# Copyright 2017 The Oppia Authors. All Rights Reserved.
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

"""Tests for core.storage.question.gae_models."""

from __future__ import annotations

from core.platform import models
from core.tests import test_utils

from typing import Final

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import base_models
    from mypy_imports import recommendations_models

(base_models, recommendations_models) = models.Registry.import_models([
    models.Names.BASE_MODEL, models.Names.RECOMMENDATIONS
])


class ExplorationRecommendationsModelUnitTests(test_utils.GenericTestBase):
    """Tests the ExplorationRecommendationsModel class."""

    RECOMMENDATION_1_ID: Final = 'rec_1_id'
    RECOMMENDATION_2_ID: Final = 'rec_2_id'
    RECOMMENDATION_3_ID: Final = 'rec_3_id'

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            recommendations_models.ExplorationRecommendationsModel
            .get_deletion_policy(),
            base_models.DELETION_POLICY.NOT_APPLICABLE)

    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            recommendations_models.ExplorationRecommendationsModel.
                get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER)

    def test_get_export_policy(self) -> None:
        expected_export_policy_dict = {
            'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'recommended_exploration_ids': (
                base_models.EXPORT_POLICY.NOT_APPLICABLE),
        }
        self.assertEqual(
            recommendations_models.ExplorationRecommendationsModel
            .get_export_policy(),
            expected_export_policy_dict)


class TopicSimilaritiesModelUnitTests(test_utils.GenericTestBase):
    """Tests the TopicSimilaritiesModel class."""

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            recommendations_models.TopicSimilaritiesModel.get_deletion_policy(),
            base_models.DELETION_POLICY.NOT_APPLICABLE)

    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            recommendations_models.TopicSimilaritiesModel.
                get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER)

    def test_get_export_policy(self) -> None:
        expected_export_policy_dict = {
            'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'content': base_models.EXPORT_POLICY.NOT_APPLICABLE,
        }
        self.assertEqual(
            recommendations_models.TopicSimilaritiesModel.get_export_policy(),
            expected_export_policy_dict)
