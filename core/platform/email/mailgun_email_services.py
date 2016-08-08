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

"""Provides mailgun api to send email."""
import requests

from core import counters
import feconf

MAILGUN_PUBLIC_DOMAIN_URL = "https://api.mailgun.net/v3/address/validate"
MAILGUN_PUBLIC_API_KEY = "pubkey-5ogiflzbnjrljiky49qxsiozqef5jxp7"
def is_email_valid(email):
    """ Check whether recipient and sender email address are valid or not.
    Mailgun uses public api key and public domain url to do this check. """
    response = (
        requests.get(
            MAILGUN_PUBLIC_DOMAIN_URL, auth=("api", MAILGUN_PUBLIC_API_KEY),
            params={"address": email}))
    return response.json()['is_valid']


def send_mail(
        sender_email, recipient_email, subject, plaintext_body,
        html_body, bcc_admin=False):
    """Sends an email using mailgun api.

    In general this function should only be called from
    email_manager._send_email().

    Args:
      - sender_email: str. the email address of the sender. This should be in
          the form 'SENDER_NAME <SENDER_EMAIL_ADDRESS>'.
      - recipient_email: str. the email address of the recipient.
      - subject: str. The subject line of the email.
      - plaintext_body: str. The plaintext body of the email.
      - html_body: str. The HTML body of the email. Must fit in a datastore
          entity.
      - bcc_admin: bool. Whether to bcc feconf.ADMIN_EMAIL_ADDRESS on the email.

    Raises:
      Exception: if the configuration in feconf.py forbids emails from being
        sent.
      ValueError: if 'sender_email' or 'recipient_email' is invalid, according
        to App Engine.
      Exception: if mailgun api key is not stored in feconf.MAILGUN_API_KEY.
      Exception: if mailgun domain name is not stored in
        feconf.MAILGUN_DOMAIN_NAME.
      (and possibly other exceptions, due to mail.send_mail() failures)
    """
    if not feconf.MAILGUN_API_KEY:
        raise Exception('Mailgun API key is not available.')

    if not feconf.MAILGUN_DOMAIN_NAME:
        raise Exception('Mailgun domain name is not set.')

    mailgun_domain_name = (
        'https://api.mailgun.net/v3/%s/messages' % feconf.MAILGUN_DOMAIN_NAME)

    if not feconf.CAN_SEND_EMAILS:
        raise Exception('This app cannot send emails to users.')

    if not is_email_valid(sender_email):
        raise ValueError('Malformed sender email address: %s' % sender_email)

    if not is_email_valid(recipient_email):
        raise ValueError(
            'Malformed recipient email address: %s' % recipient_email)

    data = {
        'from': sender_email,
        'to': recipient_email,
        'subject': subject,
        'text': plaintext_body,
        'html': html_body}

    if bcc_admin:
        data['bcc'] = feconf.ADMIN_EMAIL_ADDRESS

    requests.post(
        mailgun_domain_name, auth=('api', feconf.MAILGUN_API_KEY),
        data=data)

    counters.EMAILS_SENT.inc()
