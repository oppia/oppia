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

"""Tests for stor_profile_images_to_gcs_jobs"""

from __future__ import annotations

from core import feconf
from core.domain import user_services
from core.jobs import job_test_utils
from core.jobs.batch_jobs import store_profile_images_to_gcs_jobs
from core.jobs.types import job_run_result
from core.platform import models

from apache_beam.io.gcp import gcsio_test

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import user_models

(user_models,) = models.Registry.import_models([models.Names.USER])

CLIENT = gcsio_test.FakeGcsClient()


class StoreProfilePictureToGCSJobTests(job_test_utils.JobTestBase):
    """Tests for StoreProfilePictureToGCSJob."""

    JOB_CLASS = store_profile_images_to_gcs_jobs.StoreProfilePictureToGCSJob

    def setUp(self) -> None:
        super().setUp()
        self.client = CLIENT
        self.job = self.JOB_CLASS(self.pipeline, self.client)

        self.user_1 = self.create_model(
            user_models.UserSettingsModel,
            id='test_id_1',
            email='test_1@example.com',
            username='test_1',
            roles=[feconf.ROLE_ID_FULL_USER, feconf.ROLE_ID_CURRICULUM_ADMIN],
            profile_picture_data_url=user_services.DEFAULT_IDENTICON_DATA_URL
        )

    def test_run_with_no_models(self) -> None:
        self.assert_job_output_is([])

    def test_profile_picture_stored_to_gcs(self) -> None:
        self.put_multi([self.user_1])
        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='TOTAL PNG IMAGES SUCCESS: 1'
            ),
            job_run_result.JobRunResult(
                stdout='TOTAL WEBP IMAGES SUCCESS: 1'
            )
        ])
