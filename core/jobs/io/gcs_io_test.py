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
import types


def insert_random_file(
    client,
    path,
    content,
    generation=1,
    crc32c=None,
    last_updated=None,
    fail_when_getting_metadata=False,
    fail_when_reading=False
):
    bucket, name = gcsio.parse_gcs_path(path)
    f = gcsio_test.FakeFile(
        bucket,
        name,
        content,
        generation,
        crc32c=crc32c,
        last_updated=last_updated)
    client.objects.add_file(f, fail_when_getting_metadata, fail_when_reading)
    return f


class ReadFileTest(job_test_utils.PipelinedTestBase):
    """Tests to check gcs_io.ReadFile."""

    def test_read_from_gcs(self):
        client = gcsio_test.FakeGcsClient()
        file_name = 'gs://gcsio-test/dummy_file'
        random_comtent = os.urandom(1234)
        insert_random_file(client, file_name, random_comtent)
        filenames = [file_name]
        with self.swap(gcs_io.ReadFile, 'get_client', types.MethodType(lambda _: client, gcs_io.ReadFile)):
            print("***********************")
            print(gcs_io.ReadFile.get_client())
            print(abc)
            # filename_p_collec = (
            #     self.pipeline
            #     |'Create pcoll of filenames' >> beam.Create(filenames)
            #     | 'Read file from GCS' >> gcs_io.ReadFile(client)
            # )
        # self.assert_pcoll_equal(filename_p_collec, [random_comtent])
