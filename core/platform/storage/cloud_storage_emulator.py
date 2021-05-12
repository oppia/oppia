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

"""An emulator that mocks the core.platform.cloud_translate API. This emulator
models the Cloud Translate API.
"""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals # pylint: disable=import-only-modules

import python_utils


class Blob(python_utils.OBJECT):

    @classmethod
    def create_copy(cls, blob):
        return cls(blob.name, blob.download_as_bytes, blob.content_type)

    def __init__(self, name, raw_bytes, content_type):
        self._name = name
        self._raw_bytes = raw_bytes
        self._content_type = content_type

    @property
    def name(self):
        return self._name

    @property
    def content_type(self):
        return self._content_type

    def download_as_bytes(self):
        return self._raw_bytes


class CloudStorageEmulator(python_utils.OBJECT):
    """Emulator for the storage client."""

    def __init__(self):
        self._blob_dict = {}

    def get_blob(self, filepath):
        return self._blob_dict.get(filepath)

    def upload_blob(self, filepath, blob):
        self._blob_dict[filepath] = blob

    def delete_blob(self, filepath):
        del self._blob_dict[filepath]

    def copy_blob(self, blob, new_name):
        self._blob_dict[new_name] = Blob.create_copy(blob)

    def list_blobs(self, prefix):
        return [
            value for key, value in self._blob_dict.items()
            if key.startswith(prefix)
        ]

    def reset(self):
        self._blob_dict = {}