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
            thread.put()

        # The two stale threads should be updated by the job.
        self.assertEqual(self._run_one_off_job(), [('Updated', 2)])

        for thread_id in stale_thread_ids:
            thread = (
                feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id))
            # The cache should now be fresh.
            self.assertEqual(thread.last_message_text, 'message')
            self.assertEqual(thread.last_message_author, self.EDITOR_USERNAME)

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
        thread.put()

        self.assertEqual(self._run_one_off_job(), [('Updated', 1)])

        thread = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        self.assertIsNone(thread.last_message_text)
        self.assertIsNone(thread.last_message_author)

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
