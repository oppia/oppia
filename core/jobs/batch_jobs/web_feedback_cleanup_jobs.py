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

"""Beam jobs for enforcing web feedback data retention policies.

LessonFeedbackCleanupJob enforces the retention policy for LessonFeedbackModel
entries by clearing expired feedback text while preserving the feedback record
and creator responses.

PlatformFeedbackCleanupJob permanently deletes expired platform feedback reports
together with their associated FeedbackSessionLogModel entries and any uploaded
screenshots.

These jobs run as Beam pipelines because they may process a large number
of datastore entities. All datastore access is performed through Beam's
NDB I/O transforms, making the jobs scalable and safe to execute over
large datasets.
"""

from __future__ import annotations

import datetime
import logging

from core import feconf
from core.domain import fs_services
from core.jobs import base_jobs, job_options
from core.jobs.io import ndb_io
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam
from typing import Optional

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import datastore_services, general_feedback_models

(general_feedback_models,) = models.Registry.import_models(
    [models.Names.GENERAL_FEEDBACK]
)
datastore_services = models.Registry.import_datastore_services()

CLOSED_LESSON_FEEDBACK_RETENTION_DAYS = 180
OPEN_LESSON_FEEDBACK_RETENTION_DAYS = 365

PLATFORM_FEEDBACK_RETENTION_DAYS = 90

CLEARED_FEEDBACK_TEXT = '[Text cleared after 6 months for privacy protection]'


class PrepareWebFeedbackRetentionTestJob(base_jobs.JobBase):
    """Temporary job for release testing only.

    Updates the created_on timestamps of web feedback models so they
    satisfy the retention policy and can be cleaned up by the retention jobs.
    """

    DATASTORE_UPDATES_ALLOWED = True

    def make_lesson_feedback_expired(
        self,
        model: general_feedback_models.LessonFeedbackModel,
    ) -> general_feedback_models.LessonFeedbackModel:
        """Makes lesson feedback eligible for cleanup."""

        with datastore_services.get_ndb_context():
            if model.status == feconf.STATUS_CHOICES_OPEN:
                model.created_on = (
                    datetime.datetime.utcnow() - datetime.timedelta(days=366)
                )
            else:
                model.created_on = (
                    datetime.datetime.utcnow() - datetime.timedelta(days=181)
                )

        return model

    def make_platform_feedback_expired(
        self,
        model: general_feedback_models.PlatformFeedbackModel,
    ) -> general_feedback_models.PlatformFeedbackModel:
        """Makes platform feedback eligible for cleanup."""

        with datastore_services.get_ndb_context():
            model.created_on = datetime.datetime.utcnow() - datetime.timedelta(
                days=91
            )

        return model

    def create_lesson_count_job_run_result(
        self, count: int
    ) -> job_run_result.JobRunResult:
        """Creates a JobRunResult for updated LessonFeedbackModel count."""
        return job_run_result.JobRunResult.as_stdout(
            'Updated %d LessonFeedbackModels.' % count
        )

    def create_platform_count_job_run_result(
        self, count: int
    ) -> job_run_result.JobRunResult:
        """Creates a JobRunResult for updated PlatformFeedbackModel count."""
        return job_run_result.JobRunResult.as_stdout(
            'Updated %d PlatformFeedbackModels.' % count
        )

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Runs the PrepareWebFeedbackRetentionTestJob."""
        lesson_models = (
            self.pipeline
            | 'Get LessonFeedbackModels'
            >> ndb_io.GetModels(
                general_feedback_models.LessonFeedbackModel.get_all()
            )
            | 'Expire LessonFeedbackModels'
            >> beam.Map(self.make_lesson_feedback_expired)
        )

        platform_models = (
            self.pipeline
            | 'Get PlatformFeedbackModels'
            >> ndb_io.GetModels(
                general_feedback_models.PlatformFeedbackModel.get_all()
            )
            | 'Expire PlatformFeedbackModels'
            >> beam.Map(self.make_platform_feedback_expired)
        )

        _ = lesson_models | 'Write LessonFeedbackModels' >> ndb_io.PutModels()

        _ = (
            platform_models
            | 'Write PlatformFeedbackModels' >> ndb_io.PutModels()
        )

        lesson_count_results = (
            lesson_models
            | 'Count updated LessonFeedbackModels'
            >> beam.combiners.Count.Globally()
            | 'Format updated LessonFeedbackModels count'
            >> beam.Map(self.create_lesson_count_job_run_result)
        )

        platform_count_results = (
            platform_models
            | 'Count updated PlatformFeedbackModels'
            >> beam.combiners.Count.Globally()
            | 'Format updated PlatformFeedbackModels count'
            >> beam.Map(self.create_platform_count_job_run_result)
        )

        return (
            lesson_count_results,
            platform_count_results,
        ) | 'Combine updated web feedback counts' >> beam.Flatten()


class LessonFeedbackCleanupJob(base_jobs.JobBase):
    """Clears expired feedback text from LessonFeedbackModel entries."""

    DATASTORE_UPDATES_ALLOWED = True

    def clear_expired_feedback_text(
        self,
        lesson_feedback_model: general_feedback_models.LessonFeedbackModel,
    ) -> general_feedback_models.LessonFeedbackModel:
        """Clears the feedback text of a LessonFeedbackModel.

        Args:
            lesson_feedback_model: LessonFeedbackModel. The model whose
                feedback text should be cleared.

        Returns:
            LessonFeedbackModel. The updated model.
        """
        with datastore_services.get_ndb_context():
            lesson_feedback_model.feedback_text = CLEARED_FEEDBACK_TEXT
        logging.info(
            'Cleared feedback text for LessonFeedbackModel with id %s.',
            lesson_feedback_model.id,
        )
        return lesson_feedback_model

    def is_lesson_feedback_expired(
        self, lesson_feedback_model: general_feedback_models.LessonFeedbackModel
    ) -> bool:
        """Returns whether the lesson feedback has exceeded its retention period."""

        retention_days = (
            OPEN_LESSON_FEEDBACK_RETENTION_DAYS
            if (lesson_feedback_model.status == feconf.STATUS_CHOICES_OPEN)
            else CLOSED_LESSON_FEEDBACK_RETENTION_DAYS
        )

        expired = datetime.datetime.now(datetime.timezone.utc).replace(
            tzinfo=None
        ) >= lesson_feedback_model.created_on + datetime.timedelta(
            days=retention_days
        )

        return bool(expired)

    def create_count_job_run_result(
        self,
        count: int,
    ) -> job_run_result.JobRunResult:
        """Creates a JobRunResult with the given count."""
        if self.DATASTORE_UPDATES_ALLOWED:
            return job_run_result.JobRunResult.as_stdout(
                'Number of LessonFeedbackModels updated: %d.' % count
            )
        return job_run_result.JobRunResult.as_stdout(
            'Number of LessonFeedbackModels that would be updated: %d.' % count
        )

    def create_model_job_run_result(
        self,
        lesson_feedback_model: general_feedback_models.LessonFeedbackModel,
    ) -> job_run_result.JobRunResult:
        """Creates a JobRunResult with the given model."""
        if self.DATASTORE_UPDATES_ALLOWED:
            return job_run_result.JobRunResult.as_stdout(
                'Updated feedback_text of LessonFeedbackModel with ID: %s.'
                % lesson_feedback_model.id
            )
        return job_run_result.JobRunResult.as_stdout(
            'Would update feedback_text of LessonFeedbackModel with ID: %s.'
            % lesson_feedback_model.id
        )

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Runs the LessonFeedbackCleanupJob.

        This job clears feedback text from expired LessonFeedbackModel
        entries and writes the updated models back to the datastore.

        Returns:
            JobRunResult. Contains the total number of LessonFeedbackModel
            entries updated, along with the IDs of those entries.
        """
        lesson_feedback_models = (
            self.pipeline
            | 'Get LessonFeedbackModels from the datastore'
            >> ndb_io.GetModels(
                general_feedback_models.LessonFeedbackModel.get_all()
            )
        )

        expired_lesson_feedback_models = (
            lesson_feedback_models
            | 'Filter expired LessonFeedbackModels'
            >> beam.Filter(self.is_lesson_feedback_expired)
        )

        expired_uncleared_lesson_feedback_models = (
            expired_lesson_feedback_models
            | 'Filter uncleared LessonFeedbackModels'
            >> beam.Filter(
                lambda model: model.feedback_text != CLEARED_FEEDBACK_TEXT
            )
        )

        updated_lesson_feedback_models = (
            expired_uncleared_lesson_feedback_models
            | 'Clear expired LessonFeedbackModel feedback text'
            >> beam.Map(self.clear_expired_feedback_text)
        )

        count_run_result = (
            updated_lesson_feedback_models
            | 'Count updated LessonFeedbackModels'
            >> beam.combiners.Count.Globally()
            | 'Format count to JobRunResult'
            >> beam.Map(self.create_count_job_run_result)
        )

        updated_model_ids_result = (
            updated_lesson_feedback_models
            | 'Adds updated LessonFeedbackModel IDs to job run result'
            >> beam.Map(self.create_model_job_run_result)
        )

        if self.DATASTORE_UPDATES_ALLOWED:
            _ = (
                updated_lesson_feedback_models
                | 'Write updated LessonFeedbackModels to datastore'
                >> ndb_io.PutModels()
            )

        return (
            count_run_result,
            updated_model_ids_result,
        ) | beam.Flatten()


class LessonFeedbackCleanupAuditJob(LessonFeedbackCleanupJob):
    """Audit job for LessonFeedbackCleanupJob."""

    DATASTORE_UPDATES_ALLOWED = False


class PlatformFeedbackCleanupJob(base_jobs.JobBase):
    """Deletes expired PlatformFeedbackModel entries and their associated
    FeedbackSessionLogModel entries and uploaded screenshots.
    """

    DATASTORE_UPDATES_ALLOWED = True

    def is_platform_feedback_expired(
        self,
        platform_feedback_model: general_feedback_models.PlatformFeedbackModel,
    ) -> bool:
        """Returns whether the platform feedback has exceeded its retention period."""

        expired = datetime.datetime.now(datetime.timezone.utc).replace(
            tzinfo=None
        ) >= platform_feedback_model.created_on + datetime.timedelta(
            days=PLATFORM_FEEDBACK_RETENTION_DAYS
        )

        return bool(expired)

    def delete_platform_feedback_screenshot(
        self,
        platform_feedback_model: general_feedback_models.PlatformFeedbackModel,
        oppia_project_id: Optional[str] = None,
    ) -> None:
        """Deletes the screenshot associated with a platform feedback report.

        Args:
            platform_feedback_model: PlatformFeedbackModel. The feedback model
                whose screenshot should be deleted.
            oppia_project_id: Optional[str]. The ID of the Oppia project.
        """
        screenshot_filename = platform_feedback_model.screenshot_filename
        screenshot_entity_id = platform_feedback_model.screenshot_entity_id

        if screenshot_filename is None or screenshot_entity_id is None:
            return

        fs = fs_services.GcsFileSystem(
            feconf.ENTITY_TYPE_FEEDBACK,
            screenshot_entity_id,
            oppia_project_id=oppia_project_id,
        )

        try:
            fs.delete('image/%s' % screenshot_filename)
        except IOError:
            logging.exception(
                'Screenshot not found for PlatformFeedbackModel %s.',
                platform_feedback_model.id,
            )

        logging.info(
            'Deleted screenshot for PlatformFeedbackModel with ID %s.',
            platform_feedback_model.id,
        )

    def delete_platform_feedback_session_log(
        self,
        platform_feedback_model: general_feedback_models.PlatformFeedbackModel,
    ) -> None:
        """Deletes the session log associated with a platform feedback report.

        Args:
            platform_feedback_model: PlatformFeedbackModel. The feedback model
                whose session log should be deleted.
        """
        with datastore_services.get_ndb_context():
            session_log_model = (
                general_feedback_models.FeedbackSessionLogModel.get(
                    platform_feedback_model.id, strict=False
                )
            )

            if session_log_model is None:
                return

            session_log_model.key.delete()

        logging.info(
            'Deleted FeedbackSessionLogModel with ID %s.',
            session_log_model.id,
        )

    def delete_platform_feedback_model(
        self,
        platform_feedback_model: general_feedback_models.PlatformFeedbackModel,
    ) -> None:
        """Deletes a PlatformFeedbackModel.

        Args:
            platform_feedback_model: PlatformFeedbackModel. The model to
                delete.
        """
        with datastore_services.get_ndb_context():
            platform_feedback_model.key.delete()

        logging.info(
            'Deleted PlatformFeedbackModel with ID %s.',
            platform_feedback_model.id,
        )

    def cleanup_platform_feedback(
        self,
        platform_feedback_model: general_feedback_models.PlatformFeedbackModel,
        oppia_project_id: Optional[str] = None,
    ) -> general_feedback_models.PlatformFeedbackModel:
        """Deletes all resources associated with a platform feedback report.

        Args:
            platform_feedback_model: PlatformFeedbackModel. The feedback model
                to clean up.
            oppia_project_id: Optional[str]. The ID of the Oppia project.

        Returns:
            PlatformFeedbackModel. The deleted feedback model.
        """
        self.delete_platform_feedback_screenshot(
            platform_feedback_model, oppia_project_id
        )

        self.delete_platform_feedback_session_log(platform_feedback_model)

        self.delete_platform_feedback_model(platform_feedback_model)

        return platform_feedback_model

    def create_count_job_run_result(
        self,
        count: int,
    ) -> job_run_result.JobRunResult:
        """Creates a JobRunResult with the given count."""
        if self.DATASTORE_UPDATES_ALLOWED:
            return job_run_result.JobRunResult.as_stdout(
                'Number of PlatformFeedbackModels deleted: %d.' % count
            )
        return job_run_result.JobRunResult.as_stdout(
            'Number of PlatformFeedbackModels that would be deleted: %d.'
            % count
        )

    def create_model_job_run_result(
        self,
        platform_feedback_model: general_feedback_models.PlatformFeedbackModel,
    ) -> job_run_result.JobRunResult:
        """Creates a JobRunResult with the given model."""
        if self.DATASTORE_UPDATES_ALLOWED:
            return job_run_result.JobRunResult.as_stdout(
                'Deleted PlatformFeedbackModel with ID: %s.'
                % platform_feedback_model.id
            )

        return job_run_result.JobRunResult.as_stdout(
            'Would delete PlatformFeedbackModel with ID: %s.'
            % platform_feedback_model.id
        )

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Runs the PlatformFeedbackCleanupJob.

        This job permanently deletes expired PlatformFeedbackModel entries,
        along with their associated FeedbackSessionLogModel entries and
        uploaded screenshots.

        Returns:
            JobRunResult. A collection of job
            run results describing the cleanup performed.
        """
        custom_options = self.pipeline.options.view_as(job_options.JobOptions)
        oppia_project_id = custom_options.oppia_project_id
        platform_feedback_models = (
            self.pipeline
            | 'Get PlatformFeedbackModels from the datastore'
            >> ndb_io.GetModels(
                general_feedback_models.PlatformFeedbackModel.get_all()
            )
        )

        expired_platform_feedback_models = (
            platform_feedback_models
            | 'Filter expired PlatformFeedbackModels'
            >> beam.Filter(self.is_platform_feedback_expired)
        )

        if self.DATASTORE_UPDATES_ALLOWED:
            # GCS cleanup must run as a side effect. This follows the local
            # GCS DeleteFile transform pattern in core/jobs/io/gcs_io.py.
            processed_platform_feedback_models = (
                expired_platform_feedback_models
                | 'Delete expired PlatformFeedback resources'
                >> beam.Map(
                    lambda model: self.cleanup_platform_feedback(
                        model,
                        oppia_project_id,
                    )
                )
            )
        else:
            processed_platform_feedback_models = (
                expired_platform_feedback_models
                | 'Keep expired PlatformFeedback resources for audit'
                >> beam.Map(lambda model: model)
            )

        count_run_result = (
            processed_platform_feedback_models
            | 'Count deleted PlatformFeedbackModels'
            >> beam.combiners.Count.Globally()
            | 'Format count to JobRunResult'
            >> beam.Map(self.create_count_job_run_result)
        )

        deleted_model_ids_result = (
            processed_platform_feedback_models
            | 'Adds deleted PlatformFeedbackModel IDs to job run result'
            >> beam.Map(self.create_model_job_run_result)
        )

        return (
            count_run_result,
            deleted_model_ids_result,
        ) | beam.Flatten()


class PlatformFeedbackCleanupAuditJob(PlatformFeedbackCleanupJob):
    """Audit job for PlatformFeedbackCleanupJob."""

    DATASTORE_UPDATES_ALLOWED = False
