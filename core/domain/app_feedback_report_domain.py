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

"""Domain objects for app feedback reporting."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.platform import models
import feconf
import python_utils
import utils

(app_feedback_reportmodels,) = models.Registry.import_models(
    [models.NAMES.app_feedback_report])


REPORT_TYPE = utils.create_enum('suggestion', 'issue', 'crash')
CATEGORY = utils.create_enum(
    'suggestion_new_feature', 'suggestion_new_language','suggestion_other',
    'issue_lesson_question', 'issue_language_general', 'issue_language_audio',
    'issue_language_text', 'issue_topics', 'issue_profile', 'issue_other',
    'crash_lesson_player', 'crash_practice_questions', 'crash_options_page',
    'crash_profile_page', 'crash_other')
FEEDBACK_OPTIONS = utils.create_enum()
ENTRY_POINT = utils.create_enum(
    'navigation_drawer', 'lesson_player', 'revision_card', 'crash')
STATS_PARAMETER_NAMES = utils.create_enum(
    'all_submitted_reports', 'report_type', 'country_locale_code',
    'entry_point_name', 'text_language_code', 'audio_language_code',
    'sdk_version', 'version_name')

ANDROID_TEXT_SIZE = utils.create_enum('small', 'medium', 'large', 'extra_large')
ANDROID_ENTRY_POINT = [
    ENTRY_POINT.navigation_drawer, ENTRY_POINT.lesson_player,
    ENTRY_POINT.revision_card, ENTRY_POINT.crash]

ALLOWED_REPORT_TYPE = [
    REPORT_TYPE.suggestion, REPORT_TYPE.issue, REPORT_TYPE.crash]
ALLOWED_CATEGORIES = [
    CATEGORY.suggestion_new_feature, CATEGORY.suggestion_new_language,
    CATEGORY.suggestion_other, CATEGORY.issue_language_general,
    CATEGORY.issue_language_audio, CATEGORY.issue_language_text,
    CATEGORY.issue_topics, CATEGORY.issue_profile, CATEGORY.issue_other,
    CATEGORY.crash_lesson_player, CATEGORY.crash_practice_questions,
    CATEGORY.crash_options_page, CATEGORY.crash_profile_page,
    CATEGORY.crash_other]
ALLLOWED_ANDROID_STATS_PARAMETERS = [
    STATS_PARAMETER_NAMES.all_submitted_reports,
    STATS_PARAMETER_NAMES.report_type,
    STATS_PARAMETER_NAMES.country_locale_code,
    STATS_PARAMETER_NAMES.entry_point_name,
    STATS_PARAMETER_NAMES.text_language_code,
    STATS_PARAMETER_NAMES.audio_language_code,
    STATS_PARAMETER_NAMES.sdk_version, STATS_PARAMETER_NAMES.version_name]

class AppFeedbackReport(python_utils.OBJECT):
    """Domain object for a single feedback report."""

    def __init__(
            self, report_id, platform, report_submitted_timestamp, ticket_id,
            scrubbed_by, user_supplied_feedback, device_system_context,
            app_context):
        """Constructs a AppFeedbackReport domain object.

        Args:
            report_id: str. The unique ID of the report.
            platform: str. The platform this report is for.
            report_submitted_timestamp: datetime.datetime: Timestamp in seconds
                since epoch (in UTC) of when the report was submitted by the
                user.
            ticket_id: str. The unique ID that this ticket is assigned to; None
                if not ticketed.
            scrubbed_by: str. The unique ID of the user that scrubbed this
                report, or feconf.REPORT_SCRUBBER_BOT_ID if scrubbed by the
                cron job.
            user_supplied_feedback: UserSuppliedFeedback. An object representing
                the information fileld out by the user in the report.
            device_system_context: DeviceSystemContext. An object representing
                the user's device and system information used to submit the
                report.
            app_context: AppContext. An object representing the user's Oppia
                app state when they submitted the report.
        """
        self.report_id = report_id
        self.platform = platform
        self.report_submitted_timestamp = report_submitted_timestamp
        self.ticket_id = ticket_id
        self.scrubbed_by = scrubbed_by
        self.user_supplied_feedback = user_supplied_feedback
        self.device_system_context = device_system_context
        self.app_context = app_context

    def to_dict(self):
        """Returns a dict representing this AppFeedbackReport domain object.

        Returns:
            dict. A dict, mapping all fields of AppFeedbackReport instance.
        """
        return {
            'report_id': self.report_id,
            'platform': self.platform,
            'report_submitted_timestamp': (
                self.report_submitted_timestamp.second),
            'ticket_id': self.ticket_id,
            'scrubbed_by': self.scrubbed_by,
            'user_supplied_feedback': self.user_supplied_feedback.to_dict(),
            'device_system_context': self.device_system_context.to_dict(),
            'app_context': self.app_context.to_dict()
        }


class UserSuppliedFeedback(python_utils.OBJECT):
    """Domain object for the user-supplied information in feedback reports."""

    def __init__(
            self, report_type, category, user_feedback_selected_items,
            user_feedback_other_text_input):
        """Constructs a UserSuppliedFeedback domain object.

        Args:
            report_type: str. The type of feedback submitted by the user that
                corresponds to a REPORT_TYPE enum.
            category: str. The category that this specific report_type is
                providing feedback on that correponds to a CATEGORY enum.
            user_feedback_selected_items: list(str)|None. A list of strings that
                represent any options selected by the user for the feedback
                they are providing in this feedback report. None if the user did
                not have the option to sleect checkbox options.
            user_feedback_other_text_input: str|None. The open text inputted by
                the user, or None if they did not select any options where they
                could input text.
        """
        self.report_type = report_type
        self.category = category
        self.user_feedback_selected_items = user_feedback_selected_items
        self.user_feedback_other_text_input = user_feedback_other_text_input

    def to_dict(self):
        """Returns a dict representing this UserSuppliedFeedback domain object.

        Returns:
            dict. A dict, mapping all fields of UserSuppliedFeedback instance.
        """
        return {
            'report_type': self.report_type,
            'category': self.category,
            'user_feedback_selected_items': self.user_feedback_selected_items,
            'user_feedback_other_text_input': (
                self.user_feedback_other_text_input)
        }


class DeviceSystemContext(python_utils.OBJECT):
    """Domain object for the device and system information from the device used
    to submit the report.
    """
    
    def __init__(self, version_name, country_locale_code):
        """Constructs a DeviceSystemContext domain object.

        Args:
            version_name: str. The specific version of the app being used to
                submit the report.
            country_locale_code: str. The user's country locale represented as
                an ISO-3166 code.
        """
        self.version_name = version_name
        self.country_locale_code = country_locale_code

    def to_dict():
        """Returns a dict representing this DeviceSystemContext domain object.
        Subclasses should override this to propertly format any additional
        properties.

        Returns:
            dict. A dict, mapping all fields of DeviceSystemContext instance.
        """
        return {
            'version_name': self.version_name,
            'country_locale_code': self.country_locale_code
        }


class AndroidDeviceSystemContext(DeviceSystemContext):
    """Domain object for the device and system information specific to an
    Android device.
    """

    def __init__(
            self, version_name, country_locale_code, language_locale_code,
            device_model, sdk_version, build_fingerprint, network_type):
        """Constructs a AndroidDeviceSystemContext domain object.
        
        Args:
            version_name: str. The specific version of the app being used to
                submit the report.
            country_locale_code: str. The user's country locale represented as
                an ISO-3166 code.
            package_version_code: int. The Oppia Android package version on the
                device.
            language_locale_code: str. The device's language locale code as an
                ISO-639 code, as determined in the Android device's settings.
            device_model: str. The Android device model used to send the report
            sdk_version: int. The Android SDK version running on the device
            build_fingerprint: str. The unique build fingerprint of this app
                version.
            network_type: str. The network type the device is connected to.
        """
        super(AndroidDeviceSystemContext, self).__init__(
            version_name, country_locale_code)
        self.package_version_code = package_version_code
        self.language_locale_code = language_locale_code
        self.device_model = device_model
        self.sdk_version = sdk_version
        self.build_fingerprint = build_fingerprint
        self.network_type = network_type

    def to_dict():
        """Returns a dict representing this AndroidDeviceSystemContext domain
        object.

        Returns:
            dict. A dict, mapping all fields of AndroidDeviceSystemContext
            instance.
        """
        return {
            'version_name': self.version_name,
            'country_locale_code': self.country_locale_code,
            'package_version_code': self.package_version_code,
            'language_locale_code': self.language_locale_code,
            'device_model': self.device_model,
            'sdk_version': self.sdk_version,
            'build_fingerprint': self.build_fingerprint,
            'network_type': self.network_type
        }


class EntryPoint(python_utils.OBJECT):
    """Domain object for the entry point used to initiate the feedback report.
    """

    def __init__(self, entry_point_name):
        """Constructs an EntryPoint domain object.

        Args:
            entry_point_name: str. The user-readable name of the entry point
                used, corresponding to an ENTRY_POINT enum.
        """
        self.entry_point_name = entry_point_name


class NavigationDrawerEntryPoint(EntryPoint):
    """Domain object for the Android navigation drawer entry point."""

    def __init__(self):
        """Constructs an NavigationDrawerEntryPoint domain object."""
        super(NavigationDrawerEntryPoint, self).__init__(
            ENTRY_POINT.navigation_drawer)

    def to_dict():
        """Returns a dict representing this NavigationDrawerEntryPoint domain
        object.

        Returns:
            dict. A dict, mapping all fields of NavigationDrawerEntryPoint
            instance.
        """
        return {
            'entry_point_name': self.entry_point_name
        }


class LessonPlayerEntryPoint(EntryPoint):
    """Domain object for the lesson player entry point."""

    def __init__(self):
        """Constructs an LessonPlayerEntryPoint domain object.

        Args:
            topic_id: str. The unique ID for the current topic the user is
                playing when intiating the report.
            story_id: str. The unique ID for the current story the user is
                playing when intiating the report.
            exploration_id: str. The unique ID for the current exploration the
                user is playing when intiating the report.
        """
        super(LessonPlayerEntryPoint, self).__init__(ENTRY_POINT.lesson_player)
        self.topic_id = topic_id
        self.story_id = story_id
        self.exploration_id = exploration_id

    def to_dict():
        """Returns a dict representing this LessonPlayerEntryPoint domain
        object.

        Returns:
            dict. A dict, mapping all fields of LessonPlayerEntryPoint instance.
        """
        return {
            'entry_point_name': self.entry_point_name,
            'topic_id': self.topic_id,
            'story_id': self.story_id,
            'exploration_id': self.exploration_id
        }


class RevisionCardEntryPoint(EntryPoint):
    """Domain object for the Android revision card entry point."""

    def __init__(self):
        """Constructs an RevisionCardEntryPoint domain object.
        
        Args:
            topic_id: str. The unique ID for the current topic the user is
                reviewing when intiating the report.
            subtopic_id: str. The unique ID for the current subtopic the user is
                reviewing when intiating the report.
        """
        super(RevisionCardEntryPoint, self).__init__(ENTRY_POINT.revision_card)
        self.topic_id = topic_id
        self.subtopic_id = subtopic_id

    def to_dict():
        """Returns a dict representing this RevisionCardEntryPoint domain
        object.

        Returns:
            dict. A dict, mapping all fields of RevisionCardEntryPoint
            instance.
        """
        return {
            'entry_point_name': self.entry_point_name,
            'topic_id': self.topic_id,
            'subtopic_id': self.subtopic_id
        }


class CrashEntryPoint(EntryPoint):
    """Domain object for the Android crash dialog entry point."""

    def __init__(self):
        """Constructs an CrashEntryPoint domain object."""
        super(CrashEntryPoint, self).__init__(ENTRY_POINT.crash)

    def to_dict():
        """Returns a dict representing this CrashEntryPoint domain object.

        Returns:
            dict. A dict, mapping all fields of CrashEntryPoint
            instance.
        """
        return {
            'entry_point_name': self.entry_point_name
        }


class AppContext(python_utils.OBJECT):
    """Domain object for the Oppia app information of the user's Oppia instance
    at the time they submitted the report.
    """

    def __init__(self, entry_point, text_language_code, audio_language_code):
        """Constructs an AppContext domain object.

        Args:
            entry_point: EntryPoint. An object representing The entry point that
                the user used to initiate the report.
            text_language_code: str. The ISO-639 code for the text language set
                in the app
            audio_language_code: str. The ISO-639 code for the audio language
                set in the app
        """
        self.entry_point = entry_point
        self.text_language_code = text_language_code
        self.audio_language_code = audio_language_code

    def to_dict():
        """Returns a dict representing this AppContext domain object. Subclasses
        should override this to propertly format any additional properties.

        Returns:
            dict. A dict, mapping all fields of AppContext instance.
        """
        return {
            'entry_point': self.entry_point.to_dict(),
            'text_language_code': self.text_language_code,
            'audio_language_code': self.audio_language_code
        }


class AndroidAppContext(AppContext):
    """Domain object for the app context information specific to the Oppia
    Android app.
    """

    def __init__(
            self, entry_point, text_language_code, audio_language_code,
            text_size, only_allows_wifi_download_and_update,
            automatically_update_topics, account_is_profile_admin, event_logs,
            logcat_logs):
        """Constructs a AndroidAppContext domain object.
        
        Args:
            entry_point: EntryPoint. An object representing The entry point that
                the user used to initiate the report.
            text_language_code: str. The ISO-639 code for the text language set
                in the app
            audio_language_code: str. The ISO-639 code for the audio language
                set in the app
            text_size: str. The text size set by the user in the app that
                corresponds to an ANDROID_TEXT_SIZE enum.
            only_allows_wifi_download_and_update: bool. True if the user only
                allows downloads and updates when connected to wifi.
            automatically_update_topics: bool. True if the user allows
                automatically updating topics.
            account_is_profile_admin: bool. True if user sending the report is
                an admin account.
            event_logs: list(str). A list of strings for the event logs
                collected in the app; the list is empty if this instance has
                been scrubbed.
            logcat_logs: list(str). A list of strings for the logcat events
                recorded in the app; the list is empty if this instance has been
                scrubbed.
        """
        super(AndroidAppContext, self).__init__(
            entry_point, text_language_code, audio_language_code)
        self.text_size = text_size
        self.only_allows_wifi_download_and_update = (
            only_allows_wifi_download_and_update)
        self.automatically_update_topics = automatically_update_topics
        self.account_is_profile_admin = account_is_profile_admin
        self.event_logs = event_logs
        self.logcat_logs = logcat_logs

    def to_dict():
        """Returns a dict representing this AndroidAppContext domain object.

        Returns:
            dict. A dict, mapping all fields of AndroidAppContext instance.
        """
        return {
            'entry_point': self.entry_point.to_dict(),
            'text_language_code': self.text_language_code,
            'audio_language_code': self.audio_language_code,
            'text_size': self.text_size,
            'only_allows_wifi_download_and_update': (
                self.only_allows_wifi_download_and_update
            ),
            'automatically_update_topics': self.automatically_update_topics,
            'account_is_profile_admin': self.account_is_profile_admin,
            'event_logs': self.event_logs,
            'logcat_logs': self.logcat_logs
        }


class AppFeedbackReportTicket(python_utils.OBJECT):
    """Domain object for a single ticket created for feedback reports."""

    def __init__(
        self, id, platform, report_submitted_timestamp, ticket_id, scrubbed_by,
        user_supplied_feedback, device_system_context, app_context):
        """Constructs a AppFeedbackReportTicket domain object.

        Args:
            ticket_id: str. The unique ID of the ticket.
            ticket_name: str. The user-readable name given to this ticket.
            newest_report_creation_timestamp: datetime.datetime. Timestamp in
                UTC of the newest submitted report that is in this ticket.
            reports: list(AppFeedbackReport). The list of AppFeedbackReport
                objects assigned to this ticket.
        """
        self.ticket_id = ticket_id
        self.ticket_name = ticket_name
        self.newest_report_creation_timestamp = newest_report_creation_timestamp
        self.reports = reports

    def to_dict():
        """Returns a dict representing this AppFeedbackReportTicket domain
        object.

        Returns:
            dict. A dict, mapping all fields of AppFeedbackReportTicket instance.
        """
        return {
            'ticket_id': self.ticket_id,
            'ticket_name': self.ticket_name,
            'newest_report_creation_timestamp': (
                self.newest_report_creation_timestamp.isoformat()),
            'reports': [report.report_id for report in self.reports]
        }


class AppFeedbackReportDailyStats(python_utils.OBJECT):
    """Domain object for report statistics on a single day for a specific
    ticket.
    """

    def __init__(
        self, id, platform, report_submitted_timestamp, ticket_id, scrubbed_by,
        user_supplied_feedback, device_system_context, app_context):
        """Constructs a AppFeedbackReportDailyStats domain object.

        Args:
            stats_id: str. The unique ID for ths stats instance.
            ticket_id: str. The unique ID of the ticket that this object is
                aggregating stats on.
            date: datetime.date. The date that this object is aggregating stats
                on, in UTC.
            counts_dict: dict. A dict representing the statistics on this date.
                Keys in this dict correpond to STATS_PARAMETER_NAMES enums,
                while values are ReportStatsParameterValueCounts objects.
        """
        self.stats_id = stats_id
        self.ticket_id = ticket_id
        self.date = date
        self.counts_dict = counts_dict

    def to_dict():


class ReportStatsParameterValueCounts(python_utils.OBJECT):
    """Domain object for the number of reports that satisfy a specific parameter
    value.
    """

    def __init__(
        self, parameter_value_counts):
        """Constructs a ReportStatsParameterValueCounts domain object.

        Args:
            parameter_value_counts: dict. A dict with keys that correpond to a
                specific value for a given parameter, and integer values for the
                number of reports that satisfy that value.
        """
        self.parameter_value_counts

    def to_dict():
        data_dict = dict()
        for key, value in self.parameter_value_counts:
            data_dict[key] = value
        return data_dict


class AppFeedbackReportFilter(python_utils.OBJECT):
    """Domain object for a filter that can be applied to the collection of
    feedback reports.
    """

    def __init__(self, filter_name, filter_options):
        """Constructs a AppFeedbackReportFilter domain object.

        Args:
            filter_name: str. The name of the filter category, correponding to
                a field in the AppFeedbackReport object.
            filter_options: list(str). The possible values for the given filter.
        """
        self.filter_name = filter_name
        self.filter_options = filter_options

    def to_dict():
        return {
            'filter_name': self.filter_name,
            'filter_options': self.filter_options
        }

