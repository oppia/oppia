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

from core.platform import models

import apache_beam as beam
from apache_beam.io.gcp import gcsio
from apache_beam.io.gcp import gcsio_test

from typing import Dict, Optional

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import app_identity_services

app_identity_services = models.Registry.import_app_identity_services()


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
        """Initializes the ReadFile PTransform.

        Args:
            client: Optional[gcsio_test.FakeGcsClient]. The GCS client to use
                while testing. This will be None when testing on server.
            mode: str. The mode in which the file will be read, can be
                'r' and 'rb'.
            label: Optional[str]. The label of the PTransform.
        """
        super().__init__(label=label)
        self.client = client
        self.mode = mode

    def expand(self, filenames: beam.PCollection) -> beam.PCollection:
        """Returns PCollection with file data.

        Args:
            filenames: PCollection. The collection of filenames that will
                be read.

        Returns:
            PCollection. The PCollection of the file data.
        """
        return (
            filenames
            | 'Read the file' >> beam.Map(self._read_file)
        )

    def _read_file(self, filename: str) -> bytes:
        """Helper function to read the contents of a file.

        Args:
            filename: str. The name of the file that will be read.

        Returns:
            data: bytes. The file data.
        """
        gcs = gcsio.GcsIO(self.client)
        bucket = app_identity_services.get_gcs_resource_bucket_name()
        gcs_filename = f'gs://{bucket}/{filename}'
        data = gcs.open(gcs_filename, mode=self.mode).read()
        # Ruling out the possibility of different types for mypy type checking.
        assert isinstance(data, bytes)
        return data


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
    ) -> None:
        """Initializes the WriteFile PTransform.

        Args:
            client: Optional[gcsio_test.FakeGcsClient]. The GCS client to use
                while testing. This will be None when testing on server.
            mode: str. The mode in which the file will be write, can be
                'w' and 'wb'.
            mime_type: str. The mime_type to assign to the file.
            label: Optional[str]. The label of the PTransform.
        """
        super().__init__(label=label)
        self.client = client
        self.mode = mode
        self.mime_type = mime_type

    def expand(self, filenames: beam.PCollection) -> beam.PCollection:
        """Returns the PCollection of files that have written to the GCS.

        Args:
            filenames: PCollection. The collection of filenames and data
                that will be write.

        Returns:
            PCollection. The PCollection of the number of bytes that has
            written to GCS.
        """
        return (
            filenames
            | 'Write files to GCS' >> beam.Map(self._write_file)
        )

    def _write_file(self, filename: Dict[str, bytes]) -> int:
        """Helper function to write file to the GCS.

        Args:
            filename: Dict[str, bytes]. The dictionary having file
                name and file data.

        Returns:
            write_file: int. Returns the number of bytes that has
            been written to GCS.
        """
        gcs = gcsio.GcsIO(self.client)
        bucket = app_identity_services.get_gcs_resource_bucket_name()
        file_name = filename['file']
        gcs_filename = 'gs://%s/%s' % (bucket, file_name)
        file = gcs.open(
            filename=gcs_filename,
            mode=self.mode,
            mime_type=self.mime_type)
        write_file = file.write(filename['data'])
        # Ruling out the possibility of different types for mypy type checking.
        assert isinstance(write_file, int)
        file.close()
        return write_file
