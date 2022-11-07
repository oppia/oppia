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
from core.jobs.types import job_run_result
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

    def setUp(self) -> None:
        super().setUp()

        self.client = gcsio_test.FakeGcsClient()
        self.job = self.JOB_CLASS(self.pipeline, self.client)

    def test_to_fetch_exp_filename(self) -> None:
        self.assert_job_output_is([
            job_run_result.JobRunResult(stdout='TOTAL FILES WRITTEN SUCCESS: 1')
        ])
