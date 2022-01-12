# coding: utf-8
#
# Copyright 2021 The Oppia Authors. All Rights Reserved.
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

"""jobs used for migrating the question models"""

from __future__ import annotations

import logging

from core import feconf
from core.domain import question_domain
from core.domain import question_fetchers
from core.domain import question_services
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam
import result

from typing import Iterable, Sequence, Tuple

MYPY = False
if MYPY:
    from mypy_imports import base_models
    from mypy_imports import datastore_services
    from mypy_imports import question_models

(base_models, question_models) = models.Registry.import_models([
    models.NAMES.base_model, models.NAMES.question
])
datastore_services = models.Registry.import_datastore_services()


class MigrateQuestionJob(base_jobs.JobBase):
    """Job that migrates question models"""

    @staticmethod
    def _migrate_question(
        question_id: str, question_model: question_models.QuestionModel
    ) -> result.Result[
        Tuple[str, question_domain.Question], Tuple[str, Exception]
    ]:
        """Migrated question and transform question model into question object.

        Args:
            question_id: str. The id of the question.
            question_model: QuestionModel. The question model to migrate.

        Returns:
            Result((str, Question), (str, Exception)). Result containing tuple
            that consists of a question ID and either question object
            or Exception. Question object is returned if when the migration was
            successful and Exception is returned otherwise.
        """
        try:
            question = question_fetchers.get_question_from_model(question_model)
            question.validate()
        except Exception as e:
            logging.exception(e)
            return result.Err((question_id, e))

        return result.Ok((question_id, question))

    @staticmethod
    def _generate_question_changes(
        question_id: str, question_model: question_models.QuestionModel
    ) -> Iterable[Tuple[str, question_domain.QuestionChange]]:
        """Generate question change objects. Question change object is generated
        when schema version for some field is lower than the latest schema
        version.

        Args:
            question_id: str. The id of the question.
            question_model: QuestionModel. The question for which to generate
                the change object.

        Yields:
            (str, QuestionChange). Tuple containing question id and question
            change object.
        """
        question_version = question_model.question_state_data_schema_version
        if question_version < feconf.CURRENT_STATE_SCHEMA_VERSION:
            question_change = question_domain.QuestionChange({
                'cmd': (
                    question_domain.CMD_MIGRATE_STATE_SCHEMA_TO_LATEST_VERSION),
                'from_version': (
                    question_model.question_state_data_schema_version),
                'to_version': feconf.CURRENT_STATE_SCHEMA_VERSION
            })
            yield (question_id, question_change)

    @staticmethod
    def _update_question(
        question_model: question_models.QuestionModel,
        migrated_question: question_domain.Question,
        question_change: question_domain.QuestionChange
    ) -> Sequence[base_models.BaseModel]:
        """Generates newly updated question models.

        Args:
            question_model: QuestionModel. The question model which should
                be updated.
            migrated_question: Question. The migrated question domain object.
            question_change: QuestionChange. The question change to apply.

        Returns:
            sequence(BaseModel). Sequence of models which should be put into
            the datastore.
        """
        update_question_model = (
            question_services.populate_question_model_fields(
                question_model, migrated_question
            )
        )
        change_dicts = [question_change.to_dict()]
        with datastore_services.get_ndb_context():
            models_to_put = update_question_model.compute_models_to_commit(
                feconf.MIGRATION_BOT_USERNAME,
                feconf.COMMIT_TYPE_EDIT,
                'Updated question state schema version to %d.' % (
                    feconf.CURRENT_STATE_SCHEMA_VERSION),
                change_dicts,
                additional_models={}
            ).values()
        datastore_services.update_timestamps_multi(list(models_to_put))
        return models_to_put

    @staticmethod
    def _update_question_summary(
        migrated_question: question_domain.Question,
        question_summary_model: question_models.QuestionSummaryModel
    ) -> question_models.QuestionSummaryModel:
        """Generate newly updated question summary model.

        Args:
            migrated_question: Question. The migrated question domain object.
            question_summary_model: QuestionSummaryModel. The question summary
                model to update.

        Returns:
            QuestionSummaryModel. The updated question summary model to put into
            the datastore.
        """
        question_summary = question_services.compute_summary_of_question(
            migrated_question)
        updated_question_summary_model = (
            question_services.populate_question_summary_model_fields(
                question_summary_model, question_summary
            )
        )
        return updated_question_summary_model

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of results from the question migration.

        Returns:
            PCollection. A PCollection of results from the question migration.
        """
        unmigrated_question_models = (
            self.pipeline
            | 'Get all non-deleted question models' >> (
                ndb_io.GetModels(question_models.QuestionModel.get_all()))
            # Pylint disable is needed because pylint is not able to correctly
            # detect that the value is passed through the pipe.
            | 'Add question model ID' >> beam.WithKeys( # pylint: disable=no-value-for-parameter
                lambda question_model: question_model.id)
        )
        question_summary_model = (
            self.pipeline
            | 'Get all non-deleted question summary models' >> ndb_io.GetModels(
                question_models.QuestionSummaryModel.get_all())
            # Pylint disable is needed because pylint is not able to correctly
            # detect that the value is passed through the pipe.
            | 'Add question summary ID' >> beam.WithKeys( # pylint: disable=no-value-for-parameter
                lambda question_summary_model: question_summary_model.id)
        )

        migrated_question_result = (
            unmigrated_question_models
            | 'Transform and migrate model' >> beam.MapTuple(
                self._migrate_question)
        )
        migrated_question = (
            migrated_question_result
            | 'Filter oks' >> beam.Filter(
                lambda result_item: result_item.is_ok())
            | 'Unwrap ok' >> beam.Map(
                lambda result_item: result_item.unwrap())
        )
        migrated_question_job_run_results = (
            migrated_question_result
            | 'Generate results for migration' >> (
                job_result_transforms.ResultsToJobRunResults(
                    'QUESTION PROCESSED'))
        )

        question_changes = (
            unmigrated_question_models
            | 'Generate question changes' >> beam.FlatMapTuple(
                self._generate_question_changes)
        )

        question_objects_list = (
            {
                'question_model': unmigrated_question_models,
                'question_summary_model': question_summary_model,
                'question': migrated_question,
                'question_change': question_changes
            }
            | 'Merge objects' >> beam.CoGroupByKey()
            | 'Get rid of ID' >> beam.Values() # pylint: disable=no-value-for-parameter
            | 'Remove unmigrated skills' >> beam.Filter(
                lambda x: (
                    len(x['question_change']) > 0 and
                    len(x['question']) > 0
                ))
            | 'Reorganize the question object' >> beam.Map(lambda objects: {
                'question_model': objects['question_model'][0],
                'question_summary_model': objects['question_summary_model'][0],
                'question': objects['question'][0],
                'question_changes': objects['question_change'][0]
            })
        )

        question_objects_list_job_run_results = (
            question_objects_list
            | 'Transform question objects into job run results' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'QUESTION MIGRATED'))
        )

        question_models_to_put = (
            question_objects_list
            | 'Generate question models to put' >> beam.FlatMap(
                lambda question_objects: self._update_question(
                    question_objects['question_model'],
                    question_objects['question'],
                    question_objects['question_changes'],
                ))
        )

        question_summary_models_to_put = (
            question_objects_list
            | 'Generate question summary models to put' >> beam.Map(
                lambda question_objects: self._update_question_summary(
                    question_objects['question'],
                    question_objects['question_summary_model']
                ))
        )

        unused_put_results = (
            (question_models_to_put, question_summary_models_to_put)
            | 'Merge models' >> beam.Flatten()
            | 'Put models into the datastore' >> ndb_io.PutModels()
        )

        return (
            (
                migrated_question_job_run_results,
                question_objects_list_job_run_results
            )
            | beam.Flatten()
        )
