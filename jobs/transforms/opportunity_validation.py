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

"""Beam DoFns and PTransforms to provide validation of opportunity models."""

from __future__ import absolute_import
from __future__ import unicode_literals

from core.platform import models
from jobs.decorators import validation_decorators

from typing import Any, Union, Type, Iterator, Tuple, List # isort:skip

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import base_models
    from mypy_imports import exp_models
    from mypy_imports import opportunity_models
    from mypy_imports import story_models
    from mypy_imports import topic_models

(
    opportunity_models, exp_models,
    topic_models, story_models, base_models
) = models.Registry.import_models([
    models.NAMES.opportunity, models.NAMES.exploration,
    models.NAMES.topic, models.NAMES.story, models.NAMES.base_models
])


@validation_decorators.RelationshipsOf( # type: ignore[no-untyped-call, misc]
    opportunity_models.ExplorationOpportunitySummaryModel)
def exploration_opportunity_summary_model_relationships(
        model: Type[opportunity_models.ExplorationOpportunitySummaryModel]
) -> base_models.BaseModel:
    """Yields how the properties of the model relates to the ID of others."""
    yield model.id, [exp_models.ExplorationModel]
    yield model.topic_id, [topic_models.TopicModel]
    yield model.story_id, [story_models.StoryModel]
