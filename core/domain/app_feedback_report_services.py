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

"""Services to operate on app feedback report app_feedback_report_models."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime

from core.domain import app_feedback_report_domain
from core.platform import models

import feconf
import utils

(app_feedback_report_models,) = models.Registry.import_models(
    [models.NAMES.app_feedback_report])
transaction_services = models.Registry.import_transaction_services()

PLATFORM_ANDROID = (
    app_feedback_report_models.PLATFORM_CHOICE_ANDROID)
PLATFORM_WEB = (
    app_feedback_report_models.PLATFORM_CHOICE_WEB)


def create_android_report_from_json(report_json):
    """Creates an AppFeedbackReport domain object instance from the incoming
    JSON request.

    Args:
        report_json: dict. The JSON for the app feedback report.
    Return:
        AppFeedbackReport. The domain object for an Android feedback report.
    """
    user_supplied_feedback_json = report_json['user_supplied_feedback']
    user_supplied_feedback_obj = (
        app_feedback_report_domain.UserSuppliedFeedback(
            user_supplied_feedback_json['report_type'],
            user_supplied_feedback_json['category'],
            user_supplied_feedback_json['user_feedback_selected_items'],
            user_supplied_feedback_json['user_feedback_other_text_input']))

    system_context_json = report_json['system_context']
    device_context_json = report_json['device_context']
    device_system_context_obj = (
        app_feedback_report_domain.AndroidDeviceSystemContext(
            system_context_json['platform_version'], 
            system_context_json['package_version_code'],
            system_context_json['android_device_country_locale_code'],
            system_context_json['android_device_language_locale_code'],
            device_context_json['android_device_model'],
            device_context_json['android_sdk_version'],
            device_context_json['build_fingerprint'],
            device_context_json['network_type']))

    app_context_json = report_json['app_context']
    entry_point_obj = _get_entry_point_from_json(
        app_context_json['entry_point'])
    app_context_obj = app_feedback_report_domain.AndroidAppContext(
        entry_point_obj, app_context_json['text_language_code'],
        app_context_json['audio_language_code'], app_context_json['text_size'],
        app_context_json['only_allows_wifi_download_and_update'],
        app_context_json['automatically_update_topics'],
        app_context_json['account_is_profile_admin'],
        app_context_json['event_logs'], app_context_json['logcat_logs'])

    report_datetime = datetime.datetime.utcfromtimestamp(
        timestamp=report_json['report_submission_timestamp_sec'],
        tz=datetime.timezone(
            offset=report_json['report_submission_utc_offset']))
    report_id = app_feedback_report_models.AppFeedbackReportModel.generate_id(
        PLATFORM_ANDROID, report_json['report_submission_timestamp_sec'])
    report_obj = app_feedback_report_domain.AppFeedbackReport(
        report_id, report_json['android_report_info_schema_version'],
        PLATFORM_ANDROID, report_json['report_submission_timestamp_sec'],
        None, None, user_supplied_feedback_obj, device_system_context_obj,
        app_context_obj)
    _save_android_app_feedback_report(report_obj)

    return report_obj


def _get_entry_point_from_json(entry_point_json):
    """Saves an incoming report and updates the aggregate report stats with the
    new report's data.

    Args:
        entry_point_json: dict. The JSON data of the entry point.
    Returns:
        EntryPoint. The EntryPoint domain object representing the entry point.
    Raises:
        InvalidInputException. The given entry point is invalid.
    """
    entry_point_name = entry_point_json['entry_point_name']
    if entry_point_name == (
        app_feedback_report_domain.ENTRY_POINT.navigation_drawer):
        return app_feedback_report_domain.NavigationDrawerEntryPoint()
    elif entry_point_name == (
        app_feedback_report_domain.ENTRY_POINT.lesson_player):
        return app_feedback_report_domain.LessonPlayerEntryPoint(
            entry_point_json['entry_point_topic_id'],
            entry_point_json['entry_point_story_id'],
            entry_point_json['entry_point_exploration_id'])
    elif entry_point_name == (
        app_feedback_report_domain.ENTRY_POINT.revision_card):
        return app_feedback_report_domain.RevisionCardEntryPoint(
            entry_point_json['entry_point_topic_id'],
            entry_point_json['entry_point_subtopic_id'])
    elif entry_point_name == (
        app_feedback_report_domain.ENTRY_POINT.crash):
        return app_feedback_report_domain.CrashEntryPoint()
    else:
        raise utils.InvalidInputException(
            'The given entry point %d is invalid.' % entry_point_name)


def store_incoming_report_stats(report_obj):
    """Adds a new report's stats to the aggregate stats model.

    Args:
        report_obj: AppFeedbackReport. AppFeedbackReport domain object.
    """
    if report_obj.platform == model_class.PLATFORM_CHOICE_WEB:
        raise NotImplementedError(
            'Stats aggregation for incoming web reports have not been '
            'implemented yet.')

    model_class = app_feedback_report_models
    platform = PLATFORM_ANDROID
    unticketed_id = (
        model_class.UNTICKETED_ANDROID_REPORTS_STATS_TICKET_ID)
    all_reports_id = model_class.ALL_ANDROID_REPORTS_STATS_TICKET_ID

    stats_date = report_obj.submitted_on_timestamp.date()
    unticketed_stats_entity_id = (
        app_feedback_report_models.AppFeedbackReportStats.calculate_id(
            platform, unticketed_id, stats_date))
    all_reports_entity_id = (
        app_feedback_report_models.AppFeedbackReportStats.calculate_id(
            platform, all_reports_id, stats_date))

    # Add new report to the stats models for unticketed reports and all reports.
    unticketed_stats_entity = (
        app_feedback_report_models.AppFeedbackReportStats.get_by_id(
            unticketed_stats_entity_id))
    _update_report_stats_model_in_transaction(
        unticketed_stats_entity, platform, date,report_obj, delta)
    all_report_stats_entity = (
        app_feedback_report_models.AppFeedbackReportStats.get_by_id(
            all_reports_entity_id))
    _update_report_stats_model_in_transaction(
        all_report_stats_entity, platform, date, report_obj, delta)


@transaction_services.run_in_transaction_wrapper
def _update_report_stats_model_in_transaction(
        stats_model, platform, date, report_obj, delta):
    """Adds a new report's stats to the stats model.

    Args:
        stats_model: AppFeedbackReportStatsModel. The stats model to add stats
            to.
        platform: str. The platform of the report being aggregated.
        date: datetime.date. The date of the stats.
        report_obj: AppFeedbackReport. AppFeedbackReport domain object.
        delta: The amount to increment the stats by, depending on if the report
            is added or removed form the model.
    """
    parameter_names = app_feedback_report_domain.STATS_PARAMETER_NAMES
    # The stats we want to aggregate on.
    report_type = report_obj.user_supplied_feedback.report_type
    country_locale_code = (
        report_obj.device_system_context.country_locale_code)
    entry_point_name = report_obj.app_context.entry_point.entry_point_name
    text_language_code = report_obj.app_context.text_language_code
    audio_language_code = report_obj.app_context.audio_language_code
    sdk_version = report_obj.device_system_context.sdk_version
    version_name = report_obj.device_system_context.version_name

    if stats_model is None:
        if delta < 0:
            raise utils.InvalidInputException(
                'Cannot decrement counts from a stats model without reports.')
        # Create new stats model entity. These are the individual report fields
        # that we will want to splice aggregate stats by and they will each have
        # a count of 1 since this is the first report added for this entity.
        stats_dict = {
            parameter_names.report_type: {
                report_type: 1
            },
            parameter_names.country_locale_code:{
                country_locale_code: 1
            },
            parameter_names.entry_point_name: {
                entry_point_name: 1
            },
            parameter_names.text_language_code: {
               text_language_code: 1
            },
            parameter_names.audio_language_code: {
                audio_language_code: 1
            },
            parameter_names.sdk_version: {
                sdk_version: 1
            },
            parameter_names.version_name: {
                version_name: 1
            }
        }
        app_feedback_report_models.AppFeedbackReportStats.create(
            stats_entity_id, platform, unticketed_id, stats_date, 1,
            stat_dict)
    else:
        # Update existing stats model.
        stats_dict = stats_model.daily_param_stats
        _add_stats_count_for_parameter_value_to_stats_dict(
            stats_dict, parameter_names.report_type, report_type)

        stats_dict[parameter_names.country_locale_code][country_locale_code] = (
            _calculate_new_stats_count_for_parameter(
                stats_dict[parameter_names.country_locale_code][
                    country_locale_code], delta))
        stats_dict[parameter_names.entry_point_name][entry_point_name] = (
            _calculate_new_stats_count_for_parameter(
                stats_dict[parameter_names.entry_point_name][entry_point_name],
                delta))
        stats_dict[parameter_names.audio_language_code][audio_language_code] = (
            _calculate_new_stats_count_for_parameter(
                stats_dict[parameter_names.audio_language_code][
                    audio_language_code], delta))
        stats_dict[parameter_names.text_language_code][text_language_code] = (
            _calculate_new_stats_count_for_parameter(
                stats_dict[parameter_names.text_language_code][
                    text_language_code], delta))
        stats_dict[parameter_names.sdk_version][sdk_version] = (
            _calculate_new_stats_count_for_parameter(
                stats_dict[parameter_names.sdk_version][sdk_version], delta))
        stats_dict[parameter_names.version_name][version_name] = (
            _calculate_new_stats_count_for_parameter(
                stats_dict[parameter_names.version_name][version_name], delta))

        stats_model.daily_param_stats = stats_dict
        stats_model.total_reports_submitted += delta
        if (
            report_obj.submitted_on_datetime > 
            stats_model.newest_report_creation_timestamp):
            stats_model.newest_report_creation_timestamp = (
                report_obj.submitted_on_datetime)

        stats_model.update_timestamps()
        stats_model.put()


def _calculate_new_stats_count_for_parameter(current_count, delta):
    """Helper to increment or initialize the stats count for a parameter.

    Args:
        current_count: int|None. The current report count for a given report, or
            None of there are no reports that satisfied the given value.
        delta: int. The amount to increment the current count by, either -1 or
            +1.
    Returns:
        int. The new report count to put into the stats dict for a single
        parameter value.
    """
    if current_count is None:
        if delta < 0:
            raise utils.InvalidInputException(
                'Cannot decrement a count for a parameter value that does not '
                'exist for this stats model.')
        return 1
    else:
        return current_count + delta


def get_report_from_model(report_model):
    """Create and return a domain object AppFeedbackReport given a model loaded
    from the the data.

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
        return _get_web_report_from_model(report_model)


def get_ticket_from_model(ticket_model):
    """Create and return a domain object AppFeedbackReportTicket given a model
    loaded from the the data.

    Args:
        ticket_model: AppFeedbackReportTicketModel. The model loaded from the
            datastore.
    Returns:
        AppFeedbackReportTicket. An AppFeedbackReportTicket domain object
        corresponding to the given model.
    """
    return app_feedback_report_domain.AppFeedbackReportTicket(
        ticket_model.id, ticket_model.ticket_name, ticket_model.platform,
        ticket_model.github_issue_repo_name, ticket_model.github_issue_number,
        ticket_model.archived, ticket_model.newest_report_timestamp,
        ticket_model.report_ids)


def get_stats_from_model(stats_model):
    """Create and return a domain object AppFeedbackReportDailyStats given a
    model loaded from the the data.

    Args:
        report_model: AppFeedbackReportStatsModel. The model loaded from the
            datastore.
    Returns:
        AppFeedbackReportDailyStats. An AppFeedbackReportDailyStats domain
        object corresponding tothe given model.
    """
    ticket = app_feedback_report_models.AppFeedbackReportTicketModel.get_by_id(
        stats_model.ticket_id)
    param_stats = _create_app_daily_stats_from_model_json(
        stats_model.daily_param_stats)
    app_feedback_report_domain.AppFeedbackReportDailyStats(
        stats_model.id, ticket, stats_model.platform,
        stats_model.stats_tracking_date, stats_model.total_reports_submitted,
        param_stats)


def _create_app_daily_stats_from_model_json(daily_param_stats):
    """Create and return a dict representing the AppFeedbackReportDailyStats
    domain object's daily_param_stats.

    Args:
        daily_param_stats: dict. The stats data from the model.
    Returns:
        dict. A dict mapping param names to ReportStatsParameterValueCounts
        domain objects.
    """
    stats_dict = {}
    print('@@@@@@@@@@THE PARAM STATS IS %r' % daily_param_stats)
    for (stats_name, stats_values_dict) in daily_param_stats.items():
        # For each parameter possible, create a
        # ReportStatsParameterValueCounts domain object of possible parameter
        # values and number of reports with that value.
        parameter_counts = {
            value_name: value_count
            for (value_name, value_count) in stats_values_dict.items()
        }
        counts_obj = (
            app_feedback_report_domain.ReportStatsParameterValueCounts(
                parameter_counts))
        stats_dict[parameter_name] = counts_obj
    return stats_dict


def _get_android_report_from_model(android_report_model):
    """Creates a domain object that represents an android feedback report from
    the model given.

    Args:
        android_report_model: AppFeedbackReportModel. The model to convert to a
            domain object.
    Returns:
        AppFeedbackReport. The corresponding AppFeedbackReport domain object.
    """
    if android_report_model.android_report_info_schema_version < (
        feconf.CURRENT_ANDROID_REPORT_SCHEMA_VERSION):
        raise NotImplementedError(
            'Android app feedback report migrations must be added for new '
            'report schemas implemented.')
    report_info_dict = android_report_model.android_report_info
    user_supplied_feedback = app_feedback_report_domain.UserSuppliedFeedback(
        android_report_model.report_type, android_report_model.category,
        report_info_dict['user_feedback_selected_items'],
        report_info_dict['user_feedback_other_text_input'])
    device_system_context = (
        app_feedback_report_domain.AndroidDeviceSystemContext(
            android_report_model.platform_version,
            report_info_dict['package_version_code'],
            android_report_model.android_device_country_locale_code,
            report_info_dict['android_device_language_locale_code'],
            android_report_model.android_device_model,
            android_report_model.android_sdk_version,
            report_info_dict['build_fingerprint'],
            report_info_dict['network_type']))
    entry_point = _get_entry_point(
        android_report_model.entry_point,
        android_report_model.entry_point_topic_id,
        android_report_model.entry_point_story_id,
        android_report_model.entry_point_exploration_id,
        android_report_model.entry_point_subtopic_id)
    app_context = app_feedback_report_domain.AndroidAppContext(
        entry_point, android_report_model.text_language_code,
        android_report_model.audio_language_code, report_info_dict['text_size'],
        report_info_dict['only_allows_wifi_download_and_update'],
        report_info_dict['automatically_update_topics'],
        report_info_dict['account_is_profile_admin'],
        report_info_dict['event_logs'], report_info_dict['logcat_logs'])
    return app_feedback_report_domain.AppFeedbackReport(
        android_report_model.id,
        android_report_model.android_report_info_schema_version,
        android_report_model.platform, android_report_model.submitted_on,
        android_report_model.ticket_id, android_report_model.scrubbed_by,
        user_supplied_feedback, device_system_context, app_context)


def _get_web_report_from_model(web_report_model):
    """Creates a domain object that represents a web feedback report from
    the model given.

    Args:
        web_report_model: AppFeedbackReportModel. The model to convert to a
            domain object.
    Raises:
        NotImplementedError. The domain object for web reports has not been
            defined yet.
    """
    raise NotImplementedError(
        'Web app feedback report domain objects must be defined.')
    if web_report_model.android_report_info_schema_version < (
        feconf.CURRENT_WEB_REPORT_SCHEMA_VERSION):
        raise NotImplementedError(
            'Web app feedback report migrations must be added for new '
            'report schemas implemented.')


def _get_entry_point(
        entry_point_name, topic_id, story_id, exploration_id, subtopic_id):
    """Creates a domain object that represents an entry point to the feedback
    reporting feature.

    Args:
        entry_point_name: str. The name of the entry point that corresponds to
            an ENTRY_POINT enum.
        topic_id: str|None. The ID of the topic that is being played when the
            report was initiated or None if the entry point is not from a topic.
        story_id: str|None. The ID of the story that is being played when the
            report was initiated or None if the entry point is not from a story.
        exploration_id: str|None. The ID of the exploration that is being played
            when the report was initiated or None if there was no active
            exploration when the report was started.
        subtopic_id: int|None. The ID of the subtopic that is being played when
            the report was initiated or None if there was no active subtopic
            when the report was started.
    Returns:
        AppFeedbackReport. The corresponding AppFeedbackReport domain object.
    """
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


def scrub_all_unscrubbed_expiring_reports(scrubber_by):
    """Fetches the reports that are expiring and must be scrubbed.

    Args:
        scrubbed_by: str. The ID of the user initiating scrubbing or
            feconf.APP_FEEDBACK_REPORT_SCRUBBER_BOT_ID if scrubbed by the cron
            job.
    """
    reports_to_scrub = get_all_expiring_reports_to_scrub()
    for report in reports_to_scrub:
        scrub_single_app_feedback_report(report, scrubbed_by)


def get_all_expiring_reports_to_scrub():
    """Fetches the reports that are expiring and must be scrubbed.

    Returns:
        list(AppFeedbackReport). The list of AppFeedbackReportModel domain
        objects that need to be scrubbed.
    """
    model_class = app_feedback_report_models.AppFeedbackReportModel
    model_ids = model_class.get_all_unscrubbed_expiring_reports()
    model_entities = [model_class.get_by_id(model_id) for model_id in model_ids]
    return [
        get_report_from_model(model_entity) for model_entity in model_entities]


def scrub_single_app_feedback_report(report, scrubbed_by):
    """Scrubs the instance of AppFeedbackReportModel with given ID, removing
    any user-entered input in the entity.

    Args:
        report: AppFeedbackReport. The domain object of the report to scrub.
        scrubbed_by: str. The id of the user that is initiating scrubbing of
            this report, or a constant
            feconf.APP_FEEDBACK_REPORT_SCRUBBER_BOT_ID if scrubbed by the cron
            job.
    """
    report.scrubbed_by = scrubbed_by
    report.user_supplied_feedback.user_feedback_other_text_input = None
    if report.platform == PLATFORM_ANDROID:
        report.app_context.event_logs = None
        report.app_context.logcat_logs = None
        _save_android_app_feedback_report(report)
    else:
        raise NotImplementedError(
            'Saving web report entities to persistent storage has not been '
            'implemented yet.')


def _save_android_app_feedback_report(report):
    """Saves the AppFeedbackReport domain object in persistence storage.

    Args:
        report: AppFeedbackReport. The domain object of the report to save.
    """
    user_supplied_feedback = report.user_supplied_feedback
    device_system_context = report.device_system_context
    app_context = report.app_context
    entry_point = app_context.entry_point

    android_report_info = {
        'user_feedback_selected_items': (
            user_supplied_feedback.user_feedback_selected_items),
        'user_feedback_other_text_input': (
            user_supplied_feedback.user_feedback_other_text_input),
        'event_logs': app_context.event_logs,
        'logcat_logs': app_context.logcat_logs,
        'package_version_code': device_system_context.package_version_code,
        'android_device_language_locale_code': (
            device_system_context.device_language_locale_code),
        'build_fingerprint': device_system_context.build_fingerprint,
        'network_type': device_system_context.network_type,
        'text_size': app_context.text_size,
        'download_and_update_only_on_wifi': (
            app_context.only_allows_wifi_download_and_update),
        'automatically_update_topics': app_context.automatically_update_topics,
        'account_is_profile_admin': app_context.account_is_profile_admin
    }

    model_entity = app_feedback_report_models.AppFeedbackReportModel.get_by_id(
        report.id)

    if model_entity is None:
        app_feedback_report_models.AppFeedbackReportModel.create(
            report.id, report.platform, report.submitted_on_timestamp,
            user_supplied_feedback.category, device_system_context.version_name,
            app_context.device_country_locale_code,
            device_system_context.sdk_version,
            device_system_context.device_model,
            entry_point.entry_point_name, entry_point.topic_id,
            entry_point.story_id, entry_point.exploration_id,
            entry_point.subtopic_id, app_context.text_language_code,
            app_context.audio_language_code, android_report_info, None)
    else:
        model_entity.ticket_id = report.ticket_id
        model_entity.scrubbed_by = report.scrubbed_by
        model_entity.android_report_info = android_report_info
        model_entity.update_timestamps()
        model_entity.put()


def _scrub_report_info_dict(report_info_dict):
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


def get_all_filter_options():
    """Fetches all the possible values that moderators can filter reports or
    tickets by.

    Returns:
        list(AppFeedbackReportFilter). A list of filters and the possible values
        they can have.
    """
    filter_list = list()
    filter_names = app_feedback_report_models.FILTER_FIELD_NAMES
    for filter_name in filter_names:
        filter_values = app_feedback_report_models.AppFeedbackReportModel.query(
            projection=[filter_name], distinct=True)
        filter_list.append(app_feedback_report_domain.AppFeedbackReportFilter(
            filter_name, filter_values))
    return filter_list


def reassign_ticket(report, new_ticket):
    """Reassign the ticket the report is associated with.

    Args:
        report: AppFeedbackReport. The domain Object
        new_ticket: AppFeedbackReportTicket|None. The ticket domain object to
            reassign the report to or None if removing the report form a ticket
            wihtout reassigning.
    """
    if report.platform == PLATFORM_WEB:
        raise NotImplementedError(
            'Assigning web reports to tickets has not been implemented yet.')

    old_ticket_id = report.ticket_id

    # Update the ticket model.
    if old_ticket_id is not None:
        ticket_model = (
            app_feedback_report_models.AppFeedbackReportTicketModel.get_by_id(
                old_ticket_id))
        ticket_obj = get_ticket_from_model(ticket_model)
        ticket_obj.reports.remove(report)
        _save_ticket(ticket_obj)

    # Update the report model.
    report.ticket_id = new_ticket.id
    _save_android_app_feedback_report(report)

    # Update the stats model.
    platform = report.platform
    stats_date = report.submitted_on_datetime.date()

    stats_id_to_decrement = app_feedback_report_models.AppFeedbackReportStatsModel.calculate_id(
        platform, old_ticket_id, stats_date)
    stats_model_to_decrement = app_feedback_report_models.AppFeedbackReportStatsModel.get_by_id(
        stats_id_to_decrement)
    _update_report_stats_model_in_transaction(
        stats_model_to_decrement, platform, stats_date, report, -1)
    
    # Get the ID of the ticket to add the report to.
    new_ticket_id = app_feedback_report_models.UNTICKETED_ANDROID_REPORTS_STATS_TICKET_ID
    if new_ticket is not None:
        new_ticket_id = new_ticket.ticket_id
    stats_id_to_increment = app_feedback_report_models.AppFeedbackReportStatsModel.calculate_id(
        platform, new_ticket_id, stats_date)
    stats_model_to_increment = app_feedback_report_models.AppFeedbackReportStatsModel.get_by_id(
        stats_id_to_increment)
    _update_report_stats_model_in_transaction(
        stats_model_to_increment, platform, stats_date, report, 1)


def edit_ticket_name(ticket, new_name):
    """Updates the ticket name.

    Returns:
        ticket: AppFeedbackReportTicket. The domain object for a ticket.
        new_name: str. The new name to assign the ticket.
    """
    ticket.ticket_name = name
    _save_ticket(ticket)


def _save_ticket(ticket):
    """Saves the ticket to persistent storage.

    Returns:
        ticket: AppFeedbackReportTicket. The domain object to save to storage.
    """
    ticket_model = app_feedback_report_models.AppFeedbackReportTicket.get_by_id(
        ticket.id)
    ticket_model.ticket_name = ticket.ticket_name
    ticket_model.platform = ticket.platform
    ticket_model.github_issue_repo_name = ticket.github_issue_repo_name
    ticket_model.github_issue_number = ticket.github_issue_number
    ticket_model.archived = ticket.archived
    ticket_model.newest_report_timestamp = (
        ticket.newest_report_creation_timestamp)
    ticket_model.report_ids = [report.id for report in ticket.reports]
    ticket_model.update_timestamps()
    ticket_model.put()


# // Fetches and processes the next batch of reports maintainers want to view and
# // returns a list of FeedbackReports.
# def get_next_batch_of_reports(active_filters, page_num, cursor):
#    list<FeedbackReport>

# // Fetches and processes the next batch of reports maintainers want to view.
# // Returns a list of FeedbackReportTickets
# def get_next_batch_of_tickets(active_filters, page_num, cursor):
#    list<FeedbackReportTicket>

# // Fetches and processes a list of FeedbackReportDailyStats to display in the
# // dashboard
# def get_stats(ticket_id, splice_val): list<FeedbackReportDailyStats>


# def _scrub_single_report_in_transaction(report_id, scrubbed_by):
#     """See scrub_report for general documentation of what this method does.
#     It's only safe to call this method from within a transaction.

#     Args:
#         report_id: str. The id of the model entity to scrub.
#         scrubbed_by: str. The id of the user that is initiating scrubbing of
#             this report, or a constant
#             feconf.APP_FEEDBACK_REPORT_SCRUBBER_BOT_ID if scrubbed by the cron
#             job.
#     """
#     report_entity = app_feedback_report_models.AppFeedbackReportModel.get_by_id(
#         report_id)
#     if not report_entity:
#         raise Exception(
#             'The AppFeedbackReportModel trying to be scrubbed does not '
#             'exist.')
#     if report_entity.platform == (
#             app_feedback_report_models.PLATFORM_CHOICE_ANDROID):
#         scrubbed_report_info = _scrub_report_info_dict(
#             report_entity.android_report_info)
#         report_entity.android_report_info = scrubbed_report_info
#     else:
#         scrubbed_report_info = _scrub_report_info_dict(
#             report_entity.web_report_info)
#         report_entity.web_report_info = scrubbed_report_info
#     report_entity.scrubbed_by = scrubbed_by
#     report_entity.update_timestamps()
#     report_entity.put()