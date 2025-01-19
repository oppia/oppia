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
from core.constants import constants
from core.domain import exp_domain
from core.domain import exp_fetchers
from core.domain import exp_services
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
    from mypy_imports import exp_models

(base_models, exp_models) = (
    models.Registry.import_models(
        [models.Names.BASE_MODEL, models.Names.EXPLORATION]))
datastore_services = models.Registry.import_datastore_services()


# TODO(#15613): Here we use MyPy ignore because the incomplete typing of
# apache_beam library and absences of stubs in Typeshed, forces MyPy to
# assume that PTransform class is of type Any. Thus to avoid MyPy's error
# (Class cannot subclass 'PTransform' (has type 'Any')), we added an
# ignore here.
class MigrateExplorationModels(beam.PTransform):  # type: ignore[misc]
    """Transform that gets all Exploration models, performs migration
      and filters any error results.
    """

    @staticmethod
    def _migrate_exploration(
        exp_model: exp_models.ExplorationModel,
        exp_is_published: bool
    ) -> result.Result[
        Tuple[str, exp_domain.Exploration],
        Tuple[str, Exception]
    ]:
        """Migrates exploration and transform exploration model into
        exploration object.

        Args:
            exp_model: ExplorationModel. The exploration model to migrate.
            exp_is_published: bool. Whether the exploration is published or not.

        Returns:
            Result((str, Exploration), (str, Exception)). Result containing
            tuple that consists of exploration ID and either Exploration object
            or Exception. Exploration object is returned when the migration was
            successful and Exception is returned otherwise.
        """
        try:
            exploration = exp_fetchers.get_exploration_from_model(exp_model)
            exploration.validate(strict=exp_is_published)

            with datastore_services.get_ndb_context():
                if exp_services.get_story_id_linked_to_exploration(
                        exp_model.id) is not None:
                    exp_services.validate_exploration_for_story(
                        exploration, True)

        except Exception as e:
            logging.exception(e)
            return result.Err((exp_model.id, e))

        return result.Ok((exp_model.id, exploration))

    @staticmethod
    def _generate_exploration_changes(
        exp_id: str, exp_model: exp_models.ExplorationModel
    ) -> Iterable[Tuple[str, exp_domain.ExplorationChange]]:
        """Generates exploration change objects. The ExplorationChange object
        is only generated when the exploration's states schema version is lower
        than the latest schema version.

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
                'from_version': str(exp_states_version),
                'to_version': str(feconf.CURRENT_STATE_SCHEMA_VERSION)
            })
            yield (exp_id, exp_change)

    def expand(
        self, pipeline: beam.Pipeline
    ) -> Tuple[
        beam.PCollection[base_models.BaseModel],
        beam.PCollection[job_run_result.JobRunResult]
    ]:
        """Migrate exploration objects and flush the input
            in case of errors.

        Args:
            pipeline: Pipeline. Input beam pipeline.

        Returns:
            (PCollection, PCollection). Tuple containing
            PCollection of models which should be put into the datastore and
            a PCollection of results from the exploration migration.
        """
        unmigrated_exploration_models = (
            pipeline
            | 'Get all non-deleted exploration models' >> (
                ndb_io.GetModels(
                    exp_models.ExplorationModel.get_all(
                        include_deleted=False)))
            # Pylint disable is needed because pylint is not able to correctly
            # detect that the value is passed through the pipe.
            | 'Add exploration keys' >> beam.WithKeys(  # pylint: disable=no-value-for-parameter
                lambda exp_model: exp_model.id)
        )

        exp_publication_status = (
            pipeline
            | 'Get all non-deleted exploration rights models' >> (
                ndb_io.GetModels(exp_models.ExplorationRightsModel.get_all()))
            | 'Extract publication status' >> beam.Map(
                lambda exp_rights: (
                    exp_rights.id,
                    exp_rights.status == constants.ACTIVITY_STATUS_PUBLIC
                )
            )
        )

        all_migrated_exp_results = (
            (
                unmigrated_exploration_models,
                exp_publication_status
            )
            | 'Merge model and staus' >> beam.CoGroupByKey()
            | 'Get rid of exp ID' >> beam.Values() # pylint: disable=no-value-for-parameter
            | 'Transform and migrate model' >> beam.MapTuple( # pylint: disable=no-value-for-parameter
                lambda exploration_models, status: self._migrate_exploration(
                    exploration_models[0], status[0]))
        )

        migrated_exp_job_run_results = (
            all_migrated_exp_results
            | 'Generate results for migration' >> (
                job_result_transforms.ResultsToJobRunResults('EXP PROCESSED'))
        )

        filtered_migrated_exp = (
            all_migrated_exp_results
            | 'Filter migration results' >> (
                results_transforms.DrainResultsOnError())
        )
        migrated_exp = (
            filtered_migrated_exp
            | 'Unwrap ok' >> beam.Map(
                lambda result_item: result_item.unwrap())
        )

        exp_changes = (
            unmigrated_exploration_models
            | 'Generate exploration changes' >> beam.FlatMapTuple(
                self._generate_exploration_changes)
        )

        exp_objects_list = (
            {
                'exp_model': unmigrated_exploration_models,
                'exploration': migrated_exp,
                'exp_changes': exp_changes
            }
            | 'Merge objects' >> beam.CoGroupByKey()
            | 'Get rid of ID' >> beam.Values() # pylint: disable=no-value-for-parameter
        )

        transformed_exp_objects_list = (
            exp_objects_list
            | 'Remove unmigrated explorations' >> beam.Filter(
                lambda x: (
                    len(x['exp_changes']) > 0 and
                    len(x['exploration']) > 0
                ))
            | 'Reorganize the exploration objects' >> beam.Map(lambda objects: {
                'exp_model': objects['exp_model'][0],
                'exploration': objects['exploration'][0],
                'exp_changes': objects['exp_changes']
            })
        )

        exp_objects_list_job_run_results = (
            transformed_exp_objects_list
            | 'Transform exp objects into job run results' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'EXP MIGRATED'))
        )

        already_migrated_job_run_results = (
            exp_objects_list
            | 'Remove migrated explorations' >> beam.Filter(
                lambda x: (
                    len(x['exp_changes']) == 0 and len(x['exploration']) > 0
                ))
            | 'Transform previously migrated exps into job run results' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'EXP PREVIOUSLY MIGRATED'))
        )

        job_run_results = (
            migrated_exp_job_run_results,
            exp_objects_list_job_run_results,
            already_migrated_job_run_results
        ) | 'Flatten job run results' >> beam.Flatten()

        return (
            transformed_exp_objects_list,
            job_run_results
        )


class MigrateExplorationJob(base_jobs.JobBase):
    """Job that migrates Exploration models."""

    @staticmethod
    def _update_exploration(
        exp_model: exp_models.ExplorationModel,
        migrated_exp: exp_domain.Exploration,
        exp_changes: Sequence[exp_domain.ExplorationChange]
    ) -> result.Result[
        Tuple[base_models.BaseModel],
        Tuple[str, Exception]
    ]:
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
        try:
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
                    exp_services
                    .compute_models_to_put_when_saving_new_exp_version(
                        feconf.MIGRATION_BOT_USERNAME,
                        updated_exp_model.id,
                        exp_changes,
                        commit_message,
                    )
                )
            datastore_services.update_timestamps_multi(
                list(models_to_put_values))
        except Exception as e:
            logging.exception(e)
            return result.Err((exp_model.id, e))

        return result.Ok(models_to_put_values)

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of results from the exploration migration.

        Returns:
            PCollection. A PCollection of results from the exploration
            migration.
        """

        transformed_exp_objects_list, job_run_results = (
            self.pipeline
            | 'Perform migration and filter migration results' >> (
                MigrateExplorationModels())
        )

        exp_related_models_results = (
            transformed_exp_objects_list
            | 'Generate exploration models to put' >> beam.Map(
                lambda exp_objects: self._update_exploration(
                    exp_objects['exp_model'],
                    exp_objects['exploration'],
                    exp_objects['exp_changes'],
                ))
        )

        exp_related_models_to_put = (
            exp_related_models_results
            | 'Filter results with oks' >> beam.Filter(
                lambda result_item: result_item.is_ok())
            | 'Unwrap models' >> beam.FlatMap(
                lambda result_item: result_item.unwrap())
        )

        exp_related_models_job_results = (
            exp_related_models_results
            | 'Generate results for exp related models' >> (
                job_result_transforms.ResultsToJobRunResults(
                    'EXP RELATED MODELS GENERATED'))
        )
        unused_put_results = (
                exp_related_models_to_put
                | 'Filter None models' >> beam.Filter(lambda x: x is not None)
                | 'Put models into datastore' >> ndb_io.PutModels()
            )

        return (
            (
                job_run_results,
                exp_related_models_job_results
            )
            | beam.Flatten()
        )


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
                MigrateExplorationModels())
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
                break

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
