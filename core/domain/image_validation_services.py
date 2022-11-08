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

import base64
import imghdr

from core import feconf
from core import utils
from core.domain import html_validation_service

from typing import Optional, Union

HUNDRED_KB_IN_BYTES = 100 * 1024
ONE_MB_IN_BYTES = 1 * 1024 * 1024


def validate_image_and_filename(
    raw_image: Union[str, bytes],
    filename: str,
    entity_type: Optional[str] = None,
) -> str:
    """Validates the image data and its filename.

    Args:
        raw_image: Union[str, bytes]. The image content.
        filename: str. The filename for the image.
        entity_type: str. The type of the entity.

    Returns:
        str. The file format of the image.

    Raises:
        ValidationError. Image or filename supplied fails one of the
            validation checks.
    """
    if entity_type == feconf.ENTITY_TYPE_BLOG_POST:
        max_file_size = ONE_MB_IN_BYTES
    else:
        max_file_size = HUNDRED_KB_IN_BYTES

    if not raw_image:
        raise utils.ValidationError('No image supplied')
    if isinstance(raw_image, str) and utils.is_base64_encoded(raw_image):
        raw_image = base64.decodebytes(raw_image.encode('utf-8'))

    if len(raw_image) > max_file_size:
        raise utils.ValidationError(
            'Image exceeds file size limit of %i KB.' % (max_file_size / 1024))
    allowed_formats = ', '.join(
        list(feconf.ACCEPTED_IMAGE_FORMATS_AND_EXTENSIONS.keys()))
    # Ruling out the possibility of str for mypy type checking.
    assert isinstance(raw_image, bytes)
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

    # Verify that the file type matches the supplied extension.
    if not filename:
        raise utils.ValidationError('No filename supplied')
    if filename.rfind('.') == 0:
        raise utils.ValidationError('Invalid filename')
    if '/' in filename or '..' in filename:
        raise utils.ValidationError(
            'Filenames should not include slashes (/) or consecutive '
            'dot characters.')
    if '.' not in filename:
        raise utils.ValidationError(
            'Image filename with no extension: it should have '
            'one of the following extensions: %s.' % allowed_formats)

    dot_index = filename.rfind('.')
    extension = filename[dot_index + 1:].lower()
    if (extension not in
            feconf.ACCEPTED_IMAGE_FORMATS_AND_EXTENSIONS[file_format]):
        raise utils.ValidationError(
            'Expected a filename ending in .%s, received %s' %
            (file_format, filename))

    return file_format
