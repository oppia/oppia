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

"""Tests for gcs_io."""

from __future__ import annotations

from apache_beam.io.gcp import gcsio_test
from core import feconf
from core.constants import constants
from core.domain import state_domain
from core.jobs import job_test_utils
from core.jobs.batch_jobs import test_gcs_io_job
from core.jobs.io import gcs_io_test
from core.platform import models

import os

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import app_identity_services
    from mypy_imports import exp_models

datastore_services = models.Registry.import_datastore_services()
app_identity_services = models.Registry.import_app_identity_services()

(exp_models,) = models.Registry.import_models([models.Names.EXPLORATION])


class TestGCSIoJobTests(job_test_utils.JobTestBase):

    JOB_CLASS = test_gcs_io_job.TestGCSIoJob

    EXPLORATION_ID_1 = '1'
    EXP_1_STATE_1 = state_domain.State.create_default_state(
        'EXP_1_STATE_1', is_initial_state=True).to_dict()

    def setUp(self):
        super().setUp()
        self.exp = self.create_model(
            exp_models.ExplorationModel,
            id=self.EXPLORATION_ID_1,
            title='title',
            init_state_name=feconf.DEFAULT_INIT_STATE_NAME,
            category=feconf.DEFAULT_EXPLORATION_CATEGORY,
            objective=feconf.DEFAULT_EXPLORATION_OBJECTIVE,
            language_code=constants.DEFAULT_LANGUAGE_CODE,
            tags=['Topic'],
            blurb='blurb',
            author_notes='author notes',
            states_schema_version=feconf.CURRENT_STATE_SCHEMA_VERSION,
            param_specs={},
            param_changes=[],
            auto_tts_enabled=feconf.DEFAULT_AUTO_TTS_ENABLED,
            correctness_feedback_enabled=False,
            states={'EXP_1_STATE_1': self.EXP_1_STATE_1}
        )

        self.client = gcsio_test.FakeGcsClient()
        self.job = self.JOB_CLASS(self.pipeline, self.client)

    def test_run_with_no_models(self) -> None:
        self.assert_job_output_is([])

    def test_to_fetch_exp_filename(self) -> None:
        bucket_name = app_identity_services.get_gcs_resource_bucket_name()
        filename = (
            f'gs://{bucket_name}/exploration/{self.EXPLORATION_ID_1}/'
            'some_image.png')
        random_content = os.urandom(1234)
        gcs_io_test.insert_random_file(self.client, filename, random_content)
