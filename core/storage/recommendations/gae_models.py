# coding: utf-8
#
# Copyright 2015 The Oppia Authors. All Rights Reserved.
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

"""Models for Oppia recommendations."""

from __future__ import annotations

from core.platform import models

from typing import Dict, Final

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import base_models
    from mypy_imports import datastore_services

(base_models,) = models.Registry.import_models([models.Names.BASE_MODEL])

datastore_services = models.Registry.import_datastore_services()

TOPIC_SIMILARITIES_ID: Final = 'topics'


class ExplorationRecommendationsModel(
        base_models.BaseMapReduceBatchResultsModel):
    """A list of recommended explorations similar to an exploration.

    Instances of this class are keyed by exploration id.
    """

    # Ids of recommended explorations.
    recommended_exploration_ids = datastore_services.StringProperty(
        repeated=True, indexed=True)

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model doesn't contain any data directly corresponding to a user."""
        return base_models.DELETION_POLICY.NOT_APPLICABLE

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model does not contain user data."""
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model doesn't contain any data directly corresponding to a user."""
        return dict(super(cls, cls).get_export_policy(), **{
            'recommended_exploration_ids':
                base_models.EXPORT_POLICY.NOT_APPLICABLE
        })


class TopicSimilaritiesModel(base_models.BaseModel):
    """This model stores the similarity between any two topics. The topic
    similarities are stored as a JSON object, representing a 2D dict where the
    keys are topic names and the values are the similarities. The dict should
    be symmetric. A similarity value is a real number between 0.0 and 1.0.

    There should only be one instance of this class, and it is keyed by
    TOPIC_SIMILARITIES_ID.

    Currently, topics are the same as the default categories. However, this may
    change in the future.
    """

    content = datastore_services.JsonProperty(required=True)

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model doesn't contain any data directly corresponding to a user."""
        return base_models.DELETION_POLICY.NOT_APPLICABLE

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model does not contain user data."""
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model doesn't contain any data directly corresponding to a user."""
        return dict(super(cls, cls).get_export_policy(), **{
            'content': base_models.EXPORT_POLICY.NOT_APPLICABLE
        })
