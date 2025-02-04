# coding: utf-8
#
# Copyright 2024 The Oppia Authors. All Rights Reserved.
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

"""Lint check for detecting images that could be further compressed."""

from __future__ import annotations

import logging
import pathlib
import subprocess
import tempfile
from typing import List, TypedDict

from PIL import Image

class CompressibleImageInfo(TypedDict):
    """Type definition for compressible image information."""
    path: pathlib.Path
    current_size: int
    potential_size: int

def check_compressible_images(
        input_path: str | pathlib.Path
    ) -> List[CompressibleImageInfo]:
    """Check which images could be further compressed using GraphicsMagick.
    
    Args:
        input_path: Path to directory containing images to check.
        
    Returns:
        List of images that could be compressed further with their size details.
    """
    compressible_images: List[CompressibleImageInfo] = []
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
                    elif file_path.suffix.lower() in {'.jpg', '.jpeg', '.webp'}:
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
                        current_size = file_path.stat().st_size
                        potential_size = temp_compressed.stat().st_size

                        if potential_size < current_size * 0.99:
                            compressible_images.append({
                                'path': file_path,
                                'current_size': current_size,
                                'potential_size': potential_size
                            })
                    else:
                        logging.info(
                            'Compressed image > original image'
                        )
                        continue

        except Exception as e:
            logging.error(f'Could not process {file_path}: {e}')

    return compressible_images