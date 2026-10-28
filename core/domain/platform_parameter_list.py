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
from core.platform import models

from typing import Dict, List, Tuple

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import suggestion_models

(suggestion_models,) = models.Registry.import_models(
    [models.Names.SUGGESTION]
)


class ParamName(enum.Enum):
    """Enum for parameter names."""

    DUMMY_PARAMETER = 'dummy_parameter'
    PROMO_BAR_ENABLED = 'promo_bar_enabled'
    PROMO_BAR_MESSAGE = 'promo_bar_message'
    MAX_NUMBER_OF_TAGS_ASSIGNED_TO_BLOG_POST = (
        'max_number_of_tags_assigned_to_blog_post'
    )
    ALWAYS_ASK_LEARNERS_FOR_ANSWER_DETAILS = (
        'always_ask_learners_for_answer_details'
    )
    HIGH_BOUNCE_RATE_TASK_STATE_BOUNCE_RATE_CREATION_THRESHOLD = (
        'high_bounce_rate_task_state_bounce_rate_creation_threshold'
    )
    HIGH_BOUNCE_RATE_TASK_STATE_BOUNCE_RATE_OBSOLETION_THRESHOLD = (
        'high_bounce_rate_task_state_bounce_rate_obsoletion_threshold'
    )
    HIGH_BOUNCE_RATE_TASK_MINIMUM_EXPLORATION_STARTS = (
        'high_bounce_rate_task_minimum_exploration_starts'
    )
    CONTRIBUTOR_DASHBOARD_REVIEWER_EMAILS_IS_ENABLED = (
        'contributor_dashboard_reviewer_emails_is_enabled'
    )
    ENABLE_ADMIN_NOTIFICATIONS_FOR_SUGGESTIONS_NEEDING_REVIEW = (
        'notify_admins_suggestions_waiting_too_long_is_enabled'
    )
    ENABLE_ADMIN_NOTIFICATIONS_FOR_REVIEWER_SHORTAGE = (
        'enable_admin_notifications_for_reviewer_shortage'
    )
    MAX_NUMBER_OF_SUGGESTIONS_PER_REVIEWER = (
        'max_number_of_suggestions_per_reviewer'
    )
    EMAIL_SENDER_NAME = 'email_sender_name'
    EMAIL_FOOTER = 'email_footer'
    SIGNUP_EMAIL_SUBJECT_CONTENT = 'signup_email_subject_content'
    SIGNUP_EMAIL_BODY_CONTENT = 'signup_email_body_content'
    UNPUBLISH_EXPLORATION_EMAIL_HTML_BODY = (
        'unpublish_exploration_email_html_body'
    )
    RECORD_PLAYTHROUGH_PROBABILITY = 'record_playthrough_probability'
    SYSTEM_EMAIL_ADDRESS = 'system_email_address'
    SYSTEM_EMAIL_NAME = 'system_email_name'
    ADMIN_EMAIL_ADDRESS = 'admin_email_address'
    NOREPLY_EMAIL_ADDRESS = 'noreply_email_address'
    MAILCHIMP_AUDIENCE_ID = 'mailchimp_audience_id'
    MAILCHIMP_USERNAME = 'mailchimp_username'
    MAILGUN_DOMAIN_NAME = 'mailgun_domain_name'
    OPPIA_SITE_URL_FOR_EMAILS = 'oppia_site_url_for_emails'


ALL_PLATFORM_PARAMS_LIST: List[ParamName] = [
    ParamName.ALWAYS_ASK_LEARNERS_FOR_ANSWER_DETAILS,
    ParamName.CONTRIBUTOR_DASHBOARD_REVIEWER_EMAILS_IS_ENABLED,
    ParamName.DUMMY_PARAMETER,
    ParamName.EMAIL_FOOTER,
    ParamName.EMAIL_SENDER_NAME,
    ParamName.ENABLE_ADMIN_NOTIFICATIONS_FOR_REVIEWER_SHORTAGE,
    ParamName.ENABLE_ADMIN_NOTIFICATIONS_FOR_SUGGESTIONS_NEEDING_REVIEW,
    (ParamName.HIGH_BOUNCE_RATE_TASK_STATE_BOUNCE_RATE_CREATION_THRESHOLD),
    (ParamName.HIGH_BOUNCE_RATE_TASK_STATE_BOUNCE_RATE_OBSOLETION_THRESHOLD),
    ParamName.HIGH_BOUNCE_RATE_TASK_MINIMUM_EXPLORATION_STARTS,
    ParamName.MAX_NUMBER_OF_TAGS_ASSIGNED_TO_BLOG_POST,
    ParamName.MAX_NUMBER_OF_SUGGESTIONS_PER_REVIEWER,
    ParamName.PROMO_BAR_ENABLED,
    ParamName.PROMO_BAR_MESSAGE,
    ParamName.SIGNUP_EMAIL_BODY_CONTENT,
    ParamName.SIGNUP_EMAIL_SUBJECT_CONTENT,
    ParamName.UNPUBLISH_EXPLORATION_EMAIL_HTML_BODY,
    ParamName.RECORD_PLAYTHROUGH_PROBABILITY,
    ParamName.SYSTEM_EMAIL_ADDRESS,
    ParamName.SYSTEM_EMAIL_NAME,
    ParamName.ADMIN_EMAIL_ADDRESS,
    ParamName.NOREPLY_EMAIL_ADDRESS,
    ParamName.MAILCHIMP_AUDIENCE_ID,
    ParamName.MAILCHIMP_USERNAME,
    ParamName.MAILGUN_DOMAIN_NAME,
    ParamName.OPPIA_SITE_URL_FOR_EMAILS,
]

PLATFORM_PARAMETER_NAME_TO_DESCRIPTION_DATA_TYPE_AND_DEFAULT: Dict[
    str,
    Tuple[
        str,
        platform_parameter_domain.DataTypes,
        platform_parameter_domain.PlatformDataTypes,
    ],
] = {
    ParamName.DUMMY_PARAMETER.value: (
        'This is a dummy platform parameter.',
        platform_parameter_domain.DataTypes.STRING,
        '',
    ),
    ParamName.UNPUBLISH_EXPLORATION_EMAIL_HTML_BODY.value: (
        'Default content for the email sent after an exploration is '
        'unpublished by a moderator. These emails are only sent if the '
        'functionality is enabled in feconf.py. Leave this field blank '
        'if emails should not be sent.',
        platform_parameter_domain.DataTypes.STRING,
        (
            "I'm writing to inform you that I have unpublished the above exploration."
        ),
    ),
    ParamName.EMAIL_SENDER_NAME.value: (
        'The default sender name for outgoing emails.',
        platform_parameter_domain.DataTypes.STRING,
        'Site Admin',
    ),
    ParamName.EMAIL_FOOTER.value: (
        'The footer to append to all outgoing emails. This should be '
        'written in HTML and include an unsubscribe link. The '
        'LINK_TO_PREFERENCES_PAGE placeholder is replaced with the '
        'preferences page URL before sending.',
        platform_parameter_domain.DataTypes.STRING,
        (
            'You can change your email preferences via the '
            '<a href="%s">Preferences</a> page.'
            % feconf.EMAIL_FOOTER_PREFERENCES_LINK_PLACEHOLDER
        ),
    ),
    ParamName.SIGNUP_EMAIL_SUBJECT_CONTENT.value: (
        'Content of email sent after a new user signs up. Set the email '
        'subject. These emails are only sent if the functionality is enabled '
        'in feconf.py.',
        platform_parameter_domain.DataTypes.STRING,
        'THIS IS A PLACEHOLDER.',
    ),
    ParamName.SIGNUP_EMAIL_BODY_CONTENT.value: (
        'Content of email sent after a new user signs up. (The email body '
        'should be written with HTML and not include a salutation or footer.) '
        'These emails are only sent if the functionality is enabled in '
        'feconf.py.',
        platform_parameter_domain.DataTypes.STRING,
        'THIS IS A <b>PLACEHOLDER</b> AND SHOULD BE REPLACED.',
    ),
    ParamName.PROMO_BAR_ENABLED.value: (
        'Whether the promo bar should be enabled for all users',
        platform_parameter_domain.DataTypes.BOOL,
        False,
    ),
    ParamName.PROMO_BAR_MESSAGE.value: (
        'The message to show to all users if the promo bar is enabled',
        platform_parameter_domain.DataTypes.STRING,
        '',
    ),
    ParamName.ALWAYS_ASK_LEARNERS_FOR_ANSWER_DETAILS.value: (
        'Always ask learners for answer details. For testing -- do not use',
        platform_parameter_domain.DataTypes.BOOL,
        False,
    ),
    ParamName.MAX_NUMBER_OF_TAGS_ASSIGNED_TO_BLOG_POST.value: (
        'The maximum number of tags that can be selected to categorize the blog '
        'post',
        platform_parameter_domain.DataTypes.NUMBER,
        10,
    ),
    ParamName.HIGH_BOUNCE_RATE_TASK_STATE_BOUNCE_RATE_CREATION_THRESHOLD.value: (
        'The bounce-rate a state must exceed to create a new improvements task.',
        platform_parameter_domain.DataTypes.NUMBER,
        0.20,
    ),
    ParamName.HIGH_BOUNCE_RATE_TASK_STATE_BOUNCE_RATE_OBSOLETION_THRESHOLD.value: (
        'The bounce-rate a state must fall under to discard its improvement task.',
        platform_parameter_domain.DataTypes.NUMBER,
        0.20,
    ),
    ParamName.HIGH_BOUNCE_RATE_TASK_MINIMUM_EXPLORATION_STARTS.value: (
        'The minimum number of times an exploration is started before it can '
        'generate high bounce-rate improvements tasks.',
        platform_parameter_domain.DataTypes.NUMBER,
        100,
    ),
    ParamName.CONTRIBUTOR_DASHBOARD_REVIEWER_EMAILS_IS_ENABLED.value: (
        'Enable sending Contributor Dashboard reviewers email notifications '
        'about suggestions that need review. The default value is false.',
        platform_parameter_domain.DataTypes.BOOL,
        False,
    ),
    ParamName.ENABLE_ADMIN_NOTIFICATIONS_FOR_SUGGESTIONS_NEEDING_REVIEW.value: (
        'Enable sending admins email notifications if there are Contributor '
        'Dashboard suggestions that have been waiting for a review for more '
        'than %s days. The default value is false.'
        % (suggestion_models.SUGGESTION_REVIEW_WAIT_TIME_THRESHOLD_IN_DAYS),
        platform_parameter_domain.DataTypes.BOOL,
        False,
    ),
    ParamName.ENABLE_ADMIN_NOTIFICATIONS_FOR_REVIEWER_SHORTAGE.value: (
        'Enable sending admins email notifications if Contributor Dashboard '
        'reviewers are needed in specific suggestion types. The default value '
        'is false.',
        platform_parameter_domain.DataTypes.BOOL,
        False,
    ),
    ParamName.MAX_NUMBER_OF_SUGGESTIONS_PER_REVIEWER.value: (
        'The maximum number of Contributor Dashboard suggestions per reviewer.'
        'If the number of suggestions per reviewer surpasses this maximum, '
        'for any given suggestion type on the dashboard, the admins are '
        'notified by email.',
        platform_parameter_domain.DataTypes.NUMBER,
        5,
    ),
    ParamName.RECORD_PLAYTHROUGH_PROBABILITY.value: (
        'The probability of recording playthroughs',
        platform_parameter_domain.DataTypes.NUMBER,
        0.2,
    ),
    ParamName.SYSTEM_EMAIL_ADDRESS.value: (
        'Email address used for system issued actions.',
        platform_parameter_domain.DataTypes.STRING,
        'system@example.com',
    ),
    ParamName.SYSTEM_EMAIL_NAME.value: (
        'Email name for system issued actions.',
        platform_parameter_domain.DataTypes.STRING,
        '.',
    ),
    ParamName.ADMIN_EMAIL_ADDRESS.value: (
        'Email address used for admin issued actions.',
        platform_parameter_domain.DataTypes.STRING,
        'testadmin@example.com',
    ),
    ParamName.NOREPLY_EMAIL_ADDRESS.value: (
        'Email address used for mails sent by Oppia.',
        platform_parameter_domain.DataTypes.STRING,
        'noreply@example.com',
    ),
    ParamName.MAILCHIMP_AUDIENCE_ID.value: (
        'Audience ID of the mailing list for Oppia in Mailchimp.',
        platform_parameter_domain.DataTypes.STRING,
        '',
    ),
    ParamName.MAILCHIMP_USERNAME.value: (
        'Username of the mailing list for Oppia in Mailchimp.',
        platform_parameter_domain.DataTypes.STRING,
        '',
    ),
    ParamName.MAILGUN_DOMAIN_NAME.value: (
        'Domain name for Mailgun email API.',
        platform_parameter_domain.DataTypes.STRING,
        '',
    ),
    ParamName.OPPIA_SITE_URL_FOR_EMAILS.value: (
        'Oppia site URL used in emails.',
        platform_parameter_domain.DataTypes.STRING,
        'http://localhost:8181',
    ),
}
