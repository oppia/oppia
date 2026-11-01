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

"""Remove auto_tts_enabled field from ExplorationModel and ExplorationSnapshotContentModel."""

from __future__ import annotations

from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import exp_models

(exp_models,) = models.Registry.import_models([models.Names.EXPLORATION])


class RemoveAutoTtsEnabledFieldJob(base_jobs.JobBase):
    """Remove auto_tts_enabled from ExplorationModel and ExplorationSnapshotContentModel."""

    def _remove_auto_tts_enabled_from_exploration_model(
        self, exp_model: exp_models.ExplorationModel
    ) -> exp_models.ExplorationModel:
        """Remove auto_tts_enabled field from the model.

        Args:
            exp_model: ExplorationModel. The exploration model.

        Returns:
            exp_model: ExplorationModel. The updated exploration model.
        """
        if (
            'auto_tts_enabled'
            in exp_model._properties  # pylint: disable=protected-access
        ):
            del exp_model._properties[  # pylint: disable=protected-access
                'auto_tts_enabled'
            ]
        return exp_model

    def _remove_auto_tts_enabled_from_snapshot_model(
        self, snapshot_model: exp_models.ExplorationSnapshotContentModel
    ) -> exp_models.ExplorationSnapshotContentModel:
        """Remove auto_tts_enabled field from the snapshot content model.

        Args:
            snapshot_model: ExplorationSnapshotContentModel. The snapshot content model.

        Returns:
            snapshot_model: ExplorationSnapshotContentModel. The updated snapshot content model.
        """
        if 'auto_tts_enabled' in snapshot_model.content:
            del snapshot_model.content['auto_tts_enabled']
        return snapshot_model

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        exp_models_with_updated_fields = (
            self.pipeline
            | 'Get all non-deleted ExplorationModels'
            >> ndb_io.GetModels(
                exp_models.ExplorationModel.get_all(include_deleted=True)
            )
            | 'Remove the auto_tts_enabled field from exp models'
            >> beam.Map(self._remove_auto_tts_enabled_from_exploration_model)
        )

        snapshot_models_with_updated_fields = (
            self.pipeline
            | 'Get all non-deleted ExplorationSnapshotContentModels'
            >> ndb_io.GetModels(
                exp_models.ExplorationSnapshotContentModel.get_all(
                    include_deleted=True
                )
            )
            | 'Remove the auto_tts_enabled field from snapshot models'
            >> beam.Map(self._remove_auto_tts_enabled_from_snapshot_model)
        )

        count_exp_models_updated = (
            exp_models_with_updated_fields
            | 'Total count for exploration models'
            >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'EXPLORATION MODELS ITERATED OR UPDATED'
                )
            )
        )

        count_snapshot_models_updated = (
            snapshot_models_with_updated_fields
            | 'Total count for snapshot models'
            >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'SNAPSHOT MODELS ITERATED OR UPDATED'
                )
            )
        )

        unused_put_exp_results = (
            exp_models_with_updated_fields
            | 'Put exp models into the datastore' >> ndb_io.PutModels()
        )

        unused_put_snapshot_results = (
            snapshot_models_with_updated_fields
            | 'Put snapshot models into the datastore' >> ndb_io.PutModels()
        )

        return (
            count_exp_models_updated,
            count_snapshot_models_updated,
        ) | 'Merge results' >> beam.Flatten()
