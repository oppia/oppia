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

"""Domain objects for app feedback reports."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import re

from core.domain import app_feedback_report_constants as constants
from core.domain import exp_services
from core.domain import story_domain
from core.domain import topic_domain
from core.platform import models

import feconf
import python_utils
import utils

(app_feedback_report_models,) = models.Registry.import_models(
    [models.NAMES.app_feedback_report])


class AppFeedbackReport(python_utils.OBJECT):
    """Domain object for a single feedback report."""

    def __init__(
            self, report_id, schema_version, platform, submitted_on_timestamp,
            local_timezone_offset_hrs, ticket_id, scrubbed_by,
            user_supplied_feedback, device_system_context, app_context):
        """Constructs an AppFeedbackReport domain object.

        Args:
            report_id: str. The unique ID of the report.
            schema_version: int. The schema version of this feedback report.
            platform: str. The platform this report is for.
            submitted_on_timestamp: datetime.datetime. Timestamp in seconds
                since epoch (in UTC) of when the report was submitted by the
                user.
            local_timezone_offset_hrs: int. The number of hours offset from UTC
                for the user's local time.
            ticket_id: str|None. The unique ID that this ticket is assigned to;
                None if this report is not yet ticketed.
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
        self.schema_version = schema_version
        self.platform = platform
        self.submitted_on_timestamp = submitted_on_timestamp
        self.local_timezone_offset_hrs = local_timezone_offset_hrs
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
            'schema_version': self.schema_version,
            'platform': self.platform,
            'submitted_on_timestamp': utils.get_human_readable_time_string(
                utils.get_time_in_millisecs(self.submitted_on_timestamp)),
            'local_timezone_offset_hrs': self.local_timezone_offset_hrs,
            'ticket_id': self.ticket_id,
            'scrubbed_by': self.scrubbed_by,
            'user_supplied_feedback': self.user_supplied_feedback.to_dict(),
            'device_system_context': self.device_system_context.to_dict(),
            'app_context': self.app_context.to_dict()
        }

    def validate(self):
        """Validates all properties of this report and its constituents.

        Raises:
            ValidationError. One or more attributes of the AppFeedbackReport are
                not valid.
            NotImplementedError. The full validation for web report domain
                objects is not implemented yet.
        """
        self.require_valid_schema_version(self.platform, self.schema_version)
        self.require_valid_platform(self.platform)

        if self.scrubbed_by is not None:
            self.require_valid_scrubber_id(self.scrubbed_by)

        if not (
                constants.TIMEZONE_MINIMUM_OFFSET <=
                self.local_timezone_offset_hrs <=
                constants.TIMEZONE_MAXIMUM_OFFSET):
            raise utils.ValidationError(
                'Expected local timezone offset to be in [%d, %d], '
                'received: %d' % (
                    constants.TIMEZONE_MINIMUM_OFFSET,
                    constants.TIMEZONE_MAXIMUM_OFFSET,
                    self.local_timezone_offset_hrs))

        if self.ticket_id is not None:
            AppFeedbackReportTicket.require_valid_ticket_id(self.ticket_id)

        self.user_supplied_feedback.validate()

        if (
                self.platform ==
                constants.PLATFORM_CHOICE_ANDROID) and (
                    not isinstance(
                        self.device_system_context,
                        AndroidDeviceSystemContext)):
            raise utils.ValidationError(
                'Expected device and system context to be of type '
                'AndroidDeviceSystemContext for platform %s, '
                'received: %r' % (
                    self.platform, self.device_system_context.__class__))
        elif self.platform == constants.PLATFORM_CHOICE_WEB:
            raise NotImplementedError(
                'Subclasses of DeviceSystemContext for web systems should '
                'implement domain validation.')
        self.device_system_context.validate()

        self.app_context.validate()

    @classmethod
    def require_valid_schema_version(cls, platform, schema_version):
        """Checks whether the report schema version is valid for the given
        platform.

        Args:
            platform: str. The platform to validate the schema version for.
            schema_version: int. The schema version to validate.

        Raises:
            ValidationError. No schema version supplied.
            ValidationError. The schema version is not supported.
        """
        minimum_schema = feconf.MINIMUM_ANDROID_REPORT_SCHEMA_VERSION
        current_schema = feconf.CURRENT_ANDROID_REPORT_SCHEMA_VERSION
        if platform == constants.PLATFORM_CHOICE_WEB:
            minimum_schema = feconf.MINIMUM_WEB_REPORT_SCHEMA_VERSION
            current_schema = feconf.CURRENT_WEB_REPORT_SCHEMA_VERSION
        if not isinstance(schema_version, int) or schema_version <= 0:
            raise utils.ValidationError(
                'The report schema version %r is invalid, expected an integer '
                'in [%d, %d].' % (
                    schema_version, minimum_schema, current_schema))
        if not minimum_schema <= schema_version <= current_schema:
            raise utils.ValidationError(
                'The supported report schema versions for %s reports are '
                '[%d, %d], received: %d.' % (
                    platform, minimum_schema, current_schema, schema_version))

    @classmethod
    def require_valid_platform(cls, platform):
        """Checks whether the platform is valid.

        Args:
            platform: str. The platform to validate.

        Raises:
            ValidationError. No platform supplied.
            ValidationError. The platform is not supported.
        """
        if platform is None:
            raise utils.ValidationError('No platform supplied.')
        if platform not in constants.PLATFORM_CHOICES:
            raise utils.ValidationError(
                'Report platform should be one of %s, received: %s' % (
                    constants.PLATFORM_CHOICES, platform))

    @classmethod
    def require_valid_scrubber_id(cls, scrubber_id):
        """Checks whether the scrubbed_by user is valid.

        Args:
            scrubber_id: str. The user id to validate.

        Raises:
            ValidationError. The user id is not a string.
            ValidationError. The user id is not a valid id format.
        """
        if not isinstance(scrubber_id, python_utils.BASESTRING):
            raise utils.ValidationError(
                'The scrubbed_by user must be a string, but got %r' % (
                    scrubber_id))
        if not utils.is_user_id_valid(scrubber_id):
            raise utils.ValidationError(
                'The scrubbed_by user id %r is invalid.' % scrubber_id)


class UserSuppliedFeedback(python_utils.OBJECT):
    """Domain object for the user-supplied information in feedback reports."""

    def __init__(
            self, report_type, category, user_feedback_selected_items,
            user_feedback_other_text_input):
        """Constructs a UserSuppliedFeedback domain object.

        Args:
            report_type: REPORT_TYPE. The type of feedback submitted by the user
                as an enum.
            category: CATEGORY. The category enum that this specific report_type
                is providing feedback on that correponds.
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
            'report_type': self.report_type.name,
            'category': self.category.name,
            'user_feedback_selected_items': self.user_feedback_selected_items,
            'user_feedback_other_text_input': (
                self.user_feedback_other_text_input)
        }

    def validate(self):
        """Validates this UserSuppliedFeedback domain object.

        Raises:
            ValidationError. One or more attributes of the UserSuppliedFeedback
                are not valid.
        """
        self.require_valid_report_type(self.report_type)
        self.require_valid_category(self.category)
        self.require_valid_user_feedback_items_for_category(
            self.category, self.user_feedback_selected_items,
            self.user_feedback_other_text_input)

    @classmethod
    def require_valid_report_type(cls, report_type):
        """Checks whether the report_type is valid.

        Args:
            report_type: REPORT_TYPE. The report type enum to validate.

        Raises:
            ValidationError. No report_type supplied.
            ValidationError. The report_type is not supported.
        """
        if report_type is None:
            raise utils.ValidationError('No report_type supplied.')
        if report_type not in constants.ALLOWED_REPORT_TYPES:
            raise utils.ValidationError(
                'Invalid report type %s, must be one of %s.' % (
                    report_type,
                    constants.ALLOWED_REPORT_TYPES))

    @classmethod
    def require_valid_category(cls, category):
        """Checks whether the category is valid.

        Args:
            category: CATEGORY. The category enum to validate.

        Raises:
            ValidationError. No category supplied.
            ValidationError. The category is not supported.
        """
        if category is None:
            raise utils.ValidationError('No category supplied.')
        if category not in constants.ALLOWED_CATEGORIES:
            raise utils.ValidationError(
                'Invalid category %s, must be one of %s.' % (
                    category, constants.ALLOWED_CATEGORIES))

    @classmethod
    def require_valid_user_feedback_items_for_category(
            cls, category, selected_items, other_text_input):
        """Checks whether the user_feedback_selected_items and
        user_feedback_selected_items are valid for the given cateory and
        selected items.

        Args:
            category: str. The category selected for this report.
            selected_items: list(str). The user feedback selected items to
                validate, chosen by the user in the report.
            other_text_input: str. The user feedback other text input to
                validate, provided by the user in the report.

        Raises:
            ValidationError. The given selection items and text input for the
                category are not valid.
        """
        if category in (
                constants.ALLOWED_SELECTION_ITEMS_CATEGORIES
        ):
            # If the report category enables users to select checkbox options,
            # validate the options selected by the user.
            cls.require_valid_selected_items_for_category(
                category, selected_items)
            if cls._selected_items_include_other(selected_items):
                # If the user selects an 'other' option in their list of
                # selection options, validate the input text.
                cls.require_valid_other_text_input_for_category(
                    category, other_text_input)
            else:
                # Report cannot have any input text in this report.
                if other_text_input is not None:
                    raise utils.ValidationError(
                        'Report cannot have other input text %r for '
                        'category %r.' % (other_text_input, category))

        # If the report category only allows users to provide input text,
        # validate that the user_feedback_selected_items is None and that
        # there is a user_feedback_other_text_input.
        if category in (
                constants.ALLOWED_ONLY_INPUT_TEXT_CATEGORIES
        ):
            if selected_items is not None:
                raise utils.ValidationError(
                    'Report cannot have selection options for category %r.' % (
                        category))
            if other_text_input is None:
                raise utils.ValidationError(
                    'Category %r with \'other\' selected requires text input '
                    'provided by the user.' % category)
            cls.require_valid_other_text_input_for_category(
                category, other_text_input)

    @classmethod
    def require_valid_selected_items_for_category(
            cls, category, selected_items):
        """Checks whether the user_feedback_selected_items are valid.

        Args:
            category: str. The report's category that allows for selection
                items.
            selected_items: list(str). The items selected by the user to
                validate.

        Raises:
            ValidationError. The item is not a valid selection option.
        """
        if selected_items is None:
            raise utils.ValidationError(
                'Category %s requires selection options in the report.' % (
                    category))
        for item in selected_items:
            if not isinstance(item, python_utils.BASESTRING):
                raise utils.ValidationError(
                    'Invalid option %s selected by user.' % item)

    @classmethod
    def require_valid_other_text_input_for_category(cls, category, other_input):
        """Checks whether the user_feedback_other_text_input is valid.

        Args:
            category: str. The category of the report.
            other_input: str. The text inputted by the user.

        Raises:
            ValidationError. The item is not a string.
        """
        if other_input is None:
            raise utils.ValidationError(
                'Category %s requires text input in the report, received:'
                ' %r.' % (category, other_input))
        if not isinstance(other_input, python_utils.BASESTRING):
            raise utils.ValidationError(
                'Invalid input text must be a string, received: %r.' % (
                    other_input))

    @classmethod
    def _selected_items_include_other(cls, selected_items):
        """Checks whether the user_feedback_selected_items include an 'other'
        option. Unless the category is one of ALLOWED_INPUT_TEXT_CATEGORIES, an
        'other' option must be selected for the user to add input text to the
        report.

        Args:
            selected_items: list(str). The list of checkbox options selected
                by the user.

        Returns:
            bool. Whether the selection items include an "other" option.

        Raises:
            bool. Whether an 'other' option is included in the selected items.
        """
        for item in selected_items:
            if 'other' in item.lower():
                return True
        return False


class DeviceSystemContext(python_utils.OBJECT):
    """Domain object for the device and system information from the device used
    to submit the report.
    """

    def __init__(self, version_name, device_country_locale_code):
        """Constructs a DeviceSystemContext domain object.

        Args:
            version_name: str. The specific version of the app being used to
                submit the report.
            device_country_locale_code: str. The user's country locale
                represented as an ISO-3166 code.
        """
        self.version_name = version_name
        self.device_country_locale_code = device_country_locale_code

    def to_dict(self):
        """Returns a dict representing this DeviceSystemContext domain object.
        Subclasses should override this to propertly format any additional
        properties.

        Returns:
            dict. A dict, mapping all fields of DeviceSystemContext instance.
        """
        return {
            'version_name': self.version_name,
            'device_country_locale_code': self.device_country_locale_code
        }

    def validate(self):
        """Validates this DeviceSystemContext domain object.

        Raises:
            NotImplementedError. The derived child classes must implement the
                necessary logic as described above.
        """
        raise NotImplementedError(
            'Subclasses of DeviceSystemContext should implement domain '
            'validation.')


class AndroidDeviceSystemContext(DeviceSystemContext):
    """Domain object for the device and system information specific to an
    Android device.
    """

    def __init__(
            self, version_name, package_version_code,
            device_country_locale_code, device_language_locale_code,
            device_model, sdk_version, build_fingerprint, network_type):
        """Constructs an AndroidDeviceSystemContext domain object.

        Args:
            version_name: str. The specific version of the app being used to
                submit the report.
            package_version_code: int. The Oppia Android package version on the
                device.
            device_country_locale_code: str. The device's country locale code
                as an ISO-639 code, as determined in the Android device's
                settings.
            device_language_locale_code: str. The device's language locale code
                as an ISO-639 code, as determined in the Android device's
                settings.
            device_model: str. The Android device model used to send the report.
            sdk_version: int. The Android SDK version running on the device.
            build_fingerprint: str. The unique build fingerprint of this app
                version.
            network_type: ANDROID_NETWORK_TYPE. The enum for the network type
                the device was connected to.
        """
        super(AndroidDeviceSystemContext, self).__init__(
            version_name, device_country_locale_code)
        self.package_version_code = package_version_code
        self.device_language_locale_code = device_language_locale_code
        self.device_model = device_model
        self.sdk_version = sdk_version
        self.build_fingerprint = build_fingerprint
        self.network_type = network_type

    def to_dict(self):
        """Returns a dict representing this AndroidDeviceSystemContext domain
        object.

        Returns:
            dict. A dict, mapping all fields of AndroidDeviceSystemContext
            instance.
        """
        return {
            'version_name': self.version_name,
            'package_version_code': self.package_version_code,
            'device_country_locale_code': self.device_country_locale_code,
            'device_language_locale_code': self.device_language_locale_code,
            'device_model': self.device_model,
            'sdk_version': self.sdk_version,
            'build_fingerprint': self.build_fingerprint,
            'network_type': self.network_type.name
        }

    def validate(self):
        """Validates this AndroidDeviceSystemContext domain object.

        Raises:
            ValidationError. One or more attributes of the
                AndroidDeviceSystemContext are not valid.
        """
        self.require_valid_version_name(self.version_name)
        self.require_valid_package_version_code(self.package_version_code)
        self.require_valid_locale_code(
            'country', self.device_country_locale_code)
        self.require_valid_locale_code(
            'language', self.device_language_locale_code)

        if self.device_model is None:
            raise utils.ValidationError('No device model supplied.')
        if not isinstance(self.device_model, python_utils.BASESTRING):
            raise utils.ValidationError(
                'Android device model must be an string, received: %r.' % (
                    self.device_model))

        self.require_valid_sdk_version(self.sdk_version)
        if self.build_fingerprint is None:
            raise utils.ValidationError('No build fingerprint supplied.')
        if not isinstance(self.build_fingerprint, python_utils.BASESTRING):
            raise utils.ValidationError(
                'Build fingerprint must be a string, received: %r.' % (
                    self.build_fingerprint))

        self.require_valid_network_type(self.network_type)

    @classmethod
    def require_valid_version_name(cls, version_name):
        """Checks whether the version name is a valid string app version for
        Oppia Android.

        Args:
            version_name: str. The version name for this report.

        Raises:
            ValidationError. The given app version name is not valid.
        """
        if version_name is None:
            raise utils.ValidationError('No version name supplied.')
        if not isinstance(version_name, python_utils.BASESTRING):
            raise utils.ValidationError(
                'Version name must be a string, received: %r.' % version_name)
        if len(version_name.split(
                constants.ANDROID_VERSION_NAME_DELIMITER)) != 3:
            raise utils.ValidationError(
                'The version name is not a valid string format, received: '
                '%s.' % version_name)

    @classmethod
    def require_valid_package_version_code(cls, package_version_code):
        """Checks whether the package version code is a valid string code for
        Oppia Android.

        Args:
            package_version_code: int. The package version code for this report.

        Raises:
            ValidationError. The given code is not valid.
        """
        if package_version_code is None:
            raise utils.ValidationError('No package version code supplied.')
        if not isinstance(package_version_code, int):
            raise utils.ValidationError(
                'Package verion code must be an int, received: %r.' % (
                    package_version_code))
        if not (
                feconf.MINIMUM_ANDROID_PACKAGE_VERSION_CODE <=
                package_version_code <=
                feconf.MAXIMUM_ANDROID_PACKAGE_VERSION_CODE):
            raise utils.ValidationError(
                'Package version code is not a valid int, received: %d. The '
                'supported version codes are within the range [%d, %d].' % (
                    package_version_code,
                    feconf.MINIMUM_ANDROID_PACKAGE_VERSION_CODE,
                    feconf.MAXIMUM_ANDROID_PACKAGE_VERSION_CODE))

    @classmethod
    def require_valid_locale_code(cls, locale_type, locale_code):
        """Checks whether the device's locale code is a valid  code.

        Args:
            locale_type: str. The type of locale code to verify; can be either
                'country' or 'language'.
            locale_code: str. The device's country locale code
                that sent the report.

        Raises:
            ValidationError. The given code is not valid.
        """
        if locale_code is None:
            raise utils.ValidationError(
                'No device %s locale code supplied.' % locale_type)
        if not isinstance(locale_code, python_utils.BASESTRING):
            raise utils.ValidationError(
                'The device\'s %s locale code must be an string, '
                'received: %r.' % (locale_type, locale_code))
        if not cls._match_locale_code_string(locale_code):
            raise utils.ValidationError(
                'The device\'s %s locale code is not a valid string, '
                'received: %s.' % (locale_type, locale_code))

    @classmethod
    def _match_locale_code_string(cls, code):
        """Helper that checks whether the given locale code is a valid code.

        Args:
            code: str. The device's country locale code that sent the report.

        Returns:
            bool. Whether the given code is valid. Valid codes are alphabetic
            string that may contain a number of single hyphens.
        """
        regex_string = r'^([a-z]+[-]?[a-z]+)+$'
        return re.compile(regex_string).match(code.lower())

    @classmethod
    def require_valid_sdk_version(cls, sdk_version):
        """Checks that the Android device's SDK version is a positive integer.

        Args:
            sdk_version: int. The SDK version of the device sending this report.

        Raises:
            ValidationError. The given SDK version  is not valid.
        """
        if sdk_version is None:
            raise utils.ValidationError('No SDK version supplied.')
        if not isinstance(sdk_version, int):
            raise utils.ValidationError(
                'SDK version must be an int, received: %r.' % sdk_version)
        if sdk_version < (
                constants.MINIMUM_ANDROID_SDK_VERSION):
            raise utils.ValidationError(
                'Invalid SDK version, received: %s.' % sdk_version)

    @classmethod
    def require_valid_network_type(cls, network_type):
        """Checks that the Android device's network type is valid.

        Args:
            network_type: ANDROID_NETWORK_TYPES. The network type the device
                was connected to when sending the report, as an enum.

        Raises:
            ValidationError. The given network is not a string.
            ValidationError. The given network is not valid.
        """
        if network_type is None:
            raise utils.ValidationError('No network type supplied.')
        if network_type not in (
                constants.ALLOWED_ANDROID_NETWORK_TYPES):
            raise utils.ValidationError(
                'Invalid network type, received: %s.' % network_type)


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
                in the app.
            audio_language_code: str. The ISO-639 code for the audio language
                set in the app.
        """
        self.entry_point = entry_point
        self.text_language_code = text_language_code
        self.audio_language_code = audio_language_code

    def to_dict(self):
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

    def validate(self):
        """Validates this AppContext domain object.

        Raises:
            NotImplementedError. Subclasses should implement their own
                validation checks.
        """
        raise NotImplementedError(
            'Subclasses of AppContext should implement their own validation '
            'checks.')


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
                in the app.
            audio_language_code: str. The ISO-639 code for the audio language
                set in the app.
            text_size: ANDROID_TEXT_SIZE. The enum type for text size set by
                the user in the app.
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

    def to_dict(self):
        """Returns a dict representing this AndroidAppContext domain object.

        Returns:
            dict. A dict, mapping all fields of AndroidAppContext instance.
        """
        return {
            'entry_point': self.entry_point.to_dict(),
            'text_language_code': self.text_language_code,
            'audio_language_code': self.audio_language_code,
            'text_size': self.text_size.name,
            'only_allows_wifi_download_and_update': (
                self.only_allows_wifi_download_and_update
            ),
            'automatically_update_topics': self.automatically_update_topics,
            'account_is_profile_admin': self.account_is_profile_admin,
            'event_logs': self.event_logs,
            'logcat_logs': self.logcat_logs
        }

    def validate(self):
        """Validates this AndroidAppContext domain object.

        Raises:
            ValidationError. One or more attributes of the
                AndroidAppContext are not valid.
        """
        self.entry_point.validate()
        self.require_valid_language_code('text', self.text_language_code)
        self.require_valid_language_code('audio', self.audio_language_code)
        self.require_valid_text_size(self.text_size)
        if self.only_allows_wifi_download_and_update is None or not (
                isinstance(self.only_allows_wifi_download_and_update, bool)):
            raise utils.ValidationError(
                'only_allows_wifi_download_and_update field should be a '
                'boolean, received: %r' % (
                    self.only_allows_wifi_download_and_update))
        if self.automatically_update_topics is None or not (
                isinstance(self.automatically_update_topics, bool)):
            raise utils.ValidationError(
                'automatically_update_topics field should be a '
                'boolean, received: %r' % self.automatically_update_topics)
        if self.account_is_profile_admin is None or not (
                isinstance(self.account_is_profile_admin, bool)):
            raise utils.ValidationError(
                'account_is_profile_admin field should be a '
                'boolean, received: %r' % self.account_is_profile_admin)
        if self.event_logs is None or not isinstance(self.event_logs, list):
            raise utils.ValidationError(
                'Should have an event log list, received: %r' % self.event_logs)
        if self.logcat_logs is None or not isinstance(self.logcat_logs, list):
            raise utils.ValidationError(
                'Should have a logcat log list, received: %r' % (
                    self.logcat_logs))

    @classmethod
    def require_valid_language_code(cls, language_type, language_code):
        """Checks that the language code is valid.

        Args:
            language_type: str. The type of language code being validates,
                either 'text' or 'audio'.
            language_code: str. The language code being validated, as determined
                by the Oppia app.

        Raises:
            ValidationError. The given code is not valid.
        """
        if language_code is None:
            raise utils.ValidationError(
                'No app %s language code supplied.' % language_type)
        if not isinstance(language_code, python_utils.BASESTRING):
            raise utils.ValidationError(
                'Expected the app\'s %s language code to be a string, '
                'received: %r' % (language_type, language_code))
        if not cls._match_language_code_string(language_code):
            raise utils.ValidationError(
                'The app\'s %s language code is not a valid string, '
                'received: %s.' % (language_type, language_code))

    @classmethod
    def _match_language_code_string(cls, code):
        """Helper that checks whether the given language code is a valid code.

        Args:
            code: str. The language code set on the app.

        Returns:
            bool. Whether the given code is valid. Valid codes are alphabetic
            string that may contain a number of single hyphens.
        """
        regex_string = r'^([a-z]+[-]?[a-z]+)+$'
        return re.compile(regex_string).match(code)

    @classmethod
    def require_valid_text_size(cls, text_size):
        """Checks whether the package version code is a valid string code for
        Oppia Android.

        Args:
            text_size: ANDROID_TEXT_SIZE. The enum type for the text size set by
                the user in the app.

        Raises:
            ValidationError. The given text size is not valid.
        """
        if text_size is None:
            raise utils.ValidationError('No text size supplied.')
        if text_size not in constants.ALLOWED_ANDROID_TEXT_SIZES:
            raise utils.ValidationError(
                'App text size should be one of %s, received: %s' % (
                    constants.ALLOWED_ANDROID_TEXT_SIZES,
                    text_size))


class EntryPoint(python_utils.OBJECT):
    """Domain object for the entry point used to initiate the feedback
    report.
    """

    def __init__(
            self, entry_point, topic_id=None, story_id=None,
            exploration_id=None, subtopic_id=None):
        """Constructs an EntryPoint domain object.

        Args:
            entry_point: ENTRY_POINT. The enum type for entry point used.
            topic_id: str. The id for the current topic if the report was sent
                during a topic in a lesson or revision session.
            story_id: str. The id for the current story if the report was sent
                during a lesson.
            exploration_id: str. The id for the current exploration if the
                report was sent during a lesson.
            subtopic_id: int. The id for the current subtopic if the report was
                sent during a revision session.
        """
        self.entry_point_name = entry_point.name
        self.topic_id = topic_id
        self.story_id = story_id
        self.exploration_id = exploration_id
        self.subtopic_id = subtopic_id

    def to_dict(self):
        """Returns a dict representing this NavigationDrawerEntryPoint domain
        object.

        Raises:
            NotImplementedError. Subclasses should implement their own dict
                representations.
        """
        raise NotImplementedError(
            'Subclasses of EntryPoint should implement their own dict '
            'representations.')

    def validate(self):
        """Validates the EntryPoint domain object.

        Raises:
            NotImplementedError. Subclasses should implement their own
                validation checks.
        """
        raise NotImplementedError(
            'Subclasses of EntryPoint should implement their own validation '
            'checks.')

    @classmethod
    def require_valid_entry_point_name(cls, actual_name, expected_entry_point):
        """Validates this EntryPoint name.

        Args:
            actual_name: str. The name used for this entry point object.
            expected_entry_point: ENTRY_POINT. The enum type that should match
                the given entry_point_name.

        Raises:
            ValidationError. The name is not valid for the type.
        """
        expected_name = expected_entry_point.name
        if actual_name is None:
            raise utils.ValidationError('No entry point name supplied.')
        if not isinstance(actual_name, python_utils.BASESTRING):
            raise utils.ValidationError(
                'Entry point name must be a string, received: %r.' % (
                    actual_name))
        if actual_name is not expected_name:
            raise utils.ValidationError(
                'Expected entry point name %s, received: %s.' % (
                    expected_name, actual_name))

    @classmethod
    def require_valid_entry_point_exploration(cls, exploration_id, story_id):
        """Checks whether the exploration id is a valid one.

        Args:
            exploration_id: str. The exploraiton ID to validate.
            story_id: str. The ID of the story that has this exploration.

        Raises:
            ValidationError. The exploration ID is not a valid ID.
        """
        if not isinstance(exploration_id, python_utils.BASESTRING):
            raise utils.ValidationError(
                'Exploration id should be a string, received: %r' % (
                    exploration_id))
        expected_story_id = exp_services.get_story_id_linked_to_exploration(
            exploration_id)
        if expected_story_id != story_id:
            raise utils.ValidationError(
                'Exploration with id %s is not part of story with id of %s, '
                'should be found in story with id of %s' % (
                    exploration_id, story_id, expected_story_id))


class NavigationDrawerEntryPoint(EntryPoint):
    """Domain object for the Android navigation drawer entry point."""

    def __init__(self):
        """Constructs an NavigationDrawerEntryPoint domain object."""
        super(NavigationDrawerEntryPoint, self).__init__(
            constants.ENTRY_POINT.navigation_drawer, None,
            None, None, None)

    def to_dict(self):
        """Returns a dict representing this NavigationDrawerEntryPoint domain
        object.

        Returns:
            dict. A dict, mapping all fields of NavigationDrawerEntryPoint
            instance.
        """
        return {
            'entry_point_name': self.entry_point_name
        }

    def validate(self):
        """Validates this NavigationDrawerEntryPoint domain object.

        Raises:
            ValidationError. One or more attributes of the
                NavigationDrawerEntryPoint are not valid.
        """
        self.require_valid_entry_point_name(
            self.entry_point_name,
            constants.ENTRY_POINT.navigation_drawer)


class LessonPlayerEntryPoint(EntryPoint):
    """Domain object for the lesson player entry point."""

    def __init__(self, topic_id, story_id, exploration_id):
        """Constructs an LessonPlayerEntryPoint domain object.

        Args:
            topic_id: str. The unique ID for the current topic the user is
                playing when intiating the report.
            story_id: str. The unique ID for the current story the user is
                playing when intiating the report.
            exploration_id: str. The unique ID for the current exploration the
                user is playing when intiating the report.
        """
        super(LessonPlayerEntryPoint, self).__init__(
            constants.ENTRY_POINT.lesson_player, topic_id=topic_id,
            story_id=story_id, exploration_id=exploration_id)

    def to_dict(self):
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

    def validate(self):
        """Validates this LessonPlayerEntryPoint domain object.

        Raises:
            ValidationError. One or more attributes of the
                LessonPlayerEntryPoint are not valid.
        """
        self.require_valid_entry_point_name(
            self.entry_point_name, constants.ENTRY_POINT.lesson_player)
        topic_domain.Topic.require_valid_topic_id(self.topic_id)
        story_domain.Story.require_valid_story_id(self.story_id)
        self.require_valid_entry_point_exploration(
            self.exploration_id, self.story_id)


class RevisionCardEntryPoint(EntryPoint):
    """Domain object for the Android revision card entry point."""

    def __init__(self, topic_id, subtopic_id):
        """Constructs an RevisionCardEntryPoint domain object.

        Args:
            topic_id: str. The unique ID for the current topic the user is
                reviewing when intiating the report.
            subtopic_id: int. The ID for the current subtopic the user is
                reviewing when intiating the report.
        """
        super(RevisionCardEntryPoint, self).__init__(
            constants.ENTRY_POINT.revision_card,
            topic_id, None, None, subtopic_id)

    def to_dict(self):
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

    def validate(self):
        """Validates this RevisionCardEntryPoint domain object.

        Raises:
            ValidationError. One or more attributes of the
                RevisionCardEntryPoint are not valid.
        """
        self.require_valid_entry_point_name(
            self.entry_point_name,
            constants.ENTRY_POINT.revision_card)
        topic_domain.Topic.require_valid_topic_id(self.topic_id)
        if not isinstance(self.subtopic_id, int):
            raise utils.ValidationError(
                'Expected subtopic id to be an int, received %s' % (
                    self.subtopic_id))


class CrashEntryPoint(EntryPoint):
    """Domain object for the Android crash dialog entry point."""

    def __init__(self):
        """Constructs an CrashEntryPoint domain object."""
        super(
            CrashEntryPoint, self).__init__(
                constants.ENTRY_POINT.crash, None, None,
                None, None)

    def to_dict(self):
        """Returns a dict representing this CrashEntryPoint domain object.

        Returns:
            dict. A dict, mapping all fields of CrashEntryPoint
            instance.
        """
        return {
            'entry_point_name': self.entry_point_name
        }

    def validate(self):
        """Validates this CrashEntryPoint domain object.

        Raises:
            ValidationError. One or more attributes of the
                CrashEntryPoint are not valid.
        """
        self.require_valid_entry_point_name(
            self.entry_point_name,
            constants.ENTRY_POINT.crash)


class AppFeedbackReportTicket(python_utils.OBJECT):
    """Domain object for a single ticket created for feedback reports."""

    def __init__(
            self, ticket_id, ticket_name, platform, github_issue_repo_name,
            github_issue_number, archived, newest_report_creation_timestamp,
            reports):
        """Constructs a AppFeedbackReportTicket domain object.

        Args:
            ticket_id: str. The unique ID of the ticket.
            ticket_name: str. The user-readable name given to this ticket.
            platform: str. The platform that the reports in this ticket apply
                to; must be one of PLATFORM_CHOICES.
            github_issue_repo_name: str. The Github repository that has the
                issue addressing this ticket.
            github_issue_number: int. The Github issue number addressing this
                ticket.
            archived: bool. Whether this ticket is archived.
            newest_report_creation_timestamp: datetime.datetime. Timestamp in
                UTC of the newest submitted report that is in this ticket.
            reports: list(str). The list of IDs for the AppFeedbackReports
                assigned to this ticket.
        """
        self.ticket_id = ticket_id
        self.ticket_name = ticket_name
        self.platform = platform
        self.github_issue_repo_name = github_issue_repo_name
        self.github_issue_number = github_issue_number
        self.archived = archived
        self.newest_report_creation_timestamp = newest_report_creation_timestamp
        self.reports = reports

    def to_dict(self):
        """Returns a dict representing this AppFeedbackReportTicket domain
        object.

        Returns:
            dict. A dict, mapping all fields of AppFeedbackReportTicket
            instance.
        """
        return {
            'ticket_id': self.ticket_id,
            'ticket_name': self.ticket_name,
            'platform': self.platform,
            'github_issue_repo_name': self.github_issue_repo_name,
            'github_issue_number': self.github_issue_number,
            'archived': self.archived,
            'newest_report_creation_timestamp': (
                self.newest_report_creation_timestamp.isoformat()),
            'reports': [report_id for report_id in self.reports]
        }

    def validate(self):
        """Validates this AppFeedbackReportTicket domain object.

        Raises:
            ValidationError. One or more attributes of the
                AppFeedbackReportTicket are not valid.
        """

        self.require_valid_ticket_id(self.ticket_id)
        self.require_valid_ticket_name(self.ticket_name)
        AppFeedbackReport.require_valid_platform(self.platform)

        if self.github_issue_repo_name is not None:
            self.require_valid_github_repo(self.github_issue_repo_name)

        if self.github_issue_number is not None:
            if not isinstance(self.github_issue_number, int) or (
                    self.github_issue_number < 1):
                raise utils.ValidationError(
                    'The Github issue number name must be a positive integer, '
                    'received: %r' % self.github_issue_number)

        if not isinstance(self.archived, bool):
            raise utils.ValidationError(
                'The ticket archived status must be a boolean, received: %r' % (
                    self.archived))
        self.require_valid_report_ids(self.reports)

    @classmethod
    def require_valid_ticket_id(cls, ticket_id):
        """Checks whether the ticket id is a valid one.

        Args:
            ticket_id: str. The ticket id to validate.

        Raises:
            ValidationError. The id is an invalid format.
        """
        if ticket_id is None:
            raise utils.ValidationError('No ticket ID supplied.')
        if not isinstance(ticket_id, python_utils.BASESTRING):
            raise utils.ValidationError(
                'The ticket id should be a string, received: %s' % (
                    ticket_id))
        if len(ticket_id.split(constants.TICKET_ID_DELIMITER)) != 3:
            raise utils.ValidationError('The ticket id %s is invalid' % (
                ticket_id))

    @classmethod
    def require_valid_ticket_name(cls, ticket_name):
        """Checks whether the ticket name is a valid one.

        Args:
            ticket_name: str. The ticket name to validate.

        Raises:
            ValidationError. The name is an invalid format.
        """
        if ticket_name is None:
            raise utils.ValidationError('No ticket name supplied.')
        if not isinstance(ticket_name, python_utils.BASESTRING):
            raise utils.ValidationError(
                'The ticket name should be a string, received: %s' % (
                    ticket_name))
        if len(ticket_name) > constants.MAXIMUM_TICKET_NAME_LENGTH:
            raise utils.ValidationError(
                'The ticket name is too long, has %d characters but only '
                'allowed %d characters' % (
                    len(ticket_name),
                    constants.MAXIMUM_TICKET_NAME_LENGTH))

    @classmethod
    def require_valid_report_ids(cls, report_ids):
        """Checks whether the reports in this ticket are valid.

        Args:
            report_ids: list(str). The list of reports IDs of the reports
                associated with this ticket.

        Raises:
            ValidationError. The list of reports is invalid.
        """
        if report_ids is None:
            raise utils.ValidationError('No reports list supplied.')
        if not isinstance(report_ids, list):
            raise utils.ValidationError(
                'The reports list should be a list, received: %r' % (
                    report_ids))
        for report_id in report_ids:
            if app_feedback_report_models.AppFeedbackReportModel.get_by_id(
                    report_id) is None:
                raise utils.ValidationError(
                    'The report with id %s is invalid.' % report_id)

    @classmethod
    def require_valid_github_repo(cls, repo_name):
        """Checks whether the reports in this ticket are valid.

        Args:
            repo_name: str. The name of the repo associated with the Github
                issue.

        Raises:
            ValidationError. The repo name is invalid.
        """
        if not isinstance(repo_name, python_utils.BASESTRING):
            raise utils.ValidationError(
                'The Github repo name should be a string, received: %s' % (
                    repo_name))
        if repo_name not in constants.GITHUB_REPO_CHOICES:
            raise utils.ValidationError(
                'The Github repo %s is invalid, must be one of %s.' % (
                    repo_name,
                    constants.GITHUB_REPO_CHOICES))


class AppFeedbackReportDailyStats(python_utils.OBJECT):
    """Domain object for report statistics on a single day for a specific
    ticket.
    """

    def __init__(
            self, stats_id, ticket, platform, stats_tracking_date,
            total_reports_submitted, daily_param_stats):
        """Constructs a AppFeedbackReportDailyStats domain object.

        Args:
            stats_id: str. The unique ID for ths stats instance.
            platform: str. The platform these report stats are aggregating for.
            ticket: AppFeedbackReportTicket. The AppFeedbackReportTicket domain
                object associated with this ticket.
            stats_tracking_date: datetime.date. The date that this object is
                aggregating stats on, in UTC.
            total_reports_submitted: int. The total number of reports submitted
                on this date for this ticket.
            daily_param_stats: dict. A dict representing the statistics on this
                date. Keys in this dict correpond to STATS_PARAMETER_NAMES
                enums, while values are ReportStatsParameterValueCounts objects.
        """
        self.stats_id = stats_id
        self.ticket = ticket
        self.platform = platform
        self.stats_tracking_date = stats_tracking_date
        self.total_reports_submitted = total_reports_submitted
        self.daily_param_stats = daily_param_stats

    def to_dict(self):
        """Returns a dict representing this AppFeedbackReportDailyStats domain
        object.

        Returns:
            dict. A dict, mapping all fields of AppFeedbackReportDailyStats
            instance.
        """
        return {
            'stats_id': self.stats_id,
            'ticket': self.ticket.to_dict(),
            'platform': self.platform,
            'stats_tracking_date': self.stats_tracking_date.isoformat(),
            'total_reports_submitted': self.total_reports_submitted,
            'daily_param_stats': {
                param_name: param_counts_obj.to_dict()
                for (param_name, param_counts_obj) in (
                    self.daily_param_stats.items())
            }
        }

    def validate(self):
        """Validates this AppFeedbackReportDailyStats domain object.

        Raises:
            ValidationError. One or more attributes of the
                AppFeedbackReportDailyStats are not valid.
        """
        self.require_valid_stats_id(self.stats_id)
        self.ticket.validate()
        AppFeedbackReport.require_valid_platform(self.platform)
        if not isinstance(self.total_reports_submitted, int):
            raise utils.ValidationError(
                'The total number of submitted reports should be an int, '
                'received: %r' % self.total_reports_submitted)
        if self.total_reports_submitted < 1:
            raise utils.ValidationError(
                'The total number of submitted reports should be a positive '
                'int, received: %d' % self.total_reports_submitted)
        self.require_valid_daily_param_stats(self.daily_param_stats)

    @classmethod
    def require_valid_stats_id(cls, stats_id):
        """Checks whether the stats id is a valid one.

        Args:
            stats_id: str. The stats id to validate.

        Raises:
            ValidationError. The id is an invalid format.
        """
        if stats_id is None:
            raise utils.ValidationError('No stats ID supplied.')
        if not isinstance(stats_id, python_utils.BASESTRING):
            raise utils.ValidationError(
                'The stats id should be a string, received: %r' % stats_id)
        if len(stats_id.split(constants.STATS_ID_DELIMITER)) != 3:
            raise utils.ValidationError('The stats id %s is invalid' % stats_id)

    @classmethod
    def require_valid_daily_param_stats(cls, param_stats):
        """Checks whether the statistics in this domain object are valid.

        Args:
            param_stats: dict. The dict representing the daily stats for this
                ticket.

        Raises:
            ValidationError. The dict is an invalid format.
        """
        if not isinstance(param_stats, dict):
            raise utils.ValidationError(
                'The param stats should be a dict, received: %r' % param_stats)
        for (param_name, param_count_obj) in param_stats.items():
            if param_name not in constants.ALLOWED_STATS_PARAMETERS:
                raise utils.ValidationError(
                    'The param %s is not a valid param to aggregate stats on, '
                    'must be one of %s' % (
                        param_name,
                        constants.ALLOWED_STATS_PARAMETERS))
            param_count_obj.validate()


class ReportStatsParameterValueCounts(python_utils.OBJECT):
    """Domain object for the number of reports that satisfy a specific parameter
    value.
    """

    def __init__(self, parameter_value_counts):
        """Constructs a ReportStatsParameterValueCounts domain object.

        Args:
            parameter_value_counts: dict. A dict with keys that correpond to a
                specific value for a given parameter, and integer values for the
                number of reports that satisfy that value.
        """
        self.parameter_value_counts = parameter_value_counts

    def to_dict(self):
        """Returns a dict representing this ReportStatsParameterValueCounts
        domain object.

        Returns:
            dict. A dict, mapping all fields of ReportStatsParameterValueCounts
            instance.
        """
        return {
            param_value_name: value_count
            for (param_value_name, value_count) in (
                self.parameter_value_counts.items())
        }

    def validate(self):
        """Validates this ReportStatsParameterValueCounts domain object.

        Raises:
            ValidationError. One or more attributes of the
                ReportStatsParameterValueCounts are not valid.
        """
        for (param_value, param_count) in self.parameter_value_counts.items():
            if not isinstance(param_value, python_utils.BASESTRING):
                raise utils.ValidationError(
                    'The param value should be a string, received: %r' % (
                        param_value))
            if not isinstance(param_count, int) or param_count < 1:
                raise utils.ValidationError(
                    'The param value count should be a positive int, '
                    'received: %r' % param_count)


class AppFeedbackReportFilter(python_utils.OBJECT):
    """Domain object for a filter that can be applied to the collection of
    feedback reports.
    """

    def __init__(self, filter_field, filter_options):
        """Constructs a AppFeedbackReportFilter domain object.

        Args:
            filter_field: FILTER_FIELD_NAMES. The enum type for the filter
                category, correponding to a field in the AppFeedbackReport
                object.
            filter_options: list(str). The possible values for the given filter.
        """
        self.filter_field = filter_field
        self.filter_options = filter_options

    def to_dict(self):
        """Returns a dict representing this AppFeedbackReportFilter domain
        object.

        Returns:
            dict. A dict, mapping all fields of AppFeedbackReportFilter
            instance.
        """
        return {
            'filter_field': self.filter_field.name,
            'filter_options': self.filter_options.sort()
        }

    def validate(self):
        """Validates this AppFeedbackReportFilter domain object.

        Raises:
            ValidationError. One or more attributes of the
                AppFeedbackReportFilter are not valid.
        """
        if self.filter_field not in constants.ALLOWED_FILTERS:
            raise utils.ValidationError(
                'The filter field should be one of %s, received: %s' % (
                    [item.name for item in constants.ALLOWED_FILTERS],
                    self.filter_field.name))
        if not isinstance(self.filter_options, list):
            raise utils.ValidationError(
                'The filter options should be a list, received: %r' % (
                    self.filter_options))
