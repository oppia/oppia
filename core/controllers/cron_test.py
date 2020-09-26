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

"""Tests for the cron jobs."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import ast
import datetime
import logging

from core import jobs
from core.controllers import cron
from core.domain import cron_services
from core.domain import email_manager
from core.platform import models
from core.platform.taskqueue import gae_taskqueue_services as taskqueue_services
from core.tests import test_utils
import main_cron
import utils

from mapreduce import model as mapreduce_model
import webtest

(job_models, suggestion_models) = models.Registry.import_models(
    [models.NAMES.job, models.NAMES.suggestion])


class SampleMapReduceJobManager(jobs.BaseMapReduceJobManager):
    """Test job that maps over the general suggestion model."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [suggestion_models.GeneralSuggestionModel]


class CronJobTests(test_utils.GenericTestBase):

    def setUp(self):
        super(CronJobTests, self).setUp()
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.set_admins([self.ADMIN_USERNAME])
        self.testapp_swap = self.swap(
            self, 'testapp', webtest.TestApp(main_cron.app))

        self.email_subjects = []
        self.email_bodies = []
        def _mock_send_mail_to_admin(email_subject, email_body):
            """Mocks email_manager.send_mail_to_admin() as its not possible to
            send mail with self.testapp_swap, i.e with the URLs defined in
            main_cron.
            """
            self.email_subjects.append(email_subject)
            self.email_bodies.append(email_body)

        self.send_mail_to_admin_swap = self.swap(
            email_manager, 'send_mail_to_admin', _mock_send_mail_to_admin)

    def test_send_mail_to_admin_on_job_success(self):
        self.login(self.ADMIN_EMAIL, is_super_admin=True)

        with self.testapp_swap, self.send_mail_to_admin_swap:
            self.get_html_response('/cron/mail/admin/job_status')

        self.assertEqual(self.email_subjects, ['MapReduce status report'])
        self.assertEqual(
            self.email_bodies, ['All MapReduce jobs are running fine.'])

        self.logout()

    def test_send_mail_to_admin_on_job_failure(self):
        self.login(self.ADMIN_EMAIL, is_super_admin=True)

        job_id = SampleMapReduceJobManager.create_new()
        SampleMapReduceJobManager.enqueue(
            job_id, taskqueue_services.QUEUE_NAME_DEFAULT)
        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_DEFAULT), 1)

        self.process_and_flush_pending_tasks()
        self.assertEqual(
            SampleMapReduceJobManager.get_status_code(job_id),
            jobs.STATUS_CODE_COMPLETED)

        # Increase retries to denote a stuck job.
        shard_state_model_class = mapreduce_model.ShardState
        recent_job_models = shard_state_model_class.all()
        for job_model in recent_job_models:
            job_model.retries += 1
            job_model.put()

        with self.testapp_swap, self.send_mail_to_admin_swap:
            self.get_html_response('/cron/mail/admin/job_status')

        self.assertEqual(self.email_subjects, ['MapReduce failure alert'])
        self.assertEqual(len(self.email_bodies), 1)
        self.assertIn(
            '5 jobs have failed in the past 25 hours. More information '
            '(about at most 50 jobs; to see more, please check the logs)',
            self.email_bodies[0])

        self.logout()

    def test_cron_dashboard_stats_handler(self):
        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 0)

        with self.testapp_swap:
            self.get_html_response('/cron/users/dashboard_stats')

        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)

        all_jobs = job_models.JobModel.get_all_unfinished_jobs(3)
        self.assertEqual(len(all_jobs), 1)
        self.assertEqual(all_jobs[0].job_type, 'DashboardStatsOneOffJob')
        self.logout()

    def test_cron_user_deletion_handler(self):
        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 0)

        with self.testapp_swap:
            self.get_html_response('/cron/users/user_deletion')

        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)

        all_jobs = job_models.JobModel.get_all_unfinished_jobs(3)
        self.assertEqual(len(all_jobs), 1)
        self.assertEqual(all_jobs[0].job_type, 'UserDeletionOneOffJob')
        self.logout()

    def test_cron_fully_complete_user_deletion_handler(self):
        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 0)

        with self.testapp_swap:
            self.get_html_response('/cron/users/fully_complete_user_deletion')

        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)

        all_jobs = job_models.JobModel.get_all_unfinished_jobs(3)
        self.assertEqual(len(all_jobs), 1)
        self.assertEqual(
            all_jobs[0].job_type, 'FullyCompleteUserDeletionOneOffJob')
        self.logout()

    def test_cron_exploration_recommendations_handler(self):
        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 0)

        with self.testapp_swap:
            self.get_html_response('/cron/explorations/recommendations')

        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)

        all_jobs = job_models.JobModel.get_all_unfinished_jobs(3)
        self.assertEqual(len(all_jobs), 1)
        self.assertEqual(
            all_jobs[0].job_type, 'ExplorationRecommendationsOneOffJob')

    def test_cron_activity_search_rank_handler(self):
        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 0)

        with self.testapp_swap:
            self.get_html_response('/cron/explorations/search_rank')

        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)

        all_jobs = job_models.JobModel.get_all_unfinished_jobs(3)
        self.assertEqual(len(all_jobs), 1)
        self.assertEqual(all_jobs[0].job_type, 'IndexAllActivitiesJobManager')

    def test_clean_data_items_of_completed_map_reduce_jobs(self):
        observed_log_messages = []

        def _mock_logging_function(msg, *args):
            """Mocks logging.warning()."""
            observed_log_messages.append(msg % args)

        logging_swap = self.swap(logging, 'warning', _mock_logging_function)
        recency_msec_swap = self.swap(
            cron, 'MAX_MAPREDUCE_METADATA_RETENTION_MSECS', 0)

        self.login(self.ADMIN_EMAIL, is_super_admin=True)

        job_id = SampleMapReduceJobManager.create_new()
        SampleMapReduceJobManager.enqueue(
            job_id, taskqueue_services.QUEUE_NAME_DEFAULT)
        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_DEFAULT), 1)

        self.process_and_flush_pending_tasks()
        self.assertEqual(
            SampleMapReduceJobManager.get_status_code(job_id),
            jobs.STATUS_CODE_COMPLETED)
        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_DEFAULT), 0)

        with self.testapp_swap, logging_swap, recency_msec_swap:
            self.get_html_response('/cron/jobs/cleanup')

        self.assertEqual(
            observed_log_messages,
            [
                '1 MR jobs cleaned up.',
                'Deletion jobs for auxiliary MapReduce entities kicked off.',
                'Deletion jobs for JobModels entities kicked off.'
            ]
        )
        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_DEFAULT), 1)

        self.process_and_flush_pending_tasks()

    def test_cannot_clean_data_item_of_jobs_with_existing_running_cleanup_job(
            self):
        observed_log_messages = []

        def _mock_logging_function(msg, *args):
            """Mocks logging.warning()."""
            observed_log_messages.append(msg % args)

        logging_swap = self.swap(logging, 'warning', _mock_logging_function)

        self.login(self.ADMIN_EMAIL, is_super_admin=True)

        job_id = cron_services.MapReduceStateModelsCleanupManager.create_new()
        cron_services.MapReduceStateModelsCleanupManager.enqueue(job_id)
        self.run_but_do_not_flush_pending_tasks()

        self.assertEqual(
            cron_services.MapReduceStateModelsCleanupManager
            .get_status_code(job_id),
            jobs.STATUS_CODE_STARTED)

        with self.testapp_swap, logging_swap:
            self.get_html_response('/cron/jobs/cleanup')

        self.assertEqual(
            observed_log_messages,
            [
                '0 MR jobs cleaned up.',
                'A previous cleanup job is still running.',
                'Deletion jobs for JobModels entities kicked off.'
            ]
        )

    def test_cannot_run_job_models_cleanup_with_existing_running_cleanup_job(
            self):
        observed_log_messages = []

        def _mock_logging_function(msg, *args):
            """Mocks logging.warning()."""
            observed_log_messages.append(msg % args)

        logging_swap = self.swap(logging, 'warning', _mock_logging_function)

        self.login(self.ADMIN_EMAIL, is_super_admin=True)

        job_id = cron_services.JobModelsCleanupManager.create_new()
        cron_services.JobModelsCleanupManager.enqueue(job_id)
        self.run_but_do_not_flush_pending_tasks()

        self.assertEqual(
            cron_services.JobModelsCleanupManager.get_status_code(job_id),
            jobs.STATUS_CODE_STARTED)

        with self.testapp_swap, logging_swap:
            self.get_html_response('/cron/jobs/cleanup')

        self.assertEqual(
            observed_log_messages,
            [
                '0 MR jobs cleaned up.',
                'Deletion jobs for auxiliary MapReduce entities kicked off.',
                'A previous JobModels cleanup job is still running.'
            ]
        )


class JobModelsCleanupManagerTests(test_utils.GenericTestBase):

    JOB_1_ID = 'job_1_id'
    JOB_2_ID = 'job_2_id'
    JOB_3_ID = 'job_3_id'

    THIRTEEN_WEEKS = datetime.timedelta(weeks=13)

    def _run_one_off_job(self):
        """Runs the one-off MapReduce job."""
        job_id = cron_services.JobModelsCleanupManager.create_new()
        cron_services.JobModelsCleanupManager.enqueue(job_id)
        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_tasks()
        stringified_output = (
            cron_services.JobModelsCleanupManager.get_output(job_id))
        eval_output = [ast.literal_eval(stringified_item) for
                       stringified_item in stringified_output]
        return eval_output

    def setUp(self):
        super(JobModelsCleanupManagerTests, self).setUp()

        self.now_in_millisecs = utils.get_time_in_millisecs(
            datetime.datetime.utcnow())
        date_thirteen_weeks_ago = (
            datetime.datetime.utcnow() - self.THIRTEEN_WEEKS)
        self.thirteen_weeks_ago_in_millisecs = utils.get_time_in_millisecs(
            date_thirteen_weeks_ago)

    def test_delete_job_model_completed_older_than_12_weeks(self):
        job_models.JobModel(
            id=self.JOB_1_ID,
            time_finished_msec=self.thirteen_weeks_ago_in_millisecs,
            status_code=job_models.STATUS_CODE_COMPLETED
        ).put()

        output = self._run_one_off_job()
        self.assertItemsEqual(
            output, [['SUCCESS_DELETED', 1], ['SUCCESS_KEPT', 1]])

        self.assertIsNone(job_models.JobModel.get_by_id(self.JOB_1_ID))

    def test_delete_job_model_failed_older_than_12_weeks(self):
        job_models.JobModel(
            id=self.JOB_1_ID,
            time_finished_msec=self.thirteen_weeks_ago_in_millisecs,
            status_code=job_models.STATUS_CODE_FAILED
        ).put()

        output = self._run_one_off_job()
        self.assertItemsEqual(
            output, [['SUCCESS_DELETED', 1], ['SUCCESS_KEPT', 1]])

        self.assertIsNone(job_models.JobModel.get_by_id(self.JOB_1_ID))

    def test_delete_job_model_canceled_older_than_12_weeks(self):
        job_models.JobModel(
            id=self.JOB_1_ID,
            time_finished_msec=self.thirteen_weeks_ago_in_millisecs,
            status_code=job_models.STATUS_CODE_CANCELED
        ).put()

        output = self._run_one_off_job()
        self.assertItemsEqual(
            output, [['SUCCESS_DELETED', 1], ['SUCCESS_KEPT', 1]])

        self.assertIsNone(job_models.JobModel.get_by_id(self.JOB_1_ID))

    def test_keep_job_model_canceled_younger_than_12_weeks(self):
        job_models.JobModel(
            id=self.JOB_1_ID,
            time_finished_msec=self.now_in_millisecs,
            status_code=job_models.STATUS_CODE_CANCELED
        ).put()

        output = self._run_one_off_job()
        self.assertEqual(output, [['SUCCESS_KEPT', 2]])

        self.assertIsNotNone(job_models.JobModel.get_by_id(self.JOB_1_ID))
