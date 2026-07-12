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

"""Audit and migration jobs for classroom models."""

from __future__ import annotations

from core import feconf
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import classroom_models, datastore_services

(classroom_models,) = models.Registry.import_models([models.Names.CLASSROOM])
datastore_services = models.Registry.import_datastore_services()


class MigrateClassroomFeedbackRecipientEmailJob(base_jobs.JobBase):
    """Job that backfills feedback_recipient_email on ClassroomModel entries."""

    DATASTORE_UPDATES_ALLOWED = True

    def _needs_feedback_recipient_email(
        self, classroom_model: classroom_models.ClassroomModel
    ) -> bool:
        """Checks whether the classroom model needs a feedback email.

        Args:
            classroom_model: ClassroomModel. The classroom model to check.

        Returns:
            bool. Whether the classroom needs its feedback recipient email
            backfilled.
        """
        return not getattr(classroom_model, 'feedback_recipient_email', None)

    def _backfill_feedback_recipient_email(
        self, classroom_model: classroom_models.ClassroomModel
    ) -> classroom_models.ClassroomModel:
        """Backfills the classroom feedback recipient email.

        Args:
            classroom_model: ClassroomModel. The classroom model to update.

        Returns:
            ClassroomModel. The updated classroom model.
        """
        with datastore_services.get_ndb_context():
            classroom_model.feedback_recipient_email = (
                feconf.SYSTEM_EMAIL_ADDRESS
            )
            classroom_model.update_timestamps()

        return classroom_model

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of classroom migration results.

        Returns:
            PCollection. The migration results.
        """
        classrooms_needing_feedback_email = (
            self.pipeline
            | 'Get all ClassroomModels'
            >> ndb_io.GetModels(
                classroom_models.ClassroomModel.get_all(include_deleted=False)
            )
            | 'Filter classrooms missing feedback recipient email'
            >> beam.Filter(self._needs_feedback_recipient_email)
        )

        migrated_classrooms = (
            classrooms_needing_feedback_email
            | 'Backfill feedback recipient email'
            >> beam.Map(self._backfill_feedback_recipient_email)
        )

        if self.DATASTORE_UPDATES_ALLOWED:
            unused_put_results = (
                migrated_classrooms
                | 'Put updated ClassroomModels into datastore'
                >> ndb_io.PutModels()
            )

        migrated_classroom_results = (
            migrated_classrooms
            | 'Report migrated classrooms'
            >> beam.Map(
                lambda model: job_run_result.JobRunResult.as_stdout(
                    'MIGRATED CLASSROOM FEEDBACK RECIPIENT EMAIL: %s' % model.id
                )
            )
        )

        migrated_count_results = (
            migrated_classrooms
            | 'Count migrated classrooms'
            >> job_result_transforms.CountObjectsToJobRunResult(
                'MIGRATED CLASSROOM FEEDBACK RECIPIENT EMAIL COUNT'
            )
        )

        return (
            migrated_classroom_results,
            migrated_count_results,
        ) | 'Combine classroom migration results' >> beam.Flatten()


class AuditClassroomFeedbackRecipientEmailJob(
    MigrateClassroomFeedbackRecipientEmailJob
):
    """Job that audits MigrateClassroomFeedbackRecipientEmailJob."""

    DATASTORE_UPDATES_ALLOWED = False
