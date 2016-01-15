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

from core import counters
import feconf

from google.appengine.api import app_identity
from google.appengine.api import mail


def send_mail_to_admin(subject, body):
    """Enqueues a 'send email' request with the GAE mail service.

    Args:
      - subject: str. The subject line of the email.
      - body: str. The plaintext body of the email.
    """
    if feconf.CAN_SEND_EMAILS_TO_ADMIN:
        if not mail.is_email_valid(feconf.ADMIN_EMAIL_ADDRESS):
            raise Exception(
                'Malformed email address: %s' %
                feconf.ADMIN_EMAIL_ADDRESS)

        app_id = app_identity.get_application_id()
        body = '(Sent from %s)\n\n%s' % (app_id, body)

        mail.send_mail(
            feconf.SYSTEM_EMAIL_ADDRESS, feconf.ADMIN_EMAIL_ADDRESS, subject,
            body)
        counters.EMAILS_SENT.inc()


def send_mail(
        sender_email, recipient_email, subject, plaintext_body, html_body,
        bcc_admin=False):
    """Sends an email. The client is responsible for recording any audit logs.

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
      (and possibly other exceptions, due to mail.send_mail() failures)
    """
    if not feconf.CAN_SEND_EMAILS_TO_USERS:
        raise Exception('This app cannot send emails to users.')

    if not mail.is_email_valid(sender_email):
        raise ValueError(
            'Malformed sender email address: %s' % sender_email)
    if not mail.is_email_valid(recipient_email):
        raise ValueError(
            'Malformed recipient email address: %s' % recipient_email)

    if bcc_admin:
        mail.send_mail(
            sender_email, recipient_email, subject, plaintext_body,
            html=html_body, bcc=[feconf.ADMIN_EMAIL_ADDRESS])
    else:
        mail.send_mail(
            sender_email, recipient_email, subject, plaintext_body,
            html=html_body)

    counters.EMAILS_SENT.inc()
