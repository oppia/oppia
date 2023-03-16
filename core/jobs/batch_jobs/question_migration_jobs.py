# coding: utf-8
#
# Copyright 2023 The Oppia Authors. All Rights Reserved.
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

"""Jobs used for migrating the question models."""

from __future__ import annotations

import logging

from core import feconf
from core.domain import question_domain
from core.domain import question_fetchers
from core.domain import question_services
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms
from core.jobs.transforms import results_transforms
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam
import result
from typing import Iterable, Sequence, Tuple

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import base_models
    from mypy_imports import datastore_services
    from mypy_imports import question_models

(base_models, question_models) = models.Registry.import_models([
    models.Names.BASE_MODEL, models.Names.QUESTION])
datastore_services = models.Registry.import_datastore_services()

class AddVersionToQuestionSummaryOneOffJob(base_jobs.JobBase):
    """Job that populates version in QuestionSummary models."""

    @staticmethod
    def _update_topic_summary(
        migrated_topic: topic_domain.Topic,
        topic_summary_model: topic_models.TopicSummaryModel
    ) -> topic_models.TopicSummaryModel:
        """Generates newly updated topic summary model.

        Args:
            migrated_topic: Topic. The migrated topic domain object.
            topic_summary_model: TopicSummaryModel. The topic summary model to
                update.

        Returns:
            TopicSummaryModel. The updated topic summary model to put into the
            datastore.
        """

        topic_summary = topic_services.compute_summary_of_topic(migrated_topic)
        topic_summary.version += 1
        updated_topic_summary_model = (
            topic_services.populate_topic_summary_model_fields(
                topic_summary_model, topic_summary
            )
        )
        return updated_topic_summary_model

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of results from the question migration.

        Returns:
            PCollection. A PCollection of results from the question
            migration.
        """

        question_summary_models = (
            self.pipeline
            | 'Get all non-deleted question summary models' >> (
                ndb_io.GetModels(
                    question_models.QuestionSummaryModel.get_all()
                )
            )
            # Pylint disable is needed because pylint is not able to correctly
            # detect that the value is passed through the pipe.
            | 'Add question summary keys' >> beam.WithKeys( # pylint: disable=no-value-for-parameter
                lambda question_summary_model: question_summary_model.id)
        )

        topic_models_to_put = (
            transformed_topic_objects_list
            | 'Generate topic models to put' >> beam.FlatMap(
                lambda topic_objects: self._update_topic(
                    topic_objects['topic_model'],
                    topic_objects['topic'],
                    topic_objects['topic_changes'],
                ))
        )

        topic_summary_model_to_put = (
            transformed_topic_objects_list
            | 'Generate topic summary to put' >> beam.Map(
                lambda topic_objects: self._update_topic_summary(
                    topic_objects['topic'],
                    topic_objects['topic_summary_model']
                ))
        )

        unused_put_results = (
            (topic_models_to_put, topic_summary_model_to_put)
            | 'Merge models' >> beam.Flatten()
            | 'Put models into datastore' >> ndb_io.PutModels()
        )

        return job_run_results