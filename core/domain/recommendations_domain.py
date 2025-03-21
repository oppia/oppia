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

"""Domain objects for recommendations."""

from __future__ import annotations

from core import utils

from typing import cast, Dict, List, Iterable


class ExplorationRecommendations:
    """A domain object for exploration recommendations."""

    def __init__(
        self,
        exp_id: str,
        recommended_exploration_ids: List[str]
    ) -> None:
        """Constructs an ExplorationRecommendations domain object.

        Args:
            exp_id: str. Id of the exploration for which these 
                recommendations apply.
            recommended_exploration_ids: list(str). Ids of recommended 
                explorations.
        """
        self.recommended_exploration_ids = recommended_exploration_ids
        self.exp_id = exp_id

    def validate(self) -> None:
        """Validates the ExplorationRecommendations object."""
        if not isinstance(self.exp_id, str):
            raise utils.ValidationError(
                'Expected exp_id to be a string, received %s'
                % self.exp_id)
        if not self.exp_id:
            raise utils.ValidationError(
                'Expected exp_id to be non-empty, received %s'
                % self.exp_id)
        if not isinstance(self.recommended_exploration_ids, list):
            raise utils.ValidationError(
                'Expected recommended_exploration_ids to be a list, '
                'received %s' % self.recommended_exploration_ids)   

        counts: Dict[str, int] = {}
        for recommended_exploration_id in self.recommended_exploration_ids:
            counts[recommended_exploration_id] = (
                counts.get(recommended_exploration_id, 0) + 1)

            if not isinstance(recommended_exploration_id, str):
                raise utils.ValidationError(
                    'Expected recommended_exploration_id to be a string, '
                    'received %s' % recommended_exploration_id)
            if not recommended_exploration_id:
                raise utils.ValidationError(
                    'Expected recommended_exploration_id to be non-empty, '
                    'received %s' % recommended_exploration_id)

        self.validate_no_exploration_id_duplicate(counts)

    def validate_no_exploration_id_duplicate(
        self,
        counts: Dict[str, int]
    ) -> None:
        """Validates the counts for recommended_exploration_ids (there
        should be no duplicate).

        Args:
            counts: dict. The dictionary storing the number of times
                an exploration id appears in recommended_exploration_ids.
        """
        non_unique_counts: Dict[str, int] = (
            {exp_id: count for exp_id, count in cast(
                Iterable, counts.items) if count > 1})
        if non_unique_counts:
            duplicates = (', '.join('({}, {})'.format(exp_id, count) for (
                exp_id, count) in cast(Iterable, non_unique_counts.items)))
            raise utils.ValidationError(
                'recommended_exploration_ids contains duplicate values,'
                'received (exp_id, count): %s' % duplicates)
