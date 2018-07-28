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

import logging

from core import jobs
from core.controllers import base
from core.domain import acl_decorators
from core.domain import activity_jobs_one_off
from core.domain import email_manager
from core.domain import recommendations_jobs_one_off
from core.domain import suggestion_services
from core.domain import user_jobs_one_off
from core.platform import models
import feconf
import utils

from pipeline import pipeline

(job_models, suggestion_models) = models.Registry.import_models([
    models.NAMES.job, models.NAMES.suggestion])

# The default retention time is 2 days.
MAX_MAPREDUCE_METADATA_RETENTION_MSECS = 2 * 24 * 60 * 60 * 1000
TWENTY_FIVE_HOURS_IN_MSECS = 25 * 60 * 60 * 1000
MAX_JOBS_TO_REPORT_ON = 50


class JobStatusMailerHandler(base.BaseHandler):
    """Handler for mailing admin about job failures."""

    @acl_decorators.can_perform_cron_tasks
    def get(self):
        """Handles GET requests."""
        # TODO(sll): Get the 50 most recent failed shards, not all of them.
        failed_jobs = jobs.get_stuck_jobs(TWENTY_FIVE_HOURS_IN_MSECS)
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
        recency_msec = MAX_MAPREDUCE_METADATA_RETENTION_MSECS

        num_cleaned = 0

        min_age_msec = recency_msec
        # Only consider jobs that started at most 1 week before recency_msec.
        max_age_msec = recency_msec + 7 * 24 * 60 * 60 * 1000
        # The latest start time that a job scheduled for cleanup may have.
        max_start_time_msec = (
            utils.get_current_time_in_millisecs() - min_age_msec)

        # Get all pipeline ids from jobs that started between max_age_msecs
        # and max_age_msecs + 1 week, before now.
        pipeline_id_to_job_instance = {}

        job_instances = job_models.JobModel.get_recent_jobs(1000, max_age_msec)
        for job_instance in job_instances:
            if (job_instance.time_started_msec < max_start_time_msec and not
                    job_instance.has_been_cleaned_up):
                if 'root_pipeline_id' in job_instance.metadata:
                    pipeline_id = job_instance.metadata['root_pipeline_id']
                    pipeline_id_to_job_instance[pipeline_id] = job_instance

        # Clean up pipelines.
        for pline in pipeline.get_root_list()['pipelines']:
            pipeline_id = pline['pipelineId']
            job_definitely_terminated = (
                pline['status'] == 'done' or
                pline['status'] == 'aborted' or
                pline['currentAttempt'] > pline['maxAttempts'])
            have_start_time = 'startTimeMs' in pline
            job_started_too_long_ago = (
                have_start_time and
                pline['startTimeMs'] < max_start_time_msec)

            if (job_started_too_long_ago or
                    (not have_start_time and job_definitely_terminated)):
                # At this point, the map/reduce pipeline is either in a
                # terminal state, or has taken so long that there's no
                # realistic possibility that there might be a race condition
                # between this and the job actually completing.
                if pipeline_id in pipeline_id_to_job_instance:
                    job_instance = pipeline_id_to_job_instance[pipeline_id]
                    job_instance.has_been_cleaned_up = True
                    job_instance.put()

                # This enqueues a deferred cleanup item.
                p = pipeline.Pipeline.from_id(pipeline_id)
                if p:
                    p.cleanup()
                    num_cleaned += 1

        logging.warning('%s MR jobs cleaned up.' % num_cleaned)

        if job_models.JobModel.do_unfinished_jobs_exist(
                jobs.JobCleanupManager.__name__):
            logging.warning('A previous cleanup job is still running.')
        else:
            jobs.JobCleanupManager.enqueue(
                jobs.JobCleanupManager.create_new(), additional_job_params={
                    jobs.MAPPER_PARAM_MAX_START_TIME_MSEC: max_start_time_msec
                })
            logging.warning('Deletion jobs for auxiliary entities kicked off.')


class CronAcceptStaleSuggestionsHandler(base.BaseHandler):
    """Handler to accept suggestions that have no activity on them for
    THRESHOLD_TIME_BEFORE_ACCEPT time.
    """

    @acl_decorators.can_perform_cron_tasks
    def get(self):
        """Handles get requests."""
        if feconf.ENABLE_AUTO_ACCEPT_OF_SUGGESTIONS:
            suggestions = suggestion_services.get_all_stale_suggestions()
            for suggestion in suggestions:
                suggestion_services.accept_suggestion(
                    suggestion, feconf.SUGGESTION_BOT_USER_ID,
                    suggestion_models.DEFAULT_SUGGESTION_ACCEPT_MESSAGE, None)


class CronMailReviewersInRotationHandler(base.BaseHandler):
    """Handler to send emails notifying reviewers that there are suggestions
    that need reviews.
    """

    @acl_decorators.can_perform_cron_tasks
    def get(self):
        """Handles get requests."""
        score_categories = suggestion_models.get_all_score_categories()
        for score_category in score_categories:
            suggestions = suggestion_services.query_suggestions(
                [('score_category', score_category),
                 ('status', suggestion_models.STATUS_ACCEPTED)])
            if len(suggestions) > 0:
                reviewer_id = suggestion_services.get_next_user_in_rotation(
                    score_category)
                print reviewer_id
                # Email reviewer_id.
