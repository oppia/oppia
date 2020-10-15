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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import json

from core.domain import fs_domain
from core.domain import image_services
from core.platform import models
import feconf

(suggestion_models,) = models.Registry.import_models([models.NAMES.suggestion])


def save_image(filename, entity_type, entity_id, content):
    """Save image file."""
    filetype = filename[filename.rfind('.') + 1:]
    mimetype = (
        'image/svg+xml' if filetype == 'svg' else 'image/%s' % filetype)
    file_system_class = get_entity_file_system_class()
    fs = fs_domain.AbstractFileSystem(file_system_class(entity_type, entity_id))
    if not fs.isfile(filename.encode('utf-8')):
        fs.commit(filename.encode('utf-8'), content, mimetype=mimetype)


def delete_image(filename, entity_type, entity_id):
    """Delete image file."""
    file_system_class = get_entity_file_system_class()
    fs = fs_domain.AbstractFileSystem(file_system_class(entity_type, entity_id))
    fs.delete(filename)



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

    if image_is_compressible:
        compressed_image_content = image_services.compress_image(
            original_image_content, 0.8)
        micro_image_content = image_services.compress_image(
            original_image_content, 0.7)
    else:
        compressed_image_content = original_image_content
        micro_image_content = original_image_content

    save_image(filepath, entity_type, entity_id,  original_image_content)
    save_image(
        compressed_image_filepath,
        entity_type,
        entity_id,
        compressed_image_content
    )
    save_image(
        micro_image_filepath, entity_type, entity_id, micro_image_content)


def save_classifier_data(exp_id, job_id, classifier_data):
    """Store classifier model data in a file.

    Args:
        exp_id: str. The id of the exploration.
        job_id: str. The id of the classifier training job model.
        classifier_data: dict. Classifier data to be stored.
    """
    filepath = '%s-classifier-data.json' % (job_id)
    file_system_class = get_entity_file_system_class()
    fs = fs_domain.AbstractFileSystem(file_system_class(
        feconf.ENTITY_TYPE_EXPLORATION, exp_id))
    fs.commit(
        filepath, json.dumps(classifier_data),
        mimetype='application/json')


def read_classifier_data(exp_id, job_id):
    """Read the classifier data from file.

    Args:
        exp_id: str. The id of the exploration.
        job_id: str. The id of the classifier training job model.

    Returns:
        dict|None. The classifier data read from the file. Returns None
        if no classifier data is stored for the given job.
    """
    filepath = '%s-classifier-data.json' % (job_id)
    file_system_class = get_entity_file_system_class()
    fs = fs_domain.AbstractFileSystem(file_system_class(
        feconf.ENTITY_TYPE_EXPLORATION, exp_id))
    if not fs.isfile(filepath):
        return None
    classifier_data = fs.get(filepath)
    return json.loads(classifier_data)


def delete_classifier_data(exp_id, job_id):
    """Delete the classifier data from file.

    Args:
        exp_id: str. The id of the exploration.
        job_id: str. The id of the classifier training job model.
    """
    filepath = '%s-classifier-data.json' % (job_id)
    file_system_class = get_entity_file_system_class()
    fs = fs_domain.AbstractFileSystem(file_system_class(
        feconf.ENTITY_TYPE_EXPLORATION, exp_id))
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
