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
    """Tests for one-off job to populate the caches of FeedbackThreads."""

    def setUp(self):
        super(FeedbackThreadCacheOneOffJobTest, self).setUp()
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)

    def _run_one_off_job(self):
        """Runs the one-off job under test and returns its output."""
        job_id = (
            feedback_jobs_one_off.FeedbackThreadCacheOneOffJob.create_new())
        feedback_jobs_one_off.FeedbackThreadCacheOneOffJob.enqueue(job_id)
        self.assertEqual(
            1,
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS))
        self.process_and_flush_pending_tasks()
        self.assertEqual(
            0,
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS))
        job_output = (
            feedback_jobs_one_off.FeedbackThreadCacheOneOffJob.get_output(
                job_id))
        job_output_pairs = [ast.literal_eval(o) for o in job_output]
        return [(key, int(val)) for key, val in job_output_pairs]

    def _create_thread(self, author_id, text):
        """Helper wrapper for feedback_services.create_thread which only exposes
        arguments relevant to the cache.

        Args:
            author_id: str|None. ID of the user which created this thread, or
                None if the author was anonymous (not logged in).
            text: str. Content of the first message in the thread (allowed to be
                an empty string).

        Returns:
            str. The ID of the newly created thread.
        """
        return feedback_services.create_thread(
            'exploration', 'exp_id', author_id, 'subject', text)

    def _create_message(self, thread_id, author_id, text):
        """Helper wrapper for feedback_services.create_message which only
        exposes arguments relevant to the cache.

        Args:
            thread_id: str. ID of the thread to which this message should be
                appened to.
            author_id: str|None. ID of the user which created this message, or
                None if the author was anonymous (not logged in).
            text: str. Content of the first message in the thread (allowed to be
                an empty string).
        """
        feedback_services.create_message(thread_id, author_id, None, None, text)

    def test_cache_update_to_thread_with_1_message(self):
        thread_id = self._create_thread(self.editor_id, 'first text')
        model = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        model.last_nonempty_message_text = None
        model.put()

        self.assertEqual(self._run_one_off_job(), [('Updated', 1)])

        model = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        self.assertEqual(model.last_nonempty_message_text, 'first text')

    def test_cache_update_to_thread_with_2_messages(self):
        thread_id = self._create_thread(self.editor_id, 'first text')
        self._create_message(thread_id, self.editor_id, 'second text')
        model = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        model.last_nonempty_message_text = None
        model.put()

        self.assertEqual(self._run_one_off_job(), [('Updated', 1)])

        model = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        self.assertEqual(model.last_nonempty_message_text, 'second text')

    def test_cache_update_to_thread_with_1_empty_message(self):
        thread_id = self._create_thread(self.editor_id, '')
        model = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        model.last_nonempty_message_text = 'Non-empty'
        model.put()

        self.assertEqual(self._run_one_off_job(), [('Updated', 1)])

        model = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        self.assertEqual(model.last_nonempty_message_text, None)

    def test_cache_update_to_thread_with_2_empty_messages(self):
        thread_id = self._create_thread(self.editor_id, '')
        self._create_message(thread_id, self.editor_id, '')
        model = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        model.last_nonempty_message_text = 'Non-empty'
        model.put()

        self.assertEqual(self._run_one_off_job(), [('Updated', 1)])

        model = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        self.assertEqual(model.last_nonempty_message_text, None)

    def test_cache_update_to_thread_with_empty_then_nonempty_messages(self):
        thread_id = self._create_thread(self.editor_id, '')
        self._create_message(thread_id, self.editor_id, 'first text')
        model = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        model.last_nonempty_message_text = None
        model.put()

        self.assertEqual(self._run_one_off_job(), [('Updated', 1)])

        model = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        self.assertEqual(model.last_nonempty_message_text, 'first text')

    def test_cache_update_to_thread_with_nonempty_then_empty_messages(self):
        thread_id = self._create_thread(self.editor_id, 'first text')
        self._create_message(thread_id, self.editor_id, '')
        model = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        model.last_nonempty_message_text = None
        model.put()

        self.assertEqual(self._run_one_off_job(), [('Updated', 1)])

        model = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        self.assertEqual(model.last_nonempty_message_text, 'first text')

    def test_cache_update_to_thread_with_1_user_message(self):
        thread_id = self._create_thread(self.editor_id, 'first text')
        model = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        model.last_nonempty_message_author_id = None
        model.put()

        self.assertEqual(self._run_one_off_job(), [('Updated', 1)])

        model = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        self.assertEqual(model.last_nonempty_message_author_id, self.editor_id)

    def test_cache_update_to_thread_with_2_user_messages(self):
        thread_id = self._create_thread(self.editor_id, 'first text')
        self._create_message(thread_id, self.editor_id, 'second text')
        model = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        model.last_nonempty_message_author_id = None
        model.put()

        self.assertEqual(self._run_one_off_job(), [('Updated', 1)])

        model = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        self.assertEqual(model.last_nonempty_message_author_id, self.editor_id)

    def test_cache_update_to_thread_with_1_anon_message(self):
        thread_id = self._create_thread(None, 'first text')
        model = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        model.last_nonempty_message_author_id = self.editor_id
        model.put()

        self.assertEqual(self._run_one_off_job(), [('Updated', 1)])

        model = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        self.assertIsNone(model.last_nonempty_message_author_id)

    def test_cache_update_to_thread_with_2_anon_messages(self):
        thread_id = self._create_thread(None, 'first text')
        self._create_message(thread_id, None, 'second text')
        model = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        model.last_nonempty_message_author_id = self.editor_id
        model.put()

        self.assertEqual(self._run_one_off_job(), [('Updated', 1)])

        model = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        self.assertIsNone(model.last_nonempty_message_author_id)

    def test_cache_update_to_thread_with_user_then_anon_messages(self):
        thread_id = self._create_thread(self.editor_id, 'first text')
        self._create_message(thread_id, None, 'second text')
        model = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        model.last_nonempty_message_author_id = self.editor_id
        model.put()

        self.assertEqual(self._run_one_off_job(), [('Updated', 1)])

        model = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        self.assertIsNone(model.last_nonempty_message_author_id)

    def test_cache_update_to_thread_with_anon_then_user_messages(self):
        thread_id = self._create_thread(None, 'first text')
        self._create_message(thread_id, self.editor_id, 'second text')
        model = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        model.last_nonempty_message_author_id = None
        model.put()

        self.assertEqual(self._run_one_off_job(), [('Updated', 1)])

        model = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        self.assertEqual(model.last_nonempty_message_author_id, self.editor_id)

    def test_cache_update_to_thread_with_user_then_empty_messages(self):
        thread_id = self._create_thread(self.editor_id, 'first text')
        self._create_message(thread_id, None, '')
        model = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        model.last_nonempty_message_author_id = None
        model.put()

        self.assertEqual(self._run_one_off_job(), [('Updated', 1)])

        model = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        self.assertEqual(model.last_nonempty_message_author_id, self.editor_id)

    def test_cache_update_to_thread_with_anon_then_empty_messages(self):
        thread_id = self._create_thread(None, 'first text')
        self._create_message(thread_id, self.editor_id, '')
        model = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        model.last_nonempty_message_author_id = self.editor_id
        model.put()

        self.assertEqual(self._run_one_off_job(), [('Updated', 1)])

        model = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        self.assertIsNone(model.last_nonempty_message_author_id)

    def test_no_cache_update_to_thread_with_1_message(self):
        thread_id = self._create_thread(self.editor_id, 'first text')

        self.assertEqual(self._run_one_off_job(), [('Already up-to-date', 1)])

        model = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        self.assertEqual(model.last_nonempty_message_text, 'first text')

    def test_no_cache_update_to_thread_with_2_messages(self):
        thread_id = self._create_thread(self.editor_id, 'first text')
        self._create_message(thread_id, self.editor_id, 'second text')

        self.assertEqual(self._run_one_off_job(), [('Already up-to-date', 1)])

        model = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        self.assertEqual(model.last_nonempty_message_text, 'second text')

    def test_no_cache_update_to_thread_with_1_empty_message(self):
        thread_id = self._create_thread(self.editor_id, '')

        self.assertEqual(self._run_one_off_job(), [('Already up-to-date', 1)])

        model = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        self.assertEqual(model.last_nonempty_message_text, None)

    def test_no_cache_update_to_thread_with_2_empty_messages(self):
        thread_id = self._create_thread(self.editor_id, '')
        self._create_message(thread_id, self.editor_id, '')

        self.assertEqual(self._run_one_off_job(), [('Already up-to-date', 1)])

        model = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        self.assertEqual(model.last_nonempty_message_text, None)

    def test_no_cache_update_to_thread_with_empty_then_nonempty_messages(self):
        thread_id = self._create_thread(self.editor_id, '')
        self._create_message(thread_id, self.editor_id, 'first text')

        self.assertEqual(self._run_one_off_job(), [('Already up-to-date', 1)])

        model = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        self.assertEqual(model.last_nonempty_message_text, 'first text')

    def test_no_cache_update_to_thread_with_nonempty_then_empty_messages(self):
        thread_id = self._create_thread(self.editor_id, 'first text')
        self._create_message(thread_id, self.editor_id, '')

        self.assertEqual(self._run_one_off_job(), [('Already up-to-date', 1)])

        model = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        self.assertEqual(model.last_nonempty_message_text, 'first text')

    def test_no_cache_update_to_thread_with_1_user_message(self):
        thread_id = self._create_thread(self.editor_id, 'first text')

        self.assertEqual(self._run_one_off_job(), [('Already up-to-date', 1)])

        model = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        self.assertEqual(model.last_nonempty_message_author_id, self.editor_id)

    def test_no_cache_update_to_thread_with_2_user_messages(self):
        thread_id = self._create_thread(self.editor_id, 'first text')
        self._create_message(thread_id, self.editor_id, 'second text')

        self.assertEqual(self._run_one_off_job(), [('Already up-to-date', 1)])

        model = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        self.assertEqual(model.last_nonempty_message_author_id, self.editor_id)

    def test_no_cache_update_to_thread_with_1_anon_message(self):
        thread_id = self._create_thread(None, 'first text')

        self.assertEqual(self._run_one_off_job(), [('Already up-to-date', 1)])

        model = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        self.assertIsNone(model.last_nonempty_message_author_id)

    def test_no_cache_update_to_thread_with_2_anon_messages(self):
        thread_id = self._create_thread(None, 'first text')
        self._create_message(thread_id, None, 'second text')

        self.assertEqual(self._run_one_off_job(), [('Already up-to-date', 1)])

        model = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        self.assertIsNone(model.last_nonempty_message_author_id)

    def test_no_cache_update_to_thread_with_user_then_anon_messages(self):
        thread_id = self._create_thread(self.editor_id, 'first text')
        self._create_message(thread_id, None, 'second text')

        self.assertEqual(self._run_one_off_job(), [('Already up-to-date', 1)])

        model = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        self.assertIsNone(model.last_nonempty_message_author_id)

    def test_no_cache_update_to_thread_with_anon_then_user_messages(self):
        thread_id = self._create_thread(None, 'first text')
        self._create_message(thread_id, self.editor_id, 'second text')

        self.assertEqual(self._run_one_off_job(), [('Already up-to-date', 1)])

        model = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        self.assertEqual(model.last_nonempty_message_author_id, self.editor_id)

    def test_no_cache_update_to_thread_with_user_then_empty_messages(self):
        thread_id = self._create_thread(self.editor_id, 'first text')
        self._create_message(thread_id, None, '')

        self.assertEqual(self._run_one_off_job(), [('Already up-to-date', 1)])

        model = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        self.assertEqual(model.last_nonempty_message_author_id, self.editor_id)

    def test_no_cache_update_to_thread_with_anon_then_empty_messages(self):
        thread_id = self._create_thread(None, 'first text')
        self._create_message(thread_id, self.editor_id, '')

        self.assertEqual(self._run_one_off_job(), [('Already up-to-date', 1)])

        model = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        self.assertIsNone(model.last_nonempty_message_author_id)
