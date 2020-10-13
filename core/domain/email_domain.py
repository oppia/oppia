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

"""Domain objects for models relating to emails."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import python_utils


class FeedbackThreadReplyInfo(python_utils.OBJECT):
    """Domain object for email reply-to-id objects.

    Attributes:
        id: str. The id of the datastore instance.
        reply_to_id: str. The reply-to-id used in the reply-to field of the
            email.
    """

    def __init__(self, instance_id, reply_to_id):
        self.id = instance_id
        self.reply_to_id = reply_to_id

    @property
    def user_id(self):
        """Returns the user id corresponding to this FeedbackThreadReplyInfo
        instance.

        Returns:
            str. The user id.
        """
        return self.id.split('.')[0]

    @property
    def entity_type(self):
        """Returns the entity type extracted from the instance id.

        Returns:
            str. The entity type.
        """
        return self.id.split('.')[1]

    @property
    def entity_id(self):
        """Returns the entity id extracted from the instance id.

        Returns:
            str. The entity id.
        """
        return self.id.split('.')[2]

    @property
    def thread_id(self):
        """Returns the thread id extracted from the instance id.

        Returns:
            str. The thread id.
        """
        return '.'.join(
            [self.entity_type, self.entity_id, self.id.split('.')[3]])


class SendEmailInfo(python_utils.OBJECT):
    """The information needed to send an email. This domain object makes it
    easier to keep track of an individual email's information when sending
    multiple emails. This domain object is also used to store the email's
    information in a SentEmailModel, after the email has been sent.

    Attributes:
        recipient_id: str. The user ID of the email recipient.
        sender_id: str. The user ID of the sender.
        intent: str. The intent string for the email, i.e. the purpose/type.
            The intent options are defined using variables with the prefix
            'EMAIL_INTENT' in feconf.py.
        email_subject: str. The subject of the email.
        email_html_body: str. The body (message) of the email.
        sender_email: str. The sender's email address.
        recipient_email: str. The recipient's email address.
        bcc_admin: bool. Whether to send a copy of the email to the admin's
            email address.
        sender_name: str|None. The name to be shown in the "sender" field of
            the email. If the sender_name is None, it is updated to the value of
            EMAIL_SENDER_NAME in email_manager.py.
        reply_to_id: str or None. The unique reply-to id used in reply-to email
            address sent to recipients.
    """

    def __init__(
            self, recipient_id, sender_id, intent, email_subject,
            email_html_body, sender_email, recipient_email, sender_name=None,
            bcc_admin=False, reply_to_id=None):
        self.recipient_id = recipient_id
        self.sender_id = sender_id
        self.intent = intent
        self.email_subject = email_subject
        self.email_html_body = email_html_body
        self.sender_email = sender_email
        self.recipient_email = recipient_email
        self.sender_name = sender_name
        self.bcc_admin = bcc_admin
        self.reply_to_id = reply_to_id
