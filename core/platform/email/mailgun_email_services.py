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

import feconf

def send_mail(
        sender_email, recipient_email, subject, plaintext_body,
        html_body, bcc=None):
    if not feconf.MAILGUN_DOMAIN_NAME:
        raise Exception('Mailgun domain name is not set.')
    mailgun_domain_name = (
        'https://api.mailgun.net/v3/%s/messages' % feconf.MAILGUN_DOMAIN_NAME)

    return requests.post(
        mailgun_domain_name, auth=('api', feconf.MAILGUN_API_KEY),
        data={
            'from': sender_email,
            'to': recipient_email,
            'bcc': bcc,
            'subject': subject,
            'text': plaintext_body,
            'html': html_body})
