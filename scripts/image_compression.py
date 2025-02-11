# coding: utf-8
#
# Copyright 2023 The Oppia Authors. All Rights Reserved.
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
import tempfile

from PIL import Image # pylint: disable=import-error
from typing import List, TypedDict, Union


class CompressedImageInfo(TypedDict):
    """Type definition for compressed image information."""

    path: pathlib.Path
    original_size: int
    new_size: int


def check_compressable_images(
        input_path: Union[str, pathlib.Path]
    ) -> List[CompressedImageInfo]:
    """Check and compress images using GraphicsMagick."""

    result_images: List[CompressedImageInfo] = []
    supported_extensions = {'.png', '.jpg', '.jpeg', '.webp'}

    for file_path in pathlib.Path(input_path).glob('**/*.*'):
        if file_path.suffix.lower() not in supported_extensions:
            continue

        try:
            with Image.open(file_path):
                with tempfile.TemporaryDirectory() as tmpdir:
                    temp_compressed = (
                        pathlib.Path(tmpdir) / f'compressed_{file_path.name}'
                    )

                    if file_path.suffix.lower() == '.png':
                        cmd = [
                            'gm', 'convert',
                            str(file_path),
                            '-strip',
                            '-compress', 'Zip',
                            str(temp_compressed)
                        ]
                    elif file_path.suffix.lower() in {'.jpg', '.webp'}:
                        cmd = [
                            'gm', 'convert',
                            str(file_path),
                            '-strip',
                            '-compress', 'LZW',
                            str(temp_compressed)
                        ]

                    result = subprocess.run(
                        cmd, capture_output=True, text=True, check=False
                        )
                    if result.returncode == 0 and temp_compressed.exists():
                        original_size = file_path.stat().st_size
                        new_size = temp_compressed.stat().st_size

                        if new_size < original_size * 0.99:
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
        except Exception as e:
            print(f'[ERROR] Could not process {file_path}: {e}')
    return result_images


def main() -> None: # pragma: no cover
    """Main function to compress images in the repository."""
    repo_path = pathlib.Path('./assets')
    compressed_images = check_compressable_images(str(repo_path))

    if compressed_images:
        space = 0
        print(len(compressed_images), 'images could be compressed further:\n')
        for image in compressed_images:
            print(image['path'])
            saved = image['original_size'] - image['new_size']
            space += saved
        print('Use the following command to compress the images:\n')

        print(
            'For PNG images:\n'
            'gm convert <input_file> -strip -compress Zip <output_file>'
        )

        print(
            'For JPG and WebP images:\n'
            'gm convert <input_file> -strip -compress LZW <output_file>'
        )

        print(f'\nTotal space saved: {space} bytes\n')
    else:
        print('No images could be compressed further.')


if __name__ == '__main__':  # pragma: no cover
    main()
