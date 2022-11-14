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

from core.platform import models

from core.jobs import job_test_utils
from core.jobs.batch_jobs import test_gcs_io_job
from core.jobs.types import job_run_result

from apache_beam.io.gcp import gcsio
from apache_beam.io.gcp import gcsio_test

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import app_identity_services

app_identity_services = models.Registry.import_app_identity_services()

CLIENT = gcsio_test.FakeGcsClient()


class TestGCSIoWriteJobTests(job_test_utils.JobTestBase):

    JOB_CLASS = test_gcs_io_job.TestGCSIoWriteJob

    def setUp(self) -> None:
        super().setUp()

        self.client = CLIENT
        self.job = self.JOB_CLASS(self.pipeline, self.client)

    def test_to_fetch_exp_filename(self) -> None:
        self.assert_job_output_is([
            job_run_result.JobRunResult(stdout='TOTAL FILES WRITTEN SUCCESS: 2')
        ])


class TestGCSIoReadJobTests(job_test_utils.JobTestBase):

    JOB_CLASS = test_gcs_io_job.TestGCSIoReadJob

    def setUp(self) -> None:
        super().setUp()

        self.client = CLIENT
        self.job = self.JOB_CLASS(self.pipeline, self.client)

    def test_to_fetch_exp_filename(self) -> None:
        gcs = gcsio.GcsIO(self.client)
        bucket = app_identity_services.get_gcs_resource_bucket_name()
        fileobjects = [
            {
                'filepath': 'dummy_folder/dummy_subfolder/dummy_file_1',
                'data': b'testing_1'
            },
            {
                'filepath': 'dummy_folder/dummy_subfolder/dummy_file_2',
                'data': b'testing_2'
            }
        ]

        for file_obj in fileobjects:
            filepath = file_obj['filepath']
            gcs_url = 'gs://%s/%s' % (bucket, filepath)
            file = gcs.open(
                filename=gcs_url,
                mode='wb',
                mime_type='application/octet-stream')
            file.write(file_obj['data'])
            file.close()

        self.assert_job_output_is([
            job_run_result.JobRunResult(stdout='TOTAL FETCHED SUCCESS: 2')
        ])
