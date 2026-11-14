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

"""Audit and migration jobs for user role IDs."""

from __future__ import annotations

from core import feconf
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import datastore_services, user_models

(user_models,) = models.Registry.import_models([models.Names.USER])
datastore_services = models.Registry.import_datastore_services()


class MigrateWebReleaseCoordinatorRoleJob(base_jobs.JobBase):
    """Migrates existing release coordinators to the web role ID."""

    DATASTORE_UPDATES_ALLOWED = True

    def _has_release_coordinator_role(
        self, user_model: user_models.UserSettingsModel
    ) -> bool:
        """Checks whether a user has the release coordinator role."""
        if feconf.ROLE_ID_RELEASE_COORDINATOR in user_model.roles:
            return True
        return False

    def _migrate_role(
        self, user_model: user_models.UserSettingsModel
    ) -> user_models.UserSettingsModel:
        """Updates a user's release coordinator role to the web release coordinator role."""
        with datastore_services.get_ndb_context():
            current_roles = [
                role
                for role in user_model.roles
                if role != feconf.ROLE_ID_RELEASE_COORDINATOR
            ]
            current_roles.append(feconf.ROLE_ID_WEB_RELEASE_COORDINATOR)
            user_model.roles = current_roles
            user_model.update_timestamps()
        return user_model

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of role migration results."""
        users_with_release_coordinator_role = (
            self.pipeline
            | 'Get all UserSettingsModels'
            >> ndb_io.GetModels(
                user_models.UserSettingsModel.get_all(include_deleted=False)
            )
            | 'Filter users with release coordinator role'
            >> beam.Filter(self._has_release_coordinator_role)
        )

        outputs = []
        if self.DATASTORE_UPDATES_ALLOWED:
            migrated_users = (
                users_with_release_coordinator_role
                | 'Migrate release coordinator role'
                >> beam.Map(self._migrate_role)
            )
            put_results = (
                migrated_users
                | 'Put migrated UserSettingsModels into datastore'
                >> ndb_io.PutModels()
            )
            migration_logs = (
                migrated_users
                | 'Log migrated user role'
                >> beam.Map(
                    lambda model: job_run_result.JobRunResult.as_stdout(
                        'Migrated release coordinator role: user_id=%s'
                        % model.id
                    )
                )
            )
            migration_count = (
                migrated_users
                | 'Count migrated user roles'
                >> beam.combiners.Count.Globally().with_defaults(0)
                | 'Report migrated user role count'
                >> beam.Map(
                    lambda count: job_run_result.JobRunResult.as_stdout(
                        'migrated_web_release_coordinator_role_count: %s'
                        % count
                    )
                )
            )
            outputs.extend([migration_logs, migration_count, put_results])
        else:
            audit_logs = (
                users_with_release_coordinator_role
                | 'Log users with release coordinator role'
                >> beam.Map(
                    lambda model: job_run_result.JobRunResult.as_stdout(
                        'User has release coordinator role: '
                        'user_id=%s' % model.id
                    )
                )
            )
            audit_count = (
                users_with_release_coordinator_role
                | 'Count users with release coordinator role'
                >> beam.combiners.Count.Globally().with_defaults(0)
                | 'Report users with release coordinator role count'
                >> beam.Map(
                    lambda count: job_run_result.JobRunResult.as_stdout(
                        'users_with_release_coordinator_role_count: '
                        '%s' % count
                    )
                )
            )
            outputs.extend([audit_logs, audit_count])

        return outputs | 'Flatten role migration results' >> beam.Flatten()


class AuditWebReleaseCoordinatorRoleJob(MigrateWebReleaseCoordinatorRoleJob):
    """Audits MigrateWebReleaseCoordinatorRoleJob without updating data."""

    DATASTORE_UPDATES_ALLOWED = False
