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
class CATEGORY(enum.Enum): # pylint: disable=invalid-name
    """Enum for categories."""

    feature_suggestion = 'feature_suggestion' # pylint: disable=invalid-name
    language_suggestion = 'language_suggestion' # pylint: disable=invalid-name
    other_suggestion = 'other_suggestion' # pylint: disable=invalid-name
    lesson_question_issue = 'lesson_question_issue' # pylint: disable=invalid-name
    language_general_issue = 'language_general_issue' # pylint: disable=invalid-name
    language_audio_issue = 'language_audio_issue' # pylint: disable=invalid-name
    language_text_issue = 'language_text_issue' # pylint: disable=invalid-name
    topics_issue = 'topics_issue' # pylint: disable=invalid-name
    profile_issue = 'profile_issue' # pylint: disable=invalid-name
    other_issue = 'other_issue' # pylint: disable=invalid-name
    lesson_player_crash = 'lesson_player_crash' # pylint: disable=invalid-name
    practice_questions_crash = 'practice_questions_crash' # pylint: disable=invalid-name
    options_page_crash = 'options_page_crash' # pylint: disable=invalid-name
    profile_page_crash = 'profile_page_crash' # pylint: disable=invalid-name
    other_crash = 'other_crash' # pylint: disable=invalid-name


class EntryPoint(enum.Enum):
    """Enum for entry points."""

    NAVIGATION_DRAWER = 'navigation_drawer'
    LESSON_PLAYER = 'lesson_player'
    REVISION_CARD = 'revision_card'
    CRASH = 'crash'


class StatsParameterNames(enum.Enum):
    """Enum for stats parameter names."""

    PLATFORM = 'platform'
    REPORT_TYPE = 'report_type'
    COUNTRY_LOCALE_CODE = 'country_locale_code'
    ENTRY_POINT_NAME = 'entry_point_name'
    TEXT_LANGUAGE_CODE = 'text_language_code'
    AUDIO_LANGUAGE_CODE = 'audio_language_code'
    ANDROID_SDK_VERSION = 'android_sdk_version'
    VERSION_NAME = 'version_name'


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
    CATEGORY.feature_suggestion, CATEGORY.language_suggestion,
    CATEGORY.other_suggestion, CATEGORY.language_general_issue,
    CATEGORY.language_audio_issue, CATEGORY.language_text_issue,
    CATEGORY.topics_issue, CATEGORY.profile_issue, CATEGORY.other_issue,
    CATEGORY.lesson_player_crash, CATEGORY.practice_questions_crash,
    CATEGORY.options_page_crash, CATEGORY.profile_page_crash,
    CATEGORY.other_crash]
ALLOWED_ONLY_INPUT_TEXT_CATEGORIES = [
    CATEGORY.feature_suggestion, CATEGORY.language_suggestion,
    CATEGORY.other_suggestion, CATEGORY.other_issue,
    CATEGORY.lesson_player_crash, CATEGORY.practice_questions_crash,
    CATEGORY.options_page_crash, CATEGORY.profile_page_crash,
    CATEGORY.other_crash]
ALLOWED_SELECTION_ITEMS_CATEGORIES = [
    CATEGORY.language_audio_issue, CATEGORY.language_text_issue,
    CATEGORY.topics_issue, CATEGORY.profile_issue]
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
