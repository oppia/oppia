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

from __future__ import annotations

import re

from core import feconf
from core.platform import models

from typing import List

(email_models,) = models.Registry.import_models([models.Names.EMAIL])

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import email_services

email_services = models.Registry.import_email_services()


def _is_email_valid(email_address: str) -> bool:
    """Determines whether an email address is valid.

    Args:
        email_address: str. Email address to check.

    Returns:
        bool. Whether the specified email address is valid.
    """
    if not isinstance(email_address, str):
        return False

    stripped_address = email_address.strip()
    if not stripped_address:
        return False
    # Regex for a valid email.
    # Matches any characters before the "@" sign, a series of characters until
    # a ".", and then a series of characters after the period.
    regex = r'^.+@[a-zA-Z0-9-.]+\.([a-zA-Z]+|[0-9]+)$'
    return bool(re.search(regex, email_address))


def _is_sender_email_valid(sender_email: str) -> bool:
    """Gets the sender_email address and validates that it is of the form
    'SENDER_NAME <SENDER_EMAIL_ADDRESS>' or 'email_address'.

    Args:
        sender_email: str. The email address of the sender.

    Returns:
        bool. Whether the sender_email is valid.
    """
    split_sender_email = sender_email.split(' ')
    if len(split_sender_email) < 2:
        return _is_email_valid(sender_email)

    email_address = split_sender_email[-1]
    if not email_address.startswith('<') or not email_address.endswith('>'):
        return False

    return _is_email_valid(email_address[1:-1])


def send_mail(
    sender_email: str,
    recipient_email: str,
    subject: str,
    plaintext_body: str,
    html_body: str,
    bcc_admin: bool = False
) -> None:
    """Sends an email.

    In general this function should only be called from
    email_manager._send_email().

    Args:
        sender_email: str. The email address of the sender. This should be in
            the form 'SENDER_NAME <SENDER_EMAIL_ADDRESS>' or
            'SENDER_EMAIL_ADDRESS'. Format must be utf-8.
        recipient_email: str. The email address of the recipient. Format must
            be utf-8.
        subject: str. The subject line of the email. Format must be utf-8.
        plaintext_body: str. The plaintext body of the email. Format must be
            utf-8.
        html_body: str. The HTML body of the email. Must fit in a datastore
            entity. Format must be utf-8.
        bcc_admin: bool. Whether to bcc feconf.ADMIN_EMAIL_ADDRESS on the email.

    Raises:
        Exception. The configuration in feconf.py forbids emails from being
            sent.
        ValueError. Any recipient email address is malformed.
        ValueError. Any sender email address is malformed.
        Exception. The email was not sent correctly. In other words, the
            send_email_to_recipients() function returned False
            (signifying API returned bad status code).
    """
    if not feconf.CAN_SEND_EMAILS:
        raise Exception('This app cannot send emails to users.')

    if not _is_email_valid(recipient_email):
        raise ValueError(
            'Malformed recipient email address: %s' % recipient_email)

    if not _is_sender_email_valid(sender_email):
        raise ValueError(
            'Malformed sender email address: %s' % sender_email)
    bcc = [feconf.ADMIN_EMAIL_ADDRESS] if bcc_admin else None
    response = email_services.send_email_to_recipients(
        sender_email, [recipient_email], subject,
        plaintext_body, html_body, bcc, '', None)
    if not response:
        raise Exception((
            'Email to %s failed to send. Please try again later or ' +
            'contact us to report a bug at ' +
            'https://www.oppia.org/contact.') % recipient_email)


def send_bulk_mail(
    sender_email: str,
    recipient_emails: List[str],
    subject: str,
    plaintext_body: str,
    html_body: str
) -> None:
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
        Exception. The configuration in feconf.py forbids emails from being
            sent.
        ValueError. Any recipient email addresses are malformed.
        ValueError. Any sender email address is malformed.
        Exception. The emails were not sent correctly. In other words, the
            send_email_to_recipients() function returned False
            (signifying API returned bad status code).
    """
    if not feconf.CAN_SEND_EMAILS:
        raise Exception('This app cannot send emails to users.')

    for recipient_email in recipient_emails:
        if not _is_email_valid(recipient_email):
            raise ValueError(
                'Malformed recipient email address: %s' % recipient_email)

    if not _is_sender_email_valid(sender_email):
        raise ValueError(
            'Malformed sender email address: %s' % sender_email)

    response = email_services.send_email_to_recipients(
        sender_email, recipient_emails, subject, plaintext_body, html_body)
    if not response:
        raise Exception(
            'Bulk email failed to send. Please try again later or contact us ' +
            'to report a bug at https://www.oppia.org/contact.')
