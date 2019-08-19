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

"""Tests for Feedback-related jobs."""

import ast

from core.domain.feedback_jobs_one_off import GeneralFeedbackThreadUserOneOffJob
from core.platform import models
from core.tests import test_utils

(feedback_models,) = models.Registry.import_models([models.NAMES.feedback])
taskqueue_services = models.Registry.import_taskqueue_services()


class GeneralFeedbackThreadUserOneOffJobTest(test_utils.GenericTestBase):
    """Tests for ExpSummary aggregations."""

    ONE_OFF_JOB_MANAGERS_FOR_TESTS = [GeneralFeedbackThreadUserOneOffJob]

    def _run_one_off_job(self):
        """Runs the one-off MapReduce job."""
        job_id = GeneralFeedbackThreadUserOneOffJob.create_new()
        GeneralFeedbackThreadUserOneOffJob.enqueue(job_id)
        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_tasks()
        stringified_output = (
            GeneralFeedbackThreadUserOneOffJob.get_output(job_id))

        eval_output = [ast.literal_eval(stringified_item)
                       for stringified_item in stringified_output]
        output = [(eval_item[0], int(eval_item[1]))
                  for eval_item in eval_output]
        return output

    def test_migration(self):
        user_id = 'user'
        thread_id = 'exploration.exp_id.thread_id'
        instance_id = '%s.%s' % (user_id, thread_id)
        user_feedback_model = feedback_models.GeneralFeedbackThreadUserModel(
            id=instance_id, user_id=None, thread_id=None)
        user_feedback_model.put(allow_partial=True)

        output = self._run_one_off_job()

        self.assertEqual(output, ('SUCCESS', 1))

        user_feedback_model = (
            feedback_models.GeneralFeedbackThreadUserModel
            .get(user_id, thread_id))
        self.assertEqual(user_feedback_model.user_id, user_id)
        self.assertEqual(user_feedback_model.thread_id, thread_id)