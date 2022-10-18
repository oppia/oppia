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

from __future__ import annotations

import datetime
import enum

from core import feconf
from core import utils
from core.platform import models

from typing import (
    Dict, Final, List, Literal, Optional, Sequence, TypedDict, TypeVar)

SELF_REPORT_MODEL = TypeVar(  # pylint: disable=invalid-name
    'SELF_REPORT_MODEL', bound='AppFeedbackReportModel'
)

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import base_models
    from mypy_imports import datastore_services
    from mypy_imports import user_models

(base_models, user_models) = models.Registry.import_models([
    models.Names.BASE_MODEL, models.Names.USER
])

datastore_services = models.Registry.import_datastore_services()

PLATFORM_CHOICE_ANDROID: Final = 'android'
PLATFORM_CHOICE_WEB: Final = 'web'
PLATFORM_CHOICES: Final = [PLATFORM_CHOICE_ANDROID, PLATFORM_CHOICE_WEB]
GITHUB_REPO_CHOICES: Final = PLATFORM_CHOICES


class ReportInfoDict(TypedDict):
    """Type for the report_info dictionary."""

    user_feedback_selected_items: List[str]
    user_feedback_other_text_input: str
    build_fingerprint: str
    event_logs: List[str]
    logcat_logs: List[str]
    package_version_code: int
    language_locale_code: str
    entry_point_info: Dict[str, str]
    text_size: str
    only_allows_wifi_download_and_update: bool
    automatically_update_topics: bool
    is_curriculum_admin: bool
    android_device_language_locale_code: str
    account_is_profile_admin: bool
    network_type: str


# The model field names that can be filtered / sorted for when maintainers
# triage feedback reports.
class FilterFieldNames(enum.Enum):
    """Enum for the model field names that can be filtered"""

    PLATFORM = 'platform'
    REPORT_TYPE = 'report_type'
    ENTRY_POINT = 'entry_point'
    SUBMITTED_ON = 'submitted_on'
    ANDROID_DEVICE_MODEL = 'android_device_model'
    ANDROID_SDK_VERSION = 'android_sdk_version'
    TEXT_LANGUAGE_CODE = 'text_language_code'
    AUDIO_LANGUAGE_CODE = 'audio_language_code'
    PLATFORM_VERSION = 'platform_version'
    ANDROID_DEVICE_COUNTRY_LOCALE_CODE = 'android_device_country_locale_code'


# An ID used for stats model entities tracking all unticketed reports.
UNTICKETED_ANDROID_REPORTS_STATS_TICKET_ID: Final = (
    'unticketed_android_reports_stats_ticket_id')


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
    ID_IS_USED_AS_TAKEOUT_KEY: Literal[True] = True

    # The platform (web or Android) that the report is sent from and that the
    # feedback corresponds to.
    platform = datastore_services.StringProperty(
        required=True, indexed=True,
        choices=PLATFORM_CHOICES)
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
    # The nuber of hours offset from UTC of the user's local timezone.
    local_timezone_offset_hrs = datastore_services.IntegerProperty(
        required=False, indexed=True)
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
    entry_point_subtopic_id = datastore_services.IntegerProperty(
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

    # TODO(#13523): Change 'android_report_info' and 'web_report_info' to domain
    # objects/TypedDict to remove Any from type-annotation below.
    @classmethod
    def create(
        cls,
        entity_id: str,
        platform: str,
        submitted_on: datetime.datetime,
        local_timezone_offset_hrs: int,
        report_type: str,
        category: str,
        platform_version: str,
        android_device_country_locale_code: Optional[str],
        android_sdk_version: Optional[int],
        android_device_model: Optional[str],
        entry_point: str,
        entry_point_topic_id: Optional[str],
        entry_point_story_id: Optional[str],
        entry_point_exploration_id: Optional[str],
        entry_point_subtopic_id: Optional[str],
        text_language_code: str,
        audio_language_code: str,
        android_report_info: Optional[ReportInfoDict],
        web_report_info: Optional[ReportInfoDict]
    ) -> str:
        """Creates a new AppFeedbackReportModel instance and returns its ID.

        Args:
            entity_id: str. The ID used for this entity.
            platform: str. The platform the report is submitted on.
            submitted_on: datetime.datetime. The date and time the report was
                submitted, in the user's local time zone.
            local_timezone_offset_hrs: int. The hours offset from UTC of the
                user's local time zone.
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
            entry_point_subtopic_id: int|None. The current subtopic ID depending
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
            local_timezone_offset_hrs=local_timezone_offset_hrs,
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
    def generate_id(
        cls,
        platform: str,
        submitted_on_datetime: datetime.datetime
    ) -> str:
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

        Raises:
            Exception. If the id generator is producing too many collisions.
        """
        submitted_datetime_in_msec = utils.get_time_in_millisecs(
            submitted_on_datetime)
        for _ in range(base_models.MAX_RETRIES):
            random_hash = utils.convert_to_hash(
                str(utils.get_random_int(base_models.RAND_RANGE)),
                base_models.ID_LENGTH)
            new_id = '%s.%s.%s' % (
                platform, int(submitted_datetime_in_msec), random_hash)
            if not cls.get_by_id(new_id):
                return new_id
        raise Exception(
            'The id generator for AppFeedbackReportModel is producing too '
            'many collisions.')

    @classmethod
    def get_all_unscrubbed_expiring_report_models(
        cls
    ) -> Sequence[AppFeedbackReportModel]:
        """Fetches the reports that are past their 90-days in storage and must
        be scrubbed.

        Returns:
            list(AppFeedbackReportModel). A list of AppFeedbackReportModel
            entities that need to be scrubbed.
        """
        datetime_now = datetime.datetime.utcnow()
        datetime_before_which_to_scrub = datetime_now - (
            feconf.APP_FEEDBACK_REPORT_MAXIMUM_LIFESPAN +
            datetime.timedelta(days=1))
        # The below return checks for '== None' rather than 'is None' since
        # the latter throws "Cannot filter a non-Node argument; received False".
        report_models: Sequence[AppFeedbackReportModel] = cls.query(
            cls.created_on < datetime_before_which_to_scrub,
            cls.scrubbed_by == None  # pylint: disable=singleton-comparison
        ).fetch()
        return report_models

    @classmethod
    def get_filter_options_for_field(
        cls, filter_field: FilterFieldNames
    ) -> List[str]:
        """Fetches values that can be used to filter reports by.

        Args:
            filter_field: FILTER_FIELD_NAME. The enum type of the field we want
                to fetch all possible values for.

        Returns:
            list(str). The possible values that the field name can have.
        """
        query = cls.query(projection=[filter_field.value], distinct=True)
        filter_values = []
        if filter_field == FilterFieldNames.REPORT_TYPE:
            filter_values = [model.report_type for model in query]
        elif filter_field == FilterFieldNames.PLATFORM:
            filter_values = [model.platform for model in query]
        elif filter_field == FilterFieldNames.ENTRY_POINT:
            filter_values = [model.entry_point for model in query]
        elif filter_field == FilterFieldNames.SUBMITTED_ON:
            filter_values = [model.submitted_on.date() for model in query]
        elif filter_field == FilterFieldNames.ANDROID_DEVICE_MODEL:
            filter_values = [model.android_device_model for model in query]
        elif filter_field == FilterFieldNames.ANDROID_SDK_VERSION:
            filter_values = [model.android_sdk_version for model in query]
        elif filter_field == FilterFieldNames.TEXT_LANGUAGE_CODE:
            filter_values = [model.text_language_code for model in query]
        elif filter_field == FilterFieldNames.AUDIO_LANGUAGE_CODE:
            filter_values = [model.audio_language_code for model in query]
        elif filter_field == FilterFieldNames.PLATFORM_VERSION:
            filter_values = [model.platform_version for model in query]
        elif filter_field == (
                FilterFieldNames.ANDROID_DEVICE_COUNTRY_LOCALE_CODE):
            filter_values = [
                model.android_device_country_locale_code for model in query]
        else:
            raise utils.InvalidInputException(
                'The field %s is not a valid field to filter reports on' % (
                    filter_field.name))
        return filter_values

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model stores the user ID of who has scrubbed this report for auditing
        purposes but otherwise does not contain data directly corresponding to
        the user themselves.
        """
        return base_models.DELETION_POLICY.LOCALLY_PSEUDONYMIZE

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model contains data referencing user and will be exported."""
        return dict(super(cls, cls).get_export_policy(), **{
            'platform': base_models.EXPORT_POLICY.EXPORTED,
            'scrubbed_by': base_models.EXPORT_POLICY.EXPORTED,
            'ticket_id': base_models.EXPORT_POLICY.EXPORTED,
            'submitted_on': base_models.EXPORT_POLICY.EXPORTED,
            'local_timezone_offset_hrs': base_models.EXPORT_POLICY.EXPORTED,
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
    def export_data(cls, user_id: str) -> Dict[str, Dict[str, str]]:
        """Exports the data from AppFeedbackReportModel into dict format for
        Takeout.

        Args:
            user_id: str. The ID of the user whose data should be exported;
                this would be the ID of the user who has scrubbed the report.

        Returns:
            dict. Dictionary of the data from AppFeedbackReportModel.
        """
        user_data = {}
        report_models: Sequence[AppFeedbackReportModel] = (
            cls.get_all().filter(cls.scrubbed_by == user_id).fetch())
        for report_model in report_models:
            submitted_on_msec = utils.get_time_in_millisecs(
                report_model.submitted_on)
            if utils.is_user_id_valid(report_model.scrubbed_by):
                scrubbed_by_user_model = user_models.UserSettingsModel.get(
                    report_model.scrubbed_by)
                scrubbed_by_username = scrubbed_by_user_model.username
            else:
                scrubbed_by_username = None
            user_data[report_model.id] = {
                'scrubbed_by': scrubbed_by_username,
                'platform': report_model.platform,
                'ticket_id': report_model.ticket_id,
                'submitted_on': utils.get_human_readable_time_string(
                    submitted_on_msec),
                'local_timezone_offset_hrs': (
                    report_model.local_timezone_offset_hrs),
                'report_type': report_model.report_type,
                'category': report_model.category,
                'platform_version': report_model.platform_version
            }
        return user_data

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model is exported as multiple instances per user since there
        are multiple reports relevant to a user.
        """
        return base_models.MODEL_ASSOCIATION_TO_USER.MULTIPLE_INSTANCES_PER_USER

    @staticmethod
    def get_lowest_supported_role() -> str:
        """The lowest supported role for feedback reports will be moderator."""
        return feconf.ROLE_ID_MODERATOR

    @classmethod
    def has_reference_to_user_id(cls, user_id: str) -> bool:
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
    # The platform that the reports in this ticket pertain to.
    platform = datastore_services.StringProperty(
        required=True, indexed=True,
        choices=PLATFORM_CHOICES)
    # The Github repository that has the associated issue for this ticket. The
    # possible values correspond to GITHUB_REPO_CHOICES. If None then the
    # ticket has not yet been assigned to a Github issue.
    github_issue_repo_name = datastore_services.StringProperty(
        required=False, indexed=True,
        choices=GITHUB_REPO_CHOICES)
    # The Github issue number that applies to this ticket.
    github_issue_number = datastore_services.IntegerProperty(
        required=False, indexed=True)
    # Whether this ticket has been archived.
    archived = datastore_services.BooleanProperty(required=True, indexed=True)
    # The datetime in UTC that the newest report in this ticket was created on,
    # to help with sorting tickets. If all reports assigned to this ticket have
    # been reassigned to a different ticket then this timestamp is None.
    newest_report_timestamp = datastore_services.DateTimeProperty(
        required=False, indexed=True)
    # A list of report IDs associated with this ticket.
    report_ids = datastore_services.StringProperty(indexed=True, repeated=True)

    @classmethod
    def create(
        cls,
        entity_id: str,
        ticket_name: str,
        platform: str,
        github_issue_repo_name: Optional[str],
        github_issue_number: Optional[int],
        newest_report_timestamp: datetime.datetime,
        report_ids: List[str]
    ) -> str:
        """Creates a new AppFeedbackReportTicketModel instance and returns its
        ID.

        Args:
            entity_id: str. The ID used for this entity.
            ticket_name: str. The name assigned to the ticket by the moderator.
            platform: str. The platform that this ticket fixes an issue on,
                corresponding to one of PLATFORM_CHOICES.
            github_issue_repo_name: str. The name of the Github repo with the
                associated Github issue for this ticket.
            github_issue_number: int|None. The Github issue number associated
                with the ticket, if it has one.
            newest_report_timestamp: datetime.datetime. The date and time of the
                newest report that is a part of this ticket, by submission
                datetime.
            report_ids: list(str). The report_ids that are a part of this
                ticket.

        Returns:
            AppFeedbackReportModel. The newly created AppFeedbackReportModel
            instance.
        """
        ticket_entity = cls(
            id=entity_id, ticket_name=ticket_name, platform=platform,
            github_issue_repo_name=github_issue_repo_name,
            github_issue_number=github_issue_number, archived=False,
            newest_report_timestamp=newest_report_timestamp,
            report_ids=report_ids)
        ticket_entity.update_timestamps()
        ticket_entity.put()
        return entity_id

    @classmethod
    def generate_id(cls, ticket_name: str) -> str:
        """Generates key for the instance of AppFeedbackReportTicketModel
        class in the required format with the arguments provided.

        Args:
            ticket_name: str. The name assigned to the ticket on creation.

        Returns:
            str. The generated ID for this entity using the current datetime in
            milliseconds (as the entity's creation timestamp), a SHA1 hash of
            the ticket_name, and a random string, of the form
            '[creation_datetime_msec]:[hash(ticket_name)]:[random hash]'.

        Raises:
            Exception. If the id generator is producing too many collisions.
        """
        current_datetime_in_msec = utils.get_time_in_millisecs(
            datetime.datetime.utcnow())
        for _ in range(base_models.MAX_RETRIES):
            name_hash = utils.convert_to_hash(
                ticket_name, base_models.ID_LENGTH)
            random_hash = utils.convert_to_hash(
                str(utils.get_random_int(base_models.RAND_RANGE)),
                base_models.ID_LENGTH)
            new_id = '%s.%s.%s' % (
                int(current_datetime_in_msec), name_hash, random_hash)
            if not cls.get_by_id(new_id):
                return new_id
        raise Exception(
            'The id generator for AppFeedbackReportTicketModel is producing too'
            'many collisions.')

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model doesn't contain any information directly corresponding to a
        user.
        """
        return base_models.DELETION_POLICY.NOT_APPLICABLE

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model doesn't contain any data directly corresponding to a user."""
        return dict(super(cls, cls).get_export_policy(), **{
            'ticket_name': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'platform': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'github_issue_repo_name': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'github_issue_number': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'archived': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'newest_report_timestamp': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'report_ids': base_models.EXPORT_POLICY.NOT_APPLICABLE
        })

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model doesn't contain any data directly corresponding to a user."""
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @staticmethod
    def get_lowest_supported_role() -> str:
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
        required=True, indexed=True,
        choices=PLATFORM_CHOICES)
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
        cls,
        entity_id: str,
        platform: str,
        ticket_id: str,
        stats_tracking_date: datetime.date,
        total_reports_submitted: int,
        daily_param_stats: Dict[str, Dict[str, int]]
    ) -> str:
        """Creates a new AppFeedbackReportStatsModel instance and returns its
        ID.

        Args:
            entity_id: str. The ID used for this entity.
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
    def calculate_id(
        cls,
        platform: str,
        ticket_id: Optional[str],
        stats_tracking_date: datetime.date
    ) -> str:
        """Generates key for the instance of AppFeedbackReportStatsModel
        class in the required format with the arguments provided.

        Args:
            platform: str. The platform this entity is aggregating on.
            ticket_id: str. The ID for the ticket these stats aggregate on.
            stats_tracking_date: date. The date these stats are tracking on.

        Returns:
            str. The ID for this entity of the form
            '[platform]:[ticket_id]:[stats_date in YYYY-MM-DD]'.
        """
        if ticket_id is None:
            ticket_id = UNTICKETED_ANDROID_REPORTS_STATS_TICKET_ID
        return '%s:%s:%s' % (
            platform, ticket_id, stats_tracking_date.isoformat())

    @classmethod
    def get_stats_for_ticket(
        cls, ticket_id: str
    ) -> Sequence[AppFeedbackReportStatsModel]:
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
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model doesn't contain any information directly corresponding to a
        user.
        """
        return base_models.DELETION_POLICY.NOT_APPLICABLE

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
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
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model doesn't contain any data directly corresponding to a user."""
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @staticmethod
    def get_lowest_supported_role() -> str:
        """The lowest supported role for feedback reports stats will be
        moderator.
        """
        return feconf.ROLE_ID_MODERATOR
