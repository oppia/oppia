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

from core.jobs import job_test_utils
from core.jobs.io import gcs_io
from core.platform import models

import apache_beam as beam
from apache_beam.io.gcp import gcsio
from apache_beam.io.gcp import gcsio_test

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import app_identity_services

app_identity_services = models.Registry.import_app_identity_services()


def insert_random_file(
    client: gcsio_test.FakeGcsClient,
    path: str,
    content: bytes,
    generation: int = 1
) -> gcsio_test.FakeFile:
    """Insert random file into FakeGcsClient.

    Args:
        client: FakeGcsClient. The fake GCS client for testing purpose.
        path: str. The file path to where store the content.
        content: bytes. The content to store.
        generation: int. The file generation.

    Returns:
        file: FakeFile. The FakeFile that is stored to FakeGcs.
    """
    bucket, name = gcsio.parse_gcs_path(path)
    file = gcsio_test.FakeFile(bucket, name, content, generation)
    client.objects.add_file(file)
    return file


class ReadFileTest(job_test_utils.PipelinedTestBase):
    """Tests to check gcs_io.ReadFile."""

    def test_read_from_gcs(self) -> None:
        client = gcsio_test.FakeGcsClient()
        bucket = app_identity_services.get_gcs_resource_bucket_name()
        gcs_url = f'gs://{bucket}/dummy_file'
        string = b'testing'
        insert_random_file(client, gcs_url, string)
        filepaths = ['dummy_file']
        filepath_p_collec = (
            self.pipeline
            | 'Create pcoll of filepaths' >> beam.Create(filepaths)
            | 'Read file from GCS' >> gcs_io.ReadFile(client)
        )
        self.assert_pcoll_equal(filepath_p_collec, [string])


class WriteFileTest(job_test_utils.PipelinedTestBase):
    """Tests to check gcs_io.WriteFile."""

    def test_write_to_gcs(self) -> None:
        client = gcsio_test.FakeGcsClient()
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
            | 'Write to GCS' >> gcs_io.WriteFile(client)
        )
        self.assert_pcoll_equal(filepath_p_collec, [7, 7])


class DeleteFileTest(job_test_utils.PipelinedTestBase):
    """Tests to check gcs_io.DeleteFile."""

    def test_delete_files_in_gcs(self) -> None:
        client = gcsio_test.FakeGcsClient()
        bucket = app_identity_services.get_gcs_resource_bucket_name()
        gcs_url = f'gs://{bucket}/dummy_folder/dummy_subfolder/dummy_file'
        string = b'testing'
        insert_random_file(client, gcs_url, string)
        file_paths = ['dummy_folder/dummy_subfolder/dummy_file']
        filepath_p_collec = (
            self.pipeline
            | 'Create pcoll of filepaths' >> beam.Create(file_paths)
            | 'Delete file from GCS' >> gcs_io.DeleteFile(client)
        )
        self.assert_pcoll_equal(filepath_p_collec, [None])

    def _mock_delete(self, filepath: str) -> None:
        """Mock function to check if files are passing correctly.

        Args:
            filepath: str. The filepath name.
        """
        bucket = app_identity_services.get_gcs_resource_bucket_name()
        gcs_url = f'gs://{bucket}/dummy_folder/dummy_subfolder/dummy_file'
        self.assertEqual(filepath, gcs_url)

    def test_check_correct_files_are_passing(self) -> None:
        client = gcsio_test.FakeGcsClient()
        bucket = app_identity_services.get_gcs_resource_bucket_name()
        gcs_url = f'gs://{bucket}/dummy_folder/dummy_subfolder/dummy_file'
        string = b'testing'
        insert_random_file(client, gcs_url, string)
        file_paths = ['dummy_folder/dummy_subfolder/dummy_file']
        with self.swap(gcsio.GcsIO, 'delete', self._mock_delete):
            filepath_p_collec = (
                self.pipeline
                | 'Create pcoll of filepaths' >> beam.Create(file_paths)
                | 'Delete file from GCS' >> gcs_io.DeleteFile(client)
            )
            self.assert_pcoll_equal(filepath_p_collec, [None])


class GetFilesTest(job_test_utils.PipelinedTestBase):
    """Tests to check gcs_io.GetFiles."""

    def test_get_files_with_specefic_prefix(self) -> None:
        client = gcsio_test.FakeGcsClient()
        bucket = app_identity_services.get_gcs_resource_bucket_name()
        gcs_url_1 = f'gs://{bucket}/dummy_folder/dummy_subfolder/dummy_file_1'
        gcs_url_2 = f'gs://{bucket}/dummy_folder/dummy_subfolder/dummy_file_2'
        string = b'testing'
        insert_random_file(client, gcs_url_1, string)
        insert_random_file(client, gcs_url_2, string)
        file_paths = ['dummy_folder/dummy_subfolder']
        filepath_p_collec = (
            self.pipeline
            | 'Create pcoll of filepaths' >> beam.Create(file_paths)
            | 'Get files from GCS' >> gcs_io.GetFiles(client)
        )
        self.assert_pcoll_equal(
            filepath_p_collec, [
                {
                    'gs://dev-project-id-resources/dummy_folder/'
                    'dummy_subfolder/dummy_file_1': 7,
                    'gs://dev-project-id-resources/dummy_folder/'
                    'dummy_subfolder/dummy_file_2': 7
                }
            ])

    def _mock_list_prefix(self, filepath: str) -> None:
        """Mock function to check if files are passing correctly.

        Args:
            filepath: str. The filepath name.
        """
        bucket = app_identity_services.get_gcs_resource_bucket_name()
        file_path_prefix = f'gs://{bucket}/dummy_folder/dummy_subfolder'
        self.assertEqual(filepath, file_path_prefix)

    def test_check_correct_filepath_is_passing(self) -> None:
        client = gcsio_test.FakeGcsClient()
        bucket = app_identity_services.get_gcs_resource_bucket_name()
        gcs_url_1 = f'gs://{bucket}/dummy_folder/dummy_subfolder/dummy_file_1'
        string = b'testing'
        insert_random_file(client, gcs_url_1, string)
        file_paths = ['dummy_folder/dummy_subfolder']
        with self.swap(gcsio.GcsIO, 'list_prefix', self._mock_list_prefix):
            filepath_p_collec = (
                self.pipeline
                | 'Create pcoll of filepaths' >> beam.Create(file_paths)
                | 'Delete file from GCS' >> gcs_io.GetFiles(client)
            )
            self.assert_pcoll_equal(
                filepath_p_collec, [None])
