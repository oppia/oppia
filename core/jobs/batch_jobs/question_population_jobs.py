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

"""Jobs for updating question model."""

from __future__ import annotations

import logging

from core import feconf
from core.domain import caching_services
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
if MYPY: # pragma: no cover
    from mypy_imports import base_models
    from mypy_imports import datastore_services
    from mypy_imports import question_models

(base_models, question_models) = models.Registry.import_models(
    [models.NAMES.base_model, models.NAMES.question])
datastore_services = models.Registry.import_datastore_services()


class PopulateQuestionWithAndroidProtoSizeInBytesJob(base_jobs.JobBase):
    """Job that populate question models with
    android_proto_size_in_bytes attribute.
    """

    @staticmethod
    def _migrate_question(
        question_id: str, question_model: question_models.QuestionModel
    ) -> result.Result[
        Tuple[str, question_domain.Question], Tuple[str, Exception]
    ]:
        """Migrates question and transforms question model
        into question object.

        Args:
            question_id: str. The id of the question.
            question_model: QuestionModel. The question model to migrate.

        Returns:
            Result((str, Question), (str, Exception)). Result
            containing tuple that consists of question ID and either
            question object or Exception. Question object is
            returned when the migration was successful and Exception
            is returned otherwise.
        """
        try:
            question = question_fetchers.get_question_from_model(question_model)
            question.validate()
        except Exception as e:
            logging.exception(e)
            return result.Err((question_id, e))

        return result.Ok((question_id, question))

    @staticmethod
    def _update_question_model(
        question_model: question_models.QuestionModel,
        migrated_question: question_domain.Question,
        question_changes: Sequence[question_domain.QuestionChange]
    ) -> Sequence[base_models.BaseModel]:
        """Generates newly updated question models.

        Args:
            question_model: QuestionModel. The question which
                should be updated.
            migrated_question: Question. The migrated question
                domain object.
            question_changes: sequence(QuestionChange). The
                question changes to apply.

        Returns:
            sequence(BaseModel). Sequence of models which should be put into
            the datastore.
        """
        updated_question_model = (
            question_services.populate_question_model_fields(
                question_model, migrated_question))
        commit_message = 'Added android_proto_size_in_bytes attribute.'
        change_dicts = [change.to_dict() for change in question_changes]
        with datastore_services.get_ndb_context():
            models_to_put = updated_question_model.compute_models_to_commit(
                feconf.MIGRATION_BOT_USERNAME,
                feconf.COMMIT_TYPE_EDIT,
                commit_message,
                change_dicts,
                additional_models={}
            ).values()
        datastore_services.update_timestamps_multi(list(models_to_put))
        return models_to_put

    @staticmethod
    def _generate_question_change(
        question_model: question_models.QuestionModel,
        question: question_domain.Question
    ) -> Iterable[Tuple[str, question_domain.QuestionChange]]:
        """Generates question change objects. Question change object
        is generated if the existing model doesn't contain
        android_proto_size_in_bytes attribute.

        Args:
            question_model: QuestionModel. The question for which to generate
                the change objects.
            question: Question. The question domain object.

        Yields:
            (str, questionChange). Tuple containing question
            ID and question change object.
        """
        if question_model.android_proto_size_in_bytes is None:
            question_change = question_domain.QuestionChange({
                'cmd': question_domain.CMD_UPDATE_QUESTION_PROPERTY,
                'property_name': 'android_proto_size_in_bytes',
                'new_value': question.android_proto_size_in_bytes,
                'old_value': None
            })
            yield (question.id, question_change)

    @staticmethod
    def _delete_question_from_cache(
        question: question_domain.Question
    ) -> result.Result[str, Exception]:
        """Deletes question from cache.

        Args:
            question: Question. The question
                which should be deleted from cache.

        Returns:
            Result(str, Exception). The id of the question when the deletion
            was successful or Exception when the deletion failed.
        """
        try:
            caching_services.delete_multi(
                caching_services.CACHE_NAMESPACE_QUESTION,
                None,
                [question.id]
            )
            return result.Ok(question.id)
        except Exception as e:
            return result.Err(e)

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of results from the question
        android_proto_size_in_bytes field population.

        Returns:
            PCollection. A PCollection of results from the question
            android_proto_size_in_bytes field population.
        """
        unmigrated_question_models = (
            self.pipeline
            | 'Get all non-deleted question models' >> (
                ndb_io.GetModels(
                    question_models.QuestionModel.get_all()
                    )
                )
            # Pylint disable is needed because pylint is not able to correctly
            # detect that the value is passed through the pipe.
            | 'Add question keys' >> beam.WithKeys( # pylint: disable=no-value-for-parameter
                lambda question_model: question_model.id)
        )

        migrated_question_results = (
            unmigrated_question_models
            | 'Transform and migrate model' >> beam.MapTuple(
                self._migrate_question)
        )
        migrated_questions = (
            migrated_question_results
            | 'Filter oks' >> beam.Filter(
                lambda result_item: result_item.is_ok())
            | 'Unwrap oks' >> beam.Map(
                lambda result_item: result_item.unwrap())
        )
        migrated_question_job_run_results = (
            migrated_question_results
            | 'Generate results for migration' >> (
                job_result_transforms.ResultsToJobRunResults(
                    'QUESTION PROCESSED'))
        )

        migrated_question_object_list = (
            {
                'question_model': unmigrated_question_models,
                'question': migrated_questions,
            }
            | 'Merge object' >> beam.CoGroupByKey()
            | 'Get rid ID' >> beam.Values()  # pylint: disable=no-value-for-parameter
            | 'Remove unmigrated question object' >> beam.Filter(
                lambda x: len(x['question']) > 0)
            | 'Reorganize the question object' >> beam.Map(lambda objects: {
                    'question_model': objects['question_model'][0],
                    'question': objects['question'][0]
                })
        )

        question_changes = (
            migrated_question_object_list
            | 'Generate question changes' >> beam.FlatMap(
                lambda question_objects: self._generate_question_change(
                    question_objects['question_model'],
                    question_objects['question']
                ))
        )

        question_objects_list = (
            {
                'question_model': unmigrated_question_models,
                'question': migrated_questions,
                'question_changes': question_changes
            }
            | 'Merge objects' >> beam.CoGroupByKey()
            | 'Get rid of ID' >> beam.Values()  # pylint: disable=no-value-for-parameter
            | 'Remove unmigrated question' >> beam.Filter(
                lambda x: len(x['question_changes']) > 0 and len(x['question']) > 0) # pylint: disable=line-too-long
            | 'Reorganize the question objects' >> beam.Map(lambda objects: {
                    'question_model': objects['question_model'][0],
                    'question': objects['question'][0],
                    'question_changes': objects['question_changes']
                })
        )

        question_objects_list_job_run_results = (
            question_objects_list
            | 'Transform question objects into job run results' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'QUESTION POPULATED WITH android_proto_size_in_bytes'))
        )

        cache_deletion_job_run_results = (
            question_objects_list
            | 'Delete question from cache' >> beam.Map(
                lambda question_object: (
                    self._delete_question_from_cache(
                        question_object['question'])))
            | 'Generate results for cache deletion' >> (
                job_result_transforms.ResultsToJobRunResults('CACHE DELETION'))
        )

        question_models_to_put = (
            question_objects_list
            | 'Generate question models to put' >> beam.FlatMap(
                lambda question_objects: self._update_question_model(
                    question_objects['question_model'],
                    question_objects['question'],
                    question_objects['question_changes']
                ))
        )

        unused_put_results = (
            question_models_to_put
            | 'Put models into the datastore' >> ndb_io.PutModels()
        )

        return (
            (
                cache_deletion_job_run_results,
                migrated_question_job_run_results,
                question_objects_list_job_run_results
            )
            | beam.Flatten()
        )
