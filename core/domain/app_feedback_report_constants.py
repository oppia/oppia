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

import utils


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
    'platform', 'report_type', 'country_locale_code',
    'entry_point_name', 'text_language_code', 'audio_language_code',
    'sdk_version', 'version_name')
FILTER_FIELD_NAMES = utils.create_enum(
    'platform', 'report_type', 'entry_point', 'submitted_on',
    'android_device_model', 'sdk_version', 'text_language_code',
    'audio_language_code', 'platform_version',
    'android_device_country_locale_code')

MINIMUM_ANDROID_SDK_VERSION = 2
ANDROID_TEXT_SIZE = utils.create_enum(
    'text_size_unspecified', 'small_text_size', 'medium_text_size',
    'large_text_size', 'extra_large_text_size')
ANDROID_ENTRY_POINT = [
    ENTRY_POINT.navigation_drawer, ENTRY_POINT.lesson_player,
    ENTRY_POINT.revision_card, ENTRY_POINT.crash]
ANDROID_VERSION_NAME_DELIMITER = '-'
ANDROID_NETWORK_TYPES = utils.create_enum('wifi', 'cellular', 'none')

ALLOWED_REPORT_TYPES = [
    REPORT_TYPE.suggestion, REPORT_TYPE.issue, REPORT_TYPE.crash]
ALLOWED_CATEGORIES = [
    CATEGORY.suggestion_new_feature, CATEGORY.suggestion_new_language,
    CATEGORY.suggestion_other, CATEGORY.issue_language_general,
    CATEGORY.issue_language_audio, CATEGORY.issue_language_text,
    CATEGORY.issue_topics, CATEGORY.issue_profile, CATEGORY.issue_other,
    CATEGORY.crash_lesson_player, CATEGORY.crash_practice_questions,
    CATEGORY.crash_options_page, CATEGORY.crash_profile_page,
    CATEGORY.crash_other]
ALLOWED_ONLY_INPUT_TEXT_CATEGORIES = [
    CATEGORY.suggestion_other, CATEGORY.issue_other,
    CATEGORY.crash_lesson_player, CATEGORY.crash_practice_questions,
    CATEGORY.crash_options_page, CATEGORY.crash_profile_page,
    CATEGORY.crash_other]
ALLOWED_SELECTION_ITEMS_CATEGORIES = [
    CATEGORY.issue_language_audio, CATEGORY.issue_language_text,
    CATEGORY.issue_topics, CATEGORY.issue_profile, CATEGORY.issue_other]
ALLOWED_STATS_PARAMETERS = [
    STATS_PARAMETER_NAMES.report_type,
    STATS_PARAMETER_NAMES.country_locale_code,
    STATS_PARAMETER_NAMES.entry_point_name,
    STATS_PARAMETER_NAMES.text_language_code,
    STATS_PARAMETER_NAMES.audio_language_code,
    STATS_PARAMETER_NAMES.sdk_version, STATS_PARAMETER_NAMES.version_name]
ALLOWED_ANDROID_NETWORK_TYPES = [
    ANDROID_NETWORK_TYPES.wifi, ANDROID_NETWORK_TYPES.cellular,
    ANDROID_NETWORK_TYPES.none]

ALLOWED_ANDROID_TEXT_SIZES = [
    ANDROID_TEXT_SIZE.text_size_unspecified, ANDROID_TEXT_SIZE.small_text_size,
    ANDROID_TEXT_SIZE.medium_text_size, ANDROID_TEXT_SIZE.large_text_size,
    ANDROID_TEXT_SIZE.extra_large_text_size]

MAXIMUM_TICKET_NAME_LENGTH = 100
PLATFORM_ANDROID = 'android'
PLATFORM_WEB = 'web'