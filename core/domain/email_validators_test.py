# coding: utf-8
#
# Copyright 2019 The Oppia Authors. All Rights Reserved.
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

from core.domain import exp_domain
from core.domain import exp_services
from core.domain import feedback_services
from core.domain import prod_validation_jobs_one_off
from core.domain import user_query_services
from core.domain import user_services
from core.platform import models
from core.tests import test_utils
import feconf

datastore_services = models.Registry.import_datastore_services()
gae_search_services = models.Registry.import_search_services()

USER_EMAIL = 'useremail@example.com'
USER_NAME = 'username'
CURRENT_DATETIME = datetime.datetime.utcnow()

(
    base_models, email_models, feedback_models, suggestion_models, user_models
) = models.Registry.import_models([
    models.NAMES.base_model, models.NAMES.email, models.NAMES.feedback,
    models.NAMES.suggestion, models.NAMES.user
])


class SentEmailModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(SentEmailModelValidatorTests, self).setUp()

        def mock_generate_hash(
                unused_cls, unused_recipient_id, unused_email_subject,
                unused_email_body):
            return 'Email Hash'

        self.sender_email = 'noreply@oppia.org'
        self.sender_id = 'sender'
        self.sender_model = user_models.UserSettingsModel(
            id=self.sender_id,
            gae_id='gae_' + self.sender_id,
            email=self.sender_email)
        self.sender_model.put()

        self.recipient_email = 'recipient@email.com'
        self.recipient_id = 'recipient'
        self.recipient_model = user_models.UserSettingsModel(
            id=self.recipient_id,
            gae_id='gae_' + self.recipient_id,
            email=self.recipient_email)
        self.recipient_model.put()

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

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
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
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'SentEmailModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance.id, self.model_instance.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with self.mock_datetime_for_audit(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=False, literal_eval=False)

    def test_model_with_non_existent_sender_id(self):
        self.sender_model.delete()
        expected_output = [(
            u'[u\'failed validation check for sender_id field check of '
            'SentEmailModel\', '
            '[u"Entity id %s: based on field sender_id having value '
            '%s, expect model UserSettingsModel with '
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
            '%s, expect model UserSettingsModel with '
            'id %s but it doesn\'t exist"]]') % (
                self.model_instance.id, self.recipient_id, self.recipient_id)]

        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_invalid_recipient_email(self):
        self.recipient_model.email = 'invalid@email.com'
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
        self.sender_id = 'sender'
        self.sender_model = user_models.UserSettingsModel(
            id=self.sender_id,
            gae_id='gae_' + self.sender_id,
            email=self.sender_email)
        self.sender_model.put()

        self.recipient_ids = ['recipient1', 'recipient2']
        self.recipient_model_1 = user_models.UserSettingsModel(
            id=self.recipient_ids[0],
            gae_id='gae_' + self.recipient_ids[0],
            email='recipient1@email.com')
        self.recipient_model_1.put()
        self.recipient_model_2 = user_models.UserSettingsModel(
            id=self.recipient_ids[1],
            gae_id='gae_' + self.recipient_ids[1],
            email='recipient2@email.com')
        self.recipient_model_2.put()

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
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'BulkEmailModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance.id, self.model_instance.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with self.mock_datetime_for_audit(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=False, literal_eval=False)

    def test_model_with_non_existent_sender_id(self):
        self.sender_model.delete()
        expected_output = [(
            u'[u\'failed validation check for sender_id field check of '
            'BulkEmailModel\', '
            '[u"Entity id %s: based on field sender_id having value '
            '%s, expect model UserSettingsModel with '
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
            '%s, expect model UserSettingsModel with '
            'id %s but it doesn\'t exist"]]') % (
                self.model_instance.id, self.recipient_ids[0],
                self.recipient_ids[0])]

        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_invalid_sender_email(self):
        self.sender_model.email = 'invalid@email.com'
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


class GeneralFeedbackEmailReplyToIdModelValidatorTests(
        test_utils.AuditJobsTestBase):

    def setUp(self):
        super(GeneralFeedbackEmailReplyToIdModelValidatorTests, self).setUp()

        self.thread_id = feedback_services.create_thread(
            'exploration', 'expid', None, 'a subject', 'some text')

        self.signup(USER_EMAIL, USER_NAME)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)

        self.model_instance = (
            email_models.GeneralFeedbackEmailReplyToIdModel.create(
                self.user_id, self.thread_id))
        self.model_instance.put()

        self.job_class = (
            prod_validation_jobs_one_off
            .GeneralFeedbackEmailReplyToIdModelAuditOneOffJob)

    def test_standard_model(self):
        expected_output = [(
            u'[u\'fully-validated GeneralFeedbackEmailReplyToIdModel\', 1]')]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of GeneralFeedbackEmailReplyToIdModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance.id, self.model_instance.created_on,
                self.model_instance.last_updated
            )]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'GeneralFeedbackEmailReplyToIdModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance.id, self.model_instance.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with self.mock_datetime_for_audit(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=False, literal_eval=False)

    def test_model_with_non_existent_user_id(self):
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [(
            u'[u\'failed validation check for item.id.user_id field check of '
            'GeneralFeedbackEmailReplyToIdModel\', '
            '[u"Entity id %s: based on field item.id.user_id having value '
            '%s, expect model UserSettingsModel with '
            'id %s but it doesn\'t exist"]]') % (
                self.model_instance.id, self.user_id, self.user_id)]

        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_non_existent_thread_id(self):
        feedback_models.GeneralFeedbackThreadModel.get_by_id(
            self.thread_id).delete()
        expected_output = [(
            u'[u\'failed validation check for item.id.thread_id field check of '
            'GeneralFeedbackEmailReplyToIdModel\', '
            '[u"Entity id %s: based on field item.id.thread_id having value '
            '%s, expect model GeneralFeedbackThreadModel with '
            'id %s but it doesn\'t exist"]]') % (
                self.model_instance.id, self.thread_id, self.thread_id)]

        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_invalid_reply_to_id(self):
        while len(
                self.model_instance.reply_to_id) <= (
                    email_models.REPLY_TO_ID_LENGTH):
            self.model_instance.reply_to_id = (
                self.model_instance.reply_to_id + 'invalid')
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for reply_to_id length check of '
            'GeneralFeedbackEmailReplyToIdModel\', '
            '[u\'Entity id %s: reply_to_id %s should have length less than or '
            'equal to %s but instead has length %s\']]'
        ) % (
            self.model_instance.id, self.model_instance.reply_to_id,
            email_models.REPLY_TO_ID_LENGTH,
            len(self.model_instance.reply_to_id))]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)


class UnsentFeedbackEmailModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(UnsentFeedbackEmailModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        exp = exp_domain.Exploration.create_default_exploration(
            '0',
            title='title 0',
            category='Art',
        )
        exp_services.save_new_exploration(self.owner_id, exp)

        self.thread_id = feedback_services.create_thread(
            'exploration', '0', self.owner_id, 'Subject', 'Text',
            has_suggestion=False)

        feedback_message_references = [{
            'entity_type': 'exploration',
            'entity_id': '0',
            'thread_id': self.thread_id,
            'message_id': 0
        }]
        self.model_instance = feedback_models.UnsentFeedbackEmailModel(
            id=self.owner_id,
            feedback_message_references=feedback_message_references,
            retries=1)
        self.model_instance.put()

        self.job_class = (
            prod_validation_jobs_one_off.UnsentFeedbackEmailModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated UnsentFeedbackEmailModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of UnsentFeedbackEmailModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance.id,
                self.model_instance.created_on,
                self.model_instance.last_updated
            )]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'UnsentFeedbackEmailModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance.id, self.model_instance.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_missing_user_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.owner_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for user_ids field '
                'check of UnsentFeedbackEmailModel\', '
                '[u"Entity id %s: based on field user_ids having value '
                '%s, expected model UserSettingsModel with id %s but it '
                'doesn\'t exist"]]') % (
                    self.model_instance.id, self.owner_id, self.owner_id)]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_message_model_failure(self):
        feedback_models.GeneralFeedbackMessageModel.get_by_id(
            '%s.0' % self.thread_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for message_ids field '
                'check of UnsentFeedbackEmailModel\', '
                '[u"Entity id %s: based on field message_ids having value '
                '%s.0, expected model GeneralFeedbackMessageModel with '
                'id %s.0 but it doesn\'t exist"]]') % (
                    self.model_instance.id, self.thread_id, self.thread_id)]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_message_id_in_feedback_reference(self):
        self.model_instance.feedback_message_references[0].pop('message_id')
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for feedback message '
                'reference check of UnsentFeedbackEmailModel\', '
                '[u"Entity id %s: Invalid feedback reference: '
                '{u\'thread_id\': u\'%s\', u\'entity_id\': u\'0\', '
                'u\'entity_type\': u\'exploration\'}"]]'
            ) % (self.model_instance.id, self.thread_id)]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_thread_id_in_feedback_reference(self):
        self.model_instance.feedback_message_references[0].pop('thread_id')
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for feedback message '
                'reference check of UnsentFeedbackEmailModel\', '
                '[u"Entity id %s: Invalid feedback reference: '
                '{u\'entity_id\': u\'0\', u\'message_id\': 0, '
                'u\'entity_type\': u\'exploration\'}"]]'
            ) % self.model_instance.id]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_entity_id_in_feedback_reference(self):
        self.model_instance.feedback_message_references[0].pop('entity_id')
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for feedback message reference '
                'check of UnsentFeedbackEmailModel\', '
                '[u"Entity id %s: Invalid feedback reference: {u\'thread_id\': '
                'u\'%s\', u\'message_id\': 0, u\'entity_type\': '
                'u\'exploration\'}"]]'
            ) % (self.model_instance.id, self.thread_id)]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_entity_type_in_feedback_reference(self):
        self.model_instance.feedback_message_references[0].pop('entity_type')
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for feedback message '
                'reference check of UnsentFeedbackEmailModel\', '
                '[u"Entity id %s: Invalid feedback reference: '
                '{u\'thread_id\': u\'%s\', u\'entity_id\': u\'0\', '
                'u\'message_id\': 0}"]]'
            ) % (self.model_instance.id, self.thread_id)]

        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_invalid_entity_type_in_feedback_reference(self):
        self.model_instance.feedback_message_references[0]['entity_type'] = (
            'invalid')
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for feedback message reference '
                'check of UnsentFeedbackEmailModel\', '
                '[u"Entity id %s: Invalid feedback reference: {u\'thread_id\': '
                'u\'%s\', u\'entity_id\': u\'0\', u\'message_id\': 0, '
                'u\'entity_type\': u\'invalid\'}"]]'
            ) % (self.model_instance.id, self.thread_id)]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_invalid_entity_id_in_feedback_reference(self):
        self.model_instance.feedback_message_references[0]['entity_id'] = (
            'invalid')
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for feedback message reference '
                'check of UnsentFeedbackEmailModel\', '
                '[u"Entity id %s: Invalid feedback reference: {u\'thread_id\': '
                'u\'%s\', u\'entity_id\': u\'invalid\', u\'message_id\': 0, '
                'u\'entity_type\': u\'exploration\'}"]]'
            ) % (self.model_instance.id, self.thread_id)]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class UserQueryModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(UserQueryModelValidatorTests, self).setUp()

        self.signup(USER_EMAIL, USER_NAME)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.set_admins([self.ADMIN_USERNAME])

        self.query_id = user_query_services.save_new_query_model(
            self.admin_id, inactive_in_last_n_days=10,
            created_at_least_n_exps=5,
            has_not_logged_in_for_n_days=30)

        self.model_instance = user_models.UserQueryModel.get_by_id(
            self.query_id)
        self.model_instance.user_ids = [self.owner_id, self.user_id]
        self.model_instance.put()

        with self.swap(feconf, 'CAN_SEND_EMAILS', True):
            user_query_services.send_email_to_qualified_users(
                self.query_id, 'subject', 'body',
                feconf.BULK_EMAIL_INTENT_MARKETING, 5)
        self.sent_mail_id = self.model_instance.sent_email_model_id
        self.job_class = (
            prod_validation_jobs_one_off.UserQueryModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated UserQueryModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of UserQueryModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.query_id, self.model_instance.created_on,
                self.model_instance.last_updated
            )]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'UserQueryModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.query_id, self.model_instance.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=False, literal_eval=False)

    def test_missing_user_settings_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for user_settings_ids '
                'field check of UserQueryModel\', '
                '[u"Entity id %s: based on '
                'field user_settings_ids having value '
                '%s, expected model UserSettingsModel '
                'with id %s but it doesn\'t exist"]]') % (
                    self.query_id, self.user_id, self.user_id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_missing_sent_email_model_failure(self):
        email_models.BulkEmailModel.get_by_id(self.sent_mail_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for sent_email_model_ids '
                'field check of UserQueryModel\', '
                '[u"Entity id %s: based on '
                'field sent_email_model_ids having value '
                '%s, expected model BulkEmailModel '
                'with id %s but it doesn\'t exist"]]') % (
                    self.query_id, self.sent_mail_id, self.sent_mail_id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_extra_recipients(self):
        bulk_email_model = email_models.BulkEmailModel.get_by_id(
            self.sent_mail_id)
        bulk_email_model.recipient_ids.append('invalid')
        bulk_email_model.put()
        expected_output = [(
            u'[u\'failed validation check for recipient check of '
            'UserQueryModel\', [u"Entity id %s: Email model %s '
            'for query has following extra recipients [u\'invalid\'] '
            'which are not qualified as per the query"]]') % (
                self.query_id, self.sent_mail_id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_invalid_sender_id(self):
        bulk_email_model = email_models.BulkEmailModel.get_by_id(
            self.sent_mail_id)
        bulk_email_model.sender_id = 'invalid'
        bulk_email_model.put()
        expected_output = [(
            u'[u\'failed validation check for sender check of '
            'UserQueryModel\', [u\'Entity id %s: Sender id invalid in '
            'email model with id %s does not match submitter id '
            '%s of query\']]') % (
                self.query_id, self.sent_mail_id, self.admin_id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_missing_user_bulk_email_model(self):
        user_models.UserBulkEmailsModel.get_by_id(self.owner_id).delete()
        expected_output = [(
            u'[u\'failed validation check for user bulk email check of '
            'UserQueryModel\', [u\'Entity id %s: UserBulkEmails model '
            'is missing for recipient with id %s\']]') % (
                self.query_id, self.owner_id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)


class UserBulkEmailsModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(UserBulkEmailsModelValidatorTests, self).setUp()

        self.signup(USER_EMAIL, USER_NAME)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.set_admins([self.ADMIN_USERNAME])

        self.query_id = user_query_services.save_new_query_model(
            self.admin_id, inactive_in_last_n_days=10,
            created_at_least_n_exps=5,
            has_not_logged_in_for_n_days=30)

        query_model = user_models.UserQueryModel.get_by_id(
            self.query_id)
        query_model.user_ids = [self.owner_id, self.user_id]
        query_model.put()

        with self.swap(feconf, 'CAN_SEND_EMAILS', True):
            user_query_services.send_email_to_qualified_users(
                self.query_id, 'subject', 'body',
                feconf.BULK_EMAIL_INTENT_MARKETING, 5)
        self.model_instance = user_models.UserBulkEmailsModel.get_by_id(
            self.user_id)
        self.sent_mail_id = query_model.sent_email_model_id
        self.job_class = (
            prod_validation_jobs_one_off.UserBulkEmailsModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated UserBulkEmailsModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of UserBulkEmailsModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.user_id, self.model_instance.created_on,
                self.model_instance.last_updated
            ), u'[u\'fully-validated UserBulkEmailsModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        user_models.UserBulkEmailsModel.get_by_id(self.owner_id).delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'UserBulkEmailsModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.user_id, self.model_instance.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=False, literal_eval=False)

    def test_missing_user_settings_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for user_settings_ids '
                'field check of UserBulkEmailsModel\', '
                '[u"Entity id %s: based on '
                'field user_settings_ids having value '
                '%s, expected model UserSettingsModel '
                'with id %s but it doesn\'t exist"]]' % (
                    self.user_id, self.user_id, self.user_id)
            ), u'[u\'fully-validated UserBulkEmailsModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_sent_email_model_failure(self):
        email_models.BulkEmailModel.get_by_id(self.sent_mail_id).delete()
        expected_output = [(
            u'[u\'failed validation check for sent_email_model_ids field '
            'check of UserBulkEmailsModel\', [u"Entity id %s: based on '
            'field sent_email_model_ids having value %s, expected model '
            'BulkEmailModel with id %s but it doesn\'t exist", '
            'u"Entity id %s: based on field sent_email_model_ids having '
            'value %s, expected model BulkEmailModel with id %s but it '
            'doesn\'t exist"]]') % (
                self.user_id, self.sent_mail_id, self.sent_mail_id,
                self.owner_id, self.sent_mail_id, self.sent_mail_id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=True)

    def test_user_id_not_in_recipient_ids(self):
        bulk_email_model = email_models.BulkEmailModel.get_by_id(
            self.sent_mail_id)
        bulk_email_model.recipient_ids.remove(self.user_id)
        bulk_email_model.put()
        expected_output = [
            (
                u'[u\'failed validation check for recipient check of '
                'UserBulkEmailsModel\', [u\'Entity id %s: user id is '
                'not present in recipient ids of BulkEmailModel with id %s\']]'
            ) % (self.user_id, self.sent_mail_id),
            u'[u\'fully-validated UserBulkEmailsModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class UserEmailPreferencesModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(UserEmailPreferencesModelValidatorTests, self).setUp()

        self.signup(USER_EMAIL, USER_NAME)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)
        user_services.update_email_preferences(
            self.user_id, True, True, False, True)

        self.model_instance = user_models.UserEmailPreferencesModel.get_by_id(
            self.user_id)
        self.job_class = (
            prod_validation_jobs_one_off
            .UserEmailPreferencesModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated UserEmailPreferencesModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of UserEmailPreferencesModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.user_id, self.model_instance.created_on,
                self.model_instance.last_updated
            )]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'UserEmailPreferencesModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.user_id, self.model_instance.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=False, literal_eval=False)

    def test_missing_user_settings_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for user_settings_ids '
                'field check of UserEmailPreferencesModel\', '
                '[u"Entity id %s: based on '
                'field user_settings_ids having value '
                '%s, expected model UserSettingsModel '
                'with id %s but it doesn\'t exist"]]') % (
                    self.user_id, self.user_id, self.user_id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)
