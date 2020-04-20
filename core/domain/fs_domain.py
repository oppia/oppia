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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.platform import models
import feconf
import python_utils
import utils

import cloudstorage

app_identity_services = models.Registry.import_app_identity_services()

CHANGE_LIST_SAVE = [{'cmd': 'save'}]

ALLOWED_ENTITY_NAMES = [
    feconf.ENTITY_TYPE_EXPLORATION, feconf.ENTITY_TYPE_TOPIC,
    feconf.ENTITY_TYPE_SKILL, feconf.ENTITY_TYPE_STORY,
    feconf.ENTITY_TYPE_QUESTION, feconf.ENTITY_TYPE_VOICEOVER_APPLICATION]


class FileStream(python_utils.OBJECT):
    """A class that wraps a file stream, but adds extra attributes to it.

    Attributes:
        content: str. The content of the file snapshot.
    """

    def __init__(self, content):
        """Constructs a FileStream object.

        Args:
            content: str. The content of the file snapshots.
        """
        self._content = content

    def read(self):
        """Emulates stream.read(). Returns all bytes and emulates EOF.

        Returns:
            content: str. The content of the file snapshot.
        """
        content = self._content
        self._content = ''
        return content


class GeneralFileSystem(python_utils.OBJECT):
    """The parent class which is inherited by GcsFileSystem.

    Attributes:
        entity_name: str. The name of the entity (eg: exploration, topic etc).
        entity_id: str. The ID of the corresponding entity.
    """
    def __init__(self, entity_name, entity_id):
        """Constructs a GeneralFileSystem object.

        Args:
            entity_name: str. The name of the entity
                (eg: exploration, topic etc).
            entity_id: str. The ID of the corresponding entity.
        """
        self._validate_entity_parameters(entity_name, entity_id)
        self._assets_path = '%s/%s/assets' % (entity_name, entity_id)

    def _validate_entity_parameters(self, entity_name, entity_id):
        """Checks whether the entity_id and entity_name passed in are valid.

        Args:
            entity_name: str. The name of the entity
                (eg: exploration, topic etc).
            entity_id: str. The ID of the corresponding entity.

        Raises:
            ValidationError. When parameters passed in are invalid.
        """
        if entity_name not in ALLOWED_ENTITY_NAMES:
            raise utils.ValidationError(
                'Invalid entity_name received: %s.' % entity_name)
        if not isinstance(entity_id, python_utils.BASESTRING):
            raise utils.ValidationError(
                'Invalid entity_id received: %s' % entity_id)
        if entity_id == '':
            raise utils.ValidationError('Entity id cannot be empty')

    @property
    def assets_path(self):
        """Returns the path of the parent folder of assets.

        Returns:
            str. The path.
        """
        return self._assets_path


class GcsFileSystem(GeneralFileSystem):
    """Wrapper for a file system based on GCS.

    This implementation ignores versioning.
    """

    def isfile(self, filepath):
        """Checks if the file with the given filepath exists in the GCS.

        Args:
            filepath: str. The path to the relevant file within the entity's
                assets folder.

        Returns:
            bool. Whether the file exists in GCS.
        """
        bucket_name = app_identity_services.get_gcs_resource_bucket_name()

        # Upload to GCS bucket with filepath
        # "<bucket>/<entity>/<entity-id>/assets/<filepath>".
        gcs_file_url = (
            '/%s/%s/%s' % (
                bucket_name, self._assets_path, filepath))
        try:
            return bool(cloudstorage.stat(gcs_file_url, retry_params=None))
        except cloudstorage.NotFoundError:
            return False

    def get(self, filepath):
        """Gets a file as an unencoded stream of raw bytes.

        Args:
            filepath: str. The path to the relevant file within the entity's
                assets folder.

        Returns:
            FileStream or None. It returns FileStream
                domain object if the file exists. Otherwise, it returns None.
        """
        if self.isfile(filepath):
            bucket_name = app_identity_services.get_gcs_resource_bucket_name()
            gcs_file_url = (
                '/%s/%s/%s' % (
                    bucket_name, self._assets_path, filepath))
            gcs_file = cloudstorage.open(gcs_file_url)
            data = gcs_file.read()
            gcs_file.close()
            return FileStream(data)
        else:
            return None

    def commit(self, filepath, raw_bytes, mimetype):
        """Args:
            filepath: str. The path to the relevant file within the entity's
                assets folder.
            raw_bytes: str. The content to be stored in the file.
            mimetype: str. The content-type of the cloud file.
        """
        bucket_name = app_identity_services.get_gcs_resource_bucket_name()

        # Upload to GCS bucket with filepath
        # "<bucket>/<entity>/<entity-id>/assets/<filepath>".
        gcs_file_url = (
            '/%s/%s/%s' % (
                bucket_name, self._assets_path, filepath))
        gcs_file = cloudstorage.open(
            gcs_file_url, mode='w', content_type=mimetype)
        gcs_file.write(raw_bytes)
        gcs_file.close()

    def delete(self, filepath):
        """Deletes a file and the metadata associated with it.

        Args:
            filepath: str. The path to the relevant file within the entity's
                assets folder.
        """
        bucket_name = app_identity_services.get_gcs_resource_bucket_name()
        gcs_file_url = (
            '/%s/%s/%s' % (
                bucket_name, self._assets_path, filepath))
        try:
            cloudstorage.delete(gcs_file_url)
        except cloudstorage.NotFoundError:
            raise IOError('Image does not exist: %s' % filepath)


    def listdir(self, dir_name):
        """Lists all files in a directory.

        Args:
            dir_name: str. The directory whose files should be listed. This
                should not start with '/' or end with '/'.

        Returns:
            list(str). A lexicographically-sorted list of filenames.
        """
        if dir_name.endswith('/') or dir_name.startswith('/'):
            raise IOError(
                'The dir_name should not start with / or end with / : %s' % (
                    dir_name))

        # The trailing slash is necessary to prevent non-identical directory
        # names with the same prefix from matching, e.g. /abcd/123.png should
        # not match a query for files under /abc/.
        prefix = '%s' % utils.vfs_construct_path(
            '/', self._assets_path, dir_name)
        if not prefix.endswith('/'):
            prefix += '/'
        # The prefix now ends and starts with '/'.
        bucket_name = app_identity_services.get_gcs_resource_bucket_name()
        # The path entered should be of the form, /bucket_name/prefix.
        path = '/%s%s' % (bucket_name, prefix)

        path_prefix = '/%s/' % utils.vfs_construct_path(
            bucket_name, self._assets_path)
        stats = cloudstorage.listbucket(path)
        files_in_dir = []
        for stat in stats:
            # Remove the asset path from the prefix of filename.
            files_in_dir.append(stat.filename.replace(path_prefix, ''))
        return files_in_dir


class AbstractFileSystem(python_utils.OBJECT):
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
            filepath: str. The path to the relevant file within the entity's
                assets folder.

        Raises:
            IOError: Invalid filepath.
        """
        base_dir = utils.vfs_construct_path(
            '/', self.impl.assets_path, 'assets')
        absolute_path = utils.vfs_construct_path(base_dir, filepath)
        normalized_path = utils.vfs_normpath(absolute_path)

        # This check prevents directory traversal.
        if not normalized_path.startswith(base_dir):
            raise IOError('Invalid filepath: %s' % filepath)

    def isfile(self, filepath):
        """Checks if a file exists. Similar to os.path.isfile(...).

        Args:
            filepath: str. The path to the relevant file within the entity's
                assets folder.

        Returns:
            bool. Whether the file exists.
        """
        self._check_filepath(filepath)
        return self._impl.isfile(filepath)

    def open(self, filepath):
        """Returns a stream with the file content. Similar to open(...).

        Args:
            filepath: str. The path to the relevant file within the entity's
                assets folder.

        Returns:
            FileStream. The file stream domain object.
        """
        self._check_filepath(filepath)
        return self._impl.get(filepath)

    def get(self, filepath):
        """Returns a bytestring with the file content, but no metadata.

        Args:
            filepath: str. The path to the relevant file within the entity's
                assets folder.

        Returns:
            FileStream. The file stream domain object.

        Raises:
            IOError: The given file stream does not exist.
        """
        file_stream = self.open(filepath)
        if file_stream is None:
            raise IOError('File %s not found.' % (filepath))
        return file_stream.read()

    def commit(self, filepath, raw_bytes, mimetype=None):
        """Replaces the contents of the file with the given by test string.

        Args:
            filepath: str. The path to the relevant file within the entity's
                assets folder.
            raw_bytes: str. The content to be stored in the file.
            mimetype: str. The content-type of the file.
        """
        raw_bytes = python_utils.convert_to_bytes(raw_bytes)
        self._check_filepath(filepath)
        self._impl.commit(filepath, raw_bytes, mimetype)

    def delete(self, filepath):
        """Deletes a file and the metadata associated with it.

        Args:
            filepath: str. The path to the relevant file within the entity's
                assets folder.
        """
        self._check_filepath(filepath)
        self._impl.delete(filepath)

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
