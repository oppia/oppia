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

__author__ = 'Sean Lip'


from core import counters
import feconf

from google.appengine.api import app_identity
from google.appengine.api import mail


def send_mail_to_admin(sender, subject, body):
    """Enqueues a 'send email' request with the GAE mail service.

    Args:
      - sender: str. the email address of the sender, usually in the form
          'SENDER NAME <EMAIL@ADDRESS.com>.
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

        mail.send_mail(sender, feconf.ADMIN_EMAIL_ADDRESS, subject, body)
        counters.EMAILS_SENT.inc()
