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


class GeneralFeedbackThreadOneOffJobTest(test_utils.GenericTestBase):
    """Tests for GeneralFeedbackThreadUser migration."""

    ONE_OFF_JOB_CLASS = feedback_jobs_one_off.GeneralFeedbackThreadOneOffJob

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

    def _clear_message_cache(self, thread_id):
        """Forcibly clears the message cache of the given thread."""
        thread_model = (
            feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id))
        thread_model.last_message_id = None
        thread_model.last_message_text = None
        thread_model.last_message_author_id = None
        thread_model.second_last_message_id = None
        thread_model.second_last_message_text = None
        thread_model.second_last_message_author_id = None
        thread_model.put()

    def setUp(self):
        super(GeneralFeedbackThreadOneOffJobTest, self).setUp()

        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)

    def test_no_changes_made_to_fresh_thread(self):
        thread_id = feedback_services.create_thread(
            'exploration', 'exp_id', self.editor_id, 'Feedback', 'first text')

        self.assertEqual(self._run_one_off_job(), [])

        thread = feedback_services.get_thread(thread_id)
        self.assertEqual(thread.last_message_text, 'first text')
        self.assertEqual(thread.last_message_author_id, self.editor_id)
        self.assertIsNone(thread.second_last_message_text)
        self.assertIsNone(thread.second_last_message_author_id)

    def test_no_changes_made_to_fresh_thread_with_two_messages(self):
        thread_id = feedback_services.create_thread(
            'exploration', 'exp_id', self.editor_id, 'Feedback', 'first text')
        feedback_services.create_message(
            thread_id, self.editor_id, None, None, 'second text')

        self.assertEqual(self._run_one_off_job(), [])

        thread = feedback_services.get_thread(thread_id)
        self.assertEqual(thread.last_message_text, 'second text')
        self.assertEqual(thread.last_message_author_id, self.editor_id)
        self.assertEqual(thread.second_last_message_text, 'first text')
        self.assertEqual(thread.second_last_message_author_id, self.editor_id)

    def test_no_changes_made_to_fresh_thread_with_three_messages(self):
        thread_id = feedback_services.create_thread(
            'exploration', 'exp_id', self.editor_id, 'Feedback', 'first text')
        feedback_services.create_message(
            thread_id, self.editor_id, None, None, 'second text')
        feedback_services.create_message(
            thread_id, self.editor_id, None, None, 'third text')

        self.assertEqual(self._run_one_off_job(), [])

        thread = feedback_services.get_thread(thread_id)
        self.assertEqual(thread.last_message_text, 'third text')
        self.assertEqual(thread.last_message_author_id, self.editor_id)
        self.assertEqual(thread.second_last_message_text, 'second text')
        self.assertEqual(thread.second_last_message_author_id, self.editor_id)

    def test_cache_updated_for_stale_thread_with_one_message(self):
        thread_id = feedback_services.create_thread(
            'exploration', 'exp_id', self.editor_id, 'Feedback', 'first text')
        self._clear_message_cache(thread_id)

        self.assertEqual(self._run_one_off_job(), [('Updated', 1)])

        thread = feedback_services.get_thread(thread_id)
        self.assertEqual(thread.last_message_text, 'first text')
        self.assertEqual(thread.last_message_author_id, self.editor_id)
        self.assertIsNone(thread.second_last_message_text)
        self.assertIsNone(thread.second_last_message_author_id)

    def test_invalid_cache_updated_for_stale_thread_with_one_message(self):
        thread_id = feedback_services.create_thread(
            'exploration', 'exp_id', self.editor_id, 'Feedback', 'first text')
        thread_model = (
            feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id))
        thread_model.second_last_message_id = 1
        thread_model.second_last_message_text = 'non-existing second text'
        thread_model.second_last_message_author_id = self.editor_id
        thread_model.put()

        self.assertEqual(self._run_one_off_job(), [('Updated', 1)])

        thread = feedback_services.get_thread(thread_id)
        self.assertEqual(thread.last_message_id, 0)
        self.assertEqual(thread.last_message_text, 'first text')
        self.assertEqual(thread.last_message_author_id, self.editor_id)
        self.assertIsNone(thread.second_last_message_id)
        self.assertIsNone(thread.second_last_message_text)
        self.assertIsNone(thread.second_last_message_author_id)

    def test_cache_updated_for_stale_thread_with_two_messages(self):
        thread_id = feedback_services.create_thread(
            'exploration', 'exp_id', self.editor_id, 'Feedback', 'first text')
        feedback_services.create_message(
            thread_id, self.editor_id, None, None, 'second text')
        self._clear_message_cache(thread_id)

        self.assertEqual(self._run_one_off_job(), [('Updated', 1)])

        thread = feedback_services.get_thread(thread_id)
        self.assertEqual(thread.last_message_id, 1)
        self.assertEqual(thread.last_message_text, 'second text')
        self.assertEqual(thread.last_message_author_id, self.editor_id)
        self.assertEqual(thread.second_last_message_id, 0)
        self.assertEqual(thread.second_last_message_text, 'first text')
        self.assertEqual(thread.second_last_message_author_id, self.editor_id)

    def test_cache_updated_for_stale_thread_with_three_messages(self):
        thread_id = feedback_services.create_thread(
            'exploration', 'exp_id', self.editor_id, 'Feedback', 'first text')
        feedback_services.create_message(
            thread_id, self.editor_id, None, None, 'second text')
        feedback_services.create_message(
            thread_id, self.editor_id, None, None, 'third text')
        self._clear_message_cache(thread_id)

        self.assertEqual(self._run_one_off_job(), [('Updated', 1)])

        thread = feedback_services.get_thread(thread_id)
        self.assertEqual(thread.last_message_id, 2)
        self.assertEqual(thread.last_message_text, 'third text')
        self.assertEqual(thread.last_message_author_id, self.editor_id)
        self.assertEqual(thread.second_last_message_id, 1)
        self.assertEqual(thread.second_last_message_text, 'second text')
        self.assertEqual(thread.second_last_message_author_id, self.editor_id)

    def test_invalid_cache_updated_for_stale_thread_with_no_messages(self):
        thread_id = (
            feedback_models.GeneralFeedbackThreadModel.generate_new_thread_id(
                'exploration', 'exp_id'))
        thread = feedback_models.GeneralFeedbackThreadModel.create(thread_id)
        thread.entity_type = 'exploration'
        thread.entity_id = 'exp_id'
        thread.original_author_id = self.editor_id
        thread.status = feedback_models.STATUS_CHOICES_OPEN
        thread.subject = 'Feedback'
        thread.has_suggestion = False
        thread.message_count = 0
        thread.last_message_id = 1
        thread.last_message_text = 'non-existing second text'
        thread.last_message_author_id = self.editor_id
        thread.second_last_message_id = 0
        thread.second_last_message_text = 'non-existing first text'
        thread.second_last_message_author_id = self.editor_id
        thread.put()

        self.assertEqual(self._run_one_off_job(), [('Updated', 1)])

        thread = feedback_services.get_thread(thread_id)
        self.assertIsNone(thread.last_message_id)
        self.assertIsNone(thread.last_message_text)
        self.assertIsNone(thread.last_message_author_id)
        self.assertIsNone(thread.second_last_message_id)
        self.assertIsNone(thread.second_last_message_text)
        self.assertIsNone(thread.second_last_message_author_id)
