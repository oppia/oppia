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

from __future__ import absolute_import
from __future__ import unicode_literals

from core.controllers import acl_decorators
from core.controllers import base
from core.domain import config_domain
from core.domain import cron_services
from core.domain import email_manager
from core.domain import suggestion_services
from core.domain import user_services
import feconf


class CronModelsCleanupHandler(base.BaseHandler):
    """Handler for cleaning up models that are marked as deleted and marking
    specific types of models as deleted.
    """

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {}
    HANDLER_ARGS_SCHEMAS = {'GET': {}}

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

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {}
    HANDLER_ARGS_SCHEMAS = {'GET': {}}

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

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {}
    HANDLER_ARGS_SCHEMAS = {'GET': {}}

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
                feconf.ROLE_ID_CURRICULUM_ADMIN)
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
                feconf.ROLE_ID_CURRICULUM_ADMIN)
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
