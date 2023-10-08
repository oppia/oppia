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


class PopulateQuestionSummaryVersionOneOffJob(base_jobs.JobBase):
    """Job that adds a version field to QuestionSummary models."""

    @staticmethod
    def _regenerate_question_summary(
        question_id: str,
        question_model: question_models.QuestionModel
    ) -> result.Result[Tuple[str, question_models.QuestionSummaryModel],
     Tuple[str, Exception]
    ]:
        """Validates question and regenerates the question summary model.

        Args:
            question_id: str. The id of the question.
            question_model: QuestionModel. The question model.

        Returns:
            Result((str, QuestionSummaryModel), (str, Exception)). Result
            containing tuple which consist of question ID and either question
            summary model or Exception. Question summary model is returned when
            the validation was successful and Exception is returned otherwise.
        """
        try:
            with datastore_services.get_ndb_context():
                question = question_fetchers.get_question_from_model(
                    question_model)
            question.validate()
        except Exception as e:
            logging.exception(e)
            return result.Err((question_id, e))
        question_summary = question_services.compute_summary_of_question(
            question)
        with datastore_services.get_ndb_context():
            question_summary_model = question_models.QuestionSummaryModel(
                id=question_summary.id,
                question_model_last_updated=question_summary.last_updated,
                question_model_created_on=question_summary.created_on,
                question_content=question_summary.question_content,
                misconception_ids=question_summary.misconception_ids,
                interaction_id=question_summary.interaction_id,
                version=question_summary.version
            )
        question_summary_model.update_timestamps()
        return result.Ok((question_id, question_summary_model))

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of results from the question summary
        migration.

        Returns:
            PCollection. A PCollection of results from the
            question summary migration.
        """
        all_question_models = (
            self.pipeline
            | 'Get all non-deleted question models' >> (
                ndb_io.GetModels(question_models.QuestionModel.get_all()))
            # Pylint disable is needed becasue pylint is not able to correclty
            # detect that the value is passed through the pipe.
            | 'Add question keys' >> beam.WithKeys( # pylint: disable=no-value-for-parameter
                lambda model: model.id)
        )

        question_summary_models = (
            all_question_models
            | 'Regenerate question summaries' >> beam.MapTuple(
                self._regenerate_question_summary)
        )

        regenerated_question_summary_results = (
            question_summary_models
            | 'Generates results' >> (
                job_result_transforms.ResultsToJobRunResults(
                    'QUESTION SUMMARY PROCESSED'))
        )
        question_summary_models_to_put = (
            question_summary_models
            | 'Filter oks' >> beam.Filter(
                lambda result_item: result_item.is_ok())
            | 'Unwrap ok' >> beam.Map(
                lambda result_item: result_item.unwrap())
            | 'Get rid of ID' >> beam.Values() # pylint: disable=no-value-for-parameter
        )

        unused_put_results = (
            question_summary_models_to_put
            | 'Put models into datastore' >> ndb_io.PutModels()
        )

        return regenerated_question_summary_results


class AuditPopulateQuestionSummaryVersionOneOffJob(base_jobs.JobBase):
    """Job that audits PopulateQuestionSummaryVersionOneOffJob."""

    @staticmethod
    def _regenerate_question_summary(
        question_id: str,
        question_model: question_models.QuestionModel
    ) -> result.Result[Tuple[str, question_models.QuestionSummaryModel],
     Tuple[str, Exception]
    ]:
        """Validates question and regenerates the question summary model.

        Args:
            question_id: str. The id of the question.
            question_model: QuestionModel. The question model.

        Returns:
            Result((str, QuestionSummaryModel), (str, Exception)). Result
            containing tuple which consist of question ID and either question
            ummary model or Exception. Question summary model is returned when
            the validation was successful and Exception is returned otherwise.
        """
        try:
            with datastore_services.get_ndb_context():
                question = question_fetchers.get_question_from_model(
                    question_model)
            question.validate()
        except Exception as e:
            logging.exception(e)
            return result.Err((question_id, e))
        question_summary = question_services.compute_summary_of_question(
            question)
        with datastore_services.get_ndb_context():
            question_summary_model = question_models.QuestionSummaryModel(
                id=question_summary.id,
                question_model_last_updated=question_summary.last_updated,
                question_model_created_on=question_summary.created_on,
                question_content=question_summary.question_content,
                misconception_ids=question_summary.misconception_ids,
                interaction_id=question_summary.interaction_id,
                version=question_summary.version
            )
        question_summary_model.update_timestamps()
        return result.Ok((question_id, question_summary_model))

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of results from the question migration.

        Returns:
            PCollection. A PCollection of results from the question
            migration.
        """
        all_question_models = (
            self.pipeline
            | 'Get all non-deleted question models' >> (
                ndb_io.GetModels(question_models.QuestionModel.get_all()))
            # Pylint disable is needed becasue pylint is not able to correclty
            # detect that the value is passed through the pipe.
            | 'Add question keys' >> beam.WithKeys( # pylint: disable=no-value-for-parameter
                lambda model: model.id)
        )

        question_summary_models = (
            all_question_models
            | 'Regenerate question summaries' >> beam.MapTuple(
                self._regenerate_question_summary)
        )

        regenerated_question_summary_results = (
            question_summary_models
            | 'Generates results' >> (
                job_result_transforms.ResultsToJobRunResults(
                    'QUESTION SUMMARY PROCESSED'))
        )
        unused_updated_question_summary = (
            question_summary_models
            | 'Filter oks' >> beam.Filter(
                lambda result_item: result_item.is_ok())
            | 'Unwrap ok' >> beam.Map(
                lambda result_item: result_item.unwrap())
            | 'Get rid of ID' >> beam.Values() # pylint: disable=no-value-for-parameter
        )

        return regenerated_question_summary_results


# TODO(#15613): Here we use MyPy ignore because the incomplete typing of
# apache_beam library and absences of stubs in Typeshed, forces MyPy to
# assume that PTransform class is of type Any. Thus to avoid MyPy's error
# (Class cannot subclass 'PTransform' (has type 'Any')), we added an
# ignore here.
class MigrateQuestionModels(beam.PTransform):# type: ignore[misc]
    """Transform that gets all Question models, performs migration
      and filters any error results.
    """

    @staticmethod
    def _migrate_question(
        question_id: str,
        question_model: question_models.QuestionModel
    ) -> result.Result[Tuple[str, question_domain.Question],
     Tuple[str, Exception]
    ]:
        """Migrates question and transform question model into question object.

        Args:
            question_id: str. The id of the question.
            question_model: QuestionModel. The question model to migrate.

        Returns:
            Result((str, Question), (str, Exception)). Result containing tuple
            which consist of question ID and either question object or
            Exception. Question object is returned when the migration was
            successful and Exception is returned otherwise.
        """
        try:
            question = question_fetchers.get_question_from_model(
                question_model)
            question.validate()
        except Exception as e:
            logging.exception(e)
            return result.Err((question_id, e))

        return result.Ok((question_id, question))

    @staticmethod
    def _generate_question_changes(
        question_id: str,
        question_model: question_models.QuestionModel
    ) -> Iterable[Tuple[str, question_domain.QuestionChange]]:
        """Generates question change objects. Question change object is
        generated when schema version for some field is lower than the latest
        schema version.

        Args:
            question_id: str. The ID of the question.
            question_model: QuestionModel. The question for which to generate
                the change objects.

        Yields:
            (str, QuestionChange). Tuple containing question ID and question
            change object.
        """
        schema_version = question_model.question_state_data_schema_version
        if schema_version < feconf.CURRENT_STATE_SCHEMA_VERSION:
            question_change = question_domain.QuestionChange({
                'cmd': (
                    question_domain.CMD_MIGRATE_STATE_SCHEMA_TO_LATEST_VERSION),
                'from_version': schema_version,
                'to_version': feconf.CURRENT_STATE_SCHEMA_VERSION
            })
            yield (question_id, question_change)

    def expand(
        self, pipeline: beam.Pipeline
    ) -> Tuple[
        beam.PCollection[base_models.BaseModel],
        beam.PCollection[job_run_result.JobRunResult]
    ]:
        """Migrate question objects and flush the input
            in case of errors.

        Args:
            pipeline: Pipeline. Input beam pipeline.

        Returns:
            (PCollection, PCollection). Tuple containing
            PCollection of models which should be put into the datastore and
            a PCollection of results from the question migration.
        """

        unmigrated_question_models = (
            pipeline
            | 'Get all non-deleted question models' >> (
                ndb_io.GetModels(question_models.QuestionModel.get_all()))
            # Pylint disable is needed becasue pylint is not able to correclty
            # detect that the value is passed through the pipe.
            | 'Add question keys' >> beam.WithKeys( # pylint: disable=no-value-for-parameter
                lambda question_model: question_model.id)
        )
        question_summary_models = (
            self.pipeline
            | 'Get all non-deleted question summary models' >> (
                ndb_io.GetModels(
                    question_models.QuestionSummaryModel.get_all())
            )
            # Pylint disable is needed because pylint is not able to correctly
            # detect that the value is passed through the pipe.
            | 'Add question summary keys' >> beam.WithKeys( # pylint: disable=no-value-for-parameter
                lambda question_summary_model: question_summary_model.id)
        )

        all_migrated_question_results = (
            unmigrated_question_models
            | 'Transform and migrate model' >> beam.MapTuple(
                self._migrate_question)
        )

        migrated_question_job_run_results = (
            all_migrated_question_results
            | 'Generates results for migration' >> (
                job_result_transforms.ResultsToJobRunResults(
                    'QUESTION PROCESSED'))
        )

        filtered_migrated_exp = (
            all_migrated_question_results
            | 'Filter migration results' >> (
                results_transforms.DrainResultsOnError())
        )

        migrated_questions = (
            filtered_migrated_exp
            | 'Unwrap ok' >> beam.Map(
                lambda result_item: result_item.unwrap())
        )

        question_changes = (
            unmigrated_question_models
            | 'Generates question changes' >> beam.FlatMapTuple(
                self._generate_question_changes)
        )

        question_objects_list = (
            {
                'question_model': unmigrated_question_models,
                'question_summary_model': question_summary_models,
                'question': migrated_questions,
                'question_changes': question_changes
            }
            | 'Merge objects' >> beam.CoGroupByKey()
            | 'Get rid of ID' >> beam.Values() # pylint: disable=no-value-for-parameter
        )

        transformed_question_objects_list = (
            question_objects_list
            | 'Remove unmigrated questions' >> beam.Filter(
                lambda x: len(x['question_changes']) > 0 and
                 len(x['question']) > 0
                )
            | 'Reorganize the question objects' >> beam.Map(lambda objects: {
                    'question_model': objects['question_model'][0],
                    'question_summary_model': objects[
                        'question_summary_model'][0],
                    'question': objects['question'][0],
                    'question_changes': objects['question_changes']
                })

        )

        already_migrated_job_run_results = (
            question_objects_list
            | 'Remove migrated questions' >> beam.Filter(
                lambda x: (
                    len(x['question_changes']) == 0 and len(x['question']) > 0
                ))
            | 'Transform already migrated question into job run results' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'QUESTION PREVIOUSLY MIGRATED'))
        )

        question_objects_list_job_run_results = (
            transformed_question_objects_list
            | 'Transform question objects into job run results' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'QUESTION MIGRATED'))
        )

        job_run_results = (
            migrated_question_job_run_results,
            already_migrated_job_run_results,
            question_objects_list_job_run_results
        ) | 'Flatten job run results' >> beam.Flatten()

        return (
            transformed_question_objects_list,
            job_run_results
        )


class MigrateQuestionJob(base_jobs.JobBase):
    """Job that migrates Question models."""

    @staticmethod
    def _update_question(
        question_model: question_models.QuestionModel,
        migrated_question: question_domain.Question,
        question_changes: Sequence[question_domain.QuestionChange]
    ) -> Sequence[base_models.BaseModel]:
        """Generates newly updated question models.

        Args:
            question_model: QuestionModel. The question which to be updated.
            migrated_question: Question. The migrated question domain object.
            question_changes: QuestionChange. The question changes to apply.

        Returns:
            sequence(BaseModel). Sequence of models which should be put into
            the datastore.
        """
        updated_question_model = (
            question_services.populate_question_model_fields(
                question_model, migrated_question)
        )

        change_dicts = [change.to_dict() for change in question_changes]
        with datastore_services.get_ndb_context():
            models_to_put = updated_question_model.compute_models_to_commit(
                feconf.MIGRATION_BOT_USER_ID,
                feconf.COMMIT_TYPE_EDIT,
                'Update state data contents schema version to %d.' % (
                    feconf.CURRENT_STATE_SCHEMA_VERSION),
                change_dicts,
                additional_models={}
            )
        models_to_put_values = []
        for model in models_to_put.values():
            # Here, we are narrowing down the type from object to BaseModel.
            assert isinstance(model, base_models.BaseModel)
            models_to_put_values.append(model)
        datastore_services.update_timestamps_multi(list(models_to_put_values))
        return models_to_put_values

    @staticmethod
    def _update_question_summary(
        migrated_question: question_domain.Question,
        question_summary_model: question_models.QuestionSummaryModel
    ) -> question_models.QuestionSummaryModel:
        """Generates newly updated question summary model.

        Args:
            migrated_question: Question. The migrated question domain object.
            question_summary_model: QuestionSummaryModel. The question summary
                model to update.

        Returns:
            QuestionSummaryModel. The updated question summary model to put
            into the datastore.
        """

        question_summary = question_services.compute_summary_of_question(
            migrated_question)
        question_summary.version += 1
        updated_question_summary_model = (
            question_services.populate_question_summary_model_fields(
                question_summary_model, question_summary
            )
        )
        return updated_question_summary_model

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of results from the question migration.

        Returns:
            PCollection. A PCollection of results from the question
            migration.
        """

        transformed_question_objects_list, job_run_results = (
            self.pipeline
            | 'Perform migration and filter migration results' >> (
                MigrateQuestionModels())
        )

        question_models_to_put = (
            transformed_question_objects_list
            | 'Generate question models to put' >> beam.FlatMap(
                lambda question_objects: self._update_question(
                    question_objects['question_model'],
                    question_objects['question'],
                    question_objects['question_changes'],
                ))
        )

        question_summary_model_to_put = (
            transformed_question_objects_list
            | 'Generate question summary to put' >> beam.Map(
                lambda question_objects: self._update_question_summary(
                    question_objects['question'],
                    question_objects['question_summary_model']
                ))
        )

        unused_put_results = (
            (question_models_to_put, question_summary_model_to_put)
            | 'Merge models' >> beam.Flatten()
            | 'Put models into datastore' >> ndb_io.PutModels()
        )

        return job_run_results


class AuditQuestionMigrationJob(base_jobs.JobBase):
    """Job that audits question migration."""

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of results from the audit of question
        migration.

        Returns:
            PCollection. A PCollection of results from the question
            migration.
        """

        unused_transformed_question_objects_list, job_run_results = (
            self.pipeline
            | 'Perform migration and filter migration results' >> (
                MigrateQuestionModels())
        )

        return job_run_results
