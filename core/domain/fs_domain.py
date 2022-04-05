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

from __future__ import annotations

from core import feconf
from core import utils

from typing import Dict, List, Optional, Union

from core.platform import models   # pylint: disable=invalid-import-from # isort:skip


# TODO(#14537): Refactor this file and remove imports marked
# with 'invalid-import-from'.

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import app_identity_services
    from mypy_imports import storage_services

storage_services = models.Registry.import_storage_services()
app_identity_services = models.Registry.import_app_identity_services()

CHANGE_LIST_SAVE: List[Dict[str, str]] = [{'cmd': 'save'}]

ALLOWED_ENTITY_NAMES: List[str] = [
    feconf.ENTITY_TYPE_EXPLORATION, feconf.ENTITY_TYPE_BLOG_POST,
    feconf.ENTITY_TYPE_TOPIC, feconf.ENTITY_TYPE_SKILL,
    feconf.ENTITY_TYPE_STORY, feconf.ENTITY_TYPE_QUESTION,
    feconf.ENTITY_TYPE_VOICEOVER_APPLICATION]
ALLOWED_SUGGESTION_IMAGE_CONTEXTS: List[str] = [
    feconf.IMAGE_CONTEXT_QUESTION_SUGGESTIONS,
    feconf.IMAGE_CONTEXT_EXPLORATION_SUGGESTIONS]


class FileStream:
    """A class that wraps a file stream, but adds extra attributes to it.

    Attributes:
        content: bytes. The content of the file snapshot.
    """

    def __init__(self, content: bytes) -> None:
        """Constructs a FileStream object.

        Args:
            content: bytes. The content of the file snapshots.
        """
        self._content = content

    def read(self) -> bytes:
        """Emulates stream.read(). Returns all bytes and emulates EOF.

        Returns:
            content: bytes. The content of the file snapshot.
        """
        content = self._content
        self._content = b''
        return content


class GeneralFileSystem:
    """The parent class which is inherited by GcsFileSystem.

    Attributes:
        entity_name: str. The name of the entity (eg: exploration, topic etc).
        entity_id: str. The ID of the corresponding entity.
    """

    def __init__(self, entity_name: str, entity_id: str) -> None:
        """Constructs a GeneralFileSystem object.

        Args:
            entity_name: str. The name of the entity
                (eg: exploration, topic etc).
            entity_id: str. The ID of the corresponding entity.
        """
        self._validate_entity_parameters(entity_name, entity_id)
        self._assets_path = '%s/%s/assets' % (entity_name, entity_id)

    def _validate_entity_parameters(
        self, entity_name: str, entity_id: str
    ) -> None:
        """Checks whether the entity_id and entity_name passed in are valid.

        Args:
            entity_name: str. The name of the entity
                (eg: exploration, topic etc).
            entity_id: str. The ID of the corresponding entity.

        Raises:
            ValidationError. When parameters passed in are invalid.
        """
        if entity_name not in ALLOWED_ENTITY_NAMES and (
                entity_name not in ALLOWED_SUGGESTION_IMAGE_CONTEXTS):
            raise utils.ValidationError(
                'Invalid entity_name received: %s.' % entity_name)
        if not isinstance(entity_id, str):
            raise utils.ValidationError(
                'Invalid entity_id received: %s' % entity_id)
        if entity_id == '':
            raise utils.ValidationError('Entity id cannot be empty')

    @property
    def assets_path(self) -> str:
        """Returns the path of the parent folder of assets.

        Returns:
            str. The path.
        """
        return self._assets_path


class GcsFileSystem(GeneralFileSystem):
    """Wrapper for a file system based on GCS.

    This implementation ignores versioning.
    """

    def __init__(self, entity_name: str, entity_id: str) -> None:
        self._bucket_name = app_identity_services.get_gcs_resource_bucket_name()
        super(GcsFileSystem, self).__init__(entity_name, entity_id)

    def _get_gcs_file_url(self, filepath: str) -> str:
        """Returns the constructed GCS file URL.

        Args:
            filepath: str. The path to the relevant file within the entity's
                assets folder.

        Returns:
            str. The GCS file URL.
        """
        # Upload to GCS bucket with filepath
        # "<entity>/<entity-id>/assets/<filepath>".
        gcs_file_url = '%s/%s' % (self._assets_path, filepath)
        return gcs_file_url

    def isfile(self, filepath: str) -> bool:
        """Checks if the file with the given filepath exists in the GCS.

        Args:
            filepath: str. The path to the relevant file within the entity's
                assets folder.

        Returns:
            bool. Whether the file exists in GCS.
        """
        return storage_services.isfile(
            self._bucket_name, self._get_gcs_file_url(filepath))

    def get(self, filepath: str) -> Optional[FileStream]:
        """Gets a file as an unencoded stream of raw bytes.

        Args:
            filepath: str. The path to the relevant file within the entity's
                assets folder.

        Returns:
            FileStream or None. It returns FileStream domain object if the file
            exists. Otherwise, it returns None.
        """
        if self.isfile(filepath):
            return FileStream(storage_services.get(
                self._bucket_name, self._get_gcs_file_url(filepath)))
        else:
            return None

    def commit(
        self,
        filepath: str,
        raw_bytes: Union[bytes, str],
        mimetype: Optional[str]
    ) -> None:
        """Commit raw_bytes to the relevant file in the entity's assets folder.

        Args:
            filepath: str. The path to the relevant file within the entity's
                assets folder.
            raw_bytes: bytes|str. The content to be stored in the file.
            mimetype: str|None. The content-type of the cloud file.
        """
        storage_services.commit(
            self._bucket_name,
            self._get_gcs_file_url(filepath),
            raw_bytes,
            mimetype
        )

    def delete(self, filepath: str) -> None:
        """Deletes a file and the metadata associated with it.

        Args:
            filepath: str. The path to the relevant file within the entity's
                assets folder.

        Raises:
            OSError. Given file does not exist.
        """
        if self.isfile(filepath):
            storage_services.delete(
                self._bucket_name, self._get_gcs_file_url(filepath))
        else:
            raise IOError('File does not exist: %s' % filepath)

    def copy(self, source_assets_path: str, filepath: str) -> None:
        """Copy images from source_path.

        Args:
            source_assets_path: str. The path to the source entity's assets
                folder.
            filepath: str. The path to the relevant file within the entity's
                assets folder.
        """
        source_file_url = (
            '%s/%s' % (source_assets_path, filepath)
        )
        storage_services.copy(
            self._bucket_name, source_file_url, self._get_gcs_file_url(filepath)
        )

    def listdir(self, dir_name: str) -> List[str]:
        """Lists all files in a directory.

        Args:
            dir_name: str. The directory whose files should be listed. This
                should not start with '/' or end with '/'.

        Returns:
            list(str). A lexicographically-sorted list of filenames.

        Raises:
            OSError. The directory name starts or ends with '/'.
        """
        if dir_name.startswith('/') or dir_name.endswith('/'):
            raise IOError(
                'The dir_name should not start with / or end with / : %s' %
                dir_name
            )

        # The trailing slash is necessary to prevent non-identical directory
        # names with the same prefix from matching, e.g. /abcd/123.png should
        # not match a query for files under /abc/.
        if dir_name and not dir_name.endswith('/'):
            dir_name += '/'

        assets_path = '%s/' % self._assets_path
        prefix = utils.vfs_construct_path(self._assets_path, dir_name)
        blobs_in_dir = storage_services.listdir(self._bucket_name, prefix)
        return [
            blob.name.replace(assets_path, '') for blob in blobs_in_dir]


class AbstractFileSystem():
    """Interface for a file system."""

    def __init__(self, impl: GcsFileSystem) -> None:
        """Constructs a AbstractFileSystem object."""
        self._impl = impl

    @property
    def impl(self) -> AbstractFileSystem:
        """Returns a AbstractFileSystem object.

        Returns:
            AbstractFileSystem. The AbstractFileSystem object.
        """
        # Here, self._impl is an object of GcsFileSystem. But impl method
        # returns this object as an object of AbstractFileSystem class.
        # Thus to void MyPy error, ignore is added here.
        return self._impl  # type: ignore[return-value]

    def _check_filepath(self, filepath: str) -> None:
        """Raises an error if a filepath is invalid.

        Args:
            filepath: str. The path to the relevant file within the entity's
                assets folder.

        Raises:
            OSError. Invalid filepath.
        """
        base_dir = utils.vfs_construct_path(
            '/', self.impl.assets_path, 'assets')
        absolute_path = utils.vfs_construct_path(base_dir, filepath)
        normalized_path = utils.vfs_normpath(absolute_path)

        # This check prevents directory traversal.
        if not normalized_path.startswith(base_dir):
            raise IOError('Invalid filepath: %s' % filepath)

    def isfile(self, filepath: str) -> bool:
        """Checks if a file exists. Similar to os.path.isfile(...).

        Args:
            filepath: str. The path to the relevant file within the entity's
                assets folder.

        Returns:
            bool. Whether the file exists.
        """
        self._check_filepath(filepath)
        return self._impl.isfile(filepath)

    def open(self, filepath: str) -> FileStream:
        """Returns a stream with the file content. Similar to open(...).

        Args:
            filepath: str. The path to the relevant file within the entity's
                assets folder.

        Returns:
            FileStream. The file stream domain object.
        """
        self._check_filepath(filepath)
        # Here, _impl is an object of GcsFileSystem class. So, get() method
        # of this object returns Optional[Filestream] but here function's
        # expected return value is Filestream. So, to avoid MyPy error,
        # ignore is added here.
        return self._impl.get(filepath)  # type: ignore[return-value]

    def get(self, filepath: str) -> bytes:
        """Returns a bytestring with the file content, but no metadata.

        Args:
            filepath: str. The path to the relevant file within the entity's
                assets folder.

        Returns:
            bytes. The bytestring with the file content, but no metadata.

        Raises:
            OSError. The given file stream does not exist.
        """
        file_stream = self.open(filepath)
        if file_stream is None:
            raise IOError('File %s not found.' % (filepath))
        return file_stream.read()

    def commit(
        self,
        filepath: str,
        raw_bytes: Union[bytes, str],
        mimetype: Optional[str] = None
    ) -> None:
        """Replaces the contents of the file with the given by test string.

        Args:
            filepath: str. The path to the relevant file within the entity's
                assets folder.
            raw_bytes: bytes|str. The content to be stored in the file.
            mimetype: str|None. The content-type of the file. If mimetype is
                set to 'application/octet-stream' then raw_bytes is expected to
                contain binary data. In all other cases, raw_bytes is expected
                to be textual data.
        """
        # Note that textual data needs to be converted to bytes so that it can
        # be stored in a file opened in binary mode. However, it is not
        # required for binary data (i.e. when mimetype is set to
        # 'application/octet-stream').

        if isinstance(raw_bytes, str):
            raw_bytes = raw_bytes.encode('utf-8')
        file_content = (
            raw_bytes if mimetype != 'application/octet-stream' else raw_bytes)
        self._check_filepath(filepath)
        self._impl.commit(filepath, file_content, mimetype)

    def delete(self, filepath: str) -> None:
        """Deletes a file and the metadata associated with it.

        Args:
            filepath: str. The path to the relevant file within the entity's
                assets folder.
        """
        self._check_filepath(filepath)
        self._impl.delete(filepath)

    def listdir(self, dir_name: str) -> List[str]:
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

    def copy(self, source_assets_path: str, filepath: str) -> None:
        """Copy images from source.

        Args:
            source_assets_path: str. The path to the source entity's assets
                folder.
            filepath: str. The path to the relevant file within the entity's
                assets folder.
        """
        self._impl.copy(source_assets_path, filepath)

    @property
    def assets_path(self) -> str:
        """Returns the path of the parent folder of assets.

        Returns:
            str. The path.
        """
        return self._impl.assets_path
