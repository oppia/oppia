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
import os

from google.cloud import storage
from gcp_storage_emulator.server import create_server

import apache_beam as beam

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import base_models
    from mypy_imports import datastore_services

(base_models,) = models.Registry.import_models([models.Names.BASE_MODEL])

datastore_services = models.Registry.import_datastore_services()


def gcs_emulator():
    """"""
    HOST = "localhost"
    PORT = 9023
    BUCKET = "test-bucket"

    # default_bucket parameter creates the bucket automatically
    server = create_server(HOST, PORT, in_memory=True, default_bucket=BUCKET)
    server.start()

    os.environ["STORAGE_EMULATOR_HOST"] = f"http://{HOST}:{PORT}"
    client = storage.Client()

    bucket = client.bucket(BUCKET)
    blob = bucket.blob("blob1")
    blob.upload_from_string("test1")
    blob = bucket.blob("blob2")
    blob.upload_from_string("test2")
    for blob in bucket.list_blobs():
        content = blob.download_as_bytes()
        print("**************************************")
        print(f"Blob [{blob.name}]: {content}")
    print("**************************************")
    print(bucket.name)

    return server


class ReadFileTest(job_test_utils.PipelinedTestBase):
    """"""
    def test_read_from_gcs(self):
        # server = gcs_emulator()
        os.environ["STORAGE_EMULATOR_HOST"] = "http://localhost:9023"
        client = storage.Client()

        bucket = client.get_bucket('test-bucket')
        bucket.delete_blobs(["blob1", "blob2"])
        bucket.delete()

        bucket = client.create_bucket('test-bucket')
        blob = bucket.blob("blob1")
        print("**********************************")
        print(blob.name)
        blob.upload_from_string("test1")
        blob = bucket.blob("blob2")
        blob.upload_from_string("test2")
        for blob in bucket.list_blobs():
            content = blob.download_as_bytes()
            print("**************************************")
            print(f"Blob [{blob.name}]: {content}")
        print("**************************************")
        print(bucket.name)
        filenames = ['gs://test-bucket/blob1', 'gs://test-bucket/blob2']
        filename_p_collec = (
            self.pipeline | beam.Create(filenames)
        )
        model_pcoll = (
            filename_p_collec | gcs_io.ReadFile()
        )
        pcoll = (
            self.pipeline
            | 'create result' >> beam.Create(["test1", "test2"])
        )
        self.assert_pcoll_equal(model_pcoll, pcoll)
        # server.stop()
