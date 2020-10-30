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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime

from core.platform import models
import feconf
import python_utils
import utils

(base_models, user_models) = models.Registry.import_models(
    [models.NAMES.base_model, models.NAMES.user])

datastore_services = models.Registry.import_datastore_services()


class SentEmailModel(base_models.BaseModel):
    """Records the content and metadata of an email sent from Oppia.

    This model is read-only; entries cannot be modified once created. The
    id/key of instances of this class has the form '[intent].[random hash]'.
    """

    # TODO(sll): Implement functionality to get all emails sent to a particular
    # user with a given intent within a given time period.

    # The user ID of the email recipient.
    recipient_id = (
        datastore_services.StringProperty(required=True, indexed=True))
    # The email address of the recipient.
    recipient_email = datastore_services.StringProperty(required=True)
    # The user ID of the email sender. For site-generated emails this is equal
    # to SYSTEM_COMMITTER_ID.
    sender_id = datastore_services.StringProperty(required=True, indexed=True)
    # The email address used to send the notification. This should be either
    # the noreply address or the system address.
    sender_email = datastore_services.StringProperty(required=True)
    # The intent of the email.
    intent = datastore_services.StringProperty(
        required=True, indexed=True, choices=[
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
            feconf.EMAIL_INTENT_ONBOARD_REVIEWER,
            feconf.EMAIL_INTENT_REMOVE_REVIEWER,
            feconf.EMAIL_INTENT_ADDRESS_CONTRIBUTOR_DASHBOARD_SUGGESTIONS,
            feconf.EMAIL_INTENT_REVIEW_CREATOR_DASHBOARD_SUGGESTIONS,
            feconf.EMAIL_INTENT_REVIEW_CONTRIBUTOR_DASHBOARD_SUGGESTIONS,
            feconf.EMAIL_INTENT_ADD_CONTRIBUTOR_DASHBOARD_REVIEWERS,
            feconf.EMAIL_INTENT_VOICEOVER_APPLICATION_UPDATES,
            feconf.EMAIL_INTENT_ACCOUNT_DELETED,
            feconf.BULK_EMAIL_INTENT_TEST
        ])
    # The subject line of the email.
    subject = datastore_services.TextProperty(required=True)
    # The HTML content of the email body.
    html_body = datastore_services.TextProperty(required=True)
    # The datetime the email was sent, in UTC.
    sent_datetime = (
        datastore_services.DateTimeProperty(required=True, indexed=True))
    # The hash of the recipient id, email subject and message body.
    email_hash = datastore_services.StringProperty(indexed=True)

    @staticmethod
    def get_deletion_policy():
        """Sent email should be kept for audit purposes."""
        return base_models.DELETION_POLICY.KEEP

    @classmethod
    def get_export_policy(cls):
        """Users already have access to this data since emails were sent
        to them.
        """
        return dict(super(cls, cls).get_export_policy(), **{
            'recipient_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'recipient_email': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'sender_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'sender_email': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'intent': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'subject': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'html_body': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'sent_datetime': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'email_hash': base_models.EXPORT_POLICY.NOT_APPLICABLE
        })

    @classmethod
    def has_reference_to_user_id(cls, user_id):
        """Check whether SentEmailModel exists for user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether any models refer to the given user ID.
        """
        return cls.query(datastore_services.any_of(
            cls.recipient_id == user_id,
            cls.sender_id == user_id,
        )).get(keys_only=True) is not None

    @classmethod
    def _generate_id(cls, intent):
        """Generates an ID for a new SentEmailModel instance.

        Args:
            intent: str. The intent string, i.e. the purpose of the email.
                Valid intent strings are defined in feconf.py.

        Returns:
            str. The newly-generated ID for the SentEmailModel instance.

        Raises:
            Exception. The id generator for SentEmailModel is producing
                too many collisions.
        """
        id_prefix = '%s.' % intent

        for _ in python_utils.RANGE(base_models.MAX_RETRIES):
            new_id = '%s.%s' % (
                id_prefix,
                utils.convert_to_hash(
                    python_utils.UNICODE(utils.get_random_int(
                        base_models.RAND_RANGE)),
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

        email_model_instance.update_timestamps()
        email_model_instance.put()

    def _pre_put_hook(self):
        """Operations to perform just before the model is `put` into storage."""
        super(SentEmailModel, self)._pre_put_hook()
        self.email_hash = self._generate_hash(
            self.recipient_id, self.subject, self.html_body)

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
            Exception. The sent_datetime_lower_bound is not a valid
                datetime.datetime.
        """

        if sent_datetime_lower_bound is not None:
            if not isinstance(sent_datetime_lower_bound, datetime.datetime):
                raise Exception(
                    'Expected datetime, received %s of type %s' %
                    (
                        sent_datetime_lower_bound,
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
    recipient_ids = datastore_services.JsonProperty(default=[], compressed=True)
    # The user ID of the email sender. For site-generated emails this is equal
    # to SYSTEM_COMMITTER_ID.
    sender_id = datastore_services.StringProperty(required=True, indexed=True)
    # The email address used to send the notification.
    sender_email = datastore_services.StringProperty(required=True)
    # The intent of the email.
    intent = datastore_services.StringProperty(
        required=True, indexed=True, choices=[
            feconf.BULK_EMAIL_INTENT_MARKETING,
            feconf.BULK_EMAIL_INTENT_IMPROVE_EXPLORATION,
            feconf.BULK_EMAIL_INTENT_CREATE_EXPLORATION,
            feconf.BULK_EMAIL_INTENT_CREATOR_REENGAGEMENT,
            feconf.BULK_EMAIL_INTENT_LEARNER_REENGAGEMENT
        ])
    # The subject line of the email.
    subject = datastore_services.TextProperty(required=True)
    # The HTML content of the email body.
    html_body = datastore_services.TextProperty(required=True)
    # The datetime the email was sent, in UTC.
    sent_datetime = (
        datastore_services.DateTimeProperty(required=True, indexed=True))

    @staticmethod
    def get_deletion_policy():
        """Sent email should be kept for audit purposes."""
        return base_models.DELETION_POLICY.KEEP

    @classmethod
    def get_export_policy(cls):
        """Users already have access to this data since the emails were sent
        to them.
        """
        return dict(super(cls, cls).get_export_policy(), **{
            'recipient_ids': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'sender_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'sender_email': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'intent': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'subject': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'html_body': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'sent_datetime': base_models.EXPORT_POLICY.NOT_APPLICABLE
        })

    @classmethod
    def has_reference_to_user_id(cls, user_id):
        """Check whether BulkEmailModel exists for user. Since recipient_ids
        can't be indexed it also can't be checked by this method, we can allow
        this because the deletion policy for this model is keep , thus even the
        deleted user's id will remain here.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether any models refer to the given user ID.
        """
        return (
            cls.query(cls.sender_id == user_id).get(keys_only=True) is not None)

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
        email_model_instance.update_timestamps()
        email_model_instance.put()


REPLY_TO_ID_LENGTH = 84


class GeneralFeedbackEmailReplyToIdModel(base_models.BaseModel):
    """This model stores unique_id for each <user, thread>
    combination.

    This unique_id is used in reply-to email address in outgoing feedback and
    suggestion emails. The id/key of instances of this model has form of
    [user_id].[thread_id]
    """

    user_id = datastore_services.StringProperty(required=True, indexed=True)
    thread_id = datastore_services.StringProperty(required=False, indexed=True)
    # The reply-to ID that is used in the reply-to email address.
    reply_to_id = datastore_services.StringProperty(indexed=True, required=True)

    @staticmethod
    def get_deletion_policy():
        """Feedback email reply to id should be deleted."""
        return base_models.DELETION_POLICY.DELETE

    @classmethod
    def get_export_policy(cls):
        """Model contains user data."""
        return dict(super(cls, cls).get_export_policy(), **{
            'user_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'thread_id': base_models.EXPORT_POLICY.EXPORTED,
            'reply_to_id': base_models.EXPORT_POLICY.EXPORTED
        })

    @classmethod
    def has_reference_to_user_id(cls, user_id):
        """Check whether GeneralFeedbackEmailReplyToIdModel exists for user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether any models refer to the given user ID.
        """
        return cls.query(cls.user_id == user_id).get(keys_only=True) is not None

    @classmethod
    def apply_deletion_policy(cls, user_id):
        """Delete instance of GeneralFeedbackEmailReplyToIdModel for the user.

        Args:
            user_id: str. The ID of the user whose data should be deleted.
        """
        datastore_services.delete_multi(
            cls.query(cls.user_id == user_id).fetch(keys_only=True))

    @classmethod
    def _generate_id(cls, user_id, thread_id):
        """Returns the unique id corresponding to the given user and thread ids.

        Args:
            user_id: str. The user id.
            thread_id: str. The thread id.

        Returns:
            str. The unique id used in the reply-to email address in outgoing
            feedback and suggestion emails.
        """
        return '.'.join([user_id, thread_id])

    @classmethod
    def _generate_unique_reply_to_id(cls):
        """Generates the unique reply-to id.

        Raises:
            Exception. When unique id generator produces too many collisions.

        Returns:
            str. The unique reply-to id if there are no collisions.
        """
        for _ in python_utils.RANGE(base_models.MAX_RETRIES):
            new_id = utils.convert_to_hash(
                '%s' % (utils.get_random_int(base_models.RAND_RANGE)),
                REPLY_TO_ID_LENGTH)
            if not cls.get_by_reply_to_id(new_id):
                return new_id

        raise Exception('Unique id generator is producing too many collisions.')

    @classmethod
    def create(cls, user_id, thread_id):
        """Creates a new FeedbackEmailReplyToIdModel instance.

        Args:
            user_id: str. ID of the corresponding user.
            thread_id: str. ID of the corresponding thread.

        Returns:
            FeedbackEmailReplyToIdModel. The created instance
            with the unique reply_to_id generated.

        Raises:
            Exception. Model instance for given user_id and
                thread_id already exists.
        """

        instance_id = cls._generate_id(user_id, thread_id)
        if cls.get_by_id(instance_id):
            raise Exception(
                'Unique reply-to ID for given user and thread already exists.')

        reply_to_id = cls._generate_unique_reply_to_id()
        feedback_email_reply_model_instance = cls(
            id=instance_id,
            user_id=user_id,
            thread_id=thread_id,
            reply_to_id=reply_to_id)

        feedback_email_reply_model_instance.update_timestamps()
        feedback_email_reply_model_instance.put()
        return feedback_email_reply_model_instance

    @classmethod
    def get_by_reply_to_id(cls, reply_to_id):
        """Fetches the FeedbackEmailReplyToIdModel instance corresponding to the
        given 'reply-to' id.

        Args:
            reply_to_id: str. The unique 'reply-to' id.

        Returns:
            FeedbackEmailReplyToIdModel or None. The instance corresponding to
            the given 'reply_to_id' if it is present in the datastore,
            else None.
        """
        model = cls.query(cls.reply_to_id == reply_to_id).get()
        return model

    @classmethod
    def get(cls, user_id, thread_id, strict=True):
        """Gets the FeedbackEmailReplyToIdModel instance corresponding to the
        unique instance id.

        Args:
            user_id: str. The user id.
            thread_id: str. The thread id.
            strict: bool. Whether to fail noisily if no entry with the given
                instance id exists in the datastore. Default is True.

        Returns:
            FeedbackEmailReplyToIdModel|None. An instance that corresponds to
            the given instance id if it is present in the datastore.
        """
        instance_id = cls._generate_id(user_id, thread_id)
        return super(
            GeneralFeedbackEmailReplyToIdModel, cls).get(
                instance_id, strict=strict)

    @classmethod
    def get_multi_by_user_ids(cls, user_ids, thread_id):
        """Returns the FeedbackEmailReplyToIdModel instances corresponding to
        the given user ids in dict format.

        Args:
            user_ids: list(str). A list of user ids.
            thread_id: str. The thread id.

        Returns:
            dict. The FeedbackEmailReplyToIdModel instances corresponding to the
            given list of user ids in dict format. The key is the unique user id
            and the corresponding value is the list of
            FeedbackEmailReplyToIdModel instances.
        """
        instance_ids = [cls._generate_id(user_id, thread_id)
                        for user_id in user_ids]
        retrieved_models = cls.get_multi(instance_ids)
        return {
            user_id: model for user_id, model in python_utils.ZIP(
                user_ids, retrieved_models)}

    @classmethod
    def export_data(cls, user_id):
        """(Takeout) Export GeneralFeedbackEmailReplyToIdModel's user data.

        Args:
            user_id: str. The user_id denotes which user's data to extract.

        Returns:
            dict. A dict whose keys are IDs of threads the user is involved in.
            The corresponding value is the reply_to_id of that thread.
        """
        user_data = {}
        email_reply_models = cls.get_all().filter(cls.user_id == user_id)
        for model in email_reply_models:
            user_data[model.thread_id] = model.reply_to_id
        return user_data
