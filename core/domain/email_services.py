# Copyright 2018 The Oppia Authors. All Rights Reserved.
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

"""Service functions relating to email models."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import re

from core.domain import email_domain
from core.platform import models

import feconf
import python_utils

(email_models,) = models.Registry.import_models([models.NAMES.email])
email_services = models.Registry.import_email_services()


def get_feedback_thread_reply_info_from_model(model):
    """Converts GeneralFeedbackEmailReplyToIdModel to a FeedbackThreadReplyInfo.

    Args:
        model: GeneralFeedbackEmailReplyToIdModel. The model to be converted.

    Returns:
        FeedbackThreadReplyInfo. The resulting domain object.
    """
    return email_domain.FeedbackThreadReplyInfo(
        model.id, model.reply_to_id)


def get_feedback_thread_reply_info_by_reply_to_id(reply_to_id):
    """Gets the domain object corresponding to the model which is fetched by
    reply-to-id field.

    Args:
        reply_to_id: str. The reply_to_id to search for.

    Returns:
        FeedbackThreadReplyInfo or None. The corresponding domain object.
    """
    model = email_models.GeneralFeedbackEmailReplyToIdModel.get_by_reply_to_id(
        reply_to_id)
    if model is None:
        return None
    return get_feedback_thread_reply_info_from_model(model)


def get_feedback_thread_reply_info_by_user_and_thread_ids(user_id, thread_id):
    """Gets the domain object corresponding to the model which is fetched by
    user_id and thread_id.

    Args:
        user_id: str. The ID of the user.
        thread_id: str. The ID of the thread.

    Returns:
        FeedbackThreadReplyInfo or None. The corresponding domain object.
    """
    model = email_models.GeneralFeedbackEmailReplyToIdModel.get(
        user_id, thread_id, strict=False)
    if model is None:
        return None
    return get_feedback_thread_reply_info_from_model(model)


def get_incoming_email_address(reply_to_id):
    """Gets the incoming email address. The client is responsible for recording
    any audit logs.

    Args:
        reply_to_id: str. The unique id of the sender.

    Returns:
        str. The email address of the sender.
    """
    return 'reply+%s@%s' % (reply_to_id, feconf.INCOMING_EMAILS_DOMAIN_NAME)


def is_email_valid(email_address):
    """Determines whether an email address is invalid.

    Args:
        email_address: str. Email address to check.

    Returns:
        bool. Whether specified email address is valid.
    """
    if not isinstance(email_address, python_utils.BASESTRING):
        return False

    stripped_address = email_address.strip()
    if not stripped_address:
        return False
    # Regex for a valid email.
    regex = r'^.+@(\[?)[a-zA-Z0-9-.]+.([a-zA-Z]{2,3}|[0-9]{1,3})(]?)$'
    return re.search(regex, email_address)


def is_sender_email_valid(sender_email):
    """Gets the sender_email address and validates it is of the form
    'SENDER_NAME <SENDER_EMAIL_ADDRESS>' or 'email_address'.

    Args:
        sender_email: str. The email address of the sender.

    Returns:
        bool. Whether the sender_email is valid.
    """
    # Checks the case where sender_email is of the form 'Jane <EMAIL>'.
    sender_email_with_only_first_name_regex = (
        r'^[a-zA-Z._]+ <.+@(\[?)[a-zA-Z0-9-.]+.([a-zA-Z]{2,3}|[0-9]{1,3})' +
        '(]?)>$')
    # Checks the case where sender_email is of the form 'Jane Doe <EMAIL>'.
    sender_email_with_full_name_regex = (
        r'^[a-zA-Z._]+ [a-zA-Z._]+ <.+@(\[?)[a-zA-Z0-9-.]+.([a-zA-Z]{2,3}' +
        r'|[0-9]{1,3})(]?)>$')
    return is_email_valid(sender_email) or (
        re.search(sender_email_with_only_first_name_regex, sender_email)) or (
            re.search(sender_email_with_full_name_regex, sender_email))


def send_mail(
        sender_email, recipient_email, subject, plaintext_body,
        html_body, bcc_admin=False, reply_to_id=None):
    """Sends an email.

    In general this function should only be called from
    email_manager._send_email().

    Args:
        sender_email: str. The email address of the sender. This should be in
            the form 'SENDER_NAME <SENDER_EMAIL_ADDRESS>' or
            'SENDER_EMAIL_ADDRESS'. Format must be utf-8.
        recipient_email: str. the email address of the recipient. Format must
            be utf-8.
        subject: str. The subject line of the email. Format must be utf-8.
        plaintext_body: str. The plaintext body of the email. Format must be
            utf-8.
        html_body: str. The HTML body of the email. Must fit in a datastore
            entity. Format must be utf-8.
        bcc_admin: bool. Whether to bcc feconf.ADMIN_EMAIL_ADDRESS on the email.
        reply_to_id: str|None. The unique id of the sender.
            Format must be utf-8.

    Raises:
        Exception: The configuration in feconf.py forbids emails from being
            sent.
        Exception: If any recipient email addresses are malformed.
        Exception: If any sender email addresses are malformed.
    """
    if not feconf.CAN_SEND_EMAILS:
        raise Exception('This app cannot send emails to users.')

    if not is_email_valid(recipient_email):
        raise ValueError(
            'Malformed recipient email address: %s' % recipient_email)

    if not is_sender_email_valid(sender_email):
        raise ValueError(
            'Malformed sender email address: %s' % sender_email)
    bcc = [feconf.ADMIN_EMAIL_ADDRESS] if (bcc_admin) else None
    reply_to = (
        get_incoming_email_address(reply_to_id)
        if reply_to_id else '')
    email_services.send_email_to_recipients(
        sender_email, [recipient_email], subject.encode(encoding='utf-8'),
        plaintext_body.encode(encoding='utf-8'),
        html_body.encode(encoding='utf-8'), bcc=bcc, reply_to=reply_to)


def send_bulk_mail(
        sender_email, recipient_emails, subject, plaintext_body, html_body):
    """Sends emails to all recipients in recipient_emails.

    In general this function should only be called from
    email_manager._send_bulk_mail().

    Args:
        sender_email: str. The email address of the sender. This should be in
            the form 'SENDER_NAME <SENDER_EMAIL_ADDRESS>' or
            'SENDER_EMAIL_ADDRESS'. Format must be utf-8.
        recipient_emails: list(str). List of the email addresses of recipients.
            Format must be utf-8.
        subject: str. The subject line of the email. Format must be utf-8.
        plaintext_body: str. The plaintext body of the email. Format must be
            utf-8.
        html_body: str. The HTML body of the email. Must fit in a datastore
            entity. Format must be utf-8.

    Raises:
        Exception: The configuration in feconf.py forbids emails from being
            sent.
        Exception: If any recipient email addresses are malformed.
        Exception: If any sender email addresses are malformed.
    """
    if not feconf.CAN_SEND_EMAILS:
        raise Exception('This app cannot send emails to users.')

    for recipient_email in recipient_emails:
        if not is_email_valid(recipient_email):
            raise ValueError(
                'Malformed recipient email address: %s' % recipient_email)

    if not is_sender_email_valid(sender_email):
        raise ValueError(
            'Malformed sender email address: %s' % sender_email)

    # To send bulk emails we pass list of recipients in 'to' paarameter of
    # post data. Maximum limit of recipients per request is 1000.
    # For more detail check following link:
    # https://documentation.mailgun.com/user_manual.html#batch-sending
    recipient_email_lists = [
        recipient_emails[i:i + 1000]
        for i in python_utils.RANGE(0, len(recipient_emails), 1000)]

    for email_list in recipient_email_lists:
        # 'recipient-variable' in post data forces mailgun to send individual
        # email to each recipient (This is intended to be a workaround for
        # sending individual emails).
        email_services.send_email_to_recipients(
            sender_email, email_list, subject.encode(encoding='utf-8'),
            plaintext_body.encode(encoding='utf-8'),
            html_body.encode(encoding='utf-8'),
            recipient_variables={})
