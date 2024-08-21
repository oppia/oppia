# coding: utf-8
#
# Copyright 2021 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the 'License');
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an 'AS-IS' BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Provides various functions from the Cloud Storage emulator."""

from __future__ import annotations

from core.platform.storage import cloud_storage_emulator

from typing import List, Optional, Union

CLIENT = cloud_storage_emulator.CloudStorageEmulator()


def isfile(unused_bucket_name: str, filepath: str) -> bool:
    """Checks if the file with the given filepath exists.

    Args:
        unused_bucket_name: str. Unused name of the GCS bucket.
        filepath: str. The path to the relevant file.

    Returns:
        bool. Whether the file exists.
    """
    return CLIENT.get_blob(filepath) is not None


def get(unused_bucket_name: str, filepath: str) -> bytes:
    """Gets a file data as bytes.

    Args:
        unused_bucket_name: str. Unused name of the GCS bucket.
        filepath: str. The path to the relevant file.

    Returns:
        bytes. Returns data of the file as bytes.
    """
    blob = CLIENT.get_blob(filepath)
    # Make sure that we found the blob.
    assert blob is not None
    return blob.download_as_bytes()


def commit(
        unused_bucket_name: str,
        filepath: str,
        raw_bytes: Union[bytes, str],
        mimetype: Optional[str]
) -> None:
    """Commits bytes to the relevant file.

    Args:
        unused_bucket_name: str. Unused name of the GCS bucket.
        filepath: str. The path to the relevant file.
        raw_bytes: bytes|str. The content to be stored in the file.
        mimetype: Optional[str]. The content-type of the file.
    """
    # TODO(#13500): Refactor this method that only bytes are passed
    # into raw_bytes.
    blob = cloud_storage_emulator.EmulatorBlob(
        filepath, raw_bytes, content_type=mimetype)
    CLIENT.upload_blob(filepath, blob)


def delete(unused_bucket_name: str, filepath: str) -> None:
    """Deletes a file and the metadata associated with it.

    Args:
        unused_bucket_name: str. Unused name of the GCS bucket.
        filepath: str. The path to the relevant file.
    """
    CLIENT.delete_blob(filepath)


def copy(
        unused_bucket_name: str, source_assets_path: str, dest_assets_path: str
) -> None:
    """Copies images from source_path.

    Args:
        unused_bucket_name: str. Unused name of the GCS bucket.
        source_assets_path: str. The path to the source entity's assets
            folder.
        dest_assets_path: str. The path to the relevant file within the entity's
            assets folder.

    Raises:
        ValueError. Source asset does not exist at the given path.
    """
    src_blob = CLIENT.get_blob(source_assets_path)
    if src_blob is None:
        raise ValueError(
            'Source asset does not exist at %s.' % source_assets_path,
            source_assets_path
        )
    CLIENT.copy_blob(src_blob, dest_assets_path)


def listdir(
        unused_bucket_name: str, dir_name: str
) -> List[cloud_storage_emulator.EmulatorBlob]:
    """Lists all files in a directory.

    Args:
        unused_bucket_name: str. Unused name of the GCS bucket.
        dir_name: str. The directory whose files should be listed.

    Returns:
        list(EmulatorBlob). A lexicographically-sorted list of filenames.
    """
    return CLIENT.list_blobs(dir_name)
