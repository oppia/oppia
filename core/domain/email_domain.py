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

"""Domain objects relating to emails."""

from __future__ import annotations

import datetime

from core import utils

from typing import List


class BulkEmail:
    """Domain object for a bulk email record."""

    def __init__(
            self,
            instance_id,
            sender_id,
            sender_email,
            recipient_ids,
            intent,
            subject,
            html_body,
            sent_datetime):
        """Initializes a BulkEmail domain object.

        Args:
            instance_id: str. The unique ID of this bulk email record.
            sender_id: str. The user ID of the sender.
            sender_email: str. The email address of the sender.
            recipient_ids: list(str). List of user IDs of all recipients.
            intent: str. The purpose of the email.
            subject: str. The subject line of the email.
            html_body: str. The HTML body of the email.
            sent_datetime: datetime.datetime. When the email was sent.
        """
        self.id = instance_id
        self.sender_id = sender_id
        self.sender_email = sender_email
        self.recipient_ids = recipient_ids
        self.intent = intent
        self.subject = subject
        self.html_body = html_body
        self.sent_datetime = sent_datetime

    def validate(self):
        """Validates the BulkEmail domain object.

        Raises:
            utils.ValidationError. The sender_id is not a non-empty string.
            utils.ValidationError. The sender_email is not a non-empty string.
            utils.ValidationError. The recipient_ids is not a list.
            utils.ValidationError. The intent is not a non-empty string.
            utils.ValidationError. The subject is not a non-empty string.
            utils.ValidationError. The html_body is not a string.
        """
        if not isinstance(self.sender_id, str) or not self.sender_id:
            raise utils.ValidationError(
                'Expected sender_id to be a non-empty string, received: %s'
                % self.sender_id)
        if not isinstance(self.sender_email, str) or not self.sender_email:
            raise utils.ValidationError(
                'Expected sender_email to be a non-empty string, received: %s'
                % self.sender_email)
        if not isinstance(self.recipient_ids, list):
            raise utils.ValidationError(
                'Expected recipient_ids to be a list, received: %s'
                % self.recipient_ids)
        if not isinstance(self.intent, str) or not self.intent:
            raise utils.ValidationError(
                'Expected intent to be a non-empty string, received: %s'
                % self.intent)
        if not isinstance(self.subject, str) or not self.subject:
            raise utils.ValidationError(
                'Expected subject to be a non-empty string, received: %s'
                % self.subject)
        if not isinstance(self.html_body, str):
            raise utils.ValidationError(
                'Expected html_body to be a string, received: %s'
                % self.html_body)