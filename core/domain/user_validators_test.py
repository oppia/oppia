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

"""Unit tests for core.domain.user_validators."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime
import math
import random
import time

from core.domain import collection_domain
from core.domain import collection_services
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import feedback_services
from core.domain import prod_validation_jobs_one_off
from core.domain import rights_manager
from core.domain import subscription_services
from core.domain import user_query_services
from core.domain import user_services
from core.domain import wipeout_service
from core.platform import models
from core.tests import test_utils
import feconf
import python_utils
import utils

datastore_services = models.Registry.import_datastore_services()

USER_EMAIL = 'useremail@example.com'
USER_NAME = 'username'

(
    audit_models, email_models, exp_models, user_models
) = models.Registry.import_models([
    models.NAMES.audit, models.NAMES.email,
    models.NAMES.exploration, models.NAMES.user
])


class RoleQueryAuditModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(RoleQueryAuditModelValidatorTests, self).setUp()

        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.signup(USER_EMAIL, USER_NAME)

        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)

        admin_model = user_models.UserSettingsModel.get_by_id(self.admin_id)
        admin_model.role = feconf.ROLE_ID_ADMIN
        admin_model.put()

        model_id = '%s.%s.%s.%s' % (
            self.admin_id, int(math.floor(time.time())),
            feconf.ROLE_ACTION_UPDATE, random.randint(0, 1000))
        self.model_instance = audit_models.RoleQueryAuditModel(
            id=model_id, user_id=self.admin_id,
            intent=feconf.ROLE_ACTION_UPDATE, role='c', username='d')
        self.model_instance.put()

        self.job_class = (
            prod_validation_jobs_one_off.RoleQueryAuditModelAuditOneOffJob)

    def test_standard_model(self):
        expected_output = [u'[u\'fully-validated RoleQueryAuditModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of RoleQueryAuditModel\', '
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
            'RoleQueryAuditModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance.id, self.model_instance.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=False, literal_eval=False)

    def test_model_with_non_existent_user_id(self):
        user_models.UserSettingsModel.get(self.admin_id).delete()
        expected_output = [(
            u'[u\'failed validation check for user_ids field check of '
            'RoleQueryAuditModel\', '
            '[u"Entity id %s: based on field user_ids having value '
            '%s, expected model UserSettingsModel with '
            'id %s but it doesn\'t exist"]]') % (
                self.model_instance.id, self.admin_id, self.admin_id)]

        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_invalid_id(self):
        model_invalid_id = '%s.%s.%s.%s' % (
            'a', int(math.floor(time.time())), feconf.ROLE_ACTION_UPDATE,
            random.randint(0, 1000))
        model_instance_with_invalid_id = audit_models.RoleQueryAuditModel(
            id=model_invalid_id, user_id=self.admin_id,
            intent=feconf.ROLE_ACTION_UPDATE, role='c', username='d')
        model_instance_with_invalid_id.put()
        expected_output = [(
            u'[u\'fully-validated RoleQueryAuditModel\', 1]'
        ), (
            u'[u\'failed validation check for model id check of '
            'RoleQueryAuditModel\', '
            '[u\'Entity id %s: Entity id does not match regex pattern\']]'
        ) % model_invalid_id]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class UsernameChangeAuditModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(UsernameChangeAuditModelValidatorTests, self).setUp()

        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.signup(USER_EMAIL, USER_NAME)

        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)

        admin_model = user_models.UserSettingsModel.get_by_id(self.admin_id)
        admin_model.role = feconf.ROLE_ID_ADMIN
        admin_model.put()

        model_id = (
            '%s.%d' % (self.admin_id, utils.get_current_time_in_millisecs()))
        self.model_instance = audit_models.UsernameChangeAuditModel(
            id=model_id, committer_id=self.admin_id,
            old_username=USER_NAME, new_username='new')
        self.model_instance.put()

        self.job_class = (
            prod_validation_jobs_one_off.UsernameChangeAuditModelAuditOneOffJob)

    def test_standard_model(self):
        expected_output = [
            u'[u\'fully-validated UsernameChangeAuditModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of UsernameChangeAuditModel\', '
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
            'UsernameChangeAuditModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance.id, self.model_instance.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=False, literal_eval=False)

    def test_model_with_non_existent_user_id(self):
        user_models.UserSettingsModel.get(self.admin_id).delete()
        expected_output = [(
            u'[u\'failed validation check for committer_ids field check of '
            'UsernameChangeAuditModel\', '
            '[u"Entity id %s: based on field committer_ids having value '
            '%s, expected model UserSettingsModel with '
            'id %s but it doesn\'t exist"]]') % (
                self.model_instance.id, self.admin_id, self.admin_id)]

        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_invalid_id(self):
        model_invalid_id = (
            '%d.%s' % (utils.get_current_time_in_millisecs(), self.admin_id))
        model_instance_with_invalid_id = audit_models.UsernameChangeAuditModel(
            id=model_invalid_id, committer_id=self.admin_id,
            old_username=USER_NAME, new_username='new')
        model_instance_with_invalid_id.put()
        expected_output = [(
            u'[u\'fully-validated UsernameChangeAuditModel\', 1]'
        ), (
            u'[u\'failed validation check for model id check of '
            'UsernameChangeAuditModel\', '
            '[u\'Entity id %s: Entity id does not match regex pattern\']]'
        ) % model_invalid_id]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class UserContributionsModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(UserContributionsModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.owner = user_services.UserActionsInfo(self.owner_id)

        self.signup(USER_EMAIL, USER_NAME)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)
        self.user = user_services.UserActionsInfo(self.user_id)

        self.save_new_valid_exploration(
            'exp0', self.owner_id, end_state_name='End')
        self.save_new_valid_exploration(
            'exp1', self.owner_id, end_state_name='End')
        exp_services.update_exploration(
            self.user_id, 'exp0', [exp_domain.ExplorationChange({
                'cmd': 'edit_exploration_property',
                'property_name': 'objective',
                'new_value': 'the objective'
            })], 'Test edit')
        exp_services.update_exploration(
            self.owner_id, 'exp0', [exp_domain.ExplorationChange({
                'cmd': 'edit_exploration_property',
                'property_name': 'objective',
                'new_value': 'The objective'
            })], 'Test edit 2')
        rights_manager.publish_exploration(self.owner, 'exp0')
        rights_manager.publish_exploration(self.owner, 'exp1')

        # We will have three UserContributionsModel here since a model
        # since this model is created when UserSettingsModel is created
        # and we have also signed up super admin user in test_utils.
        self.model_instance_0 = user_models.UserContributionsModel.get_by_id(
            self.owner_id)
        self.model_instance_1 = user_models.UserContributionsModel.get_by_id(
            self.user_id)
        self.job_class = (
            prod_validation_jobs_one_off.UserContributionsModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated UserContributionsModel\', 3]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
        self.model_instance_0.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of UserContributionsModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.owner_id, self.model_instance_0.created_on,
                self.model_instance_0.last_updated
            ), u'[u\'fully-validated UserContributionsModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        user_models.UserContributionsModel.get_by_id(
            self.get_user_id_from_email('tmpsuperadmin@example.com')).delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'UserContributionsModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.owner_id, self.model_instance_0.last_updated)]

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
                'field check of UserContributionsModel\', '
                '[u"Entity id %s: based on '
                'field user_settings_ids having value '
                '%s, expected model UserSettingsModel '
                'with id %s but it doesn\'t exist"]]') % (
                    self.user_id, self.user_id, self.user_id),
            u'[u\'fully-validated UserContributionsModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_created_exploration_model_failure(self):
        exp_models.ExplorationModel.get_by_id('exp1').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for created_exploration_ids '
                'field check of UserContributionsModel\', '
                '[u"Entity id %s: based on field created_exploration_ids '
                'having value exp1, expected model ExplorationModel with id '
                'exp1 but it doesn\'t exist"]]' % self.owner_id
            ), (
                u'[u\'failed validation check for edited_exploration_ids '
                'field check of UserContributionsModel\', '
                '[u"Entity id %s: based on field edited_exploration_ids '
                'having value exp1, expected model ExplorationModel with '
                'id exp1 but it doesn\'t exist"]]' % self.owner_id
            ), u'[u\'fully-validated UserContributionsModel\', 2]']

        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_edited_exploration_model_failure(self):
        self.model_instance_0.delete()
        exp_models.ExplorationModel.get_by_id('exp0').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for edited_exploration_ids '
                'field check of UserContributionsModel\', '
                '[u"Entity id %s: based on field edited_exploration_ids '
                'having value exp0, expected model ExplorationModel with '
                'id exp0 but it doesn\'t exist"]]' % self.user_id
            ), u'[u\'fully-validated UserContributionsModel\', 1]']
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


class UserSubscriptionsModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(UserSubscriptionsModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(USER_EMAIL, USER_NAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)
        self.owner = user_services.UserActionsInfo(self.owner_id)

        explorations = [exp_domain.Exploration.create_default_exploration(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i
        ) for i in python_utils.RANGE(3)]

        for exp in explorations:
            exp_services.save_new_exploration(self.owner_id, exp)
            rights_manager.publish_exploration(self.owner, exp.id)

        collections = [collection_domain.Collection.create_default_collection(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i
        ) for i in python_utils.RANGE(3, 6)]

        for collection in collections:
            collection_services.save_new_collection(self.owner_id, collection)
            rights_manager.publish_collection(self.owner, collection.id)

        thread_id = feedback_services.create_thread(
            'exploration', 'exp_id', None, 'a subject', 'some text')

        subscription_services.subscribe_to_thread(
            self.user_id, thread_id)
        subscription_services.subscribe_to_creator(self.user_id, self.owner_id)
        for exp in explorations:
            subscription_services.subscribe_to_exploration(
                self.user_id, exp.id)
        for collection in collections:
            subscription_services.subscribe_to_collection(
                self.user_id, collection.id)
        self.process_and_flush_pending_mapreduce_tasks()

        self.model_instance = user_models.UserSubscriptionsModel.get_by_id(
            self.user_id)
        self.job_class = (
            prod_validation_jobs_one_off.UserSubscriptionsModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated UserSubscriptionsModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of UserSubscriptionsModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.user_id, self.model_instance.created_on,
                self.model_instance.last_updated
            ), u'[u\'fully-validated UserSubscriptionsModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        user_models.UserSubscriptionsModel.get_by_id(self.owner_id).delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'UserSubscriptionsModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.user_id, self.model_instance.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=False, literal_eval=False)

    def test_invalid_last_checked(self):
        self.model_instance.last_checked = (
            datetime.datetime.utcnow() + datetime.timedelta(days=1))
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for last checked check of '
                'UserSubscriptionsModel\', '
                '[u\'Entity id %s: last checked %s is greater than the time '
                'when job was run\']]' % (
                    self.user_id, self.model_instance.last_checked)
            ), u'[u\'fully-validated UserSubscriptionsModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_user_id_in_subscriber_ids(self):
        subscriber_model = user_models.UserSubscribersModel.get_by_id(
            self.owner_id)
        subscriber_model.subscriber_ids.remove(self.user_id)
        subscriber_model.put()
        expected_output = [
            (
                u'[u\'failed validation check for subscriber id check '
                'of UserSubscriptionsModel\', [u\'Entity id %s: '
                'User id is not present in subscriber ids of creator '
                'with id %s to whom the user has subscribed\']]' % (
                    self.user_id, self.owner_id)
            ), u'[u\'fully-validated UserSubscriptionsModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_subscriber_model_failure(self):
        user_models.UserSubscribersModel.get_by_id(self.owner_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for subscriber_ids '
                'field check of UserSubscriptionsModel\', '
                '[u"Entity id %s: based on '
                'field subscriber_ids having value '
                '%s, expected model UserSubscribersModel '
                'with id %s but it doesn\'t exist"]]') % (
                    self.user_id, self.owner_id, self.owner_id),
            u'[u\'fully-validated UserSubscriptionsModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_get_external_id_relationship_failure(self):
        nonexist_thread_id = 'nonexist_thread_id'
        subscription_services.subscribe_to_thread(
            self.user_id, nonexist_thread_id)

        expected_output = [
            (
                u'[u\'failed validation check for general_feedback_thread_ids '
                'field check of UserSubscriptionsModel\', '
                '[u"Entity id %s: based on '
                'field general_feedback_thread_ids having value '
                'nonexist_thread_id, expected model GeneralFeedbackThreadModel '
                'with id nonexist_thread_id but it doesn\'t '
                'exist"]]') % self.user_id,
            u'[u\'fully-validated UserSubscriptionsModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class UserSubscribersModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(UserSubscribersModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.signup(USER_EMAIL, USER_NAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)

        subscription_services.subscribe_to_creator(self.user_id, self.owner_id)
        subscription_services.subscribe_to_creator(
            self.admin_id, self.owner_id)

        self.model_instance = user_models.UserSubscribersModel.get_by_id(
            self.owner_id)
        self.job_class = (
            prod_validation_jobs_one_off.UserSubscribersModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated UserSubscribersModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of UserSubscribersModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.owner_id, self.model_instance.created_on,
                self.model_instance.last_updated
            )]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'UserSubscribersModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.owner_id, self.model_instance.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=False, literal_eval=False)

    def test_user_id_in_subscriber_ids(self):
        self.model_instance.subscriber_ids.append(self.owner_id)
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for subscriber id check '
                'of UserSubscribersModel\', [u\'Entity id %s: User id is '
                'present in subscriber ids for user\']]' % self.owner_id
            ), (
                u'[u\'failed validation check for subscription_ids field '
                'check of UserSubscribersModel\', [u"Entity id %s: '
                'based on field subscription_ids having value %s, expected '
                'model UserSubscriptionsModel with id %s but it doesn\'t '
                'exist"]]'
            ) % (self.owner_id, self.owner_id, self.owner_id)]

        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_user_id_in_creator_ids(self):
        subscription_model = user_models.UserSubscriptionsModel.get_by_id(
            self.user_id)
        subscription_model.creator_ids.remove(self.owner_id)
        subscription_model.put()
        expected_output = [(
            u'[u\'failed validation check for subscription creator id '
            'check of UserSubscribersModel\', [u\'Entity id %s: User id '
            'is not present in creator ids to which the subscriber of user '
            'with id %s has subscribed\']]') % (self.owner_id, self.user_id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_missing_user_settings_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.owner_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for user_settings_ids '
                'field check of UserSubscribersModel\', '
                '[u"Entity id %s: based on '
                'field user_settings_ids having value '
                '%s, expected model UserSettingsModel '
                'with id %s but it doesn\'t exist"]]') % (
                    self.owner_id, self.owner_id, self.owner_id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_missing_user_subscriptions_model_failure(self):
        user_models.UserSubscriptionsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for subscription_ids '
                'field check of UserSubscribersModel\', '
                '[u"Entity id %s: based on '
                'field subscription_ids having value '
                '%s, expected model UserSubscriptionsModel '
                'with id %s but it doesn\'t exist"]]') % (
                    self.owner_id, self.user_id, self.user_id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)


class UserRecentChangesBatchModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(UserRecentChangesBatchModelValidatorTests, self).setUp()

        self.signup(USER_EMAIL, USER_NAME)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)

        self.model_instance = user_models.UserRecentChangesBatchModel(
            id=self.user_id, job_queued_msec=10)
        self.model_instance.put()
        self.job_class = (
            prod_validation_jobs_one_off
            .UserRecentChangesBatchModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated UserRecentChangesBatchModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of UserRecentChangesBatchModel\', '
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
            'UserRecentChangesBatchModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.user_id, self.model_instance.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=False, literal_eval=False)

    def test_invalid_job_queued_msec(self):
        self.model_instance.job_queued_msec = (
            utils.get_current_time_in_millisecs() * 10)
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for job queued msec check of '
            'UserRecentChangesBatchModel\', '
            '[u\'Entity id %s: job queued msec %s is greater than the time '
            'when job was run\']]'
        ) % (self.user_id, self.model_instance.job_queued_msec)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_missing_user_settings_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for user_settings_ids '
                'field check of UserRecentChangesBatchModel\', '
                '[u"Entity id %s: based on '
                'field user_settings_ids having value '
                '%s, expected model UserSettingsModel '
                'with id %s but it doesn\'t exist"]]') % (
                    self.user_id, self.user_id, self.user_id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)


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


class UserContributionProficiencyModelValidatorTests(
        test_utils.AuditJobsTestBase):

    def setUp(self):
        super(UserContributionProficiencyModelValidatorTests, self).setUp()

        self.signup(USER_EMAIL, USER_NAME)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)

        score_category = 'content.Art'
        self.model_instance = (
            user_models.UserContributionProficiencyModel.create(
                self.user_id, score_category, 10
            )
        )
        self.job_class = (
            prod_validation_jobs_one_off
            .UserContributionProficiencyModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated UserContributionProficiencyModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of UserContributionProficiencyModel\', '
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
            'UserContributionProficiencyModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance.id, self.model_instance.last_updated)]

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
                'field check of UserContributionProficiencyModel\', '
                '[u"Entity id %s: based on '
                'field user_settings_ids having value '
                '%s, expected model UserSettingsModel '
                'with id %s but it doesn\'t exist"]]') % (
                    self.model_instance.id, self.user_id, self.user_id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_invalid_score(self):
        self.model_instance.score = -1
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for score check of '
            'UserContributionProficiencyModel\', [u\'Entity id %s: '
            'Expected score to be non-negative, received -1.0\']]') % (
                self.model_instance.id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)


class UserContributionRightsModelValidatorTests(test_utils.AuditJobsTestBase):

    TRANSLATOR_EMAIL = 'translator@community.org'
    TRANSLATOR_USERNAME = 'translator'

    VOICE_ARTIST_EMAIL = 'voiceartist@community.org'
    VOICE_ARTIST_USERNAME = 'voiceartist'

    def setUp(self):
        super(UserContributionRightsModelValidatorTests, self).setUp()

        self.signup(self.TRANSLATOR_EMAIL, self.TRANSLATOR_USERNAME)
        self.translator_id = self.get_user_id_from_email(self.TRANSLATOR_EMAIL)
        self.signup(self.VOICE_ARTIST_EMAIL, self.VOICE_ARTIST_USERNAME)
        self.voice_artist_id = self.get_user_id_from_email(
            self.VOICE_ARTIST_EMAIL)

        user_services.allow_user_to_review_voiceover_in_language(
            self.translator_id, 'hi')
        user_services.allow_user_to_review_voiceover_in_language(
            self.voice_artist_id, 'hi')

        self.translator_model_instance = (
            user_models.UserContributionRightsModel.get_by_id(
                self.translator_id))
        self.voice_artist_model_instance = (
            user_models.UserContributionRightsModel.get_by_id(
                self.voice_artist_id))

        self.job_class = (
            prod_validation_jobs_one_off
            .UserContributionRightsModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated UserContributionRightsModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_get_external_id_relationship_failure(self):
        user_models.UserSettingsModel.get_by_id(self.translator_id).delete()

        expected_output = [
            (
                u'[u\'failed validation check for user_settings_ids field '
                'check of UserContributionRightsModel\', [u"Entity id %s: '
                'based on field user_settings_ids having value %s, expected '
                'model UserSettingsModel with id %s but it doesn\'t exist"]]'
            ) % (self.translator_id, self.translator_id, self.translator_id),
            u'[u\'fully-validated UserContributionRightsModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_object_validation_failure(self):
        (
            self.translator_model_instance
            .can_review_voiceover_for_language_codes.append('invalid_lang_code')
        )
        self.translator_model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for domain object check of '
                'UserContributionRightsModel\', [u\'Entity id %s: Entity fails '
                'domain validation with the error Invalid language_code: '
                'invalid_lang_code\']]'
            ) % self.translator_id,
            u'[u\'fully-validated UserContributionRightsModel\', 1]']

        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class DeletedUserModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(DeletedUserModelValidatorTests, self).setUp()

        self.signup(USER_EMAIL, USER_NAME)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)

        # Run the full user deletion process as it works when the user
        # pre-deletes itself via frontend and then is fully deleted via
        # subsequent cron jobs.
        wipeout_service.pre_delete_user(self.user_id)
        wipeout_service.run_user_deletion(
            wipeout_service.get_pending_deletion_request(self.user_id))
        wipeout_service.run_user_deletion_completion(
            wipeout_service.get_pending_deletion_request(self.user_id))

        user_models.DeletedUserModel(id=self.user_id).put()

        self.model_instance = (
            user_models.DeletedUserModel.get_by_id(self.user_id))

        self.job_class = (
            prod_validation_jobs_one_off.DeletedUserModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated DeletedUserModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of DeletedUserModel\', '
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
            'DeletedUserModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance.id, self.model_instance.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=False, literal_eval=False)

    def test_existing_user_settings_model_failure(self):
        user_models.UserSettingsModel(
            id=self.user_id, email='email@email.com', gae_id='gae_id').put()
        expected_output = [
            (
                '[u\'failed validation check for '
                'user properly deleted of DeletedUserModel\', '
                '[u\'Entity id %s: The deletion verification fails\']]'
            ) % (self.model_instance.id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_existing_feedback_email_reply_to_id_model_failure(self):
        email_models.GeneralFeedbackEmailReplyToIdModel(
            id='id', user_id=self.user_id, reply_to_id='id').put()
        expected_output = [
            (
                '[u\'failed validation check for '
                'user properly deleted of DeletedUserModel\', '
                '[u\'Entity id %s: The deletion verification fails\']]'
            ) % (self.model_instance.id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)


class PseudonymizedUserModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(PseudonymizedUserModelValidatorTests, self).setUp()

        self.signup(USER_EMAIL, USER_NAME)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)

        self.model_instance = (
            user_models.PseudonymizedUserModel(
                id=user_models.PseudonymizedUserModel.get_new_id('')))
        self.model_instance.put()

        self.job_class = (
            prod_validation_jobs_one_off.PseudonymizedUserModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated PseudonymizedUserModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of PseudonymizedUserModel\', '
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
            'PseudonymizedUserModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance.id, self.model_instance.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=False, literal_eval=False)

    def test_model_not_same_id_as_user(self):
        user_models.UserSettingsModel(
            id=self.model_instance.id,
            gae_id='224169184123',
            email='email@email.com',
            username='username').put()

        expected_output = [(
            '[u\'failed validation check for deleted user settings of '
            'PseudonymizedUserModel\', '
            '[u\'Entity id %s: User settings model exists\']]'
        ) % self.model_instance.id]

        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)


class UserAuthDetailsModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(UserAuthDetailsModelValidatorTests, self).setUp()

        self.signup(USER_EMAIL, USER_NAME)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)
        self.gae_id = self.get_gae_id_from_email(USER_EMAIL)

        # Note: There will be a total of 2 UserSettingsModels (hence 2
        # UserAuthDetailsModels too) even though only one user signs up in the
        # test since superadmin signup is also done in
        # test_utils.AuditJobsTestBase.
        self.model_instance = user_models.UserAuthDetailsModel.get_by_id(
            self.user_id)
        self.job_class = (
            prod_validation_jobs_one_off.UserAuthDetailsModelAuditOneOffJob)

    def test_audit_standard_operation_passes(self):
        expected_output = [
            u'[u\'fully-validated UserAuthDetailsModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_audit_with_created_on_greater_than_last_updated_fails(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of UserAuthDetailsModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.user_id, self.model_instance.created_on,
                self.model_instance.last_updated
            ), u'[u\'fully-validated UserAuthDetailsModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_audit_with_last_updated_greater_than_current_time_fails(self):
        user_models.UserAuthDetailsModel.get_by_id(
            self.get_user_id_from_email('tmpsuperadmin@example.com')).delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'UserAuthDetailsModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.user_id, self.model_instance.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=False, literal_eval=False)

    def test_audit_with_missing_user_settings_model_fails(self):
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for user_settings_ids '
                'field check of UserAuthDetailsModel\', '
                '[u"Entity id %s: based on '
                'field user_settings_ids having value '
                '%s, expected model UserSettingsModel '
                'with id %s but it doesn\'t exist"]]') % (
                    self.user_id, self.user_id, self.user_id),
            u'[u\'fully-validated UserAuthDetailsModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)
