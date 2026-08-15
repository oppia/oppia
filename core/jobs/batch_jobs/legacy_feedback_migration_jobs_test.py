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

"""Unit tests for jobs.batch_jobs.legacy_feedback_migration_jobs."""

from __future__ import annotations

import datetime

from core import feconf, utils
from core.jobs import job_test_utils
from core.jobs.batch_jobs import legacy_feedback_migration_jobs
from core.jobs.types import job_run_result
from core.platform import models
from core.tests import test_utils

from typing import Final, Type

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import feedback_models, general_feedback_models

(feedback_models, general_feedback_models) = models.Registry.import_models(
    [models.Names.FEEDBACK, models.Names.GENERAL_FEEDBACK]
)


class LegacyFeedbackMigrationJobTestBase(
    job_test_utils.JobTestBase, test_utils.GenericTestBase
):
    """Base class for legacy feedback migration job tests."""

    EXP_ID: Final = 'exp_id'
    AUTHOR_ID: Final = 'author_id'
    THREAD_ID: Final = 'exploration.exp_id.thread_id'
    CREATED_ON: Final = datetime.datetime(2026, 1, 1)

    def create_legacy_feedback_thread(
        self,
        thread_id: str,
        entity_type: str = feconf.ENTITY_TYPE_EXPLORATION,
        subject: str = 'Feedback when the user was at card "State 2"',
    ) -> feedback_models.GeneralFeedbackThreadModel:
        """Creates a legacy feedback thread model for testing."""
        return self.create_model(
            feedback_models.GeneralFeedbackThreadModel,
            id=thread_id,
            entity_type=entity_type,
            entity_id=self.EXP_ID,
            original_author_id=self.AUTHOR_ID,
            status=feedback_models.STATUS_CHOICES_OPEN,
            subject=subject,
            has_suggestion=False,
            message_count=1,
            created_on=self.CREATED_ON,
            last_updated=self.CREATED_ON,
            deleted=False,
        )

    def create_legacy_feedback_message(
        self,
        thread_id: str,
        message_id: int,
        text: str,
        author_id: str = AUTHOR_ID,
    ) -> feedback_models.GeneralFeedbackMessageModel:
        """Creates a legacy feedback message model for testing."""
        return self.create_model(
            feedback_models.GeneralFeedbackMessageModel,
            id='%s.%s' % (thread_id, message_id),
            thread_id=thread_id,
            message_id=message_id,
            author_id=author_id,
            updated_status=feedback_models.STATUS_CHOICES_OPEN,
            updated_subject='subject',
            text=text,
            received_via_email=False,
            created_on=self.CREATED_ON,
            last_updated=self.CREATED_ON,
            deleted=False,
        )

    def create_existing_migrated_feedback(
        self, feedback_id: str
    ) -> general_feedback_models.LessonFeedbackModel:
        """Creates an existing target LessonFeedbackModel for testing."""
        return self.create_model(
            general_feedback_models.LessonFeedbackModel,
            id=feedback_id,
            author_id=self.AUTHOR_ID,
            feedback_text='Existing migrated feedback.',
            status=feconf.STATUS_CHOICES_OPEN,
            exploration_id=self.EXP_ID,
            lesson_metadata_schema_version=(
                feconf.CURRENT_LESSON_METADATA_SCHEMA_VERSION
            ),
            lesson_metadata={
                'exploration_id': self.EXP_ID,
                'exploration_version': 0,
                'state_name': 'State 2',
                'state_index': 1,
                'learner_current_answer': None,
            },
            parent_feedback_id=None,
            response_list_schema_version=(
                feconf.CURRENT_RESPONSE_LIST_SCHEMA_VERSION
            ),
            response_list=[],
            unread_response_count=0,
            deleted=False,
        )

    def get_expected_migrated_feedback_id(self, thread_id: str) -> str:
        """Returns the deterministic migrated feedback ID for a thread ID."""
        return '%s.%s' % (
            general_feedback_models.LessonFeedbackModel.ID_PREFIX,
            utils.convert_to_hash(thread_id, 32),
        )


class MigrateLegacyFeedbackJobTests(LegacyFeedbackMigrationJobTestBase):
    """Tests for MigrateLegacyFeedbackJob."""

    JOB_CLASS: Type[legacy_feedback_migration_jobs.MigrateLegacyFeedbackJob] = (
        legacy_feedback_migration_jobs.MigrateLegacyFeedbackJob
    )

    def test_job_migrates_thread_with_deterministic_id(
        self,
    ) -> None:
        thread = self.create_legacy_feedback_thread(self.THREAD_ID)
        message = self.create_legacy_feedback_message(
            self.THREAD_ID, 0, 'Original learner feedback.'
        )
        self.put_multi([thread, message])

        feedback_id = self.get_expected_migrated_feedback_id(self.THREAD_ID)

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    (
                        'Migrated legacy feedback thread into lesson feedback: '
                        f'feedback_id={feedback_id}'
                    )
                ),
                job_run_result.JobRunResult.as_stdout(
                    'migrated_legacy_feedback_thread_count: 1'
                ),
            ]
        )

        migrated_feedback = (
            general_feedback_models.LessonFeedbackModel.get_by_id(feedback_id)
        )
        self.assertIsNotNone(migrated_feedback)
        assert migrated_feedback is not None
        self.assertEqual(migrated_feedback.feedback_text, message.text)
        self.assertEqual(
            migrated_feedback.lesson_metadata,
            {
                'exploration_id': self.EXP_ID,
                'exploration_version': 0,
                'state_name': 'State 2',
                'state_index': 0,
                'learner_current_answer': None,
            },
        )

    def test_job_skips_thread_when_deterministic_target_id_exists(self) -> None:
        thread = self.create_legacy_feedback_thread(self.THREAD_ID)
        message = self.create_legacy_feedback_message(
            self.THREAD_ID, 0, 'Original learner feedback.'
        )
        feedback_id = self.get_expected_migrated_feedback_id(self.THREAD_ID)
        existing_feedback = self.create_existing_migrated_feedback(feedback_id)
        self.put_multi([thread, message, existing_feedback])

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    (
                        'Skipped legacy feedback thread: '
                        f'legacy_thread_id={self.THREAD_ID}, '
                        'reason=Already migrated'
                    )
                ),
            ]
        )

    def test_job_skips_non_exploration_thread(self) -> None:
        thread = self.create_legacy_feedback_thread(
            self.THREAD_ID,
            entity_type=feconf.ENTITY_TYPE_FEEDBACK,
        )
        message = self.create_legacy_feedback_message(
            self.THREAD_ID, 0, 'Original learner feedback.'
        )
        self.put_multi([thread, message])

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    (
                        'Skipped legacy feedback thread: '
                        f'legacy_thread_id={self.THREAD_ID}, '
                        'reason=Not an exploration thread'
                    )
                ),
            ]
        )

    def test_job_migrates_ignored_status_as_not_actionable(self) -> None:
        thread = self.create_legacy_feedback_thread(self.THREAD_ID)
        thread.status = feedback_models.STATUS_CHOICES_IGNORED

        message = self.create_legacy_feedback_message(
            self.THREAD_ID, 0, 'Original learner feedback.'
        )
        self.put_multi([thread, message])

        feedback_id = self.get_expected_migrated_feedback_id(self.THREAD_ID)

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    (
                        'Migrated legacy feedback thread into lesson feedback: '
                        f'feedback_id={feedback_id}'
                    )
                ),
                job_run_result.JobRunResult.as_stdout(
                    'migrated_legacy_feedback_thread_count: 1'
                ),
            ]
        )

        migrated_feedback = (
            general_feedback_models.LessonFeedbackModel.get_by_id(feedback_id)
        )
        self.assertIsNotNone(migrated_feedback)
        assert migrated_feedback is not None

        self.assertEqual(
            migrated_feedback.status,
            feconf.STATUS_CHOICES_NOT_ACTIONABLE,
        )

    def test_job_migrates_creator_responses(self) -> None:
        thread = self.create_legacy_feedback_thread(self.THREAD_ID)

        learner_message = self.create_legacy_feedback_message(
            self.THREAD_ID,
            0,
            'Original learner feedback.',
            author_id=self.AUTHOR_ID,
        )
        creator_message = self.create_legacy_feedback_message(
            self.THREAD_ID,
            1,
            'Thanks for reporting this!',
            author_id='creator_id',
        )

        self.put_multi([thread, learner_message, creator_message])

        feedback_id = self.get_expected_migrated_feedback_id(self.THREAD_ID)

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    (
                        'Migrated legacy feedback thread into lesson feedback: '
                        f'feedback_id={feedback_id}'
                    )
                ),
                job_run_result.JobRunResult.as_stdout(
                    'migrated_legacy_feedback_thread_count: 1'
                ),
            ]
        )

        migrated_feedback = (
            general_feedback_models.LessonFeedbackModel.get_by_id(feedback_id)
        )
        self.assertIsNotNone(migrated_feedback)
        assert migrated_feedback is not None

        self.assertEqual(
            migrated_feedback.feedback_text,
            'Original learner feedback.',
        )
        self.assertEqual(
            migrated_feedback.response_list,
            [
                {
                    'response_text': 'Thanks for reporting this!',
                    'responded_by': 'creator_id',
                    'responded_on': utils.get_time_in_millisecs(
                        self.CREATED_ON
                    ),
                }
            ],
        )

    def test_job_skips_empty_creator_response(self) -> None:
        thread = self.create_legacy_feedback_thread(self.THREAD_ID)

        learner_message = self.create_legacy_feedback_message(
            self.THREAD_ID,
            0,
            'Original learner feedback.',
        )
        empty_creator_message = self.create_legacy_feedback_message(
            self.THREAD_ID,
            1,
            '',
            author_id='creator_id',
        )

        self.put_multi([thread, learner_message, empty_creator_message])

        feedback_id = self.get_expected_migrated_feedback_id(self.THREAD_ID)

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    (
                        'Migrated legacy feedback thread into lesson feedback: '
                        f'feedback_id={feedback_id}'
                    )
                ),
                job_run_result.JobRunResult.as_stdout(
                    'migrated_legacy_feedback_thread_count: 1'
                ),
            ]
        )

        migrated_feedback = (
            general_feedback_models.LessonFeedbackModel.get_by_id(feedback_id)
        )
        self.assertIsNotNone(migrated_feedback)
        assert migrated_feedback is not None

        self.assertEqual(migrated_feedback.response_list, [])

    def test_job_uses_empty_state_name_for_invalid_subject_format(
        self,
    ) -> None:
        thread = self.create_legacy_feedback_thread(
            self.THREAD_ID,
            subject='Some other feedback subject',
        )
        message = self.create_legacy_feedback_message(
            self.THREAD_ID,
            0,
            'Original learner feedback.',
        )
        self.put_multi([thread, message])

        feedback_id = self.get_expected_migrated_feedback_id(self.THREAD_ID)

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    (
                        'Migrated legacy feedback thread into lesson feedback: '
                        f'feedback_id={feedback_id}'
                    )
                ),
                job_run_result.JobRunResult.as_stdout(
                    'migrated_legacy_feedback_thread_count: 1'
                ),
            ]
        )

        migrated_feedback = (
            general_feedback_models.LessonFeedbackModel.get_by_id(feedback_id)
        )
        self.assertIsNotNone(migrated_feedback)
        assert migrated_feedback is not None

        self.assertEqual(
            migrated_feedback.lesson_metadata['state_name'],
            '',
        )


class AuditLegacyFeedbackJobTests(LegacyFeedbackMigrationJobTestBase):
    """Tests for AuditLegacyFeedbackJob."""

    JOB_CLASS: Type[legacy_feedback_migration_jobs.AuditLegacyFeedbackJob] = (
        legacy_feedback_migration_jobs.AuditLegacyFeedbackJob
    )

    def test_audit_reports_would_migrate_without_writing_model(self) -> None:
        thread = self.create_legacy_feedback_thread(self.THREAD_ID)
        message = self.create_legacy_feedback_message(
            self.THREAD_ID, 0, 'Original learner feedback.'
        )
        self.put_multi([thread, message])

        feedback_id = self.get_expected_migrated_feedback_id(self.THREAD_ID)

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    (
                        'Would migrate legacy feedback thread into lesson '
                        f'feedback: feedback_id={feedback_id}'
                    )
                ),
                job_run_result.JobRunResult.as_stdout(
                    'migrated_legacy_feedback_thread_count: 1'
                ),
            ]
        )

        self.assertIsNone(
            general_feedback_models.LessonFeedbackModel.get_by_id(feedback_id)
        )
