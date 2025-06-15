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

from __future__ import annotations

import io

from PIL import Image
from typing import Tuple


def _get_pil_image_dimensions(pil_image: Image.Image) -> Tuple[int, int]:
    """Gets the dimensions of the Pillow Image.

    Args:
        pil_image: Image. A file in the Pillow Image format.

    Returns:
        tuple(int, int). Returns height and width of the image.
    """
    width, height = pil_image.size
    return height, width


def get_image_dimensions(file_content: bytes) -> Tuple[int, int]:
    """Gets the dimensions of the image with the given file_content.

    Args:
        file_content: bytes. The content of the file.

    Returns:
        tuple(int). Returns height and width of the image.
    """
    image = Image.open(io.BytesIO(file_content))
    return _get_pil_image_dimensions(image)


def compress_image(image_content: bytes, scaling_factor: float) -> bytes:
    """Compresses the image by resizing the image with the scaling factor.

    Args:
        image_content: bytes. Content of the file to be compressed.
        scaling_factor: float. The number by which the dimensions of the image
            will be scaled. This is expected to be in the interval (0, 1].

    Returns:
        bytes. Returns the content of the compressed image.

    Raises:
        ValueError. Scaling factor is not in the interval (0, 1].
    """
    if scaling_factor > 1 or scaling_factor <= 0:
        raise ValueError(
            'Scaling factor should be in the interval (0, 1], received %f.'
            % scaling_factor)
    image = Image.open(io.BytesIO(image_content))

    image_format = image.format
    height, width = _get_pil_image_dimensions(image)
    new_width = int(width * scaling_factor)
    new_height = int(height * scaling_factor)
    new_image_dimensions = (new_width, new_height)

    # NOTE: image.thumbnail() function does not work when the scale factor
    # is greater than 1.
    image.thumbnail(new_image_dimensions, Image.Resampling.LANCZOS)
    with io.BytesIO() as output:
        image.save(output, format=image_format)
        new_image_content = output.getvalue()
    return new_image_content
