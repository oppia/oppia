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

"""Models for Oppia feedback reports from both Android and web."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime

from core.platform import models
import feconf
import python_utils
import utils

(base_models,) = models.Registry.import_models([models.NAMES.base_model])

datastore_services = models.Registry.import_datastore_services()
transaction_services = models.Registry.import_transaction_services()

PLATFORM_CHOICE_ANDROID = 'android'
PLATFORM_CHOICE_WEB = 'web'
PLATFORM_CHOICES = [PLATFORM_CHOICE_ANDROID, PLATFORM_CHOICE_WEB]
GITHUB_REPO_CHOICES = PLATFORM_CHOICES

REPORT_INFO_TO_REDACT = (
    'user_feedback_other_text_input', 'event_logs', 'logcat_logs')


class AppFeedbackReportModel(base_models.BaseModel):
    """Model for storing feedback reports sent from learners.

    Instances of this model contain information about learner's device and Oppia
    app settings, as well as information provided by the user in the feedback
    report.

    The id of each model instance is determined by concatenating the platform,
    the timestamp of the report's submission date (in sec since epoch, in UTC),
    and a hash of a string representation of a random int.
    """

    # We use the model id as a key in the Takeout dict.
    ID_IS_USED_AS_TAKEOUT_KEY = True

    # The platform (web or Android) that the report is sent from and that the
    # feedback corresponds to.
    platform = datastore_services.StringProperty(
        required=True, indexed=True, choices=PLATFORM_CHOICES)
    # The ID of the user that scrubbed this report, if it has been scrubbed.
    scrubbed_by = datastore_services.StringProperty(
        required=False, indexed=True)
    # Unique ID for the ticket this report is assigned to (see
    # AppFeedbackReportTicketModel for how this is constructed). This defaults
    # to None since initially, new reports received will not be assigned to a
    # ticket.
    ticket_id = datastore_services.StringProperty(required=False, indexed=True)
    # The local datetime of when the report was submitted by the user on their
    # device. This may be much earlier than the model entity's creation date if
    # the report was locally cached for a long time on an Android device.
    submitted_on = datastore_services.DateTimeProperty(
        required=True, indexed=True)
    # The type of feedback for this report; this can be an arbitrary string
    # since future iterations of the report structure may introduce new types
    # and we cannot rely on the backend updates to fully sync with the frontend
    # report updates.
    report_type = datastore_services.StringProperty(required=True, indexed=True)
    # The category that this feedback is for. Possible categories include:
    # suggestion_feature, suggestion_language, suggestion_other,
    # issue_lesson_question, issue_general_language, issue_audio_language,
    # issue_text_language, issue_topics, issue_profile, issue_other, crash.
    category = datastore_services.StringProperty(required=True, indexed=True)
    # The version of the app; on Android this is the package version name (e.g.
    # 0.1-alpha-abcdef1234) and on web this is the release version (e.g. 3.0.8).
    platform_version = datastore_services.StringProperty(
        required=True, indexed=True)
    # The entry point location that the user is accessing the feedback report
    # from on both web & Android devices. Possible entry points include:
    # navigation_drawer, lesson_player, revision_card, or crash.
    entry_point = datastore_services.StringProperty(required=True, indexed=True)
    # Additional topic / story / exploration IDs that may be collected depending
    # on the entry_point used to send the report; a lesson player entry point
    # will have topic_id, story_id, and exploration_id, while revision cards
    # will have topic_id and subtopic_id.
    entry_point_topic_id = datastore_services.StringProperty(
        required=False, indexed=True)
    entry_point_story_id = datastore_services.StringProperty(
        required=False, indexed=True)
    entry_point_exploration_id = datastore_services.StringProperty(
        required=False, indexed=True)
    entry_point_subtopic_id = datastore_services.StringProperty(
        required=False, indexed=True)
    # The text language on Oppia set by the user in its ISO-639 language code;
    # this is set by the user in Oppia's app preferences on all platforms.
    text_language_code = datastore_services.StringProperty(
        required=True, indexed=True)
    # The audio language ISO-639 code on Oppia set by the user; this is set in
    # Oppia's app preferences on all platforms.
    audio_language_code = datastore_services.StringProperty(
        required=True, indexed=True)
    # The user's country locale represented as a ISO-3166 code; the locale is
    # determined by the user's Android device settings.
    android_device_country_locale_code = datastore_services.StringProperty(
        required=False, indexed=True)
    # The Android device model used to submit the report.
    android_device_model = datastore_services.StringProperty(
        required=False, indexed=True)
    # The Android SDK version on the user's device.
    android_sdk_version = datastore_services.IntegerProperty(
        required=False, indexed=True)
    # The feedback collected for Android reports; None if the platform is 'web'.
    android_report_info = datastore_services.JsonProperty(
        required=False, indexed=False)
    # The schema version for the feedback report info; None if the platform is
    # 'web'.
    android_report_info_schema_version = datastore_services.IntegerProperty(
        required=False, indexed=True)
    # The feedback collected for Web reports; None if the platform is 'android'.
    web_report_info = datastore_services.JsonProperty(
        required=False, indexed=False)
    # The schema version for the feedback report info; None if the platform is
    # 'android'.
    web_report_info_schema_version = datastore_services.IntegerProperty(
        required=False, indexed=True)

    @classmethod
    def create(
            cls, platform, submitted_on, report_type, category,
            platform_version, android_device_country_locale_code,
            android_sdk_version, android_device_model, entry_point,
            entry_point_topic_id, entry_point_story_id,
            entry_point_exploration_id, entry_point_subtopic_id,
            text_language_code, audio_language_code, android_report_info,
            web_report_info):
        """Creates a new AppFeedbackReportModel instance and returns its ID.

        Args:
            platform: str. The platform the report is submitted on.
            submitted_on: datetime.datetime. The date and time the report was
                submitted, in the user's local time zone.
            report_type: str. The type of report.
            category: str. The category the report is providing feedback on.
            platform_version: str. The version of Oppia that the report was
                submitted on.
            android_device_country_locale_code: str|None. The ISO-3166 code for
                the user's country locale or None if it's a web report.
            android_sdk_version: int|None. The SDK version running when on the
                device or None if it's a web report.
            android_device_model: str|None. The device model of the Android
                device, or None if it's a web report.
            entry_point: str. The entry point used to start the report.
            entry_point_topic_id: str|None. The current topic ID depending on
                the type of entry point used.
            entry_point_story_id: str|None. The current story ID depending on
                the type of entry point used.
            entry_point_exploration_id: str|None. The current exploration ID
                depending on the type of entry point used.
            entry_point_subtopic_id: str|None. The current subtopic ID depending
                on the type of entry point used.
            text_language_code: str. The ISO-639 language code for the text
                language set by the user on the Oppia app.
            audio_language_code: str. The language code for the audio language
                set by the user on the Oppia app, as defined by Oppia (not
                necessarily an ISO-639 code).
            android_report_info: dict|None. The information collected as part
                of the Android-specific feedback report.
            web_report_info: dict|None. The information collected as part of the
                web-specific feedback report.

        Returns:
            AppFeedbackReportModel. The newly created AppFeedbackReportModel
            instance.
        """
        entity_id = cls._generate_id(platform, submitted_on)
        android_schema_version = None
        web_schema_version = None
        if platform == PLATFORM_CHOICE_ANDROID:
            android_schema_version = (
                feconf.CURRENT_ANDROID_REPORT_SCHEMA_VERSION)
        else:
            web_schema_version = (
                feconf.CURRENT_WEB_REPORT_SCHEMA_VERSION)
        report_entity = cls(
            id=entity_id, platform=platform, submitted_on=submitted_on,
            report_type=report_type, category=category,
            platform_version=platform_version,
            android_device_country_locale_code=(
                android_device_country_locale_code),
            android_sdk_version=android_sdk_version,
            android_device_model=android_device_model, entry_point=entry_point,
            entry_point_topic_id=entry_point_topic_id,
            entry_point_exploration_id=entry_point_exploration_id,
            entry_point_story_id=entry_point_story_id,
            entry_point_subtopic_id=entry_point_subtopic_id,
            text_language_code=text_language_code,
            audio_language_code=audio_language_code,
            android_report_info=android_report_info,
            android_report_info_schema_version=android_schema_version,
            web_report_info=web_report_info,
            web_report_info_schema_version=web_schema_version)
        report_entity.update_timestamps()
        report_entity.put()
        return entity_id

    @classmethod
    def _generate_id(cls, platform, submitted_on_datetime):
        """Generates key for the instance of AppFeedbackReportModel class in the
        required format with the arguments provided.

        Args:
            platform: str. The platform the user is the report from.
            submitted_on_datetime: datetime.datetime. The datetime that the
                report was submitted on in UTC.

        Returns:
            str. The generated ID for this entity using platform,
            submitted_on_sec, and a random string, of the form
            '[platform].[submitted_on_msec].[random hash]'.
        """
        submitted_datetime_in_msec = utils.get_time_in_millisecs(
            submitted_on_datetime)
        for _ in python_utils.RANGE(base_models.MAX_RETRIES):
            random_hash = utils.convert_to_hash(
                python_utils.UNICODE(
                    utils.get_random_int(base_models.RAND_RANGE)),
                base_models.ID_LENGTH)
            new_id = '%s.%s.%s' % (
                platform, int(submitted_datetime_in_msec),
                random_hash)
            if not cls.get_by_id(new_id):
                return new_id
        raise Exception(
            'The id generator for AppFeedbackReportModel is producing too '
            'many collisions.')

    @staticmethod
    def get_deletion_policy():
        """Model stores the user ID of who has scrubbed this report for auditing
        purposes but otherwise does not contain data directly corresponding to
        the user themselves.
        """
        return base_models.DELETION_POLICY.LOCALLY_PSEUDONYMIZE

    @classmethod
    def get_export_policy(cls):
        """Model contains data referencing user and will be exported."""
        return dict(super(cls, cls).get_export_policy(), **{
            'platform': base_models.EXPORT_POLICY.EXPORTED,
            'scrubbed_by': base_models.EXPORT_POLICY.EXPORTED,
            'ticket_id': base_models.EXPORT_POLICY.EXPORTED,
            'submitted_on': base_models.EXPORT_POLICY.EXPORTED,
            'report_type': base_models.EXPORT_POLICY.EXPORTED,
            'category': base_models.EXPORT_POLICY.EXPORTED,
            'platform_version': base_models.EXPORT_POLICY.EXPORTED,
            'android_device_country_locale_code': (
                base_models.EXPORT_POLICY.NOT_APPLICABLE),
            'android_device_model': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'android_sdk_version': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'entry_point': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'entry_point_topic_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'entry_point_story_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'entry_point_exploration_id': (
                base_models.EXPORT_POLICY.NOT_APPLICABLE),
            'entry_point_subtopic_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'text_language_code': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'audio_language_code': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'android_report_info': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'android_report_info_schema_version':
                base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'web_report_info': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'web_report_info_schema_version':
                base_models.EXPORT_POLICY.NOT_APPLICABLE
        })

    @classmethod
    def export_data(cls, user_id):
        """Exports the data from AppFeedbackReportModel into dict format for
        Takeout.

        Args:
            user_id: str. The ID of the user whose data should be exported;
                this would be the ID of the user who has scrubbed the report.

        Returns:
            dict. Dictionary of the data from AppFeedbackReportModel.
        """
        user_data = dict()
        report_models = cls.get_all().filter(
            cls.scrubbed_by == user_id).fetch()

        for report_model in report_models:
            submitted_on_msec = utils.get_time_in_millisecs(
                report_model.submitted_on)
            user_data[report_model.id] = {
                'scrubbed_by': report_model.scrubbed_by,
                'platform': report_model.platform,
                'ticket_id': report_model.ticket_id,
                'submitted_on': utils.get_human_readable_time_string(
                    submitted_on_msec),
                'report_type': report_model.report_type,
                'category': report_model.category,
                'platform_version': report_model.platform_version
            }
        return user_data

    @staticmethod
    def get_model_association_to_user():
        """Model is exported as multiple instances per user since there
        are multiple reports relevant to a user.
        """
        return base_models.MODEL_ASSOCIATION_TO_USER.MULTIPLE_INSTANCES_PER_USER

    @staticmethod
    def get_lowest_supported_role():
        """The lowest supported role for feedback reports will be moderator."""
        return feconf.ROLE_ID_MODERATOR

    @classmethod
    def has_reference_to_user_id(cls, user_id):
        """Check whether AppFeedbackReportModel exists for user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether a model is associated with the user.
        """
        return cls.query(
            cls.scrubbed_by == user_id).get(keys_only=True) is not None


class AppFeedbackReportTicketModel(base_models.BaseModel):
    """Model for storing tickets created to triage feedback reports.

    Instances of this model contain information about ticket and associated
    reports.

    The id of each model instance is created by combining the entity's
    ticket_name hash, creation timestamp, and a random 16-character string.
    """

    # A name for the ticket given by the maintainer, limited to 100 characters.
    ticket_name = datastore_services.StringProperty(required=True, indexed=True)
    # The Github repository that has the associated issue for this ticket. The
    # possible values correspond to GITHUB_REPO_CHOICES.
    github_issue_repo_name = datastore_services.StringProperty(
        required=False, indexed=True, choices=GITHUB_REPO_CHOICES)
    # The Github issue number that applies to this ticket.
    github_issue_number = datastore_services.IntegerProperty(
        required=False, indexed=True)
    # Whether this ticket has been archived.
    archived = datastore_services.BooleanProperty(required=True, indexed=True)
    # The datetime in UTC that the newest report in this ticket was created on,
    # to help with sorting tickets.
    newest_report_timestamp = datastore_services.DateTimeProperty(
        required=True, indexed=True)
    # A list of report IDs associated with this ticket.
    report_ids = datastore_services.StringProperty(indexed=True, repeated=True)

    @classmethod
    def create(
            cls, ticket_name, github_issue_repo_name, github_issue_number,
            newest_report_timestamp, report_ids):
        """Creates a new AppFeedbackReportTicketModel instance and returns its
        ID.

        Args:
            ticket_name: str. The name assigned to the ticket by the moderator.
            github_issue_repo_name: str. The name of the Github repo with the
                associated Github issue for this ticket.
            github_issue_number: int|None. The Github issue number associated
                with the ticket, if it has one.
            newest_report_timestamp: datetime.datetime. The date and time of the
                newest report that is a part of this ticket.
            report_ids: list(str). The report_ids that are a part of this
                ticket.

        Returns:
            AppFeedbackReportModel. The newly created AppFeedbackReportModel
            instance.
        """
        ticket_id = cls._generate_id(ticket_name)
        ticket_entity = cls(
            id=ticket_id, ticket_name=ticket_name,
            github_issue_repo_name=github_issue_repo_name,
            github_issue_number=github_issue_number, archived=False,
            newest_report_timestamp=newest_report_timestamp,
            report_ids=report_ids)
        # Manually set created_on timestamp so it matches the timestamp used in
        # the id.
        ticket_entity.update_timestamps()
        ticket_entity.put()
        return ticket_id

    @classmethod
    def _generate_id(cls, ticket_name):
        """Generates key for the instance of AppFeedbackReportTicketModel
        class in the required format with the arguments provided.

        Args:
            ticket_name: str. The name assigned to the ticket on creation.

        Returns:
            str. The generated ID for this entity using the current datetime in
            milliseconds (as the entity's creation timestamp), a SHA1 hash of
            the ticket_name, and a random string, of the form
            '[creation_datetime_msec]:[hash(ticket_name)]:[random hash]'.
        """
        current_datetime_in_msec = utils.get_time_in_millisecs(
            datetime.datetime.utcnow())
        for _ in python_utils.RANGE(base_models.MAX_RETRIES):
            name_hash = utils.convert_to_hash(
                ticket_name, base_models.ID_LENGTH)
            random_hash = utils.convert_to_hash(
                python_utils.UNICODE(
                    utils.get_random_int(base_models.RAND_RANGE)),
                base_models.ID_LENGTH)
            new_id = '%s.%s.%s' % (
                int(current_datetime_in_msec), name_hash, random_hash)
            if not cls.get_by_id(new_id):
                return new_id
        raise Exception(
            'The id generator for AppFeedbackReportTicketModel is producing too'
            'many collisions.')

    @staticmethod
    def get_deletion_policy():
        """Model doesn't contain any information directly corresponding to a
        user.
        """
        return base_models.DELETION_POLICY.NOT_APPLICABLE

    @classmethod
    def get_export_policy(cls):
        """Model doesn't contain any data directly corresponding to a user."""
        return dict(super(cls, cls).get_export_policy(), **{
            'ticket_name': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'github_issue_repo_name': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'github_issue_number': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'archived': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'newest_report_timestamp': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'report_ids': base_models.EXPORT_POLICY.NOT_APPLICABLE
        })

    @staticmethod
    def get_model_association_to_user():
        """Model doesn't contain any data directly corresponding to a user."""
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @staticmethod
    def get_lowest_supported_role():
        """The lowest supported role for feedback report tickets will be
        moderator.
        """
        return feconf.ROLE_ID_MODERATOR


class AppFeedbackReportStatsModel(base_models.BaseModel):
    """Model for storing aggregate report stats on the tickets created.

    Instances of this model contain statistics for different report types based
    on the ticket they are assigned to and the date of the aggregation is on.

    The id of each model instance is calculated by concatenating the platform,
    ticket ID, and the date (in isoformat) this entity is tracking stats for.
    """

    # The unique ticket ID that this entity is aggregating for.
    ticket_id = datastore_services.StringProperty(required=True, indexed=True)
    # The platform that these statistics are for.
    platform = datastore_services.StringProperty(
        required=True, indexed=True, choices=PLATFORM_CHOICES)
    # The date in UTC that this entity is tracking on -- this should correspond
    # to the creation date of the reports aggregated in this model.
    stats_tracking_date = datastore_services.DateProperty(
        required=True, indexed=True)
    # The total number of reports submitted on this date.
    total_reports_submitted = datastore_services.IntegerProperty(
        required=True, indexed=True)
    # JSON struct that maps the daily statistics for this ticket on the date
    # specified in stats_tracking_date. The JSON will map each param_name
    # (defined by a domain const ALLOWED_STATS_PARAM_NAMES) to a dictionary of
    # all the possible param_values for that parameter and the number of reports
    # submitted on that day that satisfy that param value, similar to e.g.:
    #
    #   param_name1 : { param_value1 : report_count1,
    #                   param_value2 : report_count2,
    #                   param_value3 : report_count3 },
    #   param_name2 : { param_value1 : report_count1,
    #                   param_value2 : report_count2,
    #                   param_value3 : report_count3 } }.
    daily_param_stats = datastore_services.JsonProperty(
        required=True, indexed=False)
    # The schema version for parameter statistics in this entity.
    daily_param_stats_schema_version = datastore_services.IntegerProperty(
        required=True, indexed=True)

    @classmethod
    def create(
            cls, platform, ticket_id, stats_tracking_date,
            total_reports_submitted, daily_param_stats):
        """Creates a new AppFeedbackReportStatsModel instance and returns its
        ID.

        Args:
            ticket_id: str. The ID for the ticket these stats aggregate on.
            platform: str. The platform the stats are aggregating for.
            stats_tracking_date: datetime.date. The date in UTC that this entity
                is tracking stats for.
            total_reports_submitted: int. The total number of reports submitted
                on this date.
            daily_param_stats: dict. The daily stats for this entity, keyed
                by the parameter witch each value mapping a parameter value to
                the number of reports that satisfy that parameter value.

        Returns:
            AppFeedbackReportStatsModel. The newly created
            AppFeedbackReportStatsModel instance.
        """
        entity_id = cls._generate_id(platform, ticket_id, stats_tracking_date)
        stats_entity = cls(
            id=entity_id, ticket_id=ticket_id, platform=platform,
            stats_tracking_date=stats_tracking_date,
            total_reports_submitted=total_reports_submitted,
            daily_param_stats=daily_param_stats,
            daily_param_stats_schema_version=(
                feconf.CURRENT_FEEDBACK_REPORT_STATS_SCHEMA_VERSION))
        stats_entity.update_timestamps()
        stats_entity.put()
        return entity_id

    @classmethod
    def _generate_id(cls, platform, ticket_id, stats_tracking_date):
        """Generates key for the instance of AppFeedbackReportStatsModel
        class in the required format with the arguments provided.

        Args:
            platform: str. The platform this entity is aggregating on.
            ticket_id: str. The ID for the ticket these stats aggregate on.
            stats_tracking_date: date. The date these stats are tracking on.

        Returns:
            str. The generated ID for this entity of the form
            '[platform]:[ticket_id]:[stats_date in YYYY-MM-DD]'.
        """
        for _ in python_utils.RANGE(base_models.MAX_RETRIES):
            new_id = '%s:%s:%s' % (
                platform, ticket_id,
                stats_tracking_date.isoformat())
            if not cls.get_by_id(new_id):
                return new_id
        raise Exception(
            'The id generator for AppFeedbackReportStatsModel is producing too '
            'many collisions.')

    @classmethod
    def get_stats_for_ticket(cls, ticket_id):
        """Fetches the stats for a single ticket.

        Args:
            ticket_id: str. The ID of the ticket to get stats for.

        Returns:
            list(str). A list of IDs corresponding to
            AppFeedbackReportStatsModel entities that record stats on the
            ticket.
        """
        return cls.query(cls.ticket_id == ticket_id).fetch()

    @staticmethod
    def get_deletion_policy():
        """Model doesn't contain any information directly corresponding to a
        user.
        """
        return base_models.DELETION_POLICY.NOT_APPLICABLE

    @classmethod
    def get_export_policy(cls):
        """Model doesn't contain any data directly corresponding to a user."""
        return dict(super(cls, cls).get_export_policy(), **{
            'ticket_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'platform': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'stats_tracking_date': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'total_reports_submitted': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'daily_param_stats_schema_version':
                base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'daily_param_stats': base_models.EXPORT_POLICY.NOT_APPLICABLE
        })

    @staticmethod
    def get_model_association_to_user():
        """Model doesn't contain any data directly corresponding to a user."""
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @staticmethod
    def get_lowest_supported_role():
        """The lowest supported role for feedback reports stats will be
        moderator.
        """
        return feconf.ROLE_ID_MODERATOR
