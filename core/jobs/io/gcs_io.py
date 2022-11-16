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
from typing import Dict, Optional, Tuple, TypedDict, Union

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import app_identity_services

    from apache_beam.io.gcp import gcsio_test

app_identity_services = models.Registry.import_app_identity_services()


# TODO(#15613): Here we use MyPy ignore because of the incomplete typing of
# apache_beam library and absences of stubs in Typeshed, forces MyPy to
# assume that PTransform class is of type Any. Thus to avoid MyPy's error (Class
# cannot subclass 'PTransform' (has type 'Any')), we added an ignore here.
class ReadFile(beam.PTransform): # type: ignore[misc]
    """Read files form the GCS."""

    # Here we pass FakeGcsClient when we want to test the functionality locally.
    # This ensures that our code will work fine while interacting with GCS.
    def __init__(
        self,
        client: Optional[gcsio_test.FakeGcsClient] = None,
        mode_is_binary: bool = False,
        label: Optional[str] = None
    ) -> None:
        """Initializes the ReadFile PTransform.

        Args:
            client: Optional[gcsio_test.FakeGcsClient]. The GCS client to use
                while testing. This will be None when testing on server.
            mode_is_binary: bool. True, when the mode needs to be 'rb' and
                False when mode needs to be 'r'. Represents to read the file
                in binary or not.
            label: Optional[str]. The label of the PTransform.
        """
        super().__init__(label=label)
        self.client = client
        self.gcs = gcsio.GcsIO(self.client)
        self.bucket = app_identity_services.get_gcs_resource_bucket_name()
        if mode_is_binary:
            self.mode = 'rb'
        else:
            self.mode = 'r'

    def expand(self, file_paths: beam.PCollection) -> beam.PCollection:
        """Returns PCollection with file data.

        Args:
            file_paths: PCollection. The collection of filepaths that will
                be read.

        Returns:
            PCollection. The PCollection of the file data.
        """
        return (
            file_paths
            | 'Read the file' >> beam.Map(self._read_file)
        )

    def _read_file(self, file_path: str) -> Tuple[str, Union[bytes, str]]:
        """Helper function to read the contents of a file.

        Args:
            file_path: str. The name of the file that will be read.

        Returns:
            data: Union[bytes, str]. The file data.
        """
        gcs_url = f'gs://{self.bucket}/{file_path}'
        file = self.gcs.open(gcs_url, mode=self.mode)
        data = file.read()
        file.close()
        return (file_path, data)


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

    # Here we pass FakeGcsClient when we want to test the functionality locally.
    # This ensures that our code will work fine while interacting with GCS.
    def __init__(
        self,
        client: Optional[gcsio_test.FakeGcsClient] = None,
        mode_is_binary: bool = False,
        mime_type: str = 'application/octet-stream',
        label: Optional[str] = None
    ) -> None:
        """Initializes the WriteFile PTransform.

        Args:
            client: Optional[gcsio_test.FakeGcsClient]. The GCS client to use
                while testing. This will be None when testing on server.
            mode_is_binary: bool. True, when the mode needs to be 'wb' and
                False when mode needs to be 'w'. Represents to write the file
                in binary or not.
            mime_type: str. The mime_type to assign to the file.
            label: Optional[str]. The label of the PTransform.
        """
        super().__init__(label=label)
        self.client = client
        self.mime_type = mime_type
        self.gcs = gcsio.GcsIO(self.client)
        self.bucket = app_identity_services.get_gcs_resource_bucket_name()
        if mode_is_binary:
            self.mode = 'wb'
        else:
            self.mode = 'w'

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
        filepath = file_obj['filepath']
        gcs_url = 'gs://%s/%s' % (self.bucket, filepath)
        file = self.gcs.open(
            filename=gcs_url,
            mode=self.mode,
            mime_type=self.mime_type)
        write_file = file.write(file_obj['data'])
        file.close()
        return write_file


# TODO(#15613): Here we use MyPy ignore because of the incomplete typing of
# apache_beam library and absences of stubs in Typeshed, forces MyPy to
# assume that PTransform class is of type Any. Thus to avoid MyPy's error (Class
# cannot subclass 'PTransform' (has type 'Any')), we added an ignore here.
class DeleteFile(beam.PTransform): # type: ignore[misc]
    """Delete files from GCS."""

    # Here we pass FakeGcsClient when we want to test the functionality locally.
    # This ensures that our code will work fine while interacting with GCS.
    def __init__(
        self,
        client: Optional[gcsio_test.FakeGcsClient] = None,
        label: Optional[str] = None
    ) -> None:
        """Initializes the DeleteFile PTransform.

        Args:
            client: Optional[gcsio_test.FakeGcsClient]. The GCS client to use
                while testing. This will be None when testing on server.
            label: Optional[str]. The label of the PTransform.
        """
        super().__init__(label=label)
        self.client = client
        self.gcs = gcsio.GcsIO(self.client)
        self.bucket = app_identity_services.get_gcs_resource_bucket_name()

    def expand(self, file_paths: beam.PCollection) -> beam.pvalue.PDone:
        """Deletes the files in given PCollection.

        Args:
            file_paths: PCollection. The collection of filepaths that will
                be deleted.

        Returns:
            PCollection. The PCollection of the file data.
        """
        return (
            file_paths
            | 'Delete the file' >> beam.Map(self._delete_file)
        )

    def _delete_file(self, file_path: str) -> None:
        """Helper function to delete the file.

        Args:
            file_path: str. The name of the file that will be deleted.

        Returns:
            delete_result: None. Returns None or error.
        """
        gcs_url = f'gs://{self.bucket}/{file_path}'
        delete_result = self.gcs.delete(gcs_url)
        return delete_result


# TODO(#15613): Here we use MyPy ignore because of the incomplete typing of
# apache_beam library and absences of stubs in Typeshed, forces MyPy to
# assume that PTransform class is of type Any. Thus to avoid MyPy's error (Class
# cannot subclass 'PTransform' (has type 'Any')), we added an ignore here.
class GetFiles(beam.PTransform): # type: ignore[misc]
    """Get all files with specefic prefix."""

    # Here we pass FakeGcsClient when we want to test the functionality locally.
    # This ensures that our code will work fine while interacting with GCS.
    def __init__(
        self,
        client: Optional[gcsio_test.FakeGcsClient] = None,
        label: Optional[str] = None
    ) -> None:
        """Initializes the GetFiles PTransform.

        Args:
            client: Optional[gcsio_test.FakeGcsClient]. The GCS client to use
                while testing. This will be None when testing on server.
            label: Optional[str]. The label of the PTransform.
        """
        super().__init__(label=label)
        self.client = client
        self.gcs = gcsio.GcsIO(self.client)
        self.bucket = app_identity_services.get_gcs_resource_bucket_name()

    def expand(self, prefixes: beam.PCollection) -> beam.PCollection:
        """Returns PCollection with file names.

        Args:
            prefixes: PCollection. The collection of filepath prefixes.

        Returns:
            PCollection. The PCollection of the file names.
        """
        return (
            prefixes
            | 'Get names of the files' >> beam.Map(self._get_file_with_prefix)
        )

    def _get_file_with_prefix(self, prefix: str) -> Dict[str, int]:
        """Helper function to get file names with the prefix.

        Args:
            prefix: str. The prefix path of which we want to list
                all the files.

        Returns:
            Dict[str, int]. The file name as key and size of file as value.
        """
        gcs_url = f'gs://{self.bucket}/{prefix}'
        return self.gcs.list_prefix(gcs_url)
