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

"""Domain objects related to recommendations."""

from __future__ import annotations

from core import utils

from typing import List


class ExplorationRecommendations:
    """A domain object for the exploration recommendations instance.

    NOTE: This domain object corresponds to ExplorationRecommendationsModel
    in the storage layer.
    """

    def __init__(
        self,
        recommended_exploration_ids: List[str]
    ) -> None:
        """Constructs an ExplorationRecommendations domain object.

        Args:
            recommended_exploration_ids: list(str). Ids of recommended 
                explorations.
        """
        self.recommended_exploration_ids = recommended_exploration_ids

    def validate(self) -> None:
        """Validates the ExplorationRecommendations object."""
        if not isinstance(self.recommended_exploration_ids, list):
            raise utils.ValidationError(
                'Expected recommended_exploration_ids to be a list, '
                'received %s' % self.recommended_exploration_ids)   
        if len(self.recommended_exploration_ids) != len(
            set(self.recommended_exploration_ids)):
            raise utils.ValidationError(
                'recommended_exploration_ids contains duplicate values: %s' 
                % self.recommended_exploration_ids)
        for recommended_exploration_id in self.recommended_exploration_ids:
            if not isinstance(recommended_exploration_id, str):
                raise utils.ValidationError(
                    'Expected recommended_exploration_id to be a string, '
                    'received %s' % recommended_exploration_id)
            if not recommended_exploration_id:
                raise utils.ValidationError(
                    'Expected recommended_exploration_id to be non-empty, '
                    'received %s' % recommended_exploration_id)
