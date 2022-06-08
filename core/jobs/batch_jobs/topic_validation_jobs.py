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

import re

from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam

(topic_models, ) = models.Registry.import_models([models.NAMES.topic])


class GetSubTopicsWithInvalidUrlFragJob(base_jobs.JobBase):
    """Job that returns invalid topic models."""

    def is_fragment_valid(self, url_frag: str) -> bool:
        """Returns a boolean indicating the validity of url fragment

        Returns:
            Boolean. Returns validity of url fragment.
        """
        if url_frag is None:
            return False

        if len(url_frag) > 25 or len(url_frag) == 0:
            return False

        regex = '^[a-z]+(-[a-z]+)*$'

        return bool(re.match(regex, url_frag))

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns PCollection of invalid topics

        Returns:
            PCollection. Returns PCollection of invalid topics.
        """
        total_topics = (
            self.pipeline
            | 'Get all TopicModels' >> ndb_io.GetModels(
                topic_models.TopicModel.get_all(include_deleted=False))
            | 'Get topic id and subtopics' >> beam.Map(
                lambda topic: (topic.id, list(topic.subtopics))
            )
            | 'Group subtopic info with topic id' >> beam.FlatMap(
                lambda topic: [
                    (topic[0], x['id'], x['url_fragment']) for x in topic[1]
                    ]
            )
        )

        invalid_topic_models = (
            total_topics
            | 'Filter topics with invalid url fragments' >>
                beam.Filter(lambda topic: not self.is_fragment_valid(topic[2]))
        )

        report_number_of_topics_queried = (
            total_topics
            | 'Report count of topic models' >> (
                job_result_transforms.CountObjectsToJobRunResult('TOPICS'))
        )

        report_number_of_invalid_topics = (
            invalid_topic_models
            | 'Report count of invalid topic models' >> (
                job_result_transforms.CountObjectsToJobRunResult('INVALID'))
        )

        report_invalid_ids = (
            invalid_topic_models
            | 'Save info on invalid topics' >> beam.Map(
                lambda topic:
                job_run_result.JobRunResult.as_stderr(
                    'Topic_id: %s, subtopic_id: %s, invalid url_frag: "%s"'
                    % (topic[0], topic[1], topic[2]))
                ))

        return (
            (
                report_number_of_topics_queried,
                report_number_of_invalid_topics,
                report_invalid_ids
            )
            | 'Combine results' >> beam.Flatten()
        )
