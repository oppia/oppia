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

__author__ = 'Sean Lip'


import datetime
import logging

from core.domain import config_domain
from core.domain import html_cleaner
from core.domain import rights_manager
from core.domain import user_services
from core.platform import models
(email_models,) = models.Registry.import_models([models.NAMES.email])
email_services = models.Registry.import_email_services()
transaction_services = models.Registry.import_transaction_services()
import feconf
import utils


# Stub for logging.error(), so that it can be swapped out in tests.
log_new_error = logging.error

EMAIL_CONTENT_SCHEMA = {
    'type': 'dict',
    'properties': [{
        'name': 'subject',
        'schema': {
            'type': 'unicode',
        },
    }, {
        'name': 'html_body',
        'schema': {
            'type': 'html',
        }
    }],
}

EMAIL_FOOTER = config_domain.ConfigProperty(
    'email_footer', {'type': 'html'},
    'The footer to append to all outgoing emails. (This should include an '
    'unsubscribe link.)',
    'You can unsubscribe from these emails from the Preferences page.')
SIGNUP_EMAIL_CONTENT = config_domain.ConfigProperty(
    'signup_email_content', EMAIL_CONTENT_SCHEMA,
    'Content of email sent after a new user signs up. (The email body should '
    'not include a salutation or footer.)',
    {
        'subject': 'THIS IS A PLACEHOLDER.',
        'html_body': 'THIS IS A PLACEHOLDER AND SHOULD BE REPLACED.'
    })


SENDER_VALIDATORS = {
    email_models.INTENT_SIGNUP: (lambda x: x == feconf.ADMIN_COMMITTER_ID),
    email_models.INTENT_DAILY_BATCH: (
        lambda x: x == feconf.ADMIN_COMMITTER_ID),
    email_models.INTENT_MARKETING: (
        lambda x: rights_manager.Actor(x).is_admin()),
    email_models.INTENT_PUBLICIZE_EXPLORATION: (
        lambda x: rights_manager.Actor(x).is_moderator()),
    email_models.INTENT_UNPUBLISH_EXPLORATION: (
        lambda x: rights_manager.Actor(x).is_moderator()),
    email_models.INTENT_DELETE_EXPLORATION: (
        lambda x: rights_manager.Actor(x).is_moderator()),
}


def _require_sender_id_is_valid(intent, sender_id):
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
        recipient_id, sender_id, intent, email_subject, email_html_body):
    """Sends an email to the given recipient.

    This function should be used for sending all user-facing emails.

    Raises an Exception if the sender_id is not appropriate for the given
    intent. Currently we support only system-generated emails and emails
    initiated by moderator actions.
    """
    _require_sender_id_is_valid(intent, sender_id)

    recipient_email = user_services.get_email_from_user_id(recipient_id)
    plaintext_body = html_cleaner.strip_html_tags(email_html_body)

    def _send_email_in_transaction():
        email_services.send_mail(
            feconf.ADMIN_EMAIL_ADDRESS, recipient_email, email_subject,
            plaintext_body, email_html_body)
        email_models.SentEmailModel.create(
            recipient_id, recipient_email,
            sender_id, feconf.ADMIN_EMAIL_ADDRESS,
            intent, email_subject, email_html_body, datetime.datetime.utcnow())

    return transaction_services.run_in_transaction(_send_email_in_transaction)


def send_post_signup_email(user_id):
    """Sends a post-signup email to the given user.

    The caller is responsible for ensuring that emails are allowed to be sent
    to users (i.e. feconf.CAN_SEND_EMAILS_TO_USERS is True).
    """
    if SIGNUP_EMAIL_CONTENT.value == SIGNUP_EMAIL_CONTENT.default_value:
        log_new_error(
            'Please ensure that the value for the admin config property '
            'SIGNUP_EMAIL_CONTENT is set, before allowing post-signup emails '
            'to be sent.')
        return

    user_settings = user_services.get_user_settings(user_id)
    email_subject = SIGNUP_EMAIL_CONTENT.value['subject']
    # The newlines are to ensure that the plaintext email displays properly if
    # the HTML is stripped out.
    email_body = 'Hi %s,<br>\n<br>\n%s<br>\n<br>\n%s' % (
        user_settings.username,
        SIGNUP_EMAIL_CONTENT.value['html_body'],
        EMAIL_FOOTER.value)

    _send_email(
        user_id, feconf.ADMIN_COMMITTER_ID, email_models.INTENT_SIGNUP,
        email_subject, email_body)
