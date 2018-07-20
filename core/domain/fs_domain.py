# coding: utf-8
#
# Copyright 2016 The Oppia Authors. All Rights Reserved.
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

import logging
import os

from core.platform import models
import feconf
import utils

import cloudstorage

app_identity_services = models.Registry.import_app_identity_services()
(file_models,) = models.Registry.import_models([
    models.NAMES.file
])

CHANGE_LIST_SAVE = [{'cmd': 'save'}]


class FileMetadata(object):
    """A class representing the metadata of a file.

    Attributes:
        size: int. The size of the file, in bytes.
    """

    def __init__(self, metadata):
        """Constructs a FileMetadata object.

        Args:
            metadata: FileMetadataModel. The file metadata model instance.
        """
        self._size = metadata.size if (metadata is not None) else None

    @property
    def size(self):
        """Returns the size of the file, in bytes.

        Returns:
            int. The size of the file, in bytes.
        """
        return self._size


class FileStreamWithMetadata(object):
    """A class that wraps a file stream, but adds extra attributes to it.

    Attributes:
        content: str. The content of the file snapshot.
        version: int. The version number of the file.
        metadata: FileMetadata. The file metadata domain instance.
    """

    def __init__(self, content, version, metadata):
        """Constructs a FileStreamWithMetadata object.

        Args:
            content: str. The content of the file snapshots.
            version: int. The version number of the file.
            metadata: FileMetadataModel. The file metadata model instance.
        """
        self._content = content
        self._version = version
        self._metadata = FileMetadata(metadata)

    def read(self):
        """Emulates stream.read(). Returns all bytes and emulates EOF.

        Returns:
            content: str. The content of the file snapshot.
        """
        content = self._content
        self._content = ''
        return content

    @property
    def metadata(self):
        """Returns the file metadata model instance.

        Returns:
            FileMetadataModel. The file metadata model instance.
        """
        return self._metadata

    @property
    def version(self):
        """Returns the version number of the file.

        Returns:
            int. The version number of the file.
        """
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

    Args:
        exploration_id: str. The id of the exploration.
    """

    _DEFAULT_VERSION_NUMBER = 1

    def __init__(self, exploration_id):
        """Constructs a ExplorationFileSystem object.

        Args:
            exploration_id: str. The id of the exploration.
        """
        self._exploration_id = exploration_id

    @property
    def exploration_id(self):
        """Returns the id of the exploration.

        Returns:
            str. The exploration id.
        """
        return self._exploration_id

    def _get_file_metadata(self, filepath, version):
        """Return the desired file metadata.

        Returns None if the file does not exist.

        Args:
            filepath: str. The path to the relevant file within the exploration.
            version: int. The version number of the file whose metadata is to be
                returned.

        Returns:
            FileMetadataModel or None. The model instance representing the file
                metadata with the given exploration_id, filepath, and version,
                or None if the file does not exist.
        """
        if version is None:
            return file_models.FileMetadataModel.get_model(
                self._exploration_id, 'assets/%s' % filepath)
        else:
            return file_models.FileMetadataModel.get_version(
                self._exploration_id, 'assets/%s' % filepath, version)

    def _get_file_data(self, filepath, version):
        """Return the desired file content.

        Returns None if the file does not exist.

        Args:
            filepath: str. The path to the relevant file within the exploration.
            version: int. The version number of the file to be returned.

        Returns:
            FileModel or None. The model instance representing the file with the
                given exploration_id, filepath, and version; or None if the file
                does not exist.
        """
        if version is None:
            return file_models.FileModel.get_model(
                self._exploration_id, 'assets/%s' % filepath)
        else:
            return file_models.FileModel.get_version(
                self._exploration_id, 'assets/%s' % filepath, version)

    def _save_file(self, user_id, filepath, raw_bytes):
        """Create or update a file.

        Args:
            user_id: str. The user_id of the user who wants to create or update
                a file.
            filepath: str. The path to the relevant file within the exploration.
            raw_bytes: str. The content to be stored in file.

        Raises:
            Exception: The maximum allowed file size is 1MB.
        """
        if len(raw_bytes) > feconf.MAX_FILE_SIZE_BYTES:
            raise Exception('The maximum allowed file size is 1 MB.')

        metadata = self._get_file_metadata(filepath, None)
        if not metadata:
            metadata = file_models.FileMetadataModel.create(
                self._exploration_id, 'assets/%s' % filepath)
        metadata.size = len(raw_bytes)

        data = self._get_file_data(filepath, None)
        if not data:
            data = file_models.FileModel.create(
                self._exploration_id, 'assets/%s' % filepath)
        data.content = raw_bytes

        data.commit(user_id, CHANGE_LIST_SAVE)
        metadata.commit(user_id, CHANGE_LIST_SAVE)

    def get(self, filepath, version=None, mode=None):  # pylint: disable=unused-argument
        """Gets a file as an unencoded stream of raw bytes.

        If `version` is not supplied, the latest version is retrieved. If the
        file does not exist, None is returned.

        The 'mode' argument is unused. It is included so that this method
        signature matches that of other file systems.

        Args:
            filepath: str. The path to the relevant file within the exploration.
            version: int or None. The version number of the file. None indicates
                the latest version of the file.
            mode: str. Unused argument.

        Returns:
            FileStreamWithMetadata or None. It returns FileStreamWithMetadata
                domain object if the file exists. Otherwise, it returns None.
        """
        metadata = self._get_file_metadata(filepath, version)
        if metadata:
            data = self._get_file_data(filepath, version)
            if data:
                if version is None:
                    version = data.version
                return FileStreamWithMetadata(data.content, version, metadata)
            else:
                logging.error(
                    'Metadata and data for file %s (version %s) are out of '
                    'sync.' % (filepath, version))
                return None
        else:
            return None

    def commit(self, user_id, filepath, raw_bytes, unused_mimetype):
        """Saves a raw bytestring as a file in the database.

        Args:
            user_id: str. The user_id of the user who wants to create or update
                a file.
            filepath: str. The path to the relevant file within the exploration.
            raw_bytes: str. The content to be stored in the file.
            unused_mimetype: str. Unused argument.
        """
        self._save_file(user_id, filepath, raw_bytes)

    def delete(self, user_id, filepath):
        """Marks the current version of a file as deleted.

        Args:
            user_id: str. The user_id of the user who wants to create or update
                a file.
            filepath: str. The path to the relevant file within the exploration.
        """

        metadata = self._get_file_metadata(filepath, None)
        if metadata:
            metadata.delete(user_id, '')

        data = self._get_file_data(filepath, None)
        if data:
            data.delete(user_id, '')

    def isfile(self, filepath):
        """Checks the existence of a file.

        Args:
            filepath: str. The path to the relevant file within the exploration.

        Returns:
            bool. Whether the file exists.
        """
        metadata = self._get_file_metadata(filepath, None)
        return bool(metadata)

    def listdir(self, dir_name):
        """Lists all files in a directory.

        Args:
            dir_name: str. The directory whose files should be listed. This
                should not start with '/' or end with '/'.

        Returns:
            list(str). A lexicographically-sorted list of filenames,
                each of which is prefixed with dir_name.
        """
        # The trailing slash is necessary to prevent non-identical directory
        # names with the same prefix from matching, e.g. /abcd/123.png should
        # not match a query for files under /abc/.
        prefix = '%s' % utils.vfs_construct_path(
            '/', self._exploration_id, 'assets', dir_name)
        if not prefix.endswith('/'):
            prefix += '/'

        result = set()
        metadata_models = file_models.FileMetadataModel.get_undeleted()
        for metadata_model in metadata_models:
            filepath = metadata_model.id
            if filepath.startswith(prefix):
                result.add('/'.join(filepath.split('/')[3:]))
        return sorted(list(result))


class DiskBackedFileSystem(object):
    """Implementation for a disk-backed file system.

    This implementation ignores versioning and is used only by tests.

    Attributes:
        root: str. The path to append to the oppia/ directory.
        exploration_id: str. The id of the exploration.
    """

    def __init__(self, root):
        """Constructor for this class.

        Args:
            root: str. The path to append to the oppia/ directory.
        """
        self._root = os.path.join(os.getcwd(), root)
        self._exploration_id = 'test'

    @property
    def exploration_id(self):
        """Returns the id of the exploration.

        Returns:
            str. The exploration id.
        """
        return self._exploration_id

    def isfile(self, filepath):
        """Checks if a file exists.

        Args:
            filepath: str. The path to the relevant file within the exploration.

        Returns:
            bool. Whether the file exists.
        """
        return os.path.isfile(os.path.join(self._root, filepath))

    def get(self, filepath, version=None, mode='r'):  # pylint: disable=unused-argument
        """Returns a bytestring with the file content, but no metadata.

        Args:
            filepath: str. The path to the relevant file within the exploration.
            version: int or None. The version number of the file. None indicates
                the latest version of the file.
            mode: str. The mode with which to open the file.

        Returns:
            FileStreamWithMetadata. A FileStreamWithMetadata domain object that
                contains only the content of the file, but no metadata.
        """
        content = utils.get_file_contents(
            os.path.join(self._root, filepath), raw_bytes=True, mode=mode)
        return FileStreamWithMetadata(content, None, None)

    def commit(self, user_id, filepath, raw_bytes, mimetype):
        """Raises NotImplementedError if the method is not implemented in the
        derived classes.

        Args:
            user_id: str. The id of the user.
            filepath: str. The path to the relevant file within the exploration.
            raw_bytes: str. The content to be stored in the file.
            mimetype: str. The content-type of the file.

        Raises:
            NotImplementedError. The method is not implemented in the derived
                classes.
        """
        raise NotImplementedError

    def delete(self, user_id, filepath):
        """Raises NotImplementedError if the method is not implemented in the
        derived classes.

        Args:
            user_id: str. The id of the user.
            filepath: str. The path to the relevant file within the exploration.

        Raises:
            NotImplementedError. The method is not implemented in the derived
                classes.
        """
        raise NotImplementedError

    def listdir(self, dir_name):
        """Raises NotImplementedError if the method is not implemented in the
        derived classes.

        Args:
            dir_name: str. The name of the directory.

        Raises:
            NotImplementedError. The method is not implemented in the derived
                classes.
        """
        raise NotImplementedError


class GcsFileSystem(object):
    """Wrapper for a file system based on GCS.

    This implementation ignores versioning.

    Attributes:
        exploration_id: str. The id of the exploration.
    """

    def __init__(self, exploration_id):
        """Constructs a GcsFileSystem object.

        Args:
            exploration_id: str. The id of the exploration.
        """
        self._exploration_id = exploration_id

    @property
    def exploration_id(self):
        """Returns the exploration id.

        Returns:
            str. The exploration id.
        """
        return self._exploration_id

    def isfile(self, filepath):
        """Checks if the file with the given filepath exists in the GCS.

        Args:
            filepath: str. The path to the relevant file within the exploration.

        Returns:
            bool. Whether the file exists in GCS.
        """
        bucket_name = app_identity_services.get_gcs_resource_bucket_name()

        # Upload to GCS bucket with filepath
        # "<bucket>/<exploration-id>/assets/<filepath>".
        gcs_file_url = (
            '/%s/%s/assets/%s' % (
                bucket_name, self._exploration_id, filepath))
        try:
            return cloudstorage.stat(gcs_file_url, retry_params=None)
        except cloudstorage.NotFoundError:
            return False

    def get(self, filepath, version=None, mode='r'):  # pylint: disable=unused-argument
        """Raises NotImplementedError if the method is not implemented in the
        derived classes.

        Args:
            filepath: str. The path to the relevant file within the exploration.
            version: int or None. The version of the file.
            mode: str. The mode in which the file is to be opened.

        Raises:
            NotImplementedError. The method is not implemented in the derived
                classes.
        """
        raise NotImplementedError

    def commit(self, unused_user_id, filepath, raw_bytes, mimetype):
        """Args:
            unused_user_id: str. Unused argument.
            filepath: str. The path to the relevant file within the exploration.
            raw_bytes: str. The content to be stored in the file.
            mimetype: str. The content-type of the cloud file.
        """
        bucket_name = app_identity_services.get_gcs_resource_bucket_name()

        # Upload to GCS bucket with filepath
        # "<bucket>/<exploration-id>/assets/<filepath>".
        gcs_file_url = (
            '/%s/%s/assets/%s' % (
                bucket_name, self._exploration_id, filepath))
        gcs_file = cloudstorage.open(
            gcs_file_url, mode='w', content_type=mimetype)
        gcs_file.write(raw_bytes)
        gcs_file.close()

    def delete(self, user_id, filepath):
        """Raises NotImplementedError if the method is not implemented in the
        derived classes.

        Args:
            user_id: str. The id of the user.
            filepath: str. The path to the relevant file within the exploration.

        Raises:
            NotImplementedError. The method is not implemented in the derived
                classes.
        """
        raise NotImplementedError

    def listdir(self, dir_name):
        """Raises NotImplementedError if the method is not implemented in the
        derived classes.

        Args:
            dir_name: str. The name of the directory.

        Raises:
            NotImplementedError. The method is not implemented in the derived
                classes.
        """
        raise NotImplementedError


class AbstractFileSystem(object):
    """Interface for a file system."""

    def __init__(self, impl):
        """Constructs a AbstractFileSystem object."""
        self._impl = impl

    @property
    def impl(self):
        """Returns a AbstractFileSystem object.

        Returns:
            AbstractFileSystem. The AbstractFileSystem object.
        """
        return self._impl

    def _check_filepath(self, filepath):
        """Raises an error if a filepath is invalid.

        Args:
            filepath: str. The path to the relevant file within the exploration.

        Raises:
            IOError: Invalid filepath.
        """
        base_dir = utils.vfs_construct_path(
            '/', self.impl.exploration_id, 'assets')
        absolute_path = utils.vfs_construct_path(base_dir, filepath)
        normalized_path = utils.vfs_normpath(absolute_path)

        # This check prevents directory traversal.
        if not normalized_path.startswith(base_dir):
            raise IOError('Invalid filepath: %s' % filepath)

    def isfile(self, filepath):
        """Checks if a file exists. Similar to os.path.isfile(...).

        Args:
            filepath: str. The path to the relevant file within the exploration.

        Returns:
            bool. Whether the file exists.
        """
        self._check_filepath(filepath)
        return self._impl.isfile(filepath)

    def open(self, filepath, version=None, mode='r'):
        """Returns a stream with the file content. Similar to open(...).

        Args:
            filepath: str. The path to the relevant file within the exploration.
            version: int or None. The version number of the file. None indicates
                the latest version of the file.
            mode: str. The mode with which to open the file.

        Returns:
            FileStreamWithMetadata. The file stream domain object.
        """
        self._check_filepath(filepath)
        return self._impl.get(filepath, version=version, mode=mode)

    def get(self, filepath, version=None, mode='r'):
        """Returns a bytestring with the file content, but no metadata.

        Args:
            filepath: str. The path to the relevant file within the exploration.
            version: int or None. The version number of the file. None indicates
                the latest version of the file.
            mode: str. The mode with which to open the file.

        Returns:
            FileStreamWithMetadata. The file stream domain object.

        Raises:
            IOError: The given (or latest) version of this file stream does not
                exist.
        """
        file_stream = self.open(filepath, version=version, mode=mode)
        if file_stream is None:
            raise IOError(
                'File %s (version %s) not found.'
                % (filepath, version if version else 'latest'))
        return file_stream.read()

    def commit(self, user_id, filepath, raw_bytes, mimetype=None):
        """Replaces the contents of the file with the given by test string.

        Args:
            user_id: str. The user_id of the user who wants to create or update
                a file.
            filepath: str. The path to the relevant file within the exploration.
            raw_bytes: str. The content to be stored in the file.
            mimetype: str. The content-type of the file.
        """
        raw_bytes = str(raw_bytes)
        self._check_filepath(filepath)
        self._impl.commit(user_id, filepath, raw_bytes, mimetype)

    def delete(self, user_id, filepath):
        """Deletes a file and the metadata associated with it.

        Args:
            user_id: str. The user_id of the user who wants to create or update
                a file.
            filepath: str. The path to the relevant file within the exploration.
        """
        self._check_filepath(filepath)
        self._impl.delete(user_id, filepath)

    def listdir(self, dir_name):
        """Lists all the files in a directory. Similar to os.listdir(...).

        Args:
            dir_name: str. The directory whose files should be listed. This
                should not start with '/' or end with '/'.

        Returns:
            list(str). A lexicographically-sorted list of filenames,
            each of which is prefixed with dir_name.
        """
        self._check_filepath(dir_name)
        return self._impl.listdir(dir_name)
