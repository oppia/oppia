# coding: utf-8
#
# Copyright 2024 The Oppia Authors. All Rights Reserved.
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

from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import topic_models

(topic_models,) = models.Registry.import_models([models.Names.TOPIC])


class ValidateTopicModelsJob(base_jobs.JobBase):
    """Validates that each TopicModel has a corresponding TopicSummaryModel."""

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        topic_models_pcoll = (
            self.pipeline
            | 'Get all TopicModels' >> (
                ndb_io.GetModels(topic_models.TopicModel.get_all()))
            | 'Extract topic model ids' >> beam.Map(
                lambda model: model.id)
        )

        topic_summary_models_pcoll = (
            self.pipeline
            | 'Get all TopicSummaryModels' >> (
                ndb_io.GetModels(topic_models.TopicSummaryModel.get_all()))
            | 'Extract topic summary model ids' >> beam.Map(
                lambda model: model.id)
        )

        all_topic_ids = (
            topic_models_pcoll
            | 'Pair topic model ids with "model"' >> beam.Map(
                lambda model_id: (model_id, 'model'))
        )

        all_summary_ids = (
            topic_summary_models_pcoll
            | 'Pair topic summary model ids with "summary"' >> beam.Map(
                lambda summary_id: (summary_id, 'summary'))
        )

        all_ids = (
            (all_topic_ids, all_summary_ids)
            | 'Merge topic and summary ids' >> beam.Flatten()
        )

        grouped_ids = (
            all_ids
            | 'Group by ids' >> beam.GroupByKey()
        )

        valid_topic_ids = (
            grouped_ids
            | 'Filter valid ids' >> beam.Filter(
                lambda key_value: 'model' in key_value[1] and 'summary' in key_value[1])
            | 'Extract valid topic ids' >> beam.Map(lambda key_value: key_value[0])
        )

        invalid_topic_ids = (
            grouped_ids
            | 'Filter invalid ids' >> beam.Filter(
                lambda key_value: 'model' in key_value[1] and 'summary' not in key_value[1])
            | 'Extract invalid topic ids' >> beam.Map(lambda key_value: key_value[0])
        )

        valid_count = (
            valid_topic_ids
            | 'Count valid TopicModels' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'CountValidTopicModels'))
        )

        invalid_count = (
            invalid_topic_ids
            | 'Count invalid TopicModels' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'CountInvalidTopicModels'))
        )

        invalid_models_report = (
            invalid_topic_ids
            | 'Report invalid TopicModels' >> beam.Map(
                lambda model_id: job_run_result.JobRunResult.as_stderr(
                    'Invalid TopicModel with id: %s' % model_id))
        )

        return (
            (valid_count, invalid_count, invalid_models_report)
            | 'Flatten results' >> beam.Flatten()
        )
