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

from core.jobs import base_jobs
from core.jobs.io import gcs_io
from core.jobs.transforms import job_result_transforms
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam

datastore_services = models.Registry.import_datastore_services()


class TestGCSIoWriteJob(base_jobs.JobBase):
    """Write dummy files to GCS."""

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        write_files_to_gcs = (
            self.pipeline
            | 'Create PCollection having test bucket and test files' >> (
                beam.Create(
                    [
                        {
                            'filepath': (
                                'dummy_folder/dummy_subfolder/dummy_file_1'),
                            'data': b'testing_1'
                        },
                        {
                            'filepath': (
                                'dummy_folder/dummy_subfolder/dummy_file_2'),
                            'data': b'testing_2'
                        }
                    ]
                ))
            | 'Write files to GCS' >> gcs_io.WriteFile()
        )

        total_files_write = (
            write_files_to_gcs
            | 'Total number of files write to GCS' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'TOTAL FILES WRITTEN'))
        )

        return total_files_write


class TestGCSIoReadJob(base_jobs.JobBase):
    """Read dummy files from GCS."""

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        read_files_from_gcs = (
            self.pipeline
            | 'Create PCollection of files that needs to be fetched' >> (
                beam.Create(
                    [
                        'dummy_folder/dummy_subfolder/dummy_file_1',
                        'dummy_folder/dummy_subfolder/dummy_file_2'
                    ]
                ))
            | 'Read files from the GCS' >> gcs_io.ReadFile()
        )

        total_files_read = (
            read_files_from_gcs
            | 'Total number of files read from GCS' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'TOTAL FILES FETCHED'))
        )

        output_files = (
            read_files_from_gcs
            | 'Output the data' >> beam.Map(lambda data: (
                job_run_result.JobRunResult.as_stdout(
                    f'The data for file \'{data[0]}\' is "{data[1]}"')
            ))
        )

        return (
            (
                total_files_read,
                output_files
            )
            | 'Combine results' >> beam.Flatten()
        )


class TestGcsIoGetFilesJob(base_jobs.JobBase):
    """Get all files with a specefic prefix."""

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        get_files_of_specefic_prefix_from_gcs = (
            self.pipeline
            | 'Create PCollection of prefix that needs to be fetched' >> (
                beam.Create(['dummy_folder/dummy_subfolder']))
            | 'Get files with prefix' >> gcs_io.GetFiles()
            | 'Sort the file paths' >> beam.Map(sorted)
        )

        total_files_with_prefixes = (
            get_files_of_specefic_prefix_from_gcs
            | 'Total number of prefixes fetched from GCS' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'TOTAL PREFIXES FETCHED'))
        )

        output = (
            get_files_of_specefic_prefix_from_gcs
            | 'Output the prefix data' >> beam.Map(lambda data: (
                job_run_result.JobRunResult.as_stdout(f'The data is {data}')
            ))
        )

        return (
            (
                total_files_with_prefixes,
                output
            )
            | 'Combine results' >> beam.Flatten()
        )


class TestGcsIoDeleteJob(base_jobs.JobBase):
    """Delete dummy files from GCS."""

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        delete_files_from_gcs = (
            self.pipeline
            | 'Create PCollection of files that needs to be deleted' >> (
                beam.Create(
                    [
                        'dummy_folder/dummy_subfolder/dummy_file_1',
                        'dummy_folder/dummy_subfolder/dummy_file_2'
                    ]
                ))
            | 'Delete files from the GCS' >> gcs_io.DeleteFile()
        )

        total_files_deleted = (
            delete_files_from_gcs
            | 'Total number of files deleted from GCS' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'TOTAL FILES DELETED'))
        )

        return total_files_deleted
