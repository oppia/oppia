# coding: utf-8
#
# Copyright 2020 The Oppia Authors. All Rights Reserved.
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

"""Definition of platform parameters."""

from __future__ import annotations

from typing import List

import enum


class ParamNames(enum.Enum):
    """Enum for parameter names."""

    DUMMY_PARAMETER = 'dummy_parameter'
    PROMO_BAR_ENABLED = 'promo_bar_enabled'
    PROMO_BAR_MESSAGE = 'promo_bar_message'
    MAX_NUMBER_OF_TAGS_ASSIGNED_TO_BLOG_POST = (
        'max_number_of_tags_assigned_to_blog_post')
    ALWAYS_ASK_LEARNERS_FOR_ANSWER_DETAILS = (
        'always_ask_learners_for_answer_details')
    HIGH_BOUNCE_RATE_TASK_STATE_BOUNCE_RATE_CREATION_THRESHOLD = (
        'high_bounce_rate_task_state_bounce_rate_creation_threshold')
    HIGH_BOUNCE_RATE_TASK_STATE_BOUNCE_RATE_OBSOLETION_THRESHOLD = (
        'high_bounce_rate_task_state_bounce_rate_obsoletion_threshold')
    HIGH_BOUNCE_RATE_TASK_MINIMUM_EXPLORATION_STARTS = (
        'high_bounce_rate_task_minimum_exploration_starts')
    CONTRIBUTOR_DASHBOARD_REVIEWER_EMAILS_IS_ENABLED = (
        'contributor_dashboard_reviewer_emails_is_enabled')
    ENABLE_ADMIN_NOTIFICATIONS_FOR_SUGGESTIONS_NEEDING_REVIEW = (
        'notify_admins_suggestions_waiting_too_long_is_enabled')
    ENABLE_ADMIN_NOTIFICATIONS_FOR_REVIEWER_SHORTAGE = (
        'enable_admin_notifications_for_reviewer_shortage')
    MAX_NUMBER_OF_SUGGESTIONS_PER_REVIEWER = (
        'max_number_of_suggestions_per_reviewer')
    EMAIL_SENDER_NAME = 'email_sender_name'
    EMAIL_FOOTER = 'email_footer'
    SIGNUP_EMAIL_SUBJECT_CONTENT = 'signup_email_subject_content'
    SIGNUP_EMAIL_BODY_CONTENT = 'signup_email_body_content'
    UNPUBLISH_EXPLORATION_EMAIL_HTML_BODY = (
        'unpublish_exploration_email_html_body')
    RECORD_PLAYTHROUGH_PROBABILITY = 'record_playthrough_probability'


ALL_PLATFORM_PARAMS_LIST: List[ParamNames] = [
    ParamNames.ALWAYS_ASK_LEARNERS_FOR_ANSWER_DETAILS,
    ParamNames.CONTRIBUTOR_DASHBOARD_REVIEWER_EMAILS_IS_ENABLED,
    ParamNames.DUMMY_PARAMETER,
    ParamNames.EMAIL_FOOTER,
    ParamNames.EMAIL_SENDER_NAME,
    ParamNames.ENABLE_ADMIN_NOTIFICATIONS_FOR_REVIEWER_SHORTAGE,
    ParamNames.ENABLE_ADMIN_NOTIFICATIONS_FOR_SUGGESTIONS_NEEDING_REVIEW,
    (
        ParamNames.
        HIGH_BOUNCE_RATE_TASK_STATE_BOUNCE_RATE_CREATION_THRESHOLD
    ),
    (
        ParamNames.
        HIGH_BOUNCE_RATE_TASK_STATE_BOUNCE_RATE_OBSOLETION_THRESHOLD
    ),
    ParamNames.HIGH_BOUNCE_RATE_TASK_MINIMUM_EXPLORATION_STARTS,
    ParamNames.MAX_NUMBER_OF_TAGS_ASSIGNED_TO_BLOG_POST,
    ParamNames.MAX_NUMBER_OF_SUGGESTIONS_PER_REVIEWER,
    ParamNames.PROMO_BAR_ENABLED,
    ParamNames.PROMO_BAR_MESSAGE,
    ParamNames.SIGNUP_EMAIL_BODY_CONTENT,
    ParamNames.SIGNUP_EMAIL_SUBJECT_CONTENT,
    ParamNames.UNPUBLISH_EXPLORATION_EMAIL_HTML_BODY,
    ParamNames.RECORD_PLAYTHROUGH_PROBABILITY
]
