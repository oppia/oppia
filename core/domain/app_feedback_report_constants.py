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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core import python_utils
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

# Ignoring the untyped call error because python_utils is untyped.
REPORT_TYPE = python_utils.create_enum('suggestion', 'issue', 'crash') # type: ignore[no-untyped-call]
CATEGORY = python_utils.create_enum( # type: ignore[no-untyped-call]
    'feature_suggestion', 'language_suggestion', 'other_suggestion',
    'lesson_question_issue', 'language_general_issue', 'language_audio_issue',
    'language_text_issue', 'topics_issue', 'profile_issue', 'other_issue',
    'lesson_player_crash', 'practice_questions_crash', 'options_page_crash',
    'profile_page_crash', 'other_crash')
ENTRY_POINT = python_utils.create_enum( # type: ignore[no-untyped-call]
    'navigation_drawer', 'lesson_player', 'revision_card', 'crash')
STATS_PARAMETER_NAMES = python_utils.create_enum( # type: ignore[no-untyped-call]
    'platform', 'report_type', 'country_locale_code',
    'entry_point_name', 'text_language_code', 'audio_language_code',
    'android_sdk_version', 'version_name')
ANDROID_TEXT_SIZE = python_utils.create_enum( # type: ignore[no-untyped-call]
    'text_size_unspecified', 'small_text_size', 'medium_text_size',
    'large_text_size', 'extra_large_text_size')
ANDROID_NETWORK_TYPE = python_utils.create_enum('wifi', 'cellular', 'none') # type: ignore[no-untyped-call]
FILTER_FIELD_NAMES = app_feedback_report_models.FILTER_FIELD_NAMES

ANDROID_ENTRY_POINT = [
    ENTRY_POINT.navigation_drawer, ENTRY_POINT.lesson_player,
    ENTRY_POINT.revision_card, ENTRY_POINT.crash]
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
    ANDROID_NETWORK_TYPE.wifi, ANDROID_NETWORK_TYPE.cellular,
    ANDROID_NETWORK_TYPE.none]
ALLOWED_ANDROID_TEXT_SIZES = [
    ANDROID_TEXT_SIZE.text_size_unspecified, ANDROID_TEXT_SIZE.small_text_size,
    ANDROID_TEXT_SIZE.medium_text_size, ANDROID_TEXT_SIZE.large_text_size,
    ANDROID_TEXT_SIZE.extra_large_text_size]
