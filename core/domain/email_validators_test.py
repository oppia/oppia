# coding: utf-8
#
# Copyright 2020 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for core.domain.email_validators."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime
import types

from core.domain import prod_validation_jobs_one_off
from core.platform import models
from core.tests import test_utils
import feconf

datastore_services = models.Registry.import_datastore_services()

USER_EMAIL = 'useremail@example.com'
USER_NAME = 'username'

(email_models, feedback_models, user_models,) = models.Registry.import_models([
    models.NAMES.email, models.NAMES.feedback, models.NAMES.user])


class SentEmailModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(SentEmailModelValidatorTests, self).setUp()

        def mock_generate_hash(
                unused_cls, unused_recipient_id, unused_email_subject,
                unused_email_body):
            return 'Email Hash'

        self.sender_email = 'noreply@oppia.org'
        self.signup(self.sender_email, 'noreply')
        self.sender_id = self.get_user_id_from_email(self.sender_email)
        self.sender_model = user_models.UserSettingsModel.get(self.sender_id)
        self.recipient_email = 'recipient@email.com'
        self.signup(self.recipient_email, 'recipient')
        self.recipient_id = self.get_user_id_from_email(self.recipient_email)
        self.recipient_model = (
            user_models.UserSettingsModel.get(self.recipient_id))

        with self.swap(
            email_models.SentEmailModel, '_generate_hash',
            types.MethodType(mock_generate_hash, email_models.SentEmailModel)):
            email_models.SentEmailModel.create(
                self.recipient_id, self.recipient_email, self.sender_id,
                self.sender_email, feconf.EMAIL_INTENT_SIGNUP,
                'Email Subject', 'Email Body', datetime.datetime.utcnow())

        self.model_instance = email_models.SentEmailModel.get_by_hash(
            'Email Hash')[0]

        self.job_class = (
            prod_validation_jobs_one_off.SentEmailModelAuditOneOffJob)

    def test_standard_model(self):
        expected_output = [u'[u\'fully-validated SentEmailModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_committer_id_migration_bot(self):
        self.model_instance.committer_id = feconf.MIGRATION_BOT_USER_ID
        self.model_instance.update_timestamps(update_last_updated_time=False)
        self.model_instance.put()

        expected_output = [
            u'[u\'fully-validated SentEmailModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of SentEmailModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance.id, self.model_instance.created_on,
                self.model_instance.last_updated
            )]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance.sent_datetime = (
            datetime.datetime.utcnow() - datetime.timedelta(hours=20))
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'SentEmailModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance.id, self.model_instance.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=False, literal_eval=False)

    def test_model_with_non_existent_sender_id(self):
        self.sender_model.delete()
        expected_output = [(
            u'[u\'failed validation check for sender_id field check of '
            'SentEmailModel\', '
            '[u"Entity id %s: based on field sender_id having value '
            '%s, expected model UserSettingsModel with '
            'id %s but it doesn\'t exist"]]') % (
                self.model_instance.id, self.sender_id, self.sender_id)]

        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_non_existent_recipient_id(self):
        self.recipient_model.delete()
        expected_output = [(
            u'[u\'failed validation check for recipient_id field check of '
            'SentEmailModel\', '
            '[u"Entity id %s: based on field recipient_id having value '
            '%s, expected model UserSettingsModel with '
            'id %s but it doesn\'t exist"]]') % (
                self.model_instance.id, self.recipient_id, self.recipient_id)]

        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_invalid_recipient_email(self):
        self.recipient_model.email = 'invalid@email.com'
        self.recipient_model.update_timestamps()
        self.recipient_model.put()
        expected_output = [(
            u'[u\'failed validation check for recipient email check of '
            'SentEmailModel\', '
            '[u\'Entity id %s: Recipient email %s in entity does not match '
            'with email %s of user obtained through recipient id %s\']]') % (
                self.model_instance.id, self.model_instance.recipient_email,
                self.recipient_model.email, self.model_instance.recipient_id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_sent_datetime_greater_than_current_time(self):
        self.model_instance.sent_datetime = (
            datetime.datetime.utcnow() + datetime.timedelta(days=1))
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for sent datetime check of '
            'SentEmailModel\', '
            '[u\'Entity id %s: The sent_datetime field has a value %s '
            'which is greater than the time when the job was run\']]') % (
                self.model_instance.id, self.model_instance.sent_datetime)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_invalid_id(self):
        model_instance_with_invalid_id = email_models.SentEmailModel(
            id='invalid', recipient_id=self.recipient_id,
            recipient_email=self.recipient_email, sender_id=self.sender_id,
            sender_email='noreply@oppia.org', intent=feconf.EMAIL_INTENT_SIGNUP,
            subject='Email Subject', html_body='Email Body',
            sent_datetime=datetime.datetime.utcnow())
        model_instance_with_invalid_id.update_timestamps()
        model_instance_with_invalid_id.put()
        expected_output = [(
            u'[u\'fully-validated SentEmailModel\', 1]'
        ), (
            u'[u\'failed validation check for model id check of '
            'SentEmailModel\', '
            '[u\'Entity id %s: Entity id does not match regex pattern\']]'
        ) % 'invalid']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class BulkEmailModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(BulkEmailModelValidatorTests, self).setUp()

        self.sender_email = 'sender@email.com'
        self.signup(self.sender_email, 'sender')
        self.sender_id = self.get_user_id_from_email(self.sender_email)
        self.sender_model = user_models.UserSettingsModel.get(self.sender_id)

        self.recipient_1_email = 'recipient1@email.com'
        self.recipient_2_email = 'recipient2@email.com'
        self.signup(self.recipient_1_email, 'recipient1')
        self.signup(self.recipient_2_email, 'recipient2')
        self.recipient_ids = [
            self.get_user_id_from_email(self.recipient_1_email),
            self.get_user_id_from_email(self.recipient_2_email)
        ]
        self.recipient_model_1 = (
            user_models.UserSettingsModel.get(self.recipient_ids[0]))
        self.recipient_model_2 = (
            user_models.UserSettingsModel.get(self.recipient_ids[1]))

        self.model_id = 'bulkemailid1'
        email_models.BulkEmailModel.create(
            self.model_id, self.recipient_ids, self.sender_id,
            self.sender_email, feconf.BULK_EMAIL_INTENT_MARKETING,
            'Email Subject', 'Email Body', datetime.datetime.utcnow())
        self.model_instance = email_models.BulkEmailModel.get_by_id(
            self.model_id)

        self.job_class = (
            prod_validation_jobs_one_off.BulkEmailModelAuditOneOffJob)

    def test_standard_model(self):
        expected_output = [u'[u\'fully-validated BulkEmailModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of BulkEmailModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance.id, self.model_instance.created_on,
                self.model_instance.last_updated
            )]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance.sent_datetime = (
            datetime.datetime.utcnow() - datetime.timedelta(hours=20))
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'BulkEmailModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance.id, self.model_instance.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=False, literal_eval=False)

    def test_model_with_non_existent_sender_id(self):
        self.sender_model.delete()
        expected_output = [(
            u'[u\'failed validation check for sender_id field check of '
            'BulkEmailModel\', '
            '[u"Entity id %s: based on field sender_id having value '
            '%s, expected model UserSettingsModel with '
            'id %s but it doesn\'t exist"]]') % (
                self.model_instance.id, self.sender_id, self.sender_id)]

        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_non_existent_recipient_id(self):
        self.recipient_model_1.delete()
        expected_output = [(
            u'[u\'failed validation check for recipient_id field check of '
            'BulkEmailModel\', '
            '[u"Entity id %s: based on field recipient_id having value '
            '%s, expected model UserSettingsModel with '
            'id %s but it doesn\'t exist"]]') % (
                self.model_instance.id, self.recipient_ids[0],
                self.recipient_ids[0])]

        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_invalid_sender_email(self):
        self.sender_model.email = 'invalid@email.com'
        self.sender_model.update_timestamps()
        self.sender_model.put()
        expected_output = [(
            u'[u\'failed validation check for sender email check of '
            'BulkEmailModel\', '
            '[u\'Entity id %s: Sender email %s in entity does not match with '
            'email %s of user obtained through sender id %s\']]') % (
                self.model_instance.id, self.model_instance.sender_email,
                self.sender_model.email, self.model_instance.sender_id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_sent_datetime_greater_than_current_time(self):
        self.model_instance.sent_datetime = (
            datetime.datetime.utcnow() + datetime.timedelta(days=1))
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for sent datetime check of '
            'BulkEmailModel\', '
            '[u\'Entity id %s: The sent_datetime field has a value %s '
            'which is greater than the time when the job was run\']]') % (
                self.model_instance.id, self.model_instance.sent_datetime)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_invalid_id(self):
        model_instance_with_invalid_id = email_models.BulkEmailModel(
            id='invalid:id', recipient_ids=self.recipient_ids,
            sender_id=self.sender_id, sender_email=self.sender_email,
            intent=feconf.BULK_EMAIL_INTENT_MARKETING,
            subject='Email Subject', html_body='Email Body',
            sent_datetime=datetime.datetime.utcnow())
        model_instance_with_invalid_id.update_timestamps()
        model_instance_with_invalid_id.put()
        expected_output = [(
            u'[u\'fully-validated BulkEmailModel\', 1]'
        ), (
            u'[u\'failed validation check for model id check of '
            'BulkEmailModel\', '
            '[u\'Entity id %s: Entity id does not match regex pattern\']]'
        ) % model_instance_with_invalid_id.id]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)
