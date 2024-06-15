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

from __future__ import annotations

from core import feconf
from core.constants import constants
from core.controllers import acl_decorators
from core.controllers import base
from core.domain import app_feedback_report_services
from core.domain import beam_job_services
from core.domain import cron_services
from core.domain import email_manager
from core.domain import platform_parameter_list
from core.domain import platform_parameter_services
from core.domain import story_services
from core.domain import suggestion_registry
from core.domain import suggestion_services
from core.domain import taskqueue_services
from core.domain import user_services
from core.jobs.batch_jobs import blog_post_search_indexing_jobs
from core.jobs.batch_jobs import exp_recommendation_computation_jobs
from core.jobs.batch_jobs import exp_search_indexing_jobs
from core.jobs.batch_jobs import user_stats_computation_jobs

from typing import DefaultDict, Dict, List


class CronModelsCleanupHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Handler for cleaning up models that are marked as deleted and marking
    specific types of models as deleted.
    """

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.can_perform_cron_tasks
    def get(self) -> None:
        """Cron handler that hard-deletes all models that were marked as deleted
        (have deleted field set to True) more than some period of time ago.
        Also, for some types of models (that we shouldn't keep for long time)
        mark them as deleted if they were last updated more than some period
        of time ago.

        The time periods are specified in the cron_services as a constant.
        """
        cron_services.delete_models_marked_as_deleted()
        cron_services.mark_outdated_models_as_deleted()
        return self.render_json({})


class CronUserDeletionHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Handler for running the user deletion one off job."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.can_perform_cron_tasks
    def get(self) -> None:
        """Handles GET requests."""
        taskqueue_services.defer(
            taskqueue_services.FUNCTION_ID_DELETE_USERS_PENDING_TO_BE_DELETED,
            taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS)
        return self.render_json({})


class CronFullyCompleteUserDeletionHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Handler for running the fully complete user deletion one off job."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.can_perform_cron_tasks
    def get(self) -> None:
        """Handles GET requests."""
        taskqueue_services.defer(
            taskqueue_services.FUNCTION_ID_CHECK_COMPLETION_OF_USER_DELETION,
            taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS)
        return self.render_json({})


class CronMailReviewersContributorDashboardSuggestionsHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Handler for mailing reviewers suggestions on the Contributor
    Dashboard that need review.
    """

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.can_perform_cron_tasks
    def get(self) -> None:
        """Sends each reviewer an email with up to
        suggestion_services.MAX_NUMBER_OF_SUGGESTIONS_TO_EMAIL_REVIEWER
        suggestions that have been waiting the longest for review, based on
        their reviewing permissions.
        """
        # Only execute this job if it's possible to send the emails and there
        # are reviewers to notify.
        server_can_send_emails = (
            platform_parameter_services.get_platform_parameter_value(
                platform_parameter_list.ParamName.
                SERVER_CAN_SEND_EMAILS.value
            )
        )
        if not server_can_send_emails:
            return self.render_json({})
        if not platform_parameter_services.get_platform_parameter_value(
            platform_parameter_list.ParamName.
            CONTRIBUTOR_DASHBOARD_REVIEWER_EMAILS_IS_ENABLED.value
        ):
            return self.render_json({})
        reviewer_ids = user_services.get_reviewer_user_ids_to_notify()
        if not reviewer_ids:
            return self.render_json({})

        reviewers_suggestion_email_infos = (
            suggestion_services
            .get_suggestions_waiting_for_review_info_to_notify_reviewers(
                reviewer_ids))
        email_manager.send_mail_to_notify_contributor_dashboard_reviewers(
            reviewer_ids, reviewers_suggestion_email_infos)
        return self.render_json({})


class CronMailAdminContributorDashboardBottlenecksHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Handler for mailing admins if there are bottlenecks that are causing a
    longer reviewer turnaround time on the Contributor Dashboard.
    """

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.can_perform_cron_tasks
    def get(self) -> None:
        """Sends each admin up to two emails: an email to alert the admins that
        there are suggestion types that need more reviewers and/or an email
        to alert the admins that specific suggestions have been waiting too long
        to get reviewed.
        """
        server_can_send_emails = (
            platform_parameter_services.get_platform_parameter_value(
                platform_parameter_list.ParamName.SERVER_CAN_SEND_EMAILS.value))
        if not server_can_send_emails:
            return self.render_json({})

        admin_ids = user_services.get_user_ids_by_role(
            feconf.ROLE_ID_CURRICULUM_ADMIN)
        question_admin_ids = user_services.get_user_ids_by_role(
            feconf.ROLE_ID_QUESTION_ADMIN)
        translation_admin_ids = user_services.get_user_ids_by_role(
            feconf.ROLE_ID_TRANSLATION_ADMIN)

        if platform_parameter_services.get_platform_parameter_value(
            platform_parameter_list.ParamName.
            ENABLE_ADMIN_NOTIFICATIONS_FOR_REVIEWER_SHORTAGE.value
        ):
            suggestion_types_needing_reviewers = (
                suggestion_services
                .get_suggestion_types_that_need_reviewers()
            )
            email_manager.send_mail_to_notify_admins_that_reviewers_are_needed(
                admin_ids,
                translation_admin_ids,
                question_admin_ids,
                suggestion_types_needing_reviewers)

        if platform_parameter_services.get_platform_parameter_value(
            platform_parameter_list.ParamName.
            ENABLE_ADMIN_NOTIFICATIONS_FOR_SUGGESTIONS_NEEDING_REVIEW.value
        ):
            info_about_suggestions_waiting_too_long_for_review = (
                suggestion_services
                .get_info_about_suggestions_waiting_too_long_for_review()
            )
            (
                email_manager
                .send_mail_to_notify_admins_suggestions_waiting_long(
                    admin_ids,
                    translation_admin_ids,
                    question_admin_ids,
                    info_about_suggestions_waiting_too_long_for_review)
            )
        return self.render_json({})


class CronMailReviewerNewSuggestionsHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Handler for mailing reviewers about new suggestions
    on the Contributor Dashboard.
    """

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.can_perform_cron_tasks
    def get(self) -> None:
        """Sends email notifications to reviewers about new
        suggestions on the Contributor Dashboard.
        """
        server_can_send_emails = (
            platform_parameter_services.get_platform_parameter_value(
                platform_parameter_list.ParamName.SERVER_CAN_SEND_EMAILS.value))
        if not server_can_send_emails:
            return self.render_json({})

        if not platform_parameter_services.get_platform_parameter_value(
            platform_parameter_list.ParamName.
            CONTRIBUTOR_DASHBOARD_REVIEWER_EMAILS_IS_ENABLED.value
        ):
            return self.render_json({})

        new_suggestions_info = (
            suggestion_services
                .get_new_suggestions_for_reviewer_notifications())

        # Initialize dictionaries to organize data.
        reviewer_ids_by_language: DefaultDict[
            str, List[str]] = DefaultDict(list)
        suggestions_by_language: DefaultDict[
            str, List[
                suggestion_registry.
                    ReviewableSuggestionEmailInfo]] = DefaultDict(list)

        for suggestion in new_suggestions_info:
            language_property = suggestion.language_code

            # Collect reviewer IDs.
            reviewer_usernames = user_services.get_contributor_usernames(
                constants.CD_USER_RIGHTS_CATEGORY_REVIEW_TRANSLATION,
                language_property
            )

            reviewer_ids = [
                user_services.get_user_id_from_username(
                    username) for username in reviewer_usernames]
            filtered_reviewer_ids = [
                id for id in reviewer_ids if id is not None]
            reviewer_ids_by_language[language_property].extend(
                filtered_reviewer_ids)

            # Collect suggestions.
            suggestions_by_language[language_property].append(suggestion)

        # Send email notifications to reviewers based on the organized data.
        email_manager.send_reviewer_notifications(
            reviewer_ids_by_language, suggestions_by_language)

        return self.render_json({})


class CronAppFeedbackReportsScrubberHandlerPage(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Handler for scrubbing app feedback reports that are expiring."""

    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.can_perform_cron_tasks
    def get(self) -> None:
        """Handles GET requests to scrub reports. This cron handler scrubs all
        app feedback report models that are expiring; expired reports have a
        created_on field at least feconf.APP_FEEDBACK_REPORT_MAX_NUMBER_OF_DAYS
        before tthe date this services is called.
        """
        app_feedback_report_services.scrub_all_unscrubbed_expiring_reports(
            feconf.APP_FEEDBACK_REPORT_SCRUBBER_BOT_ID)


class CronDashboardStatsHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Handler for appending dashboard stats to a list."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.can_perform_cron_tasks
    def get(self) -> None:
        """Handles GET requests."""
        beam_job_services.run_beam_job(
            job_class=(
                user_stats_computation_jobs.CollectWeeklyDashboardStatsJob))


class CronExplorationRecommendationsHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Handler for computing exploration recommendations."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.can_perform_cron_tasks
    def get(self) -> None:
        """Handles GET requests."""
        beam_job_services.run_beam_job(
            job_class=(
                exp_recommendation_computation_jobs
                .ComputeExplorationRecommendationsJob))


class CronActivitySearchRankHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Handler for computing activity search ranks."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.can_perform_cron_tasks
    def get(self) -> None:
        """Handles GET requests."""
        beam_job_services.run_beam_job(
            job_class=exp_search_indexing_jobs.IndexExplorationsInSearchJob)


class CronBlogPostSearchRankHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Handler for indexing blog post in search handler."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.can_perform_cron_tasks
    def get(self) -> None:
        """Handles GET requests."""
        beam_job_services.run_beam_job(
            job_class=blog_post_search_indexing_jobs.IndexBlogPostsInSearchJob
        )


class CronMailChapterPublicationsNotificationsHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Handler for mailing curriculum admins to remind them about behind
    schedule and upcoming (within CHAPTER_PUBLICATION_NOTICE_PERIOD_IN_DAYS
    days) chapter launches.
    """

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.can_perform_cron_tasks
    def get(self) -> None:
        """Sends each curriculum admin mail to notify them about behind schedule
        and upcoming (within CHAPTER_PUBLICATION_NOTICE_PERIOD_IN_DAYS days)
        chapter launches.
        """
        server_can_send_emails = (
            platform_parameter_services.get_platform_parameter_value(
                platform_parameter_list.ParamName.SERVER_CAN_SEND_EMAILS.value))
        if not server_can_send_emails:
            return self.render_json({})

        admin_ids = user_services.get_user_ids_by_role(
            feconf.ROLE_ID_CURRICULUM_ADMIN)
        chapter_notifications_stories_list = (
            story_services.get_chapter_notifications_stories_list())
        email_manager.send_reminder_mail_to_notify_curriculum_admins(
            admin_ids, chapter_notifications_stories_list)
        return self.render_json({})
