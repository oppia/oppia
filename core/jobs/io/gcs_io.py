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

from __future__ import annotations

from apache_beam.io.gcp import gcsio
from apache_beam.io.gcp import gcsio_test
from core.platform import models

from typing import Optional

import apache_beam as beam
import io

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import datastore_services

datastore_services = models.Registry.import_datastore_services()


# TODO(#15613): Here we use MyPy ignore because of the incomplete typing of
# apache_beam library and absences of stubs in Typeshed, forces MyPy to
# assume that PTransform class is of type Any. Thus to avoid MyPy's error (Class
# cannot subclass 'PTransform' (has type 'Any')), we added an ignore here.
class ReadFile(beam.PTransform): # type: ignore[misc]
    """Read files form the GCS."""

    def __init__(
        self,
        client: Optional[gcsio_test.FakeGcsClient] = None,
        mode: str = 'r',
        label: Optional[str] = None
    ) -> None:
        super().__init__(label=label)
        self.client = client
        self.mode = mode

    def expand(
       self, filenames: beam.PCollection
    ) -> beam.PCollection[datastore_services.Model]:
        """Returns PCollection with file data."""
        return (
            filenames
            | 'Read the file' >> beam.Map(self._read_file)
        )

    def _read_file(self, filename: str) -> bytes:
        """Helper function to read the contents of a file."""
        gcs = gcsio.GcsIO(self.client)
        return gcs.open(filename, mode=self.mode).read()


# TODO(#15613): Here we use MyPy ignore because of the incomplete typing of
# apache_beam library and absences of stubs in Typeshed, forces MyPy to
# assume that PTransform class is of type Any. Thus to avoid MyPy's error (Class
# cannot subclass 'PTransform' (has type 'Any')), we added an ignore here.
class WriteFile(beam.PTransform): # type: ignore[misc]
    """Write files to GCS."""

    def __init__(
        self,
        client: Optional[gcsio_test.FakeGcsClient] = None,
        mode: str = 'w',
        mime_type: str = 'application/octet-stream',
        label: Optional[str] = None
    ):
        super().__init__(label=label)
        self.client = client
        self.mode = mode
        self.mime_type = mime_type

    def expand(
        self, filenames: beam.PCollection
    ) -> beam.PCollection[datastore_services.Model]:
        """Returns the PCollection of files that have written to the GCS."""
        return (
            filenames
            | 'Write files to GCS' >> beam.Map(self._write_file)
        )

    def _write_file(self, filename):
        """Helper function to write file to the GCS."""
        gcs = gcsio.GcsIO(self.client)
        return gcs.open(
            filename=filename['file'],
            mode=self.mode,
            mime_type=self.mime_type).write(filename['data'])
