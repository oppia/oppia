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

from core.jobs import job_test_utils
from core.jobs.batch_jobs import test_gcs_io_job
from core.jobs.types import job_run_result
from core.platform import models
from core.platform.storage import cloud_storage_emulator

from typing import List

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import app_identity_services
    from mypy_imports import storage_services

storage_services = models.Registry.import_storage_services()
app_identity_services = models.Registry.import_app_identity_services()


class TestGCSIoWriteJobTests(job_test_utils.JobTestBase):

    JOB_CLASS = test_gcs_io_job.TestGCSIoWriteJob

    def test_to_fetch_exp_filename(self) -> None:
        self.assert_job_output_is([
            job_run_result.JobRunResult(stdout='TOTAL FILES WRITTEN SUCCESS: 2')
        ])


def write_files_to_gcs() -> List[cloud_storage_emulator.EmulatorBlob]:
    """Write dummy files to GCS."""
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

    filepath_0 = fileobjects[0]['filepath']
    assert isinstance(filepath_0, str)
    data_0 = fileobjects[0]['data']
    assert isinstance(data_0, bytes)
    filepath_1 = fileobjects[1]['filepath']
    assert isinstance(filepath_1, str)
    data_1 = fileobjects[1]['data']
    assert isinstance(data_1, bytes)

    storage_services.commit(
        bucket, filepath_0, data_0, 'application/octet-stream')
    storage_services.commit(
        bucket, filepath_1, data_1, 'application/octet-stream')

    emulator_blob_1 = cloud_storage_emulator.EmulatorBlob(
        filepath_0, data_0, 'application/octet-stream')
    emulator_blob_2 = cloud_storage_emulator.EmulatorBlob(
        filepath_1, data_1, 'application/octet-stream')

    return [emulator_blob_1, emulator_blob_2]


class TestGCSIoReadJobTests(job_test_utils.JobTestBase):

    JOB_CLASS = test_gcs_io_job.TestGCSIoReadJob

    def test_to_fetch_filename(self) -> None:
        write_files_to_gcs()
        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='TOTAL FILES FETCHED SUCCESS: 2'),
            job_run_result.JobRunResult(
                stdout='The data for file \'dummy_folder/dummy_subfolder/'
                'dummy_file_1\' is "b\'testing_1\'"'),
            job_run_result.JobRunResult(
                stdout='The data for file \'dummy_folder/dummy_subfolder/'
                'dummy_file_2\' is "b\'testing_2\'"')
        ])


class TestGCSIoGetFilesJobTests(job_test_utils.JobTestBase):

    JOB_CLASS = test_gcs_io_job.TestGcsIoGetFilesJob

    def test_to_fetch_filename(self) -> None:
        blobs = write_files_to_gcs()
        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='TOTAL PREFIXES FETCHED SUCCESS: 1'),
            job_run_result.JobRunResult(
                stdout='The data is %s' % (blobs))
        ])


class TestGCSIoDeleteJobTests(job_test_utils.JobTestBase):

    JOB_CLASS = test_gcs_io_job.TestGcsIoDeleteJob

    def test_to_delete_filenames(self) -> None:
        write_files_to_gcs()
        self.assert_job_output_is([
            job_run_result.JobRunResult(stdout='TOTAL FILES DELETED SUCCESS: 2')
        ])
