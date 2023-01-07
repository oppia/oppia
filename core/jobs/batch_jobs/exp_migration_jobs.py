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
from core.jobs.transforms import exp_transforms
from core.jobs.transforms import job_result_transforms
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam
import result
from typing import Sequence, Tuple

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import base_models
    from mypy_imports import datastore_services
    from mypy_imports import exp_models

(base_models, exp_models) = (
    models.Registry.import_models(
        [models.Names.BASE_MODEL, models.Names.EXPLORATION]))
datastore_services = models.Registry.import_datastore_services()


# TODO(#15927): This job needs to be kept in sync with
# AuditExplorationMigrationJob and later we will unify these jobs together.
class MigrateExplorationJob(base_jobs.JobBase):
    """Job that migrates Exploration models."""

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
        caching_services.delete_multi(
            caching_services.CACHE_NAMESPACE_EXPLORATION,
            None, [exploration.id]
        )

    @staticmethod
    def _update_exploration(
        exp_model: exp_models.ExplorationModel,
        migrated_exp: exp_domain.Exploration,
        exp_changes: Sequence[exp_domain.ExplorationChange]
    ) -> Sequence[base_models.BaseModel]:
        """Generates newly updated exploration models.

        Args:
            exp_model: ExplorationModel. The exploration which should be
                updated.
            migrated_exp: Exploration. The migrated exploration domain
                object.
            exp_changes: Sequence(ExplorationChange). The exploration changes
                to apply.

        Returns:
            Sequence(BaseModel). Sequence of models which should be put into
            the datastore.
        """
        updated_exp_model = (
            exp_services.populate_exp_model_fields(
                exp_model, migrated_exp))

        commit_message = (
            'Update exploration states schema version to %d.'
        ) % (
            feconf.CURRENT_STATE_SCHEMA_VERSION
        )
        models_to_put_values = []
        with datastore_services.get_ndb_context():
            models_to_put_values = (
                exp_services.compute_models_to_put_when_saving_new_exp_version(
                    feconf.MIGRATION_BOT_USERNAME,
                    updated_exp_model.id,
                    exp_changes,
                    commit_message,
                )
            )
        datastore_services.update_timestamps_multi(list(models_to_put_values))

        return models_to_put_values

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of results from the exploration migration.

        Returns:
            PCollection. A PCollection of results from the exploration
            migration.
        """

        transformed_exp_objects_list, job_run_results = (
            self.pipeline
            | 'Perform migration and filter migration results' >> (
                exp_transforms.MigrateExplorationModels())
        )

        unused_cache_deletion_job_run_results = (
            transformed_exp_objects_list
            | 'Delete exploration from cache' >> beam.Map(
                lambda exp_object: self._delete_exploration_from_cache(
                    exp_object['exploration']))
        )

        exp_related_models_to_put = (
            transformed_exp_objects_list
            | 'Generate exploration models to put' >> beam.FlatMap(
                lambda exp_objects: self.
                _update_exploration(
                    exp_objects['exp_model'],
                    exp_objects['exploration'],
                    exp_objects['exp_changes'],
                ))
        )

        with datastore_services.get_ndb_context():
            unused_put_results = (
                (
                    exp_related_models_to_put
                )
                | 'Filter None models' >> beam.Filter(
                    lambda x: x is not None)
                | 'Put models into datastore' >> ndb_io.PutModels()
            )

        return job_run_results


class AuditExplorationMigrationJob(base_jobs.JobBase):
    """Job that migrates Exploration models."""

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of results from the audit of exploration
        migration.

        Returns:
            PCollection. A PCollection of results from the exploration
            migration.
        """

        unused_transformed_exp_objects_list, job_run_results = (
            self.pipeline
            | 'Perform migration and filter migration results' >> (
                exp_transforms.MigrateExplorationModels())
        )

        return job_run_results


class RegenerateMissingExplorationStatsModelsJob(base_jobs.JobBase):
    """Job that regenerates missing exploration stats models."""

    @staticmethod
    def _regenerate_stats_models(
        exp_id: str,
        unused_exp_model: exp_models.ExplorationModel
    ) -> result.Result[
        Tuple[str, exp_domain.Exploration],
        Tuple[str, Exception]
    ]:
        """Regenerates missing exploration stats models.

        Args:
            exp_id: str. The ID of the exploration.
            unused_exp_model: ExplorationModel. Exploration model.

        Returns:
            Result((str, Exploration), (str, Exception)). Result containing
            tuple that consists of exploration ID and either Exploration object
            or Exception. Exploration object is returned when the regeneration
            was successful and Exception is returned otherwise.
        """
        results = None
        try:
            with datastore_services.get_ndb_context():
                results = (
                    exp_services.regenerate_missing_stats_for_exploration(
                        exp_id
                    )
                )
        except Exception as e:
            logging.exception(e)
            return result.Err((exp_id, e))

        return result.Ok((exp_id, results))

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of results from the stats regeneration.

        Returns:
            PCollection. A PCollection of results from the stats regeneration.
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
            # TODO(#15871): This filter should be removed after the explorations
            # are fixed and it is possible to migrate them.
            | 'Remove broken exploration' >> beam.Filter(
                lambda id_and_exp: id_and_exp[0] not in (
                    'umPkwp0L1M0-', '670bU6d9JGBh'))
        )

        regenerated_stats_results = (
            unmigrated_exploration_models
            | 'Transform and migrate model' >> beam.MapTuple( # pylint: disable=no-value-for-parameter
                self._regenerate_stats_models)
        )

        regenerated_stats_job_run_results = (
            regenerated_stats_results
            | 'Generate results for migration' >> (
                job_result_transforms.ResultsToJobRunResults('EXP PROCESSED'))
        )

        return regenerated_stats_job_run_results


class ExpSnapshotsMigrationAuditJob(base_jobs.JobBase):
    """A reusable one-off job for testing the migration of all exp versions
    to the latest schema version. This job runs the state migration, but does
    not commit the new exploration to the datastore.
    """

    @staticmethod
    def _migrate_exploration_snapshot_model( # pylint: disable=too-many-return-statements
        exp_id: str,
        exp_snapshot_model: exp_models.ExplorationSnapshotContentModel
    ) -> result.Result[
        Tuple[str, Exception]
    ]:
        """Migrates exploration snapshot content model but does not put it in
        the datastore.

        Args:
            exp_id: str. The ID of the exploration.
            exp_snapshot_model: ExplorationSnapshotContentModel. The
                exploration model to migrate.

        Returns:
            Result((str, Exception)). Result containing
            tuple that consists of exploration ID and Exception if any.
        """
        with datastore_services.get_ndb_context():
            latest_exploration = exp_fetchers.get_exploration_by_id(
                exp_id, strict=False)
            if latest_exploration is None:
                return result.Err(
                    (exp_id, Exception('Exploration does not exist.'))
                )

            exploration_model = exp_models.ExplorationModel.get(exp_id)
        if (exploration_model.states_schema_version !=
                feconf.CURRENT_STATE_SCHEMA_VERSION):
            return result.Err(
                (
                    exp_id,
                    Exception('Exploration is not at latest schema version')
                )
            )

        try:
            latest_exploration.validate()
        except Exception:
            return result.Err(
                (
                    exp_id,
                    Exception(
                        'Exploration %s failed non-strict validation'
                        % exp_id
                    )
                )
            )

        # Some (very) old explorations do not have a states schema version.
        # These explorations have snapshots that were created before the
        # states_schema_version system was introduced. We therefore set
        # their states schema version to 0, since we now expect all
        # snapshots to explicitly include this field.
        if 'states_schema_version' not in exp_snapshot_model.content:
            exp_snapshot_model.content['states_schema_version'] = 0

        target_state_schema_version = feconf.CURRENT_STATE_SCHEMA_VERSION
        current_state_schema_version = (
            exp_snapshot_model.content['states_schema_version']
        )
        if current_state_schema_version == target_state_schema_version:
            return result.Err(
                (
                    exp_id,
                    Exception(
                        'Snapshot is already at latest schema version'
                    )
                )
            )

        versioned_exploration_states = (
            exp_domain.VersionedExplorationStatesDict(
                states_schema_version=current_state_schema_version,
                states=exp_snapshot_model.content['states']
            )
        )
        while ( # pragma: no branch
            current_state_schema_version < target_state_schema_version
        ):
            try:
                with datastore_services.get_ndb_context():
                    exp_domain.Exploration.update_states_from_model(
                        versioned_exploration_states,
                        current_state_schema_version,
                        exp_id,
                        exploration_model.language_code)
                current_state_schema_version += 1
            except Exception as e:
                error_message = (
                    'Exploration snapshot %s failed migration to states '
                    'v%s: %s' % (
                        exp_id, current_state_schema_version + 1, e))
                logging.exception(error_message)
                return result.Err((exp_id, Exception(error_message)))

            if target_state_schema_version == current_state_schema_version:
                return result.Ok((exp_id, 'SUCCESS'))

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of results from the audit of exploration
        snapshot migration.

        Returns:
            PCollection. A PCollection of results from the exploration
            snapshot migration.
        """
        unmigrated_exploration_models = (
            self.pipeline
            | 'Get all exploration snapshot content models' >> (
                ndb_io.GetModels(
                    exp_models.ExplorationSnapshotContentModel.get_all(
                        include_deleted=False)))
            # Pylint disable is needed because pylint is not able to correctly
            # detect that the value is passed through the pipe.
            | 'Add exploration keys' >> beam.WithKeys(  # pylint: disable=no-value-for-parameter
                lambda model: model.get_unversioned_instance_id())
        )

        migrated_exp_results = (
            unmigrated_exploration_models
            | 'Transform and migrate model' >> beam.MapTuple( # pylint: disable=no-value-for-parameter
                self._migrate_exploration_snapshot_model)
        )

        migrated_exp_job_run_results = (
            migrated_exp_results
            | 'Generate results for migration' >> (
                job_result_transforms.ResultsToJobRunResults('EXP PROCESSED'))
        )

        return migrated_exp_job_run_results


class ExpSnapshotsMigrationJob(base_jobs.JobBase):
    """A reusable one-time job that may be used to migrate exploration schema
    versions. This job will load all snapshots of all existing explorations
    from the datastore and immediately store them back into the datastore.
    The loading process of an exploration in exp_services automatically
    performs schema updating. This job persists that conversion work, keeping
    explorations up-to-date and improving the load time of new explorations.

    NOTE TO DEVELOPERS: Make sure to run ExpSnapshotsMigrationAuditJob before
    running this job.
    """

    @staticmethod
    def _migrate_exploration_snapshot_model(
        exp_id: str,
        exp_snapshot_model: exp_models.ExplorationSnapshotContentModel
    ) -> result.Result[
        Tuple[str, Exception]
    ]:
        """Migrates exploration snapshot model and saves it in the datastore.

        Args:
            exp_id: str. The ID of the exploration.
            exp_snapshot_model: ExplorationSnapshotContentModel. The
                snapshot model to migrate.

        Returns:
            Result((str, Exploration), (str, Exception)). Result containing
            tuple that consists of exploration ID and Exception if any.
        """
        with datastore_services.get_ndb_context():
            latest_exploration = exp_fetchers.get_exploration_by_id(
                exp_id, strict=False)
            if latest_exploration is None:
                return result.Err(
                    (exp_id, Exception('Exploration does not exist.'))
                )

            exploration_model = exp_models.ExplorationModel.get(exp_id)
            if (exploration_model.states_schema_version !=
                    feconf.CURRENT_STATE_SCHEMA_VERSION):
                return result.Err(
                    (
                        exp_id,
                        Exception('Exploration is not at latest schema version')
                    )
                )

        try:
            latest_exploration.validate()
        except Exception:
            return result.Err(
                (
                    exp_id,
                    Exception(
                        'Exploration %s failed non-strict validation' % exp_id
                    )
                )
            )

        # Some (very) old explorations do not have a states schema version.
        # These explorations have snapshots that were created before the
        # states_schema_version system was introduced. We therefore set their
        # states schema version to 0, since we now expect all snapshots to
        # explicitly include this field.
        if 'states_schema_version' not in exp_snapshot_model.content:
            exp_snapshot_model.content['states_schema_version'] = 0

        target_state_schema_version = feconf.CURRENT_STATE_SCHEMA_VERSION
        current_state_schema_version = (
            exp_snapshot_model.content['states_schema_version']
        )
        if current_state_schema_version == target_state_schema_version:
            return result.Err(
                (
                    exp_id,
                    Exception('Snapshot is already at latest schema version')
                )
            )

        versioned_exploration_states = (
            exp_domain.VersionedExplorationStatesDict(
                states_schema_version=current_state_schema_version,
                states=exp_snapshot_model.content['states']
            )
        )
        while current_state_schema_version < target_state_schema_version:
            try:
                with datastore_services.get_ndb_context():
                    exp_domain.Exploration.update_states_from_model(
                        versioned_exploration_states,
                        current_state_schema_version,
                        exp_id,
                        exploration_model.language_code)
                current_state_schema_version += 1
            except Exception as e:
                error_message = (
                    'Exploration snapshot %s failed migration to states '
                    'v%s: %s' % (
                        exp_id, current_state_schema_version + 1, e))
                logging.exception(error_message)
                return result.Err((exp_id, Exception(error_message)))

        exp_snapshot_model.content['states'] = (
            versioned_exploration_states['states']
        )
        exp_snapshot_model.content['states_schema_version'] = (
            current_state_schema_version
        )
        with datastore_services.get_ndb_context():
            exp_snapshot_model.update_timestamps(update_last_updated_time=False)
            exp_snapshot_model.put()

        return result.Ok((exp_id, 'SUCCESS'))

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of results from the audit of exploration
        snapshot migration.

        Returns:
            PCollection. A PCollection of results from the exploration
            snapshot migration.
        """
        unmigrated_exploration_models = (
            self.pipeline
            | 'Get all exploration snapshot content models' >> (
                ndb_io.GetModels(
                    exp_models.ExplorationSnapshotContentModel.get_all(
                        include_deleted=False)))
            # Pylint disable is needed because pylint is not able to correctly
            # detect that the value is passed through the pipe.
            | 'Add exploration keys' >> beam.WithKeys(  # pylint: disable=no-value-for-parameter
                lambda model: model.get_unversioned_instance_id())
        )

        migrated_exp_results = (
            unmigrated_exploration_models
            | 'Transform and migrate model' >> beam.MapTuple( # pylint: disable=no-value-for-parameter
                self._migrate_exploration_snapshot_model)
        )

        migrated_exp_job_run_results = (
            migrated_exp_results
            | 'Generate results for migration' >> (
                job_result_transforms.ResultsToJobRunResults('EXP PROCESSED'))
        )

        return migrated_exp_job_run_results
