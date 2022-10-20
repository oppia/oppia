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

"""Unit tests for jobs.batch_jobs.model_validation_jobs."""

from __future__ import annotations

from core import feconf
from core.jobs import job_test_utils
from core.jobs.batch_jobs import model_validation_jobs
from core.jobs.transforms.validation import base_validation
from core.jobs.types import base_validation_errors
from core.jobs.types import model_property
from core.platform import models

from typing import Final, Type

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import auth_models
    from mypy_imports import base_models
    from mypy_imports import user_models

(auth_models, base_models, user_models) = models.Registry.import_models([
    models.Names.AUTH, models.Names.BASE_MODEL, models.Names.USER
])


class AuditAllStorageModelsJobTests(job_test_utils.JobTestBase):

    JOB_CLASS: Type[
        model_validation_jobs.AuditAllStorageModelsJob
    ] = model_validation_jobs.AuditAllStorageModelsJob

    VALID_USER_ID: Final = 'uid_%s' % (
        'a' * feconf.USER_ID_RANDOM_PART_LENGTH
    )

    def test_empty_storage(self) -> None:
        self.assert_job_output_is_empty()

    def test_base_validation(self) -> None:
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

        self.put_multi([
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

    def test_user_audits(self) -> None:
        user_settings_model_with_invalid_id = self.create_model(
            user_models.UserSettingsModel,
            id='128', email='a@a.com')
        user_settings_model_with_valid_id = self.create_model(
            user_models.UserSettingsModel,
            id=self.VALID_USER_ID, email='a@a.com')

        self.put_multi([
            user_settings_model_with_invalid_id,
            user_settings_model_with_valid_id,
        ])

        self.assert_job_output_is([
            base_validation_errors.ModelIdRegexError(
                user_settings_model_with_invalid_id, feconf.USER_ID_REGEX),
        ])

    def test_reports_error_when_id_property_target_does_not_exist(self) -> None:
        self.put_multi([
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

    def test_empty_when_id_property_target_exists(self) -> None:
        self.put_multi([
            self.create_model(
                user_models.UserEmailPreferencesModel, id=self.VALID_USER_ID),
            self.create_model(
                user_models.UserSettingsModel,
                id=self.VALID_USER_ID, email='a@a.com'),
        ])

        self.assert_job_output_is_empty()

    def test_empty_when_web_of_id_property_targets_exist(self) -> None:
        self.put_multi([
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

    def test_reports_missing_id_property_target_even_if_sibling_property_is_valid(  # pylint: disable=line-too-long
        self
    ) -> None:
        self.put_multi([
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
