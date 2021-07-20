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

"""An emulator that mocks the core.platform.storage API."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals # pylint: disable=import-only-modules

import pickle

import feconf
import python_utils

import redis

REDIS_CLIENT = redis.StrictRedis(
    host=feconf.REDISHOST,
    port=feconf.REDISPORT,
    db=feconf.STORAGE_EMULATOR_REDIS_DB_NUMBER
)


class Blob(python_utils.OBJECT):
    """Object for storing the file data."""

    def __init__(self, name, data, content_type):
        """Initialize blob.

        Args:
            name: str. The name of the blob.
            data: str|bytes. The data of the blob. If the data are string,
                they are encoded to bytes.
            content_type: str. The content type of the blob.
        """
        self._name = name
        self._raw_bytes = (
            data.encode('utf-8') if isinstance(data, str) else data)
        self._content_type = content_type

    @classmethod
    def create_copy(cls, original_blob, new_name):
        """Create new instance of Blob with the same values.

        Args:
            original_blob: Blob. Original blob to copy.
            new_name: str. New name of the blob.

        Returns:
            Blob. New instance with the same values as original_blob.
        """
        return cls(
            new_name,
            original_blob.download_as_bytes(),
            original_blob.content_type
        )

    @property
    def name(self):
        """Get the filepath of the blob. This is called name since this mimics
        the property of Google Cloud Storage API.

        Returns:
            str. The filepath of the blob.
        """
        return self._name

    @property
    def content_type(self):
        """Get the content type of the blob.

        Returns:
            str. The content type of the blob.
        """
        return self._content_type

    def download_as_bytes(self):
        """Get the raw bytes of the blob.

        Returns:
            bytes. The raw bytes of the blob.
        """
        return self._raw_bytes

    def __eq__(self, other):
        if not isinstance(other, self.__class__):
            return False
        return self.name == other.name

    def __hash__(self):
        return hash(self.name)

    def __repr__(self):
        return 'Blob(name=%s, content_type=%s)' % (self.name, self.content_type)


class CloudStorageEmulator(python_utils.OBJECT):
    """Emulator for the storage client."""

    def __init__(self):
        """Init CloudStorageEmulator."""
        self.namespace = ''

    def _get_key(self, filepath):
        """Get redis key for filepath. The key is the filepath prepended
        with namespace and ':'.

        Args:
            filepath: st. Path to do the file we want to get key for.

        Returns:
            str. Filepath prepended by the current namespace.
        """
        return '%s:%s' % (self.namespace, filepath)

    def get_blob(self, filepath):
        """Get blob by the filepath.

        Args:
            filepath: str. Filepath to the blob.

        Returns:
            Blob. The blob.
        """
        blob_bytes = REDIS_CLIENT.get(self._get_key(filepath))
        return pickle.loads(blob_bytes) if blob_bytes is not None else None

    def upload_blob(self, filepath, blob):
        """Upload blob to the filepath.

        Args:
            filepath: str. Filepath where to upload the blob.
            blob: Blob. The blob to upload.
        """
        if not REDIS_CLIENT.set(self._get_key(filepath), pickle.dumps(blob)):
            raise Exception('Blob was not set.')

    def delete_blob(self, filepath):
        """Delete blob by the filepath.

        Args:
            filepath: str. Filepath to the blob.
        """
        REDIS_CLIENT.delete(self._get_key(filepath))

    def copy_blob(self, blob, filepath):
        """Copy existing blob to new filepath.

        Args:
            blob: Blob. The blob to copy.
            filepath: str. Filepath where the blob should be copied.
        """
        REDIS_CLIENT.set(
            self._get_key(filepath),
            pickle.dumps(Blob.create_copy(blob, filepath)))

    def list_blobs(self, prefix):
        """Get blobs whose filepaths start with prefix.

        Args:
            prefix: str. Prefix that is matched.

        Returns:
            list(Blob). The list of blobs whose filepaths start with prefix.
        """
        matching_filepaths = (
            REDIS_CLIENT.scan_iter(match='%s*' % self._get_key(prefix)))
        return [
            pickle.loads(blob_bytes) for blob_bytes
            in REDIS_CLIENT.mget(matching_filepaths)
        ]

    def reset(self):
        """Reset the emulator and remove all blobs."""
        for key in REDIS_CLIENT.scan_iter(match='%s*' % self._get_key('')):
            REDIS_CLIENT.delete(key)
