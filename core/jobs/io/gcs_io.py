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
import result
from typing import List, Optional, Tuple, TypedDict, TypeVar, Union

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import app_identity_services
    from mypy_imports import storage_services

storage_services = models.Registry.import_storage_services()
app_identity_services = models.Registry.import_app_identity_services()

BUCKET = app_identity_services.get_gcs_resource_bucket_name()

# A generic type for a PCollection key.
T = TypeVar('T')


# TODO(#15613): Here we use MyPy ignore because of the incomplete typing of
# apache_beam library and absences of stubs in Typeshed, forces MyPy to
# assume that PTransform class is of type Any. Thus to avoid MyPy's error (Class
# cannot subclass 'PTransform' (has type 'Any')), we added an ignore here.
class ReadFile(beam.PTransform): # type: ignore[misc]
    """Read files form the GCS."""

    def __init__(
        self,
        bucket: str = BUCKET,
        label: Optional[str] = None
    ) -> None:
        """Initializes the ReadFile PTransform.

        Args:
            bucket: str. The bucket name on the GCS.
            label: Optional[str]. The label of the PTransform.
        """
        super().__init__(label=label)
        self.bucket = bucket

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

    def _read_file(
        self, file_path: str
    ) -> result.Result[Tuple[str, Union[bytes, str]]]:
        """Helper function to read the contents of a file.

        Args:
            file_path: str. The name of the file that will be read.

        Returns:
            data: Tuple[str, bytes]. The file data.
        """
        try:
            file_data = storage_services.get(self.bucket, file_path)
            return result.Ok((file_path, file_data))
        except Exception:
            err_message: str = 'The file does not exists.'
            return result.Err((file_path, err_message))


class FileObjectDict(TypedDict):
    """Dictionary representing file object that will be written to GCS."""

    filepath: str
    data: bytes


# TODO(#15613): Here we use MyPy ignore because of the incomplete typing of
# apache_beam library and absences of stubs in Typeshed, forces MyPy to
# assume that PTransform class is of type Any. Thus to avoid MyPy's error (Class
# cannot subclass 'PTransform' (has type 'Any')), we added an ignore here.
class WriteFile(beam.PTransform): # type: ignore[misc]
    """Write files to GCS."""

    def __init__(
        self,
        mime_type: str = 'application/octet-stream',
        bucket: str = BUCKET,
        label: Optional[str] = None
    ) -> None:
        """Initializes the WriteFile PTransform.

        Args:
            mime_type: str. The mime_type to assign to the file.
            bucket: str. The bucket name on the GCS.
            label: Optional[str]. The label of the PTransform.
        """
        super().__init__(label=label)
        self.mime_type = mime_type
        self.bucket = bucket

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
            int. Returns the number of bytes that has been written to GCS.
        """
        storage_services.commit(
            self.bucket, file_obj['filepath'], file_obj['data'], self.mime_type)
        return len(file_obj['data'])


# TODO(#15613): Here we use MyPy ignore because of the incomplete typing of
# apache_beam library and absences of stubs in Typeshed, forces MyPy to
# assume that PTransform class is of type Any. Thus to avoid MyPy's error (Class
# cannot subclass 'PTransform' (has type 'Any')), we added an ignore here.
class DeleteFile(beam.PTransform): # type: ignore[misc]
    """Delete files from GCS."""

    def __init__(
        self,
        bucket: str = BUCKET,
        label: Optional[str] = None
    ) -> None:
        """Initializes the DeleteFile PTransform.

        Args:
            bucket: str. The bucket name on the GCS.
            label: Optional[str]. The label of the PTransform.
        """
        super().__init__(label=label)
        self.bucket = bucket

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
        """
        storage_services.delete(self.bucket, file_path)


# TODO(#15613): Here we use MyPy ignore because of the incomplete typing of
# apache_beam library and absences of stubs in Typeshed, forces MyPy to
# assume that PTransform class is of type Any. Thus to avoid MyPy's error (Class
# cannot subclass 'PTransform' (has type 'Any')), we added an ignore here.
class GetFiles(beam.PTransform): # type: ignore[misc]
    """Get all files with specefic prefix."""

    def __init__(
        self,
        bucket: str = BUCKET,
        label: Optional[str] = None
    ) -> None:
        """Initializes the GetFiles PTransform.

        Args:
            bucket: str. The bucket name on the GCS.
            label: Optional[str]. The label of the PTransform.
        """
        super().__init__(label=label)
        self.bucket = bucket

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

    def _get_file_with_prefix(self, prefix: str) -> List[str]:
        """Helper function to get file names with the prefix.

        Args:
            prefix: str. The prefix path of which we want to list
                all the files.

        Returns:
            filepaths: List[str]. The file name as key and size of file
            as value.
        """
        list_of_blobs = storage_services.listdir(self.bucket, prefix)
        return list(blob.name for blob in list_of_blobs)


# TODO(#15613): Here we use MyPy ignore because of the incomplete typing of
# apache_beam library and absences of stubs in Typeshed, forces MyPy to
# assume that PTransform class is of type Any. Thus to avoid MyPy's error (Class
# cannot subclass 'PTransform' (has type 'Any')), we added an ignore here.
class IsFile(beam.PTransform): # type: ignore[misc]
    """Checks whether a GCS filepath exists or not. Operates on keyed
    PCollections.
    """

    def __init__(
        self,
        bucket: str = BUCKET,
        label: Optional[str] = None
    ) -> None:
        """Initializes the IsFile PTransform.

        Args:
            bucket: str. The bucket name on the GCS.
            label: str|None. The label of the PTransform.
        """
        super().__init__(label=label)
        self.bucket = bucket

    def expand(
        self, file_paths: beam.PCollection[T, str]
    ) -> beam.PCollection[T, bool]:
        """Returns PCollection of whether the corresponding filepath exists or
        not.

        Args:
            file_paths: PCollection(T, str). The collection of filepaths to
                check, which must be keyed but may have arbitrary keys.

        Returns:
            PCollection(T, bool). The PCollection of whether the corresponding
            filepath exists or not, keyed by the same keys as file_paths.
        """
        return (
            file_paths
            | 'Check whether each filepath exists' >> beam.Map(self._is_file)
        )

    def _is_file(self, group: Tuple[T, str]) -> Tuple[T, bool]:
        """Helper function to check whether the filepath exists or not.

        Args:
            group: (T, str). Ordered pair (key, file_path) of a key and
                the filepath to check.

        Returns:
            (T, bool). An ordered pair where the first element is the
            key and the second element is whether the filepath exists.
        """
        key, file_path = group
        is_file = storage_services.isfile(self.bucket, file_path)
        return key, is_file


# TODO(#15613): Here we use MyPy ignore because of the incomplete typing of
# apache_beam library and absences of stubs in Typeshed, forces MyPy to
# assume that PTransform class is of type Any. Thus to avoid MyPy's error (Class
# cannot subclass 'PTransform' (has type 'Any')), we added an ignore here.
class CopyFile(beam.PTransform): # type: ignore[misc]
    """Copies files to a destination filepath in GCS."""

    def __init__(
        self,
        bucket: str = BUCKET,
        label: Optional[str] = None
    ) -> None:
        """Initializes the CopyFile PTransform.

        Args:
            bucket: str. The bucket name on the GCS.
            label: str|None. The label of the PTransform.
        """
        super().__init__(label=label)
        self.bucket = bucket

    def expand(
        self,
        file_path_pairs: beam.PCollection[Tuple[str, beam.PCollection[str]]]
    ) -> beam.PCollection[result.Result[Tuple[str, str, str]]]:
        """Returns the result of the copy operation.

        Args:
            file_path_pairs: PCollection(str, PCollection(str)). The
                collection of each source filepath and destination filepath.

        Returns:
            PCollection(result(str, str, str)). The PCollection of
            the copy operation's result.
        """
        return (
            file_path_pairs
            | 'Copy files in GCS' >> beam.Map(self._copy_file)
        )

    def _copy_file(
        self, file_paths: Tuple[str, beam.PCollection[str]]
    ) -> result.Result[Tuple[str, str, str]]:
        """Helper function to copy files.

        Args:
            file_paths: (str, str). An ordered pair of filepaths, where the
                first path is the source and the second is the destination.

        Returns:
            result(str, str, str). The input filepaths along with
            the error message if the copy operation failed, or a success string
            if the copy succeeded.
        """
        (src_path, dest_path) = file_paths
        try:
            storage_services.copy(self.bucket, src_path, dest_path)
            return result.Ok((src_path, dest_path, 'Copied'))
        except ValueError as err:
            err_message = 'Copy failed because of this error: %s' % err
            return result.Err((src_path, dest_path, err_message))
