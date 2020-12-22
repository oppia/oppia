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

"""One-off jobs for suggestions."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core import jobs
from core.platform import models

(
    base_models, config_models, collection_models, exploration_models,
    skill_models, story_models, topic_models, subtopic_models,
    question_models
) = models.Registry.import_models([
    models.NAMES.base_model, models.NAMES.config, models.NAMES.collection,
    models.NAMES.exploration, models.NAMES.skill, models.NAMES.story,
    models.NAMES.topic, models.NAMES.subtopic, models.NAMES.question
])


class SnapshotMetadataCommitMsgAuditOneOffJob(
        jobs.BaseMapReduceOneOffJobManager):
    """Job that audits the commit_message field of the
    BaseSnapshotMetadataModels to determine frequency of string sizes.
    """

    @classmethod
    def enqueue(cls, job_id, additional_job_params=None):
        super(SnapshotMetadataCommitMsgAuditOneOffJob, cls).enqueue(
            job_id, shard_count=4)

    @classmethod
    def entity_classes_to_map_over(cls):
        return [
            config_models.ConfigPropertySnapshotMetadataModel,
            config_models.PlatformParameterSnapshotMetadataModel,
            collection_models.CollectionSnapshotMetadataModel,
            exploration_models.ExplorationRightsSnapshotMetadataModel,
            exploration_models.ExplorationSnapshotMetadataModel,
            skill_models.SkillSnapshotMetadataModel,
            story_models.StorySnapshotMetadataModel,
            subtopic_models.SubtopicPageSnapshotMetadataModel,
            topic_models.TopicRightsSnapshotMetadataModel,
            topic_models.TopicSnapshotMetadataModel,
            question_models.QuestionSnapshotMetadataModel,
        ]

    @staticmethod
    def map(item):
        model_name = item.__class__.__name__
        model_id = item.id
        identifier_message = '%s with id %s' % (model_name, model_id)
        if len(item.commit_message) <= 1000:
            yield ('LESS_OR_EQUAL_TO_1000', identifier_message)
        elif len(item.commit_message) <= 1500:
            yield ('BETWEEN_1000_AND_1500', identifier_message)
        else:
            yield ('GREATER_THAN_1500', identifier_message)

    @staticmethod
    def reduce(key, values):
        if key == 'LESS_OR_EQUAL_TO_1000':
            yield (key, len(values))
        elif key == 'BETWEEN_1000_AND_1500':
            yield (key, len(values))
        else:
            yield (key, values)


class SnapshotMetadataCommitMsgShrinkOneOffJob(
        jobs.BaseMapReduceOneOffJobManager):
    """Job that audits the commit_message field of the
    BaseSnapshotMetadataModels to determine frequency of string sizes.
    """

    @classmethod
    def enqueue(cls, job_id, additional_job_params=None):
        super(SnapshotMetadataCommitMsgShrinkOneOffJob, cls).enqueue(
            job_id, shard_count=4)

    @classmethod
    def entity_classes_to_map_over(cls):
        return [
            config_models.ConfigPropertySnapshotMetadataModel,
            collection_models.CollectionRightsSnapshotMetadataModel,
            collection_models.CollectionSnapshotMetadataModel,
            exploration_models.ExplorationRightsSnapshotMetadataModel,
            exploration_models.ExplorationSnapshotMetadataModel,
            skill_models.SkillSnapshotMetadataModel,
            story_models.StorySnapshotMetadataModel,
            subtopic_models.SubtopicPageSnapshotMetadataModel,
            topic_models.TopicRightsSnapshotMetadataModel,
            topic_models.TopicSnapshotMetadataModel,
            question_models.QuestionSnapshotMetadataModel,
        ]

    @staticmethod
    def map(item):
        model_name = item.__class__.__name__
        model_id = item.id
        identifier_message = '%s with id %s' % (model_name, model_id)
        if len(item.commit_message) > 1000:
            item.commit_message = item.commit_message[:1000]
            item.update_timestamps(update_last_updated_time=False)
            item.put()
            yield ('TRUNCATED', identifier_message)
        else:
            yield ('NOT_TRUNCATED', identifier_message)

    @staticmethod
    def reduce(key, values):
        if key == 'NOT_TRUNCATED':
            yield (key, len(values))
        else:
            yield (key, values)
