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

"""Unit tests for jobs.io.gcs_io."""

from __future__ import annotations

from core import utils
from core.domain import user_services
from core.jobs import job_test_utils
from core.jobs.io import gcs_io
from core.platform import models

import apache_beam as beam
import result

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import app_identity_services
    from mypy_imports import storage_services

storage_services = models.Registry.import_storage_services()
app_identity_services = models.Registry.import_app_identity_services()


class ReadFileTest(job_test_utils.PipelinedTestBase):
    """Tests to check gcs_io.ReadFile."""

    def test_read_from_gcs(self) -> None:
        string = b'testing'
        bucket = app_identity_services.get_gcs_resource_bucket_name()
        storage_services.commit(bucket, 'dummy_file', string, None)
        filepaths = ['dummy_file', 'new_dummy_file']
        filepath_p_collec = (
            self.pipeline
            | 'Create pcoll of filepaths' >> beam.Create(filepaths)
            | 'Read file from GCS' >> gcs_io.ReadFile()
        )
        self.assert_pcoll_equal(filepath_p_collec, [
            result.Ok(('dummy_file', b'testing')),
            result.Err(('new_dummy_file', 'The file does not exists.'))])


class WriteFileTest(job_test_utils.PipelinedTestBase):
    """Tests to check gcs_io.WriteFile."""

    def test_write_to_gcs(self) -> None:
        string = b'testing'
        filepaths = [
            {
                'filepath': 'dummy_folder/dummy_subfolder/dummy_file_1',
                'data': string
            },
            {
                'filepath': 'dummy_folder/dummy_subfolder/dummy_file_2',
                'data': string
            }
        ]
        filepath_p_collec = (
            self.pipeline
            | 'Create pcoll of filepaths' >> beam.Create(filepaths)
            | 'Write to GCS' >> gcs_io.WriteFile()
        )
        self.assert_pcoll_equal(filepath_p_collec, [7, 7])

    def test_write_binary_files_to_gcs(self) -> None:
        binary_data = utils.convert_data_url_to_binary(
            user_services.DEFAULT_IDENTICON_DATA_URL, 'png')
        filepaths = [
            {
                'filepath': 'dummy_folder/dummy_subfolder/dummy_file_1',
                'data': binary_data
            }
        ]
        filepath_p_collec = (
            self.pipeline
            | 'Create pcoll of filepaths' >> beam.Create(filepaths)
            | 'Write to GCS' >> gcs_io.WriteFile()
        )
        self.assert_pcoll_equal(filepath_p_collec, [3681])


class DeleteFileTest(job_test_utils.PipelinedTestBase):
    """Tests to check gcs_io.DeleteFile."""

    def test_delete_files_in_gcs(self) -> None:
        file_path = 'dummy_folder/dummy_subfolder/dummy_file'
        string = b'testing'
        bucket = app_identity_services.get_gcs_resource_bucket_name()
        storage_services.commit(bucket, file_path, string, None)
        file_paths = [file_path]
        filepath_p_collec = (
            self.pipeline
            | 'Create pcoll of filepaths' >> beam.Create(file_paths)
            | 'Delete file from GCS' >> gcs_io.DeleteFile()
        )
        self.assert_pcoll_equal(filepath_p_collec, [None])
        self.assertFalse(storage_services.isfile(bucket, file_path))

    def test_check_correct_files_are_passing(self) -> None:
        file_path = 'dummy_folder/dummy_subfolder/dummy_file'
        file_paths = [file_path]

        with self.swap(
            gcs_io.DeleteFile,
            '_delete_file',
            lambda self, file_path: file_path
        ): # pylint: disable=unused-argument
            filepath_p_collec = (
                self.pipeline
                | 'Create pcoll of filepaths' >> beam.Create(file_paths)
                | 'Delete file from GCS' >> gcs_io.DeleteFile()
            )
            self.assert_pcoll_equal(filepath_p_collec, [file_path])


class GetFilesTest(job_test_utils.PipelinedTestBase):
    """Tests to check gcs_io.GetFiles."""

    def test_get_files_with_specefic_prefix(self) -> None:
        bucket = app_identity_services.get_gcs_resource_bucket_name()
        filepath_1 = 'dummy_folder/dummy_subfolder/dummy_file_1'
        filepath_2 = 'dummy_folder/dummy_subfolder/dummy_file_2'
        string = b'testing'
        storage_services.commit(
            bucket, filepath_1, string, 'application/octet-stream')
        storage_services.commit(
            bucket, filepath_2, string, 'application/octet-stream')
        prefixes = ['dummy_folder/dummy_subfolder']
        filepath_p_collec = (
            self.pipeline
            | 'Create pcoll of filepaths' >> beam.Create(prefixes)
            | 'Get files from GCS' >> gcs_io.GetFiles()
            | 'Sort the values' >> beam.Map(sorted)
        )
        self.assert_pcoll_equal(
            filepath_p_collec, [
                [
                    'dummy_folder/dummy_subfolder/dummy_file_1',
                    'dummy_folder/dummy_subfolder/dummy_file_2'
                ]
            ])

    def test_check_correct_filepath_is_passing(self) -> None:
        file_paths = ['dummy_folder/dummy_subfolder']

        with self.swap(
            gcs_io.GetFiles,
            '_get_file_with_prefix',
            lambda self, file_path: file_path
        ): # pylint: disable=unused-argument
            filepath_p_collec = (
                self.pipeline
                | 'Create pcoll of filepaths' >> beam.Create(file_paths)
                | 'Get files with prefixes from GCS' >> gcs_io.GetFiles()
            )
            self.assert_pcoll_equal(
                filepath_p_collec,
                ['dummy_folder/dummy_subfolder'])
