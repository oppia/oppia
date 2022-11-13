# coding: utf-8
#
# Copyright 2017 The Oppia Authors. All Rights Reserved.
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

"""Methods for returning the correct file system class to the client."""

from __future__ import annotations

from core import feconf
from core import utils
from core.domain import image_services
from core.platform import models

from typing import Dict, List, Optional

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import app_identity_services
    from mypy_imports import storage_services
    from proto_files import text_classifier_pb2

storage_services = models.Registry.import_storage_services()
app_identity_services = models.Registry.import_app_identity_services()

CHANGE_LIST_SAVE: List[Dict[str, str]] = [{'cmd': 'save'}]

ALLOWED_ENTITY_NAMES: List[str] = [
    feconf.ENTITY_TYPE_EXPLORATION,
    feconf.ENTITY_TYPE_BLOG_POST,
    feconf.ENTITY_TYPE_TOPIC,
    feconf.ENTITY_TYPE_SKILL,
    feconf.ENTITY_TYPE_STORY,
    feconf.ENTITY_TYPE_QUESTION
]
ALLOWED_SUGGESTION_IMAGE_CONTEXTS: List[str] = [
    feconf.IMAGE_CONTEXT_QUESTION_SUGGESTIONS,
    feconf.IMAGE_CONTEXT_EXPLORATION_SUGGESTIONS
]


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
        if (
                entity_name not in ALLOWED_ENTITY_NAMES and
                entity_name not in ALLOWED_SUGGESTION_IMAGE_CONTEXTS
        ):
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
        super().__init__(entity_name, entity_id)

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

    def _check_filepath(self, filepath: str) -> None:
        """Raises an error if a filepath is invalid.

        Args:
            filepath: str. The path to the relevant file within the entity's
                assets folder.

        Raises:
            OSError. Invalid filepath.
        """
        base_dir = utils.vfs_construct_path('/', self.assets_path, 'assets')
        absolute_path = utils.vfs_construct_path(base_dir, filepath)
        normalized_path = utils.vfs_normpath(absolute_path)

        # This check prevents directory traversal.
        if not normalized_path.startswith(base_dir):
            raise IOError('Invalid filepath: %s' % filepath)

    def isfile(self, filepath: str) -> bool:
        """Checks if the file with the given filepath exists in the GCS.

        Args:
            filepath: str. The path to the relevant file within the entity's
                assets folder.

        Returns:
            bool. Whether the file exists in GCS.
        """
        self._check_filepath(filepath)
        return storage_services.isfile(
            self._bucket_name, self._get_gcs_file_url(filepath))

    def get(self, filepath: str) -> bytes:
        """Gets a file as an unencoded stream of raw bytes.

        Args:
            filepath: str. The path to the relevant file within the entity's
                assets folder.

        Returns:
            bytes. A stream of raw bytes if the file exists.

        Raises:
            OSError. Given file does not exist.
        """
        if self.isfile(filepath):
            return storage_services.get(
                self._bucket_name, self._get_gcs_file_url(filepath))
        else:
            raise IOError('File %s not found.' % (filepath))

    def commit(
        self,
        filepath: str,
        raw_bytes: bytes,
        mimetype: Optional[str] = None
    ) -> None:
        """Commit raw_bytes to the relevant file in the entity's assets folder.

        Args:
            filepath: str. The path to the relevant file within the entity's
                assets folder.
            raw_bytes: bytes. The content to be stored in the file.
            mimetype: Optional[str]. The content-type of the cloud file.
        """
        # Note that textual data needs to be converted to bytes so that it can
        # be stored in a file opened in binary mode. However, it is not
        # required for binary data (i.e. when mimetype is set to
        # 'application/octet-stream').

        self._check_filepath(filepath)
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
        source_file_url = ('%s/%s' % (source_assets_path, filepath))
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
        self._check_filepath(dir_name)
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
        return [blob.name.replace(assets_path, '') for blob in blobs_in_dir]


def save_original_and_compressed_versions_of_image(
    filename: str,
    entity_type: str,
    entity_id: str,
    original_image_content: bytes,
    filename_prefix: str,
    image_is_compressible: bool
) -> None:
    """Saves the three versions of the image file.

    Args:
        filename: str. The name of the image file.
        entity_type: str. The type of the entity.
        entity_id: str. The id of the entity.
        original_image_content: bytes. The content of the original image.
        filename_prefix: str. The string to prefix to the filename.
        image_is_compressible: bool. Whether the image can be compressed or
            not.
    """
    filepath = '%s/%s' % (filename_prefix, filename)

    filename_wo_filetype = filename[:filename.rfind('.')]
    filetype = filename[filename.rfind('.') + 1:]

    compressed_image_filename = '%s_compressed.%s' % (
        filename_wo_filetype, filetype)
    compressed_image_filepath = '%s/%s' % (
        filename_prefix, compressed_image_filename)

    micro_image_filename = '%s_micro.%s' % (
        filename_wo_filetype, filetype)
    micro_image_filepath = '%s/%s' % (filename_prefix, micro_image_filename)

    fs = GcsFileSystem(entity_type, entity_id)

    if image_is_compressible:
        compressed_image_content = image_services.compress_image(
            original_image_content, 0.8)
        micro_image_content = image_services.compress_image(
            original_image_content, 0.7)
    else:
        compressed_image_content = original_image_content
        micro_image_content = original_image_content

    mimetype = (
        'image/svg+xml' if filetype == 'svg' else 'image/%s' % filetype)
    # Because in case of CreateVersionsOfImageJob, the original image is
    # already there. Also, even if the compressed, micro versions for some
    # image exists, then this would prevent from creating another copy of
    # the same.
    if not fs.isfile(filepath):
        fs.commit(
            filepath, original_image_content, mimetype=mimetype)

    if not fs.isfile(compressed_image_filepath):
        fs.commit(
            compressed_image_filepath,
            compressed_image_content,
            mimetype=mimetype
        )

    if not fs.isfile(micro_image_filepath):
        fs.commit(
            micro_image_filepath, micro_image_content, mimetype=mimetype)


def save_classifier_data(
    exp_id: str,
    job_id: str,
    classifier_data_proto: text_classifier_pb2.TextClassifierFrozenModel
) -> None:
    """Store classifier model data in a file.

    Args:
        exp_id: str. The id of the exploration.
        job_id: str. The id of the classifier training job model.
        classifier_data_proto: Object. Protobuf object of the classifier data
            to be stored.
    """
    filepath = '%s-classifier-data.pb.xz' % (job_id)
    fs = GcsFileSystem(feconf.ENTITY_TYPE_EXPLORATION, exp_id)
    content = utils.compress_to_zlib(
        classifier_data_proto.SerializeToString())
    fs.commit(
        filepath, content, mimetype='application/octet-stream')


def delete_classifier_data(exp_id: str, job_id: str) -> None:
    """Delete the classifier data from file.

    Args:
        exp_id: str. The id of the exploration.
        job_id: str. The id of the classifier training job model.
    """
    filepath = '%s-classifier-data.pb.xz' % (job_id)
    fs = GcsFileSystem(feconf.ENTITY_TYPE_EXPLORATION, exp_id)
    if fs.isfile(filepath):
        fs.delete(filepath)


def copy_images(
    source_entity_type: str,
    source_entity_id: str,
    destination_entity_type: str,
    destination_entity_id: str,
    filenames: List[str]
) -> None:
    """Copy images from source to destination.

    Args:
        source_entity_type: str. The entity type of the source.
        source_entity_id: str. The type of the source entity.
        destination_entity_id: str. The id of the destination entity.
        destination_entity_type: str. The entity type of the destination.
        filenames: list(str). The list of filenames to copy.
    """
    source_fs = GcsFileSystem(source_entity_type, source_entity_id)
    destination_fs = GcsFileSystem(
        destination_entity_type, destination_entity_id)
    for filename in filenames:
        filename_wo_filetype = filename[:filename.rfind('.')]
        filetype = filename[filename.rfind('.') + 1:]
        compressed_image_filename = '%s_compressed.%s' % (
            filename_wo_filetype, filetype)
        micro_image_filename = '%s_micro.%s' % (
            filename_wo_filetype, filetype)
        destination_fs.copy(
            source_fs.assets_path, ('image/%s' % filename))
        destination_fs.copy(
            source_fs.assets_path,
            ('image/%s' % compressed_image_filename))
        destination_fs.copy(
            source_fs.assets_path, ('image/%s' % micro_image_filename))
