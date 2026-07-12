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
        return (
            getattr(classroom_model, 'feedback_recipient_email', None) is None
        )

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
                # We are using the lesson creation leads email for now.
                # After the successfull run of this job this will be changed to
                # the respective classroom creation email.
                feconf.DEFAULT_CLASSROOM_FEEDBACK_RECIPIENT_EMAIL
            )
            classroom_model.update_timestamps()

        return classroom_model

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of classroom migration results.

        Returns:
            PCollection. The migration or audit results.
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

        outputs = []
        if self.DATASTORE_UPDATES_ALLOWED:
            migrated_classrooms = (
                classrooms_needing_feedback_email
                | 'Backfill feedback recipient email'
                >> beam.Map(self._backfill_feedback_recipient_email)
            )

            put_results = (
                migrated_classrooms
                | 'Put updated ClassroomModels into datastore'
                >> ndb_io.PutModels()
            )

            migrated_classroom_logs = (
                migrated_classrooms
                | 'Log migrated classrooms'
                >> beam.Map(
                    lambda model: job_run_result.JobRunResult.as_stdout(
                        'Migrated ClassroomModel: id=%s' % model.id
                    )
                )
            )

            migrated_classroom_count = (
                migrated_classrooms
                | 'Count migrated classrooms'
                >> beam.combiners.Count.Globally().with_defaults(0)
                | 'Report migrated classroom count'
                >> beam.Map(
                    lambda count: job_run_result.JobRunResult.as_stdout(
                        'migrated_classroom_feedback_recipient_email_count: %s'
                        % count
                    )
                )
            )

            outputs.extend(
                [
                    migrated_classroom_logs,
                    migrated_classroom_count,
                    put_results,
                ]
            )
        else:
            audit_classroom_logs = (
                classrooms_needing_feedback_email
                | 'Log classrooms missing feedback recipient email'
                >> beam.Map(
                    lambda model: job_run_result.JobRunResult.as_stdout(
                        'ClassroomModel missing feedback_recipient_email: '
                        'id=%s' % model.id
                    )
                )
            )

            audit_classroom_count = (
                classrooms_needing_feedback_email
                | 'Count classrooms missing feedback recipient email'
                >> beam.combiners.Count.Globally().with_defaults(0)
                | 'Report classrooms missing feedback recipient email count'
                >> beam.Map(
                    lambda count: job_run_result.JobRunResult.as_stdout(
                        'classrooms_missing_feedback_recipient_email_count: %s'
                        % count
                    )
                )
            )

            outputs.extend(
                [
                    audit_classroom_logs,
                    audit_classroom_count,
                ]
            )

        return outputs | 'Flatten classroom migration results' >> beam.Flatten()


class AuditClassroomFeedbackRecipientEmailJob(
    MigrateClassroomFeedbackRecipientEmailJob
):
    """Job that audits MigrateClassroomFeedbackRecipientEmailJob."""

    DATASTORE_UPDATES_ALLOWED = False
