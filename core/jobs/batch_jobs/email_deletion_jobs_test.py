# coding: utf-8
#
# Copyright 2021 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for jobs.blog_validation_jobs."""

from __future__ import annotations

import datetime

from core import feconf
from core.jobs import job_test_utils
from core.jobs.batch_jobs import email_deletion_jobs
from core.jobs.types import job_run_result
from core.platform import models

from typing import Final, Type

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import email_models
    from mypy_imports import feedback_models
    from mypy_imports import user_models

(email_models, feedback_models, user_models) = models.Registry.import_models([
    models.Names.EMAIL, models.Names.FEEDBACK, models.Names.USER
])


class DeleteUnneededEmailRelatedModelsJobTests(job_test_utils.JobTestBase):

    JOB_CLASS: Type[
        email_deletion_jobs.DeleteUnneededEmailRelatedModelsJob
    ] = email_deletion_jobs.DeleteUnneededEmailRelatedModelsJob

    USER_ID: Final = 'user_id'
    DATETIME: Final = datetime.datetime.strptime('2016-02-16', '%Y-%m-%d')

    def setUp(self) -> None:
        super().setUp()

        deleted_user_model = self.create_model(
            user_models.DeletedUserModel, id=self.USER_ID
        )
        deleted_user_model.update_timestamps()
        deleted_user_model.put()

        self.sent_email_model_with_sender = self.create_model(
            email_models.SentEmailModel,
            id='sent_email_id1',
            sender_id=self.USER_ID,
            sender_email='sender@email.com',
            recipient_id='recipient_id',
            recipient_email='recipient@email.com',
            intent=feconf.EMAIL_INTENT_SIGNUP,
            subject='subject',
            html_body='html_body',
            sent_datetime=self.DATETIME
        )
        self.sent_email_model_with_recipient = self.create_model(
            email_models.SentEmailModel,
            id='sent_email_id2',
            sender_id='sender_id',
            sender_email='sender@email.com',
            recipient_id=self.USER_ID,
            recipient_email='recipient@email.com',
            intent=feconf.EMAIL_INTENT_SIGNUP,
            subject='subject',
            html_body='html_body',
            sent_datetime=self.DATETIME
        )
        self.bulk_email_model = self.create_model(
            email_models.BulkEmailModel,
            id='bulk_email_id',
            sender_id=self.USER_ID,
            sender_email='sender@email.com',
            intent=feconf.BULK_EMAIL_INTENT_MARKETING,
            subject='subject',
            html_body='html_body',
            sent_datetime=self.DATETIME
        )
        self.unsent_feedback_email_model = self.create_model(
            feedback_models.UnsentFeedbackEmailModel, id=self.USER_ID
        )
        self.user_bulk_emails_model = self.create_model(
            user_models.UserBulkEmailsModel, id=self.USER_ID
        )

    def test_job_deletes_sent_email_model_with_user_as_sender(self) -> None:
        self.sent_email_model_with_sender.update_timestamps()
        self.sent_email_model_with_sender.put()

        self.assert_job_output_is([
            job_run_result.JobRunResult(stdout='SENT EMAILS SUCCESS: 1')
        ])

        self.assertIsNone(
            email_models.SentEmailModel.get('sent_email_id', strict=False))

    def test_job_deletes_sent_email_model_with_user_as_recipient(self) -> None:
        self.sent_email_model_with_recipient.update_timestamps()
        self.sent_email_model_with_recipient.put()

        self.assert_job_output_is([
            job_run_result.JobRunResult(stdout='SENT EMAILS SUCCESS: 1')
        ])

        self.assertIsNone(
            email_models.SentEmailModel.get('sent_email_id', strict=False))

    def test_job_deletes_bulk_email_model_with_user_as_sender(self) -> None:
        self.bulk_email_model.update_timestamps()
        self.bulk_email_model.put()

        self.assert_job_output_is([
            job_run_result.JobRunResult(stdout='BULK EMAILS SUCCESS: 1')
        ])

        self.assertIsNone(
            email_models.BulkEmailModel.get('bulk_email_id', strict=False))

    def test_job_deletes_unsent_feedback_email_model(self) -> None:
        self.unsent_feedback_email_model.update_timestamps()
        self.unsent_feedback_email_model.put()

        self.assert_job_output_is([
            job_run_result.JobRunResult(stdout='FEEDBACK EMAILS SUCCESS: 1')
        ])

        self.assertIsNone(
            feedback_models.UnsentFeedbackEmailModel.get(
                self.USER_ID, strict=False))

    def test_job_deletes_bulk_email_model(self) -> None:
        self.user_bulk_emails_model.update_timestamps()
        self.user_bulk_emails_model.put()

        self.assert_job_output_is([
            job_run_result.JobRunResult(stdout='USER BULK EMAILS SUCCESS: 1')
        ])

        self.assertIsNone(
            user_models.UserBulkEmailsModel.get(self.USER_ID, strict=False))

    def test_job_deletes_multiple_models(self) -> None:
        self.sent_email_model_with_sender.update_timestamps()
        self.sent_email_model_with_recipient.update_timestamps()
        self.bulk_email_model.update_timestamps()
        self.unsent_feedback_email_model.update_timestamps()
        self.user_bulk_emails_model.update_timestamps()
        self.put_multi([
            self.sent_email_model_with_sender,
            self.sent_email_model_with_recipient,
            self.bulk_email_model,
            self.unsent_feedback_email_model,
            self.user_bulk_emails_model
        ])

        self.assert_job_output_is([
            job_run_result.JobRunResult(stdout='SENT EMAILS SUCCESS: 2'),
            job_run_result.JobRunResult(stdout='BULK EMAILS SUCCESS: 1'),
            job_run_result.JobRunResult(stdout='FEEDBACK EMAILS SUCCESS: 1'),
            job_run_result.JobRunResult(stdout='USER BULK EMAILS SUCCESS: 1'),
        ])

        self.assertIsNone(
            user_models.UserBulkEmailsModel.get(self.USER_ID, strict=False))
