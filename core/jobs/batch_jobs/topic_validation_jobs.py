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

"""Validation Jobs for topic model"""

from __future__ import annotations

from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam

(topic_models, ) = models.Registry.import_models([models.NAMES.topic])


class GetNumberOfTopicsExceedsMaxAbbNameJob(base_jobs.JobBase):
    """Job that returns topics having abb. name longer than 39."""

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns PCollection of invalid topics with their id and
        abb. name.

        Returns:
            PCollection. Returns PCollection of invalid topic with
            their id and abb. name.
        """
        total_topics = (
            self.pipeline
            | 'Get all TopicModels' >> ndb_io.GetModels(
                topic_models.TopicModel.get_all(include_deleted=False))
            | 'Combine topic ids and abb. name' >> beam.Map(
                lambda topic: (topic.id, topic.abbreviated_name))
        )

        topic_ids_with_exceeding_abb_name = (
            total_topics
            | 'Filter topics with abb. name greater than 39' >>
                beam.Filter(lambda topic: len(topic[1]) > 39)
        )

        report_number_of_topics_queried = (
            total_topics
            | 'Report count of topic models' >> (
                job_result_transforms.CountObjectsToJobRunResult('TOPICS'))
        )

        report_number_of_invalid_topics = (
            topic_ids_with_exceeding_abb_name
            | 'Report count of invalid topic models' >> (
                job_result_transforms.CountObjectsToJobRunResult('INVALID'))
        )

        report_invalid_ids_and_their_actual_len = (
            topic_ids_with_exceeding_abb_name
            | 'Save info on invalid topics' >> beam.Map(
                lambda objects: job_run_result.JobRunResult.as_stderr(
                    'The id of topic is %s and its abb. name len is %s'
                    % (objects[0], len(objects[1]))
                ))
        )

        return (
            (
                report_number_of_topics_queried,
                report_number_of_invalid_topics,
                report_invalid_ids_and_their_actual_len
            )
            | 'Combine results' >> beam.Flatten()
        )
