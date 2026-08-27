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

"""Unit tests for jobs.batch_jobs.audit_invalid_feedback_messages_jobs."""

from __future__ import annotations

from core.jobs import job_test_utils
from core.jobs.batch_jobs import audit_non_existent_threads_messages_jobs
from core.jobs.types import job_run_result
from core.platform import models

from typing import Type

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import feedback_models

(feedback_models,) = models.Registry.import_models([models.Names.FEEDBACK])

datastore_services = models.Registry.import_datastore_services()


class AuditNonExistentThreadsMessagesJobTest(job_test_utils.JobTestBase):
    """Tests for AuditNonExistentThreadsMessagesJob."""

    JOB_CLASS: Type[
        audit_non_existent_threads_messages_jobs.AuditNonExistentThreadsMessagesJob
    ] = (
        audit_non_existent_threads_messages_jobs.AuditNonExistentThreadsMessagesJob
    )

    def test_empty_datastore(self) -> None:
        self.assert_job_output_is([])

    def test_message_with_existing_thread(self) -> None:
        thread = self.create_model(
            feedback_models.GeneralFeedbackThreadModel,
            id='exploration.exp1.thread1',
            entity_type='exploration',
            entity_id='exp1',
            status='open',
            subject='subject',
            message_count=1,
            has_suggestion=False,
            deleted=False,
        )

        message = self.create_model(
            feedback_models.GeneralFeedbackMessageModel,
            id='exploration.exp1.thread1.0',
            thread_id='exploration.exp1.thread1',
            message_id=0,
            author_id='user1',
            text='valid',
            received_via_email=False,
            deleted=False,
        )

        self.put_multi([thread, message])

        self.assert_job_output_is([])

    def test_message_with_non_existent_thread(self) -> None:
        message = self.create_model(
            feedback_models.GeneralFeedbackMessageModel,
            id='exploration.exp1.missing.0',
            thread_id='exploration.exp1.missing',
            message_id=0,
            author_id='user1',
            text='invalid',
            received_via_email=False,
            deleted=False,
        )

        self.put_multi([message])

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    (
                        'GeneralFeedbackMessageModel with non-existent thread: '
                        f'id={message.id}, '
                        f'thread_id={message.thread_id}, '
                        f'message_id={message.message_id}'
                    )
                ),
                job_run_result.JobRunResult.as_stdout(
                    'invalid_feedback_message_models_count: 1'
                ),
            ]
        )

    def test_mixed_valid_and_invalid_messages(self) -> None:
        thread = self.create_model(
            feedback_models.GeneralFeedbackThreadModel,
            id='exploration.exp1.valid',
            entity_type='exploration',
            entity_id='exp1',
            status='open',
            subject='subject',
            message_count=1,
            has_suggestion=False,
            deleted=False,
        )

        valid_message = self.create_model(
            feedback_models.GeneralFeedbackMessageModel,
            id='exploration.exp1.valid.0',
            thread_id='exploration.exp1.valid',
            message_id=0,
            author_id='user1',
            text='valid',
            received_via_email=False,
            deleted=False,
        )

        invalid_message = self.create_model(
            feedback_models.GeneralFeedbackMessageModel,
            id='exploration.exp1.invalid.0',
            thread_id='exploration.exp1.invalid',
            message_id=0,
            author_id='user1',
            text='invalid',
            received_via_email=False,
            deleted=False,
        )

        self.put_multi([thread, valid_message, invalid_message])

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    (
                        'GeneralFeedbackMessageModel with non-existent thread: '
                        f'id={invalid_message.id}, '
                        f'thread_id={invalid_message.thread_id}, '
                        f'message_id={invalid_message.message_id}'
                    )
                ),
                job_run_result.JobRunResult.as_stdout(
                    'invalid_feedback_message_models_count: 1'
                ),
            ]
        )


class RemoveNonExistentThreadsMessagesJobTest(job_test_utils.JobTestBase):
    """Tests for RemoveNonExistentThreadsMessagesJob."""

    JOB_CLASS: Type[
        audit_non_existent_threads_messages_jobs.RemoveNonExistentThreadsMessagesJob
    ] = (
        audit_non_existent_threads_messages_jobs.RemoveNonExistentThreadsMessagesJob
    )

    def test_cleanup_removes_invalid_messages_and_user_models(self) -> None:
        thread = self.create_model(
            feedback_models.GeneralFeedbackThreadModel,
            id='exploration.exp1.valid',
            entity_type='exploration',
            entity_id='exp1',
            status='open',
            subject='subject',
            message_count=1,
            has_suggestion=False,
            deleted=False,
        )

        valid_message = self.create_model(
            feedback_models.GeneralFeedbackMessageModel,
            id='exploration.exp1.valid.0',
            thread_id='exploration.exp1.valid',
            message_id=0,
            author_id='user1',
            text='valid',
            received_via_email=False,
            deleted=False,
        )

        invalid_message = self.create_model(
            feedback_models.GeneralFeedbackMessageModel,
            id='exploration.exp1.invalid.0',
            thread_id='exploration.exp1.invalid',
            message_id=0,
            author_id='user1',
            text='invalid',
            received_via_email=False,
            deleted=False,
        )

        invalid_thread_user = self.create_model(
            feedback_models.GeneralFeedbackThreadUserModel,
            id='user1.exploration.exp1.invalid',
            user_id='user1',
            thread_id='exploration.exp1.invalid',
            message_ids_read_by_user=[0],
            deleted=False,
        )

        valid_thread_user = self.create_model(
            feedback_models.GeneralFeedbackThreadUserModel,
            id='user1.exploration.exp1.valid',
            user_id='user1',
            thread_id='exploration.exp1.valid',
            message_ids_read_by_user=[0],
            deleted=False,
        )

        self.put_multi(
            [
                thread,
                valid_message,
                invalid_message,
                invalid_thread_user,
                valid_thread_user,
            ]
        )

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    (
                        'Deleted GeneralFeedbackMessageModel: '
                        f'id={invalid_message.id}, '
                        f'thread_id={invalid_message.thread_id}, '
                        f'message_id={invalid_message.message_id}'
                    )
                ),
                job_run_result.JobRunResult.as_stdout(
                    (
                        'Deleted GeneralFeedbackThreadUserModel: '
                        f'id={invalid_thread_user.id}, '
                        f'thread_id={invalid_thread_user.thread_id}, '
                        f'user_id={invalid_thread_user.user_id} '
                    )
                ),
                job_run_result.JobRunResult.as_stdout(
                    'deleted_feedback_message_models_count: 1'
                ),
                job_run_result.JobRunResult.as_stdout(
                    'deleted_user_thread_models_count: 1'
                ),
            ]
        )

        self.assertIsNotNone(
            feedback_models.GeneralFeedbackMessageModel.get(
                valid_message.thread_id, valid_message.message_id
            )
        )

        with self.assertRaisesRegex(
            Exception, 'Entity for class GeneralFeedbackMessageModel'
        ):
            feedback_models.GeneralFeedbackMessageModel.get(
                invalid_message.thread_id, invalid_message.message_id
            )

        self.assertIsNone(
            feedback_models.GeneralFeedbackThreadUserModel.get(
                invalid_thread_user.user_id, invalid_thread_user.thread_id
            )
        )

        self.assertIsNotNone(
            feedback_models.GeneralFeedbackThreadUserModel.get(
                user_id=valid_thread_user.user_id,
                thread_id=valid_thread_user.thread_id,
            )
        )
