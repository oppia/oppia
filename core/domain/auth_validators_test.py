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


class UserIdByFirebaseSubjectIdModelValidatorTests(
        test_utils.AuditJobsTestBase):

    USER_EMAIL = 'useremail@example.com'
    USER_NAME = 'username'

    def setUp(self):
        super(UserIdByFirebaseSubjectIdModelValidatorTests, self).setUp()
        self.maxDiff = None

        self.signup(self.USER_EMAIL, self.USER_NAME)
        self.user_id = self.get_user_id_from_email(self.USER_EMAIL)
        self.subject_id = 'mocksub1'

        new_model = auth_models.UserIdByFirebaseSubjectIdModel(
            id=self.subject_id, user_id=self.user_id)
        new_model.update_timestamps()
        new_model.put()

        # Note: There will be a total of 2 UserSettingsModels (hence 2
        # UserAuthDetailsModels too) even though only one user signs up in the
        # test since superadmin signup is also done in
        # test_utils.AuditJobsTestBase.
        self.model_instance = (
            auth_models.UserIdByFirebaseSubjectIdModel.get_by_id(
                self.subject_id))
        self.job_class = (
            prod_validation_jobs_one_off
            .UserIdByFirebaseSubjectIdModelAuditOneOffJob)

    def test_audit_standard_operation_passes(self):
        expected_output = [
            u'[u\'fully-validated UserIdByFirebaseSubjectIdModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_audit_with_created_on_greater_than_last_updated_fails(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of UserIdByFirebaseSubjectIdModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.subject_id, self.model_instance.created_on,
                self.model_instance.last_updated
            ), u'[u\'fully-validated UserIdByFirebaseSubjectIdModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_audit_with_last_updated_greater_than_current_time_fails(self):
        auth_models.UserIdByFirebaseSubjectIdModel.get_by_id(
            self.subject_id
        ).delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'UserIdByFirebaseSubjectIdModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.subject_id, self.model_instance.last_updated)]

        mocked_datetime = (
            datetime.datetime.utcnow() - datetime.timedelta(hours=13))
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=False, literal_eval=False)

    def test_audit_with_missing_user_settings_model_fails(self):
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for user_settings_ids '
                'field check of UserIdByFirebaseSubjectIdModel\', '
                '[u"Entity id %s: based on '
                'field user_settings_ids having value '
                '%s, expected model UserSettingsModel '
                'with id %s but it doesn\'t exist"]]') % (
                    self.subject_id, self.user_id, self.user_id),
            u'[u\'fully-validated UserIdByFirebaseSubjectIdModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_audit_with_missing_user_auth_details_model_fails(self):
        user_models.UserAuthDetailsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for user_auth_details_ids '
                'field check of UserIdByFirebaseSubjectIdModel\', '
                '[u"Entity id %s: based on '
                'field user_auth_details_ids having value '
                '%s, expected model UserAuthDetailsModel '
                'with id %s but it doesn\'t exist"]]') % (
                    self.subject_id, self.user_id, self.user_id),
            u'[u\'fully-validated UserIdByFirebaseSubjectIdModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)
