# coding: utf-8
#
# Copyright 2025 The Oppia Authors. All Rights Reserved.
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

"""Script to compress images in the repository using GraphicsMagick."""

from __future__ import annotations

import logging
import pathlib
import subprocess
import sys
import tempfile

from PIL import Image
from typing import List, TypedDict, Union

ALL_IMAGES_EXTENSIONS = {'.png', '.jpg', '.jpeg', '.webp'}
IMAGE_EXTENSIONS_SUPPORTING_ZIP_COMPRESSION = {'.png'}
IMAGE_EXTENSIONS_SUPPORTING_LZW_COMPRESSION = {'.jpg', '.jpeg', '.webp'}
TOLERANCE = 0.99


class CompressedImageInfo(TypedDict):
    """Type definition for compressed image information."""

    path: pathlib.Path
    original_size: int
    new_size: int


def get_compressible_images(
        input_path: Union[str, pathlib.Path]
    ) -> List[CompressedImageInfo]:
    """Find images that can be compressed further.

    This function scans a directory for images, attempts to compress them using 
    GraphicsMagick, and identifies those that can be reduced in size. The 
    compression benchmark is set to 99% of the original file size, meaning only 
    images that achieve at least a 1% reduction are considered compressible.

    Args:
        path (Union[str, pathlib.Path]):
        Path to the directory containing images.

    Returns:
        List[CompressedImageInfo]: A list of images that can be compressed, 
        including their original and new sizes.

    Raises:
        Exception: If an error occurs while processing an image.
    """

    result_images: List[CompressedImageInfo] = []

    for file_path in pathlib.Path(input_path).glob('**/*.*'):
        file_extension = file_path.suffix.lower()
        if file_extension not in ALL_IMAGES_EXTENSIONS:
            continue

        with Image.open(file_path):
            with tempfile.TemporaryDirectory() as tmpdir:
                temp_compressed = (
                    pathlib.Path(tmpdir) / f'compressed_{file_path.name}'
                )

                compression_type = (
                    'Zip' if file_extension in
                    IMAGE_EXTENSIONS_SUPPORTING_ZIP_COMPRESSION
                    else 'LZW'
                )

                cmd = [
                    'gm', 'convert',
                    str(file_path),
                    '-strip',
                    '-compress', compression_type,
                    str(temp_compressed)
                ]

                result = subprocess.run(
                    cmd, capture_output=True, text=True, check=False
                )
                if result.returncode == 0 and temp_compressed.exists():
                    original_size = file_path.stat().st_size
                    new_size = temp_compressed.stat().st_size

                    if new_size < original_size * TOLERANCE:
                        result_images.append({
                            'path': file_path,
                            'original_size': original_size,
                            'new_size': new_size
                        })
                else:
                    logging.info(
                        'Compressed image > original image'
                    )
                    continue

    return result_images


if __name__ == '__main__':  # pragma: no cover
    repo_path = pathlib.Path('./assets')
    compressed_images = get_compressible_images(repo_path)

    if compressed_images:
        TOTAL_SPACE_SAVED = 0
        print(len(compressed_images), 'images could be compressed further:\n')
        for image in compressed_images:
            print(image['path'])
            saved = image['original_size'] - image['new_size']
            TOTAL_SPACE_SAVED += saved
        print('Use the following command to compress the images:\n')

        print(
            'For PNG images:\n'
            'gm convert <input_file> -strip -compress Zip <output_file>'
        )

        print(
            'For JPG and WebP images:\n'
            'gm convert <input_file> -strip -compress LZW <output_file>'
        )

        print(f'\nTotal space saved: {TOTAL_SPACE_SAVED} bytes\n')
        sys.exit(1)
    else:
        print('No images could be compressed further.')
        sys.exit(0)
