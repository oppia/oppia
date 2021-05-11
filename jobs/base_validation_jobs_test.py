# coding: utf-8
#
# Copyright 2021 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for jobs.base_validation_jobs."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.platform import models
import feconf
from jobs import base_validation_jobs
from jobs import job_options
from jobs import job_test_utils
from jobs.transforms import base_validation
from jobs.types import base_validation_errors
from jobs.types import model_property

from apache_beam import runners
from apache_beam.testing import test_pipeline

(auth_models, base_models, user_models) = models.Registry.import_models(
    [models.NAMES.auth, models.NAMES.base_model, models.NAMES.user])


class AuditAllStorageModelsJobTests(job_test_utils.JobTestBase):

    JOB_CLASS = base_validation_jobs.AuditAllStorageModelsJob

    VALID_USER_ID = 'uid_%s' % ('a' * feconf.USER_ID_RANDOM_PART_LENGTH)

    def test_empty_storage(self):
        self.assert_job_output_is_empty()

    def test_run_with_empty_model_getter(self):
        pipeline = test_pipeline.TestPipeline(
            runner=runners.DirectRunner(),
            options=job_options.JobOptions(model_getter=None))

        self.assertRaisesRegexp(
            ValueError, 'JobOptions.model_getter must not be None',
            base_validation_jobs.AuditAllStorageModelsJob(pipeline).run)

    def test_base_validation(self):
        base_model_with_invalid_id = self.create_model(
            base_models.BaseModel, id='123@?!*', deleted=False)
        base_model_with_invalid_timestamps = self.create_model(
            base_models.BaseModel, id='124', deleted=False,
            created_on=self.NOW, last_updated=self.YEAR_LATER)
        base_model_with_inconsistent_timestamps = self.create_model(
            base_models.BaseModel, id='125', deleted=False,
            created_on=self.YEAR_LATER, last_updated=self.YEAR_AGO)
        expired_base_model = self.create_model(
            base_models.BaseModel, id='126', deleted=True)
        valid_base_model = self.create_model(
            base_models.BaseModel, id='127', deleted=False)

        self.model_io_stub.put_multi([
            base_model_with_invalid_id,
            base_model_with_invalid_timestamps,
            base_model_with_inconsistent_timestamps,
            expired_base_model,
            valid_base_model,
        ])

        self.assert_job_output_is([
            base_validation_errors.ModelIdRegexError(
                base_model_with_invalid_id,
                base_validation.BASE_MODEL_ID_PATTERN),
            base_validation_errors.ModelMutatedDuringJobError(
                base_model_with_invalid_timestamps),
            base_validation_errors.InconsistentTimestampsError(
                base_model_with_inconsistent_timestamps),
            base_validation_errors.ModelExpiredError(expired_base_model),
        ])

    def test_user_audits(self):
        user_settings_model_with_invalid_id = self.create_model(
            user_models.UserSettingsModel,
            id='128', email='a@a.com')
        user_settings_model_with_valid_id = self.create_model(
            user_models.UserSettingsModel,
            id=self.VALID_USER_ID, email='a@a.com')

        self.model_io_stub.put_multi([
            user_settings_model_with_invalid_id,
            user_settings_model_with_valid_id,
        ])

        self.assert_job_output_is([
            base_validation_errors.ModelIdRegexError(
                user_settings_model_with_invalid_id, feconf.USER_ID_REGEX),
        ])

    def test_reports_error_when_id_property_target_does_not_exist(self):
        self.model_io_stub.put_multi([
            # UserEmailPreferencesModel.id -> UserSettingsModel.id.
            self.create_model(
                user_models.UserEmailPreferencesModel, id=self.VALID_USER_ID),
            # UserSettingsModel missing.
        ])

        self.assert_job_output_is([
            base_validation_errors.ModelRelationshipError(
                model_property.ModelProperty(
                    user_models.UserEmailPreferencesModel,
                    user_models.UserEmailPreferencesModel.id),
                self.VALID_USER_ID, 'UserSettingsModel', self.VALID_USER_ID),
        ])

    def test_empty_when_id_property_target_exists(self):
        self.model_io_stub.put_multi([
            self.create_model(
                user_models.UserEmailPreferencesModel, id=self.VALID_USER_ID),
            self.create_model(
                user_models.UserSettingsModel,
                id=self.VALID_USER_ID, email='a@a.com'),
        ])

        self.assert_job_output_is_empty()

    def test_empty_when_web_of_id_property_targets_exist(self):
        self.model_io_stub.put_multi([
            self.create_model(
                auth_models.UserAuthDetailsModel,
                id=self.VALID_USER_ID, firebase_auth_id='abc', gae_id='123'),
            self.create_model(
                auth_models.UserIdByFirebaseAuthIdModel,
                id='abc', user_id=self.VALID_USER_ID),
            self.create_model(
                auth_models.UserIdentifiersModel,
                id='123', user_id=self.VALID_USER_ID),
        ])

        self.assert_job_output_is_empty()

    def test_reports_missing_id_property_target_even_if_sibling_property_is_valid(self): # pylint: disable=line-too-long
        self.model_io_stub.put_multi([
            self.create_model(
                auth_models.UserAuthDetailsModel, id=self.VALID_USER_ID,
                # Value is not None, so UserIdentifiersModel must exist.
                gae_id='abc',
                # Value is None, so missing UserIdByFirebaseAuthIdModel is OK.
                firebase_auth_id=None),
            self.create_model(
                auth_models.UserIdentifiersModel, user_id=self.VALID_USER_ID,
                # Should be gae_id='abc', so error will occur.
                id='123'),
        ])

        self.assert_job_output_is([
            base_validation_errors.ModelRelationshipError(
                model_property.ModelProperty(
                    auth_models.UserAuthDetailsModel,
                    auth_models.UserAuthDetailsModel.gae_id),
                self.VALID_USER_ID, 'UserIdentifiersModel', 'abc'),
        ])
