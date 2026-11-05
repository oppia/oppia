# coding: utf-8
#
# Copyright 2026 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for recommendations_domain."""

from __future__ import annotations

from core.domain import recommendations_domain
from core.tests import test_utils


class ExplorationRecommendationsUnitTests(test_utils.GenericTestBase):
    """Tests for the ExplorationRecommendations domain object."""

    def setUp(self) -> None:
        super().setUp()
        self.exploration_recommendations = (
            recommendations_domain.ExplorationRecommendations(
                'exp_id_1', ['exp_id_2', 'exp_id_3']
            )
        )

    def test_init(self) -> None:
        self.assertEqual(
            self.exploration_recommendations.exploration_id, 'exp_id_1'
        )
        self.assertEqual(
            self.exploration_recommendations.recommended_exploration_ids,
            ['exp_id_2', 'exp_id_3'],
        )

    def test_validate_passes_for_valid_object(self) -> None:
        self.exploration_recommendations.validate()

    def test_validate_passes_with_no_recommendations(self) -> None:
        exploration_recommendations = (
            recommendations_domain.ExplorationRecommendations('exp_id_1', [])
        )
        exploration_recommendations.validate()

    def test_validate_allows_more_than_ten_recommendations(self) -> None:
        # The cap of 10 is applied when recommendations are generated, not in
        # validate(), so that legacy entities are not rejected.
        exploration_recommendations = (
            recommendations_domain.ExplorationRecommendations(
                'exp_id_1', ['rec_id_%s' % index for index in range(11)]
            )
        )
        exploration_recommendations.validate()

    def test_validate_rejects_empty_exploration_id(self) -> None:
        self._assert_validation_error(
            recommendations_domain.ExplorationRecommendations('', ['exp_id_2']),
            'Exploration id should not be empty.',
        )

    def test_validate_rejects_invalid_exploration_id(self) -> None:
        self._assert_validation_error(
            recommendations_domain.ExplorationRecommendations(
                'exp id!', ['exp_id_2']
            ),
            'Exploration id contains invalid',
        )

    def test_validate_rejects_too_long_exploration_id(self) -> None:
        self._assert_validation_error(
            recommendations_domain.ExplorationRecommendations(
                'a' * 13, ['exp_id_2']
            ),
            'Exploration id contains invalid',
        )

    def test_validate_rejects_empty_recommended_exploration_id(self) -> None:
        self._assert_validation_error(
            recommendations_domain.ExplorationRecommendations(
                'exp_id_1', ['exp_id_2', '']
            ),
            'Recommended exploration id should not be empty.',
        )

    def test_validate_rejects_invalid_recommended_exploration_id(self) -> None:
        self._assert_validation_error(
            recommendations_domain.ExplorationRecommendations(
                'exp_id_1', ['exp id!']
            ),
            'Recommended exploration id contains invalid',
        )

    def test_validate_rejects_duplicate_recommendations(self) -> None:
        self._assert_validation_error(
            recommendations_domain.ExplorationRecommendations(
                'exp_id_1', ['exp_id_2', 'exp_id_2']
            ),
            'Recommended exploration ids should not contain duplicates.',
        )

    def test_validate_rejects_self_recommendation(self) -> None:
        self._assert_validation_error(
            recommendations_domain.ExplorationRecommendations(
                'exp_id_1', ['exp_id_2', 'exp_id_1']
            ),
            'Exploration exp_id_1 should not be recommended after itself.',
        )

    def test_to_dict(self) -> None:
        self.assertEqual(
            self.exploration_recommendations.to_dict(),
            {
                'exploration_id': 'exp_id_1',
                'recommended_exploration_ids': ['exp_id_2', 'exp_id_3'],
            },
        )

    def test_from_dict(self) -> None:
        exploration_recommendations = (
            recommendations_domain.ExplorationRecommendations.from_dict(
                {
                    'exploration_id': 'exp_id_1',
                    'recommended_exploration_ids': ['exp_id_2', 'exp_id_3'],
                }
            )
        )
        self.assertEqual(exploration_recommendations.exploration_id, 'exp_id_1')
        self.assertEqual(
            exploration_recommendations.recommended_exploration_ids,
            ['exp_id_2', 'exp_id_3'],
        )

    def test_from_dict_round_trips_to_dict(self) -> None:
        self.assertEqual(
            recommendations_domain.ExplorationRecommendations.from_dict(
                self.exploration_recommendations.to_dict()
            ).to_dict(),
            self.exploration_recommendations.to_dict(),
        )
