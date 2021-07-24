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

"""Tests for cloud_storage_emulator."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.platform.storage import cloud_storage_emulator
from core.tests import test_utils


class BlobUnitTests(test_utils.TestBase):
    """Tests for Blob."""

    def test_init_blob_with_str_creates_blob(self):
        blob = cloud_storage_emulator.Blob('name', 'string', 'image/png')
        self.assertEqual(blob.name, 'name')
        self.assertEqual(blob.download_as_bytes(), b'string')
        self.assertEqual(blob.content_type, 'image/png')

    def test_init_blob_with_bytes_creates_blob(self):
        blob = cloud_storage_emulator.Blob('name', b'string', 'image/png')
        self.assertEqual(blob.name, 'name')
        self.assertEqual(blob.download_as_bytes(), b'string')
        self.assertEqual(blob.content_type, 'image/png')

    def test_init_blob_with_wrong_mimetype_raise_exception(self):
        with self.assertRaisesRegexp(
                Exception, 'Content type contains unknown MIME type.'):
            cloud_storage_emulator.Blob('name', b'string', 'png')

    def test_create_copy_creates_identical_copy(self):
        orig_blob = cloud_storage_emulator.Blob('name', 'string', 'image/png')
        copy_blob = cloud_storage_emulator.Blob.create_copy(orig_blob, 'new')
        self.assertNotEqual(orig_blob, copy_blob)
        self.assertNotEqual(orig_blob.name, copy_blob.name)
        self.assertEqual(
            orig_blob.download_as_bytes(), copy_blob.download_as_bytes())
        self.assertEqual(orig_blob.content_type, copy_blob.content_type)

    def test_to_dict_returns_correct_dictionary(self):
        blob = cloud_storage_emulator.Blob('name', b'string', 'image/png')
        self.assertEqual(
            blob.to_dict(),
            {
                b'name': b'name',
                b'raw_bytes': b'string',
                b'content_type': b'image/png'
            }
        )

    def test_from_dict_returns_blob(self):
        blob = cloud_storage_emulator.Blob('name', b'string', 'image/png')
        self.assertEqual(
            blob,
            cloud_storage_emulator.Blob.from_dict({
                b'name': b'name',
                b'raw_bytes': b'string',
                b'content_type': b'image/png'
            })
        )

    def test_compare_blob_and_int_is_false(self):
        orig_blob = cloud_storage_emulator.Blob('name', 'string', 'image/png')
        self.assertFalse(orig_blob == 1)

    def test_repr_returns_correct_string_representation(self):
        orig_blob = cloud_storage_emulator.Blob('name', 'string', 'image/png')
        self.assertEqual(
            orig_blob.__repr__(), 'Blob(name=name, content_type=image/png)')


class CloudStorageEmulatorUnitTests(test_utils.TestBase):
    """Tests for CloudStorageEmulator."""

    def setUp(self):
        super(CloudStorageEmulatorUnitTests, self).setUp()
        self.emulator = cloud_storage_emulator.CloudStorageEmulator()
        self.emulator.namespace = 'namespace'
        self.emulator.reset()
        self.blob1 = cloud_storage_emulator.Blob(
            '/file/path.png', b'data', 'image/png')
        self.blob2 = cloud_storage_emulator.Blob(
            '/file/path2.png', b'data2', 'image/png')
        self.blob3 = cloud_storage_emulator.Blob(
            '/different/path.png', b'data2', 'image/png')

    def tearDown(self):
        super(CloudStorageEmulatorUnitTests, self).tearDown()
        self.emulator.reset()

    def test_get_blob_retrives_correct_blob_from_redis(self):
        cloud_storage_emulator.REDIS_CLIENT.hset(
            'namespace:/file/path.png', mapping=self.blob1.to_dict())

        self.assertEqual(self.emulator.get_blob('/file/path.png'), self.blob1)

    def test_upload_blob_saves_correct_blob_to_redis(self):
        self.emulator.upload_blob('/file/path.png', self.blob1)

        self.assertEqual(
            cloud_storage_emulator.Blob.from_dict(
                cloud_storage_emulator.REDIS_CLIENT.hgetall(
                    'namespace:/file/path.png')),
            self.blob1
        )

    def test_delete_blob_removes_blob_from_redis(self):
        cloud_storage_emulator.REDIS_CLIENT.hset(
            'namespace:/file/path.png', mapping=self.blob1.to_dict())
        self.emulator.delete_blob('/file/path.png')

        self.assertIsNone(
            cloud_storage_emulator.REDIS_CLIENT.get('/file/path.png'))

    def test_copy_blob_saves_copy_of_blob_to_redis(self):
        cloud_storage_emulator.REDIS_CLIENT.hset(
            'namespace:/file/path.png', mapping=self.blob1.to_dict())
        self.emulator.copy_blob(
            cloud_storage_emulator.Blob.from_dict(
                cloud_storage_emulator.REDIS_CLIENT.hgetall(
                    'namespace:/file/path.png')),
            '/different/path2.png'
        )

        orig_blob = self.emulator.get_blob('/file/path.png')
        copy_blob = self.emulator.get_blob('/different/path2.png')
        self.assertNotEqual(orig_blob.name, copy_blob.name)
        self.assertEqual(
            orig_blob.download_as_bytes(), copy_blob.download_as_bytes())
        self.assertEqual(orig_blob.content_type, copy_blob.content_type)

    def test_list_blobs_returns_list_of_blobs_with_prefix(self):
        cloud_storage_emulator.REDIS_CLIENT.hset(
            'namespace:/file/path.png', mapping=self.blob1.to_dict())
        cloud_storage_emulator.REDIS_CLIENT.hset(
            'namespace:/file/path2.png', mapping=self.blob2.to_dict())
        cloud_storage_emulator.REDIS_CLIENT.hset(
            'namespace:/different/path.png', mapping=self.blob3.to_dict())
        self.assertItemsEqual(
            self.emulator.list_blobs('/'),
            [self.blob1, self.blob2, self.blob3])
        self.assertItemsEqual(
            self.emulator.list_blobs('/file'), [self.blob1, self.blob2])
        self.assertItemsEqual(
            self.emulator.list_blobs('/different'), [self.blob3])

    def test_reset_removes_all_values_from_redis(self):
        cloud_storage_emulator.REDIS_CLIENT.hset(
            'namespace:/file/path.png', mapping=self.blob1.to_dict())
        self.emulator.reset()

        self.assertEqual(
            list(cloud_storage_emulator.REDIS_CLIENT.scan_iter(
                match='namespace:*')),
            []
        )
