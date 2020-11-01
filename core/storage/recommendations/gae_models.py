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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.platform import models

(base_models,) = models.Registry.import_models([models.NAMES.base_model])

datastore_services = models.Registry.import_datastore_services()

TOPIC_SIMILARITIES_ID = 'topics'


class ExplorationRecommendationsModel(
        base_models.BaseMapReduceBatchResultsModel):
    """A list of recommended explorations similar to an exploration.

    Instances of this class are keyed by exploration id.
    """

    # Ids of recommended explorations.
    recommended_exploration_ids = datastore_services.StringProperty(
        repeated=True, indexed=True)

    @staticmethod
    def get_deletion_policy():
        """ExplorationRecommendationsModel doesn't contain any data directly
        corresponding to a user.
        """
        return base_models.DELETION_POLICY.NOT_APPLICABLE

    @classmethod
    def get_export_policy(cls):
        """Model does not contain user data."""
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
    def get_deletion_policy():
        """There is only a single TopicSimilaritiesModel in the entire
        codebase.
        """
        return base_models.DELETION_POLICY.NOT_APPLICABLE

    @classmethod
    def get_export_policy(cls):
        """Model does not contain user data."""
        return dict(super(cls, cls).get_export_policy(), **{
            'content': base_models.EXPORT_POLICY.NOT_APPLICABLE
        })
