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


class FileMetadata(object):
    """A class representing the metadata of a file."""
    def __init__(self, metadata):
        self._size = metadata.size

    @property
    def size(self):
        return self._size


class FileStreamWithMetadata(object):
    """A class that wraps a file stream, but adds extra attributes to it."""

    def __init__(self, content, version, metadata):
        """The args are a file content blob and a metadata model object."""
        self._content = content
        self._version = version
        self._metadata = FileMetadata(metadata)

    def read(self):
        """Emulates stream.read(). Returns all bytes and emulates EOF."""
        content = self._content
        self._content = ''
        return content

    @property
    def metadata(self):
        return self._metadata

    @property
    def version(self):
        return self._version


class ExplorationFileSystem(object):
    """A datastore-backed read-write file system for a single exploration.

    The conceptual intention is for each exploration to have its own asset
    folder. An asset has no meaning outside its exploration, so the assets in
    these asset folders should therefore not be edited directly. They should
    only be modified as side-effects of some other operation (such as adding an
    image to an exploration).

    The content of an exploration should include a reference to the asset
    together with the version number of the asset. This allows the
    exploration to refer to asset versions.

    In general, assets should be retrieved only within the context of the
    exploration that contains them, and should not be retrieved outside this
    context.
    """

    _DEFAULT_VERSION_NUMBER = 1

    def __init__(self, exploration_id):
        self._exploration_id = exploration_id

    def _get_file_metadata(self, filepath, version):
        """Return the desired file metadata."""
        if version is None:
            return file_models.FileMetadataModel.get(
                self._exploration_id, filepath)
        else:
            return file_models.FileMetadataHistoryModel.get(
                self._exploration_id, filepath, version)

    def _get_file_data(self, filepath, version):
        """Return the desired file data."""
        if version is None:
            return file_models.FileDataModel.get(self._exploration_id, filepath)
        else:
            return file_models.FileDataHistoryModel.get(
                self._exploration_id, filepath, version)

    def _create_file(self, filepath, version, raw_bytes):
        """Create or update a file."""
        metadata = file_models.FileMetadataModel.create(
            self._exploration_id, filepath)
        metadata.size = len(raw_bytes)
        metadata.version = version

        metadata_history = file_models.FileMetadataHistoryModel.create(
            self._exploration_id, filepath, version)
        metadata_history.size = len(raw_bytes)

        data = file_models.FileDataModel.create(self._exploration_id, filepath)
        data.content = raw_bytes
        data.version = version

        data_history = file_models.FileDataHistoryModel.create(
            self._exploration_id, filepath, version)
        data_history.content = raw_bytes

        data.put()
        data_history.put()
        metadata.put()
        metadata_history.put()

    def get(self, filepath, version=None):
        """Gets a file as an unencoded stream of raw bytes.

        If `version` is not supplied, the latest version is retrieved.
        """
        metadata = self._get_file_metadata(filepath, version)
        if metadata:
            data = self._get_file_data(filepath, version)
            if data:
                if version is None:
                    version = data.version
                return FileStreamWithMetadata(data.content, version, metadata)

    def put(self, filepath, raw_bytes):
        """Saves a raw bytestring as a file in the database.

        Calling this method creates a new version of the file.
        """

        def _put_in_transaction(filepath, raw_bytes):
            metadata = self._get_file_metadata(filepath, None)

            new_version = (metadata.version + 1 if metadata else
                           self._DEFAULT_VERSION_NUMBER)

            self._create_file(filepath, new_version, raw_bytes)

        transaction_services.run_in_transaction(
            _put_in_transaction, filepath, raw_bytes)

    def delete(self, filepath):
        """Marks the current version of a file as deleted."""

        metadata = self._get_file_metadata(filepath, None)
        if metadata:
            metadata.deleted = True
            metadata.put()

        data = self._get_file_data(filepath, None)
        if data:
            data.deleted = True
            data.put()

    def isfile(self, filepath):
        """Checks the existence of a file."""
        metadata = self._get_file_metadata(filepath, None)
        return bool(metadata)

    def listdir(self, dir_name):
        """Lists all files in a directory.

        Args:
            dir_name: The directory whose files should be listed. This should
                not start with '/' or end with '/'.

        Returns:
            List of str. This is a lexicographically-sorted list of filenames,
            each of which is prefixed with dir_name.
        """
        # The trailing slash is necessary to prevent non-identical directory
        # names with the same prefix from matching, e.g. /abcd/123.png should
        # not match a query for files under /abc/.
        prefix = '%s/' % os.path.join('/', self._exploration_id, dir_name)

        result = set()
        metadata_models = file_models.FileMetadataModel.get_undeleted()
        for metadata_model in metadata_models:
            filepath = metadata_model.id
            if filepath.startswith(prefix):
                result.add('/'.join(filepath.split('/')[2:]))
        return sorted(list(result))


class AbstractFileSystem(object):
    """Interface for a file system."""

    def __init__(self, impl):
        self._impl = impl

    def isfile(self, filepath):
        """Checks if a file exists. Similar to os.path.isfile(...)."""
        return self._impl.isfile(filepath)

    def open(self, filepath, version=None):
        """Returns a stream with the file content. Similar to open(...)."""
        return self._impl.get(filepath, version=version)

    def get(self, filepath, version=None):
        """Returns a bytestring with the file content, but no metadata."""
        return self._impl.get(filepath, version=version).read()

    def put(self, filepath, raw_bytes):
        """Replaces the contents of the file with the given bytestring."""
        self._impl.put(filepath, raw_bytes)

    def delete(self, filepath):
        """Deletes a file and the metadata associated with it."""
        self._impl.delete(filepath)

    def listdir(self, dir_name):
        """Lists all the files in a directory. Similar to os.listdir(...)."""
        return self._impl.listdir(dir_name)


def delete_all_files():
    """Deletes all files, file metadata and their histories."""
    for file_data in file_models.FileDataModel.get_all():
        file_data.delete()
    for file_data_history in file_models.FileDataHistoryModel.get_all():
        file_data_history.delete()
    for file_metadata in file_models.FileMetadataModel.get_all():
        file_metadata.delete()
    for file_metadata_history in file_models.FileMetadataHistoryModel.get_all():
        file_metadata_history.delete()
