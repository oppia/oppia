
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

"""Validators for config models."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime
import itertools
import re

from constants import constants

from core.domain import config_domain

import feconf
import python_utils
import utils

(
    base_models, collection_models, config_models,
    email_models, exp_models, feedback_models,
    improvements_models, job_models, question_models,
    recommendations_models, skill_models, stats_models,
    story_models, subtopic_models, suggestion_models,
    topic_models, user_models
) = models.Registry.import_models([
    models.NAMES.base_model, models.NAMES.collection, models.NAMES.config,
    models.NAMES.email, models.NAMES.exploration, models.NAMES.feedback,
    models.NAMES.improvements, models.NAMES.job, models.NAMES.question,
    models.NAMES.recommendations, models.NAMES.skill, models.NAMES.statistics,
    models.NAMES.story, models.NAMES.subtopic, models.NAMES.suggestion,
    models.NAMES.topic, models.NAMES.user
])

ALLOWED_AUDIO_EXTENSIONS = list(feconf.ACCEPTED_AUDIO_EXTENSIONS.keys())
ALLOWED_IMAGE_EXTENSIONS = list(itertools.chain.from_iterable(
    iter(feconf.ACCEPTED_IMAGE_FORMATS_AND_EXTENSIONS.values())))
ASSETS_PATH_REGEX = '/exploration/[A-Za-z0-9-_]{1,12}/assets/'
IMAGE_PATH_REGEX = (
    '%simage/[A-Za-z0-9-_]{1,}\\.(%s)' % (
        ASSETS_PATH_REGEX, ('|').join(ALLOWED_IMAGE_EXTENSIONS)))
AUDIO_PATH_REGEX = (
    '%saudio/[A-Za-z0-9-_]{1,}\\.(%s)' % (
        ASSETS_PATH_REGEX, ('|').join(ALLOWED_AUDIO_EXTENSIONS)))
USER_ID_REGEX = 'uid_[a-z]{32}'
ALL_CONTINUOUS_COMPUTATION_MANAGERS_CLASS_NAMES = [
    'DashboardRecentUpdatesAggregator',
    'ExplorationRecommendationsAggregator',
    'FeedbackAnalyticsAggregator',
    'InteractionAnswerSummariesAggregator',
    'SearchRanker',
    'StatisticsAggregator',
    'UserImpactAggregator',
    'UserStatsAggregator']
TARGET_TYPE_TO_TARGET_MODEL = {
    suggestion_models.TARGET_TYPE_EXPLORATION: (
        exp_models.ExplorationModel),
    suggestion_models.TARGET_TYPE_QUESTION: (
        question_models.QuestionModel),
    suggestion_models.TARGET_TYPE_SKILL: (
        skill_models.SkillModel),
    suggestion_models.TARGET_TYPE_TOPIC: (
        topic_models.TopicModel)
}
V
class ConfigPropertyModelValidator(base_model_validators.BaseModelValidator):
    """Class for validating ConfigPropertyModel."""

    @classmethod
    def _get_model_id_regex(cls, unused_item):
        return r'^[A-Za-z0-9_]{1,100}$'

    @classmethod
    def _get_external_id_relationships(cls, item):
        snapshot_model_ids = [
            '%s-%d' % (item.id, version)
            for version in python_utils.RANGE(1, item.version + 1)]
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'snapshot_metadata_ids',
                config_models.ConfigPropertySnapshotMetadataModel,
                snapshot_model_ids),
            base_model_validators.ExternalModelFetcherDetails(
                'snapshot_content_ids',
                config_models.ConfigPropertySnapshotContentModel,
                snapshot_model_ids)]


class ConfigPropertySnapshotMetadataModelValidator(
        base_model_validators.BaseSnapshotMetadataModelValidator):
    """Class for validating ConfigPropertySnapshotMetadataModel."""

    EXTERNAL_MODEL_NAME = 'config property'

    @classmethod
    def _get_model_id_regex(cls, unused_item):
        return r'^[A-Za-z0-9_]{1,100}-\d+$'

    @classmethod
    def _get_change_domain_class(cls, unused_item):
        return config_domain.ConfigPropertyChange

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'config_property_ids',
                config_models.ConfigPropertyModel,
                [item.id[:item.id.rfind(base_models.VERSION_DELIMITER)]]),
            base_model_validators.ExternalModelFetcherDetails(
                'committer_ids',
                user_models.UserSettingsModel, [item.committer_id])]



        base_model_validators.BaseSnapshotContentModelValidator):
    """Class for validating PlatformParameterSnapshotContentModel."""

    EXTERNAL_MODEL_NAME = 'platform parameter'

    @classmethod
    def _get_model_id_regex(cls, unused_item):
        return r'^[A-Za-z0-9_]{1,100}-\d+$'

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'platform_parameter_ids',
                config_models.PlatformParameterModel,
                [item.id[:item.id.find('-')]]
            )
        ]
