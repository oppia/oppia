# coding: utf-8
#
# Copyright 2022 The Oppia Authors. All Rights Reserved.
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

"""Tests for user_settings_profile_picture_jobs."""

from __future__ import annotations

from core import feconf
from core.domain import user_services
from core.jobs import job_test_utils
from core.jobs.batch_jobs import user_settings_profile_picture_jobs
from core.jobs.types import job_run_result
from core.platform import models

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import user_models

datastore_services = models.Registry.import_datastore_services()

(user_models,) = models.Registry.import_models([models.Names.USER])


BASE64_STR = (
    'iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAIAAADTED8xAAADMElEQVR4nOz'
    'VwQnAIBQFQYXff81RUkQCOyDj1YOPnbXWPmeTRef+/3O/OyBjzh3CD95Bfq'
    'ICMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CM'
    'K0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0C'
    'MK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0'
    'CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK'
    '0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CM'
    'K0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0C'
    'MK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0'
    'CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK'
    '0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CM'
    'K0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0C'
    'MK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0'
    'CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK'
    '0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CM'
    'K0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0C'
    'MK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0'
    'CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK'
    '0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CM'
    'K0CMK0CMO0TAAD//2Anhf4QtqobAAAAAElFTkSuQmCC'
)


class AuditInvalidProfilePictureJobTests(job_test_utils.JobTestBase):
    """Fetch invalid profile pictures data."""

    JOB_CLASS = user_settings_profile_picture_jobs.AuditInvalidProfilePictureJob

    def setUp(self) -> None:
        super().setUp()

        self.user_1 = self.create_model(
            user_models.UserSettingsModel,
            id='test_id_1',
            email='test_1@example.com',
            username='test_1',
            roles=[feconf.ROLE_ID_FULL_USER, feconf.ROLE_ID_CURRICULUM_ADMIN],
            profile_picture_data_url=BASE64_STR
        )

        self.user_2 = self.create_model(
            user_models.UserSettingsModel,
            id='test_id_2',
            email='test_2@example.com',
            username='test_2',
            roles=[feconf.ROLE_ID_FULL_USER, feconf.ROLE_ID_CURRICULUM_ADMIN],
        )

    def test_run_with_no_models(self) -> None:
        self.assert_job_output_is([])

    def test_get_invalid_image_dimension_data(self) -> None:
        self.put_multi([self.user_1])
        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='TOTAL INVALID IMAGES SUCCESS: 1'
            ),
            job_run_result.JobRunResult(
                stderr=(
                    'The username is test_1 and the invalid image details '
                    'are [\'wrong dimensions - height = 256 and width = 256\'].'
                )
            )
        ])

    def test_get_invalid_image_base64_data(self) -> None:
        self.put_multi([self.user_2])
        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='TOTAL INVALID IMAGES SUCCESS: 1'
            ),
            job_run_result.JobRunResult(
                stderr=(
                    'The username is test_2 and the invalid image details '
                    'are [\'Image is not base64 having value - None\'].'
                )
            )
        ])

    def test_ignore_valid_images(self) -> None:
        self.user_1.profile_picture_data_url = (
            user_services.DEFAULT_IDENTICON_DATA_URL)
        self.put_multi([self.user_1])
        self.assert_job_output_is([])


class FixInvalidProfilePictureJobTests(job_test_utils.JobTestBase):
    """Tests to check the fixing of invalid profile picture."""

    JOB_CLASS = user_settings_profile_picture_jobs.FixInvalidProfilePictureJob

    def setUp(self) -> None:
        super().setUp()

        self.user_3 = self.create_model(
            user_models.UserSettingsModel,
            id='test_id_3',
            email='test_3@example.com',
            username='test_3',
            roles=[feconf.ROLE_ID_FULL_USER, feconf.ROLE_ID_CURRICULUM_ADMIN],
            profile_picture_data_url=BASE64_STR
        )

        self.user_4 = self.create_model(
            user_models.UserSettingsModel,
            id='test_id_4',
            email='test_4@example.com',
            username='test_4',
            roles=[feconf.ROLE_ID_FULL_USER, feconf.ROLE_ID_CURRICULUM_ADMIN],
        )

    def test_run_with_no_models(self) -> None:
        self.assert_job_output_is([])

    def test_iterate_user_model_with_valid_profile_picture(self) -> None:
        self.put_multi([self.user_3])
        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='USER MODELS ITERATED SUCCESS: 1'
            )
        ])

        migrated_user_model_1 = (
            user_models.UserSettingsModel.get(self.user_3.id)
        )

        self.assertEqual(
            migrated_user_model_1.profile_picture_data_url,
            BASE64_STR
        )

    def test_update_user_model_with_invalid_profile_picture(self) -> None:
        self.put_multi([self.user_4])
        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='USER MODELS ITERATED SUCCESS: 1'
            )
        ])

        migrated_user_model_2 = (
            user_models.UserSettingsModel.get(self.user_4.id)
        )

        self.assertEqual(
            migrated_user_model_2.profile_picture_data_url,
            user_services.fetch_gravatar(migrated_user_model_2.email)
        )
