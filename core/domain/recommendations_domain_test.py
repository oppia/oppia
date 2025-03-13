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

"""Tests for domain objects related to recommendations."""

from __future__ import annotations

from core import utils
from core.domain import recommendations_domain
from core.tests import test_utils


class ExplorationRecommendationsUnitTests(test_utils.GenericTestBase):
    """Test for ExplorationRecommendations domain class."""

    def test_creation_of_object(self) -> None:
        recommended_exploration_ids = ['1']
        exploration_recommendations = (
            recommendations_domain.ExplorationRecommendations(
            recommended_exploration_ids))
        self.assertEqual(
            exploration_recommendations.recommended_exploration_ids[0], '1')

    def test_validate_invalid_recommended_ids_value_type_raises_exception(
        self
    ) -> None:
        # TODO(#13059): Here we use MyPy ignore because after we fully type the
        # codebase we plan to get rid of the tests that intentionally test wrong
        # inputs that we can normally catch by typing.
        recommended_exploration_ids = 123  # type: ignore[assignment]
        exploration_recommendations = (
            recommendations_domain.ExplorationRecommendations(
            recommended_exploration_ids))
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected recommended_exploration_ids to be a list'):
            exploration_recommendations.validate()

        # TODO(#13059): Here we use MyPy ignore because after we fully type the
        # codebase we plan to get rid of the tests that intentionally test wrong
        # inputs that we can normally catch by typing.
        recommended_exploration_ids = True  # type: ignore[assignment]
        exploration_recommendations = (
            recommendations_domain.ExplorationRecommendations(
            recommended_exploration_ids))
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected recommended_exploration_ids to be a list'):
            exploration_recommendations.validate()

    # TODO(#13059): Here we use MyPy ignore because after we fully type the
    # codebase we plan to get rid of the tests that intentionally test wrong
    # inputs that we can normally catch by typing.
    def test_validate_non_str_recommended_id_raises_exception(
        self
    ) -> None:
        recommended_exploration_ids = [0]  # type: ignore[list-item]
        exploration_recommendations = (
            recommendations_domain.ExplorationRecommendations(
            recommended_exploration_ids))
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected recommended_exploration_id to be a string'
        ):
            exploration_recommendations.validate()

    def test_validate_empty_str_recommended_id_raises_exception(
        self
    ) -> None:
        recommended_exploration_ids = ['']
        exploration_recommendations = (
            recommendations_domain.ExplorationRecommendations(
            recommended_exploration_ids))
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected recommended_exploration_id to be non-empty'
        ):
            exploration_recommendations.validate()

    def test_validate_recommended_ids_with_duplicate_value_raise_exception(
        self
    ) -> None:
        recommended_exploration_ids = ['1', '2', '1']
        exploration_recommendations = (
            recommendations_domain.ExplorationRecommendations(
            recommended_exploration_ids))

        with self.assertRaisesRegex(
            utils.ValidationError,
            'recommended_exploration_ids contains duplicate values:'):
            exploration_recommendations.validate()
