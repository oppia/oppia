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

"""Models for the content of sent emails."""

import datetime

from core.platform import models
import feconf
import utils

from google.appengine.ext import ndb

(base_models,) = models.Registry.import_models([models.NAMES.base_model])


class SentEmailModel(base_models.BaseModel):
    """Records the content and metadata of an email sent from Oppia.

    This model is read-only; entries cannot be modified once created. The
    id/key of instances of this class has the form
        [INTENT].[random hash].
    """
    # TODO(sll): Implement functionality to get all emails sent to a particular
    # user with a given intent within a given time period.

    # The user ID of the email recipient.
    recipient_id = ndb.StringProperty(required=True, indexed=True)
    # The email address of the recipient.
    recipient_email = ndb.StringProperty(required=True)
    # The user ID of the email sender. For site-generated emails this is equal
    # to feconf.SYSTEM_COMMITTER_ID.
    sender_id = ndb.StringProperty(required=True)
    # The email address used to send the notification.
    sender_email = ndb.StringProperty(required=True)
    # The intent of the email.
    intent = ndb.StringProperty(required=True, indexed=True, choices=[
        feconf.EMAIL_INTENT_SIGNUP,
        feconf.EMAIL_INTENT_MARKETING,
        feconf.EMAIL_INTENT_DAILY_BATCH,
        feconf.EMAIL_INTENT_EDITOR_ROLE_NOTIFICATION,
        feconf.EMAIL_INTENT_FEEDBACK_MESSAGE_NOTIFICATION,
        feconf.EMAIL_INTENT_SUGGESTION_NOTIFICATION,
        feconf.EMAIL_INTENT_PUBLICIZE_EXPLORATION,
        feconf.EMAIL_INTENT_UNPUBLISH_EXPLORATION,
        feconf.EMAIL_INTENT_DELETE_EXPLORATION,
    ])
    # The subject line of the email.
    subject = ndb.TextProperty(required=True)
    # The HTML content of the email body.
    html_body = ndb.TextProperty(required=True)
    # The datetime the email was sent, in UTC.
    sent_datetime = ndb.DateTimeProperty(required=True, indexed=True)
    # The hash of the recipient id, email subject and message body.
    email_hash = ndb.StringProperty(indexed=True)

    @classmethod
    def _generate_id(cls, intent):
        id_prefix = '%s.' % intent

        for _ in range(base_models.MAX_RETRIES):
            new_id = '%s.%s' % (
                id_prefix,
                utils.convert_to_hash(
                    str(utils.get_random_int(base_models.RAND_RANGE)),
                    base_models.ID_LENGTH))
            if not cls.get_by_id(new_id):
                return new_id

        raise Exception(
            'The id generator for SentEmailModel is producing too many '
            'collisions.')

    @classmethod
    def create(
            cls, recipient_id, recipient_email, sender_id, sender_email,
            intent, subject, html_body, sent_datetime):
        """Creates a new SentEmailModel entry."""
        instance_id = cls._generate_id(intent)
        email_model_instance = cls(
            id=instance_id, recipient_id=recipient_id,
            recipient_email=recipient_email, sender_id=sender_id,
            sender_email=sender_email, intent=intent, subject=subject,
            html_body=html_body, sent_datetime=sent_datetime)

        email_model_instance.put()

    def put(self):
        email_hash = self._generate_hash(
            self.recipient_id, self.subject, self.html_body)
        self.email_hash = email_hash
        super(SentEmailModel, self).put()

    @classmethod
    def get_by_hash(cls, email_hash, sent_datetime_lower_bound=None):
        """Returns all messages with a given email_hash.

        This also takes an optional sent_datetime_lower_bound argument,
        which is a datetime instance. If this is given, only
        SentEmailModel instances sent after sent_datetime_lower_bound
        should be returned.
        """

        if sent_datetime_lower_bound is not None:
            if not isinstance(sent_datetime_lower_bound, datetime.datetime):
                raise Exception(
                    'Expected datetime, received %s of type %s' %
                    (sent_datetime_lower_bound,
                     type(sent_datetime_lower_bound)))

        query = cls.query().filter(cls.email_hash == email_hash)

        if sent_datetime_lower_bound is not None:
            query = query.filter(cls.sent_datetime > sent_datetime_lower_bound)

        messages = query.fetch()

        return messages

    @classmethod
    def _generate_hash(cls, recipient_id, email_subject, email_body):
        """Generate hash for a given recipient_id, email_subject and cleaned
        email_body.
        """
        hash_value = utils.convert_to_hash(
            recipient_id + email_subject + email_body,
            100)

        return hash_value

    @classmethod
    def check_duplicate_message(cls, recipient_id, email_subject, email_body):
        """Check for a given recipient_id, email_subject and cleaned
        email_body, whether a similar message has been sent in the last
        DUPLICATE_EMAIL_INTERVAL_MINS.
        """

        email_hash = cls._generate_hash(
            recipient_id, email_subject, email_body)

        datetime_now = datetime.datetime.utcnow()
        time_interval = datetime.timedelta(
            minutes=feconf.DUPLICATE_EMAIL_INTERVAL_MINS)

        sent_datetime_lower_bound = datetime_now - time_interval

        messages = cls.get_by_hash(
            email_hash, sent_datetime_lower_bound=sent_datetime_lower_bound)

        for message in messages:
            if (message.recipient_id == recipient_id and
                    message.subject == email_subject and
                    message.html_body == email_body):
                return True

        return False
