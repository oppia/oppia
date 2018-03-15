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
        feconf.EMAIL_INTENT_SUBSCRIPTION_NOTIFICATION,
        feconf.EMAIL_INTENT_SUGGESTION_NOTIFICATION,
        feconf.EMAIL_INTENT_UNPUBLISH_EXPLORATION,
        feconf.EMAIL_INTENT_DELETE_EXPLORATION,
        feconf.EMAIL_INTENT_REPORT_BAD_CONTENT,
        feconf.EMAIL_INTENT_QUERY_STATUS_NOTIFICATION,
        feconf.BULK_EMAIL_INTENT_TEST
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
        """Generates an ID for a new SentEmailModel instance.

        Args:
            intent: str. The intent string, i.e. the purpose of the email.
                Valid intent strings are defined in feconf.py.

        Returns:
            str. The newly-generated ID for the SentEmailModel instance.

        Raises:
            Exception: The id generator for SentEmailModel is producing
                too many collisions.
        """
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
        """Creates a new SentEmailModel entry.

        Args:
            recipient_id: str. The user ID of the email recipient.
            recipient_email: str. The email address of the recipient.
            sender_id: str. The user ID of the email sender.
            sender_email: str. The email address used to send the notification.
            intent: str. The intent string, i.e. the purpose of the email.
            subject: str. The subject line of the email.
            html_body: str. The HTML content of the email body.
            sent_datetime: datetime.datetime. The datetime the email was sent,
                in UTC.
        """
        instance_id = cls._generate_id(intent)
        email_model_instance = cls(
            id=instance_id, recipient_id=recipient_id,
            recipient_email=recipient_email, sender_id=sender_id,
            sender_email=sender_email, intent=intent, subject=subject,
            html_body=html_body, sent_datetime=sent_datetime)

        email_model_instance.put()

    def put(self):
        """Saves this SentEmailModel instance to the datastore."""
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

        Args:
            email_hash: str. The hash value of the email.
            sent_datetime_lower_bound: datetime.datetime. The lower bound on
                sent_datetime of the email to be searched.

        Returns:
            list(SentEmailModel). A list of emails which have the given hash
                value and sent more recently than sent_datetime_lower_bound.

        Raises:
            Exception: sent_datetime_lower_bound is not a valid
                datetime.datetime.
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

        Args:
            recipient_id: str. The user ID of the email recipient.
            email_subject: str. The subject line of the email.
            email_body: str. The HTML content of the email body.

        Returns:
            str. The generated hash value of the given email.
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

         Args:
            recipient_id: str. The user ID of the email recipient.
            email_subject: str. The subject line of the email.
            email_body: str. The HTML content of the email body.

        Returns:
            bool. Whether a similar message has been sent to the same recipient
                in the last DUPLICATE_EMAIL_INTERVAL_MINS.
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


class BulkEmailModel(base_models.BaseModel):
    """Records the content of an email sent from Oppia to multiple users.

    This model is read-only; entries cannot be modified once created. The
    id/key of instances of this model is randomly generated string of
    length 12.
    """

    # The user IDs of the email recipients.
    recipient_ids = ndb.JsonProperty(default=[], compressed=True)
    # The user ID of the email sender. For site-generated emails this is equal
    # to feconf.SYSTEM_COMMITTER_ID.
    sender_id = ndb.StringProperty(required=True)
    # The email address used to send the notification.
    sender_email = ndb.StringProperty(required=True)
    # The intent of the email.
    intent = ndb.StringProperty(required=True, indexed=True, choices=[
        feconf.BULK_EMAIL_INTENT_MARKETING,
        feconf.BULK_EMAIL_INTENT_IMPROVE_EXPLORATION,
        feconf.BULK_EMAIL_INTENT_CREATE_EXPLORATION,
        feconf.BULK_EMAIL_INTENT_CREATOR_REENGAGEMENT,
        feconf.BULK_EMAIL_INTENT_LEARNER_REENGAGEMENT
    ])
    # The subject line of the email.
    subject = ndb.TextProperty(required=True)
    # The HTML content of the email body.
    html_body = ndb.TextProperty(required=True)
    # The datetime the email was sent, in UTC.
    sent_datetime = ndb.DateTimeProperty(required=True, indexed=True)

    @classmethod
    def create(
            cls, instance_id, recipient_ids, sender_id, sender_email,
            intent, subject, html_body, sent_datetime):
        """Creates a new BulkEmailModel entry.

        Args:
            instance_id: str. The ID of the instance.
            recipient_ids: list(str). The user IDs of the email recipients.
            sender_id: str. The user ID of the email sender.
            sender_email: str. The email address used to send the notification.
            intent: str. The intent string, i.e. the purpose of the email.
            subject: str. The subject line of the email.
            html_body: str. The HTML content of the email body.
            sent_datetime: datetime.datetime. The date and time the email
                was sent, in UTC.
        """
        email_model_instance = cls(
            id=instance_id, recipient_ids=recipient_ids, sender_id=sender_id,
            sender_email=sender_email, intent=intent, subject=subject,
            html_body=html_body, sent_datetime=sent_datetime)
        email_model_instance.put()


REPLY_TO_ID_LENGTH = 84


class FeedbackEmailReplyToIdModel(base_models.BaseModel):
    """This model stores unique_id for each <user, exploration, thread>
    combination.

    This unique_id is used in reply-to email address in outgoing feedback and
    suggestion emails. The id/key of instances of this model has form of
    [USER_ID].[EXPLORATION_ID].[THREAD_ID]
    """
    # The reply-to ID that is used in the reply-to email address.
    reply_to_id = ndb.StringProperty(indexed=True, required=True)

    @classmethod
    def _generate_id(cls, user_id, exploration_id, thread_id):
        return '.'.join([user_id, exploration_id, thread_id])

    @classmethod
    def _generate_unique_reply_to_id(cls):
        for _ in range(base_models.MAX_RETRIES):
            new_id = utils.convert_to_hash(
                '%s' % (utils.get_random_int(base_models.RAND_RANGE)),
                REPLY_TO_ID_LENGTH)
            if not cls.get_by_reply_to_id(new_id):
                return new_id

        raise Exception('Unique id generator is producing too many collisions.')

    @classmethod
    def create(cls, user_id, exploration_id, thread_id):
        """Creates a new FeedbackEmailUniqueIDModel entry.

        Args:
            user_id: str. ID of the corresponding user.
            exploration_id: str. ID of the corresponding exploration.
            thread_id: str. ID of the corresponding thread.

        Returns:
            str. A unique ID that can be used in 'reply-to' email address.

        Raises:
            Exception: Model instance for given user_id, exploration_id and
                thread_id already exists.
        """

        instance_id = cls._generate_id(user_id, exploration_id, thread_id)
        if cls.get_by_id(instance_id):
            raise Exception('Unique reply-to ID for given user, exploration and'
                            ' thread already exists.')

        reply_to_id = cls._generate_unique_reply_to_id()
        return cls(id=instance_id, reply_to_id=reply_to_id)

    @classmethod
    def get_by_reply_to_id(cls, reply_to_id):
        model = cls.query(cls.reply_to_id == reply_to_id).fetch()
        if not model:
            return None
        return model[0]

    @classmethod
    def get(cls, user_id, exploration_id, thread_id, strict=True):
        instance_id = cls._generate_id(user_id, exploration_id, thread_id)
        return super(
            FeedbackEmailReplyToIdModel, cls).get(instance_id, strict=strict)

    @classmethod
    def get_multi_by_user_ids(cls, user_ids, exploration_id, thread_id):
        instance_ids = [cls._generate_id(user_id, exploration_id, thread_id)
                        for user_id in user_ids]
        user_models = cls.get_multi(instance_ids)
        return {
            user_id: model for user_id, model in zip(user_ids, user_models)}

    @property
    def user_id(self):
        return self.id.split('.')[0]

    @property
    def exploration_id(self):
        return self.id.split('.')[1]

    @property
    def thread_id(self):
        return self.id.split('.')[2]
