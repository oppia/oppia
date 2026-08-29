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

"""Unit tests for jobs.batch_jobs.web_feedback_cleanup_jobs."""

from __future__ import annotations

import datetime

from core import feconf
from core.domain import fs_services
from core.jobs import job_test_utils
from core.jobs.batch_jobs import web_feedback_cleanup_jobs
from core.jobs.types import job_run_result
from core.platform import models

from typing import Final, List, Type, cast

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import general_feedback_models

(general_feedback_models,) = models.Registry.import_models(
    [models.Names.GENERAL_FEEDBACK]
)

LESSON_METADATA_JSON = {
    'exploration_id': 'exp_id',
    'exploration_version': 1,
    'state_name': 'Introduction',
    'state_index': 0,
    'learner_current_answer': 'answer',
}


class LessonFeedbackCleanupJobTestBase(job_test_utils.JobTestBase):
    """Base class for LessonFeedbackCleanupJob tests."""

    USER_ID: Final = 'user_id'

    def create_lesson_feedback_model(
        self,
        feedback_id: str,
        feedback_text: str,
        status: str,
        created_on: datetime.datetime,
    ) -> general_feedback_models.LessonFeedbackModel:
        """Creates a LessonFeedbackModel for testing."""
        return self.create_model(
            general_feedback_models.LessonFeedbackModel,
            id=feedback_id,
            author_id=self.USER_ID,
            feedback_text=feedback_text,
            status=status,
            lesson_metadata_schema_version=(
                feconf.CURRENT_LESSON_METADATA_SCHEMA_VERSION
            ),
            lesson_metadata=LESSON_METADATA_JSON,
            parent_feedback_id=None,
            response_list_schema_version=(
                feconf.CURRENT_RESPONSE_LIST_SCHEMA_VERSION
            ),
            response_list=[],
            unread_response_count=0,
            created_on=created_on,
            last_updated=created_on,
        )


class LessonFeedbackCleanupJobTests(LessonFeedbackCleanupJobTestBase):
    """Tests for LessonFeedbackCleanupJob."""

    JOB_CLASS: Type[web_feedback_cleanup_jobs.LessonFeedbackCleanupJob] = (
        web_feedback_cleanup_jobs.LessonFeedbackCleanupJob
    )

    def test_job_clears_only_expired_feedback_text(self) -> None:
        old_closed_feedback_model = self.create_lesson_feedback_model(
            'old_closed_feedback_id',
            'old closed feedback',
            feconf.STATUS_CHOICES_FIXED,
            datetime.datetime.utcnow() - datetime.timedelta(days=181),
        )
        fresh_closed_feedback_model = self.create_lesson_feedback_model(
            'fresh_closed_feedback_id',
            'fresh closed feedback',
            feconf.STATUS_CHOICES_FIXED,
            datetime.datetime.utcnow() - datetime.timedelta(days=179),
        )
        old_open_feedback_model = self.create_lesson_feedback_model(
            'old_open_feedback_id',
            'old open feedback',
            feconf.STATUS_CHOICES_OPEN,
            datetime.datetime.utcnow() - datetime.timedelta(days=366),
        )
        already_cleared_feedback_model = self.create_lesson_feedback_model(
            'already_cleared_feedback_id',
            web_feedback_cleanup_jobs.CLEARED_FEEDBACK_TEXT,
            feconf.STATUS_CHOICES_FIXED,
            datetime.datetime.utcnow() - datetime.timedelta(days=179),
        )
        self.put_multi(
            [
                old_closed_feedback_model,
                fresh_closed_feedback_model,
                old_open_feedback_model,
                already_cleared_feedback_model,
            ]
        )

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout='Number of LessonFeedbackModels updated: 2.'
                ),
                job_run_result.JobRunResult(
                    stdout=(
                        'Updated feedback_text of LessonFeedbackModel with '
                        'ID: old_closed_feedback_id.'
                    )
                ),
                job_run_result.JobRunResult(
                    stdout=(
                        'Updated feedback_text of LessonFeedbackModel with '
                        'ID: old_open_feedback_id.'
                    )
                ),
            ]
        )

        self.assertEqual(
            general_feedback_models.LessonFeedbackModel.get(
                'old_closed_feedback_id'
            ).feedback_text,
            web_feedback_cleanup_jobs.CLEARED_FEEDBACK_TEXT,
        )
        self.assertEqual(
            general_feedback_models.LessonFeedbackModel.get(
                'old_open_feedback_id'
            ).feedback_text,
            web_feedback_cleanup_jobs.CLEARED_FEEDBACK_TEXT,
        )
        self.assertEqual(
            general_feedback_models.LessonFeedbackModel.get(
                'fresh_closed_feedback_id'
            ).feedback_text,
            'fresh closed feedback',
        )


class LessonFeedbackCleanupAuditJobTests(LessonFeedbackCleanupJobTestBase):
    """Tests for LessonFeedbackCleanupAuditJob."""

    JOB_CLASS: Type[web_feedback_cleanup_jobs.LessonFeedbackCleanupAuditJob] = (
        web_feedback_cleanup_jobs.LessonFeedbackCleanupAuditJob
    )

    def test_job_only_audits_expired_lesson_feedback(self) -> None:
        old_closed_feedback_model = self.create_lesson_feedback_model(
            'old_closed_feedback_id',
            'old closed feedback',
            feconf.STATUS_CHOICES_FIXED,
            datetime.datetime.utcnow() - datetime.timedelta(days=181),
        )
        self.put_multi([old_closed_feedback_model])

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout=(
                        'Number of LessonFeedbackModels that would be '
                        'updated: 1.'
                    )
                ),
                job_run_result.JobRunResult(
                    stdout=(
                        'Would update feedback_text of LessonFeedbackModel '
                        'with ID: old_closed_feedback_id.'
                    )
                ),
            ]
        )

        self.assertEqual(
            general_feedback_models.LessonFeedbackModel.get(
                'old_closed_feedback_id'
            ).feedback_text,
            'old closed feedback',
        )


class PlatformFeedbackCleanupJobTestBase(job_test_utils.JobTestBase):
    """Base class for PlatformFeedbackCleanupJob tests."""

    deleted_filepaths: List[str] = []

    class FakeGcsFileSystem:
        """Fake GCS file system that records deleted filepaths."""

        def __init__(
            self,
            entity_type: str,
            entity_id: str,
            oppia_project_id: str | None = None,
        ) -> None:
            self.entity_type = entity_type
            self.entity_id = entity_id
            self.oppia_project_id = oppia_project_id

        def delete(self, filepath: str) -> None:
            """Records the filepath that would be deleted."""
            PlatformFeedbackCleanupJobTestBase.deleted_filepaths.append(
                '%s:%s:%s' % (self.entity_type, self.entity_id, filepath)
            )

    def create_platform_feedback_model(
        self,
        feedback_id: str,
        created_on: datetime.datetime,
        screenshot_filename: str | None = None,
        screenshot_entity_id: str | None = None,
    ) -> general_feedback_models.PlatformFeedbackModel:
        """Creates a PlatformFeedbackModel for testing."""
        return self.create_model(
            general_feedback_models.PlatformFeedbackModel,
            id=feedback_id,
            author_id=None,
            feedback_text='Platform feedback',
            status=feconf.STATUS_CHOICES_OPEN,
            lesson_metadata_schema_version=None,
            lesson_metadata=None,
            source=feconf.SOURCE_APP,
            platform=feconf.PLATFORM_WEB,
            destination_dashboard=(feconf.DESTINATION_TECHNICAL_EXTERNAL_TEAM),
            category=None,
            include_technical_logs=True,
            screenshot_filename=screenshot_filename,
            screenshot_entity_id=screenshot_entity_id,
            page_url='https://www.oppia.org/about',
            created_on=created_on,
            last_updated=created_on,
        )

    def create_feedback_session_log_model(
        self,
        feedback_id: str,
        created_on: datetime.datetime,
    ) -> general_feedback_models.FeedbackSessionLogModel:
        """Creates a FeedbackSessionLogModel for testing."""
        return self.create_model(
            general_feedback_models.FeedbackSessionLogModel,
            id=feedback_id,
            session_info_schema_version=(
                feconf.CURRENT_SESSION_INFO_SCHEMA_VERSION
            ),
            console_logs=[],
            failed_requests=[],
            navigation_history=[],
            environment={},
            created_on=created_on,
            last_updated=created_on,
        )

    def setUp(self) -> None:
        super().setUp()
        PlatformFeedbackCleanupJobTestBase.deleted_filepaths = []


class PrepareWebFeedbackRetentionTestJobTests(
    PlatformFeedbackCleanupJobTestBase,
    LessonFeedbackCleanupJobTestBase,
):
    """Tests for PrepareWebFeedbackRetentionTestJob."""

    JOB_CLASS: Type[
        web_feedback_cleanup_jobs.PrepareWebFeedbackRetentionTestJob
    ] = web_feedback_cleanup_jobs.PrepareWebFeedbackRetentionTestJob

    def test_job_makes_web_feedback_models_expired(self) -> None:
        current_time = datetime.datetime.utcnow()
        open_lesson_feedback_model = self.create_lesson_feedback_model(
            'open_lesson_feedback_id',
            'open lesson feedback',
            feconf.STATUS_CHOICES_OPEN,
            current_time,
        )
        closed_lesson_feedback_model = self.create_lesson_feedback_model(
            'closed_lesson_feedback_id',
            'closed lesson feedback',
            feconf.STATUS_CHOICES_FIXED,
            current_time,
        )
        platform_feedback_model = self.create_platform_feedback_model(
            'platform_feedback_id',
            current_time,
        )
        self.put_multi(
            [
                open_lesson_feedback_model,
                closed_lesson_feedback_model,
                platform_feedback_model,
            ]
        )

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout='Updated 2 LessonFeedbackModels.'
                ),
                job_run_result.JobRunResult(
                    stdout='Updated 1 PlatformFeedbackModels.'
                ),
            ]
        )

        fetched_open_lesson_feedback_model = (
            general_feedback_models.LessonFeedbackModel.get(
                'open_lesson_feedback_id'
            )
        )
        fetched_closed_lesson_feedback_model = (
            general_feedback_models.LessonFeedbackModel.get(
                'closed_lesson_feedback_id'
            )
        )
        fetched_platform_feedback_model = (
            general_feedback_models.PlatformFeedbackModel.get(
                'platform_feedback_id'
            )
        )

        self.assertLessEqual(
            fetched_open_lesson_feedback_model.created_on,
            current_time - datetime.timedelta(days=365),
        )
        self.assertLessEqual(
            fetched_closed_lesson_feedback_model.created_on,
            current_time - datetime.timedelta(days=180),
        )
        self.assertLessEqual(
            fetched_platform_feedback_model.created_on,
            current_time - datetime.timedelta(days=90),
        )


class PlatformFeedbackCleanupJobTests(PlatformFeedbackCleanupJobTestBase):
    """Tests for PlatformFeedbackCleanupJob."""

    JOB_CLASS: Type[web_feedback_cleanup_jobs.PlatformFeedbackCleanupJob] = (
        web_feedback_cleanup_jobs.PlatformFeedbackCleanupJob
    )

    def test_job_deletes_expired_feedback_and_associated_resources(
        self,
    ) -> None:
        old_created_on = datetime.datetime.utcnow() - datetime.timedelta(
            days=91
        )
        fresh_created_on = datetime.datetime.utcnow() - datetime.timedelta(
            days=89
        )
        expired_feedback_model = self.create_platform_feedback_model(
            'expired_feedback_id',
            old_created_on,
            screenshot_filename='screenshot.png',
            screenshot_entity_id='screenshot_entity_id',
        )
        expired_session_log_model = self.create_feedback_session_log_model(
            'expired_feedback_id', old_created_on
        )
        fresh_feedback_model = self.create_platform_feedback_model(
            'fresh_feedback_id', fresh_created_on
        )
        fresh_session_log_model = self.create_feedback_session_log_model(
            'fresh_feedback_id', fresh_created_on
        )
        self.put_multi(
            [
                expired_feedback_model,
                expired_session_log_model,
                fresh_feedback_model,
                fresh_session_log_model,
            ]
        )

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout='Number of PlatformFeedbackModels deleted: 1.'
                ),
                job_run_result.JobRunResult(
                    stdout=(
                        'Deleted PlatformFeedbackModel with ID: '
                        'expired_feedback_id.'
                    )
                ),
            ]
        )

        self.assertIsNone(
            general_feedback_models.PlatformFeedbackModel.get(
                'expired_feedback_id', strict=False
            )
        )
        self.assertIsNone(
            general_feedback_models.FeedbackSessionLogModel.get(
                'expired_feedback_id', strict=False
            )
        )
        self.assertIsNotNone(
            general_feedback_models.PlatformFeedbackModel.get(
                'fresh_feedback_id', strict=False
            )
        )
        self.assertIsNotNone(
            general_feedback_models.FeedbackSessionLogModel.get(
                'fresh_feedback_id', strict=False
            )
        )

    def test_cleanup_deletes_feedback_when_session_log_is_missing(self) -> None:
        old_created_on = datetime.datetime.utcnow() - datetime.timedelta(
            days=91
        )
        expired_feedback_model = self.create_platform_feedback_model(
            'expired_feedback_id',
            old_created_on,
        )
        self.put_multi([expired_feedback_model])

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout='Number of PlatformFeedbackModels deleted: 1.'
                ),
                job_run_result.JobRunResult(
                    stdout=(
                        'Deleted PlatformFeedbackModel with ID: '
                        'expired_feedback_id.'
                    )
                ),
            ]
        )

        self.assertIsNone(
            general_feedback_models.PlatformFeedbackModel.get(
                'expired_feedback_id', strict=False
            )
        )

    def test_screenshot_deletion_does_nothing_when_screenshot_is_missing(
        self,
    ) -> None:
        no_screenshot_model = self.create_platform_feedback_model(
            'no_screenshot_feedback_id',
            datetime.datetime.utcnow(),
        )
        # Here we use cast because self.job is typed as JobBase in JobTestBase,
        # but this test always runs PlatformFeedbackCleanupJob, which defines
        # delete_platform_feedback_screenshot().
        job = cast(
            web_feedback_cleanup_jobs.PlatformFeedbackCleanupJob,
            self.job,
        )
        job.delete_platform_feedback_screenshot(no_screenshot_model)

        self.assertEqual(
            PlatformFeedbackCleanupJobTestBase.deleted_filepaths, []
        )

    def test_screenshot_deletion_uses_expected_gcs_filepath(self) -> None:
        platform_feedback_model = self.create_platform_feedback_model(
            'feedback_id',
            datetime.datetime.utcnow(),
            screenshot_filename='screenshot.png',
            screenshot_entity_id='screenshot_entity_id',
        )

        with self.swap(
            fs_services,
            'GcsFileSystem',
            self.FakeGcsFileSystem,
        ):
            # Here we use cast because self.job is typed as JobBase in JobTestBase,
            # but this test always runs PlatformFeedbackCleanupJob, which defines
            # delete_platform_feedback_screenshot().
            job = cast(
                web_feedback_cleanup_jobs.PlatformFeedbackCleanupJob,
                self.job,
            )
            job.delete_platform_feedback_screenshot(platform_feedback_model)

        self.assertEqual(
            PlatformFeedbackCleanupJobTestBase.deleted_filepaths,
            ['feedback:screenshot_entity_id:image/screenshot.png'],
        )


class PlatformFeedbackCleanupAuditJobTests(PlatformFeedbackCleanupJobTestBase):
    """Tests for PlatformFeedbackCleanupAuditJob."""

    JOB_CLASS: Type[
        web_feedback_cleanup_jobs.PlatformFeedbackCleanupAuditJob
    ] = web_feedback_cleanup_jobs.PlatformFeedbackCleanupAuditJob

    def test_job_audits_expired_feedback_and_associated_resources(
        self,
    ) -> None:
        old_created_on = datetime.datetime.utcnow() - datetime.timedelta(
            days=91
        )
        expired_feedback_model = self.create_platform_feedback_model(
            'expired_feedback_id',
            old_created_on,
            screenshot_filename='screenshot.png',
            screenshot_entity_id='screenshot_entity_id',
        )
        expired_session_log_model = self.create_feedback_session_log_model(
            'expired_feedback_id', old_created_on
        )
        self.put_multi([expired_feedback_model, expired_session_log_model])

        with self.swap(
            fs_services,
            'GcsFileSystem',
            self.FakeGcsFileSystem,
        ):
            self.assert_job_output_is(
                [
                    job_run_result.JobRunResult(
                        stdout=(
                            'Number of PlatformFeedbackModels that would be '
                            'deleted: 1.'
                        )
                    ),
                    job_run_result.JobRunResult(
                        stdout=(
                            'Would delete PlatformFeedbackModel with ID: '
                            'expired_feedback_id.'
                        )
                    ),
                ]
            )

        self.assertIsNotNone(
            general_feedback_models.PlatformFeedbackModel.get(
                'expired_feedback_id', strict=False
            )
        )
        self.assertIsNotNone(
            general_feedback_models.FeedbackSessionLogModel.get(
                'expired_feedback_id', strict=False
            )
        )
        self.assertEqual(
            PlatformFeedbackCleanupJobTestBase.deleted_filepaths, []
        )
