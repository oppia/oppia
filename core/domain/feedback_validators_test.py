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

"""Unit tests for core.domain.feedback_validators."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime

from core.domain import exp_domain
from core.domain import exp_services
from core.domain import feedback_services
from core.domain import prod_validation_jobs_one_off
from core.platform import models
from core.tests import test_utils
import feconf

datastore_services = models.Registry.import_datastore_services()

(
    exp_models, feedback_models,
    suggestion_models, user_models
) = models.Registry.import_models([
    models.NAMES.exploration, models.NAMES.feedback,
    models.NAMES.suggestion, models.NAMES.user
])


class GeneralFeedbackThreadModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(GeneralFeedbackThreadModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.set_admins([self.ADMIN_USERNAME])

        exp = exp_domain.Exploration.create_default_exploration(
            '0',
            title='title 0',
            category='Art',
        )
        exp_services.save_new_exploration(self.owner_id, exp)

        self.thread_id = feedback_services.create_thread(
            'exploration', '0', self.owner_id, 'Subject', 'Text',
            has_suggestion=False)

        score_category = (
            suggestion_models.SCORE_TYPE_CONTENT +
            suggestion_models.SCORE_CATEGORY_DELIMITER + exp.category)
        change = {
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'property_name': exp_domain.STATE_PROPERTY_CONTENT,
            'state_name': 'state_1',
            'new_value': 'new suggestion content'
        }
        suggestion_models.GeneralSuggestionModel.create(
            feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION, '0',
            1, suggestion_models.STATUS_ACCEPTED, self.owner_id,
            self.admin_id, change, score_category, self.thread_id, None)

        self.model_instance = (
            feedback_models.GeneralFeedbackThreadModel.get_by_id(
                self.thread_id))
        self.model_instance.has_suggestion = True
        self.model_instance.update_timestamps()
        self.model_instance.put()

        self.job_class = (
            prod_validation_jobs_one_off
            .GeneralFeedbackThreadModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated GeneralFeedbackThreadModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_pseudo_original_author_id(self):
        self.model_instance.original_author_id = self.PSEUDONYMOUS_ID
        self.model_instance.update_timestamps(update_last_updated_time=False)
        self.model_instance.put()

        expected_output = [
            u'[u\'fully-validated GeneralFeedbackThreadModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_pseudo_last_nonempty_message_author_id(self):
        self.model_instance.last_nonempty_message_author_id = (
            self.PSEUDONYMOUS_ID)
        self.model_instance.update_timestamps(update_last_updated_time=False)
        self.model_instance.put()

        expected_output = [
            u'[u\'fully-validated GeneralFeedbackThreadModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of GeneralFeedbackThreadModel\', '
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
            'GeneralFeedbackThreadModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance.id, self.model_instance.last_updated)]
        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_missing_exploration_model_failure(self):
        exp_models.ExplorationModel.get_by_id('0').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for exploration_ids field '
                'check of GeneralFeedbackThreadModel\', '
                '[u"Entity id %s: based on field exploration_ids having value '
                '0, expected model ExplorationModel with id 0 but it doesn\'t '
                'exist"]]') % self.model_instance.id]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_suggestion_model_failure(self):
        suggestion_models.GeneralSuggestionModel.get_by_id(
            self.thread_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for suggestion_ids field '
                'check of GeneralFeedbackThreadModel\', '
                '[u"Entity id %s: based on field suggestion_ids having '
                'value %s, expected model GeneralSuggestionModel with id %s '
                'but it doesn\'t exist"]]') % (
                    self.model_instance.id, self.thread_id, self.thread_id)]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_author_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.owner_id).delete()
        expected_output = [
            (
                '[u\'failed validation check for '
                'last_nonempty_message_author_ids field '
                'check of GeneralFeedbackThreadModel\', '
                '[u"Entity id %s: based on field '
                'last_nonempty_message_author_ids having value '
                '%s, expected model UserSettingsModel with id %s but it '
                'doesn\'t exist"]]'
            ) % (
                self.model_instance.id, self.owner_id, self.owner_id
            ),
            (
                '[u\'failed validation check for author_ids field '
                'check of GeneralFeedbackThreadModel\', '
                '[u"Entity id %s: based on field author_ids having value '
                '%s, expected model UserSettingsModel with id %s but it '
                'doesn\'t exist"]]'
            ) % (
                self.model_instance.id, self.owner_id, self.owner_id
            ),
        ]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_wrong_original_author_id_format_failure(self):
        self.model_instance.original_author_id = 'wrong_id'
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for invalid ids in field of '
                u'GeneralFeedbackThreadModel\', [u"Entity id %s: '
                'The user id wrong_id in the field \'author_ids\' is invalid"]]'
            ) % (self.model_instance.id)
        ]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_wrong_last_nonempty_message_author_id_format_failure(self):
        self.model_instance.last_nonempty_message_author_id = 'wrong_id'
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for invalid ids in field of '
                'GeneralFeedbackThreadModel\', [u"Entity id %s: '
                'The user id wrong_id in the field '
                '\'last_nonempty_message_author_ids\' is invalid"]]'
            ) % (self.model_instance.id)
        ]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_message_model_failure(self):
        feedback_models.GeneralFeedbackMessageModel.get_by_id(
            '%s.0' % self.thread_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for message_ids field '
                'check of GeneralFeedbackThreadModel\', '
                '[u"Entity id %s: based on field message_ids having value '
                '%s.0, expected model GeneralFeedbackMessageModel with '
                'id %s.0 but it doesn\'t exist"]]') % (
                    self.model_instance.id, self.thread_id, self.thread_id)]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_invalid_has_suggestion(self):
        self.model_instance.has_suggestion = False
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for has suggestion '
                'check of GeneralFeedbackThreadModel\', [u\'Entity id %s: '
                'has suggestion for entity is false but a suggestion exists '
                'with id same as entity id\']]'
            ) % self.model_instance.id]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_entity_type(self):
        expected_output = [
            (
                u'[u\'failed validation check for entity type check '
                'of GeneralFeedbackThreadModel\', [u\'Entity id %s: Entity '
                'type exploration is not allowed\']]'
            ) % self.model_instance.id]
        with self.swap(
            feedback_services, 'TARGET_TYPE_TO_TARGET_MODEL', {}):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)


class GeneralFeedbackMessageModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(GeneralFeedbackMessageModelValidatorTests, self).setUp()

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

        self.model_instance = (
            feedback_models.GeneralFeedbackMessageModel.get_by_id(
                '%s.0' % self.thread_id))

        self.job_class = (
            prod_validation_jobs_one_off
            .GeneralFeedbackMessageModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated GeneralFeedbackMessageModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_pseudo_author_id(self):
        self.model_instance.author_id = self.PSEUDONYMOUS_ID
        self.model_instance.update_timestamps(update_last_updated_time=False)
        self.model_instance.put()

        expected_output = [
            u'[u\'fully-validated GeneralFeedbackMessageModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of GeneralFeedbackMessageModel\', '
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
            'GeneralFeedbackMessageModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance.id, self.model_instance.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_missing_author_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.owner_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for author_ids field '
                'check of GeneralFeedbackMessageModel\', '
                '[u"Entity id %s: based on field author_ids having value '
                '%s, expected model UserSettingsModel with id %s but it '
                'doesn\'t exist"]]') % (
                    self.model_instance.id, self.owner_id, self.owner_id)]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_wrong_author_id_format_failure(self):
        self.model_instance.author_id = 'wrong_id'
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for invalid ids in field of '
                'GeneralFeedbackMessageModel\', [u"Entity id %s: '
                'The user id wrong_id in the field \'author_ids\' is invalid"]]'
            ) % (self.model_instance.id)
        ]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_feedback_thread_model_failure(self):
        feedback_models.GeneralFeedbackThreadModel.get_by_id(
            self.thread_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for feedback_thread_ids field '
                'check of GeneralFeedbackMessageModel\', '
                '[u"Entity id %s: based on field feedback_thread_ids having '
                'value %s, expected model GeneralFeedbackThreadModel with '
                'id %s but it doesn\'t exist"]]') % (
                    self.model_instance.id, self.thread_id, self.thread_id)]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_invalid_message_id(self):
        self.model_instance.message_id = 2
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for message id check of '
                'GeneralFeedbackMessageModel\', [u\'Entity id %s: '
                'message id 2 not less than total count of messages '
                '1 in feedback thread model with id %s '
                'corresponding to the entity\']]'
            ) % (self.model_instance.id, self.thread_id), (
                u'[u\'failed validation check for model id check '
                'of GeneralFeedbackMessageModel\', [u\'Entity id %s: '
                'Entity id does not match regex pattern\']]'
            ) % self.model_instance.id]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class GeneralFeedbackThreadUserModelValidatorTests(
        test_utils.AuditJobsTestBase):

    def setUp(self):
        super(GeneralFeedbackThreadUserModelValidatorTests, self).setUp()

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

        self.model_instance = (
            feedback_models.GeneralFeedbackThreadUserModel.get_by_id(
                '%s.%s' % (self.owner_id, self.thread_id)))

        self.job_class = (
            prod_validation_jobs_one_off
            .GeneralFeedbackThreadUserModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated GeneralFeedbackThreadUserModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of GeneralFeedbackThreadUserModel\', '
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
            'GeneralFeedbackThreadUserModel\', '
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
                'check of GeneralFeedbackThreadUserModel\', '
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
                'check of GeneralFeedbackThreadUserModel\', '
                '[u"Entity id %s: based on field message_ids having '
                'value %s.0, expected model GeneralFeedbackMessageModel with '
                'id %s.0 but it doesn\'t exist"]]') % (
                    self.model_instance.id, self.thread_id, self.thread_id)]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class FeedbackAnalyticsModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(FeedbackAnalyticsModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        exp = exp_domain.Exploration.create_default_exploration(
            '0',
            title='title 0',
            category='Art',
        )
        exp_services.save_new_exploration(self.owner_id, exp)

        self.model_instance = feedback_models.FeedbackAnalyticsModel(id='0')
        self.model_instance.update_timestamps()
        self.model_instance.put()

        self.job_class = (
            prod_validation_jobs_one_off.FeedbackAnalyticsModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated FeedbackAnalyticsModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of FeedbackAnalyticsModel\', '
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
            'FeedbackAnalyticsModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance.id, self.model_instance.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_missing_exploration_model_failure(self):
        exp_models.ExplorationModel.get_by_id('0').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for exploration_ids field '
                'check of FeedbackAnalyticsModel\', '
                '[u"Entity id %s: based on field exploration_ids having value '
                '0, expected model ExplorationModel with id 0 but it doesn\'t '
                'exist"]]') % self.model_instance.id]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


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
        self.model_instance.update_timestamps()
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
        self.model_instance.update_timestamps()
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
        self.model_instance.update_timestamps()
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
        self.model_instance.update_timestamps()
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
        self.model_instance.update_timestamps()
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
        self.model_instance.update_timestamps()
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
        self.model_instance.update_timestamps()
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
        self.model_instance.update_timestamps()
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
