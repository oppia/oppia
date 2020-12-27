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

"""Unit tests for core.domain.auth_validators_test."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime

from core.domain import prod_validation_jobs_one_off
from core.platform import models
from core.tests import test_utils

auth_models, user_models = (
    models.Registry.import_models([models.NAMES.auth, models.NAMES.user]))
datastore_services = models.Registry.import_datastore_services()


class UserIdByFirebaseAuthIdModelValidatorTests(test_utils.AuditJobsTestBase):

    USER_EMAIL = 'useremail@example.com'
    USER_NAME = 'username'

    def setUp(self):
        # We want full control over which user models are in storage, so skip
        # creating the default superadmin user.
        with self.swap_to_always_return(self, 'signup_superadmin_user'):
            super(UserIdByFirebaseAuthIdModelValidatorTests, self).setUp()

        self.signup(self.USER_EMAIL, self.USER_NAME)
        self.user_id = self.get_user_id_from_email(self.USER_EMAIL)
        self.auth_id = 'userauthid'

        new_model = auth_models.UserIdByFirebaseAuthIdModel(
            id=self.auth_id, user_id=self.user_id)
        new_model.update_timestamps()
        new_model.put()

        # Note: There will be a total of 2 UserSettingsModels (hence 2
        # UserAuthDetailsModels too) even though only one user signs up in the
        # test since superadmin signup is also done in
        # test_utils.AuditJobsTestBase.
        self.model_instance = (
            auth_models.UserIdByFirebaseAuthIdModel.get(self.auth_id))
        self.job_class = (
            prod_validation_jobs_one_off
            .UserIdByFirebaseAuthIdModelAuditOneOffJob)

    def test_audit_standard_operation_passes(self):
        expected_output = [
            '[u\'fully-validated UserIdByFirebaseAuthIdModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_audit_with_valid_id_passes(self):
        valid_auth_id = 'i' * 128
        self.signup('email@test.com', 'testUser')
        user_id = self.get_user_id_from_email('email@test.com')
        model_instance = auth_models.UserIdByFirebaseAuthIdModel(
            id=valid_auth_id, user_id=user_id)
        model_instance.update_timestamps()
        model_instance.put()
        expected_output = [
            '[u\'fully-validated UserIdByFirebaseAuthIdModel\', 2]',
        ]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_audit_with_id_that_is_too_long_fails(self):
        auth_id_that_is_too_long = 'i' * 129
        self.signup('email@test.com', 'testUser')
        user_id = self.get_user_id_from_email('email@test.com')
        model_instance = auth_models.UserIdByFirebaseAuthIdModel(
            id=auth_id_that_is_too_long, user_id=user_id)
        model_instance.update_timestamps()
        model_instance.put()
        expected_output = [
            u'[u\'failed validation check for model id check of '
            'UserIdByFirebaseAuthIdModel\', [u\'Entity id %s: Entity id '
            'does not match regex pattern\']]' % (auth_id_that_is_too_long,),
            '[u\'fully-validated UserIdByFirebaseAuthIdModel\', 1]',
        ]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_audit_with_created_on_greater_than_last_updated_fails(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [
            '[u\'failed validation check for time field relation check '
            'of UserIdByFirebaseAuthIdModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]' % (
                self.auth_id, self.model_instance.created_on,
                self.model_instance.last_updated)
        ]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_audit_with_last_updated_greater_than_current_time_fails(self):
        utcnow = datetime.datetime.utcnow()
        self.model_instance.last_updated = utcnow
        self.model_instance.update_timestamps(update_last_updated_time=False)
        self.model_instance.put()
        expected_output = [(
            '[u\'failed validation check for current time check of '
            'UserIdByFirebaseAuthIdModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.auth_id, self.model_instance.last_updated)]

        mocked_datetime = utcnow - datetime.timedelta(hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=False, literal_eval=False)

    def test_audit_with_missing_user_settings_model_fails(self):
        user_models.UserSettingsModel.get(self.user_id).delete()
        expected_output = [
            '[u\'failed validation check for user_settings_ids '
            'field check of UserIdByFirebaseAuthIdModel\', '
            '[u"Entity id %s: based on '
            'field user_settings_ids having value '
            '%s, expected model UserSettingsModel '
            'with id %s but it doesn\'t exist"]]' % (
                self.auth_id, self.user_id, self.user_id)
        ]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_audit_with_missing_user_auth_details_model_fails(self):
        user_models.UserAuthDetailsModel.get(self.user_id).delete()
        expected_output = [
            '[u\'failed validation check for user_auth_details_ids '
            'field check of UserIdByFirebaseAuthIdModel\', '
            '[u"Entity id %s: based on '
            'field user_auth_details_ids having value '
            '%s, expected model UserAuthDetailsModel '
            'with id %s but it doesn\'t exist"]]' % (
                self.auth_id, self.user_id, self.user_id)
        ]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)
