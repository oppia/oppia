# coding: utf-8
#
# Copyright 2013 Google Inc. All Rights Reserved.
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

"""Domain objects representing a file system and a file stream."""

__author__ = 'Sean Lip'

import os

from core.platform import models
(file_models,) = models.Registry.import_models([
    models.NAMES.file
])
transaction_services = models.Registry.import_transaction_services()


class FileStreamWithMetadata(object):
    """A class that wraps a file stream, but adds extra attributes to it."""

    def __init__(self, metadata, data):
        self._metadata = metadata
        self._data = data

    def read(self):
        """Emulates stream.read(). Returns all bytes and emulates EOF."""
        data = self._data
        self._data = ''
        return data

    @property
    def metadata(self):
        return self._metadata


class DatastoreBackedFileSystem(object):
    """A read-write file system backed by a datastore."""

    def get(self, exploration_id, filepath):
        """Gets a file as an unencoded stream of raw bytes."""

        metadata = file_models.FileMetadataModel.get(exploration_id, filepath)
        if metadata:
            data = file_models.FileDataModel.get(exploration_id, filepath)
            if data:
                return FileStreamWithMetadata(metadata, data.data)

    def put(self, exploration_id, filepath, raw_bytes):
        """Saves a raw bytestring as a file in the database."""

        def _put_in_transaction(exploration_id, filepath, raw_bytes):
            metadata = file_models.FileMetadataModel.get(
                exploration_id, filepath)
            if not metadata:
                metadata = file_models.FileMetadataModel.create(
                    exploration_id, filepath)

            metadata.size = len(raw_bytes)

            data = file_models.FileDataModel.create(exploration_id, filepath)
            data.data = raw_bytes

            data.put()
            metadata.put()

        transaction_services.run_in_transaction(
            _put_in_transaction, exploration_id, filepath, raw_bytes)

    def delete(self, exploration_id, filepath):
        """Deletes a file."""

        def _delete_in_transaction(exploration_id, filepath):
            metadata = file_models.FileMetadataModel.get(
                exploration_id, filepath)
            if metadata:
                metadata.delete()

            data = file_models.FileDataModel.get(exploration_id, filepath)
            if data:
                data.delete()

        transaction_services.run_in_transaction(
            _delete_in_transaction, exploration_id, filepath)

    def isfile(self, exploration_id, filepath):
        """Checks the existence of a file."""
        metadata = file_models.FileMetadataModel.get(exploration_id, filepath)
        return bool(metadata)

    def listdir(self, exploration_id, dir_name):
        """Lists all files in a directory. `dir_name` should not start with '/'.

        Returns:
            List of str. This is a lexicographically-sorted list of filenames,
            each of which is prefixed with dir_name.
        """
        # The trailing slash is necessary to prevent non-identical directory
        # names with the same prefix from matching, e.g. /abcd/123.png should
        # not match a query for files under /abc/.
        prefix = '%s/' % os.path.join('/', exploration_id, dir_name)

        result = set()
        metadata_models = file_models.FileMetadataModel.get_all()
        for metadata_model in metadata_models:
            filepath = metadata_model.id
            if filepath.startswith(prefix):
                result.add('/'.join(filepath.split('/')[2:]))
        return sorted(list(result))


class AbstractFileSystem(object):
    """Interface for a file system."""

    def __init__(self, impl):
        self._impl = impl

    def isfile(self, exploration_id, filepath):
        """Checks if a file exists. Similar to os.path.isfile(...)."""
        return self._impl.isfile(exploration_id, filepath)

    def open(self, exploration_id, filepath):
        """Returns a stream with the file content. Similar to open(...)."""
        return self._impl.get(exploration_id, filepath)

    def get(self, exploration_id, filepath):
        """Returns a bytestring with the file content, but no metadata."""
        return self._impl.get(exploration_id, filepath).read()

    def put(self, exploration_id, filepath, raw_bytes):
        """Replaces the contents of the file with the given bytestring."""
        self._impl.put(exploration_id, filepath, raw_bytes)

    def delete(self, exploration_id, filepath):
        """Deletes a file and the metadata associated with it."""
        self._impl.delete(exploration_id, filepath)

    def listdir(self, exploration_id, dir_name):
        """Lists all the files in a directory. Similar to os.listdir(...)."""
        return self._impl.listdir(exploration_id, dir_name)


def delete_all_files():
    """Deletes all files and file metadata."""
    for file_data in file_models.FileDataModel.get_all():
        file_data.delete()
    for file_metadata in file_models.FileMetadataModel.get_all():
        file_metadata.delete()
