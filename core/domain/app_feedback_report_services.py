# coding: utf-8
#
# Copyright 2021 The Oppia Authors. All Rights Reserved.
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

"""Services to operate on app feedback report models."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.domain import app_feedback_report_domain
from core.model import app_feedback_report_models
from core.platform import models

import utils

(app_feedback_report_models,) = models.Registry.import_models(
    [models.NAMES.app_feedback_report])
transaction_services = models.Registry.import_transaction_services()


def save_incoming_report(report, report_stats):
    """Saves an incoming report and updates the aggregate report stats with the
    new report's data.

    Args:
        report: AppFeedbackReport. AppFeedbackReport domain object.
        report_stats: AppFeedbackReportStats. AppFeedbackReportStats domain
            object.
    """
    _save_report_instance(report)
    _save_report_stats_instance(report_stats)


def _save_report_instance(report)
    """Creates and stores a new AppFeedbackReportModel instance.

    Args:
        report: AppFeedbackReport. AppFeedbackReport domain object.
    """
    report.validate()
    model_entity_id = app_feedback_report_models.AppFeedbackReportModel.create(

    )


def _save_report_stats_instance(report_stats)
    """Creates and stores a new AppFeedbackReportModel instance.

    Args:
        report: AppFeedbackReport. AppFeedbackReport domain object.
    """
    report_stats.validate()
    stats_entity_id = (
        app_feedback_report_models.AppFeedbackReportStatsModel.create(

    ))


def get_report_from_model(report_model)
    """Create and return a domain object AppFeedbackReport given a model loaded
    from the the dasta.

    Args:
        report_model: AppFeedbackReportModel. The model loaded from the
            datastore.

    Returns:
        AppFeedbackReport. An AppFeedbackReport domain object corresponding to
        the given model.
    """
    if report_model.platform == (
        app_feedback_report_models.PLATFORM_CHOICE_ANDROID):
        return _get_android_report_from_model(report_model)
    else:
        return  _get_web_report_from_model(report_model)


def _get_android_report_from_model(android_report_model):
    if android_report_model.android_report_info_schema_version < (
        feconf.CURRENT_ANDROID_REPORT_SCHEMA_VERSION):
        raise NotImplementedError(
            'Android app feedback report migrations must be added for new '
            'report schemas implemented.')
    report_info_dict = android_report_model.android_report_info
    user_supplied_feedback = app_feedback_report_domain.UserSuppliedFeedback(
        android_report_model.report_type, android_report_model.category,
        report_info_dict['user_feedback_selected_items'],
        report_info_dict['user_feedback_other_text_input']
    )
    device_system_context = (
        app_feedback_report_domain.AndroidDeviceSystemContext(
            android_report_model.version_name,
            report_info_dict['package_version_code'],
            android_report_model.android_device_country_locale_code,
            report_info_dict['android_device_language_locale_code'],
            report_info_dict['device_model'],
            android_report_model.android_sdk_version,
            report_info_dict['build_fingerprint'],
            report_info_dict['network_type']))
    entry_point = _get_entry_point(android_report_model.entry_point)
    app_context = app_feedback_report_domain.AndroidAppContext(
        entry_point, android_report_model.text_language_code,
        android_report_model.audio_language_code, report_info_dict['text_size'],
        report_info_dict['only_allows_wifi_download_and_update'],
        report_info_dict['automatically_update_topics'],
        report_info_dict['account_is_profile_admin'],
        report_info_dict['event_logs'], report_info_dict['logcat_logs'])
    return app_feedback_report_domain.AppFeedbackReport(
        android_report_model.id, android_report_model.platform,
        android_report_model.report_submitted_timestamp,
        android_report_model.ticket_id, android_report_model.scrubbed_by,
        user_supplied_feedback, device_system_context, app_context)


def _get_web_report_from_model(web_report_model):
    if web_report_model.android_report_info_schema_version < (
        feconf.CURRENT_WEB_REPORT_SCHEMA_VERSION):
        raise NotImplementedError(
            'Web app feedback report migrations must be added for new '
            'report schemas implemented.')
    raise NotImplementedError(
        'Web app feedback report domain objects must be defined.')


def _get_entry_point(
        entry_point_name, topic_id, story_id, exploration_id, subtopic_id):
    if entry_point_name == (
        app_feedback_report_domain.ENTRY_POINT.navigation_drawer):
        return app_feedback_report_domain.NavigationDrawerEntryPoint()
    elif entry_point_name == (
        app_feedback_report_domain.ENTRY_POINT.lesson_player):
        return app_feedback_report_domain.LessonPlayerEntryPoint(
            topic_id, story_id, exploration_id)
    elif entry_point_name == (
        app_feedback_report_domain.ENTRY_POINT.revision_card):
        return app_feedback_report_domain.LessonPlayerEntryPoint(
            topic_id, subtopic_id)
    elif entry_point_name == app_feedback_report_domain.ENTRY_POINT.crash:
        return app_feedback_report_domain.CrashEntryPoint()
    else:
        raise utils.InvalidInputException(
            "Received unexpected entry point type.")


def is_ex


// Called when an admin triages reports; updates the assigned ticket in the
// AppFeedbackReportModel and modifies the AppFeedbackReportStatsModel so that
// aggregates are accurate (occurs in a transaction)
def reassign_ticket(report_id, ticket_id)

// Called when updates a ticket name. Updates the entity in the
// AppFeedbackReportTicketModel and the relevant tickets in the
// AppFeedbackReportModel (both occurs in a transaction)>
def edit_ticket_name(ticket_id)

// Called when an maintainer needs to scrub a report or if the report is expiring
// (occurs in a transaction)
def scrub_report(report_id)

// Fetches and processes the next batch of reports maintainers want to view and
// returns a list of FeedbackReports.
def get_next_batch_of_reports(active_filters, page_num, cursor):
   list<FeedbackReport>

// Fetches and processes the next batch of reports maintainers want to view.
// Returns a list of FeedbackReportTickets
def get_next_batch_of_tickets(active_filters, page_num, cursor):
   list<FeedbackReportTicket>

// Fetches and processes a list of FeedbackReportDailyStats to display in the
// dashboard
def get_stats(ticket_id, splice_val): list<FeedbackReportDailyStats>

// Calculates all the possible filters values that can be applied to the current
// set of reports based on the storage models. This will fetch from the
// AndroidFeedbackReportModel based on the a constant
// ALLOWED_ANDROID_REPORT_FILTERS
def get_all_filter_options() : FeedbackReportFilter

def scrub_report(report_id, scrubbed_by):
    """Scrubs the instance of AppFeedbackReportModel with given ID, removing
    any user-entered input in the entity.

    Args:
        report_id: str. The id of the model entity to scrub.
        scrubbed_by: str. The id of the user that is initiating scrubbing of
            this report, or a constant
            feconf.APP_FEEDBACK_REPORT_SCRUBBER_BOT_ID if scrubbed by the cron
            job.
    """
    _scrub_report_in_transaction(report_id, scrubbed_by)


@transaction_services.run_in_transaction_wrapper
def _scrub_report_in_transaction(report_id, scrubbed_by):
    """See scrub_report for general documentation of what this method does.
    It's only safe to call this method from within a transaction.

    Args:
        report_id: str. The id of the model entity to scrub.
        scrubbed_by: str. The id of the user that is initiating scrubbing of
            this report, or a constant
            feconf.APP_FEEDBACK_REPORT_SCRUBBER_BOT_ID if scrubbed by the cron
            job.
    """
    report_entity = app_feedback_report_models.AppFeedbackReportModel.get_by_id(
        report_id)
    if not report_entity:
        raise Exception(
            'The AppFeedbackReportModel trying to be scrubbed does not '
            'exist.')
    if report_entity.platform == (
            app_feedback_report_models.PLATFORM_CHOICE_ANDROID):
        scrubbed_report_info = _scrub_report_info(
            report_entity.android_report_info)
        report_entity.android_report_info = scrubbed_report_info
    else:
        scrubbed_report_info = _scrub_report_info(
            report_entity.web_report_info)
        report_entity.web_report_info = scrubbed_report_info
    report_entity.scrubbed_by = scrubbed_by
    report_entity.update_timestamps()
    report_entity.put()


def _scrub_report_info(report_info_dict):
    """Scrubs the dictionary of any fields that contains input directly from
    the user.

    Args:
        report_info_dict: dict. The info dict collected in a report.

    Returns:
        dict. The scrubbed report.
    """
    new_report_info = dict()
    for key in report_info_dict:
        if key not in app_feedback_report_models.REPORT_INFO_TO_REDACT:
            new_report_info[key] = report_info_dict[key]
    return new_report_info
