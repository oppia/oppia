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

import enum

from core import feconf
from core.domain import platform_parameter_domain
from core.domain import platform_parameter_registry as registry

from core.platform import models

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import suggestion_models

(suggestion_models,) = models.Registry.import_models([models.Names.SUGGESTION])

Registry = registry.Registry


class ParamNames(enum.Enum):
    """Enum for parameter names."""

    DUMMY_FEATURE = 'dummy_feature'
    DUMMY_PARAMETER = 'dummy_parameter'

    END_CHAPTER_CELEBRATION = 'end_chapter_celebration'
    CHECKPOINT_CELEBRATION = 'checkpoint_celebration'
    CONTRIBUTOR_DASHBOARD_ACCOMPLISHMENTS = (
        'contributor_dashboard_accomplishments')
    ANDROID_BETA_LANDING_PAGE = 'android_beta_landing_page'
    BLOG_PAGES = 'blog_pages'
    DIAGNOSTIC_TEST = 'diagnostic_test'
    IMPROVEMENTS_TAB = 'improvements_tab'
    LEARNER_GROUPS = 'learner_groups'
    PROMO_BAR_ENABLED = 'promo_bar_enabled'
    PROMO_BAR_MESSAGE = 'promo_bar_message'
    RECORD_PLAYTHROUGH_PROBABILITY = 'record_playthrough_probability'
    BATCH_INDEX_FOR_MAILCHIMP = 'batch_index_for_mailchimp'
    HIGH_BOUNCE_RATE_TASK_STATE_BOUNCE_RATE_CREATION_THRESHOLD = (
        'high_bounce_rate_task_state_bounce_rate_creation_threshold')
    HIGH_BOUNCE_RATE_TASK_STATE_BOUNCE_RATE_OBSOLETION_THRESHOLD = (
        'high_bounce_rate_task_state_bounce_rate_obsoletion_threshold')
    HIGH_BOUNCE_RATE_TASK_MINIMUM_EXPLORATION_STARTS = (
        'high_bounce_rate_task_minimum_exploration_starts')
    MAX_NUMBER_OF_TAGS_ASSIGNED_TO_BLOG_POST = (
        'max_number_of_tags_assigned_to_blog_post')
    CONTRIBUTOR_DASHBOARD_REVIEWER_EMAILS_IS_ENABLED = (
        'contributor_dashboard_reviewer_emails_is_enabled')
    ENABLE_ADMIN_NOTIFICATIONS_FOR_SUGGESTIONS_NEEDING_REVIEW = (
        'notify_admins_suggestions_waiting_too_long_is_enabled')
    ENABLE_ADMIN_NOTIFICATIONS_FOR_REVIEWER_SHORTAGE = (
        'enable_admin_notifications_for_reviewer_shortage')
    MAX_NUMBER_OF_SUGGESTIONS_PER_REVIEWER = (
        'max_number_of_suggestions_per_reviewer')
    CSRF_SECRET = 'oppia_csrf_secret'
    EMAIL_SENDER_NAME = 'email_sender_name'
    EMAIL_FOOTER = 'email_footer'
    SIGNUP_EMAIL_SUBJECT_CONTENT = 'signup_email_subject_content'
    SIGNUP_EMAIL_HTML_BODY_CONTENT = 'signup_email_html_body_content'
    UNPUBLISH_EXPLORATION_EMAIL_HTML_BODY = (
        'unpublish_exploration_email_html_body')


# Platform parameters should all be defined below.

Registry.create_feature_flag(
    ParamNames.DUMMY_FEATURE,
    'This is a dummy feature flag.',
    platform_parameter_domain.FeatureStages.DEV,
)

Registry.create_platform_parameter(
    ParamNames.DUMMY_PARAMETER,
    'This is a dummy platform parameter.',
    platform_parameter_domain.DataTypes.STRING
)

Registry.create_feature_flag(
    ParamNames.END_CHAPTER_CELEBRATION,
    'This flag is for the end chapter celebration feature.',
    platform_parameter_domain.FeatureStages.PROD,
)

Registry.create_feature_flag(
    ParamNames.CHECKPOINT_CELEBRATION,
    'This flag is for the checkpoint celebration feature.',
    platform_parameter_domain.FeatureStages.PROD,
)

Registry.create_feature_flag(
    ParamNames.CONTRIBUTOR_DASHBOARD_ACCOMPLISHMENTS,
    'This flag enables showing per-contributor accomplishments on the' +
    ' contributor dashboard.',
    platform_parameter_domain.FeatureStages.PROD,
)

Registry.create_feature_flag(
    ParamNames.ANDROID_BETA_LANDING_PAGE,
    'This flag is for Android beta promo landing page.',
    platform_parameter_domain.FeatureStages.PROD)

Registry.create_feature_flag(
    ParamNames.BLOG_PAGES,
    'This flag is for blog home page, blog author profile page and blog post' +
    ' page.',
    platform_parameter_domain.FeatureStages.PROD)

Registry.create_feature_flag(
    ParamNames.DIAGNOSTIC_TEST,
    'This flag is for the diagnostic test functionality.',
    platform_parameter_domain.FeatureStages.PROD)

Registry.create_feature_flag(
    ParamNames.IMPROVEMENTS_TAB,
    'This flag enables Improvements-Tab for creators in the '
    'exploration editor.',
    platform_parameter_domain.FeatureStages.PROD
)

Registry.create_feature_flag(
    ParamNames.LEARNER_GROUPS,
    'This flag enables learner groups feature.',
    platform_parameter_domain.FeatureStages.PROD
)

Registry.create_platform_parameter(
    ParamNames.PROMO_BAR_ENABLED,
    'Whether the promo bar should be enabled for all users',
    platform_parameter_domain.DataTypes.BOOL
)

Registry.create_platform_parameter(
    ParamNames.PROMO_BAR_MESSAGE,
    'The message to show to all users if the promo bar is enabled',
    platform_parameter_domain.DataTypes.STRING
)

Registry.create_platform_parameter(
    ParamNames.RECORD_PLAYTHROUGH_PROBABILITY,
    'The probability of recording playthroughs',
    platform_parameter_domain.DataTypes.NUMBER,
    default=0.2
)

Registry.create_platform_parameter(
    ParamNames.BATCH_INDEX_FOR_MAILCHIMP,
    'Index of batch to populate mailchimp database.',
    platform_parameter_domain.DataTypes.NUMBER
)

Registry.create_platform_parameter(
    ParamNames.HIGH_BOUNCE_RATE_TASK_STATE_BOUNCE_RATE_CREATION_THRESHOLD,
    'The bounce-rate a state must exceed to create a new improvements task.',
    platform_parameter_domain.DataTypes.NUMBER,
    default=0.2
)

Registry.create_platform_parameter(
    ParamNames.HIGH_BOUNCE_RATE_TASK_STATE_BOUNCE_RATE_OBSOLETION_THRESHOLD,
    'The bounce-rate a state must fall under to discard its improvement task.',
    platform_parameter_domain.DataTypes.NUMBER,
    default=0.2
)

Registry.create_platform_parameter(
    ParamNames.HIGH_BOUNCE_RATE_TASK_MINIMUM_EXPLORATION_STARTS,
    'The minimum number of times an exploration is started before it can '
    'generate high bounce-rate improvements tasks.',
    platform_parameter_domain.DataTypes.NUMBER,
    default=100
)

Registry.create_platform_parameter(
    ParamNames.MAX_NUMBER_OF_TAGS_ASSIGNED_TO_BLOG_POST,
    'The maximum number of tags that can be selected to categorize the blog '
    'post',
    platform_parameter_domain.DataTypes.NUMBER,
    default=10
)

Registry.create_platform_parameter(
    ParamNames.CONTRIBUTOR_DASHBOARD_REVIEWER_EMAILS_IS_ENABLED,
    'Enable sending Contributor Dashboard reviewers email notifications '
    'about suggestions that need review. The default value is false.',
    platform_parameter_domain.DataTypes.BOOL
)

Registry.create_platform_parameter(
    ParamNames.ENABLE_ADMIN_NOTIFICATIONS_FOR_SUGGESTIONS_NEEDING_REVIEW,
    'Enable sending admins email notifications if there are Contributor '
    'Dashboard suggestions that have been waiting for a review for more '
    'than %s days. The default value is false.' % (
        suggestion_models.SUGGESTION_REVIEW_WAIT_TIME_THRESHOLD_IN_DAYS),
    platform_parameter_domain.DataTypes.BOOL
)

Registry.create_platform_parameter(
    ParamNames.ENABLE_ADMIN_NOTIFICATIONS_FOR_REVIEWER_SHORTAGE,
    'Enable sending admins email notifications if Contributor Dashboard '
    'reviewers are needed in specific suggestion types. The default value '
    'is false.',
    platform_parameter_domain.DataTypes.BOOL
)

Registry.create_platform_parameter(
    ParamNames.MAX_NUMBER_OF_SUGGESTIONS_PER_REVIEWER,
    'The maximum number of Contributor Dashboard suggestions per reviewer. If '
    'the number of suggestions per reviewer surpasses this maximum, for any '
    'given suggestion type on the dashboard, the admins are notified by email.',
    platform_parameter_domain.DataTypes.NUMBER,
    default=5
)

Registry.create_platform_parameter(
    ParamNames.CSRF_SECRET,
    'Text used to encrypt CSRF tokens.',
    platform_parameter_domain.DataTypes.STRING,
    default='oppia csrf secret'
)

Registry.create_platform_parameter(
    ParamNames.EMAIL_SENDER_NAME,
    'The default sender name for outgoing emails.',
    platform_parameter_domain.DataTypes.STRING,
    default='Site Admin'
)

Registry.create_platform_parameter(
    ParamNames.EMAIL_FOOTER,
    'The footer to append to all outgoing emails. (This should be written in '
    'HTML and include an unsubscribe link.)',
    platform_parameter_domain.DataTypes.STRING,
    default='You can change your email preferences via the '
    '<a href="%s%s">Preferences</a> page.' % (
        feconf.OPPIA_SITE_URL, feconf.PREFERENCES_URL)
)

Registry.create_platform_parameter(
    ParamNames.SIGNUP_EMAIL_SUBJECT_CONTENT,
    'Subject of email sent after a new user signs up.',
    platform_parameter_domain.DataTypes.STRING,
    default='THIS IS A PLACEHOLDER.'
)

Registry.create_platform_parameter(
    ParamNames.SIGNUP_EMAIL_HTML_BODY_CONTENT,
    'The email body should be written with HTML and not include a salutation '
    'or footer. These emails are only sent if the functionality is enabled in '
    'feconf.py.',
    platform_parameter_domain.DataTypes.STRING,
    default='THIS IS A <b>PLACEHOLDER</b> AND SHOULD BE REPLACED.'
)

Registry.create_platform_parameter(
    ParamNames.UNPUBLISH_EXPLORATION_EMAIL_HTML_BODY,
    'Default content for the email sent after an exploration is unpublished'
    ' by a moderator. These emails are only sent if the functionality is '
    'enabled in feconf.py. Leave this field blank if emails should not be '
    'sent.',
    platform_parameter_domain.DataTypes.STRING,
    default='I\'m writing to inform you that I have unpublished the above '
    'exploration.'
)
