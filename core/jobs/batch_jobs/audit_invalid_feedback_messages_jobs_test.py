# coding: utf-8
#
# Copyright 2025 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for jobs.batch_jobs.audit_invalid_feedback_messages_jobs."""

from __future__ import annotations

from core.jobs import job_test_utils
from core.jobs.batch_jobs import audit_invalid_feedback_messages_jobs
from core.jobs.types import job_run_result
from core.platform import models

from typing import Final, Type

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import feedback_models

(feedback_models,) = models.Registry.import_models([models.Names.FEEDBACK])

datastore_services = models.Registry.import_datastore_services()


class AuditInvalidFeedbackMessagesJobTest(job_test_utils.JobTestBase):
    """Tests for AuditInvalidFeedbackMessagesJob."""

    JOB_CLASS: Type[
        audit_invalid_feedback_messages_jobs.AuditInvalidFeedbackMessagesJob
    ] = audit_invalid_feedback_messages_jobs.AuditInvalidFeedbackMessagesJob

    def test_empty_datastore(self) -> None:
        """Tests that the job runs successfully on an empty datastore"""
        self.assert_job_output_is_empty()

    def test_general_feedback_message_models_with_no_invalid_messages(
        self,
    ) -> None:
        """Tests that the job reports no issues when all feedback message models
        are valid.
        """
        general_feedback_message_1 = self.create_model(
            feedback_models.GeneralFeedbackMessageModel,
            author_id='user1',
            created_on=self.NOW,
            deleted=False,
            last_updated=self.YEAR_AGO,
            message_id=0,
            received_via_email=False,
            text='message 1',
            thread_id='thread1',
            updated_status='open',
            updated_subject='Subject_1',
        )
        self.put_multi([general_feedback_message_1])
        self.assert_job_output_is_empty()

    def test_general_feedback_message_models_with_none_author_id(self) -> None:
        """Tests that the job flags messages with author_id=None."""
        general_feedback_message_1 = self.create_model(
            feedback_models.GeneralFeedbackMessageModel,
            author_id=None,
            created_on=self.NOW,
            deleted=False,
            last_updated=self.YEAR_AGO,
            message_id=1,
            received_via_email=False,
            text='message',
            thread_id='thread2',
            updated_status='open',
            updated_subject='Subject',
        )
        self.put_multi([general_feedback_message_1])

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout=(
                        f'Invalid FeedbackMessageModel id={general_feedback_message_1.id}, '
                        f'thread_id={general_feedback_message_1.thread_id}, message_id={general_feedback_message_1.message_id}'
                    )
                )
            ]
        )

    def test_general_feedback_message_models_with_one_invalid_message(
        self,
    ) -> None:
        """Tests that the Job correctly identifies a single invalid message."""
        general_feedback_message_1 = self.create_model(
            feedback_models.GeneralFeedbackMessageModel,
            author_id='',
            created_on=self.NOW,
            deleted=False,
            last_updated=self.YEAR_AGO,
            message_id=0,
            received_via_email=False,
            text='message 1',
            thread_id='thread1',
            updated_status='open',
            updated_subject='Subject_1',
        )
        self.put_multi([general_feedback_message_1])

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout=(
                        f'Invalid FeedbackMessageModel id={general_feedback_message_1.id}, '
                        f'thread_id={general_feedback_message_1.thread_id}, message_id={general_feedback_message_1.message_id}'
                    )
                )
            ]
        )

    def test_mixed_valid_and_invalid_messages(self) -> None:
        """Tests that only invalid messages are reported."""
        valid_message = self.create_model(
            feedback_models.GeneralFeedbackMessageModel,
            author_id='user123',
            created_on=self.NOW,
            deleted=False,
            last_updated=self.YEAR_AGO,
            message_id=0,
            received_via_email=False,
            text='valid',
            thread_id='thread-valid',
            updated_status='open',
            updated_subject='Subject',
        )

        invalid_message = self.create_model(
            feedback_models.GeneralFeedbackMessageModel,
            author_id='',
            created_on=self.NOW,
            deleted=False,
            last_updated=self.YEAR_AGO,
            message_id=1,
            received_via_email=False,
            text='invalid',
            thread_id='thread-invalid',
            updated_status='open',
            updated_subject='Subject',
        )

        self.put_multi([valid_message, invalid_message])

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout=(
                        f'Invalid FeedbackMessageModel id={invalid_message.id}, '
                        f'thread_id={invalid_message.thread_id}, '
                        f'message_id={invalid_message.message_id}'
                    )
                )
            ]
        )
