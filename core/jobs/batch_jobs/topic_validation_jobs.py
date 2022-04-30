# coding: utf-8
#
# Copyright 2022 The Oppia Authors. All Rights Reserved.
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

"""Validation jobs for topic models"""

from __future__ import annotations

from core.domain import topic_fetchers
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam

(topic_models, ) = models.Registry.import_models([models.NAMES.topic])


class GetNumberOfTopicsWhereStoryIsPublishedNotBoolJob(base_jobs.JobBase):
    """Job that returns topics where story_is_published value is not bool."""

    def checking_bool_values(self, references) -> bool:
        """Returns True if the value is not bool.

        Args:
            references: list. List of all canonical_story_references.

        Returns:
            Boolean value. True if the value of story_is_published is not bool.
        """
        for reference in references:
            if not isinstance(reference.story_is_published, bool):
                return True
        return False

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns PCollection of invalid topics which have story_is_published
        value is not bool with their id.

        Returns:
            PCollection. Returns PCollection of invalid topics which have
            story_is_published value is not bool with their id.
        """
        total_topics = (
            self.pipeline
            | 'Get all TopicModels' >> ndb_io.GetModels(
                topic_models.TopicModel.get_all(include_deleted=False))
            | 'Get topic from model' >> beam.Map(
                topic_fetchers.get_topic_from_model)
        )

        topics_with_story_is_published_value_not_bool = (
            total_topics
            | 'Combine topic ids and story_is_published' >> beam.Map(
                lambda topic: (topic.id, topic.canonical_story_references))
            | 'Filter topics with story_is_published value not Bool' >>
                beam.Filter(lambda topic: self.checking_bool_values(topic[1]))
        )

        report_number_of_topics_queried = (
            total_topics
            | 'Report count of topic models' >> (
                job_result_transforms.CountObjectsToJobRunResult('Topics'))
        )

        report_number_of_invalid_topics = (
            topics_with_story_is_published_value_not_bool
            | 'Report count of invalid topic models' >> (
                job_result_transforms.CountObjectsToJobRunResult('Invalid'))
        )

        report_invalid_ids_and_their_actual_type = (
            topics_with_story_is_published_value_not_bool
            | 'Save info on invalid topics' >> beam.Map(
                lambda objects: job_run_result.JobRunResult.as_stderr(
                    'The id of topic which has non boolean value is %s'
                    % (objects[0])
                ))
        )

        return (
            (
                report_number_of_topics_queried,
                report_number_of_invalid_topics,
                report_invalid_ids_and_their_actual_type
            )
            | 'Combine results' >> beam.Flatten()
        )
