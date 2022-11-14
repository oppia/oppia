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

from typing import Dict, Optional, TypedDict, Union

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

    def expand(self, file_paths: beam.PCollection) -> beam.PCollection:
        """Returns PCollection with file data.

        Args:
            file_paths: PCollection. The collection of filenames that will
                be read.

        Returns:
            PCollection. The PCollection of the file data.
        """
        return (
            file_paths
            | 'Read the file' >> beam.Map(self._read_file)
        )

    def _read_file(self, file_path: str) -> Union[bytes, str]:
        """Helper function to read the contents of a file.

        Args:
            file_path: Union[bytes, str]. The name of the file that will
                be read.

        Returns:
            data: bytes. The file data.
        """
        gcs = gcsio.GcsIO(self.client)
        bucket = app_identity_services.get_gcs_resource_bucket_name()
        gcs_filename = f'gs://{bucket}/{file_path}'
        data = gcs.open(gcs_filename, mode=self.mode).read()
        return data


class FileObjectDict(TypedDict):
    """Dictionary representing file object that will be written to GCS."""

    filepath: str
    data: Union[bytes, str]


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

    def expand(self, file_objects: beam.PCollection) -> beam.PCollection:
        """Returns the PCollection of files that have written to the GCS.

        Args:
            file_objects: PCollection. The collection of file paths and data
                that will be written.

        Returns:
            PCollection. The PCollection of the number of bytes that has
            written to GCS.
        """
        return (
            file_objects
            | 'Write files to GCS' >> beam.Map(self._write_file)
        )

    def _write_file(self, file_obj: FileObjectDict) -> int:
        """Helper function to write file to the GCS.

        Args:
            file_obj: FileObjectDict. The dictionary having file
                path and file data.

        Returns:
            write_file: int. Returns the number of bytes that has
            been written to GCS.
        """
        gcs = gcsio.GcsIO(self.client)
        bucket = app_identity_services.get_gcs_resource_bucket_name()
        filepath = file_obj['filepath']
        gcs_url = 'gs://%s/%s' % (bucket, filepath)
        file = gcs.open(
            filename=gcs_url,
            mode=self.mode,
            mime_type=self.mime_type)
        write_file = file.write(file_obj['data'])
        file.close()
        return write_file
