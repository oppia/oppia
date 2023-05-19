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

"""Remove profile_picture_data_url field from UserSettingsModel."""

from __future__ import annotations

from core import feconf
from core.domain import user_services
from core.jobs import job_test_utils
from core.jobs.batch_jobs import remove_profile_picture_data_url_field_jobs
from core.jobs.types import job_run_result
from core.platform import models

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import datastore_services
    from mypy_imports import user_models

(user_models,) = models.Registry.import_models([models.Names.USER])

datastore_services = models.Registry.import_datastore_services()


class MockUserSettingsModelWithProfilePicture(
    user_models.UserSettingsModel
):
    """Mock UserSettingsModel so that it allows to set
    profile_picture_data_url.
    """

    profile_picture_data_url = (
        datastore_services.TextProperty(default=None, indexed=False))


class RemoveProfilePictureFieldJobTests(job_test_utils.JobTestBase):
    """Tests for remove_profile_picture_data_url_field_jobs."""

    JOB_CLASS = (
        remove_profile_picture_data_url_field_jobs.RemoveProfilePictureFieldJob)

    def test_run_with_no_models(self) -> None:
        self.assert_job_output_is([])

    def test_model_without_profile_picture_field_works(self) -> None:
        user_1 = self.create_model(
            user_models.UserSettingsModel,
            id='test_id_1',
            email='test_1@example.com',
            username='test_1',
            roles=[
                feconf.ROLE_ID_FULL_USER, feconf.ROLE_ID_CURRICULUM_ADMIN]
        )
        self.assertNotIn('profile_picture_data_url', user_1.to_dict())
        self.assertNotIn(
            'profile_picture_data_url', user_1._values)  # pylint: disable=protected-access
        self.assertNotIn(
            'profile_picture_data_url', user_1._properties)  # pylint: disable=protected-access

        self.put_multi([user_1])
        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='USER MODELS ITERATED OR UPDATED SUCCESS: 1'
            )
        ])

        migrated_setting_model = (
            user_models.UserSettingsModel.get_by_id(user_1.id))

        self.assertNotIn(
            'profile_picture_data_url', migrated_setting_model.to_dict())
        self.assertNotIn(
            'profile_picture_data_url', migrated_setting_model._values)  # pylint: disable=protected-access
        self.assertNotIn(
            'profile_picture_data_url', migrated_setting_model._properties)  # pylint: disable=protected-access

    def test_removal_of_profile_field(self) -> None:
        with self.swap(
            user_models, 'UserSettingsModel',
            MockUserSettingsModelWithProfilePicture
        ):
            user_1 = self.create_model(
                user_models.UserSettingsModel,
                id='test_id_1',
                email='test_1@example.com',
                username='test_1',
                roles=[
                    feconf.ROLE_ID_FULL_USER, feconf.ROLE_ID_CURRICULUM_ADMIN],
                profile_picture_data_url=(
                    user_services.DEFAULT_IDENTICON_DATA_URL)
            )

            user_2 = self.create_model(
                user_models.UserSettingsModel,
                id='test_id_2',
                email='test_2@example.com',
                username='test_2',
                roles=[
                    feconf.ROLE_ID_FULL_USER, feconf.ROLE_ID_CURRICULUM_ADMIN],
                profile_picture_data_url=None
            )
            self.put_multi([user_1, user_2])

            self.assertIn(
                'profile_picture_data_url', user_1._values)  # pylint: disable=protected-access
            self.assertIn(
                'profile_picture_data_url', user_1._properties)  # pylint: disable=protected-access

            self.assertIn(
                'profile_picture_data_url', user_2._values)  # pylint: disable=protected-access
            self.assertIn(
                'profile_picture_data_url', user_2._properties)  # pylint: disable=protected-access

            self.assert_job_output_is([
                job_run_result.JobRunResult(
                    stdout='USER MODELS ITERATED OR UPDATED SUCCESS: 2'
                )
            ])

            migrated_setting_model_user_1 = (
                user_models.UserSettingsModel.get_by_id(user_1.id))
            self.assertNotIn(
                'profile_picture_data_url',
                migrated_setting_model_user_1.to_dict())
            self.assertNotIn(
                'profile_picture_data_url',
                migrated_setting_model_user_1._values)  # pylint: disable=protected-access
            self.assertNotIn(
                'profile_picture_data_url',
                migrated_setting_model_user_1._properties)  # pylint: disable=protected-access

            migrated_setting_model_user_2 = (
                user_models.UserSettingsModel.get_by_id(user_2.id))

            self.assertNotIn(
                'profile_picture_data_url',
                migrated_setting_model_user_2.to_dict())
            self.assertNotIn(
                'profile_picture_data_url',
                migrated_setting_model_user_2._values)  # pylint: disable=protected-access
            self.assertNotIn(
                'profile_picture_data_url',
                migrated_setting_model_user_2._properties)  # pylint: disable=protected-access
