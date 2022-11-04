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
from core.constants import constants
from core.jobs import job_test_utils
from core.jobs.batch_jobs import user_settings_profile_picture_jobs
from core.jobs.types import job_run_result
from core.platform import models

import os

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import user_models

datastore_services = models.Registry.import_datastore_services()

(user_models,) = models.Registry.import_models([models.Names.USER])


class AuditInvalidProfilePictureJobTests(job_test_utils.JobTestBase):
    """"""

    JOB_CLASS = user_settings_profile_picture_jobs.AuditInvalidProfilePictureJob

    BASE64_str = (
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

    def setUp(self):
        super().setUp()

        self.user_1 = self.create_model(
            user_models.UserSettingsModel,
            id='test_id',
            email='test@example.com',
            username='test',
            roles=[feconf.ROLE_ID_FULL_USER,feconf.ROLE_ID_CURRICULUM_ADMIN],
            profile_picture_data_url = self.BASE64_str
        )

        self.user_2 = self.create_model(
            user_models.UserSettingsModel,
            id='test_id_2',
            email='testing@example.com',
            username='test_2',
            roles=[feconf.ROLE_ID_FULL_USER,feconf.ROLE_ID_CURRICULUM_ADMIN],
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
                    'The username is test and the invalid image details '
                    'are [\'wrong dimensions - height = 256 and width = 256\'].'
                )
            )
        ])

    def test_get_invalid_image_dimension_data(self) -> None:
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
