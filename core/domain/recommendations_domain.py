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

from typing import List


class ExplorationRecommendations:
    """A domain object for exploration recommendations.
    """

    def __init__(
        self,
        exp_id,
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
        without_dup = set()
        dup = [x for x in self.recommended_exploration_ids
                      if x in without_dup or without_dup.add(x)]
        if len(self.recommended_exploration_ids) != len(without_dup):
            raise utils.ValidationError(
                'recommended_exploration_ids contains duplicate values: %s'
                % dup)
        for recommended_exploration_id in self.recommended_exploration_ids:
            if not isinstance(recommended_exploration_id, str):
                raise utils.ValidationError(
                    'Expected recommended_exploration_id to be a string, '
                    'received %s' % recommended_exploration_id)
            if not recommended_exploration_id:
                raise utils.ValidationError(
                    'Expected recommended_exploration_id to be non-empty, '
                    'received %s' % recommended_exploration_id)
