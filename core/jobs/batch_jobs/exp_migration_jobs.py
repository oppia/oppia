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

"""Jobs used for migrating the exploration models."""

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
    from mypy_imports import user_models

(base_models, exp_models, user_models) = models.Registry.import_models([
    models.NAMES.base_model, models.NAMES.exploration, models.NAMES.user])
datastore_services = models.Registry.import_datastore_services()


class MigrateExplorationJob(base_jobs.JobBase):
    """Job that migrates Exploration models."""

    @staticmethod
    def _migrate_exploration(
        exp_id: str,
        exp_model: exp_models.ExplorationModel
    ) -> result.Result[
        Tuple[str, exp_domain.Exploration],
        Tuple[str, Exception]
    ]:
        """Migrates exploration and transform exploration model into
        exploration object.

        Args:
            exp_id: str. The ID of the exploration.
            exp_model: ExplorationModel. The exploration model to migrate.

        Returns:
            Result((str, Exploration), (str, Exception)). Result containing
            tuple that consists of exploration ID and either Exploration object
            or Exception. Exploration object is returned when the migration was
            successful and Exception is returned otherwise.
        """
        try:
            exploration = exp_fetchers.get_exploration_from_model(exp_model)
            exploration.validate()
        except Exception as e:
            logging.exception(e)
            return result.Err((exp_id, e))

        return result.Ok((exp_id, exploration))

    @staticmethod
    def _generate_exploration_changes(
        exp_id: str, exp_model: exp_models.ExplorationModel
    ) -> Iterable[Tuple[str, exp_domain.ExplorationChange]]:
        """Generates exploration change objects. ExplorationChange object is
        generated schema version for some field is lower than the latest
        schema version.

        Args:
            exp_id: str. The ID of the exploration.
            exp_model: ExplorationModel. The exploration for which to generate
                the change objects.

        Yields:
            (str, ExplorationChange). Tuple containing exploration ID and
            ExplorationChange object.
        """
        exp_states_version = exp_model.states_schema_version
        if exp_states_version < feconf.CURRENT_STATE_SCHEMA_VERSION:
            exp_change = exp_domain.ExplorationChange({
                'cmd': (
                    exp_domain.CMD_MIGRATE_STATES_SCHEMA_TO_LATEST_VERSION),
                'from_version': exp_states_version,
                'to_version': feconf.CURRENT_STATE_SCHEMA_VERSION
            })
            yield (exp_id, exp_change)

    @staticmethod
    def _delete_exploration_from_cache(
        exploration: exp_domain.Exploration
    ) -> result.Result[str, Exception]:
        """Deletes exploration from cache.

        Args:
            exploration: Exploration. The exploration which should be deleted
                from cache.

        Returns:
            Result(str, Exception). The ID of the skill when the deletion was
            successful or Exception when the deletion failed.
        """
        try:
            caching_services.delete_multi(
                caching_services.CACHE_NAMESPACE_EXPLORATION,
                None, [exploration.id])
            return result.Ok(exploration.id)
        except Exception as e:
            return result.Err(e)

    @staticmethod
    def _update_exp_summary(
        migrated_exp: exp_domain.Exploration,
        exp_summary_model: exp_models.ExpSummaryModel,
        exp_rights_model: exp_models.ExplorationRightsModel
    ) -> exp_models.ExpSummaryModel:
        """Generates a newly updated exploration summary model.

        Args:
            migrated_exp: Exploration. The migrated exploration domain object.
            exp_summary_model: ExpSummaryModel. The exploration summary model
                to update.
            exp_rights_model: ExplorationRightsmodel. The exploration rights
                model used to update the exploration summary.

        Returns:
            ExpSummaryModel. The updated exploration summary model to put into
            the datastore.
        """
        exp_summary = exp_services.compute_summary_of_exploration(
            migrated_exp, exp_rights_model, exp_summary_model)
        exp_summary.version += 1
        updated_exp_summary_model = (
            exp_services.populate_exp_summary_model_fields(
                exp_summary_model, exp_summary
            )
        )

        return updated_exp_summary_model

    @staticmethod
    def _update_exploration(
        exp_model: exp_models.ExplorationModel,
        exp_rights_model: exp_models.ExplorationRightsModel,
        exp_context_models: list(exp_models.ExplorationContextModel),
        migrated_exp: exp_domain.Exploration,
        exp_changes: Sequence[exp_domain.ExplorationChange]
    ) -> Sequence[base_models.BaseModel]:
        """Generates newly updated exploration models.

        Args:
            exp_model: ExplorationModel. The exploration which should be
                updated.
            exp_rights_model: ExplorationRightsModel. The exploration rights
                model which is to be updated.
            exp_context_models: list(ExplorationContextModel). The list of
                exploration context models relevant to the exploration.
            migrated_exp: Exploration. The migrated exploration domain
                object.
            exp_changes: sequence(ExplorationChange). The exploration changes
                to apply.

        Returns:
            sequence(BaseModel). Sequence of models which should be put into
            the datastore.
        """
        updated_exp_model = (
            exp_services.populate_exp_model_fields(
                exp_model, migrated_exp))
        if (
            len(exp_context_models) > 0 and
                exp_context_models[0] is not None):
            exp_services.validate_exploration_for_story(migrated_exp, True)

        commit_message = (
            'Update exploration states schema version to %d.'
        ) % (
            feconf.CURRENT_STATE_SCHEMA_VERSION
        )
        change_dicts = [change.to_dict() for change in exp_changes]
        with datastore_services.get_ndb_context():
            models_to_put = updated_exp_model.compute_models_to_commit(
                feconf.MIGRATION_BOT_USERNAME,
                feconf.COMMIT_TYPE_EDIT,
                commit_message,
                change_dicts,
                additional_models={'rights_model': exp_rights_model}
            ).values()
        datastore_services.update_timestamps_multi(list(models_to_put))

        return models_to_put

    @staticmethod
    def _update_exp_user_data(
        exp_user_data_model: user_models.ExplorationUserDataModel
    ) -> Sequence[base_models.BaseModel]:
        """Generates newly updated exploration user data models.

        Args:
            exp_user_data_model: ExplorationUserDataModel. The user data which
                should be updated.

        Returns:
            sequence(BaseModel). Sequence of models which should be put into
            the datastore.
        """
        if exp_user_data_model:
            exp_user_data_model.draft_change_list = None
            exp_user_data_model.draft_change_list_last_updated = None
            exp_user_data_model.draft_change_list_exp_version = None

        datastore_services.update_timestamps_multi(list(exp_user_data_model))

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of results from the exploration migration.

        Returns:
            PCollection. A PCollection of results from the exploration
            migration.
        """

        unmigrated_exploration_models = (
            self.pipeline
            | 'Get all non-deleted exploration models' >> (
                ndb_io.GetModels(
                    exp_models.ExplorationModel.get_all(
                        include_deleted=False)))
            # Pylint disable is needed because pylint is not able to correctly
            # detect that the value is passed through the pipe.
            | 'Add exploration keys' >> beam.WithKeys(  # pylint: disable=no-value-for-parameter
                lambda exp_model: exp_model.id)
        )

        exp_rights_models = (
            self.pipeline
            | 'Get all non-deleted exploration rights models' >> (
                ndb_io.GetModels(exp_models.ExplorationRightsModel.get_all()))
            | 'Add exploration rights ID' >> beam.WithKeys( # pylint: disable=no-value-for-parameter
                lambda exp_rights_model: exp_rights_model.id)
        )

        exp_summary_models = (
            self.pipeline
            | 'Get all non-deleted exploration summary models' >> (
                ndb_io.GetModels(exp_models.ExpSummaryModel.get_all()))
            | 'Add exploration summary ID' >> beam.WithKeys(# pylint: disable=no-value-for-parameter
                lambda exp_summary_model: exp_summary_model.id)
        )

        exp_context_models = (
            self.pipeline
            | 'Get all non-deleted exploration context models' >> (
                ndb_io.GetModels(exp_models.ExplorationContextModel.get_all()))
            | 'Add exploration context ID' >> beam.WithKeys(# pylint: disable=no-value-for-parameter
                lambda exp_context_model: exp_context_model.id)
        )

        exp_user_data_models = (
            self.pipeline
            | 'Get all non-deleted exploration user data models' >> (
                ndb_io.GetModels(
                    user_models.ExplorationUserDataModel.get_all()))
            | 'Add exploration ID as keys' >> beam.WithKeys(# pylint: disable=no-value-for-parameter
                lambda exp_user_data_model: exp_user_data_model.exploration_id)
        )

        migrated_exp_results = (
            unmigrated_exploration_models
            | 'Transform and migrate model' >> beam.MapTuple( # pylint: disable=no-value-for-parameter
                self._migrate_exploration)
        )

        migrated_exp = (
            migrated_exp_results
            | 'Filter oks' >> beam.Filter(
                lambda result_item: result_item.is_ok())
            | 'Unwrap ok' >> beam.Map(
                lambda result_item: result_item.unwrap())
        )

        migrated_exp_job_run_results = (
            migrated_exp_results
            | 'Generate results for migration' >> (
                job_result_transforms.ResultsToJobRunResults('EXP PROCESSED'))
        )

        exp_changes = (
            unmigrated_exploration_models
            | 'Generate exploration changes' >> beam.FlatMapTuple(
                self._generate_exploration_changes)
        )

        exp_objects_list = (
            {
                'exp_model': unmigrated_exploration_models,
                'exp_summary_model': exp_summary_models,
                'exp_rights_model': exp_rights_models,
                'exploration': migrated_exp,
                'exp_context_model': exp_context_models,
                'exp_changes': exp_changes
            }
            | 'Merge objects' >> beam.CoGroupByKey()
            | 'Get rid of ID' >> beam.Values() # pylint: disable=no-value-for-parameter
            | 'Remove unmigrated explorations' >> beam.Filter(
                lambda x: len(x['exp_changes']) > 0
                    and len(x['exploration']) > 0)
            | 'Reorganize the exploration objects' >> beam.Map(lambda objects: {
                'exp_model': objects['exp_model'][0],
                'exploration': objects['exploration'][0],
                'exp_rights_model': objects['exp_rights_model'][0],
                'exp_summary_model': objects['exp_summary_model'][0],
                'exp_context_model': objects['exp_context_model'],
                'exp_changes': objects['exp_changes']
            })
        )

        exp_objects_list_job_run_results = (
            exp_objects_list
            | 'Transform exp objects into job run results' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'EXP MIGRATED'))
        )

        cache_deletion_job_run_results = (
            exp_objects_list
            | 'Delete exploration from cache' >> beam.Map(
                lambda exp_object: self._delete_exploration_from_cache(
                    exp_object['exploration']))
            | 'Generate results for cache deletion' >> (
                job_result_transforms.ResultsToJobRunResults('CACHE DELETION'))
        )

        exp_models_to_put = (
            exp_objects_list
            | 'Generate exploration models to put' >> beam.FlatMap(
                lambda exp_objects: self._update_exploration(
                    exp_objects['exp_model'],
                    exp_objects['exp_rights_model'],
                    exp_objects['exp_context_model'],
                    exp_objects['exploration'],
                    exp_objects['exp_changes'],
                ))
        )

        exp_summary_models_to_put = (
            exp_objects_list
            | 'Generate exp summary models to put' >> beam.Map(
                lambda exp_objects: self._update_exp_summary(
                    exp_objects['exploration'],
                    exp_objects['exp_summary_model'],
                    exp_objects['exp_rights_model']
                ))
        )

        exp_user_data_models_to_put = (
            exp_user_data_models
            | 'Discard drafts and update user models' >> beam.FlatMapTuple(
                self._update_exp_user_data)
        )

        unused_put_results = (
            (
                exp_models_to_put,
                exp_summary_models_to_put,
                exp_user_data_models_to_put)
            | 'Merge models' >> beam.Flatten()
            | 'Put models into datastore' >> ndb_io.PutModels()
        )

        return (
            (
                cache_deletion_job_run_results,
                migrated_exp_job_run_results,
                exp_objects_list_job_run_results
            )
            | beam.Flatten()
        )
