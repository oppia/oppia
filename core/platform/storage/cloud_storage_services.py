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

"""Provides file storage functionality from Google Cloud Storage."""

from __future__ import annotations

import functools

from google.cloud import storage

from typing import List, Optional, Union


@functools.lru_cache(maxsize=1)
def _get_client() -> storage.Client:
    """Gets Cloud Storage client.

    Returns:
        storage.Client. Cloud Storage client.
    """
    return storage.Client()


@functools.lru_cache(maxsize=1)
def _get_bucket(bucket_name: str) -> storage.bucket.Bucket:
    """Gets Cloud Storage bucket.

    Args:
        bucket_name: str. The name of the storage bucket to return.

    Returns:
        storage.bucket.Bucket. Cloud Storage bucket.
    """
    return _get_client().get_bucket(bucket_name)


def isfile(bucket_name: str, filepath: str) -> bool:
    """Checks if the file with the given filepath exists in the GCS.

    Args:
        bucket_name: str. The name of the GCS bucket.
        filepath: str. The path to the relevant file within the entity's
            assets folder.

    Returns:
        bool. Whether the file exists in GCS.
    """
    return _get_bucket(bucket_name).get_blob(filepath) is not None


def get(bucket_name: str, filepath: str) -> bytes:
    """Gets a file as an unencoded stream of raw bytes.

    Args:
        bucket_name: str. The name of the GCS bucket.
        filepath: str. The path to the relevant file within the entity's
            assets folder.

    Returns:
        bytes. Returns data a bytes.
    """
    blob = _get_bucket(bucket_name).get_blob(filepath)
    data = blob.download_as_bytes()
    return data


def commit(
        bucket_name: str,
        filepath: str,
        raw_bytes: Union[bytes, str],
        mimetype: Optional[str]
) -> None:
    """Commits raw_bytes to the relevant file in the entity's assets folder.

    Args:
        bucket_name: str. The name of the GCS bucket.
        filepath: str. The path to the relevant file within the entity's
            assets folder.
        raw_bytes: str. The content to be stored in the file.
        mimetype: str|None. The content-type of the cloud file.
    """
    # TODO(#13500): Refactor this method that only bytes are passed
    # into raw_bytes.
    blob = _get_bucket(bucket_name).blob(filepath)
    blob.upload_from_string(raw_bytes, content_type=mimetype)


def delete(bucket_name: str, filepath: str) -> None:
    """Deletes a file and the metadata associated with it.

    Args:
        bucket_name: str. The name of the GCS bucket.
        filepath: str. The path to the relevant file within the entity's
            assets folder.
    """
    blob = _get_bucket(bucket_name).get_blob(filepath)
    blob.delete()


def copy(
        bucket_name: str, source_assets_path: str, dest_assets_path: str
) -> None:
    """Copies images from source_path.

    Args:
        bucket_name: str. The name of the GCS bucket.
        source_assets_path: str. The path to the source entity's assets
            folder.
        dest_assets_path: str. The path to the relevant file within the entity's
            assets folder.

    Raises:
        ValueError. Source asset does not exist at the given path.
    """
    src_blob = _get_bucket(bucket_name).get_blob(source_assets_path)
    if src_blob is None:
        raise ValueError(
            'Source asset does not exist at %s.' % source_assets_path,
            source_assets_path
        )
    _get_bucket(bucket_name).copy_blob(
        src_blob, _get_bucket(bucket_name), new_name=dest_assets_path
    )


def listdir(bucket_name: str, dir_name: str) -> List[storage.blob.Blob]:
    """Lists all files in a directory.

    Args:
        bucket_name: str. The name of the GCS bucket.
        dir_name: str. The directory whose files should be listed. This
            should not start with '/'.

    Returns:
        list(Blob). A list of blobs.
    """
    return list(
        _get_client().list_blobs(_get_bucket(bucket_name), prefix=dir_name))
