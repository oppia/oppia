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
    from mypy_imports import user_models

(user_models,) = models.Registry.import_models([models.Names.USER])


class RemoveProfilePictureFieldJobTests(job_test_utils.JobTestBase):
    """Tests for remove_profile_picture_data_url_field_jobs."""

    JOB_CLASS = (
        remove_profile_picture_data_url_field_jobs.RemoveProfilePictureFieldJob)

    def setUp(self) -> None:
        super().setUp()

        self.user_1 = self.create_model(
            user_models.UserSettingsModel,
            id='test_id_1',
            email='test_1@example.com',
            username='test_1',
            roles=[feconf.ROLE_ID_FULL_USER, feconf.ROLE_ID_CURRICULUM_ADMIN],
            profile_picture_data_url=user_services.DEFAULT_IDENTICON_DATA_URL
        )

        self.user_2 = self.create_model(
            user_models.UserSettingsModel,
            id='test_id_2',
            email='test_2@example.com',
            username='test_2',
            roles=[feconf.ROLE_ID_FULL_USER, feconf.ROLE_ID_CURRICULUM_ADMIN],
        )

    def test_removal_of_profile_field(self) -> None:
        self.put_multi([self.user_1, self.user_2])

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='USER MODELS UPDATED SUCCESS: 2'
            )
        ])
        print("********************************")
        print(self.user_1.id)
        print(self.user_1.profile_picture_data_url)
        print(abc)
