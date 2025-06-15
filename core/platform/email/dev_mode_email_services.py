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

"""Provides email services api to log emails in DEV_MODE."""

from __future__ import annotations

import logging

from core.domain import email_services

from typing import Dict, List, Optional, Union


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
    """Prints information about sent emails to the terminal console, in order
    to model sending an email in development mode.

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
                subject = 'Hey, %recipient.first%’
            More info about this format at:
            https://documentation.mailgun.com/en/
                latest/user_manual.html#batch-sending
        attachments: list(dict)|None. Optional argument. A list of
            dictionaries, where each dictionary includes the keys `filename`
            and `path` with their corresponding values.

    Returns:
        bool. Whether the emails are "sent" successfully.
    """
    logging.info(
        email_services.convert_email_to_loggable_string(
            sender_email, recipient_emails, subject, plaintext_body, html_body,
            bcc, reply_to, recipient_variables, attachments
        )
    )
    logging.info(
        'You are not currently sending out real emails since this is a'
        ' dev environment. Emails are sent out in the production'
        ' environment.')
    # Returns True signifying that the "send_email_to_recipients" action was
    # successful.
    return True
