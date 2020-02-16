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

from google.appengine.ext import ndb

(base_models,) = models.Registry.import_models([models.NAMES.base_model])

TOPIC_SIMILARITIES_ID = 'topics'


class ExplorationRecommendationsModel(
        base_models.BaseMapReduceBatchResultsModel):
    """A list of recommended explorations similar to an exploration.

    Instances of this class are keyed by exploration id.
    """
    # Ids of recommended explorations.
    recommended_exploration_ids = ndb.StringProperty(
        repeated=True, indexed=False)

    @staticmethod
    def get_deletion_policy():
        """Exploration recommendations are deleted only if the corresponding
        exploration is not public.
        """
        return base_models.DELETION_POLICY.KEEP_IF_PUBLIC

    @staticmethod
    def get_export_policy():
        """Model does not contain user data."""
        return base_models.EXPORT_POLICY.NOT_APPLICABLE

    @classmethod
    def has_reference_to_user_id(cls, unused_user_id):
        """ExplorationRecommendationsModel doesn't reference any user_id
        directly.

        Args:
            unused_user_id: str. The (unused) ID of the user whose data
            should be checked.

        Returns:
            bool. Whether any models refer to the given user ID.
        """
        return False

    @staticmethod
    def get_user_id_migration_policy():
        """ExplorationRecommendationsModel doesn't have any field with user
        ID.
        """
        return base_models.USER_ID_MIGRATION_POLICY.NOT_APPLICABLE


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
    content = ndb.JsonProperty(required=True)

    @staticmethod
    def get_deletion_policy():
        """There is only a single TopicSimilaritiesModel in the entire
        codebase.
        """
        return base_models.DELETION_POLICY.NOT_APPLICABLE

    @staticmethod
    def get_export_policy():
        """Model does not contain user data."""
        return base_models.EXPORT_POLICY.NOT_APPLICABLE

    @staticmethod
    def get_user_id_migration_policy():
        """TopicSimilaritiesModel doesn't have any field with user ID."""
        return base_models.USER_ID_MIGRATION_POLICY.NOT_APPLICABLE
