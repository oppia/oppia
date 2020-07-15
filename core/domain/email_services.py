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

import logging
import re
from textwrap import dedent # pylint: disable=import-only-modules

from constants import constants
from core.domain import email_domain
from core.platform import models

import feconf
import python_utils

(email_models,) = models.Registry.import_models([models.NAMES.email])
platform_email_services = models.Registry.import_email_services()


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
    sender_email_with_only_first_name_regex = (
        r'^[a-zA-Z._]+ <.+@(\[?)[a-zA-Z0-9-.]+.([a-zA-Z]{2,3}|[0-9]{1,3})(]?)>$')
    sender_email_with_full_name_regex = (
        r'^[a-zA-Z._]+ [a-zA-Z._]+ <.+@(\[?)[a-zA-Z0-9-.]+.([a-zA-Z]{2,3}' +
        r'|[0-9]{1,3})(]?)>$')
    return is_email_valid(sender_email) or (
        re.search(sender_email_with_only_first_name_regex, sender_email)) or (
            re.search(sender_email_with_full_name_regex, sender_email))


def send_mail(
        sender_email, recipient_email, subject, plaintext_body,
        html_body, bcc_admin=False, reply_to_id=None):
    """Sends an email using mailgun api.

    In general this function should only be called from
    email_manager._send_email().

    Args:
        sender_email: str. the email address of the sender. This should be in
            the form 'SENDER_NAME <SENDER_EMAIL_ADDRESS>'.
        recipient_email: str. the email address of the recipient.
        subject: str. The subject line of the email.
        plaintext_body: str. The plaintext body of the email.
        html_body: str. The HTML body of the email. Must fit in a datastore
            entity.
        bcc_admin: bool. Whether to bcc feconf.ADMIN_EMAIL_ADDRESS on the email.
        reply_to_id: str. The unique id of the sender.

    Raises:
        Exception: if the configuration in feconf.py forbids emails from being
            sent.
        Exception: if mailgun api key is not stored in feconf.MAILGUN_API_KEY.
        Exception: if mailgun domain name is not stored in
            feconf.MAILGUN_DOMAIN_NAME.
            (and possibly other exceptions, due to mail.send_mail() failures)
    """
    if not feconf.CAN_SEND_EMAILS:
        raise Exception('This app cannot send emails to users.')

    if not is_email_valid(recipient_email):
        raise ValueError(
            'Malformed recipient email address: %s' % recipient_email)

    if not is_sender_email_valid(sender_email):
        raise ValueError(
            'Malformed sender email address: %s' % sender_email)

    bcc = feconf.ADMIN_EMAIL_ADDRESS if (bcc_admin) else ''
    reply_to = (
        get_incoming_email_address(reply_to_id)
        if reply_to_id else '')

    if not constants.DEV_MODE:
        platform_email_services.send_email_to_recipients(
            sender_email, [recipient_email], subject.encode(encoding='utf-8'),
            plaintext_body.encode(encoding='utf-8'),
            html_body.encode(encoding='utf-8'), bcc=[bcc], reply_to=reply_to)
    else:
        msg_title = 'MailgunService.SendMail'
        # pylint: disable=division-operator-used
        msg_body = (
            """
            From: %s
            To: %s
            Subject: %s
            Body:
                Content-type: text/plain
                Data length: %d
            Body
                Content-type: text/html
                Data length: %d
            """ % (
                sender_email, recipient_email, subject, len(plaintext_body),
                len(html_body)))
        # pylint: enable=division-operator-used
        msg = msg_title + dedent(msg_body)
        logging.info(msg)
        logging.info(
            'You are not currently sending out real email since this is a' +
            ' dev environment. Emails are sent out in the production' +
            ' environment.')


def send_bulk_mail(
        sender_email, recipient_emails, subject, plaintext_body, html_body):
    """Sends an email using mailgun api.

    In general this function should only be called from
    email_manager._send_email().

    Args:
        sender_email: str. the email address of the sender. This should be in
            the form 'SENDER_NAME <SENDER_EMAIL_ADDRESS>'.
        recipient_emails: list(str). list of the email addresses of recipients.
        subject: str. The subject line of the email.
        plaintext_body: str. The plaintext body of the email.
        html_body: str. The HTML body of the email. Must fit in a datastore
            entity.

    Raises:
        Exception: if the configuration in feconf.py forbids emails from being
            sent.
        Exception: if mailgun api key is not stored in feconf.MAILGUN_API_KEY.
        Exception: if mailgun domain name is not stored in
            feconf.MAILGUN_DOMAIN_NAME.
            (and possibly other exceptions, due to mail.send_mail() failures)
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

    if constants.DEV_MODE:
        logging.info('MailgunService.SendBulkMail')
    for email_list in recipient_email_lists:
        # 'recipient-variable' in post data forces mailgun to send individual
        # email to each recipient (This is intended to be a workaround for
        # sending individual emails).
        if not constants.DEV_MODE:
            platform_email_services.send_email_to_recipients(
                sender_email, email_list, subject.encode(encoding='utf-8'),
                plaintext_body.encode(encoding='utf-8'),
                html_body.encode(encoding='utf-8'),
                recipient_variables={})
        else:
            recipient_email_list_str = ' '.join(
                ['%s' %
                 (recipient_email,) for recipient_email in email_list[:3]])
            # Show the first 3 emails in the list for up to 1000 emails.
            if len(email_list) > 3:
                recipient_email_list_str += (
                    '... Total: ' +
                    python_utils.convert_to_bytes(len(email_list)) + ' emails.')
            # pylint: disable=division-operator-used
            msg = (
                """
                From: %s
                To: %s
                Subject: %s
                Body:
                    Content-type: text/plain
                    Data length: %d
                Body
                    Content-type: text/html
                    Data length: %d
                """ % (
                    sender_email, recipient_email_list_str, subject,
                    len(plaintext_body), len(html_body)))
            # pylint: enable=division-operator-used
            logging.info(dedent(msg))
    if constants.DEV_MODE:
        logging.info(
            'You are not currently sending out real email since this is a' +
            ' dev environment. Emails are sent out in the production' +
            ' environment.')
