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
import textwrap

from core import feconf
from core.domain import platform_parameter_list
from core.domain import platform_parameter_services
from core.platform import models

from typing import Dict, List, Optional, Union

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
    bcc_admin: bool = False,
    attachments: Optional[List[Dict[str, str]]] = None
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
        attachments: list(dict)|None. Optional argument. A list of
            dictionaries, where each dictionary includes the keys `filename`
            and `path` with their corresponding values.

    Raises:
        Exception. The configuration in feconf.py forbids emails from being
            sent.
        ValueError. Any recipient email address is malformed.
        ValueError. Any sender email address is malformed.
        Exception. The email was not sent correctly. In other words, the
            send_email_to_recipients() function returned False
            (signifying API returned bad status code).
    """
    server_can_send_emails = (
        platform_parameter_services.get_platform_parameter_value(
            platform_parameter_list.ParamName.SERVER_CAN_SEND_EMAILS.value
        )
    )
    if not server_can_send_emails:
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
        plaintext_body, html_body, bcc, '', None, attachments)

    if not response:
        raise Exception((
            'Email to %s failed to send. Please try again later or '
            'contact us to report a bug at '
            'https://www.oppia.org/contact.') % recipient_email)


def send_bulk_mail(
    sender_email: str,
    recipient_emails: List[str],
    subject: str,
    plaintext_body: str,
    html_body: str,
    attachments: Optional[List[Dict[str, str]]] = None
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
        attachments: list(dict)|None. Optional argument. A list of
            dictionaries, where each dictionary includes the keys `filename`
            and `path` with their corresponding values.

    Raises:
        Exception. The configuration in feconf.py forbids emails from being
            sent.
        ValueError. Any recipient email addresses are malformed.
        ValueError. Any sender email address is malformed.
        Exception. The emails were not sent correctly. In other words, the
            send_email_to_recipients() function returned False
            (signifying API returned bad status code).
    """
    server_can_send_emails = (
        platform_parameter_services.get_platform_parameter_value(
            platform_parameter_list.ParamName.SERVER_CAN_SEND_EMAILS.value
        )
    )
    if not server_can_send_emails:
        raise Exception('This app cannot send emails to users.')

    for recipient_email in recipient_emails:
        if not _is_email_valid(recipient_email):
            raise ValueError(
                'Malformed recipient email address: %s' % recipient_email)

    if not _is_sender_email_valid(sender_email):
        raise ValueError(
            'Malformed sender email address: %s' % sender_email)

    response = email_services.send_email_to_recipients(
        sender_email, recipient_emails, subject,
        plaintext_body, html_body, attachments=attachments)

    if not response:
        raise Exception(
            'Bulk email failed to send. Please try again later or contact us '
            'to report a bug at https://www.oppia.org/contact.')


def convert_email_to_loggable_string(
        sender_email: str,
        recipient_emails: List[str],
        subject: str,
        plaintext_body: str,
        html_body: str,
        bcc: Optional[List[str]] = None,
        reply_to: Optional[str] = None,
        recipient_variables: Optional[
            Dict[str, Dict[str, Union[str, float]]]] = None,
        attachments: Optional[List[Dict[str, str]]] = None
) -> str:
    """Generates a loggable email which can be printed to console in order
    to model sending an email in non production mode.

    Args:
        sender_email: str. The email address of the sender. This should be in
            the form 'SENDER_NAME <SENDER_EMAIL_ADDRESS>' or
            'SENDER_EMAIL_ADDRESS. Format must be utf-8.
        recipient_emails: list(str). The email addresses of the recipients.
            Format must be utf-8.
        subject: str. The subject line of the email. Format must be utf-8.
        plaintext_body: str. The plaintext body of the email. Format must
            be utf-8.
        html_body: str. The HTML body of the email. Must fit in a datastore
            entity. Format must be utf-8.
        bcc: list(str)|None. Optional argument. List of bcc emails. Format must
            be utf-8.
        reply_to: str|None. Optional argument. Reply address formatted like
            “reply+<reply_id>@<incoming_email_domain_name>
            reply_id is the unique id of the sender. Format must be utf-8.
        recipient_variables: dict|None. Optional argument. If batch sending
            requires differentiating each email based on the recipient, we
            assign a unique id to each recipient, including info relevant to
            that recipient so that we can reference it when composing the
            email like so:
                recipient_variables =
                    {"bob@example.com": {"first":"Bob", "id":1},
                     "alice@example.com": {"first":"Alice", "id":2}}
                subject = 'Hey, %recipient.first%'
            More info about this format at:
                https://documentation.mailgun.com/en/latest/user_manual.html
                #batch-sending.
        attachments: list(dict)|None. Optional argument. A list of
            dictionaries, where each dictionary includes the keys `filename`
            and `path` with their corresponding values.

    Returns:
        str. The loggable email string.
    """
    # Show the first 3 emails in the recipient list.
    recipient_email_list_str = ' '.join(
        ['%s' %
         (recipient_email,) for recipient_email in recipient_emails[:3]])
    if len(recipient_emails) > 3:
        recipient_email_list_str += (
            '... Total: %s emails.' % (str(len(recipient_emails))))

    filenames = []
    if attachments:
        for attachment in attachments:
            filenames.append(attachment['filename'])

    # Show the first 3 emails in bcc email list.
    if bcc:
        bcc_email_list_str = ' '.join(
            ['%s' %
             (bcc_email,) for bcc_email in bcc[:3]])
        if len(bcc) > 3:
            bcc_email_list_str += '... Total: %s emails.' % str(len(bcc))

    msg = (
        """
        EmailService.SendMail
        From: %s
        To: %s
        Subject: %s
        Body:
            Content-type: text/plain
            Data length: %d
        Body:
            Content-type: text/html
            Data length: %d
        """ % (
            sender_email, recipient_email_list_str, subject,
            len(plaintext_body), len(html_body)))
    optional_msg_description = (
        """
        Bcc: %s
        Reply_to: %s
        Recipient Variables:
            Length: %d
        """ % (
            bcc_email_list_str if bcc else 'None',
            reply_to if reply_to else 'None',
            len(recipient_variables) if recipient_variables else 0))
    attachments_msg_description = (
        """
        Attachments: %s
        """ % (', '.join(filenames) if len(filenames) > 0 else 'None')
    )
    loggable_msg = (
        textwrap.dedent(msg) +
        textwrap.dedent(optional_msg_description) +
        textwrap.dedent(attachments_msg_description)
    )
    return loggable_msg
