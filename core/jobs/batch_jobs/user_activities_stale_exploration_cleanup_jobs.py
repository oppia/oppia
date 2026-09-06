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

"""Jobs that audit and clean stale exploration references from
CompletedActivitiesModel and IncompleteActivitiesModel.

These user activity models can accumulate exploration IDs that reference
ExplorationModels which have been deleted or made private. This happens
because the cleanup logic in the exploration deletion and unpublish flows
is deferred via task queues, which can silently fail.

See issue #14968 for details.
"""

from __future__ import annotations

from core.constants import constants
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam
from typing import Iterable, List, Set

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import exp_models, user_models

(exp_models, user_models) = models.Registry.import_models(
    [models.Names.EXPLORATION, models.Names.USER]
)


def _get_stale_exp_ids(
    exploration_ids: List[str],
    valid_exp_ids: Set[str],
    public_exp_ids: Set[str],
) -> List[str]:
    """Returns the exploration IDs that are stale (deleted or not public).

    Args:
        exploration_ids: list(str). The exploration IDs to check.
        valid_exp_ids: set(str). The set of all existing exploration IDs.
        public_exp_ids: set(str). The set of all public exploration IDs.

    Returns:
        list(str). The exploration IDs that are stale.
    """
    return [
        eid
        for eid in exploration_ids
        if eid not in valid_exp_ids or eid not in public_exp_ids
    ]


def _filter_valid_exp_ids(
    exploration_ids: List[str],
    valid_exp_ids: Set[str],
    public_exp_ids: Set[str],
) -> List[str]:
    """Returns only the exploration IDs that are valid and public.

    Args:
        exploration_ids: list(str). The exploration IDs to filter.
        valid_exp_ids: set(str). The set of all existing exploration IDs.
        public_exp_ids: set(str). The set of all public exploration IDs.

    Returns:
        list(str). The exploration IDs that are valid and public.
    """
    return [
        eid
        for eid in exploration_ids
        if eid in valid_exp_ids and eid in public_exp_ids
    ]


class CleanupStaleActivitiesExplorationRefsJob(base_jobs.JobBase):
    """Removes stale exploration IDs from CompletedActivitiesModel and
    IncompleteActivitiesModel.

    An exploration ID is considered stale if the corresponding
    ExplorationModel has been deleted or its ExplorationRightsModel status
    is not public.

    When DATASTORE_UPDATES_ALLOWED is False, this job behaves as an audit
    job and only reports invalid models without mutating the datastore.
    """

    DATASTORE_UPDATES_ALLOWED = True

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of results from the cleanup.

        Returns:
            PCollection[JobRunResult]. Results from audit or cleanup.
        """

        # Step 1: Build the set of all existing (non-deleted) exp IDs.
        valid_exp_ids = (
            self.pipeline
            | 'Get ExplorationModels'
            >> ndb_io.GetModels(
                exp_models.ExplorationModel.get_all(include_deleted=False)
            )
            | 'Extract valid exp IDs' >> beam.Map(lambda m: m.id)
        )

        # Step 2: Build the set of all public exp IDs.
        public_exp_ids = (
            self.pipeline
            | 'Get ExplorationRightsModels'
            >> ndb_io.GetModels(
                exp_models.ExplorationRightsModel.get_all(include_deleted=False)
            )
            | 'Filter public rights models'
            >> beam.Filter(
                lambda m: m.status == constants.ACTIVITY_STATUS_PUBLIC
            )
            | 'Extract public exp IDs' >> beam.Map(lambda m: m.id)
        )

        # Step 3: Load activity models and filter to those with stale refs.
        completed_models = (
            self.pipeline
            | 'Get CompletedActivitiesModels'
            >> ndb_io.GetModels(
                user_models.CompletedActivitiesModel.get_all(
                    include_deleted=False
                )
            )
        )

        incomplete_models = (
            self.pipeline
            | 'Get IncompleteActivitiesModels'
            >> ndb_io.GetModels(
                user_models.IncompleteActivitiesModel.get_all(
                    include_deleted=False
                )
            )
        )

        stale_completed = (
            completed_models
            | 'Filter stale completed'
            >> beam.Filter(
                self._has_stale_exploration_ids,
                beam.pvalue.AsIter(valid_exp_ids),
                beam.pvalue.AsIter(public_exp_ids),
            )
        )

        stale_incomplete = (
            incomplete_models
            | 'Filter stale incomplete'
            >> beam.Filter(
                self._has_stale_exploration_ids,
                beam.pvalue.AsIter(valid_exp_ids),
                beam.pvalue.AsIter(public_exp_ids),
            )
        )

        # Step 4: Count stale models.
        stale_completed_count = (
            stale_completed
            | 'Count stale completed'
            >> beam.combiners.Count.Globally().without_defaults()
            | 'Report stale completed count'
            >> beam.Map(
                lambda count: job_run_result.JobRunResult.as_stdout(
                    f'stale_completed_activities_models_count: {count}'
                )
            )
        )

        stale_incomplete_count = (
            stale_incomplete
            | 'Count stale incomplete'
            >> beam.combiners.Count.Globally().without_defaults()
            | 'Report stale incomplete count'
            >> beam.Map(
                lambda count: job_run_result.JobRunResult.as_stdout(
                    f'stale_incomplete_activities_models_count: {count}'
                )
            )
        )

        outputs: List[beam.PCollection[job_run_result.JobRunResult]] = [
            stale_completed_count,
            stale_incomplete_count,
        ]

        if self.DATASTORE_UPDATES_ALLOWED:
            outputs.extend(
                self._build_migration_pipeline(
                    stale_completed,
                    stale_incomplete,
                    valid_exp_ids,
                    public_exp_ids,
                )
            )
        else:
            outputs.extend(
                self._build_audit_pipeline(
                    stale_completed,
                    stale_incomplete,
                    valid_exp_ids,
                    public_exp_ids,
                )
            )

        return outputs | 'Flatten outputs' >> beam.Flatten()

    @staticmethod
    def _has_stale_exploration_ids(
        model: user_models.CompletedActivitiesModel,
        valid_ids_iter: Iterable[str],
        public_ids_iter: Iterable[str],
    ) -> bool:
        """Returns True if the model contains any stale exploration IDs.

        Args:
            model: CompletedActivitiesModel|IncompleteActivitiesModel.
                The activity model to check.
            valid_ids_iter: Iterable(str). All existing exploration IDs.
            public_ids_iter: Iterable(str). All public exploration IDs.

        Returns:
            bool. Whether the model has any stale exploration IDs.
        """
        valid_set = set(valid_ids_iter)
        public_set = set(public_ids_iter)
        return any(
            eid not in valid_set or eid not in public_set
            for eid in model.exploration_ids
        )

    @staticmethod
    def _build_audit_pipeline(
        stale_completed: beam.PCollection,
        stale_incomplete: beam.PCollection,
        valid_exp_ids: beam.PCollection,
        public_exp_ids: beam.PCollection,
    ) -> List[beam.PCollection[job_run_result.JobRunResult]]:
        """Builds the audit-only pipeline that logs stale references.

        Args:
            stale_completed: PCollection. Completed activity models with
                stale refs.
            stale_incomplete: PCollection. Incomplete activity models with
                stale refs.
            valid_exp_ids: PCollection. All existing exploration IDs.
            public_exp_ids: PCollection. All public exploration IDs.

        Returns:
            list(PCollection[JobRunResult]). Audit log results.
        """
        completed_logs = stale_completed | 'Log stale completed' >> beam.Map(
            CleanupStaleActivitiesExplorationRefsJob._log_stale_model,
            'CompletedActivitiesModel',
            beam.pvalue.AsIter(valid_exp_ids),
            beam.pvalue.AsIter(public_exp_ids),
        )

        incomplete_logs = stale_incomplete | 'Log stale incomplete' >> beam.Map(
            CleanupStaleActivitiesExplorationRefsJob._log_stale_model,
            'IncompleteActivitiesModel',
            beam.pvalue.AsIter(valid_exp_ids),
            beam.pvalue.AsIter(public_exp_ids),
        )

        return [completed_logs, incomplete_logs]

    @staticmethod
    def _log_stale_model(
        model: user_models.CompletedActivitiesModel,
        model_name: str,
        valid_ids_iter: Iterable[str],
        public_ids_iter: Iterable[str],
    ) -> job_run_result.JobRunResult:
        """Logs a stale activity model.

        Args:
            model: CompletedActivitiesModel|IncompleteActivitiesModel.
                The activity model with stale refs.
            model_name: str. The name of the model class for logging.
            valid_ids_iter: Iterable(str). All existing exploration IDs.
            public_ids_iter: Iterable(str). All public exploration IDs.

        Returns:
            JobRunResult. The audit log entry.
        """
        valid_set = set(valid_ids_iter)
        public_set = set(public_ids_iter)
        stale_ids = _get_stale_exp_ids(
            model.exploration_ids, valid_set, public_set
        )
        return job_run_result.JobRunResult.as_stdout(
            f'{model_name} id={model.id}: ' f'stale_exp_ids={stale_ids}'
        )

    @staticmethod
    def _build_migration_pipeline(
        stale_completed: beam.PCollection,
        stale_incomplete: beam.PCollection,
        valid_exp_ids: beam.PCollection,
        public_exp_ids: beam.PCollection,
    ) -> List[beam.PCollection[job_run_result.JobRunResult]]:
        """Builds the migration pipeline that scrubs stale references and
        writes corrected models.

        Args:
            stale_completed: PCollection. Completed activity models with
                stale refs.
            stale_incomplete: PCollection. Incomplete activity models with
                stale refs.
            valid_exp_ids: PCollection. All existing exploration IDs.
            public_exp_ids: PCollection. All public exploration IDs.

        Returns:
            list(PCollection[JobRunResult]). Migration results.
        """
        cleaned_completed = (
            stale_completed
            | 'Clean completed models'
            >> beam.Map(
                CleanupStaleActivitiesExplorationRefsJob._clean_model,
                beam.pvalue.AsIter(valid_exp_ids),
                beam.pvalue.AsIter(public_exp_ids),
            )
        )

        cleaned_incomplete = (
            stale_incomplete
            | 'Clean incomplete models'
            >> beam.Map(
                CleanupStaleActivitiesExplorationRefsJob._clean_model,
                beam.pvalue.AsIter(valid_exp_ids),
                beam.pvalue.AsIter(public_exp_ids),
            )
        )

        unused_put_completed = (
            cleaned_completed
            | 'Put cleaned completed models' >> ndb_io.PutModels()
        )

        unused_put_incomplete = (
            cleaned_incomplete
            | 'Put cleaned incomplete models' >> ndb_io.PutModels()
        )

        completed_migration_count = (
            cleaned_completed
            | 'Count migrated completed'
            >> beam.combiners.Count.Globally().without_defaults()
            | 'Report migrated completed count'
            >> beam.Map(
                lambda count: job_run_result.JobRunResult.as_stdout(
                    f'migrated_completed_activities_models_count: {count}'
                )
            )
        )

        incomplete_migration_count = (
            cleaned_incomplete
            | 'Count migrated incomplete'
            >> beam.combiners.Count.Globally().without_defaults()
            | 'Report migrated incomplete count'
            >> beam.Map(
                lambda count: job_run_result.JobRunResult.as_stdout(
                    f'migrated_incomplete_activities_models_count: {count}'
                )
            )
        )

        return [completed_migration_count, incomplete_migration_count]

    @staticmethod
    def _clean_model(
        model: user_models.CompletedActivitiesModel,
        valid_ids_iter: Iterable[str],
        public_ids_iter: Iterable[str],
    ) -> user_models.CompletedActivitiesModel:
        """Removes stale exploration IDs from the model.

        Args:
            model: CompletedActivitiesModel|IncompleteActivitiesModel.
                The activity model to clean.
            valid_ids_iter: Iterable(str). All existing exploration IDs.
            public_ids_iter: Iterable(str). All public exploration IDs.

        Returns:
            CompletedActivitiesModel|IncompleteActivitiesModel. The
            cleaned model.
        """
        valid_set = set(valid_ids_iter)
        public_set = set(public_ids_iter)
        model.exploration_ids = _filter_valid_exp_ids(
            model.exploration_ids, valid_set, public_set
        )
        model.update_timestamps(update_last_updated_time=False)
        return model


class AuditStaleActivitiesExplorationRefsJob(
    CleanupStaleActivitiesExplorationRefsJob
):
    """Audit-only variant of CleanupStaleActivitiesExplorationRefsJob.

    Reports stale exploration references without modifying the datastore.
    """

    DATASTORE_UPDATES_ALLOWED = False
