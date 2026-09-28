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

"""Migration jobs for the feature flag config model rename."""

from __future__ import annotations

import core.storage.base_model.gae_models as base_model_module
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.types import job_run_result
from core.platform import models
from core.storage.config import gae_models as config_models

import apache_beam as beam

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import base_models, datastore_services

(base_models,) = models.Registry.import_models([models.Names.BASE_MODEL])
datastore_services = models.Registry.import_datastore_services()


class MigrateFeatureFlagConfigModelsJob(base_jobs.JobBase):
    """Migrates FeatureFlagConfigModel rows to WebFeatureFlagConfigModel."""

    DATASTORE_UPDATES_ALLOWED = True

    def _migrate_legacy_model(
        self,
        legacy_model: config_models.FeatureFlagConfigModel,
    ) -> config_models.WebFeatureFlagConfigModel:
        """Creates the new web feature flag config model from a legacy one."""
        migrated_config = config_models.WebFeatureFlagConfigModel(
            id=legacy_model.id,
            force_enable_for_all_users=legacy_model.force_enable_for_all_users,
            rollout_percentage=legacy_model.rollout_percentage,
            user_group_ids=legacy_model.user_group_ids,
        )
        migrated_config.update_timestamps()
        return migrated_config

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Runs the migration from old to new feature flag config models."""
        legacy_models = (
            self.pipeline
            | 'Get legacy FeatureFlagConfigModels'
            >> ndb_io.GetModels(
                config_models.FeatureFlagConfigModel.get_all(
                    include_deleted=False
                )
            )
        )

        migrated_models = (
            legacy_models
            | 'Migrate legacy models to WebFeatureFlagConfigModel'
            >> beam.Map(self._migrate_legacy_model)
        )

        if self.DATASTORE_UPDATES_ALLOWED:
            _ = (
                migrated_models
                | 'Put migrated WebFeatureFlagConfigModels'
                >> ndb_io.PutModels()
            )
            legacy_model_keys = (
                legacy_models
                | 'Get legacy FeatureFlagConfigModel keys'
                >> beam.Map(lambda model: model.key)
            )
            _ = (
                legacy_model_keys
                | 'Delete legacy FeatureFlagConfigModels'
                >> ndb_io.DeleteModels()
            )

        count_result = (
            migrated_models
            | 'Count migrated models'
            >> beam.combiners.Count.Globally().with_defaults(0)
            | 'Format migrated model count'
            >> beam.Map(
                lambda count: job_run_result.JobRunResult.as_stdout(
                    'MIGRATED FEATURE FLAG CONFIG MODEL COUNT: %d.' % count
                )
            )
        )

        migrated_model_results = (
            migrated_models
            | 'Log migrated model IDs'
            >> beam.Map(
                lambda model: job_run_result.JobRunResult.as_stdout(
                    'MIGRATED FEATURE FLAG CONFIG MODEL: %s' % model.id
                )
            )
        )

        return (
            count_result,
            migrated_model_results,
        ) | beam.Flatten()


class AuditFeatureFlagConfigModelsMigrationJob(
    MigrateFeatureFlagConfigModelsJob
):
    """Audit-only variant of the feature flag config model migration job."""

    DATASTORE_UPDATES_ALLOWED = False
