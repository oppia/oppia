# coding: utf-8
#
# Copyright 2021 The Oppia Authors. All Rights Reserved.
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

"""Tests for cloud_storage_services."""

from __future__ import annotations

from core.platform.storage import cloud_storage_services
from core.tests import test_utils

from google.cloud import storage

from typing import Dict, List, Optional


class MockClient:

    def __init__(self) -> None:
        self.buckets: Dict[str, MockBucket] = {}

    def get_bucket(self, bucket_name: str) -> MockBucket:
        """Gets mocked Cloud Storage bucket.

        Args:
            bucket_name: str. The name of the storage bucket to return.

        Returns:
            MockBucket. Cloud Storage bucket.
        """
        return self.buckets[bucket_name]

    def list_blobs(
            self, bucket: MockBucket, prefix: Optional[str] = None
    ) -> List[MockBlob]:
        """Lists all blobs with some prefix.

        Args:
            bucket: MockBucket. The mock GCS bucket.
            prefix: str|None. The prefix which the blobs should have.

        Returns:
            list(MockBlob). A list of blobs.
        """
        return [
            blob for name, blob in bucket.blobs.items()
            if prefix is None or name.startswith(prefix)
        ]


class MockBucket:

    def __init__(self) -> None:
        self.blobs: Dict[str, MockBlob] = {}

    def get_blob(self, filepath: str) -> Optional[MockBlob]:
        """Gets a blob object by filepath. This will return None if the
        blob doesn't exist.

        Args:
            filepath: str. Filepath of the blob.

        Returns:
            MockBlob. The blob.
        """
        return self.blobs.get(filepath)

    def copy_blob(
            self,
            src_blob: MockBlob,
            bucket: MockBucket,
            new_name: Optional[str] = None
    ) -> None:
        """Copies the given blob to the given bucket, optionally
        with a new name.

        Args:
            src_blob: MockBlob. Source blob which should be copied.
            bucket: MockBucket. The target bucket into which the blob
                should be copied.
            new_name: str|None. The new name of the blob. When None the name
                of src_blob will be used.
        """
        blob = bucket.blob(new_name if new_name else src_blob.filepath)
        blob.upload_from_string(
            src_blob.download_as_bytes(), content_type=src_blob.content_type)

    def blob(self, filepath: str) -> MockBlob:
        """Creates new blob in this bucket.

        Args:
            filepath: str. Filepath of the blob.

        Returns:
            MockBlob. The newly created blob.
        """
        blob = MockBlob(filepath)
        self.blobs[filepath] = blob
        return blob


class MockBlob:

    __slots__ = ('filepath', 'raw_bytes', 'content_type', 'deleted')

    def __init__(self, filepath: str) -> None:
        self.filepath = filepath
        self.deleted = False
        self.raw_bytes = b''
        self.content_type: Optional[str] = None

    def upload_from_string(
            self, raw_bytes: bytes, content_type: Optional[str] = None
    ) -> None:
        """Sets the blob data.

        Args:
            raw_bytes: bytes. The blob data.
            content_type: str. The content type of the blob.
        """
        self.raw_bytes = raw_bytes
        self.content_type = content_type

    def download_as_bytes(self) -> bytes:
        """Gets the blob data as bytes.

        Returns:
            bytes. The blob data.
        """
        return self.raw_bytes

    def delete(self) -> None:
        """Marks the blob as deleted."""
        self.deleted = True


class CloudStorageServicesTests(test_utils.TestBase):

    def setUp(self) -> None:
        super().setUp()
        self.client = MockClient()
        self.bucket_1 = MockBucket()
        self.bucket_2 = MockBucket()
        self.client.buckets['bucket_1'] = self.bucket_1
        self.client.buckets['bucket_2'] = self.bucket_2
        self.get_client_swap = self.swap(
            storage, 'Client', lambda: self.client)
        self.get_bucket_swap = self.swap(
            cloud_storage_services,
            '_get_bucket',
            self.client.get_bucket
        )

    def test_isfile_when_file_exists_returns_true(self) -> None:
        self.bucket_1.blobs['path/to/file.txt'] = MockBlob('path/to/file.txt')
        with self.get_client_swap:
            self.assertTrue(
                cloud_storage_services.isfile('bucket_1', 'path/to/file.txt'))

    def test_isfile_when_file_does_not_exist_returns_false(self) -> None:
        with self.get_bucket_swap:
            self.assertFalse(
                cloud_storage_services.isfile('bucket_1', 'path/to/file.txt'))

    def test_get_when_file_exists_returns_file_contents(self) -> None:
        self.bucket_1.blobs['path/to/file.txt'] = MockBlob('path/to/file.txt')
        self.bucket_1.blobs['path/to/file.txt'].upload_from_string(b'abc')
        self.bucket_2.blobs['path/file.txt'] = MockBlob('path/file.txt')
        self.bucket_2.blobs['path/file.txt'].upload_from_string(b'xyz')

        with self.get_bucket_swap:
            self.assertEqual(
                cloud_storage_services.get('bucket_1', 'path/to/file.txt'),
                b'abc'
            )
            self.assertEqual(
                cloud_storage_services.get('bucket_2', 'path/file.txt'), b'xyz'
            )

    def test_commit_saves_file_into_bucket(self) -> None:
        with self.get_bucket_swap:
            cloud_storage_services.commit(
                'bucket_1', 'path/to/file.txt', b'abc', 'audio/mpeg')
            cloud_storage_services.commit(
                'bucket_2', 'path/file.txt', b'xyz', 'image/png')

        self.assertEqual(
            self.bucket_1.blobs['path/to/file.txt'].raw_bytes, b'abc')
        self.assertEqual(
            self.bucket_1.blobs['path/to/file.txt'].content_type, 'audio/mpeg')
        self.assertEqual(
            self.bucket_2.blobs['path/file.txt'].raw_bytes, b'xyz')
        self.assertEqual(
            self.bucket_2.blobs['path/file.txt'].content_type, 'image/png')

    def test_delete_removes_file_from_bucket(self) -> None:
        self.bucket_1.blobs['path/to/file.txt'] = MockBlob('path/to/file.txt')
        self.bucket_1.blobs['path/to/file.txt'].upload_from_string(b'abc')
        self.bucket_2.blobs['path/file.txt'] = MockBlob('path/file.txt')
        self.bucket_2.blobs['path/file.txt'].upload_from_string(b'xyz')

        self.assertFalse(
            self.bucket_1.blobs['path/to/file.txt'].deleted)
        self.assertFalse(
            self.bucket_2.blobs['path/file.txt'].deleted)

        with self.get_bucket_swap:
            cloud_storage_services.delete(
                'bucket_1', 'path/to/file.txt')
            cloud_storage_services.delete(
                'bucket_2', 'path/file.txt')

        self.assertTrue(
            self.bucket_1.blobs['path/to/file.txt'].deleted)
        self.assertTrue(
            self.bucket_2.blobs['path/file.txt'].deleted)

    def test_copy_creates_copy_in_the_bucket(self) -> None:
        self.bucket_1.blobs['path/to/file.txt'] = MockBlob('path/to/file.txt')
        self.bucket_1.blobs['path/to/file.txt'].upload_from_string(
            b'abc', content_type='audio/mpeg')
        self.bucket_2.blobs['path/file.txt'] = MockBlob('path/file.txt')
        self.bucket_2.blobs['path/file.txt'].upload_from_string(
            b'xyz', content_type='image/png')

        with self.get_bucket_swap:
            cloud_storage_services.copy(
                'bucket_1', 'path/to/file.txt', 'other/path/to/file.txt')
            cloud_storage_services.copy(
                'bucket_2', 'path/file.txt', 'other/path/file.txt')

        self.assertEqual(
            self.bucket_1.blobs['other/path/to/file.txt'].raw_bytes, b'abc')
        self.assertEqual(
            self.bucket_1.blobs['other/path/to/file.txt'].content_type,
            'audio/mpeg'
        )
        self.assertEqual(
            self.bucket_2.blobs['other/path/file.txt'].raw_bytes, b'xyz')
        self.assertEqual(
            self.bucket_2.blobs['other/path/file.txt'].content_type,
            'image/png'
        )

    def test_raises_value_error_when_copying_from_non_existent_file(
        self
    ) -> None:
        non_existent_source_path = 'path/to/file.txt'

        with self.get_bucket_swap, self.assertRaisesRegex(
            ValueError,
            'Source asset does not exist at %s.' % non_existent_source_path
        ):
            cloud_storage_services.copy(
                'bucket_1', non_existent_source_path, 'other/path/to/file.txt'
            )

    def test_listdir_lists_files_with_provided_prefix(self) -> None:
        self.bucket_1.blobs['path/to/file.txt'] = MockBlob('path/to/file.txt')
        self.bucket_1.blobs['path/to/file.txt'].upload_from_string(b'abc')
        self.bucket_1.blobs['pathto/file.txt'] = MockBlob('pathto/file.txt')
        self.bucket_1.blobs['pathto/file.txt'].upload_from_string(b'def')
        self.bucket_1.blobs['path/to/file2.txt'] = MockBlob('path/to/file2.txt')
        self.bucket_1.blobs['path/to/file2.txt'].upload_from_string(b'ghi')

        with self.get_client_swap, self.get_bucket_swap:
            path_blobs = cloud_storage_services.listdir('bucket_1', 'path')
            path_slash_blobs = (
                cloud_storage_services.listdir('bucket_1', 'path/'))

        self.assertItemsEqual(
            path_blobs,
            [
                self.bucket_1.blobs['path/to/file.txt'],
                self.bucket_1.blobs['pathto/file.txt'],
                self.bucket_1.blobs['path/to/file2.txt']
            ]
        )
        self.assertItemsEqual(
            path_slash_blobs,
            [
                self.bucket_1.blobs['path/to/file.txt'],
                self.bucket_1.blobs['path/to/file2.txt']
            ]
        )
