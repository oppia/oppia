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

import mimetypes

import feconf
import python_utils

import redis

REDIS_CLIENT = redis.StrictRedis(
    host=feconf.REDISHOST,
    port=feconf.REDISPORT,
    db=feconf.STORAGE_EMULATOR_REDIS_DB_INDEX
)


class Blob(python_utils.OBJECT):
    """Object for storing the file data."""

    def __init__(self, name, data, content_type):
        """Initialize blob.

        Args:
            name: str. The name of the blob.
            data: str|bytes. The data of the blob. If the data are string,
                they are encoded to bytes.
            content_type: optional(str). The content type of the blob, it should
                be in the MIME format.
        """
        self._name = name
        self._raw_bytes = (
            data.encode('utf-8') if isinstance(data, str) else data)
        if content_type is None:
            self._content_type, _ = mimetypes.guess_type(name)
        else:
            if mimetypes.guess_extension(content_type) is None:
                raise Exception('Content type contains unknown MIME type.')
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

    def to_dict(self):
        """Transform the Blob into dictionary that can be saved into Redis.

        Returns:
            dict(bytes, bytes). Dictionary containing all values of Blob.
        """
        # Since Redis saves all values in bytes, we do an encode on values and
        # also use byte keys.
        blob_dict = {
            b'name': self._name.encode('utf-8'),
            b'raw_bytes': self._raw_bytes,
            b'content_type': self._content_type.encode('utf-8')
        }
        return blob_dict

    @classmethod
    def from_dict(cls, blob_dict):
        """Transform dictionary from Redis into Blob.

        Args:
            blob_dict: dict(bytes, bytes). Dictionary containing all values
                of Blob.

        Returns:
            Blob. Blob created from the dictionary.
        """
        # Since Redis saves all values in bytes, we do a decode on values and
        # also use byte keys.
        return cls(
            blob_dict[b'name'].decode('utf-8'),
            blob_dict[b'raw_bytes'],
            blob_dict[b'content_type'].decode('utf-8')
        )

    @property
    def name(self):
        """Get the filepath of the blob. This is called 'name' since this mimics
        the corresponding property in the Google Cloud Storage API.

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
        """Initialize the CloudStorageEmulator class.."""
        self.namespace = ''

    def _get_redis_key(self, filepath):
        """Construct and return the Redis key for the given filepath. The key
        is the filepath prepended with namespace and ':'.

        Args:
            filepath: str. Path to do the file we want to get key for.

        Returns:
            str. Filepath prepended by the current namespace.
        """
        return '%s:%s' % (self.namespace, filepath)

    def get_blob(self, filepath):
        """Get the blob located at the given filepath.

        Args:
            filepath: str. Filepath to the blob.

        Returns:
            Blob. The blob.
        """
        blob_dict = REDIS_CLIENT.hgetall(self._get_redis_key(filepath))
        print(blob_dict)
        return Blob.from_dict(blob_dict) if blob_dict else None

    def upload_blob(self, filepath, blob):
        """Upload the given blob to the filepath.

        Args:
            filepath: str. Filepath to upload the blob to.
            blob: Blob. The blob to upload.
        """
        if not REDIS_CLIENT.hset(
                self._get_redis_key(filepath), mapping=blob.to_dict()):
            raise Exception('Blob was not set.')

    def delete_blob(self, filepath):
        """Delete the blob at the given filepath.

        Args:
            filepath: str. Filepath of the blob.
        """
        REDIS_CLIENT.delete(self._get_redis_key(filepath))

    def copy_blob(self, blob, filepath):
        """Copy existing blob to new filepath.

        Args:
            blob: Blob. The blob to copy.
            filepath: str. The filepath to copy the blob to.
        """
        REDIS_CLIENT.hset(
            self._get_redis_key(filepath),
            mapping=Blob.create_copy(blob, filepath).to_dict())

    def list_blobs(self, prefix):
        """Get blobs whose filepaths start with the given prefix.

        Args:
            prefix: str. The prefix to match.

        Returns:
            list(Blob). The list of blobs whose filepaths start with
            the given prefix.
        """
        matching_filepaths = (
            REDIS_CLIENT.scan_iter(match='%s*' % self._get_redis_key(prefix)))

        # Create a pipeline that is then executed at one.
        pipeline = REDIS_CLIENT.pipeline()
        for filepath in matching_filepaths:
            pipeline.hgetall(filepath)
        blob_dicts = pipeline.execute()

        return [
            Blob.from_dict(blob_dict) for blob_dict in blob_dicts
        ]

    def reset(self):
        """Reset the emulator and remove all blobs."""
        for key in REDIS_CLIENT.scan_iter(
                match='%s*' % self._get_redis_key('')):
            REDIS_CLIENT.delete(key)
