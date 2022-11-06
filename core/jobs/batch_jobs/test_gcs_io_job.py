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
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms
from core.jobs.types import job_run_result
from core.platform import models

from typing import Optional

import apache_beam as beam

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import app_identity_services
    from mypy_imports import exp_models

datastore_services = models.Registry.import_datastore_services()
app_identity_services = models.Registry.import_app_identity_services()

(exp_models,) = models.Registry.import_models([models.Names.EXPLORATION])


class TestGCSIoJob(base_jobs.JobBase):
    """Read exploration files stored on GCS."""

    def __init__(
        self,
        pipeline: beam.Pipeline,
        client: Optional[gcsio_test.FakeGcsClient] = None
    ) -> None:
        super.__init__()
        self.client = client
        self.pipeline = pipeline

    def _map_with_filename(self, exp_id: str) -> str:
        """Returns the filename with which the exp image is stored.

        Args:
            exp_id: str. The id of the Exploration.

        Returns:
            str. The filename with which the Exploration file is stored on GCS.
        """
        bucket_name = app_identity_services.get_gcs_resource_bucket_name()
        return f'gs://{bucket_name}/exploration/{exp_id}/some_image.png'

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        read_exp_file_from_gcs = (
            self.pipeline
            | 'Get all non-deleted ExplorationModels' >> ndb_io.GetModels(
                exp_models.ExplorationModel.get_all(include_deleted=False))
            | 'Map with id' >> beam.Map(lambda exp: exp.id)
            | 'Map with filename present on GCS' >> beam.Map(
                self._map_with_filename)
            | 'Read file from the GCS' >> gcs_io.ReadFile(self.client)
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
                total_files_read,
                output_files
            )
            | 'Combine results' >> beam.Flatten()
        )
