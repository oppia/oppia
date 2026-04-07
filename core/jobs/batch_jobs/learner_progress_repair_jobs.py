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
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Jobs that repair learner progress models with invalid exploration refs."""

from __future__ import annotations

from typing import Iterable, List, Optional, Sequence, Tuple

import apache_beam as beam

from core.constants import constants
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.types import job_run_result
from core.platform import models

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import datastore_services, exp_models, user_models

(exp_models, user_models) = models.Registry.import_models(
    [models.Names.EXPLORATION, models.Names.USER]
)
datastore_services = models.Registry.import_datastore_services()


def _get_invalid_exploration_ids(exploration_ids: List[str]) -> List[str]:
    """Returns exploration IDs that are missing or not public."""
    with datastore_services.get_ndb_context():
        exploration_models: Sequence[Optional[exp_models.ExplorationModel]] = (
            exp_models.ExplorationModel.get_multi(exploration_ids)
        )
        exploration_summary_models: Sequence[Optional[exp_models.ExpSummaryModel]] = (
            exp_models.ExpSummaryModel.get_multi(exploration_ids)
        )

    invalid_exploration_ids = []
    for exploration_id, exploration_model, summary_model in zip(
        exploration_ids, exploration_models, exploration_summary_models
    ):
        if (
            exploration_model is None
            or summary_model is None
            or summary_model.status != constants.ACTIVITY_STATUS_PUBLIC
        ):
            invalid_exploration_ids.append(exploration_id)

    return invalid_exploration_ids


class RemoveInvalidExplorationReferencesFromLearnerProgressModelsJob(base_jobs.JobBase):
    """Removes deleted/private exploration references from learner progress."""

    class CleanCompletedActivitiesModelDoFn(beam.DoFn):  # type: ignore[misc]
        """Cleans CompletedActivitiesModel exploration references."""

        def process(
            self,
            model: user_models.CompletedActivitiesModel,
        ) -> Iterable[
            Tuple[
                Optional[user_models.CompletedActivitiesModel],
                Optional[job_run_result.JobRunResult],
            ]
        ]:
            invalid_exploration_ids = _get_invalid_exploration_ids(
                model.exploration_ids
            )
            if not invalid_exploration_ids:
                yield None, None
                return

            model.exploration_ids = [
                exploration_id
                for exploration_id in model.exploration_ids
                if exploration_id not in invalid_exploration_ids
            ]
            model.update_timestamps()
            yield (
                model,
                job_run_result.JobRunResult.as_stdout(
                    "CompletedActivitiesModel %s removed invalid exploration references: %s"
                    % (model.id, ", ".join(invalid_exploration_ids))
                ),
            )

    class CleanIncompleteActivitiesModelDoFn(beam.DoFn):  # type: ignore[misc]
        """Cleans IncompleteActivitiesModel exploration references."""

        def process(
            self,
            model: user_models.IncompleteActivitiesModel,
        ) -> Iterable[
            Tuple[
                Optional[user_models.IncompleteActivitiesModel],
                List[user_models.ExpUserLastPlaythroughModel],
                Optional[job_run_result.JobRunResult],
            ]
        ]:
            invalid_exploration_ids = _get_invalid_exploration_ids(
                model.exploration_ids
            )
            if not invalid_exploration_ids:
                yield None, [], None
                return

            model.exploration_ids = [
                exploration_id
                for exploration_id in model.exploration_ids
                if exploration_id not in invalid_exploration_ids
            ]
            model.update_timestamps()

            last_playthrough_models = []
            for exploration_id in invalid_exploration_ids:
                with datastore_services.get_ndb_context():
                    last_playthrough_model = (
                        user_models.ExpUserLastPlaythroughModel.get(
                            model.id, exploration_id
                        )
                    )
                if last_playthrough_model is not None:
                    last_playthrough_models.append(last_playthrough_model)

            yield (
                model,
                last_playthrough_models,
                job_run_result.JobRunResult.as_stdout(
                    "IncompleteActivitiesModel %s removed invalid exploration references: %s"
                    % (model.id, ", ".join(invalid_exploration_ids))
                ),
            )

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        completed_results = (
            self.pipeline
            | "Get completed activities models"
            >> ndb_io.GetModels(
                user_models.CompletedActivitiesModel.get_all(include_deleted=False)
            )
            | "Clean completed activities models"
            >> beam.ParDo(self.CleanCompletedActivitiesModelDoFn())
        )

        incomplete_results = (
            self.pipeline
            | "Get incomplete activities models"
            >> ndb_io.GetModels(
                user_models.IncompleteActivitiesModel.get_all(include_deleted=False)
            )
            | "Clean incomplete activities models"
            >> beam.ParDo(self.CleanIncompleteActivitiesModelDoFn())
        )

        _ = (
            completed_results
            | "Get cleaned completed models" >> beam.Map(lambda result: result[0])
            | "Filter missing completed models"
            >> beam.Filter(lambda model: model is not None)
            | "Put completed models" >> ndb_io.PutModels()
        )

        _ = (
            incomplete_results
            | "Get cleaned incomplete models" >> beam.Map(lambda result: result[0])
            | "Filter missing incomplete models"
            >> beam.Filter(lambda model: model is not None)
            | "Put incomplete models" >> ndb_io.PutModels()
        )

        _ = (
            incomplete_results
            | "Get invalid playthrough models" >> beam.FlatMap(lambda result: result[1])
            | "Get invalid playthrough keys" >> beam.Map(lambda model: model.key)
            | "Delete invalid playthrough models" >> ndb_io.DeleteModels()
        )

        completed_logs = (
            completed_results
            | "Get completed repair logs" >> beam.Map(lambda result: result[1])
            | "Filter empty completed logs" >> beam.Filter(lambda log: log is not None)
        )

        incomplete_logs = (
            incomplete_results
            | "Get incomplete repair logs" >> beam.Map(lambda result: result[2])
            | "Filter empty incomplete logs" >> beam.Filter(lambda log: log is not None)
        )

        return (completed_logs, incomplete_logs) | beam.Flatten()
