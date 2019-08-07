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

from constants import constants
from core.domain import fs_domain
from core.platform import models

gae_image_services = models.Registry.import_gae_image_services()


def save_original_and_compressed_versions_of_image(
        user_id, filename, entity_type, entity_id, original_image_content):
    """Saves the three versions of the image file.

    Args:
        user_id: str. The id of the user who wants to upload the image.
        filename: str. The name of the image file.
        entity_type: str. The type of the entity.
        entity_id: str. The id of the entity.
        original_image_content: str. The content of the original image.
    """
    filepath = 'image/%s' % filename

    filename_wo_filetype = filename[:filename.rfind('.')]
    filetype = filename[filename.rfind('.') + 1:]

    compressed_image_filename = '%s_compressed.%s' % (
        filename_wo_filetype, filetype)
    compressed_image_filepath = 'image/%s' % compressed_image_filename

    micro_image_filename = '%s_micro.%s' % (
        filename_wo_filetype, filetype)
    micro_image_filepath = 'image/%s' % micro_image_filename

    file_system_class = get_entity_file_system_class()
    fs = fs_domain.AbstractFileSystem(file_system_class(
        entity_type, entity_id))

    compressed_image_content = gae_image_services.compress_image(
        original_image_content, 0.8)
    micro_image_content = gae_image_services.compress_image(
        original_image_content, 0.7)

    # Because in case of CreateVersionsOfImageJob, the original image is
    # already there. Also, even if the compressed, micro versions for some
    # image exists, then this would prevent from creating another copy of
    # the same.
    if not fs.isfile(filepath.encode('utf-8')):
        fs.commit(
            user_id, filepath.encode('utf-8'), original_image_content,
            mimetype='image/%s' % filetype)

    if not fs.isfile(compressed_image_filepath.encode('utf-8')):
        fs.commit(
            user_id, compressed_image_filepath.encode('utf-8'),
            compressed_image_content, mimetype='image/%s' % filetype)

    if not fs.isfile(micro_image_filepath.encode('utf-8')):
        fs.commit(
            user_id, micro_image_filepath.encode('utf-8'),
            micro_image_content, mimetype='image/%s' % filetype)


def get_entity_file_system_class():
    """Returns DatastoreBackedFileSystem class to the client if DEV_MODE is
    True. Otherwise, returns GcsFileSystem.

    Returns:
        class. The correct file system class (either DatastoreBackedFileSystem
            or GcsFileSystem).
    """
    if constants.DEV_MODE:
        return fs_domain.DatastoreBackedFileSystem
    else:
        return fs_domain.GcsFileSystem
