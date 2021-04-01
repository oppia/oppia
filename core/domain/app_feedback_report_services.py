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

from core.platform import models

(app_feedback_report_models,) = models.Registry.import_models(
    [models.NAMES.app_feedback_report])
transaction_services = models.Registry.import_transaction_services()


def save_report():
    """Called by the controller to save a new report in both the
    FeedbackReportModel and  FeedbackReportingStatsModel so that aggregate
    statistics are accurate
    """

def create_report(report_dict)
    """Create and return a domain object feedback report from an incoming
    request JSON.
    """

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
        scrubbed_by: str. The id of the user or cron job that is intiating
            scrubbing this report.
    """
    _scrub_report_in_transaction(report_id, scrubbed_by)


@transaction_services.run_in_transaction_wrapper
def _scrub_report_in_transaction(report_id, scrubbed_by):
    """See scrub_report for general documentation of what this method does.
    It's only safe to call this method from within a transaction.

    Args:
        report_id: str. The id of the model entity to scrub.
        scrubbed_by: str. The id of the user that is initiating scrubbing of
            this report, or a const feconf.REPORT_SCRUBBER_BOT_ID if scrubbed
            by the cron job.
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
