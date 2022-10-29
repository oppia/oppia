# coding: utf-8
#
# Copyright 2014 The Oppia Authors. All Rights Reserved.
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

"""Config properties and functions for managing email notifications."""

from __future__ import annotations

import datetime
import logging

from core import feconf
from core import schema_utils
from core import utils
from core.constants import constants
from core.domain import change_domain
from core.domain import config_domain
from core.domain import email_services
from core.domain import html_cleaner
from core.domain import rights_domain
from core.domain import subscription_services
from core.domain import suggestion_registry
from core.domain import user_services
from core.platform import models

from typing import (
    Callable, Dict, Final, List, Mapping, Optional, Sequence, Set, Tuple,
    TypedDict, Union)

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import app_identity_services
    from mypy_imports import email_models
    from mypy_imports import suggestion_models
    from mypy_imports import transaction_services

(email_models, suggestion_models) = models.Registry.import_models([
    models.Names.EMAIL,
    models.Names.SUGGESTION
])
app_identity_services = models.Registry.import_app_identity_services()
transaction_services = models.Registry.import_transaction_services()


NEW_REVIEWER_EMAIL_DATA: Dict[str, Dict[str, str]] = {
    constants.CONTRIBUTION_RIGHT_CATEGORY_REVIEW_TRANSLATION: {
        'review_category': 'translations',
        'to_check': 'translation suggestions',
        'description_template': '%s language translations',
        'rights_message_template': (
            'review translation suggestions made by contributors in the %s '
            'language')
    },
    constants.CONTRIBUTION_RIGHT_CATEGORY_REVIEW_VOICEOVER: {
        'review_category': 'voiceovers',
        'to_check': 'voiceover applications',
        'description_template': '%s language voiceovers',
        'rights_message_template': (
            'review voiceover applications made by contributors in the %s '
            'language')
    },
    constants.CONTRIBUTION_RIGHT_CATEGORY_REVIEW_QUESTION: {
        'review_category': 'questions',
        'to_check': 'question suggestions',
        'description': 'questions',
        'rights_message': 'review question suggestions made by contributors'
    }
}

REMOVED_REVIEWER_EMAIL_DATA: Dict[str, Dict[str, str]] = {
    constants.CONTRIBUTION_RIGHT_CATEGORY_REVIEW_TRANSLATION: {
        'review_category': 'translation',
        'role_description_template': (
            'translation reviewer role in the %s language'),
        'rights_message_template': (
            'review translation suggestions made by contributors in the %s '
            'language'),
        'contribution_allowed': 'translations'
    },
    constants.CONTRIBUTION_RIGHT_CATEGORY_REVIEW_VOICEOVER: {
        'review_category': 'voiceover',
        'role_description_template': (
            'voiceover reviewer role in the %s language'),
        'rights_message_template': (
            'review voiceover applications made by contributors in the %s '
            'language'),
        'contribution_allowed': 'voiceovers'
    },
    constants.CONTRIBUTION_RIGHT_CATEGORY_REVIEW_QUESTION: {
        'review_category': 'question',
        'role_description': 'question reviewer role',
        'rights_message': 'review question suggestions made by contributors',
        'contribution_allowed': 'questions'
    }
}

NOTIFICATION_USER_IDS_LIST_SCHEMA: Dict[
    str,
    Union[
        str,
        Dict[str, Union[str, List[Dict[str, str]]]],
        List[Dict[str, Union[str, int]]]
    ]
] = {
    'type': schema_utils.SCHEMA_TYPE_LIST,
    'items': {
        'type': schema_utils.SCHEMA_TYPE_UNICODE,
        'validators': [{
            'id': 'is_valid_user_id',
        }]
    },
    'validators': [{
        'id': 'has_length_at_most',
        'max_value': 5
    }, {
        'id': 'is_uniquified',
    }]
}

EMAIL_HTML_BODY_SCHEMA: Dict[str, Union[str, Dict[str, int]]] = {
    'type': schema_utils.SCHEMA_TYPE_UNICODE,
    'ui_config': {
        'rows': 20,
    }
}

EMAIL_CONTENT_SCHEMA: Dict[
    str,
    Union[
        str,
        List[Dict[str, Union[str, Dict[str, Union[str, Dict[str, int]]]]]]
    ]
] = {
    'type': schema_utils.SCHEMA_TYPE_DICT,
    'properties': [{
        'name': 'subject',
        'schema': {
            'type': schema_utils.SCHEMA_TYPE_UNICODE,
        },
    }, {
        'name': 'html_body',
        'schema': EMAIL_HTML_BODY_SCHEMA,
    }],
}

EMAIL_SENDER_NAME: config_domain.ConfigProperty = config_domain.ConfigProperty(
    'email_sender_name', {'type': 'unicode'},
    'The default sender name for outgoing emails.', 'Site Admin')
EMAIL_FOOTER: config_domain.ConfigProperty = config_domain.ConfigProperty(
    'email_footer', {'type': 'unicode', 'ui_config': {'rows': 5}},
    'The footer to append to all outgoing emails. (This should be written in '
    'HTML and include an unsubscribe link.)',
    'You can change your email preferences via the '
    '<a href="%s%s">Preferences</a> page.' % (
        feconf.OPPIA_SITE_URL, feconf.PREFERENCES_URL))

_PLACEHOLDER_SUBJECT: Final = 'THIS IS A PLACEHOLDER.'
_PLACEHOLDER_HTML_BODY: Final = (
    'THIS IS A <b>PLACEHOLDER</b> AND SHOULD BE REPLACED.'
)

SIGNUP_EMAIL_CONTENT: config_domain.ConfigProperty = (
    config_domain.ConfigProperty(
        'signup_email_content', EMAIL_CONTENT_SCHEMA,
        'Content of email sent after a new user signs up. (The email body '
        'should be written with HTML and not include a salutation or footer.) '
        'These emails are only sent if the functionality is enabled in '
        'feconf.py.',
        {
            'subject': _PLACEHOLDER_SUBJECT,
            'html_body': _PLACEHOLDER_HTML_BODY,
        }
    )
)

EXPLORATION_ROLE_MANAGER: Final = 'manager rights'
EXPLORATION_ROLE_EDITOR: Final = 'editor rights'
EXPLORATION_ROLE_VOICE_ARTIST: Final = 'voice artist rights'
EXPLORATION_ROLE_PLAYTESTER: Final = 'playtest access'

EDITOR_ROLE_EMAIL_HTML_ROLES: Dict[str, str] = {
    rights_domain.ROLE_OWNER: EXPLORATION_ROLE_MANAGER,
    rights_domain.ROLE_EDITOR: EXPLORATION_ROLE_EDITOR,
    rights_domain.ROLE_VOICE_ARTIST: EXPLORATION_ROLE_VOICE_ARTIST,
    rights_domain.ROLE_VIEWER: EXPLORATION_ROLE_PLAYTESTER
}

_EDITOR_ROLE_EMAIL_HTML_RIGHTS: Dict[str, str] = {
    'can_manage': '<li>Change the exploration permissions</li><br>',
    'can_edit': '<li>Edit the exploration</li><br>',
    'can_voiceover': '<li>Voiceover the exploration</li><br>',
    'can_play': '<li>View and playtest the exploration</li><br>'
}

# We don't include "can_voiceover" for managers and editors, since this is
# implied by the email description for "can_edit".
EDITOR_ROLE_EMAIL_RIGHTS_FOR_ROLE: Dict[str, str] = {
    EXPLORATION_ROLE_MANAGER: (
        _EDITOR_ROLE_EMAIL_HTML_RIGHTS['can_manage'] +
        _EDITOR_ROLE_EMAIL_HTML_RIGHTS['can_edit'] +
        _EDITOR_ROLE_EMAIL_HTML_RIGHTS['can_play']),
    EXPLORATION_ROLE_EDITOR: (
        _EDITOR_ROLE_EMAIL_HTML_RIGHTS['can_edit'] +
        _EDITOR_ROLE_EMAIL_HTML_RIGHTS['can_play']),
    EXPLORATION_ROLE_VOICE_ARTIST: (
        _EDITOR_ROLE_EMAIL_HTML_RIGHTS['can_voiceover'] +
        _EDITOR_ROLE_EMAIL_HTML_RIGHTS['can_play']),
    EXPLORATION_ROLE_PLAYTESTER: _EDITOR_ROLE_EMAIL_HTML_RIGHTS['can_play']
}

UNPUBLISH_EXPLORATION_EMAIL_HTML_BODY: config_domain.ConfigProperty = (
    config_domain.ConfigProperty(
        'unpublish_exploration_email_html_body', EMAIL_HTML_BODY_SCHEMA,
        'Default content for the email sent after an exploration is unpublished'
        ' by a moderator. These emails are only sent if the functionality is '
        'enabled in feconf.py. Leave this field blank if emails should not be '
        'sent.',
        'I\'m writing to inform you that I have unpublished the above '
        'exploration.'
    )
)

NOTIFICATION_USER_IDS_FOR_FAILED_TASKS_DEFAULT_VALUE: List[str] = []

NOTIFICATION_USER_IDS_FOR_FAILED_TASKS: config_domain.ConfigProperty = (
    config_domain.ConfigProperty(
        'notification_user_ids_for_failed_tasks',
        NOTIFICATION_USER_IDS_LIST_SCHEMA,
        'User IDs to notify if an ML training task fails',
        NOTIFICATION_USER_IDS_FOR_FAILED_TASKS_DEFAULT_VALUE
    )
)

CONTRIBUTOR_DASHBOARD_REVIEWER_NOTIFICATION_EMAIL_DATA: Dict[str, str] = {
    'email_body_template': (
        'Hi %s,'
        '<br><br>'
        'There are new review opportunities that we think you might be '
        'interested in on the <a href="%s%s">Contributor Dashboard</a>. '
        'Here are some examples of contributions that have been waiting '
        'the longest for review:'
        '<br><br>'
        '<ul>%s</ul><br>'
        'Please take some time to review any of the above contributions (if '
        'they still need a review) or any other contributions on the '
        'dashboard. We appreciate your help!'
        '<br><br>'
        'Thanks again, and happy reviewing!<br>'
        '- The Oppia Contributor Dashboard Team'
        '<br><br>%s'
    ),
    'email_subject': 'Contributor Dashboard Reviewer Opportunities'
}

HTML_FOR_SUGGESTION_DESCRIPTION: Dict[
    str, Dict[str, Union[str, Callable[[Dict[str, str]], Tuple[str, ...]]]]
] = {
    # The templates below are for listing the information for each suggestion
    # type offered on the Contributor Dashboard.
    'suggestion_template': {
        feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT: (
            '<li>The following %s translation suggestion was submitted for '
            'review %s ago:<br>%s</li><br>'),
        feconf.SUGGESTION_TYPE_ADD_QUESTION: (
            '<li>The following question suggestion was submitted for review '
            '%s ago:<br>%s</li><br>')
    },
    # Each suggestion type has a lambda function to retrieve the values needed
    # to populate the above suggestion template.
    'suggestion_template_values_getter_functions': {
        feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT: (
            lambda values_dict: (
                values_dict['language'], values_dict['review_wait_time'],
                values_dict['suggestion_content'])
        ),
        feconf.SUGGESTION_TYPE_ADD_QUESTION: (
            lambda values_dict: (
                values_dict['review_wait_time'],
                values_dict['suggestion_content'])
        )
    }
}

ADMIN_NOTIFICATION_FOR_REVIEWER_SHORTAGE_EMAIL_DATA: Dict[str, str] = {
    'email_body_template': (
        'Hi %s,'
        '<br><br>'
        'In the <a href="%s%s#/roles">admin roles page,</a> please add '
        'reviewers to the Contributor Dashboard community by entering their '
        'username(s) and allow reviewing for the suggestion types that need '
        'more reviewers bolded below.'
        '<br><br>%s'
        'Thanks so much - we appreciate your help!<br><br>'
        'Best Wishes!<br>'
        '- The Oppia Contributor Dashboard Team'
    ),
    'email_subject': 'Reviewers Needed for Contributor Dashboard',
    # The templates below are for listing the information for each suggestion
    # type that needs more reviewers. For translation languages there are two
    # templates to account for: whether one or multiple languages needs more
    # reviewers.
    'one_language_template': (
        'There have been <b>%s translation suggestions</b> created on the '
        '<a href="%s%s">Contributor Dashboard page</a> where there are not '
        'enough reviewers.<br><br>'
    ),
    'multi_language_template': (
        'There have been <b>translation suggestions</b> created on the '
        '<a href="%s%s">Contributor Dashboard page</a> in languages where '
        'there are not enough reviewers. The languages that need more '
        'reviewers are:'
        '<br><ul>%s</ul><br>'
    ),
    'question_template': (
        'There have been <b>question suggestions</b> created on the '
        '<a href="%s%s">Contributor Dashboard page</a> where there are not '
        'enough reviewers.<br><br>' % (
            feconf.OPPIA_SITE_URL, feconf.CONTRIBUTOR_DASHBOARD_URL))
}

ADMIN_NOTIFICATION_FOR_SUGGESTIONS_NEEDING_REVIEW_EMAIL_DATA: Dict[str, str] = {
    'email_body_template': (
        'Hi %s,<br><br>'
        'There are suggestions on the <a href="%s%s">Contributor Dashboard</a> '
        'that have been waiting for more than %s days for review. Please take '
        'a look at the suggestions mentioned below and help them get reviewed '
        'by going to the <a href="%s%s#/roles">admin roles page</a> and either:'
        '<br><br><ul>'
        '<li>Add more reviewers to the suggestion types that have suggestions '
        'waiting too long for a review</li><br>'
        '<li>Find the existing reviewers and email reviewers directly about '
        'the suggestions waiting for a review</li><br>'
        '</ul><br>'
        'Here are the suggestions that have been waiting too long for a review:'
        '<br><br>'
        '<ul>%s</ul><br>'
        'Thanks so much - we appreciate your help!<br>'
        'Best Wishes!<br><br>'
        '- The Oppia Contributor Dashboard Team'
    ),
    'email_subject': (
        'Contributor Dashboard Suggestions Have Been Waiting Too Long for '
        'Review')
}

CONTRIBUTOR_RANK_ACHIEVEMENT_NOTIFICATION: Dict[
    str, Dict[str, Dict[str, str]]] = {
    feconf.CONTRIBUTION_TYPE_TRANSLATION: {
        feconf.CONTRIBUTION_SUBTYPE_ACCEPTANCE: {
            'email_body_template': (
                'Hi %s,<br><br>'
                'This is to let you know that you have successfully achieved '
                'the %s rank for submitting translations in %s. Your efforts '
                'help Oppia grow better every day and support students around '
                'the world.<br><br>'
                'You can check all the achievements you earned in the '
                '<a href="%s%s">Contributor Dashboard</a>.<br><br>'
                'Best wishes and we hope you can continue to contribute!'
                '<br><br>'
                'The Oppia Contributor Dashboard Team'
            ),
            'email_subject': (
                'Oppia Translator Rank Achievement!'
            )
        },
        feconf.CONTRIBUTION_SUBTYPE_REVIEW: {
            'email_body_template': (
                'Hi %s,<br><br>'
                'This is to let you know that you have successfully achieved '
                'the %s rank for reviewing translations in %s. Your efforts '
                'help Oppia grow better every day and support students around '
                'the world.<br><br>'
                'You can check all the achievements you earned in the '
                '<a href="%s%s">Contributor Dashboard</a>.<br><br>'
                'Best wishes and we hope you can continue to contribute!'
                '<br><br>'
                'The Oppia Contributor Dashboard Team'
            ),
            'email_subject': (
                'Oppia Translation Reviewer Rank Achievement!'
            )
        },
        feconf.CONTRIBUTION_SUBTYPE_EDIT: {
            'email_body_template': (
                'Hi %s,<br><br>'
                'This is to let you know that you have successfully achieved '
                'the %s rank for correcting translations in %s. Your efforts '
                'help Oppia grow better every day and support students around '
                'the world.<br><br>'
                'You can check all the achievements you earned in the '
                '<a href="%s%s">Contributor Dashboard</a>.<br><br>'
                'Best wishes and we hope you can continue to contribute!'
                '<br><br>'
                'The Oppia Contributor Dashboard Team'
            ),
            'email_subject': (
                'Oppia Translation Reviewer Rank Achievement!'
            )
        }
    },
    feconf.CONTRIBUTION_TYPE_QUESTION: {
        feconf.CONTRIBUTION_SUBTYPE_ACCEPTANCE: {
            'email_body_template': (
                'Hi %s,<br><br>'
                'This is to let you know that you have successfully achieved '
                'the %s rank for submitting practice questions. Your efforts '
                'help Oppia grow better every day and support students around '
                'the world.<br><br>'
                'You can check all the achievements you earned in the '
                '<a href="%s%s">Contributor Dashboard</a>.<br><br>'
                'Best wishes and we hope you can continue to contribute!'
                '<br><br>'
                'The Oppia Contributor Dashboard Team'
            ),
            'email_subject': (
                'Oppia Question Submitter Rank Achievement!'
            )
        },
        feconf.CONTRIBUTION_SUBTYPE_REVIEW: {
            'email_body_template': (
                'Hi %s,<br><br>'
                'This is to let you know that you have successfully '
                'achieved the %s '
                'rank for reviewing  practice questions. Your efforts help '
                'Oppia grow better every day and support students around the '
                'world.<br><br>'
                'You can check all the achievements you earned in the '
                '<a href="%s%s">Contributor Dashboard</a>.<br><br>'
                'Best wishes and we hope you can continue to contribute!'
                '<br><br>'
                'The Oppia Contributor Dashboard Team'
            ),
            'email_subject': (
                'Oppia Question Reviewer Rank Achievement!'
            )
        },
        feconf.CONTRIBUTION_SUBTYPE_EDIT: {
            'email_body_template': (
                'Hi %s,<br><br>'
                'This is to let you know that you have successfully '
                'achieved the %s '
                'rank for correcting practice questions. Your efforts help '
                'Oppia grow better every day and support students around '
                'the world.<br><br>'
                'You can check all the achievements you earned in the '
                '<a href="%s%s">Contributor Dashboard</a>.<br><br>'
                'Best wishes and we hope you can continue to '
                'contribute!<br><br>'
                'The Oppia Contributor Dashboard Team'
            ),
            'email_subject': (
                'Oppia Question Reviewer Rank Achievement!'
            )
        }
    }
}

SENDER_VALIDATORS: Dict[str, Union[bool, Callable[[str], bool]]] = {
    feconf.EMAIL_INTENT_SIGNUP: (lambda x: x == feconf.SYSTEM_COMMITTER_ID),
    feconf.EMAIL_INTENT_UNPUBLISH_EXPLORATION: user_services.is_moderator,
    feconf.EMAIL_INTENT_DAILY_BATCH: (
        lambda x: x == feconf.SYSTEM_COMMITTER_ID),
    feconf.EMAIL_INTENT_EDITOR_ROLE_NOTIFICATION: (
        lambda x: x == feconf.SYSTEM_COMMITTER_ID),
    feconf.EMAIL_INTENT_FEEDBACK_MESSAGE_NOTIFICATION: (
        lambda x: x == feconf.SYSTEM_COMMITTER_ID),
    feconf.EMAIL_INTENT_SUGGESTION_NOTIFICATION: (
        lambda x: x == feconf.SYSTEM_COMMITTER_ID),
    feconf.EMAIL_INTENT_SUBSCRIPTION_NOTIFICATION: (
        lambda x: x == feconf.SYSTEM_COMMITTER_ID),
    feconf.EMAIL_INTENT_QUERY_STATUS_NOTIFICATION: (
        lambda x: x == feconf.SYSTEM_COMMITTER_ID),
    feconf.EMAIL_INTENT_MARKETING: (
        lambda x: x == feconf.SYSTEM_COMMITTER_ID),
    feconf.EMAIL_INTENT_DELETE_EXPLORATION: user_services.is_moderator,
    feconf.EMAIL_INTENT_REPORT_BAD_CONTENT: (
        lambda x: x == feconf.SYSTEM_COMMITTER_ID),
    feconf.EMAIL_INTENT_ONBOARD_REVIEWER: (
        lambda x: x == feconf.SYSTEM_COMMITTER_ID),
    feconf.EMAIL_INTENT_REMOVE_REVIEWER: (
        lambda x: x == feconf.SYSTEM_COMMITTER_ID),
    feconf.EMAIL_INTENT_REVIEW_CREATOR_DASHBOARD_SUGGESTIONS: (
        lambda x: x == feconf.SYSTEM_COMMITTER_ID),
    feconf.EMAIL_INTENT_ADDRESS_CONTRIBUTOR_DASHBOARD_SUGGESTIONS: (
        lambda x: x == feconf.SYSTEM_COMMITTER_ID),
    feconf.EMAIL_INTENT_REVIEW_CONTRIBUTOR_DASHBOARD_SUGGESTIONS: (
        lambda x: x == feconf.SYSTEM_COMMITTER_ID),
    feconf.EMAIL_INTENT_NOTIFY_CONTRIBUTOR_DASHBOARD_ACHIEVEMENTS: (
        lambda x: x == feconf.SYSTEM_COMMITTER_ID),
    feconf.EMAIL_INTENT_ADD_CONTRIBUTOR_DASHBOARD_REVIEWERS: (
        lambda x: x == feconf.SYSTEM_COMMITTER_ID),
    feconf.EMAIL_INTENT_ACCOUNT_DELETED: (
        lambda x: x == feconf.SYSTEM_COMMITTER_ID),
    feconf.BULK_EMAIL_INTENT_MARKETING: (
        lambda x: x == feconf.SYSTEM_COMMITTER_ID),
    feconf.BULK_EMAIL_INTENT_IMPROVE_EXPLORATION: (
        user_services.is_curriculum_admin),
    feconf.BULK_EMAIL_INTENT_CREATE_EXPLORATION: (
        user_services.is_curriculum_admin),
    feconf.BULK_EMAIL_INTENT_CREATOR_REENGAGEMENT: (
        lambda x: x == feconf.SYSTEM_COMMITTER_ID),
    feconf.BULK_EMAIL_INTENT_ML_JOB_FAILURE: (
        lambda x: x == feconf.SYSTEM_COMMITTER_ID),
    feconf.BULK_EMAIL_INTENT_LEARNER_REENGAGEMENT: (
        lambda x: x == feconf.SYSTEM_COMMITTER_ID),
    feconf.BULK_EMAIL_INTENT_TEST: (
        lambda x: x == feconf.SYSTEM_COMMITTER_ID)
}


class FeedbackMessagesDict(TypedDict):
    """Dictionary representing the feedback message for email."""

    title: str
    messages: List[str]


def require_sender_id_is_valid(intent: str, sender_id: str) -> None:
    """Ensure that the sender ID is valid, based on the email's intent.

    Many emails are only allowed to be sent by a certain user or type of user,
    e.g. 'admin' or an admin/moderator. This function will raise an exception
    if the given sender is not allowed to send this type of email.

    Args:
        intent: str. The intent string, i.e. the purpose of the email.
            Valid intent strings are defined in feconf.py.
        sender_id: str. The ID of the user sending the email.

    Raises:
        Exception. The email intent is invalid.
        Exception. The sender_id is not appropriate for the given intent.
    """

    if intent not in SENDER_VALIDATORS:
        raise Exception('Invalid email intent string: %s' % intent)

    sender_validator_fn = SENDER_VALIDATORS[intent]
    # Ruling out the possibility of bool for mypy type checking. Because here,
    # the return value of 'SENDER_VALIDATORS[intent]' is always called.
    assert callable(sender_validator_fn)

    if not sender_validator_fn(sender_id):
        logging.error(
            'Invalid sender_id %s for email with intent \'%s\'' %
            (sender_id, intent))
        raise Exception(
            'Invalid sender_id for email with intent \'%s\'' % intent)


def _send_email(
    recipient_id: str,
    sender_id: str,
    intent: str,
    email_subject: str,
    email_html_body: str,
    sender_email: str,
    bcc_admin: bool = False,
    sender_name: Optional[str] = None,
    recipient_email: Optional[str] = None
) -> None:
    """Sends an email to the given recipient.

    This function should be used for sending all user-facing emails.

    Raises an Exception if the sender_id is not appropriate for the given
    intent. Currently we support only system-generated emails and emails
    initiated by moderator actions.

    Args:
        recipient_id: str. The user ID of the recipient.
        sender_id: str. The user ID of the sender.
        intent: str. The intent string for the email, i.e. the purpose/type.
        email_subject: str. The subject of the email.
        email_html_body: str. The body (message) of the email.
        sender_email: str. The sender's email address.
        bcc_admin: bool. Whether to send a copy of the email to the admin's
            email address.
        sender_name: str or None. The name to be shown in the "sender" field of
            the email.
        recipient_email: str or None. Override for the recipient email.
            This should only be used when the user with user_id equal to
            recipient_id does not exist or is deleted and their email cannot be
            retrieved via get_email_from_user_id.
    """

    if sender_name is None:
        sender_name = EMAIL_SENDER_NAME.value

    require_sender_id_is_valid(intent, sender_id)

    if recipient_email is None:
        recipient_email_address = user_services.get_email_from_user_id(
            recipient_id
        )
    else:
        recipient_email_address = recipient_email

    cleaned_html_body = html_cleaner.clean(email_html_body)
    if cleaned_html_body != email_html_body:
        logging.error(
            'Original email HTML body does not match cleaned HTML body:\n'
            'Original:\n%s\n\nCleaned:\n%s\n' %
            (email_html_body, cleaned_html_body))
        return

    raw_plaintext_body = cleaned_html_body.replace('<br/>', '\n').replace(
        '<br>', '\n').replace('<li>', '<li>- ').replace('</p><p>', '</p>\n<p>')
    cleaned_plaintext_body = html_cleaner.strip_html_tags(raw_plaintext_body)

    if email_models.SentEmailModel.check_duplicate_message(
            recipient_id, email_subject, cleaned_plaintext_body):
        logging.error(
            'Duplicate email:\n'
            'Details:\n%s %s\n%s\n\n' %
            (recipient_id, email_subject, cleaned_plaintext_body))
        return

    @transaction_services.run_in_transaction_wrapper
    def _send_email_transactional() -> None:
        """Sends the email to a single recipient."""
        sender_name_email = '%s <%s>' % (sender_name, sender_email)

        email_services.send_mail(
            sender_name_email, recipient_email_address, email_subject,
            cleaned_plaintext_body, cleaned_html_body, bcc_admin=bcc_admin)
        email_models.SentEmailModel.create(
            recipient_id, recipient_email_address, sender_id, sender_name_email,
            intent, email_subject, cleaned_html_body, datetime.datetime.utcnow()
        )

    _send_email_transactional()


def _send_bulk_mail(
    recipient_ids: List[str],
    sender_id: str,
    intent: str,
    email_subject: str,
    email_html_body: str,
    sender_email: str,
    sender_name: str,
    instance_id: str
) -> None:
    """Sends an email to all given recipients.

    Args:
        recipient_ids: list(str). The user IDs of the email recipients.
        sender_id: str. The ID of the user sending the email.
        intent: str. The intent string, i.e. the purpose of the email.
        email_subject: str. The subject of the email.
        email_html_body: str. The body (message) of the email.
        sender_email: str. The sender's email address.
        sender_name: str. The name to be shown in the "sender" field of the
            email.
        instance_id: str. The ID of the BulkEmailModel entity instance.
    """
    require_sender_id_is_valid(intent, sender_id)

    recipients_settings = user_services.get_users_settings(
        recipient_ids, strict=True
    )
    recipient_emails = [user.email for user in recipients_settings]

    cleaned_html_body = html_cleaner.clean(email_html_body)
    if cleaned_html_body != email_html_body:
        logging.error(
            'Original email HTML body does not match cleaned HTML body:\n'
            'Original:\n%s\n\nCleaned:\n%s\n' %
            (email_html_body, cleaned_html_body))
        return

    raw_plaintext_body = cleaned_html_body.replace('<br/>', '\n').replace(
        '<br>', '\n').replace('<li>', '<li>- ').replace('</p><p>', '</p>\n<p>')
    cleaned_plaintext_body = html_cleaner.strip_html_tags(raw_plaintext_body)

    @transaction_services.run_in_transaction_wrapper
    def _send_bulk_mail_transactional(instance_id: str) -> None:
        """Sends the emails in bulk to the recipients.

        Args:
            instance_id: str. The ID of the BulkEmailModel entity instance.
        """
        sender_name_email = '%s <%s>' % (sender_name, sender_email)

        email_services.send_bulk_mail(
            sender_name_email, recipient_emails, email_subject,
            cleaned_plaintext_body, cleaned_html_body)

        email_models.BulkEmailModel.create(
            instance_id, sender_id, sender_name_email, intent,
            email_subject, cleaned_html_body, datetime.datetime.utcnow())

    _send_bulk_mail_transactional(instance_id)


def send_job_failure_email(job_id: str) -> None:
    """Sends an email to admin email as well as any email addresses
    specificed on the admin config page.

    Args:
        job_id: str. The Job ID of the failing job.
    """
    mail_subject = 'Failed ML Job'
    mail_body = ((
        'ML job %s has failed. For more information,'
        'please visit the admin page at:\n'
        'https://www.oppia.org/admin#/jobs') % job_id)
    send_mail_to_admin(mail_subject, mail_body)
    recipient_ids = (
        NOTIFICATION_USER_IDS_FOR_FAILED_TASKS.value)
    bulk_email_model_id = email_models.BulkEmailModel.get_new_id('')
    if recipient_ids:
        _send_bulk_mail(
            recipient_ids, feconf.SYSTEM_COMMITTER_ID,
            feconf.BULK_EMAIL_INTENT_ML_JOB_FAILURE, mail_subject, mail_body,
            feconf.SYSTEM_EMAIL_ADDRESS, feconf.SYSTEM_EMAIL_NAME,
            bulk_email_model_id
        )


def send_dummy_mail_to_admin(username: str) -> None:
    """Send an email from the specified email address to admin.

    Args:
        username: str. Username of the sender.
    """

    email_body = 'This is a test mail from %s.' % (username)
    email_subject = 'Test Mail'
    system_name_email = '%s <%s>' % (
        feconf.SYSTEM_EMAIL_NAME, feconf.SYSTEM_EMAIL_ADDRESS)

    email_services.send_mail(
        system_name_email, feconf.ADMIN_EMAIL_ADDRESS, email_subject,
        email_body, email_body.replace('\n', '<br/>'), bcc_admin=False)


def send_mail_to_admin(email_subject: str, email_body: str) -> None:
    """Send an email to the admin email address.

    The email is sent to the ADMIN_EMAIL_ADDRESS set in feconf.py.

    Args:
        email_subject: str. Subject of the email.
        email_body: str. Body (message) of the email.
    """

    app_id = app_identity_services.get_application_id()
    body = '(Sent from %s)\n\n%s' % (app_id, email_body)
    system_name_email = '%s <%s>' % (
        feconf.SYSTEM_EMAIL_NAME, feconf.SYSTEM_EMAIL_ADDRESS)
    email_services.send_mail(
        system_name_email, feconf.ADMIN_EMAIL_ADDRESS, email_subject,
        body, body.replace('\n', '<br/>'), bcc_admin=False)


def send_post_signup_email(
    user_id: str,
    test_for_duplicate_email: bool = False
) -> None:
    """Sends a post-signup email to the given user.

    Raises an exception if emails are not allowed to be sent to users (i.e.
    feconf.CAN_SEND_EMAILS is False).

    Args:
        user_id: str. User ID of the user that signed up.
        test_for_duplicate_email: bool. For testing duplicate emails.
    """

    if not test_for_duplicate_email:
        for key, content in SIGNUP_EMAIL_CONTENT.value.items():
            email_content_default_value = SIGNUP_EMAIL_CONTENT.default_value
            # Here, we used assert to narrow down the type from various allowed
            # default types to Dict[str, str] and we are sure that it is always
            # going to be Dict type because at the time of initialization of
            # SIGNUP_EMAIL_CONTENT we are providing Dict as a default value.
            assert isinstance(email_content_default_value, dict)
            if content == email_content_default_value[key]:
                logging.error(
                    'Please ensure that the value for the admin config '
                    'property SIGNUP_EMAIL_CONTENT is set, before allowing '
                    'post-signup emails to be sent.')
                return

    recipient_username = user_services.get_username(user_id)
    email_subject = SIGNUP_EMAIL_CONTENT.value['subject']
    email_body = 'Hi %s,<br><br>%s<br><br>%s' % (
        recipient_username, SIGNUP_EMAIL_CONTENT.value['html_body'],
        EMAIL_FOOTER.value)

    _send_email(
        user_id, feconf.SYSTEM_COMMITTER_ID, feconf.EMAIL_INTENT_SIGNUP,
        email_subject, email_body, feconf.NOREPLY_EMAIL_ADDRESS)


def get_moderator_unpublish_exploration_email() -> str:
    """Returns a draft of the text of the body for an email sent immediately
    when a moderator unpublishes an exploration. An empty body is a signal to
    the frontend that no email will be sent.

    Returns:
        str. Draft of the email body for an email sent after the moderator
        unpublishes an exploration, or an empty string if no email should
        be sent.
    """

    try:
        require_moderator_email_prereqs_are_satisfied()
    except utils.ValidationError:
        return ''

    config_prop = config_domain.Registry.get_config_property(
        'unpublish_exploration_email_html_body'
    )
    # Ruling out the possibility of None for mypy type checking.
    assert config_prop is not None
    config_prop_value = config_prop.value
    # Ruling out the possibility of Any for mypy type checking.
    assert isinstance(config_prop_value, str)
    return config_prop_value


def require_moderator_email_prereqs_are_satisfied() -> None:
    """Raises an exception if, for any reason, moderator emails cannot be sent.

    Raises:
        ValidationError. The feconf.REQUIRE_EMAIL_ON_MODERATOR_ACTION is False.
        ValidationError. The feconf.CAN_SEND_EMAILS is False.
    """

    if not feconf.REQUIRE_EMAIL_ON_MODERATOR_ACTION:
        raise utils.ValidationError(
            'For moderator emails to be sent, please ensure that '
            'REQUIRE_EMAIL_ON_MODERATOR_ACTION is set to True.')
    if not feconf.CAN_SEND_EMAILS:
        raise utils.ValidationError(
            'For moderator emails to be sent, please ensure that '
            'CAN_SEND_EMAILS is set to True.')


def send_moderator_action_email(
    sender_id: str,
    recipient_id: str,
    intent: str,
    exploration_title: str,
    email_body: str
) -> None:
    """Sends a email immediately following a moderator action (unpublish,
    delete) to the given user.

    Raises an exception if emails are not allowed to be sent to users (i.e.
    feconf.CAN_SEND_EMAILS is False).

    Args:
        sender_id: str. User ID of the sender.
        recipient_id: str. User ID of the recipient.
        intent: str. The intent string (cause/purpose) of the email.
        exploration_title: str. The title of the exploration on which the
            moderator action was taken.
        email_body: str. The email content/message.
    """

    require_moderator_email_prereqs_are_satisfied()
    email_config = feconf.VALID_MODERATOR_ACTIONS[intent]

    recipient_username = user_services.get_username(recipient_id)
    sender_username = user_services.get_username(sender_id)
    email_subject_fn = email_config['email_subject_fn']
    # Ruling out the possibility of str for mypy type checking. Because here,
    # the return value of 'email_config['email_subject_fn']' is always called.
    assert callable(email_subject_fn)
    email_subject = email_subject_fn(exploration_title)
    email_salutation_html_fn = email_config['email_salutation_html_fn']
    # Ruling out the possibility of str for mypy type checking. Because here,
    # the return value of 'email_config['email_salutation_html_fn']' is always
    # called.
    assert callable(email_salutation_html_fn)
    email_salutation_html = email_salutation_html_fn(recipient_username)
    email_signoff_html_fn = email_config['email_signoff_html_fn']
    # Ruling out the possibility of str for mypy type checking. Because here,
    # the return value of 'email_config['email_signoff_html_fn']' is always
    # called.
    assert callable(email_signoff_html_fn)
    email_signoff_html = email_signoff_html_fn(sender_username)
    full_email_content = (
        '%s<br><br>%s<br><br>%s<br><br>%s' % (
            email_salutation_html, email_body, email_signoff_html,
            EMAIL_FOOTER.value))
    _send_email(
        recipient_id, sender_id, intent, email_subject, full_email_content,
        feconf.SYSTEM_EMAIL_ADDRESS, bcc_admin=True)


def send_role_notification_email(
    inviter_id: str,
    recipient_id: str,
    recipient_role: str,
    exploration_id: str,
    exploration_title: str
) -> None:
    """Sends a email when a new user is given activity rights (Manager, Editor,
    Viewer) to an exploration by creator of exploration.

    Email will only be sent if recipient wants to receive these emails (i.e.
    'can_receive_editor_role_email' is set True in recipent's preferences).

    Args:
        inviter_id: str. ID of the user who invited the recipient to the new
            role.
        recipient_id: str. User ID of the recipient.
        recipient_role: str. Role given to the recipient. Must be defined in
            EDITOR_ROLE_EMAIL_HTML_ROLES.
        exploration_id: str. ID of the exploration for which the recipient has
            been given the new role.
        exploration_title: str. Title of the exploration for which the recipient
            has been given the new role.

    Raises:
        Exception. The role is invalid (i.e. not defined in
            EDITOR_ROLE_EMAIL_HTML_ROLES).
    """

    # Editor role email body and email subject templates.
    email_subject_template = (
        '%s - invitation to collaborate')

    email_body_template = (
        'Hi %s,<br>'
        '<br>'
        '<b>%s</b> has granted you %s to their exploration, '
        '"<a href="https://www.oppia.org/create/%s">%s</a>", on Oppia.org.<br>'
        '<br>'
        'This allows you to:<br>'
        '<ul>%s</ul>'
        'You can find the exploration '
        '<a href="https://www.oppia.org/create/%s">here</a>.<br>'
        '<br>'
        'Thanks, and happy collaborating!<br>'
        '<br>'
        'Best wishes,<br>'
        'The Oppia Team<br>'
        '<br>%s')

    # Return from here if sending email is turned off.
    if not feconf.CAN_SEND_EMAILS:
        logging.error('This app cannot send emails to users.')
        return

    # Return from here is sending editor role email is disabled.
    if not feconf.CAN_SEND_EDITOR_ROLE_EMAILS:
        logging.error('This app cannot send editor role emails to users.')
        return

    recipient_username = user_services.get_username(recipient_id)
    inviter_username = user_services.get_username(inviter_id)
    recipient_preferences = user_services.get_email_preferences(recipient_id)

    if not recipient_preferences.can_receive_editor_role_email:
        # Do not send email if recipient has declined.
        return

    if recipient_role not in EDITOR_ROLE_EMAIL_HTML_ROLES:
        raise Exception(
            'Invalid role: %s' % recipient_role)

    role_description = EDITOR_ROLE_EMAIL_HTML_ROLES[recipient_role]
    rights_html = EDITOR_ROLE_EMAIL_RIGHTS_FOR_ROLE[role_description]

    email_subject = email_subject_template % exploration_title
    email_body = email_body_template % (
        recipient_username, inviter_username, role_description, exploration_id,
        exploration_title, rights_html, exploration_id, EMAIL_FOOTER.value)

    _send_email(
        recipient_id, feconf.SYSTEM_COMMITTER_ID,
        feconf.EMAIL_INTENT_EDITOR_ROLE_NOTIFICATION, email_subject, email_body,
        feconf.NOREPLY_EMAIL_ADDRESS, sender_name=inviter_username)


def send_emails_to_subscribers(
    creator_id: str,
    exploration_id: str,
    exploration_title: str
) -> None:
    """Sends an email to all the subscribers of the creators when the creator
    publishes an exploration.

    Args:
        creator_id: str. The id of the creator who has published an exploration
            and to whose subscribers we are sending emails.
        exploration_id: str. The id of the exploration which the creator has
            published.
        exploration_title: str. The title of the exploration which the creator
            has published.
    """

    creator_name = user_services.get_username(creator_id)
    email_subject = ('%s has published a new exploration!' % creator_name)
    email_body_template = (
        'Hi %s,<br>'
        '<br>'
        '%s has published a new exploration! You can play it here: '
        '<a href="https://www.oppia.org/explore/%s">%s</a><br>'
        '<br>'
        'Thanks, and happy learning!<br>'
        '<br>'
        'Best wishes,<br>'
        '- The Oppia Team<br>'
        '<br>%s')

    if not feconf.CAN_SEND_EMAILS:
        logging.error('This app cannot send emails to users.')
        return

    if not feconf.CAN_SEND_SUBSCRIPTION_EMAILS:
        logging.error('This app cannot send subscription emails to users.')
        return

    recipient_list = subscription_services.get_all_subscribers_of_creator(
        creator_id)
    recipients_usernames = user_services.get_usernames(
        recipient_list, strict=True
    )
    recipients_preferences = user_services.get_users_email_preferences(
        recipient_list)
    for index, username in enumerate(recipients_usernames):
        if recipients_preferences[index].can_receive_subscription_email:
            email_body = email_body_template % (
                username, creator_name, exploration_id,
                exploration_title, EMAIL_FOOTER.value)
            _send_email(
                recipient_list[index], feconf.SYSTEM_COMMITTER_ID,
                feconf.EMAIL_INTENT_SUBSCRIPTION_NOTIFICATION,
                email_subject, email_body, feconf.NOREPLY_EMAIL_ADDRESS)


def send_feedback_message_email(
    recipient_id: str,
    feedback_messages: Dict[str, FeedbackMessagesDict]
) -> None:
    """Sends an email when creator receives feedback message to an exploration.

    Args:
        recipient_id: str. User ID of recipient.
        feedback_messages: dict. Contains feedback messages. Example:

            {
                'exploration_id': {
                    'title': 'Exploration 1234',
                    'messages': ['Feedback message 1', 'Feedback message 2']
                }
            }
    """
    email_subject_template = (
        'You\'ve received %s new message%s on your explorations')

    email_body_template = (
        'Hi %s,<br>'
        '<br>'
        'You\'ve received %s new message%s on your Oppia explorations:<br>'
        '<ul>%s</ul>'
        'You can view and reply to your messages from your '
        '<a href="https://www.oppia.org/creator-dashboard">dashboard</a>.'
        '<br>'
        '<br>Thanks, and happy teaching!<br>'
        '<br>'
        'Best wishes,<br>'
        'The Oppia Team<br>'
        '<br>%s')

    if not feconf.CAN_SEND_EMAILS:
        logging.error('This app cannot send emails to users.')
        return

    if not feconf.CAN_SEND_FEEDBACK_MESSAGE_EMAILS:
        logging.error('This app cannot send feedback message emails to users.')
        return

    if not feedback_messages:
        return

    recipient_username = user_services.get_username(recipient_id)

    messages_html = ''
    count_messages = 0
    for exp_id, reference in feedback_messages.items():
        messages_html += (
            '<li><a href="https://www.oppia.org/create/%s#/feedback">'
            '%s</a>:<br><ul>' % (exp_id, reference['title']))
        for message in reference['messages']:
            messages_html += ('<li>%s<br></li>' % message)
            count_messages += 1
        messages_html += '</ul></li>'

    email_subject = email_subject_template % (
        (count_messages, 's') if count_messages > 1 else ('a', ''))

    email_body = email_body_template % (
        recipient_username, count_messages if count_messages > 1
        else 'a', 's' if count_messages > 1 else '', messages_html,
        EMAIL_FOOTER.value)

    _send_email(
        recipient_id, feconf.SYSTEM_COMMITTER_ID,
        feconf.EMAIL_INTENT_FEEDBACK_MESSAGE_NOTIFICATION,
        email_subject, email_body, feconf.NOREPLY_EMAIL_ADDRESS)


def can_users_receive_thread_email(
    recipient_ids: List[str],
    exploration_id: str,
    has_suggestion: bool
) -> List[bool]:
    """Returns if users can receive email.

    Args:
        recipient_ids: list(str). IDs of persons that should receive the email.
        exploration_id: str. ID of exploration that received new message.
        has_suggestion: bool. True if thread contains suggestion.

    Returns:
        list(bool). True if user can receive the email, False otherwise.
    """
    users_global_prefs = (
        user_services.get_users_email_preferences(recipient_ids))
    users_exploration_prefs = (
        user_services.get_users_email_preferences_for_exploration(
            recipient_ids, exploration_id))
    zipped_preferences = list(
        zip(users_global_prefs, users_exploration_prefs))

    result = []
    if has_suggestion:
        for user_global_prefs, user_exploration_prefs in zipped_preferences:
            result.append(
                user_global_prefs.can_receive_feedback_message_email
                and not user_exploration_prefs.mute_suggestion_notifications)
    else:
        for user_global_prefs, user_exploration_prefs in zipped_preferences:
            result.append(
                user_global_prefs.can_receive_feedback_message_email
                and not user_exploration_prefs.mute_feedback_notifications)

    return result


def send_suggestion_email(
    exploration_title: str,
    exploration_id: str,
    author_id: str,
    recipient_list: List[str]
) -> None:
    """Send emails to notify the given recipients about new suggestion.

    Each recipient will only be emailed if their email preferences allow for
    incoming feedback message emails.

    Args:
        exploration_title: str. Title of the exploration with the new
            suggestion.
        exploration_id: str. The ID of the exploration with the new suggestion.
        author_id: str. The user ID of the author of the suggestion.
        recipient_list: list(str). The user IDs of the email recipients.
    """

    email_subject = 'New suggestion for "%s"' % exploration_title

    email_body_template = (
        'Hi %s,<br>'
        '%s has submitted a new suggestion for your Oppia exploration, '
        '<a href="https://www.oppia.org/create/%s">"%s"</a>.<br>'
        'You can accept or reject this suggestion by visiting the '
        '<a href="https://www.oppia.org/create/%s#/feedback">feedback page</a> '
        'for your exploration.<br>'
        '<br>'
        'Thanks!<br>'
        '- The Oppia Team<br>'
        '<br>%s')

    if not feconf.CAN_SEND_EMAILS:
        logging.error('This app cannot send emails to users.')
        return

    if not feconf.CAN_SEND_FEEDBACK_MESSAGE_EMAILS:
        logging.error('This app cannot send feedback message emails to users.')
        return

    author_username = user_services.get_username(author_id)
    can_users_receive_email = (
        can_users_receive_thread_email(recipient_list, exploration_id, True))
    for index, recipient_id in enumerate(recipient_list):
        recipient_username = user_services.get_username(recipient_id)
        # Send email only if recipient wants to receive.
        if can_users_receive_email[index]:
            email_body = email_body_template % (
                recipient_username, author_username, exploration_id,
                exploration_title, exploration_id, EMAIL_FOOTER.value)
            _send_email(
                recipient_id, feconf.SYSTEM_COMMITTER_ID,
                feconf.EMAIL_INTENT_SUGGESTION_NOTIFICATION,
                email_subject, email_body, feconf.NOREPLY_EMAIL_ADDRESS)


def send_instant_feedback_message_email(
    recipient_id: str,
    sender_id: str,
    message: str,
    email_subject: str,
    exploration_title: str,
    exploration_id: str,
    thread_title: str
) -> None:
    """Send an email when a new message is posted to a feedback thread, or when
    the thread's status is changed.

    Args:
        recipient_id: str. The user ID of the recipient.
        sender_id: str. The user ID of the sender.
        message: str. The message text or status change text from the sender.
        email_subject: str. The subject line to be sent in the email.
        exploration_title: str. The title of the exploration.
        exploration_id: str. ID of the exploration the feedback thread is about.
        thread_title: str. The title of the feedback thread.
    """

    email_body_template = (
        'Hi %s,<br><br>'
        'New update to thread "%s" on '
        '<a href="https://www.oppia.org/create/%s#/feedback">%s</a>:<br>'
        '<ul><li>%s: %s<br></li></ul>'
        '(You received this message because you are a '
        'participant in this thread.)<br><br>'
        'Best wishes,<br>'
        'The Oppia team<br>'
        '<br>%s')

    if not feconf.CAN_SEND_EMAILS:
        logging.error('This app cannot send emails to users.')
        return

    if not feconf.CAN_SEND_FEEDBACK_MESSAGE_EMAILS:
        logging.error('This app cannot send feedback message emails to users.')
        return

    sender_username = user_services.get_username(sender_id)
    recipient_username = user_services.get_username(recipient_id)
    recipient_preferences = user_services.get_email_preferences(recipient_id)

    if recipient_preferences.can_receive_feedback_message_email:
        email_body = email_body_template % (
            recipient_username, thread_title, exploration_id,
            exploration_title, sender_username, message, EMAIL_FOOTER.value)
        _send_email(
            recipient_id, feconf.SYSTEM_COMMITTER_ID,
            feconf.EMAIL_INTENT_FEEDBACK_MESSAGE_NOTIFICATION, email_subject,
            email_body, feconf.NOREPLY_EMAIL_ADDRESS)


def send_flag_exploration_email(
    exploration_title: str,
    exploration_id: str,
    reporter_id: str,
    report_text: str
) -> None:
    """Send an email to all moderators when an exploration is flagged.

    Args:
        exploration_title: str. The title of the flagged exporation.
        exploration_id: str. The ID of the flagged exploration.
        reporter_id: str. The user ID of the reporter.
        report_text: str. The message entered by the reporter.
    """
    email_subject = 'Exploration flagged by user: "%s"' % exploration_title

    email_body_template = (
        'Hello Moderator,<br>'
        '%s has flagged exploration "%s" on the following '
        'grounds: <br>'
        '%s .<br>'
        'You can modify the exploration by clicking '
        '<a href="https://www.oppia.org/create/%s">here</a>.<br>'
        '<br>'
        'Thanks!<br>'
        '- The Oppia Team<br>'
        '<br>%s')

    if not feconf.CAN_SEND_EMAILS:
        logging.error('This app cannot send emails to users.')
        return

    reporter_username = user_services.get_username(reporter_id)

    email_body = email_body_template % (
        reporter_username, exploration_title, report_text, exploration_id,
        EMAIL_FOOTER.value)

    recipient_list = user_services.get_user_ids_by_role(
        feconf.ROLE_ID_MODERATOR)
    for recipient_id in recipient_list:
        _send_email(
            recipient_id, feconf.SYSTEM_COMMITTER_ID,
            feconf.EMAIL_INTENT_REPORT_BAD_CONTENT,
            email_subject, email_body, feconf.NOREPLY_EMAIL_ADDRESS)


def send_query_completion_email(recipient_id: str, query_id: str) -> None:
    """Send an email to the initiator of a bulk email query with a link to view
    the query results.

    Args:
        recipient_id: str. The recipient ID.
        query_id: str. The query ID.
    """
    email_subject = 'Query %s has successfully completed' % query_id

    email_body_template = (
        'Hi %s,<br>'
        'Your query with id %s has succesfully completed its '
        'execution. Visit the result page '
        '<a href="https://www.oppia.org/emaildashboardresult/%s">here</a> '
        'to see result of your query.<br><br>'
        'Thanks!<br>'
        '<br>'
        'Best wishes,<br>'
        'The Oppia Team<br>'
        '<br>%s')

    recipient_username = user_services.get_username(recipient_id)
    email_body = email_body_template % (
        recipient_username, query_id, query_id, EMAIL_FOOTER.value)
    _send_email(
        recipient_id, feconf.SYSTEM_COMMITTER_ID,
        feconf.EMAIL_INTENT_QUERY_STATUS_NOTIFICATION, email_subject,
        email_body, feconf.NOREPLY_EMAIL_ADDRESS)


def send_query_failure_email(
    recipient_id: str,
    query_id: str,
    query_params: Dict[str, str]
) -> None:
    """Send an email to the initiator of a failed bulk email query.

    Args:
        recipient_id: str. The recipient ID.
        query_id: str. The query ID.
        query_params: dict. The parameters of the query, as key:value.
    """
    email_subject = 'Query %s has failed' % query_id

    email_body_template = (
        'Hi %s,<br>'
        'Your query with id %s has failed due to error '
        'during execution. '
        'Please check the query parameters and submit query again.<br><br>'
        'Thanks!<br>'
        '<br>'
        'Best wishes,<br>'
        'The Oppia Team<br>'
        '<br>%s')

    recipient_username = user_services.get_username(recipient_id)
    email_body = email_body_template % (
        recipient_username, query_id, EMAIL_FOOTER.value)
    _send_email(
        recipient_id, feconf.SYSTEM_COMMITTER_ID,
        feconf.EMAIL_INTENT_QUERY_STATUS_NOTIFICATION, email_subject,
        email_body, feconf.NOREPLY_EMAIL_ADDRESS)

    admin_email_subject = 'Query job has failed.'
    admin_email_body_template = (
        'Query job with %s query id has failed in its execution.\n'
        'Query parameters:\n\n')

    for key in sorted(query_params):
        admin_email_body_template += '%s: %s\n' % (key, query_params[key])

    admin_email_body = admin_email_body_template % query_id
    send_mail_to_admin(admin_email_subject, admin_email_body)


def send_user_query_email(
    sender_id: str,
    recipient_ids: List[str],
    email_subject: str,
    email_body: str,
    email_intent: str
) -> str:
    """Sends an email to all the recipients of the query.

    Args:
        sender_id: str. The ID of the user sending the email.
        recipient_ids: list(str). The user IDs of the email recipients.
        email_subject: str. The subject of the email.
        email_body: str. The body of the email.
        email_intent: str. The intent string, i.e. the purpose of the email.

    Returns:
        bulk_email_model_id: str. The ID of the bulk email model.
    """
    bulk_email_model_id = email_models.BulkEmailModel.get_new_id('')
    sender_name = user_services.get_username(sender_id)
    sender_email = user_services.get_email_from_user_id(sender_id)
    _send_bulk_mail(
        recipient_ids, sender_id, email_intent, email_subject, email_body,
        sender_email, sender_name, bulk_email_model_id)
    return bulk_email_model_id


def send_test_email_for_bulk_emails(
    tester_id: str,
    email_subject: str,
    email_body: str
) -> None:
    """Sends a test email to the tester.

    Args:
        tester_id: str. The user ID of the tester.
        email_subject: str. The subject of the email.
        email_body: str. The body of the email.
    """
    tester_name = user_services.get_username(tester_id)
    tester_email = user_services.get_email_from_user_id(tester_id)
    _send_email(
        tester_id, feconf.SYSTEM_COMMITTER_ID, feconf.BULK_EMAIL_INTENT_TEST,
        email_subject, email_body, tester_email, sender_name=tester_name)


def send_mail_to_onboard_new_reviewers(
    recipient_id: str, category: str
) -> None:
    """Sends an email to users who have crossed the threshold score.

    Args:
        recipient_id: str. The ID of the user who is being offered to become a
            reviewer.
        category: str. The category that the user is being offered to review.
    """

    email_subject = 'Invitation to review suggestions'

    email_body_template = (
        'Hi %s,<br><br>'
        'Thank you for actively contributing high-quality suggestions for '
        'Oppia\'s lessons in %s, and for helping to make these lessons better '
        'for students around the world!<br><br>'
        'In recognition of your contributions, we would like to invite you to '
        'become one of Oppia\'s reviewers. As a reviewer, you will be able to '
        'review suggestions in %s, and contribute to helping ensure that any '
        'edits made to lessons preserve the lessons\' quality and are '
        'beneficial for students.<br><br>'
        'If you\'d like to help out as a reviewer, please visit your '
        '<a href="https://www.oppia.org/creator-dashboard/">dashboard</a>. '
        'and set your review preferences accordingly. Note that, if you accept,'
        'you will receive occasional emails inviting you to review incoming '
        'suggestions by others.<br><br>'
        'Again, thank you for your contributions to the Oppia community!<br>'
        '- The Oppia Team<br>'
        '<br>%s')

    if not feconf.CAN_SEND_EMAILS:
        logging.error('This app cannot send emails to users.')
        return

    recipient_username = user_services.get_username(recipient_id)
    can_user_receive_email = user_services.get_email_preferences(
        recipient_id).can_receive_email_updates

    # Send email only if recipient wants to receive.
    if can_user_receive_email:
        email_body = email_body_template % (
            recipient_username, category, category, EMAIL_FOOTER.value)
        _send_email(
            recipient_id, feconf.SYSTEM_COMMITTER_ID,
            feconf.EMAIL_INTENT_ONBOARD_REVIEWER,
            email_subject, email_body, feconf.NOREPLY_EMAIL_ADDRESS)


def send_mail_to_notify_users_to_review(
    recipient_id: str, category: str
) -> None:
    """Sends an email to users to review suggestions in categories they have
    agreed to review for.

    Args:
        recipient_id: str. The id of the user who is being pinged to review
            suggestions.
        category: str. The category of the suggestions to review.
    """

    email_subject = 'Notification to review suggestions'

    email_body_template = (
        'Hi %s,<br><br>'
        'Just a heads-up that there are new suggestions to '
        'review in %s, which you are registered as a reviewer for.'
        '<br><br>Please take a look at and accept/reject these suggestions at'
        ' your earliest convenience. You can visit your '
        '<a href="https://www.oppia.org/creator-dashboard/">dashboard</a> '
        'to view the list of suggestions that need a review.<br><br>'
        'Thank you for helping improve Oppia\'s lessons!'
        '- The Oppia Team<br>'
        '<br>%s')

    if not feconf.CAN_SEND_EMAILS:
        logging.error('This app cannot send emails to users.')
        return

    recipient_username = user_services.get_username(recipient_id)
    can_user_receive_email = user_services.get_email_preferences(
        recipient_id).can_receive_email_updates

    # Send email only if recipient wants to receive.
    if can_user_receive_email:
        email_body = email_body_template % (
            recipient_username, category, EMAIL_FOOTER.value)
        _send_email(
            recipient_id, feconf.SYSTEM_COMMITTER_ID,
            feconf.EMAIL_INTENT_REVIEW_CREATOR_DASHBOARD_SUGGESTIONS,
            email_subject, email_body, feconf.NOREPLY_EMAIL_ADDRESS)


def _create_html_for_reviewable_suggestion_email_info(
    reviewable_suggestion_email_info: (
        suggestion_registry.ReviewableSuggestionEmailInfo
    )
) -> str:
    """Creates the html for the given reviewable_suggestion_email_info. This
    html content is used to provide information about a suggestion in an
    email.

    Args:
        reviewable_suggestion_email_info: ReviewableSuggestionEmailInfo. The
            information about the suggestion that will be used to form the
            html for the email. This includes the suggestion type, language,
            content and review submission date.

    Returns:
        str. A string containing the html that represents the suggestion
        information.
    """
    # Get the language of the suggestion.
    language = utils.get_supported_audio_language_description(
        reviewable_suggestion_email_info.language_code)
    # Calculate how long the suggestion has been waiting for review.
    suggestion_review_wait_time = (
        datetime.datetime.utcnow() - (
            reviewable_suggestion_email_info.submission_datetime))
    # Get a string composed of the largest time unit that has a
    # value, followed by that time unit. For example, if the
    # suggestion had been waiting for review for 5 days and 2 hours,
    # '5 days' would be returned. This is more user friendly since a
    # high level of precision is not needed.
    human_readable_review_wait_time = (
        utils.create_string_from_largest_unit_in_timedelta(
            suggestion_review_wait_time))
    values_to_populate_suggestion_template_dict = {
        'language': language,
        'review_wait_time': human_readable_review_wait_time,
        'suggestion_content': (
            reviewable_suggestion_email_info.suggestion_content)
    }
    get_values_to_populate_suggestion_template = (
        HTML_FOR_SUGGESTION_DESCRIPTION[
            'suggestion_template_values_getter_functions'][
                reviewable_suggestion_email_info.suggestion_type])
    # Ruling out the possibility of str for mypy type checking. Because from
    # implementation it is clear that, this is used as a function not string.
    assert callable(get_values_to_populate_suggestion_template)
    suggestion_template = (
        HTML_FOR_SUGGESTION_DESCRIPTION[
            'suggestion_template'][
                reviewable_suggestion_email_info.suggestion_type])
    # Ruling out the possibility of callable for mypy type checking.
    assert isinstance(suggestion_template, str)
    return suggestion_template % (
        get_values_to_populate_suggestion_template(
            values_to_populate_suggestion_template_dict))


def send_mail_to_notify_admins_suggestions_waiting_long(
    admin_ids: List[str],
    translation_admin_ids: List[str],
    question_admin_ids: List[str],
    reviewable_suggestion_email_infos: List[
        suggestion_registry.ReviewableSuggestionEmailInfo
    ]
) -> None:
    """Sends an email to admins to inform them about the suggestions that have
    been waiting longer than
    suggestion_models.SUGGESTION_REVIEW_WAIT_TIME_THRESHOLD_IN_DAYS days for a
    review on the Contributor Dashboard. Admins can be informed about at most
    suggestion_models.MAX_NUMBER_OF_SUGGESTIONS_TO_EMAIL_ADMIN suggestions.
    The information about the suggestions is organized in descending order
    by the suggestion's review wait time.

    Args:
        admin_ids: list(str). The user ids of the admins to notify.
        translation_admin_ids: list(str). The user ids of the translation
            admins to notify.
        question_admin_ids: list(str). The user ids of the question admins
            to notify.
        reviewable_suggestion_email_infos: list(ReviewableSuggestionEmailInfo).
            list(ReviewableSuggestionEmailContentInfo). A list of suggestion
            email content info objects that represent suggestions
            that have been waiting too long for review to notify the admins
            about. Each object contains includes the suggestion type, language,
            content and review submission date. The objects are sorted in
            descending order based on review wait time.
    """
    if not feconf.CAN_SEND_EMAILS:
        logging.error('This app cannot send emails to users.')
        return

    if not (
            config_domain
            .ENABLE_ADMIN_NOTIFICATIONS_FOR_SUGGESTIONS_NEEDING_REVIEW.value):
        logging.error(
            'The "notify_admins_suggestions_waiting_too_long" property '
            'must be enabled on the admin config page in order to send '
            'admins the emails.'
        )
        return

    if not reviewable_suggestion_email_infos:
        logging.info(
            'There were no Contributor Dashboard suggestions that were waiting '
            'too long for a review.')
        return

    if not admin_ids:
        logging.error('There were no admins to notify.')
        return

    translation_suggestion_descriptions = []
    question_suggestion_descriptions = []
    # Get the html for the list of suggestions that have been waiting too long
    # for a review.
    for reviewable_suggestion_email_info in reviewable_suggestion_email_infos:
        if (
                feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT ==
                reviewable_suggestion_email_info.suggestion_type
            ):
            translation_suggestion_descriptions.append(
                _create_html_for_reviewable_suggestion_email_info(
                    reviewable_suggestion_email_info))
        if (
                feconf.SUGGESTION_TYPE_ADD_QUESTION ==
                reviewable_suggestion_email_info.suggestion_type
            ):
            question_suggestion_descriptions.append(
                _create_html_for_reviewable_suggestion_email_info(
                    reviewable_suggestion_email_info))

    list_of_translation_suggestion_descriptions = ''.join(
        translation_suggestion_descriptions)
    if list_of_translation_suggestion_descriptions:
        user_ids = []
        user_ids.extend(admin_ids)
        user_ids.extend(translation_admin_ids)
        _send_suggestions_waiting_too_long_email(
            user_ids,
            list_of_translation_suggestion_descriptions)
    list_of_question_suggestion_descriptions = ''.join(
        question_suggestion_descriptions)
    if list_of_question_suggestion_descriptions:
        user_ids = []
        user_ids.extend(admin_ids)
        user_ids.extend(question_admin_ids)
        _send_suggestions_waiting_too_long_email(
            user_ids,
            list_of_question_suggestion_descriptions)


def _send_suggestions_waiting_too_long_email(
    admin_ids: List[str],
    list_of_suggestion_descriptions: str
) -> None:
    """Helper method for send_mail_to_notify_admins_suggestions_waiting_long
    that allows sending of emails to the list of admin ids provided.

    Args:
        admin_ids: list(str). The user ids of the admins to notify.
        list_of_suggestion_descriptions: str. Suggestion descriptions HTML to
            send in the email.
    """
    email_subject = (
        ADMIN_NOTIFICATION_FOR_SUGGESTIONS_NEEDING_REVIEW_EMAIL_DATA[
            'email_subject'])
    email_body_template = (
        ADMIN_NOTIFICATION_FOR_SUGGESTIONS_NEEDING_REVIEW_EMAIL_DATA[
            'email_body_template'])
    # Get the emails and usernames of the admins.
    admin_user_settings = user_services.get_users_settings(admin_ids)
    curriculum_admin_usernames, admin_emails = list(zip(*[
        (admin_user_setting.username, admin_user_setting.email)
        if admin_user_setting is not None else (None, None)
        for admin_user_setting in admin_user_settings
    ]))

    for index, admin_id in enumerate(admin_ids):
        if not admin_emails[index]:
            logging.error(
                'There was no email for the given admin id: %s.' % admin_id)
            continue
        email_body = email_body_template % (
            curriculum_admin_usernames[index], feconf.OPPIA_SITE_URL,
            feconf.CONTRIBUTOR_DASHBOARD_URL,
            suggestion_models.SUGGESTION_REVIEW_WAIT_TIME_THRESHOLD_IN_DAYS,
            feconf.OPPIA_SITE_URL, feconf.ADMIN_URL,
            list_of_suggestion_descriptions)

        _send_email(
            admin_id, feconf.SYSTEM_COMMITTER_ID,
            feconf.EMAIL_INTENT_ADDRESS_CONTRIBUTOR_DASHBOARD_SUGGESTIONS,
            email_subject, email_body, feconf.NOREPLY_EMAIL_ADDRESS,
            recipient_email=admin_emails[index])


def send_mail_to_notify_admins_that_reviewers_are_needed(
    admin_ids: List[str],
    translation_admin_ids: List[str],
    question_admin_ids: List[str],
    suggestion_types_needing_reviewers: Dict[str, Set[str]]
) -> None:
    """Sends an email to admins to notify them that there are specific
    suggestion types on the Contributor Dashboard that need more reviewers.

    Note: it is assumed that all admins are super admins because only super
    admins have access to the admin page where reviewers can be added to the
    Contributor Dashboard. Also note that these emails are sent out regardless
    of the admins' email preferences.

    Args:
        admin_ids: list(str). The user ids of the admins to notify.
        translation_admin_ids: list(str). The user ids of the translation
            admins to notify.
        question_admin_ids: list(str). The user ids of the question admins
            to notify.
        suggestion_types_needing_reviewers: dict. A dictionary where the keys
            are suggestion types and each value corresponds to a set that
            contains the language codes within the suggestion type that need
            more reviewers. For example, for translation suggestions, the value
            would be a set of language codes that translations are offered in
            that need more reviewers.
    """
    if not feconf.CAN_SEND_EMAILS:
        logging.error('This app cannot send emails to users.')
        return

    if not (
            config_domain
            .ENABLE_ADMIN_NOTIFICATIONS_FOR_REVIEWER_SHORTAGE.value):
        logging.error(
            'The "enable_admin_notifications_for_reviewer_shortage" '
            'property must be enabled on the admin config page in order to '
            'send admins the emails.'
        )
        return

    if not suggestion_types_needing_reviewers:
        logging.info(
            'There were no suggestion types that needed more reviewers on the '
            'Contributor Dashboard.')
        return

    if not admin_ids:
        logging.error('There were no admins to notify.')
        return

    if feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT in (
            suggestion_types_needing_reviewers):
        translation_suggestions_needing_reviewers_paragraphs = []
        language_codes_that_need_reviewers = (
            suggestion_types_needing_reviewers[
                feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT])
        # There are different templates to handle whether multiple languages
        # need more reviewers or just one language.
        if len(language_codes_that_need_reviewers) == 1:
            translation_suggestions_needing_reviewers_paragraphs.append(
                ADMIN_NOTIFICATION_FOR_REVIEWER_SHORTAGE_EMAIL_DATA[
                    'one_language_template'] % (
                        utils.get_supported_audio_language_description(
                            language_codes_that_need_reviewers.pop()),
                        feconf.OPPIA_SITE_URL,
                        feconf.CONTRIBUTOR_DASHBOARD_URL))

        else:
            html_for_languages_that_need_more_reviewers = ''.join(
                [
                    '<li><b>%s</b></li><br>' % (
                        utils.get_supported_audio_language_description(
                            language_code)) for language_code in
                    sorted(language_codes_that_need_reviewers)
                ]
            )
            translation_suggestions_needing_reviewers_paragraphs.append(
                ADMIN_NOTIFICATION_FOR_REVIEWER_SHORTAGE_EMAIL_DATA[
                    'multi_language_template'] % (
                        feconf.OPPIA_SITE_URL,
                        feconf.CONTRIBUTOR_DASHBOARD_URL,
                        html_for_languages_that_need_more_reviewers))
        translation_suggestions_needing_reviewers_html = ''.join(
            translation_suggestions_needing_reviewers_paragraphs)
        user_ids = []
        user_ids.extend(admin_ids)
        user_ids.extend(translation_admin_ids)
        _send_reviews_needed_email_to_admins(
            user_ids,
            translation_suggestions_needing_reviewers_html)

    if feconf.SUGGESTION_TYPE_ADD_QUESTION in (
            suggestion_types_needing_reviewers):
        question_suggestions_needing_reviewers_paragraphs = []
        question_suggestions_needing_reviewers_paragraphs.append(
            ADMIN_NOTIFICATION_FOR_REVIEWER_SHORTAGE_EMAIL_DATA[
                'question_template'])
        question_suggestions_needing_reviewers_html = ''.join(
            question_suggestions_needing_reviewers_paragraphs)
        user_ids = []
        user_ids.extend(admin_ids)
        user_ids.extend(question_admin_ids)
        _send_reviews_needed_email_to_admins(
            user_ids,
            question_suggestions_needing_reviewers_html)


def _send_reviews_needed_email_to_admins(
    admin_ids: List[str],
    suggestions_needing_reviewers_html: str
) -> None:
    """Helper function for send_mail_to_notify_admins_that_reviewers_are_needed
    that allows sending email to the provided admin ids.

    Args:
        admin_ids: list(str). The user ids of the admins to notify.
        suggestions_needing_reviewers_html: str. The HTML representing
            the suggestion needing reviewers.
    """
    email_subject = ADMIN_NOTIFICATION_FOR_REVIEWER_SHORTAGE_EMAIL_DATA[
        'email_subject']
    email_body_template = ADMIN_NOTIFICATION_FOR_REVIEWER_SHORTAGE_EMAIL_DATA[
        'email_body_template']
    # Get the emails and usernames of the users.
    admin_user_settings = user_services.get_users_settings(admin_ids)
    curriculum_admin_usernames, admin_emails = list(zip(*[
        (admin_user_setting.username, admin_user_setting.email)
        if admin_user_setting is not None else (None, None)
        for admin_user_setting in admin_user_settings
    ]))

    for index, admin_id in enumerate(admin_ids):
        if not admin_emails[index]:
            logging.error(
                'There was no email for the given admin id: %s.' % admin_id)
            continue
        email_body = email_body_template % (
            curriculum_admin_usernames[index], feconf.OPPIA_SITE_URL,
            feconf.ADMIN_URL, suggestions_needing_reviewers_html)

        _send_email(
            admin_id, feconf.SYSTEM_COMMITTER_ID,
            feconf.EMAIL_INTENT_ADD_CONTRIBUTOR_DASHBOARD_REVIEWERS,
            email_subject, email_body, feconf.NOREPLY_EMAIL_ADDRESS,
            recipient_email=admin_emails[index])


def send_mail_to_notify_contributor_dashboard_reviewers(
    reviewer_ids: List[str],
    reviewers_suggestion_email_infos: List[
        List[suggestion_registry.ReviewableSuggestionEmailInfo]
    ]
) -> None:
    """Sends an email to each reviewer notifying them of the suggestions on the
    Contributor Dashboard that have been waiting the longest for review, and
    that the reviewer has permission to review.

    Args:
        reviewer_ids: list(str). A list of the Contributor Dashboard reviewer
            user ids to notify.
        reviewers_suggestion_email_infos:
            list(list(ReviewableSuggestionEmailInfo)). A list of suggestion
            email content info objects for each reviewer. These suggestion
            email content info objects contain the key information about the
            suggestions we're notifying reviewers about and will be used to
            compose the email body for each reviewer.
    """
    email_subject = CONTRIBUTOR_DASHBOARD_REVIEWER_NOTIFICATION_EMAIL_DATA[
        'email_subject']
    email_body_template = (
        CONTRIBUTOR_DASHBOARD_REVIEWER_NOTIFICATION_EMAIL_DATA[
            'email_body_template'])

    if not feconf.CAN_SEND_EMAILS:
        logging.error('This app cannot send emails to users.')
        return

    if not (
            config_domain
            .CONTRIBUTOR_DASHBOARD_REVIEWER_EMAILS_IS_ENABLED.value):
        logging.error(
            'The "contributor_dashboard_reviewer_emails_is_enabled" property '
            'must be enabled on the admin config page in order to send '
            'reviewers the emails.'
        )
        return

    if not reviewer_ids:
        logging.error('No Contributor Dashboard reviewers to notify.')
        return

    reviewer_user_settings = user_services.get_users_settings(reviewer_ids)
    reviewer_usernames, reviewer_emails = list(zip(*[
        (reviewer_user_setting.username, reviewer_user_setting.email)
        if reviewer_user_setting is not None else (None, None)
        for reviewer_user_setting in reviewer_user_settings
    ]))

    for index, reviewer_id in enumerate(reviewer_ids):
        if not reviewers_suggestion_email_infos[index]:
            logging.info(
                'There were no suggestions to recommend to the reviewer with '
                'user id: %s.' % reviewer_id)
            continue

        if not reviewer_emails[index]:
            logging.error(
                'There was no email for the given reviewer id: %s.' % (
                    reviewer_id))
            continue

        suggestion_descriptions = []
        for reviewer_suggestion_email_info in (
                reviewers_suggestion_email_infos[index]):
            suggestion_descriptions.append(
                _create_html_for_reviewable_suggestion_email_info(
                    reviewer_suggestion_email_info))

        email_body = email_body_template % (
            reviewer_usernames[index],
            feconf.OPPIA_SITE_URL,
            feconf.CONTRIBUTOR_DASHBOARD_URL,
            ''.join(suggestion_descriptions),
            EMAIL_FOOTER.value
        )

        _send_email(
            reviewer_id, feconf.SYSTEM_COMMITTER_ID,
            feconf.EMAIL_INTENT_REVIEW_CONTRIBUTOR_DASHBOARD_SUGGESTIONS,
            email_subject, email_body, feconf.NOREPLY_EMAIL_ADDRESS,
            recipient_email=reviewer_emails[index])


def send_mail_to_notify_contributor_ranking_achievement(
    contributor_ranking_email_info: (
        suggestion_registry.ContributorMilestoneEmailInfo)) -> None:
    """Sends an email to translation/question submitters and reviewers when
    they achieve a new rank.

    Args:
        contributor_ranking_email_info:
            ContributorMilestoneEmailInfo. An object with contributor ranking
            email information.
    """
    if not feconf.CAN_SEND_EMAILS:
        logging.error('This app cannot send emails to users.')
        return

    recipient_username = user_services.get_username(
        contributor_ranking_email_info.contributor_user_id)
    can_user_receive_email = user_services.get_email_preferences(
        contributor_ranking_email_info.contributor_user_id
    ).can_receive_email_updates

    if can_user_receive_email:
        email_template = CONTRIBUTOR_RANK_ACHIEVEMENT_NOTIFICATION[
            contributor_ranking_email_info.contribution_type][
                contributor_ranking_email_info.contribution_subtype]
        email_body = ''
        if contributor_ranking_email_info.contribution_type == (
            feconf.CONTRIBUTION_TYPE_TRANSLATION):
            # Ruling out the possibility of None for mypy type checking. It is
            # obvious that for the contribution_type
            # CONTRIBUTION_TYPE_TRANSLATION the language_code will not be None.
            assert contributor_ranking_email_info.language_code is not None
            language = utils.get_supported_audio_language_description(
                contributor_ranking_email_info.language_code)
            email_body = email_template['email_body_template'] % (
                    recipient_username,
                    contributor_ranking_email_info.rank_name,
                    language,
                    feconf.OPPIA_SITE_URL,
                    feconf.CONTRIBUTOR_DASHBOARD_URL
                )
        else:
            email_body = email_template['email_body_template'] % (
                    recipient_username,
                    contributor_ranking_email_info.rank_name,
                    feconf.OPPIA_SITE_URL,
                    feconf.CONTRIBUTOR_DASHBOARD_URL
                )

        _send_email(
            contributor_ranking_email_info.contributor_user_id,
            feconf.SYSTEM_COMMITTER_ID,
            feconf.EMAIL_INTENT_NOTIFY_CONTRIBUTOR_DASHBOARD_ACHIEVEMENTS,
            email_template['email_subject'], email_body,
            feconf.NOREPLY_EMAIL_ADDRESS)


def send_account_deleted_email(user_id: str, user_email: str) -> None:
    """Sends an email to user whose account was deleted.

    Args:
        user_id: str. The id of the user whose account got deleted.
        user_email: str. The email of the user whose account got deleted.
    """
    email_subject = 'Account deleted'

    email_body_template = (
        'Hi %s,<br><br>'
        'Your account was successfully deleted.<br><br>'
        '- The Oppia Team')

    if not feconf.CAN_SEND_EMAILS:
        logging.error('This app cannot send emails to users.')
        return

    email_body = email_body_template % user_email
    _send_email(
        user_id, feconf.SYSTEM_COMMITTER_ID,
        feconf.EMAIL_INTENT_ACCOUNT_DELETED, email_subject, email_body,
        feconf.NOREPLY_EMAIL_ADDRESS, bcc_admin=True,
        recipient_email=user_email)


def send_account_deletion_failed_email(user_id: str, user_email: str) -> None:
    """Sends an email to admin about the failure of the job that is supposed to
    delete the user.

    Args:
        user_id: str. The id of the user whose account failed to get deleted.
        user_email: str. The email of the user whose account failed to
            get deleted.
    """
    email_subject = 'WIPEOUT: Account deletion failed'
    email_body_template = (
        'The Wipeout process failed for the user '
        'with ID \'%s\' and email \'%s\'.' % (user_id, user_email)
    )
    send_mail_to_admin(email_subject, email_body_template)


def send_email_to_new_contribution_reviewer(
    recipient_id: str,
    review_category: str,
    language_code: Optional[str] = None
) -> None:
    """Sends an email to user who is assigned as a reviewer.

    Args:
        recipient_id: str. The ID of the user.
        review_category: str. The category in which user can review.
        language_code: None|str. The language code for a language if the review
            item is translation or voiceover else None.

    Raises:
        Exception. The review category is not valid.
        Exception. The language_code cannot be None if the review category is
            'translation' or 'voiceover'.
    """
    if review_category not in NEW_REVIEWER_EMAIL_DATA:
        raise Exception('Invalid review_category: %s' % review_category)

    review_category_data = NEW_REVIEWER_EMAIL_DATA[review_category]
    email_subject = 'You have been invited to review Oppia %s' % (
        review_category_data['review_category'])

    if review_category in [
            constants.CONTRIBUTION_RIGHT_CATEGORY_REVIEW_TRANSLATION,
            constants.CONTRIBUTION_RIGHT_CATEGORY_REVIEW_VOICEOVER]:
        if language_code is None:
            raise Exception(
                'The language_code cannot be None if the review category is'
                ' \'translation\' or \'voiceover\''
            )
        language_description = utils.get_supported_audio_language_description(
            language_code).capitalize()
        review_category_description = (
            review_category_data['description_template'] % language_description)
        reviewer_rights_message = (
            review_category_data['rights_message_template'] % (
                language_description))
    else:
        review_category_description = review_category_data['description']
        reviewer_rights_message = review_category_data['rights_message']

    to_review = review_category_data['to_check']

    email_body_template = (
        'Hi %s,<br><br>'
        'This is to let you know that the Oppia team has added you as a '
        'reviewer for %s. This allows you to %s.<br><br>'
        'You can check the %s waiting for review in the '
        '<a href="https://www.oppia.org/contributor-dashboard">'
        'Contributor Dashboard</a>.<br><br>'
        'Thanks, and happy contributing!<br><br>'
        'Best wishes,<br>'
        'The Oppia Community')

    if not feconf.CAN_SEND_EMAILS:
        logging.error('This app cannot send emails to users.')
        return

    recipient_username = user_services.get_username(recipient_id)
    can_user_receive_email = user_services.get_email_preferences(
        recipient_id).can_receive_email_updates

    # Send email only if recipient wants to receive.
    if can_user_receive_email:
        email_body = email_body_template % (
            recipient_username, review_category_description,
            reviewer_rights_message, to_review)
        _send_email(
            recipient_id, feconf.SYSTEM_COMMITTER_ID,
            feconf.EMAIL_INTENT_ONBOARD_REVIEWER, email_subject, email_body,
            feconf.NOREPLY_EMAIL_ADDRESS)


def send_email_to_removed_contribution_reviewer(
    user_id: str,
    review_category: str,
    language_code: Optional[str] = None
) -> None:
    """Sends an email to user who is removed from the reviewer position.

    Args:
        user_id: str. The ID of the user.
        review_category: str. The category which for which review role is
            removed.
        language_code: None|str. The language code for a language if the review
            item is translation or voiceover else None.

    Raises:
        Exception. The review category is not valid.
        Exception. The language_code cannot be None if the review category is
            'translation' or 'voiceover'.
    """
    if review_category not in REMOVED_REVIEWER_EMAIL_DATA:
        raise Exception('Invalid review_category: %s' % review_category)

    review_category_data = REMOVED_REVIEWER_EMAIL_DATA[review_category]
    email_subject = 'You have been unassigned as a %s reviewer' % (
        review_category_data['review_category'])

    if review_category in [
            constants.CONTRIBUTION_RIGHT_CATEGORY_REVIEW_TRANSLATION,
            constants.CONTRIBUTION_RIGHT_CATEGORY_REVIEW_VOICEOVER]:
        if language_code is None:
            raise Exception(
                'The language_code cannot be None if the review category is'
                ' \'translation\' or \'voiceover\''
            )
        language_description = utils.get_supported_audio_language_description(
            language_code).capitalize()
        reviewer_role_description = (
            review_category_data['role_description_template'] % (
                language_description))
        reviewer_rights_message = (
            review_category_data['rights_message_template'] % (
                language_description))
    else:
        reviewer_role_description = review_category_data['role_description']
        reviewer_rights_message = review_category_data['rights_message']

    email_body_template = (
        'Hi %s,<br><br>'
        'The Oppia team has removed you from the %s. You won\'t be able to %s '
        'any more, but you can still contribute %s through the '
        '<a href="https://www.oppia.org/contributor-dashboard">'
        'Contributor Dashboard</a>.<br><br>'
        'Thanks, and happy contributing!<br><br>'
        'Best wishes,<br>'
        'The Oppia Community')

    if not feconf.CAN_SEND_EMAILS:
        logging.error('This app cannot send emails to users.')
        return

    recipient_username = user_services.get_username(user_id)
    can_user_receive_email = user_services.get_email_preferences(
        user_id).can_receive_email_updates

    # Send email only if recipient wants to receive.
    if can_user_receive_email:
        email_body = email_body_template % (
            recipient_username, reviewer_role_description,
            reviewer_rights_message,
            review_category_data['contribution_allowed'])
        _send_email(
            user_id, feconf.SYSTEM_COMMITTER_ID,
            feconf.EMAIL_INTENT_REMOVE_REVIEWER, email_subject, email_body,
            feconf.NOREPLY_EMAIL_ADDRESS)


def send_not_mergeable_change_list_to_admin_for_review(
    exp_id: str,
    frontend_version: int,
    backend_version: int,
    change_list_dict: Sequence[
        Mapping[str, change_domain.AcceptableChangeDictTypes]
    ]
) -> None:
    """Sends an email to the admin to review the not mergeable change list
    to improve the functionality in future if possible.

    Args:
        exp_id: str. The ID of an exploration on which the change list was
            to be applied.
        frontend_version: int. Version of an exploration from frontend on
            which a user is working.
        backend_version: int. Latest version of an exploration on which the
            change list can not be applied.
        change_list_dict: dict. Dict of the changes made by the
            user on the frontend, which are not mergeable.
    """
    email_subject = 'Some changes were rejected due to a conflict'
    email_body_template = (
        'Hi Admin,<br><br>'
        'Some draft changes were rejected in exploration %s because the '
        'changes were conflicting and could not be saved. Please see the '
        'rejected change list below:<br>'
        'Discarded change list: %s <br><br>'
        'Frontend Version: %s<br>'
        'Backend Version: %s<br><br>'
        'Thanks!')

    if feconf.CAN_SEND_EMAILS:
        email_body = email_body_template % (
            exp_id, change_list_dict, frontend_version, backend_version)
        send_mail_to_admin(email_subject, email_body)
