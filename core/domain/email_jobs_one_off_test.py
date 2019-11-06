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
from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import ast

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


class GeneralFeedbackEmailReplyToIdOneOffJobTests(test_utils.GenericTestBase):
    """Tests for GeneralFeedbackEmailReplyToId migrations."""

    ONE_OFF_JOB_MANAGERS_FOR_TESTS = [
        email_jobs_one_off.GeneralFeedbackEmailReplyToIdOneOffJob]

    def _run_one_off_job(self):
        """Runs the one-off MapReduce job."""
        job_id = (
            email_jobs_one_off.GeneralFeedbackEmailReplyToIdOneOffJob
            .create_new())
        email_jobs_one_off.GeneralFeedbackEmailReplyToIdOneOffJob.enqueue(
            job_id)
        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_tasks()
        stringified_output = (
            email_jobs_one_off.GeneralFeedbackEmailReplyToIdOneOffJob
            .get_output(job_id))

        eval_output = [ast.literal_eval(stringified_item)
                       for stringified_item in stringified_output]
        output = [(eval_item[0], int(eval_item[1]))
                  for eval_item in eval_output]
        return output

    def _check_model_validity(
            self, user_id, thread_id, original_feedback_email_model):
        """Checks if the model was migrated correctly."""
        migrated_feedback_email_model = (
            email_models.GeneralFeedbackEmailReplyToIdModel
            .get(user_id, thread_id))
        self.assertEqual(migrated_feedback_email_model.user_id, user_id)
        self.assertEqual(migrated_feedback_email_model.thread_id, thread_id)
        # Check that the other values didn't change.
        self.assertEqual(
            migrated_feedback_email_model.created_on,
            original_feedback_email_model.created_on
        )
        self.assertEqual(
            migrated_feedback_email_model.last_updated,
            original_feedback_email_model.last_updated
        )

    def test_successful_migration(self):
        user_id = 'user'
        thread_id = 'exploration.exp_id.thread_id'
        instance_id = '%s.%s' % (user_id, thread_id)
        feedback_email_model = email_models.GeneralFeedbackEmailReplyToIdModel(
            id=instance_id, user_id=None, thread_id=None, reply_to_id='id')
        feedback_email_model.put()

        output = self._run_one_off_job()

        self.assertEqual(output, [(u'SUCCESS', 1)])

        self._check_model_validity(user_id, thread_id, feedback_email_model)

    def test_successful_migration_unchanged_model(self):
        user_id = 'user_id'
        thread_id = 'exploration.exp_id.thread_id'
        instance_id = '%s.%s' % (user_id, thread_id)
        feedback_email_model = email_models.GeneralFeedbackEmailReplyToIdModel(
            id=instance_id,
            user_id=user_id,
            thread_id=thread_id,
            reply_to_id='id')
        feedback_email_model.put()

        output = self._run_one_off_job()

        self.assertEqual(output, [(u'SUCCESS', 1)])

        self._check_model_validity(
            user_id,
            thread_id,
            feedback_email_model)

    def test_multiple_feedbacks(self):
        user_id1 = 'user1'
        thread_id1 = 'exploration.exp_id.thread_id'
        instance_id1 = '%s.%s' % (user_id1, thread_id1)
        feedback_email_model1 = email_models.GeneralFeedbackEmailReplyToIdModel(
            id=instance_id1, user_id=None, thread_id=None, reply_to_id='id')
        feedback_email_model1.put()

        user_id2 = 'user2'
        thread_id2 = 'exploration.exp_id.thread_id'
        instance_id2 = '%s.%s' % (user_id2, thread_id2)
        feedback_email_model2 = email_models.GeneralFeedbackEmailReplyToIdModel(
            id=instance_id2,
            user_id='user2',
            thread_id='exploration.exp_id.thread_id',
            reply_to_id='id')
        feedback_email_model2.put()

        output = self._run_one_off_job()

        self.assertEqual(output, [(u'SUCCESS', 2)])

        self._check_model_validity(user_id1, thread_id1, feedback_email_model1)
        self._check_model_validity(user_id2, thread_id2, feedback_email_model2)


class EmailModelsIndexesOneOffJobTests(test_utils.GenericTestBase):
    """Tests for EmailModelsIndexesOneOffJob migrations."""

    ONE_OFF_JOB_MANAGERS_FOR_TESTS = [
        email_jobs_one_off.EmailModelsIndexesOneOffJob]

    def _run_one_off_job(self):
        """Runs the one-off MapReduce job."""
        job_id = email_jobs_one_off.EmailModelsIndexesOneOffJob.create_new()
        email_jobs_one_off.EmailModelsIndexesOneOffJob.enqueue(job_id)
        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_tasks()
        stringified_output = (
            email_jobs_one_off.EmailModelsIndexesOneOffJob.get_output(job_id))

        eval_output = [ast.literal_eval(stringified_item)
                       for stringified_item in stringified_output]
        output = [(eval_item[0], int(eval_item[1]))
                  for eval_item in eval_output]
        return output

    def _check_send_email_model_validity(self, original_model, migrated_model):
        """Checks if the SentEmailModel was migrated correctly."""
        self.assertEqual(
            migrated_model.recipient_id,
            original_model.recipient_id)
        self.assertEqual(
            migrated_model.recipient_email,
            original_model.recipient_email)
        self.assertEqual(
            migrated_model.sender_id,
            original_model.sender_id)
        self.assertEqual(
            migrated_model.sender_email,
            original_model.sender_email)
        self.assertEqual(
            migrated_model.intent,
            original_model.intent)
        self.assertEqual(
            migrated_model.subject,
            original_model.subject)
        self.assertEqual(
            migrated_model.html_body,
            original_model.html_body)
        self.assertEqual(
            migrated_model.sent_datetime,
            original_model.sent_datetime)
        self.assertEqual(
            migrated_model.last_updated,
            original_model.last_updated)

    def _check_bulk_email_model_validity(self, original_model, migrated_model):
        """Checks if the BulkEmailModel was migrated correctly."""
        self.assertEqual(
            migrated_model.recipient_ids,
            original_model.recipient_ids)
        self.assertEqual(
            migrated_model.sender_id,
            original_model.sender_id)
        self.assertEqual(
            migrated_model.sender_email,
            original_model.sender_email)
        self.assertEqual(
            migrated_model.intent,
            original_model.intent)
        self.assertEqual(
            migrated_model.subject,
            original_model.subject)
        self.assertEqual(
            migrated_model.html_body,
            original_model.html_body)
        self.assertEqual(
            migrated_model.sent_datetime,
            original_model.sent_datetime)
        self.assertEqual(
            migrated_model.last_updated,
            original_model.last_updated)

    def test_send_email_model_successful_migration(self):
        instance_id = 'id_1'
        send_email_model = email_models.SentEmailModel(
            id=instance_id,
            recipient_id='recipient_1',
            recipient_email='recipient@email.com',
            sender_id='sender_id',
            sender_email='sender@email.com',
            intent=feconf.EMAIL_INTENT_MARKETING,
            subject='subject',
            html_body='message',
            sent_datetime=datetime.datetime.utcnow())
        send_email_model.put()

        output = self._run_one_off_job()
        self.assertEqual(output, [(u'SUCCESS', 1)])

        self._check_send_email_model_validity(
            send_email_model,
            email_models.SentEmailModel.get_by_id(instance_id))

    def test_bulk_email_model_successful_migration(self):
        instance_id = 'id_1'
        bulk_email_model = email_models.BulkEmailModel(
            id=instance_id,
            recipient_ids=['recipient_1_id', 'recipient_2_id'],
            sender_id='sender_id',
            sender_email='sender@email.com',
            intent=feconf.BULK_EMAIL_INTENT_MARKETING,
            subject='subject',
            html_body='message',
            sent_datetime=datetime.datetime.utcnow())
        bulk_email_model.put()

        output = self._run_one_off_job()
        self.assertEqual(output, [(u'SUCCESS', 1)])

        self._check_bulk_email_model_validity(
            bulk_email_model,
            email_models.BulkEmailModel.get_by_id(instance_id))

    def test_multiple_models(self):
        instance_1_id = 'id_1'
        send_email_model = email_models.SentEmailModel(
            id=instance_1_id,
            recipient_id='recipient_1',
            recipient_email='recipient@email.com',
            sender_id='sender_id',
            sender_email='sender@email.com',
            intent=feconf.EMAIL_INTENT_MARKETING,
            subject='subject',
            html_body='message',
            sent_datetime=datetime.datetime.utcnow())
        send_email_model.put()

        instance_2_id = 'id_2'
        bulk_email_model_1 = email_models.BulkEmailModel(
            id=instance_2_id,
            recipient_ids=['recipient_1_id', 'recipient_2_id'],
            sender_id='sender_id',
            sender_email='sender@email.com',
            intent=feconf.BULK_EMAIL_INTENT_MARKETING,
            subject='subject',
            html_body='message',
            sent_datetime=datetime.datetime.utcnow())
        bulk_email_model_1.put()

        instance_3_id = 'id_3'
        bulk_email_model_2 = email_models.BulkEmailModel(
            id=instance_3_id,
            recipient_ids=['recipient_3_id', 'recipient_4_id'],
            sender_id='sender_id',
            sender_email='sender@email.com',
            intent=feconf.BULK_EMAIL_INTENT_MARKETING,
            subject='subject2',
            html_body='message2',
            sent_datetime=datetime.datetime.utcnow())
        bulk_email_model_2.put()

        output = self._run_one_off_job()
        self.assertEqual(output, [(u'SUCCESS', 3)])

        self._check_send_email_model_validity(
            send_email_model,
            email_models.SentEmailModel.get_by_id(instance_1_id))
        self._check_bulk_email_model_validity(
            bulk_email_model_1,
            email_models.BulkEmailModel.get_by_id(instance_2_id))
        self._check_bulk_email_model_validity(
            bulk_email_model_2,
            email_models.BulkEmailModel.get_by_id(instance_3_id))
