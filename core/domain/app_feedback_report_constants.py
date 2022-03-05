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

"""Constants used for app feedback reporting."""

from __future__ import annotations

import enum

from core.platform import models

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import app_feedback_report_models

(app_feedback_report_models,) = models.Registry.import_models(
    [models.NAMES.app_feedback_report])


PLATFORM_CHOICE_ANDROID = app_feedback_report_models.PLATFORM_CHOICE_ANDROID
PLATFORM_CHOICE_WEB = app_feedback_report_models.PLATFORM_CHOICE_WEB
PLATFORM_CHOICES = [PLATFORM_CHOICE_ANDROID, PLATFORM_CHOICE_WEB]
GITHUB_REPO_CHOICES = PLATFORM_CHOICES

# IDs to use for stats model entities tracking all reports and all unticketed
# reports.
ALL_ANDROID_REPORTS_STATS_TICKET_ID = 'all_android_reports_stats_ticket_id'
UNTICKETED_ANDROID_REPORTS_STATS_TICKET_ID = (
    app_feedback_report_models.UNTICKETED_ANDROID_REPORTS_STATS_TICKET_ID)

MAXIMUM_TICKET_NAME_LENGTH = 100
MINIMUM_ANDROID_SDK_VERSION = 2
# Timezone offsets in hours, corresponding to the range of timezone difference
# from GMT.
TIMEZONE_MINIMUM_OFFSET = -12
TIMEZONE_MAXIMUM_OFFSET = 14
REPORT_ID_DELIMITER = '.'
TICKET_ID_DELIMITER = '.'
STATS_ID_DELIMITER = ':'
ANDROID_VERSION_NAME_DELIMITER = '-'


# TODO(#14419): Change naming style of Enum class from SCREAMING_SNAKE_CASE
# to PascalCase and its values to UPPER_CASE. Because we want to be consistent
# throughout the codebase according to the coding style guide.
# https://github.com/oppia/oppia/wiki/Coding-style-guide
class REPORT_TYPE(enum.Enum): # pylint: disable=invalid-name
    """Enum for report types."""

    suggestion = 'suggestion' # pylint: disable=invalid-name
    issue = 'issue' # pylint: disable=invalid-name
    crash = 'crash' # pylint: disable=invalid-name


# TODO(#14419): Change naming style of Enum class from SCREAMING_SNAKE_CASE
# to PascalCase and its values to UPPER_CASE. Because we want to be consistent
# throughout the codebase according to the coding style guide.
# https://github.com/oppia/oppia/wiki/Coding-style-guide
class Category(enum.Enum): # pylint: disable=invalid-name
    """Enum for categories."""

    FEATURE_SUGGESTION = 'feature_suggestion' # pylint: disable=invalid-name
    LANGUAGE_SUGGESTION = 'language_suggestion' # pylint: disable=invalid-name
    OTHER_SUGGESTION = 'other_suggestion' # pylint: disable=invalid-name
    LESSON_QUESTION_ISSUE = 'lesson_question_issue' # pylint: disable=invalid-name
    LANGUAGE_GENERAL_ISSUE = 'language_general_issue' # pylint: disable=invalid-name
    LANGUAGE_AUDIO_ISSUE = 'language_audio_issue' # pylint: disable=invalid-name
    LANGUAGE_TEXT_ISSUE = 'language_text_issue' # pylint: disable=invalid-name
    TOPICS_ISSUE = 'topics_issue' # pylint: disable=invalid-name
    PROFILE_ISSUE = 'profile_issue' # pylint: disable=invalid-name
    OTHER_ISSUE = 'other_issue' # pylint: disable=invalid-name
    LESSON_PLAYER_CRASH = 'lesson_player_crash' # pylint: disable=invalid-name
    PRACTICE_QUESTION_CRASH = 'practice_questions_crash' # pylint: disable=invalid-name
    OPTIONS_PAGE_CRASH = 'options_page_crash' # pylint: disable=invalid-name
    PROFILE_PAGE_CRASH = 'profile_page_crash' # pylint: disable=invalid-name
    OTHER_CRASH = 'other_crash' # pylint: disable=invalid-name


# TODO(#14419): Change naming style of Enum class from SCREAMING_SNAKE_CASE
# to PascalCase and its values to UPPER_CASE. Because we want to be consistent
# throughout the codebase according to the coding style guide.
# https://github.com/oppia/oppia/wiki/Coding-style-guide
class EntryPoint(enum.Enum): # pylint: disable=invalid-name
    """Enum for entry points."""

    NAVIGATION_DRAWER = 'navigation_drawer' # pylint: disable=invalid-name
    LESSON_PLAYER = 'lesson_player' # pylint: disable=invalid-name
    REVISION_CARD = 'revision_card' # pylint: disable=invalid-name
    CRASH = 'crash' # pylint: disable=invalid-name


# TODO(#14419): Change naming style of Enum class from SCREAMING_SNAKE_CASE
# to PascalCase and its values to UPPER_CASE. Because we want to be consistent
# throughout the codebase according to the coding style guide.
# https://github.com/oppia/oppia/wiki/Coding-style-guide
class StatsParameterNames(enum.Enum): # pylint: disable=invalid-name
    """Enum for stats parameter names."""

    PLATFORM = 'platform' # pylint: disable=invalid-name
    REPORT_TYPE = 'report_type' # pylint: disable=invalid-name
    COUNTRY_LOCALE_CODE = 'country_locale_code' # pylint: disable=invalid-name
    ENTRY_POINT_NAME = 'entry_point_name' # pylint: disable=invalid-name
    TEXT_LANGUAGE_CODE = 'text_language_code' # pylint: disable=invalid-name
    AUDIO_LANGUAGE_CODE = 'audio_language_code' # pylint: disable=invalid-name
    ANDROID_SDK_VERSION = 'android_sdk_version' # pylint: disable=invalid-name
    VERSION_NAME = 'version_name' # pylint: disable=invalid-name


class AndroidTextSize(enum.Enum):
    """Enum for android text sizes."""

    TEXT_SIZE_UNSPECIFIED = 'text_size_unspecified'
    SMALL_TEXT_SIZE = 'small_text_size'
    MEDIUM_TEXT_SIZE = 'medium_text_size'
    LARGE_TEXT_SIZE = 'large_text_size'
    EXTRA_LARGE_TEXT_SIZE = 'extra_large_text_size'


class AndroidNetworkType(enum.Enum):
    """Enum for android network types."""

    WIFI = 'wifi'
    CELLULAR = 'cellular'
    NONE = 'none'


FILTER_FIELD_NAMES = app_feedback_report_models.FILTER_FIELD_NAMES

ANDROID_ENTRY_POINT = [
    EntryPoint.NAVIGATION_DRAWER, EntryPoint.LESSON_PLAYER,
    EntryPoint.REVISION_CARD, EntryPoint.CRASH]
ALLOWED_REPORT_TYPES = [
    REPORT_TYPE.suggestion, REPORT_TYPE.issue, REPORT_TYPE.crash]
ALLOWED_CATEGORIES = [
    Category.FEATURE_SUGGESTION, Category.LANGUAGE_SUGGESTION,
    Category.OTHER_SUGGESTION, Category.LANGUAGE_GENERAL_ISSUE,
    Category.LANGUAGE_AUDIO_ISSUE, Category.LANGUAGE_TEXT_ISSUE,
    Category.TOPICS_ISSUE, Category.PROFILE_ISSUE, Category.OTHER_ISSUE,
    Category.LESSON_PLAYER_CRASH, Category.PRACTICE_QUESTION_CRASH,
    Category.OPTIONS_PAGE_CRASH, Category.PROFILE_PAGE_CRASH,
    Category.OTHER_CRASH]
ALLOWED_ONLY_INPUT_TEXT_CATEGORIES = [
    Category.FEATURE_SUGGESTION, Category.LANGUAGE_SUGGESTION,
    Category.OTHER_SUGGESTION, Category.OTHER_ISSUE,
    Category.LESSON_PLAYER_CRASH, Category.PRACTICE_QUESTION_CRASH,
    Category.OPTIONS_PAGE_CRASH, Category.PROFILE_PAGE_CRASH,
    Category.OTHER_CRASH]
ALLOWED_SELECTION_ITEMS_CATEGORIES = [
    Category.LANGUAGE_AUDIO_ISSUE, Category.LANGUAGE_TEXT_ISSUE,
    Category.TOPICS_ISSUE, Category.PROFILE_ISSUE]
ALLOWED_STATS_PARAMETERS = [
    StatsParameterNames.PLATFORM,
    StatsParameterNames.REPORT_TYPE,
    StatsParameterNames.COUNTRY_LOCALE_CODE,
    StatsParameterNames.ENTRY_POINT_NAME,
    StatsParameterNames.TEXT_LANGUAGE_CODE,
    StatsParameterNames.AUDIO_LANGUAGE_CODE,
    StatsParameterNames.ANDROID_SDK_VERSION,
    StatsParameterNames.VERSION_NAME]
ALLOWED_FILTERS = [
    FILTER_FIELD_NAMES.report_type, FILTER_FIELD_NAMES.platform,
    FILTER_FIELD_NAMES.entry_point, FILTER_FIELD_NAMES.submitted_on,
    FILTER_FIELD_NAMES.android_device_model,
    FILTER_FIELD_NAMES.android_sdk_version,
    FILTER_FIELD_NAMES.text_language_code,
    FILTER_FIELD_NAMES.audio_language_code, FILTER_FIELD_NAMES.platform_version,
    FILTER_FIELD_NAMES.android_device_country_locale_code]
ALLOWED_ANDROID_NETWORK_TYPES = [
    AndroidNetworkType.WIFI, AndroidNetworkType.CELLULAR,
    AndroidNetworkType.NONE]
ALLOWED_ANDROID_TEXT_SIZES = [
    AndroidTextSize.TEXT_SIZE_UNSPECIFIED, AndroidTextSize.SMALL_TEXT_SIZE,
    AndroidTextSize.MEDIUM_TEXT_SIZE, AndroidTextSize.LARGE_TEXT_SIZE,
    AndroidTextSize.EXTRA_LARGE_TEXT_SIZE]
