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
from core import utils
from core.domain import caching_services
from core.domain import exp_domain
from core.domain import exp_fetchers
from core.domain import exp_services
from core.domain import opportunity_services
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam
import result
from typing import Dict, Iterable, Optional, Sequence, Tuple

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import base_models
    from mypy_imports import datastore_services
    from mypy_imports import exp_models
    from mypy_imports import opportunity_models

(base_models, exp_models, opportunity_models) = (
    models.Registry.import_models(
        [models.Names.BASE_MODEL, models.Names.EXPLORATION,
         models.Names.OPPORTUNITY]))
datastore_services = models.Registry.import_datastore_services()


class PopulateExplorationProtoSizeInBytesJob(base_jobs.JobBase):
    """Job that populates android_proto_size_in_bytes attribute
    for Exploration models."""

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

            with datastore_services.get_ndb_context():
                if exp_services.get_story_id_linked_to_exploration(
                        exp_id) is not None:
                    exp_services.validate_exploration_for_story(
                        exploration, True)

        except Exception as e:
            logging.exception(e)
            return result.Err((exp_id, e))
        return result.Ok((exp_id, exploration))

    @staticmethod
    def _generate_exploration_changes(
        exp_model: exp_models.ExplorationModel,
        exploration: exp_domain.Exploration
    ) -> Iterable[Tuple[str, exp_domain.ExplorationChange]]:
        """Generates exploration change objects. The ExplorationChange object
        is only generated when the exploration's states schema version is lower
        than the latest schema version.

        Args:
            exp_model: ExplorationModel. The exploration model for which to
                generate the change objects.
            exploration: Exploration. The exploration domain object for which
                to generate the change objects.

        Yields:
            (str, ExplorationChange). Tuple containing exploration ID and
            ExplorationChange object.
        """
        if (
            not hasattr(exp_model, 'android_proto_size_in_bytes')
                or exp_model.android_proto_size_in_bytes is None):
            exp_change = exp_domain.ExplorationChange({
                'cmd': (
                    exp_domain.CMD_EDIT_EXPLORATION_PROPERTY),
                'property_name': 'android_proto_size_in_bytes',
                'new_value': exploration.android_proto_size_in_bytes
            })
            yield (exp_model.id, exp_change)

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
    def _update_exploration(
        exp_model: exp_models.ExplorationModel,
        exp_rights_model: exp_models.ExplorationRightsModel,
        migrated_exp: exp_domain.Exploration,
        exp_changes: Sequence[exp_domain.ExplorationChange]
    ) -> Sequence[base_models.BaseModel]:
        """Generates newly updated exploration models.

        Args:
            exp_model: ExplorationModel. The exploration which should be
                updated.
            exp_rights_model: ExplorationRightsModel. The exploration rights
                model which is to be updated.
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
            'Updated android_proto_size_in_bytes for the exploration')
        change_dicts = [change.to_dict() for change in exp_changes]
        with datastore_services.get_ndb_context():
            models_to_put = updated_exp_model.compute_models_to_commit(
                feconf.MIGRATION_BOT_USERNAME,
                feconf.COMMIT_TYPE_EDIT,
                commit_message,
                change_dicts,
                additional_models={'rights_model': exp_rights_model}
            )
            models_to_put_values = []
            for model in models_to_put.values():
                # Here, we are narrowing down the type from object to BaseModel.
                assert isinstance(model, base_models.BaseModel)
                models_to_put_values.append(model)
            if opportunity_services.is_exploration_available_for_contribution(
                migrated_exp.id
            ):
                (
                    opportunity_services
                    .update_opportunity_with_updated_exploration(
                        migrated_exp.id))
        datastore_services.update_timestamps_multi(list(models_to_put_values))

        return models_to_put_values

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
            | 'Add exploration keys' >> beam.WithKeys(  # pylint: disable=no-value-for-parameter
                lambda exp_model: exp_model.id)
            # TODO(#15871): This filter should be removed after the explorations
            # are fixed and it is possible to migrate them.
            | 'Remove broken exploration' >> beam.Filter(
                lambda id_and_exp: id_and_exp[0] not in (
                    'umPkwp0L1M0-', '670bU6d9JGBh'))
        )

        exp_rights_models = (
                self.pipeline
                | 'Get all non-deleted exploration rights models' >> (
                    ndb_io.GetModels(
                        exp_models.ExplorationRightsModel.get_all()))
                | 'Add exploration rights ID' >> beam.WithKeys(  # pylint: disable=no-value-for-parameter
            lambda exp_rights_model: exp_rights_model.id)
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

        migrated_exploration_job_run_results = (
            migrated_exp_results
            | 'Generate results for migration' >> (
                job_result_transforms.ResultsToJobRunResults(
                    'EXPLORATION PROCESSED'))
        )

        migrated_exploration_object_list = (
            {
                'exp_model': unmigrated_exploration_models,
                'exploration': migrated_exp,
            }
            | 'Merge object' >> beam.CoGroupByKey()
            | 'Get rid ID' >> beam.Values()  # pylint: disable=no-value-for-parameter
            | 'Remove error exploration object' >> beam.Filter(
        lambda x: len(x['exploration']) > 0)
            | 'Reorganize the exploration object' >> beam.Map(lambda objects: {
                'exp_model': objects['exp_model'][0],
                'exploration': objects['exploration'][0]}))

        exp_changes = (
                migrated_exploration_object_list
                | 'Generate exploration changes' >> beam.FlatMap(
            lambda exp_objects: self._generate_exploration_changes(
                exp_objects['exp_model'],
                exp_objects['exploration']
            ))
        )

        exp_objects_list = (
            {
                'exp_model': unmigrated_exploration_models,
                'exp_rights_model': exp_rights_models,
                'exploration': migrated_exp,
                'exp_changes': exp_changes
            }
            | 'Merge objects' >> beam.CoGroupByKey()
            | 'Get rid of ID' >> beam.Values() # pylint: disable=no-value-for-parameter
            | 'Remove unmigrated explorations objects' >> beam.Filter(
                lambda x: (
                        len(x['exp_changes']) > 0 and
                        len(x['exploration']) > 0
                ))
            | 'Reorganize the exploration objects' >> beam.Map(lambda objects: {
                'exp_model': objects['exp_model'][0],
                'exploration': objects['exploration'][0],
                'exp_changes': objects['exp_changes'],
                'exp_rights_model': objects['exp_rights_model'][0]
            })
        )

        exp_objects_list_job_run_results = (
            exp_objects_list
            | 'Transform exploration objects into job run results' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'EXPLORATION POPULATED WITH android_proto_size_in_bytes'))
        )

        exp_models_to_put = (
            exp_objects_list
                | 'Generate exploration models to put' >> beam.FlatMap(
                    lambda exp_objects: self._update_exploration(
                        exp_objects['exp_model'],
                        exp_objects['exp_rights_model'],
                        exp_objects['exploration'],
                        exp_objects['exp_changes'],
                ))
        )

        cache_deletion_job_run_results = (
                exp_objects_list
                | 'Delete exploration from cache' >> beam.Map(
            lambda exp_object: self._delete_exploration_from_cache(
                exp_object['exploration']))
                | 'Generate results for cache deletion' >> (
                    job_result_transforms.ResultsToJobRunResults(
                        'CACHE DELETION'))
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

        unused_put_results = (
            exp_models_to_put
            # | 'Merge models' >> beam.Flatten()
            | 'Filter None models' >> beam.Filter(
                lambda x: x is not None)
            | 'Put models into datastore' >> ndb_io.PutModels()
        )

        return (
            (
                cache_deletion_job_run_results,
                migrated_exploration_job_run_results,
                already_migrated_job_run_results,
                exp_objects_list_job_run_results
            )
            | beam.Flatten()
        )


class AuditPopulateExplorationProtoSizeInBytesJob(base_jobs.JobBase):
    """Job that audits PopulateExplorationProtoSizeInBytesJob"""

    @staticmethod
    def _count_exp_with_non_zero_attribute(
            exp_id: str,
            exp_model: exp_models.ExplorationModel
    ) -> result.Result[
        Tuple[str, exp_domain.Exploration],
        Tuple[str, Exception]
    ]:
        """Counts the number of exploration models with
        proto_size_in_bytes as a non-zero attribute.

         Args:
             exp_id: str. The ID of the exploration.
             exp_model: ExplorationModel. The exploration model.

        Returns:
            Result((str, Exploration), (str, Exception)). Result containing
            tuple that consists of exploration ID and either ExplorationModel object
            or Exception.
         """
        with datastore_services.get_ndb_context():
            if (
                exp_model.android_proto_size_in_bytes is not None
                    and exp_model.android_proto_size_in_bytes != 0):
                return result.Ok((exp_id, exp_model))

        return result.Err((exp_id, exp_model))

    @staticmethod
    def _count_exp_without_attribute(
            exp_id: str,
            exp_model: exp_models.ExplorationModel
    ) -> result.Result[
        Tuple[str, exp_domain.Exploration],
        Tuple[str, Exception]
    ]:
        """Counts the number of exploration models without
        proto_size_in_bytes attribute.

         Args:
             exp_id: str. The ID of the exploration.
             exp_model: ExplorationModel. The exploration model.

        Returns:
            Result((str, Exploration), (str, Exception)). Result containing
            tuple that consists of exploration ID and either ExplorationModel object
            or Exception.
         """
        if not hasattr(exp_model, 'android_proto_size_in_bytes'):
            return result.Ok((exp_id, exp_model))

        return result.Err((exp_id, exp_model))

    @staticmethod
    def _count_exp_with_none_attribute(
            exp_id: str,
            exp_model: exp_models.ExplorationModel
    ) -> result.Result[
        Tuple[str, exp_domain.Exploration],
        Tuple[str, Exception]
    ]:
        """Counts the number of exploration models with
        proto_size_in_bytes attribute as none.

         Args:
             exp_id: str. The ID of the exploration.
             exp_model: ExplorationModel. The exploration model.

        Returns:
            Result((str, Exploration), (str, Exception)). Result containing
            tuple that consists of exploration ID and either ExplorationModel object
            or Exception.
         """
        if (
            hasattr(exp_model, 'android_proto_size_in_bytes')
                and exp_model.android_proto_size_in_bytes is None):
            return result.Ok((exp_id, exp_model))

        return result.Err((exp_id, exp_model))

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of results from the audit of exploration
        proto size population migration.

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
                # TODO(#15871): This filter should be removed after the explorations
                # are fixed and it is possible to migrate them.
                | 'Remove broken exploration' >> beam.Filter(
            lambda id_and_exp: id_and_exp[0] not in (
                'umPkwp0L1M0-', '670bU6d9JGBh'))
        )

        total_exploration_objects_list = (
            {
                'exp_model': unmigrated_exploration_models
            }
            | 'Merge objects' >> beam.CoGroupByKey()
            | 'Get rid of ID' >> beam.Values() # pylint: disable=no-value-for-parameter
        )

        total_exploration_objects_results = (
            total_exploration_objects_list
            | 'Transform exp model objects to number of results' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'Total number of exploration models'))
        )

        migrated_exp_results = (
                unmigrated_exploration_models
                | 'Count non-zero attribute' >> beam.MapTuple(  # pylint: disable=no-value-for-parameter
                self._count_exp_with_non_zero_attribute
        )
        )

        migrated_exp_job_run_results = (
                migrated_exp_results
                | 'Filter ok explorations' >> beam.Filter(
                    lambda result_item: result_item.is_ok())
                | 'Results for explorations with attribute ' >> (
                    job_result_transforms.ResultsToJobRunResults(
                        'Explorations with non-zero proto_size_in_bytes'
                        ' attribute'))
        )

        exp_without_attr_results = (
                unmigrated_exploration_models
                | 'Count models without the attribute' >> beam.MapTuple(  # pylint: disable=no-value-for-parameter
                self._count_exp_without_attribute
            )
        )

        exp_without_attr_job_results = (
            exp_without_attr_results
            | 'Filter oks for exp without attribute' >> beam.Filter(
            lambda result_item: result_item.is_ok())
            | 'Generate results for exp without attribute' >> (
                    job_result_transforms.ResultsToJobRunResults(
                        'Explorations without android_proto_size_in_bytes'
                        ' attribute'))
        )

        exp_with_none_attr_results = (
                unmigrated_exploration_models
                | 'Count models with None the attribute' >> beam.MapTuple(  # pylint: disable=no-value-for-parameter
            self._count_exp_with_none_attribute
        )
        )

        exp_with_none_attr_job_results = (
                exp_with_none_attr_results
                | 'Filter oks for exp with None attribute' >> beam.Filter(
                    lambda result_item: result_item.is_ok())
                | 'Generate results for exp with None attribute' >> (
                    job_result_transforms.ResultsToJobRunResults(
                        'Explorations with android_proto_size_in_bytes'
                        ' attribute as None'))
        )

        return (
                (
                    total_exploration_objects_results,
                    exp_without_attr_job_results,
                    migrated_exp_job_run_results,
                    exp_with_none_attr_job_results
                )
                | beam.Flatten()
        )
