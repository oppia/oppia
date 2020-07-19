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
    skill_models, story_models, topic_models,
    question_models
) = models.Registry.import_models([
    models.NAMES.base_model, models.NAMES.config, models.NAMES.collection,
    models.NAMES.exploration, models.NAMES.skill, models.NAMES.story,
    models.NAMES.topic, models.NAMES.question
])


class SnapshotMetadataCommitMsgOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """Job that indexes the commit_msg field of the
    BaseSnapshotMetadataModels.
    """

    @classmethod
    def enqueue(cls, job_id, additional_job_params=None):
        super(SnapshotMetadataCommitMsgOneOffJob, cls).enqueue(
			         job_id, shard_count=64)

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
            topic_models.SubtopicPageSnapshotMetadataModel,
            topic_models.TopicRightsSnapshotMetadataModel,
            topic_models.TopicSnapshotMetadataModel,
            question_models.QuestionSnapshotMetadataModel,
        ]

    @staticmethod
    def map(item):
        item.put(update_last_updated_time=False)
        yield ('SUCCESS', 1)

    @staticmethod
    def reduce(key, values):
        yield (key, len(values))
