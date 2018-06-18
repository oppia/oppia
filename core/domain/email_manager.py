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

import datetime
import logging

from constants import constants
from core.domain import config_domain
from core.domain import html_cleaner
from core.domain import rights_manager
from core.domain import subscription_services
from core.domain import user_services
from core.platform import models
import feconf

(email_models,) = models.Registry.import_models([models.NAMES.email])
app_identity_services = models.Registry.import_app_identity_services()
email_services = models.Registry.import_email_services()
transaction_services = models.Registry.import_transaction_services()


def log_new_error(*args, **kwargs):
    """Logs an error message (This is a stub for logging.error(), so that the
    latter can be swapped out in tests).
    """
    logging.error(*args, **kwargs)


NOTIFICATION_EMAIL_LIST_SCHEMA = {
    'type': 'list',
    'items': {
        'type': 'unicode',
        'validators': [{
            'id': 'is_valid_email',
        }]
    },
    'validators': [{
        'id': 'has_length_at_most',
        'max_value': 5
    }, {
        'id': 'is_uniquified',
    }]
}

EMAIL_HTML_BODY_SCHEMA = {
    'type': 'unicode',
    'ui_config': {
        'rows': 20,
    }
}

EMAIL_CONTENT_SCHEMA = {
    'type': 'dict',
    'properties': [{
        'name': 'subject',
        'schema': {
            'type': 'unicode',
        },
    }, {
        'name': 'html_body',
        'schema': EMAIL_HTML_BODY_SCHEMA,
    }],
}

EMAIL_SENDER_NAME = config_domain.ConfigProperty(
    'email_sender_name', {'type': 'unicode'},
    'The default sender name for outgoing emails.', 'Site Admin')
EMAIL_FOOTER = config_domain.ConfigProperty(
    'email_footer', {'type': 'unicode', 'ui_config': {'rows': 5}},
    'The footer to append to all outgoing emails. (This should be written in '
    'HTML and include an unsubscribe link.)',
    'You can change your email preferences via the '
    '<a href="https://www.example.com">Preferences</a> page.')

_PLACEHOLDER_SUBJECT = 'THIS IS A PLACEHOLDER.'
_PLACEHOLDER_HTML_BODY = 'THIS IS A <b>PLACEHOLDER</b> AND SHOULD BE REPLACED.'

SIGNUP_EMAIL_CONTENT = config_domain.ConfigProperty(
    'signup_email_content', EMAIL_CONTENT_SCHEMA,
    'Content of email sent after a new user signs up. (The email body should '
    'be written with HTML and not include a salutation or footer.) These '
    'emails are only sent if the functionality is enabled in feconf.py.',
    {
        'subject': _PLACEHOLDER_SUBJECT,
        'html_body': _PLACEHOLDER_HTML_BODY,
    })

EXPLORATION_ROLE_MANAGER = 'manager rights'
EXPLORATION_ROLE_EDITOR = 'editor rights'
EXPLORATION_ROLE_PLAYTESTER = 'playtest access'

EDITOR_ROLE_EMAIL_HTML_ROLES = {
    rights_manager.ROLE_OWNER: EXPLORATION_ROLE_MANAGER,
    rights_manager.ROLE_EDITOR: EXPLORATION_ROLE_EDITOR,
    rights_manager.ROLE_VIEWER: EXPLORATION_ROLE_PLAYTESTER
}

_EDITOR_ROLE_EMAIL_HTML_RIGHTS = {
    'can_manage': '<li>Change the exploration permissions</li><br>',
    'can_edit': '<li>Edit the exploration</li><br>',
    'can_play': '<li>View and playtest the exploration</li><br>'
}

EDITOR_ROLE_EMAIL_RIGHTS_FOR_ROLE = {
    EXPLORATION_ROLE_MANAGER: (
        _EDITOR_ROLE_EMAIL_HTML_RIGHTS['can_manage'] +
        _EDITOR_ROLE_EMAIL_HTML_RIGHTS['can_edit'] +
        _EDITOR_ROLE_EMAIL_HTML_RIGHTS['can_play']),
    EXPLORATION_ROLE_EDITOR: (
        _EDITOR_ROLE_EMAIL_HTML_RIGHTS['can_edit'] +
        _EDITOR_ROLE_EMAIL_HTML_RIGHTS['can_play']),
    EXPLORATION_ROLE_PLAYTESTER: _EDITOR_ROLE_EMAIL_HTML_RIGHTS['can_play']
}

UNPUBLISH_EXPLORATION_EMAIL_HTML_BODY = config_domain.ConfigProperty(
    'unpublish_exploration_email_html_body', EMAIL_HTML_BODY_SCHEMA,
    'Default content for the email sent after an exploration is unpublished '
    'by a moderator. These emails are only sent if the functionality is '
    'enabled in feconf.py. Leave this field blank if emails should not be '
    'sent.',
    'I\'m writing to inform you that I have unpublished the above '
    'exploration.')

NOTIFICATION_EMAILS_FOR_FAILED_TASKS = config_domain.ConfigProperty(
    'notification_emails_for_failed_tasks',
    NOTIFICATION_EMAIL_LIST_SCHEMA,
    'Email(s) to notify if an ML training task fails',
    []
)

SENDER_VALIDATORS = {
    feconf.EMAIL_INTENT_SIGNUP: (lambda x: x == constants.SYSTEM_COMMITTER_ID),
    feconf.EMAIL_INTENT_UNPUBLISH_EXPLORATION: (
        user_services.is_at_least_moderator),
    feconf.EMAIL_INTENT_DAILY_BATCH: (
        lambda x: x == constants.SYSTEM_COMMITTER_ID),
    feconf.EMAIL_INTENT_EDITOR_ROLE_NOTIFICATION: (
        lambda x: x == constants.SYSTEM_COMMITTER_ID),
    feconf.EMAIL_INTENT_FEEDBACK_MESSAGE_NOTIFICATION: (
        lambda x: x == constants.SYSTEM_COMMITTER_ID),
    feconf.EMAIL_INTENT_SUGGESTION_NOTIFICATION: (
        lambda x: x == constants.SYSTEM_COMMITTER_ID),
    feconf.EMAIL_INTENT_SUBSCRIPTION_NOTIFICATION: (
        lambda x: x == constants.SYSTEM_COMMITTER_ID),
    feconf.EMAIL_INTENT_QUERY_STATUS_NOTIFICATION: (
        lambda x: x == constants.SYSTEM_COMMITTER_ID),
    feconf.EMAIL_INTENT_MARKETING: user_services.is_admin,
    feconf.EMAIL_INTENT_DELETE_EXPLORATION: (
        user_services.is_at_least_moderator),
    feconf.EMAIL_INTENT_REPORT_BAD_CONTENT: (
        lambda x: x == constants.SYSTEM_COMMITTER_ID),
    feconf.BULK_EMAIL_INTENT_MARKETING: user_services.is_admin,
    feconf.BULK_EMAIL_INTENT_IMPROVE_EXPLORATION: user_services.is_admin,
    feconf.BULK_EMAIL_INTENT_CREATE_EXPLORATION: user_services.is_admin,
    feconf.BULK_EMAIL_INTENT_CREATOR_REENGAGEMENT: user_services.is_admin,
    feconf.BULK_EMAIL_INTENT_LEARNER_REENGAGEMENT: user_services.is_admin,
    feconf.BULK_EMAIL_INTENT_TEST: user_services.is_admin
}


def _require_sender_id_is_valid(intent, sender_id):
    """Ensure that the sender ID is valid, based on the email's intent.

    Many emails are only allowed to be sent by a certain user or type of user,
    e.g. 'admin' or an admin/moderator. This function will raise an exception
    if the given sender is not allowed to send this type of email.

    Args:
        intent: str. The intent string, i.e. the purpose of the email.
            Valid intent strings are defined in feconf.py.
        sender_id: str. The ID of the user sending the email.

    Raises:
        Exception: The email intent is invalid.
        Exception: The sender_id is not appropriate for the given intent.
    """

    if intent not in SENDER_VALIDATORS:
        raise Exception('Invalid email intent string: %s' % intent)
    else:
        if not SENDER_VALIDATORS[intent](sender_id):
            logging.error(
                'Invalid sender_id %s for email with intent \'%s\'' %
                (sender_id, intent))
            raise Exception(
                'Invalid sender_id for email with intent \'%s\'' % intent)


def _send_email(
        recipient_id, sender_id, intent, email_subject, email_html_body,
        sender_email, bcc_admin=False, sender_name=None, reply_to_id=None):
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
        reply_to_id: str or None. The unique reply-to id used in reply-to email
            address sent to recipient.
    """

    if sender_name is None:
        sender_name = EMAIL_SENDER_NAME.value

    _require_sender_id_is_valid(intent, sender_id)

    recipient_email = user_services.get_email_from_user_id(recipient_id)
    cleaned_html_body = html_cleaner.clean(email_html_body)
    if cleaned_html_body != email_html_body:
        log_new_error(
            'Original email HTML body does not match cleaned HTML body:\n'
            'Original:\n%s\n\nCleaned:\n%s\n' %
            (email_html_body, cleaned_html_body))
        return

    raw_plaintext_body = cleaned_html_body.replace('<br/>', '\n').replace(
        '<br>', '\n').replace('<li>', '<li>- ').replace('</p><p>', '</p>\n<p>')
    cleaned_plaintext_body = html_cleaner.strip_html_tags(raw_plaintext_body)

    if email_models.SentEmailModel.check_duplicate_message(
            recipient_id, email_subject, cleaned_plaintext_body):
        log_new_error(
            'Duplicate email:\n'
            'Details:\n%s %s\n%s\n\n' %
            (recipient_id, email_subject, cleaned_plaintext_body))
        return

    def _send_email_in_transaction():
        sender_name_email = '%s <%s>' % (sender_name, sender_email)

        email_services.send_mail(
            sender_name_email, recipient_email, email_subject,
            cleaned_plaintext_body, cleaned_html_body, bcc_admin,
            reply_to_id=reply_to_id)
        email_models.SentEmailModel.create(
            recipient_id, recipient_email, sender_id, sender_name_email, intent,
            email_subject, cleaned_html_body, datetime.datetime.utcnow())

    transaction_services.run_in_transaction(_send_email_in_transaction)


def _send_bulk_mail(
        recipient_ids, sender_id, intent, email_subject, email_html_body,
        sender_email, sender_name, instance_id=None):
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
        instance_id: str or None. The ID of the BulkEmailModel entity instance.
    """
    _require_sender_id_is_valid(intent, sender_id)

    recipients_settings = user_services.get_users_settings(recipient_ids)
    recipient_emails = [user.email for user in recipients_settings]

    cleaned_html_body = html_cleaner.clean(email_html_body)
    if cleaned_html_body != email_html_body:
        log_new_error(
            'Original email HTML body does not match cleaned HTML body:\n'
            'Original:\n%s\n\nCleaned:\n%s\n' %
            (email_html_body, cleaned_html_body))
        return

    raw_plaintext_body = cleaned_html_body.replace('<br/>', '\n').replace(
        '<br>', '\n').replace('<li>', '<li>- ').replace('</p><p>', '</p>\n<p>')
    cleaned_plaintext_body = html_cleaner.strip_html_tags(raw_plaintext_body)

    def _send_bulk_mail_in_transaction(instance_id=None):
        sender_name_email = '%s <%s>' % (sender_name, sender_email)

        email_services.send_bulk_mail(
            sender_name_email, recipient_emails, email_subject,
            cleaned_plaintext_body, cleaned_html_body)

        if instance_id is None:
            instance_id = email_models.BulkEmailModel.get_new_id('')
        email_models.BulkEmailModel.create(
            instance_id, recipient_ids, sender_id, sender_name_email, intent,
            email_subject, cleaned_html_body, datetime.datetime.utcnow())

    transaction_services.run_in_transaction(
        _send_bulk_mail_in_transaction, instance_id)


def send_mail_to_admin(email_subject, email_body):
    """Send an email to the admin email address.

    The email is sent to the ADMIN_EMAIL_ADDRESS set in feconf.py.

    Args:
        email_subject: str. Subject of the email.
        email_body: str. Body (message) of the email.
    """

    app_id = app_identity_services.get_application_id()
    body = '(Sent from %s)\n\n%s' % (app_id, email_body)

    email_services.send_mail(
        feconf.SYSTEM_EMAIL_ADDRESS, feconf.ADMIN_EMAIL_ADDRESS, email_subject,
        body, body.replace('\n', '<br/>'), bcc_admin=False)


def send_post_signup_email(user_id):
    """Sends a post-signup email to the given user.

    Raises an exception if emails are not allowed to be sent to users (i.e.
    feconf.CAN_SEND_EMAILS is False).

    Args:
        user_id: str. User ID of the user that signed up.
    """

    for key, content in SIGNUP_EMAIL_CONTENT.value.iteritems():
        if content == SIGNUP_EMAIL_CONTENT.default_value[key]:
            log_new_error(
                'Please ensure that the value for the admin config property '
                'SIGNUP_EMAIL_CONTENT is set, before allowing post-signup '
                'emails to be sent.')
            return

    user_settings = user_services.get_user_settings(user_id)
    email_subject = SIGNUP_EMAIL_CONTENT.value['subject']
    email_body = 'Hi %s,<br><br>%s<br><br>%s' % (
        user_settings.username,
        SIGNUP_EMAIL_CONTENT.value['html_body'],
        EMAIL_FOOTER.value)

    _send_email(
        user_id, constants.SYSTEM_COMMITTER_ID, feconf.EMAIL_INTENT_SIGNUP,
        email_subject, email_body, feconf.NOREPLY_EMAIL_ADDRESS)


def get_moderator_unpublish_exploration_email():
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
        return config_domain.Registry.get_config_property(
            'unpublish_exploration_email_html_body').value
    except Exception:
        return ''


def require_moderator_email_prereqs_are_satisfied():
    """Raises an exception if, for any reason, moderator emails cannot be sent.

    Raises:
        Exception: feconf.REQUIRE_EMAIL_ON_MODERATOR_ACTION is False.
        Exception: feconf.CAN_SEND_EMAILS is False.
    """

    if not feconf.REQUIRE_EMAIL_ON_MODERATOR_ACTION:
        raise Exception(
            'For moderator emails to be sent, please ensure that '
            'REQUIRE_EMAIL_ON_MODERATOR_ACTION is set to True.')
    if not feconf.CAN_SEND_EMAILS:
        raise Exception(
            'For moderator emails to be sent, please ensure that '
            'CAN_SEND_EMAILS is set to True.')


def send_moderator_action_email(
        sender_id, recipient_id, intent, exploration_title, email_body):
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

    recipient_user_settings = user_services.get_user_settings(recipient_id)
    sender_user_settings = user_services.get_user_settings(sender_id)
    email_subject = feconf.VALID_MODERATOR_ACTIONS[intent]['email_subject_fn'](
        exploration_title)
    email_salutation_html = email_config['email_salutation_html_fn'](
        recipient_user_settings.username)
    email_signoff_html = email_config['email_signoff_html_fn'](
        sender_user_settings.username)

    full_email_content = (
        '%s<br><br>%s<br><br>%s<br><br>%s' % (
            email_salutation_html, email_body, email_signoff_html,
            EMAIL_FOOTER.value))
    _send_email(
        recipient_id, sender_id, intent, email_subject, full_email_content,
        feconf.SYSTEM_EMAIL_ADDRESS, bcc_admin=True)


def send_role_notification_email(
        inviter_id, recipient_id, recipient_role, exploration_id,
        exploration_title):
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
        Exception: The role is invalid (i.e. not defined in
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
        log_new_error('This app cannot send emails to users.')
        return

    # Return from here is sending editor role email is disabled.
    if not feconf.CAN_SEND_EDITOR_ROLE_EMAILS:
        log_new_error('This app cannot send editor role emails to users.')
        return

    recipient_user_settings = user_services.get_user_settings(recipient_id)
    inviter_user_settings = user_services.get_user_settings(inviter_id)
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
        recipient_user_settings.username, inviter_user_settings.username,
        role_description, exploration_id, exploration_title, rights_html,
        exploration_id, EMAIL_FOOTER.value)

    _send_email(
        recipient_id, constants.SYSTEM_COMMITTER_ID,
        feconf.EMAIL_INTENT_EDITOR_ROLE_NOTIFICATION, email_subject, email_body,
        feconf.NOREPLY_EMAIL_ADDRESS,
        sender_name=inviter_user_settings.username)


def send_emails_to_subscribers(creator_id, exploration_id, exploration_title):
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
        log_new_error('This app cannot send emails to users.')
        return

    if not feconf.CAN_SEND_SUBSCRIPTION_EMAILS:
        log_new_error('This app cannot send subscription emails to users.')
        return

    recipient_list = subscription_services.get_all_subscribers_of_creator(
        creator_id)
    recipients_usernames = user_services.get_usernames(recipient_list)
    recipients_preferences = user_services.get_users_email_preferences(
        recipient_list)
    for index, username in enumerate(recipients_usernames):
        if recipients_preferences[index].can_receive_subscription_email:
            email_body = email_body_template % (
                username, creator_name, exploration_id,
                exploration_title, EMAIL_FOOTER.value)
            _send_email(
                recipient_list[index], constants.SYSTEM_COMMITTER_ID,
                feconf.EMAIL_INTENT_SUBSCRIPTION_NOTIFICATION,
                email_subject, email_body, feconf.NOREPLY_EMAIL_ADDRESS)


def send_feedback_message_email(recipient_id, feedback_messages):
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
        '<a href="https://www.oppia.org/creator_dashboard">dashboard</a>.'
        '<br>'
        '<br>Thanks, and happy teaching!<br>'
        '<br>'
        'Best wishes,<br>'
        'The Oppia Team<br>'
        '<br>%s')

    if not feconf.CAN_SEND_EMAILS:
        log_new_error('This app cannot send emails to users.')
        return

    if not feconf.CAN_SEND_FEEDBACK_MESSAGE_EMAILS:
        log_new_error('This app cannot send feedback message emails to users.')
        return

    if not feedback_messages:
        return

    recipient_user_settings = user_services.get_user_settings(recipient_id)

    messages_html = ''
    count_messages = 0
    for exp_id, reference in feedback_messages.iteritems():
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
        recipient_user_settings.username, count_messages if count_messages > 1
        else 'a', 's' if count_messages > 1 else '', messages_html,
        EMAIL_FOOTER.value)

    _send_email(
        recipient_id, constants.SYSTEM_COMMITTER_ID,
        feconf.EMAIL_INTENT_FEEDBACK_MESSAGE_NOTIFICATION,
        email_subject, email_body, feconf.NOREPLY_EMAIL_ADDRESS)


def can_users_receive_thread_email(
        recipient_ids, exploration_id, has_suggestion):
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
    zipped_preferences = zip(users_global_prefs, users_exploration_prefs)

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
        exploration_title, exploration_id, author_id, recipient_list):
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
        log_new_error('This app cannot send emails to users.')
        return

    if not feconf.CAN_SEND_FEEDBACK_MESSAGE_EMAILS:
        log_new_error('This app cannot send feedback message emails to users.')
        return

    author_settings = user_services.get_user_settings(author_id)
    can_users_receive_email = (
        can_users_receive_thread_email(recipient_list, exploration_id, True))
    for index, recipient_id in enumerate(recipient_list):
        recipient_user_settings = user_services.get_user_settings(recipient_id)
        if can_users_receive_email[index]:
            # Send email only if recipient wants to receive.
            email_body = email_body_template % (
                recipient_user_settings.username, author_settings.username,
                exploration_id, exploration_title, exploration_id,
                EMAIL_FOOTER.value)
            _send_email(
                recipient_id, constants.SYSTEM_COMMITTER_ID,
                feconf.EMAIL_INTENT_SUGGESTION_NOTIFICATION,
                email_subject, email_body, feconf.NOREPLY_EMAIL_ADDRESS)


def send_instant_feedback_message_email(
        recipient_id, sender_id, message, email_subject, exploration_title,
        exploration_id, thread_title, reply_to_id=None):
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
        reply_to_id: str or None. The unique reply-to id used in reply-to email
            sent to recipient.
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
        log_new_error('This app cannot send emails to users.')
        return

    if not feconf.CAN_SEND_FEEDBACK_MESSAGE_EMAILS:
        log_new_error('This app cannot send feedback message emails to users.')
        return

    sender_settings = user_services.get_user_settings(sender_id)
    recipient_settings = user_services.get_user_settings(recipient_id)
    recipient_preferences = user_services.get_email_preferences(recipient_id)

    if recipient_preferences.can_receive_feedback_message_email:
        email_body = email_body_template % (
            recipient_settings.username, thread_title, exploration_id,
            exploration_title, sender_settings.username, message,
            EMAIL_FOOTER.value)
        _send_email(
            recipient_id, constants.SYSTEM_COMMITTER_ID,
            feconf.EMAIL_INTENT_FEEDBACK_MESSAGE_NOTIFICATION, email_subject,
            email_body, feconf.NOREPLY_EMAIL_ADDRESS, reply_to_id=reply_to_id)


def send_flag_exploration_email(
        exploration_title, exploration_id, reporter_id, report_text):
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
        log_new_error('This app cannot send emails to users.')
        return

    email_body = email_body_template % (
        user_services.get_user_settings(reporter_id).username,
        exploration_title, report_text, exploration_id,
        EMAIL_FOOTER.value)

    recipient_list = user_services.get_user_ids_by_role(
        feconf.ROLE_ID_MODERATOR)
    for recipient_id in recipient_list:
        _send_email(
            recipient_id, constants.SYSTEM_COMMITTER_ID,
            feconf.EMAIL_INTENT_REPORT_BAD_CONTENT,
            email_subject, email_body, feconf.NOREPLY_EMAIL_ADDRESS)


def send_query_completion_email(recipient_id, query_id):
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

    recipient_user_settings = user_services.get_user_settings(recipient_id)
    email_body = email_body_template % (
        recipient_user_settings.username, query_id, query_id,
        EMAIL_FOOTER.value)
    _send_email(
        recipient_id, constants.SYSTEM_COMMITTER_ID,
        feconf.EMAIL_INTENT_QUERY_STATUS_NOTIFICATION, email_subject,
        email_body, feconf.NOREPLY_EMAIL_ADDRESS)


def send_query_failure_email(recipient_id, query_id, query_params):
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

    recipient_user_settings = user_services.get_user_settings(recipient_id)
    email_body = email_body_template % (
        recipient_user_settings.username, query_id, EMAIL_FOOTER.value)
    _send_email(
        recipient_id, constants.SYSTEM_COMMITTER_ID,
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
        sender_id, recipient_ids, email_subject, email_body, email_intent):
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


def send_test_email_for_bulk_emails(tester_id, email_subject, email_body):
    """Sends a test email to the tester.

    Args:
        tester_id: str. The user ID of the tester.
        email_subject: str. The subject of the email.
        email_body: str. The body of the email.
    """
    tester_name = user_services.get_username(tester_id)
    tester_email = user_services.get_email_from_user_id(tester_id)
    _send_email(
        tester_id, tester_id, feconf.BULK_EMAIL_INTENT_TEST,
        email_subject, email_body, tester_email, sender_name=tester_name)
