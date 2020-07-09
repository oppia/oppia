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

"""Provides app identity services."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import io

from PIL import Image
from constants import constants
from core.platform import models
import python_utils
from  google.appengine.api import images

app_identity_services = models.Registry.import_app_identity_services()


# The maximum width or length an image can be resized to, inclusive.
MAX_RESIZE_DIMENSION_PX = 4000.0


def get_image_dimensions(file_content):
    """Gets the dimensions of the image with the given file_content.

    Args:
        file_content: str. The content of the file.

    Returns:
        tuple(int). Returns height and width of the image.
    """
    image = Image.open(io.BytesIO(file_content))
    width, height = image.size
    return height, width


def compress_image(image_content, scaling_factor):
    """Compresses the image by resizing the image with the scaling factor.

    Note that if the image's dimensions, after the scaling factor is applied,
    exceed 4000 then the scaling factor will be recomputed and applied such that
    the larger dimension of the image does not exceed 4000 after resizing. This
    is due to an implementation limitation. See https://goo.gl/TJCbmE for
    context.

    Args:
        image_content: str. Content of the file to be compressed.
        scaling_factor: float. The number by which the dimensions of the image
            will be scaled. This is expected to be greater than zero.

    Returns:
        str. Returns the content of the compressed image.
    """
    if not constants.DEV_MODE:
        image = Image.open(io.BytesIO(image_content))

        image_format = image.format
        width, height = image.width, image.height
        new_width = int(width * scaling_factor)
        new_height = int(height * scaling_factor)
        if (new_width > MAX_RESIZE_DIMENSION_PX
                or new_height > MAX_RESIZE_DIMENSION_PX):
            # Recompute the scaling factor such that the larger dimension does
            # not exceed 4000 when scaled.
            new_scaling_factor = (
                python_utils.divide(
                    MAX_RESIZE_DIMENSION_PX, float(max(width, height))))
            new_width = int(width * new_scaling_factor)
            new_height = int(height * new_scaling_factor)
            new_image_dimensions = (
                min(new_width, MAX_RESIZE_DIMENSION_PX),
                min(new_height, MAX_RESIZE_DIMENSION_PX))

            # Thumbnail doesn't work for enlarging images.
            resized_image = image.resize(new_image_dimensions)

            with io.BytesIO() as output:
                resized_image.save(output, format=image_format)
                new_image_content = output.getvalue()
        elif scaling_factor > 1:
            new_image_dimensions = (
                min(new_width, MAX_RESIZE_DIMENSION_PX),
                min(new_height, MAX_RESIZE_DIMENSION_PX))

            # Thumbnail doesn't work for enlarging images.
            resized_image = image.resize(new_image_dimensions)

            with io.BytesIO() as output:
                resized_image.save(output, format=image_format)
                new_image_content = output.getvalue()
        else:
            new_image_dimensions = (
                min(new_width, MAX_RESIZE_DIMENSION_PX),
                min(new_height, MAX_RESIZE_DIMENSION_PX))
            image.thumbnail(new_image_dimensions, Image.ANTIALIAS)
            with io.BytesIO() as output:
                image.save(output, format=image_format)
                new_image_content = output.getvalue()

        return new_image_content
    else:
        return image_content
