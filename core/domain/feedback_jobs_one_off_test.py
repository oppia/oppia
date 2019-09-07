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
