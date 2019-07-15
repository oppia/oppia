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

import logging

from core import jobs
from core.controllers import cron
from core.domain import cron_services
from core.domain import email_manager
from core.domain import exp_fetchers
from core.domain import state_domain
from core.domain import suggestion_services
from core.platform import models
from core.platform.taskqueue import gae_taskqueue_services as taskqueue_services
from core.tests import test_utils
import feconf
import main_cron

from mapreduce import model as mapreduce_model
import webtest

(job_models, suggestion_models,) = models.Registry.import_models(
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
                'Deletion jobs for auxiliary entities kicked off.'
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

        job_id = cron_services.JobCleanupManager.create_new()
        cron_services.JobCleanupManager.enqueue(job_id)
        self.run_but_do_not_flush_pending_tasks()

        self.assertEqual(
            cron_services.JobCleanupManager.get_status_code(job_id),
            jobs.STATUS_CODE_STARTED)

        with self.testapp_swap, logging_swap:
            self.get_html_response('/cron/jobs/cleanup')

        self.assertEqual(
            observed_log_messages,
            [
                '0 MR jobs cleaned up.',
                'A previous cleanup job is still running.'
            ]
        )

    def test_cron_accept_stale_suggestions_handler(self):
        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        self.save_new_valid_exploration(
            'exp_id', self.admin_id, title='A title', category='Algebra')

        new_content = state_domain.SubtitledHtml(
            'content', '<p>new suggestion content</p>').to_dict()
        change = {
            'cmd': 'edit_state_property',
            'property_name': 'content',
            'state_name': 'Introduction',
            'new_value': new_content
        }
        suggestion_services.create_suggestion(
            suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
            suggestion_models.TARGET_TYPE_EXPLORATION,
            'exp_id', 1,
            feconf.SYSTEM_COMMITTER_ID, change, 'change title', None)

        exploration = exp_fetchers.get_exploration_by_id('exp_id')
        self.assertEqual(
            exploration.states['Introduction'].content.to_dict(), {
                'content_id': 'content',
                'html': ''
            }
        )

        threshold_time_before_accept_swap = self.swap(
            suggestion_models, 'THRESHOLD_TIME_BEFORE_ACCEPT_IN_MSECS', 0)
        auto_accept_suggestions_swap = self.swap(
            feconf, 'ENABLE_AUTO_ACCEPT_OF_SUGGESTIONS', True)

        with threshold_time_before_accept_swap, self.testapp_swap, (
            auto_accept_suggestions_swap):
            self.assertEqual(
                len(suggestion_services.get_all_stale_suggestions()), 1)
            self.get_html_response('/cron/suggestions/accept_stale_suggestions')

            self.assertEqual(
                len(suggestion_services.get_all_stale_suggestions()), 0)

        exploration = exp_fetchers.get_exploration_by_id('exp_id')
        self.assertEqual(
            exploration.states['Introduction'].content.to_dict(), {
                'content_id': 'content',
                'html': '<p>new suggestion content</p>'
            }
        )

    def test_cron_mail_reviewers_in_rotation_handler(self):
        self.login(self.ADMIN_EMAIL, is_super_admin=True)

        reviewer_ids = []
        score_categories = []

        def _mock_send_mail_to_notify_users_to_review(
                reviewer_id, score_category):
            """Mocks email_manager.send_mail_to_notify_users_to_review() as its
            not possible to send mail with self.testapp_swap, i.e with the URLs
            defined in main_cron.
            """
            reviewer_ids.append(reviewer_id)
            score_categories.append(score_category)

        send_mail_to_notify_users_to_review_swap = self.swap(
            email_manager, 'send_mail_to_notify_users_to_review',
            _mock_send_mail_to_notify_users_to_review)

        self.save_new_valid_exploration(
            'exp_id', self.admin_id, title='A title', category='Algebra')

        new_content = state_domain.SubtitledHtml(
            'content', '<p>new suggestion content</p>').to_dict()
        change = {
            'cmd': 'edit_state_property',
            'property_name': 'content',
            'state_name': 'Introduction',
            'new_value': new_content
        }
        suggestion_services.create_suggestion(
            suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
            suggestion_models.TARGET_TYPE_EXPLORATION,
            'exp_id', 1,
            feconf.SYSTEM_COMMITTER_ID, change, 'change title', self.admin_id)

        exploration = exp_fetchers.get_exploration_by_id('exp_id')
        self.assertEqual(
            exploration.states['Introduction'].content.to_dict(), {
                'content_id': 'content',
                'html': ''
            }
        )

        suggestion = suggestion_services.query_suggestions(
            [('author_id', feconf.SYSTEM_COMMITTER_ID),
             ('target_id', 'exp_id')])[0]
        suggestion_services.accept_suggestion(
            suggestion, self.admin_id,
            suggestion_models.DEFAULT_SUGGESTION_ACCEPT_MESSAGE, None)

        exploration = exp_fetchers.get_exploration_by_id('exp_id')
        self.assertEqual(
            exploration.states['Introduction'].content.to_dict(), {
                'content_id': 'content',
                'html': '<p>new suggestion content</p>'
            }
        )

        send_suggestion_review_related_emails_swap = self.swap(
            feconf, 'SEND_SUGGESTION_REVIEW_RELATED_EMAILS', True)

        with self.testapp_swap, send_suggestion_review_related_emails_swap, (
            send_mail_to_notify_users_to_review_swap):
            self.get_html_response('/cron/suggestions/notify_reviewers')

        self.assertEqual(reviewer_ids, [None])
        self.assertEqual(score_categories, ['content.Algebra'])
