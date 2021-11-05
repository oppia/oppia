# Copyright 2020 The Oppia Authors. All Rights Reserved.
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

"""Image validation service."""

from __future__ import annotations

import imghdr

from core import feconf
from core import utils
from core.domain import html_validation_service


def validate_raw_image(raw_image: str):
    """Validate the raw image.

    Args:
        raw_image: str. The image content.

    Raises:
        ValidationError. Raw image failed size or name validation.
    """
    hundred_kb_in_bytes = 100 * 1024

    if not raw_image:
        raise utils.ValidationError('No image supplied')
    if len(raw_image) > hundred_kb_in_bytes:
        raise utils.ValidationError(
            'Image exceeds file size limit of 100 KB.')


def detect_and_validate_format_of_raw_image(raw_image: str):
    """Determines the image type and validate.

    Args:
        raw_image: str. The image content.

    Returns:
        str. File type of the given raw image.

    Raises:
        ValidationError. File format of the given raw image
            cannot be determined.
    """
    if html_validation_service.is_parsable_as_xml(raw_image):
        file_format = 'svg'
        invalid_tags, invalid_attrs = (
            html_validation_service.get_invalid_svg_tags_and_attrs(raw_image))
        if invalid_tags or invalid_attrs:
            invalid_tags_message = (
                'tags: %s' % invalid_tags if invalid_tags else '')
            invalid_attrs_message = (
                'attributes: %s' % invalid_attrs if invalid_attrs else '')
            raise utils.ValidationError(
                'Unsupported tags/attributes found in the SVG:\n%s\n%s' % (
                    invalid_tags_message, invalid_attrs_message))
        if not html_validation_service.does_svg_tag_contains_xmlns_attribute(
                raw_image):
            raise utils.ValidationError(
                'The svg tag does not contains the \'xmlns\' attribute.')
    else:
        # Verify that the data is recognized as an image.
        file_format = imghdr.what(None, h=raw_image)
        if file_format not in feconf.ACCEPTED_IMAGE_FORMATS_AND_EXTENSIONS:
            raise utils.ValidationError('Image not recognized')

    return file_format


def verify_image_type_and_extension(file_format: str, filename: str):
    """Verify whether the image type matches its file extension.

    Args:
        file_format: str. The image format.
        filename: str. The filename for the image.

    Raises:
        ValidationError. File format or name supplied fails one of the
            validation checks.
    """

    dot_index = filename.rfind('.')
    extension = filename[dot_index + 1:].lower()
    if (extension not in
            feconf.ACCEPTED_IMAGE_FORMATS_AND_EXTENSIONS[file_format]):
        raise utils.ValidationError(
            'Expected a filename ending in .%s, received %s' %
            (file_format, filename))


def validate_image_and_filename(raw_image, filename):
    """Validates the image data and its filename.

    Args:
        raw_image: str. The image content.
        filename: str. The filename for the image.

    Returns:
        str. The file format of the image.

    Raises:
        ValidationError. Image or filename supplied fails one of the
            validation checks.
    """

    # Validate file name and raw image.
    validate_raw_image(raw_image)
    utils.require_valid_filename(filename)

    # Verify that the file type matches the supplied extension.
    file_format = detect_and_validate_format_of_raw_image(raw_image)
    verify_image_type_and_extension(file_format, filename)

    return file_format
