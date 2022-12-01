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

from typing import List

MYPY = False
if MYPY:  # pragma: no cover
    from core.jobs.io import gcs_io
    from mypy_imports import app_identity_services
    from mypy_imports import storage_services

storage_services = models.Registry.import_storage_services()
app_identity_services = models.Registry.import_app_identity_services()

BUCKET = app_identity_services.get_gcs_resource_bucket_name()


class TestGCSIoWriteJobTests(job_test_utils.JobTestBase):

    JOB_CLASS = test_gcs_io_job.TestGCSIoWriteJob

    def test_to_write_data_in_files(self) -> None:
        self.assert_job_output_is([
            job_run_result.JobRunResult(stdout='TOTAL FILES WRITTEN SUCCESS: 2')
        ])

        file_path_1 = 'dummy_folder/dummy_subfolder/dummy_file_1'
        file_path_2 = 'dummy_folder/dummy_subfolder/dummy_file_2'
        data_1 = b'testing_1'
        data_2 = b'testing_2'
        self.assertEqual(storage_services.get(BUCKET, file_path_1), data_1)
        self.assertEqual(storage_services.get(BUCKET, file_path_2), data_2)


def write_files_to_gcs() -> List[str]:
    """Write dummy files to GCS."""

    file_objects: List[gcs_io.FileObjectDict] = [
        {
            'filepath': 'dummy_folder/dummy_subfolder/dummy_file_1',
            'data': b'testing_1'
        },
        {
            'filepath': 'dummy_folder/dummy_subfolder/dummy_file_2',
            'data': b'testing_2'
        }
    ]

    filepath_0 = file_objects[0]['filepath']
    data_0 = file_objects[0]['data']
    filepath_1 = file_objects[1]['filepath']
    data_1 = file_objects[1]['data']

    storage_services.commit(
        BUCKET, filepath_0, data_0, 'application/octet-stream')
    storage_services.commit(
        BUCKET, filepath_1, data_1, 'application/octet-stream')

    return [
        'dummy_folder/dummy_subfolder/dummy_file_1',
        'dummy_folder/dummy_subfolder/dummy_file_2']


class TestGCSIoReadJobTests(job_test_utils.JobTestBase):

    JOB_CLASS = test_gcs_io_job.TestGCSIoReadJob

    def test_to_read_file_data(self) -> None:
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

    def setUp(self) -> None:
        super().setUp()
        self.filepath3 = 'dummy_folder/dummy_subfolder/dummy_file_3'
        self.filepath4 = 'dummy_folder/dummy_subfolder/dummy_file_4'
        storage_services.commit(
            BUCKET, self.filepath3, b'testing_3', 'application/octet-stream')
        storage_services.commit(
            BUCKET, self.filepath4, b'testing_4', 'application/octet-stream')

    def test_to_fetch_filename(self) -> None:
        blobs = write_files_to_gcs()
        blobs.append(self.filepath3)
        blobs.append(self.filepath4)
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
        file_paths = [
            'dummy_folder/dummy_subfolder/dummy_file_1',
            'dummy_folder/dummy_subfolder/dummy_file_2']
        for file_path in file_paths:
            self.assertFalse(storage_services.isfile(BUCKET, file_path))
