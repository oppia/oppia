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
import os
import pathlib
import shutil
import subprocess
import sys
import tempfile

from PIL import Image
from typing import List, TypedDict, Union

IMAGE_EXTENSIONS_SUPPORTING_ZIP_COMPRESSION = {'.png'}
IMAGE_EXTENSIONS_SUPPORTING_LZW_COMPRESSION = {'.jpg', '.jpeg', '.webp'}
ALL_IMAGES_EXTENSIONS = Union[
    IMAGE_EXTENSIONS_SUPPORTING_ZIP_COMPRESSION,
    IMAGE_EXTENSIONS_SUPPORTING_LZW_COMPRESSION
]
TOLERANCE = 0.99
OUTPUT_DIR = 'compressed_images'

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
    images that admit at least a 1% reduction are considered compressible.

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
                    file_path,
                    '-strip',
                    '-compress', compression_type,
                    temp_compressed
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

def compress_images_for_workflow(
        result_images: List[CompressedImageInfo]
    ) -> None:
    """Compresses the images using GraphicsMagick."""

    if os.path.exists(OUTPUT_DIR):
        shutil.rmtree(OUTPUT_DIR)
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    for images in result_images:
        file_extension = images['path'].suffix.lower()
        file_path = images['path']

        rel_path = os.path.relpath(file_path)
        output_file_path = os.path.join(OUTPUT_DIR, rel_path)

        # Create the directory structure for the output file
        os.makedirs(os.path.dirname(output_file_path), exist_ok=True)

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
                    file_path,
                    '-strip',
                    '-compress', compression_type,
                    output_file_path
                ]

                result = subprocess.run(
                    cmd, capture_output=True, text=True, check=False
                )
                if result.returncode == 0 and temp_compressed.exists():
                    with open(temp_compressed, 'rb') as f:
                        compressed_data = f.read()
                    # adding compressed images to OUTPUT_DIR.
                    with open(OUTPUT_DIR, 'wb') as f:
                        f.write(compressed_data)

                else:
                    logging.info(
                        'Compressed image > original image'
                    )
                    continue


if __name__ == '__main__':  # pragma: no cover
    # I recommend to do not use this script in local development, as it may
    # compress images that are not meant to be compressed.
    # This is only made for CI workflow artifacts.
    repo_path = pathlib.Path('./assets')
    compressed_images = get_compressible_images(repo_path)

    if compressed_images:
        TOTAL_SPACE_SAVED = 0
        print(len(compressed_images), 'images could be compressed further:\n')
        for image in compressed_images:
            print(image['path'])
            saved = image['original_size'] - image['new_size']
            TOTAL_SPACE_SAVED += saved

        print(f'\nTotal space saved: {TOTAL_SPACE_SAVED} bytes\n')
        #  compressing images for CI workflow artifacts. 
        compress_images_for_workflow(compressed_images); 
        print(
            f'\nCompressed images have been saved to the compressed_images directory.'
            f'These images will be uploaded as GitHub workflow artifacts.'
            f'\nTo use these compressed images in your PR:'
            f'1. Go to the GitHub Actions tab in your repository.'
            f'2. Find the workflow run for your PR.'
            f'3. Download the script-output artifact.'
            f'4. Extract the downloaded zip file.'
            f'5. Copy the compressed images to their respective locations in your repository.'
        )
        sys.exit(1)
    else:
        print('No images could be compressed further.')
        sys.exit(0)
