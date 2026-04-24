# coding: utf-8
#
# Copyright 2024 The Oppia Authors. All Rights Reserved.
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

"""Domain objects for emails."""

from __future__ import annotations

import datetime
import re

from core import feconf, schema_utils, utils
from core.domain import html_cleaner  # pylint: disable=invalid-import-from

from typing import Optional, TypedDict


class SentEmailDict(TypedDict):
    """Dictionary representing the SentEmail domain object."""

    recipient_id: str
    recipient_email: str
    sender_id: str
    sender_email: str
    intent: str
    subject: str
    html_body: str
    sent_datetime: datetime.datetime
    email_hash: Optional[str]


class SentEmail:
    """Domain object for a sent email.

    Attributes:
        recipient_id: str. The user ID of the email recipient.
        recipient_email: str. The email address of the recipient.
        sender_id: str. The user ID of the email sender. For
            site-generated emails this is equal to SYSTEM_COMMITTER_ID.
        sender_email: str. The email address used to send the
            notification. This should be either the noreply address or
            the system address.
        intent: str. The intent of the email.
        subject: str. The subject line of the email.
        html_body: str. The HTML content of the email body.
        sent_datetime: datetime.datetime. The datetime the email was
            sent, in UTC.
        email_hash: str|None. The hash of the recipient id, email
            subject and message body.
    """

    def __init__(
        self,
        recipient_id: str,
        recipient_email: str,
        sender_id: str,
        sender_email: str,
        intent: str,
        subject: str,
        html_body: str,
        sent_datetime: datetime.datetime,
        email_hash: Optional[str] = None,
    ) -> None:
        """Constructs a SentEmail domain object.

        Args:
            recipient_id: str. The user ID of the email recipient.
            recipient_email: str. The email address of the recipient.
            sender_id: str. The user ID of the email sender.
            sender_email: str. The email address used to send the
                notification.
            intent: str. The intent of the email.
            subject: str. The subject line of the email.
            html_body: str. The HTML content of the email body.
            sent_datetime: datetime.datetime. The datetime the email
                was sent, in UTC.
            email_hash: str|None. The hash of the recipient id, email
                subject and message body.
        """
        self.recipient_id = recipient_id
        self.recipient_email = recipient_email
        self.sender_id = sender_id
        self.sender_email = sender_email
        self.intent = intent
        self.subject = subject
        self.html_body = html_body
        self.sent_datetime = sent_datetime
        self.email_hash = email_hash

    def validate(self) -> None:
        """Validates the SentEmail domain object before it is saved.

        Raises:
            utils.ValidationError. The recipient_id is not a valid
                user ID.
            utils.ValidationError. The recipient_email is not a valid
                email address.
            utils.ValidationError. The sender_id is not a valid user
                ID.
            utils.ValidationError. The sender_email is not a valid
                email address.
            utils.ValidationError. The intent is not a valid intent
                string.
            utils.ValidationError. The subject is not a non-empty
                string.
            utils.ValidationError. The html_body is not valid HTML.
            utils.ValidationError. The sent_datetime is not a valid
                datetime object.
            utils.ValidationError. The sent_datetime is in the future.
            utils.ValidationError. The email_hash is not a non-empty
                string.
        """
        # Validate recipient_id.
        if not isinstance(self.recipient_id, str):
            raise utils.ValidationError(
                'Expected recipient_id to be a string, received %s'
                % self.recipient_id
            )
        if not re.match(feconf.USER_ID_REGEX, self.recipient_id):
            raise utils.ValidationError(
                'Expected recipient_id to match the user ID format, '
                'received %s' % self.recipient_id
            )

        # Validate recipient_email.
        if not isinstance(self.recipient_email, str) or (
                not self.recipient_email):
            raise utils.ValidationError(
                'Expected recipient_email to be a non-empty string, '
                'received %s' % self.recipient_email
            )
        if not re.match(schema_utils.EMAIL_REGEX, self.recipient_email):
            raise utils.ValidationError(
                'Expected recipient_email to be a valid email address, '
                'received %s' % self.recipient_email
            )

        # Validate sender_id.
        if not isinstance(self.sender_id, str):
            raise utils.ValidationError(
                'Expected sender_id to be a string, received %s'
                % self.sender_id
            )
        if (
            self.sender_id != feconf.SYSTEM_COMMITTER_ID
            and not re.match(feconf.USER_ID_REGEX, self.sender_id)
        ):
            raise utils.ValidationError(
                'Expected sender_id to match the user ID format or be '
                'the system committer ID, received %s' % self.sender_id
            )

        # Validate sender_email.
        if not isinstance(self.sender_email, str) or not self.sender_email:
            raise utils.ValidationError(
                'Expected sender_email to be a non-empty string, '
                'received %s' % self.sender_email
            )
        if not re.match(schema_utils.EMAIL_REGEX, self.sender_email):
            raise utils.ValidationError(
                'Expected sender_email to be a valid email address, '
                'received %s' % self.sender_email
            )
        if self.sender_email not in (
            feconf.SYSTEM_EMAIL_ADDRESS,
            feconf.NOREPLY_EMAIL_ADDRESS,
        ):
            raise utils.ValidationError(
                'Expected sender_email to be either the system email '
                'address or the noreply email address, received %s'
                % self.sender_email
            )

        # Validate intent.
        if not isinstance(self.intent, str) or not self.intent:
            raise utils.ValidationError(
                'Expected intent to be a non-empty string, received %s'
                % self.intent
            )
        allowed_intents = [
            feconf.EMAIL_INTENT_SIGNUP,
            feconf.EMAIL_INTENT_MARKETING,
            feconf.EMAIL_INTENT_DAILY_BATCH,
            feconf.EMAIL_INTENT_EDITOR_ROLE_NOTIFICATION,
            feconf.EMAIL_INTENT_FEEDBACK_MESSAGE_NOTIFICATION,
            feconf.EMAIL_INTENT_SUBSCRIPTION_NOTIFICATION,
            feconf.EMAIL_INTENT_SUGGESTION_NOTIFICATION,
            feconf.EMAIL_INTENT_UNPUBLISH_EXPLORATION,
            feconf.EMAIL_INTENT_DELETE_EXPLORATION,
            feconf.EMAIL_INTENT_REPORT_BAD_CONTENT,
            feconf.EMAIL_INTENT_QUERY_STATUS_NOTIFICATION,
            feconf.EMAIL_INTENT_ONBOARD_CD_USER,
            feconf.EMAIL_INTENT_REMOVE_CD_USER,
            feconf.EMAIL_INTENT_ADDRESS_CONTRIBUTOR_DASHBOARD_SUGGESTIONS,
            feconf.EMAIL_INTENT_REVIEW_CREATOR_DASHBOARD_SUGGESTIONS,
            feconf.EMAIL_INTENT_REVIEW_CONTRIBUTOR_DASHBOARD_SUGGESTIONS,
            feconf.EMAIL_INTENT_ADD_CONTRIBUTOR_DASHBOARD_REVIEWERS,
            feconf.EMAIL_INTENT_ACCOUNT_DELETED,
            feconf.BULK_EMAIL_INTENT_TEST,
            feconf.EMAIL_INTENT_VOICEOVER_REGENERATION,
            feconf.EMAIL_INTENT_NOTIFY_CONTRIBUTOR_DASHBOARD_ACHIEVEMENTS,
        ]
        if self.intent not in allowed_intents:
            raise utils.ValidationError(
                'Expected intent to be a valid email intent, '
                'received %s' % self.intent
            )

        # Validate subject.
        if not isinstance(self.subject, str) or not self.subject:
            raise utils.ValidationError(
                'Expected subject to be a non-empty string, received %s'
                % self.subject
            )

        # Validate html_body.
        if not isinstance(self.html_body, str) or not self.html_body:
            raise utils.ValidationError(
                'Expected html_body to be a non-empty string, received %s'
                % self.html_body
            )
        cleaned_html_body = html_cleaner.clean(self.html_body)
        if cleaned_html_body != self.html_body:
            raise utils.ValidationError(
                'Expected html_body to be valid HTML, received %s'
                % self.html_body
            )

        # Validate sent_datetime.
        if not isinstance(self.sent_datetime, datetime.datetime):
            raise utils.ValidationError(
                'Expected sent_datetime to be a datetime object, '
                'received %s' % self.sent_datetime
            )
        if self.sent_datetime > datetime.datetime.utcnow():
            raise utils.ValidationError(
                'Expected sent_datetime to not be in the future, '
                'received %s' % self.sent_datetime
            )

        # Validate email_hash.
        if self.email_hash is not None:
            if not isinstance(self.email_hash, str) or not self.email_hash:
                raise utils.ValidationError(
                    'Expected email_hash to be a non-empty string, '
                    'received %s' % self.email_hash
                )

    def to_dict(self) -> SentEmailDict:
        """Returns a dictionary representation of this domain object.

        Returns:
            dict. A dict representing this SentEmail object.
        """
        return {
            'recipient_id': self.recipient_id,
            'recipient_email': self.recipient_email,
            'sender_id': self.sender_id,
            'sender_email': self.sender_email,
            'intent': self.intent,
            'subject': self.subject,
            'html_body': self.html_body,
            'sent_datetime': self.sent_datetime,
            'email_hash': self.email_hash,
        }
    