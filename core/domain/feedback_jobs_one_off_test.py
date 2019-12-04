# Copyright 2019 The Oppia Authors. All Rights Reserved.
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

"""Tests for Feedback-related jobs."""
from __future__ import absolute_import # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import ast

from core.domain import feedback_jobs_one_off
from core.domain import feedback_services
from core.platform import models
from core.tests import test_utils

(feedback_models,) = models.Registry.import_models([models.NAMES.feedback])
taskqueue_services = models.Registry.import_taskqueue_services()


class GeneralFeedbackThreadUserOneOffJobTest(test_utils.GenericTestBase):
    """Tests for GeneralFeedbackThreadUser migration."""

    ONE_OFF_JOB_MANAGERS_FOR_TESTS = [
        feedback_jobs_one_off.GeneralFeedbackThreadUserOneOffJob]

    def _run_one_off_job(self):
        """Runs the one-off MapReduce job."""
        job_id = (
            feedback_jobs_one_off.GeneralFeedbackThreadUserOneOffJob
            .create_new())
        feedback_jobs_one_off.GeneralFeedbackThreadUserOneOffJob.enqueue(job_id)
        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_tasks()
        stringified_output = (
            feedback_jobs_one_off.GeneralFeedbackThreadUserOneOffJob
            .get_output(job_id))

        eval_output = [ast.literal_eval(stringified_item)
                       for stringified_item in stringified_output]
        output = [(eval_item[0], int(eval_item[1]))
                  for eval_item in eval_output]
        return output

    def _check_model_validity(
            self, user_id, thread_id, original_user_feedback_model):
        """Checks if the model was migrated correctly."""
        migrated_user_feedback_model = (
            feedback_models.GeneralFeedbackThreadUserModel
            .get(user_id, thread_id))
        self.assertEqual(migrated_user_feedback_model.user_id, user_id)
        self.assertEqual(migrated_user_feedback_model.thread_id, thread_id)
        # Check that the other values didn't change.
        self.assertEqual(
            migrated_user_feedback_model.created_on,
            original_user_feedback_model.created_on
        )
        self.assertEqual(
            migrated_user_feedback_model.last_updated,
            original_user_feedback_model.last_updated
        )
        self.assertEqual(
            migrated_user_feedback_model.message_ids_read_by_user,
            original_user_feedback_model.message_ids_read_by_user,
        )

    def test_successful_migration(self):
        user_id = 'user'
        thread_id = 'exploration.exp_id.thread_id'
        instance_id = '%s.%s' % (user_id, thread_id)
        user_feedback_model = feedback_models.GeneralFeedbackThreadUserModel(
            id=instance_id, user_id=None, thread_id=None)
        user_feedback_model.put()

        output = self._run_one_off_job()

        self.assertEqual(output, [(u'SUCCESS', 1)])

        self._check_model_validity(user_id, thread_id, user_feedback_model)

    def test_successful_migration_unchanged_model(self):
        user_id = 'user_id'
        thread_id = 'exploration.exp_id.thread_id'
        instance_id = '%s.%s' % (user_id, thread_id)
        user_feedback_model = feedback_models.GeneralFeedbackThreadUserModel(
            id=instance_id, user_id=user_id, thread_id=thread_id)
        user_feedback_model.put()

        output = self._run_one_off_job()

        self.assertEqual(output, [(u'SUCCESS', 1)])

        self._check_model_validity(
            user_id,
            thread_id,
            user_feedback_model)

    def test_multiple_feedbacks(self):
        user_id1 = 'user1'
        thread_id1 = 'exploration.exp_id.thread_id'
        instance_id1 = '%s.%s' % (user_id1, thread_id1)
        user_feedback_model1 = feedback_models.GeneralFeedbackThreadUserModel(
            id=instance_id1, user_id=None, thread_id=None)
        user_feedback_model1.put()

        user_id2 = 'user2'
        thread_id2 = 'exploration.exp_id.thread_id'
        instance_id2 = '%s.%s' % (user_id2, thread_id2)
        user_feedback_model2 = feedback_models.GeneralFeedbackThreadUserModel(
            id=instance_id2,
            user_id='user2',
            thread_id='exploration.exp_id.thread_id')
        user_feedback_model2.put()

        output = self._run_one_off_job()

        self.assertEqual(output, [(u'SUCCESS', 2)])

        self._check_model_validity(user_id1, thread_id1, user_feedback_model1)
        self._check_model_validity(user_id2, thread_id2, user_feedback_model2)


class FeedbackThreadCacheOneOffJobTest(test_utils.GenericTestBase):
    """Tests for FeedbackThread cache population."""

    ONE_OFF_JOB_CLASS = feedback_jobs_one_off.FeedbackThreadCacheOneOffJob

    def setUp(self):
        super(FeedbackThreadCacheOneOffJobTest, self).setUp()
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)

    def _run_one_off_job(self):
        """Runs the one-off job under test."""
        job_id = self.ONE_OFF_JOB_CLASS.create_new()
        self.ONE_OFF_JOB_CLASS.enqueue(job_id)
        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_tasks()
        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 0)
        output_strs = self.ONE_OFF_JOB_CLASS.get_output(job_id)
        outputs = [ast.literal_eval(s) for s in output_strs]
        return [(key, int(value)) for key, value in outputs]

    def test_sample_usage(self):
        fresh_thread_ids = [
            feedback_services.create_thread(
                'exploration', 'exp_id', self.editor_id, 'subject', 'message'),
            feedback_services.create_thread(
                'exploration', 'exp_id', self.editor_id, 'subject', 'message'),
        ]
        stale_thread_ids = [
            feedback_services.create_thread(
                'exploration', 'exp_id', self.editor_id, 'subject', 'message'),
            feedback_services.create_thread(
                'exploration', 'exp_id', self.editor_id, 'subject', 'message'),
        ]
        for thread_id in stale_thread_ids:
            thread = (
                feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id))
            # Forcibly clear the cache, it should get populated by the job.
            thread.last_message_text = None
            thread.last_message_author = None
            thread.last_message_updated_status = (
                feedback_models.STATUS_CHOICES_OPEN)
            thread.put()

        # The two stale threads should be updated by the job.
        self.assertEqual(self._run_one_off_job(), [('Updated', 2)])

        for thread_id in stale_thread_ids:
            thread = (
                feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id))
            # The cache should now be fresh.
            self.assertEqual(thread.last_message_text, 'message')
            self.assertEqual(thread.last_message_author, self.EDITOR_USERNAME)
            self.assertIsNone(thread.last_message_updated_status)

        # Now that all caches are fresh, the job should not perform any updates.
        self.assertEqual(self._run_one_off_job(), [])

    def test_update_to_text_cache_for_stale_cache_with_1_message(self):
        thread_id = feedback_services.create_thread(
            'exploration', 'exp_id', self.editor_id, 'Feedback', 'first text')
        thread = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        thread.last_message_text = None
        thread.put()

        self.assertEqual(self._run_one_off_job(), [('Updated', 1)])

        thread = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        self.assertEqual(thread.last_message_text, 'first text')

    def test_update_to_text_cache_for_stale_cache_with_2_messages(self):
        thread_id = feedback_services.create_thread(
            'exploration', 'exp_id', self.editor_id, 'Feedback', 'first text')
        feedback_services.create_message(
            thread_id, self.editor_id, None, None, 'second text')
        thread = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        thread.last_message_text = None
        thread.put()

        self.assertEqual(self._run_one_off_job(), [('Updated', 1)])

        thread = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        self.assertEqual(thread.last_message_text, 'second text')

    def test_update_to_author_cache_for_stale_cache_with_1_message(self):
        thread_id = feedback_services.create_thread(
            'exploration', 'exp_id', self.editor_id, 'Feedback', 'first text')
        thread = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        thread.last_message_author = None
        thread.put()

        self.assertEqual(self._run_one_off_job(), [('Updated', 1)])

        thread = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        self.assertEqual(thread.last_message_author, self.EDITOR_USERNAME)

    def test_update_to_author_cache_for_stale_cache_with_2_messages(self):
        thread_id = feedback_services.create_thread(
            'exploration', 'exp_id', self.editor_id, 'Feedback', 'first text')
        feedback_services.create_message(
            thread_id, self.editor_id, None, None, 'second text')
        thread = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        thread.last_message_author = None
        thread.put()

        self.assertEqual(self._run_one_off_job(), [('Updated', 1)])

        thread = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        self.assertEqual(thread.last_message_author, self.EDITOR_USERNAME)

    def test_update_to_author_cache_for_stale_cache_with_1_anon_message(self):
        thread_id = feedback_services.create_thread(
            'exploration', 'exp_id', None, 'Feedback', 'first text')
        thread = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        thread.last_message_author = self.EDITOR_USERNAME
        thread.put()

        self.assertEqual(self._run_one_off_job(), [('Updated', 1)])

        thread = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        self.assertIsNone(thread.last_message_author)

    def test_update_to_author_cache_for_stale_cache_with_2_anon_messages(self):
        thread_id = feedback_services.create_thread(
            'exploration', 'exp_id', None, 'Feedback', 'first text')
        feedback_services.create_message(
            thread_id, None, None, None, 'second text')
        thread = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        thread.last_message_author = self.EDITOR_USERNAME
        thread.put()

        self.assertEqual(self._run_one_off_job(), [('Updated', 1)])

        thread = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        self.assertIsNone(thread.last_message_author)

    def test_update_to_status_cache_for_stale_cache_with_status_change(self):
        thread_id = feedback_services.create_thread(
            'exploration', 'exp_id', self.editor_id, 'Feedback', 'first text')
        feedback_services.create_message(
            thread_id, self.editor_id, feedback_models.STATUS_CHOICES_IGNORED,
            None, 'second text')
        thread = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        thread.last_message_updated_status = None
        thread.put()

        self.assertEqual(self._run_one_off_job(), [('Updated', 1)])

        thread = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        self.assertEqual(
            thread.last_message_updated_status,
            feedback_models.STATUS_CHOICES_IGNORED)

    def test_update_to_status_cache_for_stale_cache_with_no_status_change(self):
        thread_id = feedback_services.create_thread(
            'exploration', 'exp_id', self.editor_id, 'Feedback', 'first text')
        feedback_services.create_message(
            thread_id, self.editor_id, None, None, 'second text')
        thread = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        thread.last_message_updated_status = feedback_models.STATUS_CHOICES_OPEN
        thread.put()

        self.assertEqual(self._run_one_off_job(), [('Updated', 1)])

        thread = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        self.assertIsNone(thread.last_message_updated_status)

    def test_update_to_all_caches_for_stale_cache_with_0_messages(self):
        thread_id = (
            feedback_models.GeneralFeedbackThreadModel.generate_new_thread_id(
                'exploration', 'exp_id'))
        thread = feedback_models.GeneralFeedbackThreadModel.create(thread_id)
        thread.entity_type = 'exploration'
        thread.entity_id = 'exp_id'
        thread.original_author = self.editor_id
        thread.status = feedback_models.STATUS_CHOICES_OPEN
        thread.subject = 'Feedback'
        thread.has_suggestion = False
        thread.message_count = 0
        thread.last_message_text = 'non-existing message text'
        thread.last_message_author = self.EDITOR_USERNAME
        thread.last_message_updated_status = feedback_models.STATUS_CHOICES_OPEN
        thread.put()

        self.assertEqual(self._run_one_off_job(), [('Updated', 1)])

        thread = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        self.assertIsNone(thread.last_message_text)
        self.assertIsNone(thread.last_message_author)
        self.assertIsNone(thread.last_message_updated_status)

    def test_no_update_to_text_and_author_cache_of_fresh_cache_with_1_message(
            self):
        thread_id = feedback_services.create_thread(
            'exploration', 'exp_id', self.editor_id, 'Feedback', 'first text')

        self.assertEqual(self._run_one_off_job(), [])

        thread = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        self.assertEqual(thread.last_message_text, 'first text')
        self.assertEqual(thread.last_message_author, self.EDITOR_USERNAME)

    def test_no_update_to_text_and_author_cache_of_fresh_cache_with_2_messages(
            self):
        thread_id = feedback_services.create_thread(
            'exploration', 'exp_id', self.editor_id, 'Feedback', 'first text')
        feedback_services.create_message(
            thread_id, self.editor_id, None, None, 'second text')

        self.assertEqual(self._run_one_off_job(), [])

        thread = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        self.assertEqual(thread.last_message_text, 'second text')
        self.assertEqual(thread.last_message_author, self.EDITOR_USERNAME)

    def test_no_update_to_status_cache_of_fresh_cache_with_no_status_change(
            self):
        thread_id = feedback_services.create_thread(
            'exploration', 'exp_id', self.editor_id, 'Feedback', 'first text')
        feedback_services.create_message(
            thread_id, self.editor_id, None, None, 'second text')

        self.assertEqual(self._run_one_off_job(), [])

        thread = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        self.assertIsNone(thread.last_message_updated_status)

    def test_no_update_to_status_cache_of_fresh_cache_with_status_change(self):
        thread_id = feedback_services.create_thread(
            'exploration', 'exp_id', self.editor_id, 'Feedback', 'first text')
        feedback_services.create_message(
            thread_id, self.editor_id, feedback_models.STATUS_CHOICES_IGNORED,
            None, 'second text')

        self.assertEqual(self._run_one_off_job(), [])

        thread = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        self.assertEqual(
            thread.last_message_updated_status,
            feedback_models.STATUS_CHOICES_IGNORED)
