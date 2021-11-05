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
from core.domain import fs_domain
from core.domain import image_services


def save_original_and_compressed_versions_of_image(
        filename, entity_type, entity_id, original_image_content,
        filename_prefix, image_is_compressible):
    """Saves the three versions of the image file.

    Args:
        filename: str. The name of the image file.
        entity_type: str. The type of the entity.
        entity_id: str. The id of the entity.
        original_image_content: str. The content of the original image.
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

    file_system_class = get_entity_file_system_class()
    fs = fs_domain.AbstractFileSystem(file_system_class(
        entity_type, entity_id))

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


def save_classifier_data(exp_id, job_id, classifier_data_proto):
    """Store classifier model data in a file.

    Args:
        exp_id: str. The id of the exploration.
        job_id: str. The id of the classifier training job model.
        classifier_data_proto: Object. Protobuf object of the classifier data
            to be stored.
    """
    filepath = '%s-classifier-data.pb.xz' % (job_id)
    file_system_class = get_entity_file_system_class()
    fs = fs_domain.AbstractFileSystem(file_system_class(
        feconf.ENTITY_TYPE_EXPLORATION, exp_id))
    content = utils.compress_to_zlib(
        classifier_data_proto.SerializeToString())
    fs.commit(
        filepath, content, mimetype='application/octet-stream')


def delete_classifier_data(exp_id, job_id):
    """Delete the classifier data from file.

    Args:
        exp_id: str. The id of the exploration.
        job_id: str. The id of the classifier training job model.
    """
    filepath = '%s-classifier-data.pb.xz' % (job_id)
    file_system_class = get_entity_file_system_class()
    fs = fs_domain.AbstractFileSystem(file_system_class(
        feconf.ENTITY_TYPE_EXPLORATION, exp_id))
    if fs.isfile(filepath):
        fs.delete(filepath)


def get_entity_file_system_class():
    """Returns GcsFileSystem class to the client.

    Returns:
        class. GcsFileSystem class.
    """
    return fs_domain.GcsFileSystem


def copy_images(
        source_entity_type, source_entity_id, destination_entity_type,
        destination_entity_id, filenames):
    """Copy images from source to destination.

    Args:
        source_entity_type: str. The entity type of the source.
        source_entity_id: str. The type of the source entity.
        destination_entity_id: str. The id of the destination entity.
        destination_entity_type: str. The entity type of the destination.
        filenames: list(str). The list of filenames to copy.
    """
    file_system_class = get_entity_file_system_class()
    source_fs = fs_domain.AbstractFileSystem(file_system_class(
        source_entity_type, source_entity_id))
    destination_fs = fs_domain.AbstractFileSystem(file_system_class(
        destination_entity_type, destination_entity_id))
    for filename in filenames:
        filename_wo_filetype = filename[:filename.rfind('.')]
        filetype = filename[filename.rfind('.') + 1:]
        compressed_image_filename = '%s_compressed.%s' % (
            filename_wo_filetype, filetype)
        micro_image_filename = '%s_micro.%s' % (
            filename_wo_filetype, filetype)
        destination_fs.copy(
            source_fs.impl.assets_path, ('image/%s' % filename))
        destination_fs.copy(
            source_fs.impl.assets_path,
            ('image/%s' % compressed_image_filename))
        destination_fs.copy(
            source_fs.impl.assets_path, ('image/%s' % micro_image_filename))
