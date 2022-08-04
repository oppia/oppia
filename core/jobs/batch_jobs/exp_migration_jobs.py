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
        [models.NAMES.base_model, models.NAMES.exploration,
         models.NAMES.opportunity]))
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
            exploration.validate() # type: ignore[no-untyped-call]

            with datastore_services.get_ndb_context():
                if exp_services.get_story_id_linked_to_exploration( # type: ignore[no-untyped-call]
                        exp_id) is not None:
                    exp_services.validate_exploration_for_story( # type: ignore[no-untyped-call]
                        exploration, True)

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
        exp_summary = exp_services.compute_summary_of_exploration( # type: ignore[no-untyped-call]
            migrated_exp, exp_rights_model, exp_summary_model,
            skip_exploration_model_last_updated=True)
        exp_summary.version += 1
        updated_exp_summary_model: exp_models.ExpSummaryModel = (
            exp_services.populate_exp_summary_model_fields( # type: ignore[no-untyped-call]
                exp_summary_model, exp_summary
            )
        )

        return updated_exp_summary_model

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
            exp_changes: sequence(ExplorationChange). The exploration changes
                to apply.

        Returns:
            sequence(BaseModel). Sequence of models which should be put into
            the datastore.
        """
        updated_exp_model = (
            exp_services.populate_exp_model_fields( # type: ignore[no-untyped-call]
                exp_model, migrated_exp))

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
            )
            models_to_put_values = []
            for model in models_to_put.values():
                # Here, we are narrowing down the type from object to BaseModel.
                assert isinstance(model, base_models.BaseModel)
                models_to_put_values.append(model)
            if opportunity_services.is_exploration_available_for_contribution( # type: ignore[no-untyped-call]
                migrated_exp.id
            ):
                (
                    opportunity_services # type: ignore[no-untyped-call]
                    .update_opportunity_with_updated_exploration(
                        migrated_exp.id))
        datastore_services.update_timestamps_multi(list(models_to_put_values))

        return models_to_put_values

    @staticmethod
    def _update_exploration_opportunity_summary_models(
        exp_id: str,
        migrated_exp: exp_domain.Exploration,
        exp_id_to_exp_opp_summary_model: Optional[Dict[
            str,
            opportunity_models.ExplorationOpportunitySummaryModel
        ]] = None
    ) -> Optional[opportunity_models.ExplorationOpportunitySummaryModel]:
        """Generates newly updated exploration opportunity summary models.

        Args:
            exp_id: str. The ID of the exploration to be updated.
            migrated_exp: Exploration. The updated exploration domain object.
            exp_id_to_exp_opp_summary_model: ExplorationOpportunitySummaryModel.
                The exploration opportunity summary model.

        Returns:
            sequence(BaseModel). Sequence of models which should be put into
            the datastore.
        """
        exp_opp_summary_model = None
        if (
            exp_id_to_exp_opp_summary_model is not None and
            exp_id in exp_id_to_exp_opp_summary_model
        ):
            content_count = migrated_exp.get_content_count() # type: ignore[no-untyped-call]
            translation_counts = migrated_exp.get_translation_counts() # type: ignore[no-untyped-call]
            complete_translation_language_list = (
                migrated_exp.get_languages_with_complete_translation()) # type: ignore[no-untyped-call]

            exp_opp_summary_model = (
                exp_id_to_exp_opp_summary_model[migrated_exp.id])
            exp_opp_summary = (
                opportunity_services # type: ignore[no-untyped-call]
                    .get_exploration_opportunity_summary_from_model(
                        exp_opp_summary_model))
            exp_opp_summary.content_count = content_count
            exp_opp_summary.translation_counts = translation_counts
            exp_opp_summary.incomplete_translation_language_codes = (
                utils.compute_list_difference(
                    exp_opp_summary
                    .incomplete_translation_language_codes,
                    complete_translation_language_list))

            new_languages_for_voiceover = (
                set(complete_translation_language_list) - set(
                exp_opp_summary.language_codes_with_assigned_voice_artists)
            )

            language_codes_needing_voice_artists_set = set(
                exp_opp_summary.language_codes_needing_voice_artists)
            language_codes_needing_voice_artists_set |= set(
                new_languages_for_voiceover)

            exp_opp_summary.language_codes_needing_voice_artists = list(
                language_codes_needing_voice_artists_set)

            exp_opp_summary.validate()

            with datastore_services.get_ndb_context():
                exp_opp_summary_model = (
                    opportunity_models.ExplorationOpportunitySummaryModel(
                        id=exp_opp_summary.id,
                        topic_id=exp_opp_summary.topic_id,
                        topic_name=exp_opp_summary.topic_name,
                        story_id=exp_opp_summary.story_id,
                        story_title=exp_opp_summary.story_title,
                        chapter_title=exp_opp_summary.chapter_title,
                        content_count=exp_opp_summary.content_count,
                        incomplete_translation_language_codes=(
                            exp_opp_summary
                                .incomplete_translation_language_codes),
                        translation_counts=exp_opp_summary.translation_counts,
                        language_codes_needing_voice_artists=(
                            exp_opp_summary
                                .language_codes_needing_voice_artists),
                        language_codes_with_assigned_voice_artists=(
                            exp_opp_summary
                                .language_codes_with_assigned_voice_artists)
                    )
                )

            datastore_services.update_timestamps_multi([exp_opp_summary_model])

        return exp_opp_summary_model

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
            | 'Remove broken exploration' >> beam.Filter(
                lambda id_and_exp: id_and_exp[0] not in (
                    'umPkwp0L1M0-', '670bU6d9JGBh'))
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

        exp_opp_summary_models = (
            self.pipeline
            | 'Get all non-deleted exp opportunity summary models' >> (
                ndb_io.GetModels(
                    opportunity_models
                        .ExplorationOpportunitySummaryModel.get_all()))
            | 'Combine exp opp summary and ids' >> beam.Map(# pylint: disable=no-value-for-parameter
                lambda model: (model.id, model))
        )

        exp_opp_summary_models_to_exp = beam.pvalue.AsDict(
            exp_opp_summary_models)

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
                'exp_rights_model': objects['exp_rights_model'][0],
                'exp_summary_model': objects['exp_summary_model'][0],
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
                        len(x['exp_changes']) == 0 and
                        len(x['exploration']) > 0
                ))
            | 'Transform previously migrated exps into job run results' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'EXP PREVIOUSLY MIGRATED'))
        )

        cache_deletion_job_run_results = (
            transformed_exp_objects_list
            | 'Delete exploration from cache' >> beam.Map(
                lambda exp_object: self._delete_exploration_from_cache(
                    exp_object['exploration']))
            | 'Generate results for cache deletion' >> (
                job_result_transforms.ResultsToJobRunResults('CACHE DELETION'))
        )

        exp_models_to_put = (
            transformed_exp_objects_list
            | 'Generate exploration models to put' >> beam.FlatMap(
                lambda exp_objects: self._update_exploration(
                    exp_objects['exp_model'],
                    exp_objects['exp_rights_model'],
                    exp_objects['exploration'],
                    exp_objects['exp_changes'],
                ))
        )

        exp_summary_models_to_put = (
            transformed_exp_objects_list
            | 'Generate exp summary models to put' >> beam.Map(
                lambda exp_objects: self._update_exp_summary(
                    exp_objects['exploration'],
                    exp_objects['exp_summary_model'],
                    exp_objects['exp_rights_model']
                ))
        )

        exp_opp_summary_models_to_put = (
            migrated_exp
            | 'Generate exp opportunity summary models to put' >> (
                beam.MapTuple(
                    self._update_exploration_opportunity_summary_models,
                    exp_id_to_exp_opp_summary_model=(
                        exp_opp_summary_models_to_exp)))
        )

        unused_put_results = (
            (
                exp_models_to_put,
                exp_summary_models_to_put,
                exp_opp_summary_models_to_put
            )
            | 'Merge models' >> beam.Flatten()
            | 'Filter None models' >> beam.Filter(
                lambda x: x is not None)
            | 'Put models into datastore' >> ndb_io.PutModels()
        )

        return (
            (
                cache_deletion_job_run_results,
                migrated_exp_job_run_results,
                exp_objects_list_job_run_results,
                already_migrated_job_run_results
            )
            | beam.Flatten()
        )
