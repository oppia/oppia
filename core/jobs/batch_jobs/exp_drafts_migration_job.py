# coding: utf-8
#
# Copyright 2026 The Oppia Authors. All Rights Reserved.
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

"""Job for migrating exploration drafts to the latest schema version."""

from __future__ import annotations

import logging

from core.domain import exp_fetchers, exp_services
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam
import result
from typing import Tuple

MYPY = False
if MYPY:  # pragma: no cover.
    from mypy_imports import base_models, exp_models, user_models

(base_models, exp_models, user_models) = models.Registry.import_models(
    [models.Names.BASE_MODEL, models.Names.EXPLORATION, models.Names.USER]
)


# TODO(#15613): Here we use MyPy ignore because the incomplete typing of
# apache_beam library and absences of stubs in Typeshed, forces MyPy to
# assume that PTransform class is of type Any. Thus to avoid MyPy's error
# (Class cannot subclass 'PTransform' (has type 'Any')), we added an
# ignore here.
class MigrateExplorationDrafts(beam.PTransform):  # type: ignore[misc]
    """Transform that gets all ExplorationUserDataModels, checks if they have
    valid drafts, and performs migration if the schema is outdated.
    """

    @staticmethod
    def _migrate_draft(
        user_model: user_models.ExplorationUserDataModel,
        exp_model: exp_models.ExplorationModel,
    ) -> result.Result[
        Tuple[str, user_models.ExplorationUserDataModel], Tuple[str, Exception]
    ]:
        """Migrates the draft change list within an ExplorationUserDataModel.

        Args:
            user_model: ExplorationUserDataModel. The user data model containing
                the draft.
            exp_model: ExplorationModel. The associated exploration model.

        Returns:
            Result. A Result object containing the (id, updated_model) on
            success, or (id, Exception) on failure.
        """
        try:
            # If there are no drafts, skip.
            if not user_model.draft_change_list:
                return result.Ok((user_model.id, user_model))

            # Retrieve the full exploration object from the model.
            exploration = exp_fetchers.get_exploration_from_model(exp_model)

            # Use domain service to check/migrate the draft.
            updated_draft_change_list = (
                exp_services.migrate_draft_change_list_to_latest_schema(
                    user_model.draft_change_list, exploration
                )
            )

            # If the draft changed, update the model.
            if updated_draft_change_list != user_model.draft_change_list:
                user_model.draft_change_list = updated_draft_change_list

            return result.Ok((user_model.id, user_model))

        except Exception as e:
            logging.exception(
                'Failed to migrate draft for user %s and exp %s: %s'
                % (user_model.user_id, user_model.exploration_id, e)
            )
            return result.Err((user_model.id, e))

    def expand(self, pipeline: beam.Pipeline) -> Tuple[
        beam.PCollection[base_models.BaseModel],
        beam.PCollection[job_run_result.JobRunResult],
    ]:
        # 1. Get all User Data Models with drafts.
        user_data_models = (
            pipeline
            | 'Get all ExplorationUserDataModels'
            >> ndb_io.GetModels(
                user_models.ExplorationUserDataModel.get_all(
                    include_deleted=False
                )
            )
            | 'Filter models with drafts'
            >> beam.Filter(
                lambda model: (
                    model.draft_change_list is not None
                    and len(model.draft_change_list) > 0
                )
            )
        )

        # 2. Get all Exploration Models.
        exploration_models = (
            pipeline
            | 'Get all ExplorationModels'
            >> ndb_io.GetModels(
                exp_models.ExplorationModel.get_all(include_deleted=False)
            )
            | 'Key ExpModels by ID'
            >> beam.WithKeys(  # pylint: disable=no-value-for-parameter
                lambda m: m.id
            )
        )
        user_models_keyed_by_exp_id = (
            user_data_models
            | 'Key UserData by Exp ID'
            >> beam.WithKeys(  # pylint: disable=no-value-for-parameter
                lambda m: m.exploration_id
            )
        )

        joined_models = {
            'user_data': user_models_keyed_by_exp_id,
            'exploration': exploration_models,
        } | 'Join UserData and Exploration' >> beam.CoGroupByKey()

        # Process the Join and Migrate.
        migrated_results = joined_models | 'Migrate Drafts' >> beam.FlatMap(
            lambda item: [
                self._migrate_draft(user_model, item[1]['exploration'][0])
                for user_model in item[1]['user_data']
                # Ensure exp exists.
                if item[1]['exploration']
            ]
        )

        # Handle Results.
        migrated_user_models = (
            migrated_results
            | 'Filter OK results' >> beam.Filter(lambda r: r.is_ok())
            | 'Unwrap models' >> beam.Map(lambda r: r.unwrap()[1])
        )

        job_run_results = migrated_results | 'Transform to JobRunResults' >> (
            job_result_transforms.ResultsToJobRunResults('DRAFT PROCESSED')
        )

        return (migrated_user_models, job_run_results)


class MigrateExplorationDraftsJob(base_jobs.JobBase):
    """Job that migrates exploration drafts."""

    DATASTORE_UPDATES_ALLOWED = True

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        migrated_models, job_run_results = (
            self.pipeline | 'Migrate Drafts' >> MigrateExplorationDrafts()
        )
        if self.DATASTORE_UPDATES_ALLOWED:
            unused_put_results = (
                migrated_models
                | 'Put updated User Models' >> ndb_io.PutModels()
            )
        return job_run_results


class AuditMigrateExplorationDraftsJob(MigrateExplorationDraftsJob):
    """Job that audits the migration of exploration drafts without saving."""

    DATASTORE_UPDATES_ALLOWED = False
