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
import io

from PIL import Image
from constants import constants
from core.platform import models

from google.appengine.api import images

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
    img = Image.open(io.BytesIO(file_content))
    width, height = img.size
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
        height, width = get_image_dimensions(image_content)
        new_width = int(width * scaling_factor)
        new_height = int(height * scaling_factor)
        if (new_width > MAX_RESIZE_DIMENSION_PX
                or new_height > MAX_RESIZE_DIMENSION_PX):
            # Recompute the scaling factor such that the larger dimension does
            # not exceed 4000 when scaled.
            new_scaling_factor = MAX_RESIZE_DIMENSION_PX / max(width, height)
            new_width = int(width * new_scaling_factor)
            new_height = int(height * new_scaling_factor)
        return images.resize(
            image_data=image_content,
            width=min(new_width, MAX_RESIZE_DIMENSION_PX),
            height=min(new_height, MAX_RESIZE_DIMENSION_PX))
    else:
        return image_content
