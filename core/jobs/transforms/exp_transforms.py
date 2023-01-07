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

"""Provides a transform to migrate exploration models."""

from __future__ import annotations

import logging

from core import feconf
from core.constants import constants
from core.domain import exp_domain
from core.domain import exp_fetchers
from core.domain import exp_services
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms
from core.jobs.transforms import results_transforms
from core.platform import models

import apache_beam as beam
import result
from typing import Any, Iterable, Sequence, Tuple

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

    # Here we use type Any because this method can accept any kind of
    # PCollection object to return the filtered migration results.
    def expand(
        self, objects: Sequence[base_models.BaseModel]
    ) -> Tuple[Sequence[base_models.BaseModel],
        beam.PCollection[result.Result[Tuple[str, Any], None]]]:
        """Migrate exploration objects and flush the input
            in case of errors.

        Args:
            objects: PCollection. Sequence of models.

        Returns:
            (Sequence(BaseModel), PCollection). Tuple containing
            sequence of models which should be put into the datastore and
            a PCollection of results from the exploration  migration.
        """
        unmigrated_exploration_models = (
            objects
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

        exp_publication_status = (
            objects
            | 'Get all non-deleted exploration rights models' >> (
                ndb_io.GetModels(exp_models.ExplorationRightsModel.get_all()))
            | 'Extract publication status' >> beam.Map(
                lambda exp_rights: (
                    exp_rights.id,
                    exp_rights.status == constants.ACTIVITY_STATUS_PUBLIC
                )
            )
            # TODO(#15871): This filter should be removed after the explorations
            # are fixed and it is possible to migrate them.
            | 'Remove exp rights for broken exps' >> beam.Filter(
                lambda exp_rights: exp_rights[0] not in (
                    'umPkwp0L1M0-', '670bU6d9JGBh'))
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

        return (
            transformed_exp_objects_list,
            (
                migrated_exp_job_run_results,
                exp_objects_list_job_run_results,
                already_migrated_job_run_results
            )
            | beam.Flatten()
        )
