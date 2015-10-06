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

__author__ = 'Sean Lip'

from core.platform import models
(base_models,) = models.Registry.import_models([models.NAMES.base_model])
import feconf
import utils

from google.appengine.ext import ndb


INTENT_SIGNUP = 'signup'
INTENT_DAILY_BATCH = 'daily_batch'
INTENT_MARKETING = 'marketing'
INTENT_PUBLICIZE_EXPLORATION = 'publicize_exploration'
INTENT_UNPUBLISH_EXPLORATION = 'unpublish_exploration'
INTENT_DELETE_EXPLORATION = 'delete_exploration'


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
        INTENT_SIGNUP,
        INTENT_MARKETING,
        INTENT_DAILY_BATCH,
        INTENT_PUBLICIZE_EXPLORATION,
        INTENT_UNPUBLISH_EXPLORATION,
        INTENT_DELETE_EXPLORATION,
    ])
    # The subject line of the email.
    subject = ndb.TextProperty(required=True)
    # The HTML content of the email body.
    html_body = ndb.TextProperty(required=True)
    # The datetime the email was sent, in UTC.
    sent_datetime = ndb.DateTimeProperty(required=True, indexed=True)

    @classmethod
    def _generate_id(cls, intent):
        id_prefix = '%s.' % intent

        MAX_RETRIES = 10
        RAND_RANGE = 127 * 127
        ID_LENGTH = 12

        for i in range(MAX_RETRIES):
            new_id = '%s.%s' % (
                id_prefix,
                utils.convert_to_hash(
                    str(utils.get_random_int(RAND_RANGE)), ID_LENGTH))
            if not cls.get_by_id(new_id):
                return new_id

        raise Exception(
            'The id generator for SentEmailModel is producing too many '
            'collisions.')

    def _initial_put(self):
        """Saves a model instance to the datastore.

        This should only be used when the model instance is first created.
        """
        super(SentEmailModel, self).put()

    def put(self):
        """Once written, instances of this class should be read-only."""
        raise NotImplementedError

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
        email_model_instance._initial_put()
