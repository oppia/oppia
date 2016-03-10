# coding: utf-8
#
# Copyright 2014 The Oppia Authors. All Rights Reserved.
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

"""Tests for Email-related jobs."""
import datetime

from core.domain import email_jobs_one_off
from core.platform import models
from core.tests import test_utils
import feconf

(email_models,) = models.Registry.import_models([models.NAMES.email])

taskqueue_services = models.Registry.import_taskqueue_services()


class SentEmailUpdateHashOneOffJobTests(test_utils.GenericTestBase):
    """Tests for the one-off update hash job."""

    def _run_one_off_job(self):
        """Runs the one-off MapReduce job."""
        job_id = email_jobs_one_off.SentEmailUpdateHashOneOffJob.create_new()
        email_jobs_one_off.SentEmailUpdateHashOneOffJob.enqueue(job_id)
        self.assertEqual(
            self.count_jobs_in_taskqueue(
                queue_name=taskqueue_services.QUEUE_NAME_DEFAULT),
            1)
        self.process_and_flush_pending_tasks()

    def test_hashes_get_generated(self):
        email_models.SentEmailModel.create(
            'recipient_id1', 'recipient@email.com', 'sender_id',
            'sender@email.com', feconf.EMAIL_INTENT_SIGNUP,
            'Email Subject', 'Email Body', datetime.datetime.utcnow(), None)

        # Check that the content of this email was recorded in
        # SentEmailModel.
        all_models = email_models.SentEmailModel.get_all().fetch()
        self.assertEqual(len(all_models), 1)

        email_models.SentEmailModel.create(
            'recipient_id2', 'recipient@email.com', 'sender_id',
            'sender@email.com', feconf.EMAIL_INTENT_SIGNUP,
            'Email Subject', 'Email Body', datetime.datetime.utcnow(), None)

        # Check that the content of this email was recorded in
        # SentEmailModel.
        all_models = email_models.SentEmailModel.get_all().fetch()
        self.assertEqual(len(all_models), 2)

        email_models.SentEmailModel.create(
            'recipient_id2', 'recipient@email.com', 'sender_id',
            'sender@email.com', feconf.EMAIL_INTENT_SIGNUP,
            'Email Subject', 'Email Body', datetime.datetime.utcnow(),
            'Email Hash.')

        # Check that the content of this email was recorded in
        # SentEmailModel.
        all_models = email_models.SentEmailModel.get_all().fetch()
        self.assertEqual(len(all_models), 3)

        self._run_one_off_job()

        all_models = email_models.SentEmailModel.get_all().fetch()

        for model in all_models:
            self.assertIsNotNone(model.email_hash)
