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

from core.domain import exp_domain
from core.domain import exp_services
from core.domain import feedback_jobs_one_off
from core.domain import feedback_services
from core.platform import models
from core.tests import test_utils

(exp_models, feedback_models,) = models.Registry.import_models([
    models.NAMES.exploration, models.NAMES.feedback])
(feedback_models,) = models.Registry.import_models([models.NAMES.feedback])


class CleanUpFeedbackAnalyticsModelModelOneOffJobTest(
        test_utils.GenericTestBase):
    """Tests for one-off job to clean up feedback analytics model."""

    def setUp(self):
        super(CleanUpFeedbackAnalyticsModelModelOneOffJobTest, self).setUp()
        self.signup('user@email', 'user')
        self.user_id = self.get_user_id_from_email('user@email')

        exp = exp_domain.Exploration.create_default_exploration(
            '0',
            title='title 0',
            category='Art',
        )
        exp_services.save_new_exploration(self.user_id, exp)

        feedback_models.FeedbackAnalyticsModel(id='0').put()

    def test_standard_operation(self):
        job_id = (
            feedback_jobs_one_off
            .CleanUpFeedbackAnalyticsModelModelOneOffJob.create_new())
        (
            feedback_jobs_one_off
            .CleanUpFeedbackAnalyticsModelModelOneOffJob.enqueue(job_id))
        self.process_and_flush_pending_mapreduce_tasks()

        output = (
            feedback_jobs_one_off
            .CleanUpFeedbackAnalyticsModelModelOneOffJob.get_output(job_id))
        self.assertEqual(output, [])

        model_instance = feedback_models.FeedbackAnalyticsModel.get_by_id('0')
        self.assertFalse(model_instance is None)

    def test_migration_job_skips_deleted_model(self):
        model_instance = feedback_models.FeedbackAnalyticsModel.get_by_id('0')
        model_instance.deleted = True
        model_instance.update_timestamps()
        model_instance.put()

        exp_models.ExplorationModel.get_by_id('0').delete(
            self.user_id, 'Delete')

        job_id = (
            feedback_jobs_one_off
            .CleanUpFeedbackAnalyticsModelModelOneOffJob.create_new())
        (
            feedback_jobs_one_off
            .CleanUpFeedbackAnalyticsModelModelOneOffJob.enqueue(job_id))
        self.process_and_flush_pending_mapreduce_tasks()

        output = (
            feedback_jobs_one_off
            .CleanUpFeedbackAnalyticsModelModelOneOffJob.get_output(job_id))
        self.assertEqual(output, [])

    def test_job_removes_analytics_model_for_deleted_explorations(self):
        model_instance = feedback_models.FeedbackAnalyticsModel.get_by_id('0')
        self.assertFalse(model_instance is None)

        exp_models.ExplorationModel.get_by_id('0').delete(
            self.user_id, 'Delete')
        job_id = (
            feedback_jobs_one_off
            .CleanUpFeedbackAnalyticsModelModelOneOffJob.create_new())
        (
            feedback_jobs_one_off
            .CleanUpFeedbackAnalyticsModelModelOneOffJob.enqueue(job_id))
        self.process_and_flush_pending_mapreduce_tasks()

        output = (
            feedback_jobs_one_off
            .CleanUpFeedbackAnalyticsModelModelOneOffJob.get_output(job_id))
        self.assertEqual(
            output, ['[u\'Deleted Feedback Analytics Model\', [u\'0\']]'])

        model_instance = feedback_models.FeedbackAnalyticsModel.get_by_id('0')
        self.assertIsNone(model_instance)


class CleanUpGeneralFeedbackThreadModelOneOffJobTest(
        test_utils.GenericTestBase):
    """Tests for one-off job to clean up general feedback thread model."""

    def setUp(self):
        super(CleanUpGeneralFeedbackThreadModelOneOffJobTest, self).setUp()
        self.signup('user@email', 'user')
        self.user_id = self.get_user_id_from_email('user@email')

        exp = exp_domain.Exploration.create_default_exploration(
            '0',
            title='title 0',
            category='Art',
        )
        exp_services.save_new_exploration(self.user_id, exp)

        self.thread_id = feedback_services.create_thread(
            'exploration', '0', self.user_id, 'Subject', 'Text',
            has_suggestion=False)

    def test_standard_operation(self):
        job_id = (
            feedback_jobs_one_off
            .CleanUpGeneralFeedbackThreadModelOneOffJob.create_new())
        (
            feedback_jobs_one_off
            .CleanUpGeneralFeedbackThreadModelOneOffJob.enqueue(job_id))
        self.process_and_flush_pending_mapreduce_tasks()

        output = (
            feedback_jobs_one_off
            .CleanUpGeneralFeedbackThreadModelOneOffJob.get_output(job_id))
        self.assertEqual(output, [])

    def test_migration_job_skips_deleted_model(self):
        model_instance = feedback_models.GeneralFeedbackThreadModel.get_by_id(
            self.thread_id)
        model_instance.deleted = True
        model_instance.update_timestamps()
        model_instance.put()

        exp_models.ExplorationModel.get_by_id('0').delete(
            self.user_id, 'Delete')
        job_id = (
            feedback_jobs_one_off
            .CleanUpGeneralFeedbackThreadModelOneOffJob.create_new())
        (
            feedback_jobs_one_off
            .CleanUpGeneralFeedbackThreadModelOneOffJob.enqueue(job_id))
        self.process_and_flush_pending_mapreduce_tasks()

        output = (
            feedback_jobs_one_off
            .CleanUpGeneralFeedbackThreadModelOneOffJob.get_output(job_id))
        self.assertEqual(output, [])

    def test_job_removes_thread_model_for_deleted_explorations(self):
        model_instance = feedback_models.GeneralFeedbackThreadModel.get_by_id(
            self.thread_id)
        self.assertFalse(model_instance is None)

        exp_models.ExplorationModel.get_by_id('0').delete(
            self.user_id, 'Delete')
        job_id = (
            feedback_jobs_one_off
            .CleanUpGeneralFeedbackThreadModelOneOffJob.create_new())
        (
            feedback_jobs_one_off
            .CleanUpGeneralFeedbackThreadModelOneOffJob.enqueue(job_id))
        self.process_and_flush_pending_mapreduce_tasks()

        output = (
            feedback_jobs_one_off
            .CleanUpGeneralFeedbackThreadModelOneOffJob.get_output(job_id))
        self.assertEqual(
            output, [
                '[u\'Deleted GeneralFeedbackThreadModel\', [u\'%s\']]' % (
                    self.thread_id)])

        model_instance = feedback_models.GeneralFeedbackThreadModel.get_by_id(
            self.thread_id)
        self.assertIsNone(model_instance)
