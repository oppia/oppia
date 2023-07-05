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

from __future__ import annotations

import datetime

from core import feconf
from core import utils
from core.platform import models

from typing import Dict, Optional, Sequence

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import base_models
    from mypy_imports import datastore_services

(base_models,) = models.Registry.import_models([models.Names.BASE_MODEL])

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
            feconf.EMAIL_INTENT_ACCOUNT_DELETED,
            feconf.BULK_EMAIL_INTENT_TEST,
            (
                feconf
                .EMAIL_INTENT_NOTIFY_CONTRIBUTOR_DASHBOARD_ACHIEVEMENTS)
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
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model contains data corresponding to a user: recipient_id,
        recipient_email, sender_id, and sender_email.
        """
        return base_models.DELETION_POLICY.DELETE

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Users already have access to this data since emails were sent
        to them.
        """
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model contains data corresponding to a user, but this isn't exported
        because users already have access to noteworthy details of this data
        (since emails were sent to them).
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
    def apply_deletion_policy(cls, user_id: str) -> None:
        """Delete instances of SentEmailModel for the user.

        Args:
            user_id: str. The ID of the user whose data should be deleted.
        """
        keys = cls.query(datastore_services.any_of(
            cls.recipient_id == user_id,
            cls.sender_id == user_id,
        )).fetch(keys_only=True)
        datastore_services.delete_multi(keys)

    @classmethod
    def has_reference_to_user_id(cls, user_id: str) -> bool:
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
    def _generate_id(cls, intent: str) -> str:
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

        for _ in range(base_models.MAX_RETRIES):
            new_id = '%s.%s' % (
                id_prefix,
                utils.convert_to_hash(str(utils.get_random_int(
                    base_models.RAND_RANGE)),
                    base_models.ID_LENGTH))
            if not cls.get_by_id(new_id):
                return new_id

        raise Exception(
            'The id generator for SentEmailModel is producing too many '
            'collisions.')

    @classmethod
    def create(
        cls,
        recipient_id: str,
        recipient_email: str,
        sender_id: str,
        sender_email: str,
        intent: str,
        subject: str,
        html_body: str,
        sent_datetime: datetime.datetime
    ) -> None:
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

    def _pre_put_hook(self) -> None:
        """Operations to perform just before the model is `put` into storage."""
        super()._pre_put_hook()
        self.email_hash = self._generate_hash(
            self.recipient_id, self.subject, self.html_body)

    @classmethod
    def get_by_hash(
        cls,
        email_hash: str,
        sent_datetime_lower_bound: Optional[datetime.datetime] = None
    ) -> Sequence[SentEmailModel]:
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

        return query.fetch()

    @classmethod
    def _generate_hash(
        cls,
        recipient_id: str,
        email_subject: str,
        email_body: str
    ) -> str:
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
    def check_duplicate_message(
        cls,
        recipient_id: str,
        email_subject: str,
        email_body: str
    ) -> bool:
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

    The recipient IDs are not stored in this model. But, we store all
    bulk emails that are sent to a particular user in UserBulkEmailsModel.
    """

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
            feconf.BULK_EMAIL_INTENT_LEARNER_REENGAGEMENT,
            feconf.BULK_EMAIL_INTENT_ML_JOB_FAILURE
        ])
    # The subject line of the email.
    subject = datastore_services.TextProperty(required=True)
    # The HTML content of the email body.
    html_body = datastore_services.TextProperty(required=True)
    # The datetime the email was sent, in UTC.
    sent_datetime = (
        datastore_services.DateTimeProperty(required=True, indexed=True))

    # DEPRECATED in v3.2.1. Do not use.
    recipient_ids = datastore_services.JsonProperty(default=[], compressed=True)

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model contains data corresponding to a user: sender_id, and
        sender_email.
        """
        return base_models.DELETION_POLICY.DELETE

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Users already have access to this data since the emails were sent
        to them.
        """
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model contains data corresponding to a user, but this isn't exported
        because users already have access to noteworthy details of this data
        (since emails were sent to them).
        """
        return dict(super(cls, cls).get_export_policy(), **{
            'sender_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'sender_email': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'recipient_ids': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'intent': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'subject': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'html_body': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'sent_datetime': base_models.EXPORT_POLICY.NOT_APPLICABLE
        })

    @classmethod
    def apply_deletion_policy(cls, user_id: str) -> None:
        """Delete instances of BulkEmailModel for the user.

        Args:
            user_id: str. The ID of the user whose data should be deleted.
        """
        keys = cls.query(datastore_services.any_of(
            cls.sender_id == user_id,
        )).fetch(keys_only=True)
        datastore_services.delete_multi(keys)

    @classmethod
    def has_reference_to_user_id(cls, user_id: str) -> bool:
        """Check whether BulkEmailModel exists for user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether any models refer to the given user ID.
        """
        return (
            cls.query(cls.sender_id == user_id).get(keys_only=True) is not None
        )

    @classmethod
    def create(
        cls,
        instance_id: str,
        sender_id: str,
        sender_email: str,
        intent: str,
        subject: str,
        html_body: str,
        sent_datetime: datetime.datetime
    ) -> None:
        """Creates a new BulkEmailModel entry.

        Args:
            instance_id: str. The ID of the instance.
            sender_id: str. The user ID of the email sender.
            sender_email: str. The email address used to send the notification.
            intent: str. The intent string, i.e. the purpose of the email.
            subject: str. The subject line of the email.
            html_body: str. The HTML content of the email body.
            sent_datetime: datetime.datetime. The date and time the email
                was sent, in UTC.
        """
        email_model_instance = cls(
            id=instance_id, sender_id=sender_id,
            sender_email=sender_email, intent=intent, subject=subject,
            html_body=html_body, sent_datetime=sent_datetime)
        email_model_instance.update_timestamps()
        email_model_instance.put()
