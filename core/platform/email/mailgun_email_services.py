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

from core.platform.email import gae_email_services
import feconf

import requests


def send_mail(
        sender_email, recipient_email, subject, plaintext_body,
        html_body, bcc_admin=False, reply_to_id=None):
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
      - reply_to_id: str. The unique id of the sender.

    Raises:
      Exception: if the configuration in feconf.py forbids emails from being
        sent.
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

    data = {
        'from': sender_email,
        'to': recipient_email,
        'subject': subject,
        'text': plaintext_body,
        'html': html_body}

    if bcc_admin:
        data['bcc'] = feconf.ADMIN_EMAIL_ADDRESS

    if reply_to_id:
        reply_to = gae_email_services.get_incoming_email_address(reply_to_id)
        data['h:Reply-To'] = reply_to

    requests.post(
        mailgun_domain_name, auth=('api', feconf.MAILGUN_API_KEY),
        data=data)


def send_bulk_mail(
        sender_email, recipient_emails, subject, plaintext_body, html_body):
    """Sends an email using mailgun api.

    In general this function should only be called from
    email_manager._send_email().

    Args:
      - sender_email: str. the email address of the sender. This should be in
          the form 'SENDER_NAME <SENDER_EMAIL_ADDRESS>'.
      - recipient_emails: list. list of the email addresses of recipients.
      - subject: str. The subject line of the email.
      - plaintext_body: str. The plaintext body of the email.
      - html_body: str. The HTML body of the email. Must fit in a datastore
          entity.
      - reply_to_id: str or None. The unique reply-to id used in reply-to email
          sent to recipient.

    Raises:
      Exception: if the configuration in feconf.py forbids emails from being
        sent.
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

    # To send bulk emails we pass list of recipients in 'to' paarameter of
    # post data. Maximum limit of recipients per request is 1000.
    # For more detail check following link:
    # https://documentation.mailgun.com/user_manual.html#batch-sending
    recipient_email_sets = [
        recipient_emails[i:i + 1000]
        for i in xrange(0, len(recipient_emails), 1000)]

    for email_set in recipient_email_sets:
        # 'recipient-variable' in post data forces mailgun to send individual
        # email to each recipient (This is intended to be a workaround for
        # sending individual emails).
        data = {
            'from': sender_email,
            'to': email_set,
            'subject': subject,
            'text': plaintext_body,
            'html': html_body,
            'recipient-variables': '{}'}

        requests.post(
            mailgun_domain_name, auth=('api', feconf.MAILGUN_API_KEY),
            data=data)
