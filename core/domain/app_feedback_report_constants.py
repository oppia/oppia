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
    [models.Names.APP_FEEDBACK_REPORT])


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


FilterFieldNames = app_feedback_report_models.FilterFieldNames

ANDROID_ENTRY_POINT = [
    EntryPoint.NAVIGATION_DRAWER, EntryPoint.LESSON_PLAYER,
    EntryPoint.REVISION_CARD, EntryPoint.CRASH]
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
    StatsParameterNames.PLATFORM,
    StatsParameterNames.REPORT_TYPE,
    StatsParameterNames.COUNTRY_LOCALE_CODE,
    StatsParameterNames.ENTRY_POINT_NAME,
    StatsParameterNames.TEXT_LANGUAGE_CODE,
    StatsParameterNames.AUDIO_LANGUAGE_CODE,
    StatsParameterNames.ANDROID_SDK_VERSION,
    StatsParameterNames.VERSION_NAME]
ALLOWED_FILTERS = [
    FilterFieldNames.REPORT_TYPE, FilterFieldNames.PLATFORM,
    FilterFieldNames.ENTRY_POINT, FilterFieldNames.SUBMITTED_ON,
    FilterFieldNames.ANDROID_DEVICE_MODEL,
    FilterFieldNames.ANDROID_SDK_VERSION,
    FilterFieldNames.TEXT_LANGUAGE_CODE,
    FilterFieldNames.AUDIO_LANGUAGE_CODE, FilterFieldNames.PLATFORM_VERSION,
    FilterFieldNames.ANDROID_DEVICE_COUNTRY_LOCALE_CODE]
ALLOWED_ANDROID_NETWORK_TYPES = [
    AndroidNetworkType.WIFI, AndroidNetworkType.CELLULAR,
    AndroidNetworkType.NONE]
ALLOWED_ANDROID_TEXT_SIZES = [
    AndroidTextSize.TEXT_SIZE_UNSPECIFIED, AndroidTextSize.SMALL_TEXT_SIZE,
    AndroidTextSize.MEDIUM_TEXT_SIZE, AndroidTextSize.LARGE_TEXT_SIZE,
    AndroidTextSize.EXTRA_LARGE_TEXT_SIZE]
