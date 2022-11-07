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
from apache_beam.io.gcp import gcsio_test
from apache_beam.io.gcp import gcsio

import os
import apache_beam as beam


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
        content: bytes: The content to store.
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
        file_name = 'gs://gcsio-test/dummy_file'
        string = b'testing'
        insert_random_file(client, file_name, string)
        filenames = [file_name]
        filename_p_collec = (
            self.pipeline
            |'Create pcoll of filenames' >> beam.Create(filenames)
            | 'Read file from GCS' >> gcs_io.ReadFile(client)
        )
        self.assert_pcoll_equal(filename_p_collec, [string])


class WriteFileTest(job_test_utils.PipelinedTestBase):
    """Tests to check gcs_io.WriteFile."""

    def test_write_to_gcs(self) -> None:
        client = gcsio_test.FakeGcsClient()
        file_name_1 = 'gs://gcsio-test/dummy_file_1'
        file_name_2 = 'gs://gcsio-test/dummy_file_2'
        string = b'testing'
        filenames = [
            {'file': file_name_1, 'data': string},
            {'file': file_name_2, 'data': string}
        ]
        filename_p_collec = (
            self.pipeline
            |'Create pcoll of filenames' >> beam.Create(filenames)
            |'Write to GCS' >> gcs_io.WriteFile(client)
        )
        self.assert_pcoll_equal(filename_p_collec, [7, 7])


class ReadWriteFileToGCSTest(job_test_utils.PipelinedTestBase):
    """Read and write file to GCS."""

    def test_read_and_write_file_to_gcs(self) -> None:
        client = gcsio_test.FakeGcsClient()
        file_name_1 = 'gs://gcsio-test/dummy_file_1'
        file_name_2 = 'gs://gcsio-test/dummy_file_2'
        string = b'testing'
        filenames = [
            {'file': file_name_1, 'data': string},
            {'file': file_name_2, 'data': string}
        ]
        filename_p_collec_write = (
            self.pipeline
            |'Create pcoll of filenames to write' >> beam.Create(filenames)
            |'Write to GCS' >> gcs_io.WriteFile(client)
        )
        self.assert_pcoll_equal(filename_p_collec_write, [7, 7])

        filename_p_collec_read = (
            self.pipeline
            |'Create pcoll of filenames to read' >> beam.Create(filenames)
            | 'Read file from GCS' >> gcs_io.ReadFile(client)
        )
        self.assert_pcoll_equal(filename_p_collec_read, [string, string])
