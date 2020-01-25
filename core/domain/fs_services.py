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

import imghdr
import json

from core.domain import fs_domain
from core.platform import models
import feconf
import utils

gae_image_services = models.Registry.import_gae_image_services()


def save_original_and_compressed_versions_of_image(
        filename, entity_type, entity_id, original_image_content,
        filename_prefix):
    """Saves the three versions of the image file.

    Args:
        filename: str. The name of the image file.
        entity_type: str. The type of the entity.
        entity_id: str. The id of the entity.
        original_image_content: str. The content of the original image.
        filename_prefix: str. The string to prefix to the filename.
    """
    if not original_image_content:
        raise utils.InvalidInputException('No image supplied')

    allowed_formats = ', '.join(
        list(feconf.ACCEPTED_IMAGE_FORMATS_AND_EXTENSIONS.keys()))

    # Verify that the data is recognized as an image.
    file_format = imghdr.what(None, h=original_image_content)
    if file_format not in feconf.ACCEPTED_IMAGE_FORMATS_AND_EXTENSIONS:
        raise utils.InvalidInputException('Image not recognized')

    # Verify that the file type matches the supplied extension.
    if not filename:
        raise utils.InvalidInputException('No filename supplied')
    if filename.rfind('.') == 0:
        raise utils.InvalidInputException('Invalid filename')
    if '/' in filename or '..' in filename:
        raise utils.InvalidInputException(
            'Filenames should not include slashes (/) or consecutive '
            'dot characters.')
    if '.' not in filename:
        raise utils.InvalidInputException(
            'Image filename with no extension: it should have '
            'one of the following extensions: %s.' % allowed_formats)

    dot_index = filename.rfind('.')
    extension = filename[dot_index + 1:].lower()
    if (extension not in
            feconf.ACCEPTED_IMAGE_FORMATS_AND_EXTENSIONS[file_format]):
        raise utils.InvalidInputException(
            'Expected a filename ending in .%s, received %s' %
            (file_format, filename))

    file_system_class = get_entity_file_system_class()
    fs = fs_domain.AbstractFileSystem(file_system_class(
        entity_type, entity_id))
    filepath = '%s/%s' % (filename_prefix, filename)

    if fs.isfile(filepath):
        raise utils.InvalidInputException(
            'A file with the name %s already exists. Please choose a '
            'different name.' % filename)

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
            filepath.encode('utf-8'), original_image_content,
            mimetype='image/%s' % filetype)

    if not fs.isfile(compressed_image_filepath.encode('utf-8')):
        fs.commit(
            compressed_image_filepath.encode('utf-8'),
            compressed_image_content, mimetype='image/%s' % filetype)

    if not fs.isfile(micro_image_filepath.encode('utf-8')):
        fs.commit(
            micro_image_filepath.encode('utf-8'),
            micro_image_content, mimetype='image/%s' % filetype)


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
