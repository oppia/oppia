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

"""Migration job for web platform parameter config models."""

from __future__ import annotations

from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.types import job_run_result
from core.platform import models
from core.storage.config import gae_models as config_models

import apache_beam as beam

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import datastore_services

datastore_services = models.Registry.import_datastore_services()


class MigrateWebPlatformParameterConfigJob(base_jobs.JobBase):
    """Migrates legacy platform parameter models to the web config kind."""

    DATASTORE_UPDATES_ALLOWED = True

    def _migrate_legacy_model(
        self, legacy_model: config_models.PlatformParameterModel
    ) -> config_models.WebPlatformParameterConfigModel:
        """Creates the web config model corresponding to a legacy model."""
        with datastore_services.get_ndb_context():
            migrated_config = config_models.WebPlatformParameterConfigModel(
                id=legacy_model.id,
                rules=legacy_model.rules,
                rule_schema_version=legacy_model.rule_schema_version,
                default_value=legacy_model.default_value,
                version=legacy_model.version,
            )
            migrated_config.update_timestamps()
            return migrated_config

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Runs the migration from old to web parameter config models."""
        legacy_models = (
            self.pipeline
            | 'Get legacy PlatformParameterModels'
            >> ndb_io.GetModels(
                config_models.PlatformParameterModel.get_all(
                    include_deleted=False
                )
            )
        )
        migrated_models = (
            legacy_models
            | 'Migrate legacy models to WebPlatformParameterConfigModel'
            >> beam.Map(self._migrate_legacy_model)
        )

        if self.DATASTORE_UPDATES_ALLOWED:
            _ = (
                migrated_models
                | 'Put migrated WebPlatformParameterConfigModels'
                >> ndb_io.PutModels()
            )
            legacy_model_keys = (
                legacy_models
                | 'Get legacy PlatformParameterModel keys'
                >> beam.Map(lambda model: model.key)
            )
            _ = (
                legacy_model_keys
                | 'Delete legacy PlatformParameterModels'
                >> ndb_io.DeleteModels()
            )

        count_result = (
            migrated_models
            | 'Count migrated models' >> beam.combiners.Count.Globally()
            | 'Omit empty migration counts'
            >> beam.Filter(lambda count: count > 0)
            | 'Format migrated model count'
            >> beam.Map(
                lambda count: job_run_result.JobRunResult.as_stdout(
                    'MIGRATED WEB PLATFORM PARAMETER CONFIG MODEL COUNT: %d.'
                    % count
                )
            )
        )

        migrated_model_results = (
            migrated_models
            | 'Log migrated model IDs'
            >> beam.Map(
                lambda model: job_run_result.JobRunResult.as_stdout(
                    'MIGRATED WEB PLATFORM PARAMETER CONFIG MODEL: %s.'
                    % model.id
                )
            )
        )

        return (count_result, migrated_model_results) | beam.Flatten()


class AuditMigrateWebPlatformParameterConfigJob(
    MigrateWebPlatformParameterConfigJob
):
    """Audit-only variant of the web parameter config migration job."""

    DATASTORE_UPDATES_ALLOWED = False
