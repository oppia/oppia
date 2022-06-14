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

"""Jobs for updating exploration model."""

from __future__ import annotations

import logging

from core import feconf
from core.domain import caching_services
from core.domain import exp_domain
from core.domain import exp_fetchers
from core.domain import exp_services
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
    from mypy_imports import exp_models

(base_models, exp_models,) = models.Registry.import_models([
    models.NAMES.base_model, models.NAMES.exploration
])
datastore_services = models.Registry.import_datastore_services()


class VerifyExplorationMigrationJob(base_jobs.JobBase):
    """Job that verify exploration models for attribute
    android_proto_size_in_bytes attribute.
    """

    @staticmethod
    def fetch_exploration(
        exp_id: str, exp_model: exp_models.ExplorationModel
    ) -> result.Result[
        Tuple[str, exp_domain.Exploration], Tuple[str, Exception]
    ]:
        """Migrates exploration and transforms exploration model
        into exploration object.

        Args:
            exp_id: str. The id of the exploration.
            exp_model: ExplorationModel. The exploration model to migrate.

        Returns:
            Result((str, Exploration), (str, Exception)). Result
            containing tuple that consists of exploration ID and either
            exploration object or Exception. Exploration object is
            returned when the migration was successful and Exception
            is returned otherwise.
        """
        try:
            exploration = exp_fetchers.get_exploration_from_model(exp_model)
        except Exception as e:
            logging.exception(e)
            return result.Err((exp_id, e))

        return result.Ok((exp_id, exploration))

    @staticmethod
    def count_exploration(
        exp_model: exp_models.ExplorationModel,
        exploration: exp_domain.Exploration
    ) -> result.Result[
        Tuple[str, boolean], Tuple[str, Exception]
    ]:
        try:
            hasAttributes = False
            if hasattr(exp_model, 'android_proto_size_in_bytes'):
                hasAttributes = True
            else:
                hasAttributes = False
        except Exception as e:
            logging.exception(e)
            return result.Err((exp_id, e))

        if (hasAttributes):
            return result.Ok((exp_id, hasAttributes))
        else:
            return result.Err((exp_id, e))s

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of results from the exploration
        android_proto_size_in_bytes field population.

        Returns:
            PCollection. A PCollection of results from the exploration
            android_proto_size_in_bytes field population.
        """
        exploration_models = (
            self.pipeline
            | 'Get all non-deleted exploration models' >> (
                ndb_io.GetModels(
                    exp_models.ExplorationModel.get_all(
                        include_deleted=False)
                    )
                )
            | 'Remove the Exploration Temporary' >> beam.Filter(
                lambda exp_model: exp_model.id != 'umPkwp0L1M0-')
            # Pylint disable is needed because pylint is not able to correctly
            # detect that the value is passed through the pipe.
            | 'Add exploration keys' >> beam.WithKeys( # pylint: disable=no-value-for-parameter
                lambda exp_model: exp_model.id)
        )

        exploration_results = (
            exploration_models
            | 'Transform and migrate model' >> beam.MapTuple(
                self.fetch_exploration)
        )
        explorations_list = (
            exploration_results
            | 'Filter oks' >> beam.Filter(
                lambda result_item: result_item.is_ok())
            | 'Unwrap oks' >> beam.Map(
                lambda result_item: result_item.unwrap())
        )
        exploration_job_run_results = (
            exploration_results
            | 'Generate results for migration' >> (
                job_result_transforms.ResultsToJobRunResults(
                    'EXPLORATION PROCESSED'))
        )

        exploration_object_list = (
            {
                'exploration': explorations_list,
            }
            | 'Merge object' >> beam.CoGroupByKey()
            | 'Get rid ID' >> beam.Values()  # pylint: disable=no-value-for-parameter
            | 'Remove unmigrated exploration object' >> beam.Filter(
                lambda x: len(x['exploration']) > 0)
            | 'Reorganize the exploration object' >> beam.Map(lambda objects: {
                    'exploration': objects['exploration'][0]
                })
        )

        exploration_boolean_list = (
            exploration_object_list
            | 'Generate exploration changes' >> beam.FlatMap(
                lambda exp_objects: self.count_exploration(
                    exp_objects['exploration']
                ))
        )

        exploration_objects_list = (
            {
                'exploration_boolean_list': exploration_boolean_list
            }
            | 'Reorganize the exploration objects' >> beam.Map(lambda objects: {
                    'exploration_boolean_list': objects['exploration_boolean_list'][0],
                })
        )

        exploration_objects_list_job_run_results = (
            exploration_objects_list
            | 'Transform exploration objects into job run results' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'EXPLORATION POPULATED WITH android_proto_size_in_bytes'))
        )

        return (
            (
            
                exploration_job_run_results,
                exploration_objects_list_job_run_results
            )
        )
