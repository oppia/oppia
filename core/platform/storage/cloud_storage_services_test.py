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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.platform.storage import cloud_storage_services
from core.tests import test_utils


class MockClient:

    def __init__(self):
        self.buckets = {}

    def _get_bucket(self, bucket_name):
        return self.buckets[bucket_name]

    def list_blobs(self, bucket, prefix=None):
        return [
            blob for name, blob in bucket.blobs.items()
            if prefix is None or name.startswith(prefix)
        ]


class MockBucket:

    def __init__(self):
        self.blobs = {}

    def get_blob(self, filepath):
        return self.blobs.get(filepath)

    def copy_blob(self, src_blob, bucket, new_name=None):
        blob = bucket.blob(new_name if new_name else src_blob.filepath)
        blob.upload_from_string(src_blob.download_as_bytes())

    def blob(self, filepath):
        self.blobs[filepath] = MockBlob(filepath)


class MockBlob:

    __slots__ = ('filepath', 'raw_bytes', 'content_type', 'deleted')

    def __init__(self, filepath):
        self.filepath = filepath
        self.deleted = False

    def upload_from_string(self, raw_bytes, content_type=None):
        self.raw_bytes = raw_bytes
        self.content_type = content_type

    def download_as_bytes(self):
        return self.raw_bytes

    def delete(self):
        self.deleted = True


class CloudStorageServicesTests(test_utils.TestBase):

    def setUp(self):
        super().setUp()
        self.get_client_swap = self.swap(
            cloud_storage_services, '_get_client', MockClient)
