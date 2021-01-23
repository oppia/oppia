# coding: utf-8
#
# Copyright 2020 The Oppia Authors. All Rights Reserved.
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

"""Validators for recommendation services in prod."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import json

from core.domain import base_model_validators
from core.domain import recommendations_services
from core.platform import models
import python_utils

(
    exp_models, recommendations_models) = (
        models.Registry.import_models([
            models.NAMES.exploration,
            models.NAMES.recommendations]))


class ExplorationRecommendationsModelValidator(
        base_model_validators.BaseModelValidator):
    """Class for validating ExplorationRecommendationsModel."""

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'exploration_ids', exp_models.ExplorationModel,
                [item.id] + item.recommended_exploration_ids)]

    @classmethod
    def _validate_item_id_not_in_recommended_exploration_ids(cls, item):
        """Validate that model id is not present in recommended
        exploration ids.

        Args:
            item: datastore_services.Model. ExplorationRecommendationsModel
                to validate.
        """

        if item.id in item.recommended_exploration_ids:
            cls._add_error(
                'item exploration %s' % (
                    base_model_validators.ERROR_CATEGORY_ID_CHECK),
                'Entity id %s: The exploration id: %s for which the entity is '
                'created is also present in the recommended exploration ids '
                'for entity' % (item.id, item.id))

    @classmethod
    def _get_custom_validation_functions(cls):
        return [cls._validate_item_id_not_in_recommended_exploration_ids]


class TopicSimilaritiesModelValidator(base_model_validators.BaseModelValidator):
    """Class for validating TopicSimilaritiesModel."""

    @classmethod
    def _get_model_id_regex(cls, unused_item):
        # Valid id: topics.
        return '^%s$' % recommendations_models.TOPIC_SIMILARITIES_ID

    @classmethod
    def _get_external_id_relationships(cls, item):
        return []

    @classmethod
    def _validate_topic_similarities(cls, item):
        """Validate the topic similarities to be symmetric and have real
        values between 0.0 and 1.0.

        Args:
            item: datastore_services.Model. TopicSimilaritiesModel
                to validate.
        """

        content = json.loads(item.content)
        all_topics = list(content.keys())
        data = '%s\n' % ','.join(all_topics)

        for topics_to_compare in all_topics:
            similarity_list = []
            for topic in content[topics_to_compare]:
                similarity_list.append(
                    python_utils.UNICODE(
                        content[topics_to_compare][topic]))
            if len(similarity_list):
                data = data + '%s\n' % ','.join(similarity_list)

        try:
            recommendations_services.validate_topic_similarities(data)
        except Exception as e:
            cls._add_error(
                'topic similarity check',
                'Entity id %s: Topic similarity validation for content: %s '
                'fails with error: %s' % (item.id, content, e))

    @classmethod
    def _get_custom_validation_functions(cls):
        return [cls._validate_topic_similarities]
