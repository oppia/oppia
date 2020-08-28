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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import base64

import feconf
import python_utils


def send_email_to_recipients(
        sender_email, recipient_emails, subject,
        plaintext_body, html_body, bcc=None, reply_to=None,
        recipient_variables=None):
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
                subject = 'Hey, %recipient.first%’
            More info about this format at:
            https://documentation.mailgun.com/en/
                latest/user_manual.html#batch-sending.

    Raises:
        Exception. The mailgun api key is not stored in
            feconf.MAILGUN_API_KEY.
        Exception. The mailgun domain name is not stored in
            feconf.MAILGUN_DOMAIN_NAME.

    Returns:
        bool. Whether the emails are sent successfully.
    """
    if not feconf.MAILGUN_API_KEY:
        raise Exception('Mailgun API key is not available.')

    if not feconf.MAILGUN_DOMAIN_NAME:
        raise Exception('Mailgun domain name is not set.')

    # To send bulk emails we pass list of recipients in 'to' paarameter of
    # post data. Maximum limit of recipients per request is 1000.
    # For more detail check following link:
    # https://documentation.mailgun.com/user_manual.html#batch-sending
    recipient_email_lists = [
        recipient_emails[i:i + 1000]
        for i in python_utils.RANGE(0, len(recipient_emails), 1000)]
    for email_list in recipient_email_lists:
        data = {
            'from': sender_email,
            'subject': subject,
            'text': plaintext_body,
            'html': html_body
        }

        data['to'] = email_list[0] if len(email_list) == 1 else email_list

        if bcc:
            data['bcc'] = bcc[0] if len(bcc) == 1 else bcc

        if reply_to:
            data['h:Reply-To'] = reply_to

        # 'recipient-variable' in post data forces mailgun to send individual
        # email to each recipient (This is intended to be a workaround for
        # sending individual emails).
        data['recipient_variables'] = recipient_variables or {}

        encoded = base64.b64encode(b'api:%s' % feconf.MAILGUN_API_KEY).strip()
        auth_str = 'Basic %s' % encoded
        header = {'Authorization': auth_str}
        server = (
            ('https://api.mailgun.net/v3/%s/messages')
            % feconf.MAILGUN_DOMAIN_NAME)
        encoded_url = python_utils.url_encode(data)
        req = python_utils.url_request(server, encoded_url, header)
        resp = python_utils.url_open(req)
        # The function url_open returns a file_like object that can be queried
        # for the status code of the url query. If it is not 200, the mail query
        # failed so we return False (this function did not complete
        # successfully).
        if resp.getcode() != 200:
            return False
    return True
