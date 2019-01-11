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
import types

from core.domain import email_jobs_one_off
from core.platform import models
from core.tests import test_utils
import feconf

(email_models,) = models.Registry.import_models([models.NAMES.email])

taskqueue_services = models.Registry.import_taskqueue_services()


class EmailHashRegenerationOneOffJobTests(test_utils.GenericTestBase):
    """Tests for the one-off update hash job."""

    def _run_one_off_job(self):
        """Runs the one-off MapReduce job."""
        job_id = email_jobs_one_off.EmailHashRegenerationOneOffJob.create_new()
        email_jobs_one_off.EmailHashRegenerationOneOffJob.enqueue(job_id)
        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_tasks()

    def test_hashes_get_generated(self):
        # pylint: disable=unused-argument
        def _generate_hash_for_tests(
                cls, recipient_id, email_subject, email_body):
            """Generates hash for tests.

            Args:
                recipient_id: str. ID of the recipient.
                email_subject: str. Subject of the email.
                email_body: str. Body of the email.

            Returns:
                str. Empty if recipient_id is 'recipient_id2', None if
                    'recipient_id1' and 'Email Hash' otherwise.
            """

            if recipient_id == 'recipient_id1':
                return None
            elif recipient_id == 'recipient_id2':
                return ''
            return 'Email Hash'

        generate_constant_hash_ctx = self.swap(
            email_models.SentEmailModel, '_generate_hash',
            types.MethodType(
                _generate_hash_for_tests,
                email_models.SentEmailModel))

        with generate_constant_hash_ctx:
            email_models.SentEmailModel.create(
                'recipient_id1', 'recipient@email.com', 'sender_id',
                'sender@email.com', feconf.EMAIL_INTENT_SIGNUP,
                'Email Subject', 'Email Body', datetime.datetime.utcnow())

            email_models.SentEmailModel.create(
                'recipient_id2', 'recipient@email.com', 'sender_id',
                'sender@email.com', feconf.EMAIL_INTENT_SIGNUP,
                'Email Subject', 'Email Body', datetime.datetime.utcnow())

            email_models.SentEmailModel.create(
                'recipient_id3', 'recipient@email.com', 'sender_id',
                'sender@email.com', feconf.EMAIL_INTENT_SIGNUP,
                'Email Subject', 'Email Body', datetime.datetime.utcnow())

        # Check that all the emails were recorded in SentEmailModel.
        all_models = email_models.SentEmailModel.get_all().fetch()
        self.assertEqual(len(all_models), 3)

        for model in all_models:
            if model.recipient_id == 'recipient_id1':
                self.assertIsNone(model.email_hash)
            elif model.recipient_id == 'recipient_id2':
                self.assertEqual(len(model.email_hash), 0)

        self._run_one_off_job()

        # Check that all the emails that were recorded in SentEmailModel
        # still present.
        all_models = email_models.SentEmailModel.get_all().fetch()
        self.assertEqual(len(all_models), 3)

        all_models = email_models.SentEmailModel.get_all().fetch()

        for model in all_models:
            self.assertIsNotNone(model.email_hash)
