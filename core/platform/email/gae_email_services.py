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

"""Provides email services."""

import feconf

from google.appengine.api import mail


def get_incoming_email_address(reply_to_id):
    """Gets the incoming email address. The client is responsible for recording
    any audit logs.

    Args:
        reply_to_id: str. The unique id of the sender.

    Returns:
        str. The email address of the sender.
    """
    return 'reply+%s@%s' % (reply_to_id, feconf.INCOMING_EMAILS_DOMAIN_NAME)


def send_mail(
        sender_email, recipient_email, subject, plaintext_body, html_body,
        bcc_admin=False, reply_to_id=None):
    """Sends an email. The client is responsible for recording any audit logs.

    In general this function should only be called from
    email_manager._send_email().

    Args:
        sender_email: str. The email address of the sender. This should be in
            the form 'SENDER_NAME <SENDER_EMAIL_ADDRESS>'.
        recipient_email: str. The email address of the recipient.
        subject: str. The subject line of the email.
        plaintext_body: str. The plaintext body of the email.
        html_body: str. The HTML body of the email. Must fit in a datastore
            entity.
        bcc_admin: bool. Whether to bcc feconf.ADMIN_EMAIL_ADDRESS on the email.
        reply_to_id: str or None. The unique reply-to id used in reply-to email
            sent to recipient.

    Raises:
        ValueError: If 'sender_email' or 'recipient_email' is invalid, according
            to App Engine.
        Exception: If the configuration in feconf.py forbids emails from being
            sent.
    """
    if not feconf.CAN_SEND_EMAILS:
        raise Exception('This app cannot send emails.')

    if not mail.is_email_valid(sender_email):
        raise ValueError(
            'Malformed sender email address: %s' % sender_email)
    if not mail.is_email_valid(recipient_email):
        raise ValueError(
            'Malformed recipient email address: %s' % recipient_email)

    msg = mail.EmailMessage(
        sender=sender_email, to=recipient_email,
        subject=subject, body=plaintext_body, html=html_body)
    if bcc_admin:
        msg.bcc = [feconf.ADMIN_EMAIL_ADDRESS]
    if reply_to_id:
        msg.reply_to = get_incoming_email_address(reply_to_id)

    # Send message.
    msg.send()


def send_bulk_mail(
        sender_email, recipient_emails, subject, plaintext_body, html_body):
    """Sends an email. The client is responsible for recording any audit logs.

    In general this function should only be called from
    email_manager._send_email().

    Args:
        sender_email: str. The email address of the sender. This should be in
            the form 'SENDER_NAME <SENDER_EMAIL_ADDRESS>'.
        recipient_emails: list(str). The list of email addresses
            of the recipients.
        subject: str. The subject line of the email.
        plaintext_body: str. The plaintext body of the email.
        html_body: str. The HTML body of the email. Must fit in a datastore
            entity.

    Raises:
        ValueError: If 'sender_email' or 'recipient_email' is invalid, according
            to App Engine.
        Exception: If the configuration in feconf.py forbids emails from being
            sent.
    """
    if not feconf.CAN_SEND_EMAILS:
        raise Exception('This app cannot send emails.')

    if not mail.is_email_valid(sender_email):
        raise ValueError(
            'Malformed sender email address: %s' % sender_email)

    for recipient_email in recipient_emails:
        if not mail.is_email_valid(recipient_email):
            raise ValueError(
                'Malformed recipient email address: %s' % recipient_email)

    for recipient_email in recipient_emails:
        mail.send_mail(
            sender_email, recipient_email, subject, plaintext_body,
            html=html_body)
