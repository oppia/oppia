# coding: utf-8
#
# Copyright 2016 The Oppia Authors. All Rights Reserved.
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

"""Provides mailgun api to send emails."""

from __future__ import annotations

import logging

from core import feconf
from core.domain import email_services
from core.platform import models

import requests
from typing import Dict, List, Optional, Union

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import secrets_services

secrets_services = models.Registry.import_secrets_services()

# Timeout in seconds for mailgun requests.
TIMEOUT_SECS = 60


def send_email_to_recipients(
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
) -> bool:
    """Send POST HTTP request to mailgun api. This method is adopted from
    the requests library's post method.

    Args:
        sender_email: str. The email address of the sender. This should be in
            the form 'SENDER_NAME <SENDER_EMAIL_ADDRESS>' or
            'SENDER_EMAIL_ADDRESS'. Must be utf-8.
        recipient_emails: list(str). The email addresses of the recipients.
            Must be utf-8.
        subject: str. The subject line of the email, Must be utf-8.
        plaintext_body: str. The plaintext body of the email. Must be utf-8.
        html_body: str. The HTML body of the email. Must fit in a datastore
            entity. Must be utf-8.
        bcc: list(str)|None. Optional argument. List of bcc emails.
        reply_to: str|None. Optional argument. Reply address formatted like
            “reply+<reply_id>@<incoming_email_domain_name>
            reply_id is the unique id of the sender.
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

    Raises:
        Exception. The mailgun api key is not stored in
            feconf.MAILGUN_API_KEY.
        Exception. The mailgun domain name is not stored in
            feconf.MAILGUN_DOMAIN_NAME.

    Returns:
        bool. Whether the emails are sent successfully.
    """
    mailgun_api_key: Optional[str] = secrets_services.get_secret(
        'MAILGUN_API_KEY')
    if mailgun_api_key is None:
        email_msg = email_services.convert_email_to_loggable_string(
            sender_email, recipient_emails, subject, plaintext_body, html_body,
            bcc, reply_to, recipient_variables
        )
        raise Exception(
            'Mailgun API key is not available. '
            'Here is the email that failed sending: %s' % email_msg)

    if not feconf.MAILGUN_DOMAIN_NAME:
        email_msg = email_services.convert_email_to_loggable_string(
            sender_email, recipient_emails, subject, plaintext_body, html_body,
            bcc, reply_to, recipient_variables
        )
        raise Exception(
            'Mailgun domain name is not set. '
            'Here is the email that failed sending: %s' % email_msg)

    # To send bulk emails we pass list of recipients in 'to' paarameter of
    # post data. Maximum limit of recipients per request is 1000.
    # For more detail check following link:
    # https://documentation.mailgun.com/docs/mailgun/user-manual/
    # sending-messages/#batch-sending.
    recipient_email_lists = [
        recipient_emails[i:i + 1000]
        for i in range(0, len(recipient_emails), 1000)]
    for email_list in recipient_email_lists:
        data = {
            'from': sender_email,
            'subject': subject,
            'text': plaintext_body,
            'html': html_body,
            'to': email_list[0] if len(email_list) == 1 else email_list
        }

        if bcc:
            data['bcc'] = bcc[0] if len(bcc) == 1 else bcc

        if reply_to:
            data['h:Reply-To'] = reply_to

        # 'recipient-variable' in post data forces mailgun to send individual
        # email to each recipient (This is intended to be a workaround for
        # sending individual emails).
        data['recipient_variables'] = recipient_variables or {}
        server = 'https://api.mailgun.net/v3/%s/messages' % (
            feconf.MAILGUN_DOMAIN_NAME
        )

       # Adding attachments to the email.
        files = [(
            'attachment',
            (attachment['filename'], open(attachment['path'], 'rb')))
            for attachment in attachments
        ] if attachments else []

        response = requests.post(
            server,
            auth=('api', mailgun_api_key),
            data=data,
            files=(files or None),
            timeout=TIMEOUT_SECS
        )

        for _, (_, file_obj) in files:
            file_obj.close()

        if response.status_code != 200:
            logging.error(
                'Failed to send email: %s - %s.'
                % (response.status_code, response.text))
            return False

    return True
