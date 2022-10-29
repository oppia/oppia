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

"""Provides an Apache Beam API for operating on GCS."""

from apache_beam import io
from apache_beam import pvalue
from core.platform import models

from typing import List

import apache_beam as beam

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import datastore_services

datastore_services = models.Registry.import_datastore_services()


class ReadFile(beam.PTransform):
    def __init__(self, filenames: List[str]) -> None:
        """"""
        super().__init__()
        self.filenames = filenames

    def expand(
       self, pbegin: pvalue.PBegin
    ) -> beam.PCollection[datastore_services.Model]:
        """Returns PCollection with file data."""
        return (
            pbegin.pipeline
            | 'List of filenames' >> beam.Create(self.filenames)
            | 'Read the file' >> beam.Map(lambda file: self._read_file(file))
        )

    def _read_file(self, filename):
        """Helper function to read the contents of a file."""
        print("***********************")
        print("file - ", filename)
        gcs = io.gcsio.GcsIO()
        return gcs.open(filename, mode='r')
