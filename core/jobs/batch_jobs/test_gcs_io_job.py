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

"""Tests the functionality of gcs_io."""

from __future__ import annotations

from apache_beam.io.gcp import gcsio_test
from core.jobs import base_jobs
from core.jobs.io import gcs_io
from core.jobs.transforms import job_result_transforms
from core.jobs.types import job_run_result
from core.platform import models

from typing import Optional

import apache_beam as beam

datastore_services = models.Registry.import_datastore_services()


class TestGCSIoJob(base_jobs.JobBase):
    """Read exploration files stored on GCS."""

    def __init__(
        self,
        pipeline: beam.Pipeline,
        client: Optional[gcsio_test.FakeGcsClient] = None
    ) -> None:
        super().__init__(pipeline=pipeline)
        self.client = client
        self.pipeline = pipeline

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:

        write_files_to_gcs = (
            self.pipeline
            | 'Create PCollection having test bucket and test files' >> (
                beam.Create(
                    [
                        {'file': 'gs://test-bucket/dummy_file_1', 'data': b'testing_1'},
                        {'file': 'gs://test-bucket/dummy_file_2', 'data': b'testing_2'}
                    ]
                ))
            | 'Write files to GCS' >> gcs_io.WriteFile(self.client)
            | 'print' >> beam.Map(self._print)
        )

        total_files_write = (
            write_files_to_gcs
            | 'Total number of files write to GCS' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'TOTAL FILES WRITTEN'))
        )

        read_exp_file_from_gcs = (
            self.pipeline
            | 'Create PCollection of files that needs to be fetched' >> (
                beam.Create(
                    [
                        'gs://test-bucket/dummy_file_1',
                        'gs://test-bucket/dummy_file_2'
                    ]
                ))
            | 'Read files from the GCS' >> gcs_io.ReadFile(self.client)
        )

        total_files_read = (
            read_exp_file_from_gcs
            | 'Total number of files read from GCS' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'TOTAL FILES FETCHED'))
        )

        output_files = (
            read_exp_file_from_gcs
            | 'Output the data' >> beam.Map(lambda data: (
                job_run_result.JobRunResult.as_stderr(f'The data is {data}')
            ))
        )

        return (
            (
                total_files_write,
                total_files_read,
                output_files
            )
            | 'Combine results' >> beam.Flatten()
        )
