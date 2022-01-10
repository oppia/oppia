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

"""Jobs for adding android_proto_size_in_bytes attribute to exploration."""

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


class MigrateExplorationJob(base_jobs.JobBase):
    """Job that migrates exploration models."""

    @staticmethod
    def _migrate_exploration(
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
            exploration.validate()
        except Exception as e:
            logging.exception(e)
            return result.Err((exp_id, e))

        return result.Ok((exp_id, exploration))

    @staticmethod
    def _update_exploration(
        exp_model: exp_models.ExplorationModel,
        migrated_exploration: exp_domain.Exploration,
        exploration_changes: Sequence[exp_domain.ExplorationChange]
    ) -> Sequence[base_models.BaseModel]:
        """Generates newly updated exploration models.

        Args:
            exp_model: ExplorationModel. The exploration which
                should be updated.
            migrated_exploration: Exploration. The migrated exploration
                domain object.
            exploration_changes: sequence(ExplorationChange). The
                exploration changes to apply.

        Returns:
            sequence(BaseModel). Sequence of models which should be put into
            the datastore.
        """
        updated_exploration_model = (
            exp_services.populate_exploration_model_fields(
                exp_model, migrated_exploration))
        commit_message = (
            'Update exploration content schema version to %d.'
        ) % (exp_domain.Exploration.CURRENT_EXP_SCHEMA_VERSION)
        change_dicts = [change.to_dict() for change in exploration_changes]
        with datastore_services.get_ndb_context():
            models_to_put = updated_exploration_model.compute_models_to_commit(
                feconf.MIGRATION_BOT_USERNAME,
                feconf.COMMIT_TYPE_EDIT,
                commit_message,
                change_dicts,
                additional_models={}
            ).values()
        datastore_services.update_timestamps_multi(list(models_to_put))
        return models_to_put

    @staticmethod
    def _update_exploration_summary(
        migrated_exploration: exp_domain.Exploration,
        exploration_summary_model: exp_models.ExpSummaryModel
    ) -> exp_models.ExpSummaryModel:
        """Generates newly updated exploration summary model.

        Args:
            migrated_exploration: Exploration. The migrated exploration
                domain object.
            exploration_summary_model: ExpSummaryModel. The exploration
                summary model to update.

        Returns:
            ExpSummaryModel. The updated exploration summary model to put into
            the datastore.
        """
        with datastore_services.get_ndb_context():
            exploration_summary = exp_services.compute_summary_of_exploration(
                migrated_exploration)
            exploration_summary.version += 1
        updated_exploration_summary_model = (
            exp_services.populate_exploration_summary_model_fields(
                exploration_summary_model, exploration_summary
            )
        )

        return updated_exploration_summary_model

    @staticmethod
    def _generate_exploration_changes(
        exp_id: str, exp_model: exp_models.ExplorationModel
    ) -> Iterable[Tuple[str, exp_domain.ExplorationChange]]:
        """Generates exploration change objects. Exploration
        change object is generated when schema version for some field
        is lower than the latest schema version.

        Args:
            exp_id: str. The id of the exploration.
            exp_model: ExplorationModel. The exploration for which to generate
                the change objects.

        Yields:
            (str, ExplorationChange). Tuple containing exploration
            ID and exploration change object.
        """
        if exp_model.version < (
            exp_domain.Exploration.CURRENT_EXP_SCHEMA_VERSION):
            exp_change = exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_MIGRATE_STATES_SCHEMA_TO_LATEST_VERSION,
                'from_version': str(exp_model.version),
                'to_version': (
                    str(exp_domain.Exploration.CURRENT_EXP_SCHEMA_VERSION))
            })
            yield (exp_id, exp_change)

    @staticmethod
    def _delete_exploration_from_cache(
        exploration: exp_domain.Exploration
    ) -> result.Result[str, Exception]:
        """Deletes exploration from cache.

        Args:
            exploration: Exploration. The exploration
                which should be deleted from cache.

        Returns:
            Result(str, Exception). The id of the exploration when the deletion
            was successful or Exception when the deletion failed.
        """
        try:
            caching_services.delete_multi(
                caching_services.CACHE_NAMESPACE_EXPLORATION,
                None,
                [exploration.id]
            )
            return result.Ok(exploration.id)
        except Exception as e:
            return result.Err(e)

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of results from the exploration migration.

        Returns:
            PCollection. A PCollection of results from the
            exploration migration.
        """
        unmigrated_exploration_models = (
            self.pipeline
            | 'Get all non-deleted exploration models' >> (
                ndb_io.GetModels(
                    exp_models.ExplorationModel.get_all(
                        include_deleted=False)
                    )
                )
            # Pylint disable is needed because pylint is not able to correctly
            # detect that the value is passed through the pipe.
            | 'Add exploration keys' >> beam.WithKeys( # pylint: disable=no-value-for-parameter
                lambda exp_model: exp_model.id)
        )
        exploration_summary_models = (
            self.pipeline
            | 'Get all non-deleted exploration summary models' >> (
                ndb_io.GetModels(
                    exp_models.ExpSummaryModel.get_all(
                        include_deleted=False)
                    )
                )
            # Pylint disable is needed because pylint is not able to correctly
            # detect that the value is passed through the pipe.
            | 'Add exploration summary keys' >> beam.WithKeys( # pylint: disable=no-value-for-parameter
                lambda exploration_summary_model: exploration_summary_model.id)
        )

        migrated_exploration_results = (
            unmigrated_exploration_models
            | 'Transform and migrate model' >> beam.MapTuple(
                self._migrate_exploration)
        )
        migrated_explorations = (
            migrated_exploration_results
            | 'Filter oks' >> beam.Filter(
                lambda result_item: result_item.is_ok())
            | 'Unwrap ok' >> beam.Map(
                lambda result_item: result_item.unwrap())
        )
        migrated_exploration_job_run_results = (
            migrated_exploration_results
            | 'Generate results for migration' >> (
                job_result_transforms.ResultsToJobRunResults(
                    'EXPLORATION PROCESSED'))
        )

        exploration_changes = (
            unmigrated_exploration_models
            | 'Generate exploration changes' >> beam.FlatMapTuple(
                self._generate_exploration_changes)
        )

        exploration_objects_list = (
            {
                'exp_model': unmigrated_exploration_models,
                'exploration_summary_model': exploration_summary_models,
                'exploration': migrated_explorations,
                'exploration_changes': exploration_changes
            }
            | 'Merge objects' >> beam.CoGroupByKey()
            | 'Get rid of ID' >> beam.Values()  # pylint: disable=no-value-for-parameter
            | 'Remove unmigrated exploration' >> beam.Filter(
                lambda x: len(x['exploration_changes']) > 0 and len(x['exploration']) > 0) # pylint: disable=line-too-long
            | 'Reorganize the exploration objects' >> beam.Map(lambda objects: {
                    'exp_model': objects['exp_model'][0],
                    'exploration_summary_model': (
                        objects['exploration_summary_model'][0]),
                    'exploration': objects['exploration'][0],
                    'exploration_changes': objects['exploration_changes']
                })
        )

        exploration_objects_list_job_run_results = (
            exploration_objects_list
            | 'Transform exploration objects into job run results' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'EXPLORATION MIGRATED'))
        )

        cache_deletion_job_run_results = (
            exploration_objects_list
            | 'Delete exploration from cache' >> beam.Map(
                lambda exploration_object: (
                    self._delete_exploration_from_cache(
                        exploration_object['exploration'])))
            | 'Generate results for cache deletion' >> (
                job_result_transforms.ResultsToJobRunResults('CACHE DELETION'))
        )

        exp_models_to_put = (
            exploration_objects_list
            | 'Generate exploration models to put' >> beam.FlatMap(
                lambda exp_objects: self._update_exploration(
                    exp_objects['exp_model'],
                    exp_objects['exploration'],
                    exp_objects['exploration_changes'],
                ))
        )

        exp_summary_models_to_put = (
            exploration_objects_list
            | 'Generate exploration summary models to put' >> beam.Map(
                lambda exp_objects: self._update_exploration_summary(
                    exp_objects['exploration'],
                    exp_objects['exploration_summary_model']
                ))
        )

        unused_put_results = (
            (exp_models_to_put, exp_summary_models_to_put)
            | 'Merge models' >> beam.Flatten()
            | 'Put models into the datastore' >> ndb_io.PutModels()
        )

        return (
            (
                cache_deletion_job_run_results,
                migrated_exploration_job_run_results,
                exploration_objects_list_job_run_results
            )
            | beam.Flatten()
        )
