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


class ReportType(enum.Enum):
    """Enum for report types."""

    SUGGESTION = 'suggestion'
    ISSUE = 'issue'
    CRASH = 'crash'


class Category(enum.Enum):
    """Enum for categories."""

    FEATURE_SUGGESTION = 'feature_suggestion'
    LANGUAGE_SUGGESTION = 'language_suggestion'
    OTHER_SUGGESTION = 'other_suggestion'
    LESSON_QUESTION_ISSUE = 'lesson_question_issue'
    LANGUAGE_GENERAL_ISSUE = 'language_general_issue'
    LANGUAGE_AUDIO_ISSUE = 'language_audio_issue'
    LANGUAGE_TEXT_ISSUE = 'language_text_issue'
    TOPICS_ISSUE = 'topics_issue'
    PROFILE_ISSUE = 'profile_issue'
    OTHER_ISSUE = 'other_issue'
    LESSON_PLAYER_CRASH = 'lesson_player_crash'
    PRACTICE_QUESTIONS_CRASH = 'practice_questions_crash'
    OPTIONS_PAGE_CRASH = 'options_page_crash'
    PROFILE_PAGE_CRASH = 'profile_page_crash'
    OTHER_CRASH = 'other_crash'


# TODO(#14419): Change naming style of Enum class from SCREAMING_SNAKE_CASE
# to PascalCase and its values to UPPER_CASE. Because we want to be consistent
# throughout the codebase according to the coding style guide.
# https://github.com/oppia/oppia/wiki/Coding-style-guide
class ENTRY_POINT(enum.Enum): # pylint: disable=invalid-name
    """Enum for entry points."""

    navigation_drawer = 'navigation_drawer' # pylint: disable=invalid-name
    lesson_player = 'lesson_player' # pylint: disable=invalid-name
    revision_card = 'revision_card' # pylint: disable=invalid-name
    crash = 'crash' # pylint: disable=invalid-name


# TODO(#14419): Change naming style of Enum class from SCREAMING_SNAKE_CASE
# to PascalCase and its values to UPPER_CASE. Because we want to be consistent
# throughout the codebase according to the coding style guide.
# https://github.com/oppia/oppia/wiki/Coding-style-guide
class STATS_PARAMETER_NAMES(enum.Enum): # pylint: disable=invalid-name
    """Enum for stats parameter names."""

    platform = 'platform' # pylint: disable=invalid-name
    report_type = 'report_type' # pylint: disable=invalid-name
    country_locale_code = 'country_locale_code' # pylint: disable=invalid-name
    entry_point_name = 'entry_point_name' # pylint: disable=invalid-name
    text_language_code = 'text_language_code' # pylint: disable=invalid-name
    audio_language_code = 'audio_language_code' # pylint: disable=invalid-name
    android_sdk_version = 'android_sdk_version' # pylint: disable=invalid-name
    version_name = 'version_name' # pylint: disable=invalid-name


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
    ENTRY_POINT.navigation_drawer, ENTRY_POINT.lesson_player,
    ENTRY_POINT.revision_card, ENTRY_POINT.crash]
ALLOWED_REPORT_TYPES = [
    ReportType.SUGGESTION, ReportType.ISSUE, ReportType.CRASH]
ALLOWED_CATEGORIES = [
    Category.FEATURE_SUGGESTION, Category.LANGUAGE_SUGGESTION,
    Category.OTHER_SUGGESTION, Category.LANGUAGE_GENERAL_ISSUE,
    Category.LANGUAGE_AUDIO_ISSUE, Category.LANGUAGE_TEXT_ISSUE,
    Category.TOPICS_ISSUE, Category.PROFILE_ISSUE, Category.OTHER_ISSUE,
    Category.LESSON_PLAYER_CRASH, Category.PRACTICE_QUESTIONS_CRASH,
    Category.OPTIONS_PAGE_CRASH, Category.PROFILE_PAGE_CRASH,
    Category.OTHER_CRASH]
ALLOWED_ONLY_INPUT_TEXT_CATEGORIES = [
    Category.FEATURE_SUGGESTION, Category.LANGUAGE_SUGGESTION,
    Category.OTHER_SUGGESTION, Category.OTHER_ISSUE,
    Category.LESSON_PLAYER_CRASH, Category.PRACTICE_QUESTIONS_CRASH,
    Category.OPTIONS_PAGE_CRASH, Category.PROFILE_PAGE_CRASH,
    Category.OTHER_CRASH]
ALLOWED_SELECTION_ITEMS_CATEGORIES = [
    Category.LANGUAGE_AUDIO_ISSUE, Category.LANGUAGE_TEXT_ISSUE,
    Category.TOPICS_ISSUE, Category.PROFILE_ISSUE]
ALLOWED_STATS_PARAMETERS = [
    STATS_PARAMETER_NAMES.platform,
    STATS_PARAMETER_NAMES.report_type,
    STATS_PARAMETER_NAMES.country_locale_code,
    STATS_PARAMETER_NAMES.entry_point_name,
    STATS_PARAMETER_NAMES.text_language_code,
    STATS_PARAMETER_NAMES.audio_language_code,
    STATS_PARAMETER_NAMES.android_sdk_version,
    STATS_PARAMETER_NAMES.version_name]
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
