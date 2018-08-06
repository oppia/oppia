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

from core.platform import models
import feconf

from PIL import Image
from google.appengine.api import images

app_identity_services = models.Registry.import_app_identity_services()


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

    Args:
        image_content: str. Content of the file to be compressed.
        scaling_factor: float. The number by which the image will be scaled.

    Returns:
        str. Returns the content of the compressed image.
    """
    if not feconf.DEV_MODE:
        height, width = get_image_dimensions(image_content)
        return images.resize(
            image_data=image_content, width=int(width * scaling_factor),
            height=int(height * scaling_factor))
    else:
        return image_content
