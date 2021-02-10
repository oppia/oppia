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

"""Controllers for the cron jobs."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import logging

from core import jobs
from core.controllers import acl_decorators
from core.controllers import base
from core.domain import activity_jobs_one_off
from core.domain import config_domain
from core.domain import cron_services
from core.domain import email_manager
from core.domain import recommendations_jobs_one_off
from core.domain import suggestion_services
from core.domain import user_jobs_one_off
from core.domain import user_services
from core.domain import wipeout_jobs_one_off
import feconf
import utils

TWENTY_FIVE_HOURS_IN_MSECS = 25 * 60 * 60 * 1000
MAX_JOBS_TO_REPORT_ON = 50


class JobStatusMailerHandler(base.BaseHandler):
    """Handler for mailing admin about job failures."""

    @acl_decorators.can_perform_cron_tasks
    def get(self):
        """Handles GET requests."""
        # TODO(sll): Get the 50 most recent failed shards, not all of them.
        failed_jobs = cron_services.get_stuck_jobs(TWENTY_FIVE_HOURS_IN_MSECS)
        if failed_jobs:
            email_subject = 'MapReduce failure alert'
            email_message = (
                '%s jobs have failed in the past 25 hours. More information '
                '(about at most %s jobs; to see more, please check the logs):'
            ) % (len(failed_jobs), MAX_JOBS_TO_REPORT_ON)

            for job in failed_jobs[:MAX_JOBS_TO_REPORT_ON]:
                email_message += '\n'
                email_message += '-----------------------------------'
                email_message += '\n'
                email_message += (
                    'Job with mapreduce ID %s (key name %s) failed. '
                    'More info:\n\n'
                    '  counters_map: %s\n'
                    '  shard_retries: %s\n'
                    '  slice_retries: %s\n'
                    '  last_update_time: %s\n'
                    '  last_work_item: %s\n'
                ) % (
                    job.mapreduce_id, job.key().name(), job.counters_map,
                    job.retries, job.slice_retries, job.update_time,
                    job.last_work_item
                )
        else:
            email_subject = 'MapReduce status report'
            email_message = 'All MapReduce jobs are running fine.'

        email_manager.send_mail_to_admin(email_subject, email_message)


class CronDashboardStatsHandler(base.BaseHandler):
    """Handler for appending dashboard stats to a list."""

    @acl_decorators.can_perform_cron_tasks
    def get(self):
        """Handles GET requests."""
        user_jobs_one_off.DashboardStatsOneOffJob.enqueue(
            user_jobs_one_off.DashboardStatsOneOffJob.create_new())


class CronUserDeletionHandler(base.BaseHandler):
    """Handler for running the user deletion one off job."""

    @acl_decorators.can_perform_cron_tasks
    def get(self):
        """Handles GET requests."""
        wipeout_jobs_one_off.UserDeletionOneOffJob.enqueue(
            wipeout_jobs_one_off.UserDeletionOneOffJob.create_new())


class CronFullyCompleteUserDeletionHandler(base.BaseHandler):
    """Handler for running the fully complete user deletion one off job."""

    @acl_decorators.can_perform_cron_tasks
    def get(self):
        """Handles GET requests."""
        wipeout_jobs_one_off.FullyCompleteUserDeletionOneOffJob.enqueue(
            wipeout_jobs_one_off.FullyCompleteUserDeletionOneOffJob
            .create_new()
        )


class CronExplorationRecommendationsHandler(base.BaseHandler):
    """Handler for computing exploration recommendations."""

    @acl_decorators.can_perform_cron_tasks
    def get(self):
        """Handles GET requests."""
        job_class = (
            recommendations_jobs_one_off.ExplorationRecommendationsOneOffJob)
        job_class.enqueue(job_class.create_new())


class CronActivitySearchRankHandler(base.BaseHandler):
    """Handler for computing activity search ranks."""

    @acl_decorators.can_perform_cron_tasks
    def get(self):
        """Handles GET requests."""
        activity_jobs_one_off.IndexAllActivitiesJobManager.enqueue(
            activity_jobs_one_off.IndexAllActivitiesJobManager.create_new())


class CronMapreduceCleanupHandler(base.BaseHandler):
    """Handler for cleaning up data items of completed map/reduce jobs."""

    @acl_decorators.can_perform_cron_tasks
    def get(self):
        """Clean up intermediate data items for completed M/R jobs that
        started more than MAX_MAPREDUCE_METADATA_RETENTION_MSECS milliseconds
        ago.

        Map/reduce runs leave around a large number of rows in several
        tables.  This data is useful to have around for a while:
        - it helps diagnose any problems with jobs that may be occurring
        - it shows where resource usage is occurring
        However, after a few days, this information is less relevant, and
        should be cleaned up.
        """
        # Only consider jobs that started at most 1 week before recency_msec.
        # The latest start time that a job scheduled for cleanup may have.
        max_start_time_msec = (
            utils.get_current_time_in_millisecs() -
            jobs.MAX_MAPREDUCE_METADATA_RETENTION_MSECS
        )

        jobs.cleanup_old_jobs_pipelines()

        if jobs.do_unfinished_jobs_exist(
                cron_services.MapReduceStateModelsCleanupManager.__name__):
            logging.warning('A previous cleanup job is still running.')
        else:
            cron_services.MapReduceStateModelsCleanupManager.enqueue(
                cron_services.MapReduceStateModelsCleanupManager.create_new(),
                additional_job_params={
                    jobs.MAPPER_PARAM_MAX_START_TIME_MSEC: max_start_time_msec
                })
            logging.warning(
                'Deletion jobs for auxiliary MapReduce entities kicked off.')

        if jobs.do_unfinished_jobs_exist(
                cron_services.JobModelsCleanupManager.__name__):
            logging.warning(
                'A previous JobModels cleanup job is still running.')
        else:
            cron_services.JobModelsCleanupManager.enqueue(
                cron_services.JobModelsCleanupManager.create_new())
            logging.warning('Deletion jobs for JobModels entities kicked off.')


class CronModelsCleanupHandler(base.BaseHandler):
    """Handler for cleaning up models that are marked as deleted and marking
    specific types of models as deleted.
    """

    @acl_decorators.can_perform_cron_tasks
    def get(self):
        """Cron handler that hard-deletes all models that were marked as deleted
        (have deleted field set to True) more than some period of time ago.
        Also, for some types of models (that we shouldn't keep for long time)
        mark them as deleted if they were last updated more than some period
        of time ago.

        The time periods are specified in the cron_services as a constant.
        """
        cron_services.delete_models_marked_as_deleted()
        cron_services.mark_outdated_models_as_deleted()


class CronMailReviewersContributorDashboardSuggestionsHandler(
        base.BaseHandler):
    """Handler for mailing reviewers suggestions on the Contributor
    Dashboard that need review.
    """

    @acl_decorators.can_perform_cron_tasks
    def get(self):
        """Sends each reviewer an email with up to
        suggestion_services.MAX_NUMBER_OF_SUGGESTIONS_TO_EMAIL_REVIEWER
        suggestions that have been waiting the longest for review, based on
        their reviewing permissions.
        """
        # Only execute this job if it's possible to send the emails and there
        # are reviewers to notify.
        if not feconf.CAN_SEND_EMAILS:
            return
        if not (config_domain
                .CONTRIBUTOR_DASHBOARD_REVIEWER_EMAILS_IS_ENABLED.value):
            return
        reviewer_ids = user_services.get_reviewer_user_ids_to_notify()
        if not reviewer_ids:
            return
        reviewers_suggestion_email_infos = (
            suggestion_services
            .get_suggestions_waiting_for_review_info_to_notify_reviewers(
                reviewer_ids))
        email_manager.send_mail_to_notify_contributor_dashboard_reviewers(
            reviewer_ids, reviewers_suggestion_email_infos)


class CronMailAdminContributorDashboardBottlenecksHandler(
        base.BaseHandler):
    """Handler for mailing admins if there are bottlenecks that are causing a
    longer reviewer turnaround time on the Contributor Dashboard.
    """

    @acl_decorators.can_perform_cron_tasks
    def get(self):
        """Sends each admin up to two emails: an email to alert the admins that
        there are suggestion types that need more reviewers and/or an email
        to alert the admins that specific suggestions have been waiting too long
        to get reviewed.
        """
        if not feconf.CAN_SEND_EMAILS:
            return

        if (
                config_domain
                .ENABLE_ADMIN_NOTIFICATIONS_FOR_REVIEWER_SHORTAGE.value):
            admin_ids = user_services.get_user_ids_by_role(
                feconf.ROLE_ID_ADMIN)
            suggestion_types_needing_reviewers = (
                suggestion_services
                .get_suggestion_types_that_need_reviewers()
            )
            email_manager.send_mail_to_notify_admins_that_reviewers_are_needed(
                admin_ids, suggestion_types_needing_reviewers)
        if (
                config_domain
                .ENABLE_ADMIN_NOTIFICATIONS_FOR_SUGGESTIONS_NEEDING_REVIEW
                .value):
            admin_ids = user_services.get_user_ids_by_role(
                feconf.ROLE_ID_ADMIN)
            info_about_suggestions_waiting_too_long_for_review = (
                suggestion_services
                .get_info_about_suggestions_waiting_too_long_for_review()
            )
            (
                email_manager
                .send_mail_to_notify_admins_suggestions_waiting_long(
                    admin_ids,
                    info_about_suggestions_waiting_too_long_for_review)
            )
