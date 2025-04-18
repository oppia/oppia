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


class CompressedImageInfo(TypedDict):
    """Type definition for compressed image information."""

    path: pathlib.Path
    original_size: int
    new_size: int


class ImageCompressor:
    """A class to handle image compression using GraphicsMagick."""

    IMAGE_EXTENSIONS_SUPPORTING_ZIP_COMPRESSION = {'.png'}
    IMAGE_EXTENSIONS_SUPPORTING_LZW_COMPRESSION = {'.jpg', '.jpeg', '.webp'}
    ALL_IMAGES_EXTENSIONS = (
        IMAGE_EXTENSIONS_SUPPORTING_ZIP_COMPRESSION |
        IMAGE_EXTENSIONS_SUPPORTING_LZW_COMPRESSION
    )
    TOLERANCE = 0.99
    OUTPUT_DIR = 'compressed_images'

    def __init__(
        self,
        input_path: Union[str, pathlib.Path],
        output_dir: str = OUTPUT_DIR,
        tolerance: float = TOLERANCE
    ):
        """Initialize the ImageCompressor.

        Args:
            input_path: str. Images directory.
            output_dir: str. Directory to store compressed images.
            tolerance: float. Compression threshold.
        """
        self.input_path = pathlib.Path(input_path)
        self.output_dir = output_dir
        self.tolerance = tolerance
        self.logger = logging.getLogger(__name__)

    def get_compression_type(self, file_extension: str) -> str:
        """Determine compression type based on file extension.

        Args:
            file_extension: str. The file extension of the image.

        Returns:
            type: str. Compression type (Zip or LZW).
        """
        return (
            'Zip' if file_extension in 
            self.IMAGE_EXTENSIONS_SUPPORTING_ZIP_COMPRESSION
            else 'LZW'
        )

    def run_compression_logic(
            self,
            file_path: pathlib.Path,
            output_file_path: pathlib.Path,
    ) -> List[CompressedImageInfo] | None:
        """Helper function for running compression logic.

        Args:
            file_path: pathlib.Path. The path to the image file.
            output_file_path: pathlib.Path. The path to the output file.

        Returns:
            image_compressibility_dicts: List(CompressedImageInfo). List of all
            compressible images over repository with attributes as path, 
            original_size and new_size.
        """

        file_extension = file_path.suffix.lower()
        image_compressibility_dicts: List[CompressedImageInfo] = []
        with Image.open(file_path):

            compression_type = self.get_compression_type(file_extension)

            cmd = [
                'gm', 'convert',
                str(file_path),
                '-strip',
                '-compress', compression_type,
                str(output_file_path)
            ]

            result = subprocess.run(
                cmd, capture_output=True, text=True, check=True
            )
            if result.returncode == 0 and output_file_path.exists():
                original_size = file_path.stat().st_size
                new_size = output_file_path.stat().st_size

                if new_size < original_size * self.tolerance:
                    image_compressibility_dicts.append({
                        'path': file_path,
                        'original_size': original_size,
                        'new_size': new_size
                    })
            else:
                logging.error(
                    '[ERROR]: %s occurred on file %s',
                        result.stderr,
                        file_path
                )

        return image_compressibility_dicts

    def find_compressible_images(self) -> List[CompressedImageInfo]:
        """Find images that can be compressed further.

        Returns:
            result_images: List[CompressedImageInfo]. List of all compressible
            images over repository with attributes as path, original_size
            and new_size.
        """
        result_images: List[CompressedImageInfo] = []

        for file_path in self.input_path.glob('**/*.*'):
            file_extension = file_path.suffix.lower()
            if file_extension not in self.ALL_IMAGES_EXTENSIONS:
                continue

            get_tempdir = tempfile.gettempdir()
            temp_compressed = (
                pathlib.Path(get_tempdir) / f'compressed_{file_path.name}'
            )
            result = self.run_compression_logic(
                file_path,
                temp_compressed,
            )
            if result:
                result_images.extend(result)

        return result_images

    def compress_images(
            self, result_images: List[CompressedImageInfo]
        ) -> None:
        """Compress the identified images.

        Args:
            result_images: List(CompressedImageInfo). List of images
                to be compressed.
        """
        # Remove existing output directory and create a new one.
        shutil.rmtree(self.output_dir, ignore_errors=True)

        os.makedirs(self.output_dir, exist_ok=True)

        for image in result_images:
            file_path = image['path']

            # Maintain original directory structure.
            rel_path = os.path.relpath(file_path, self.input_path)
            output_file_path = pathlib.Path(self.output_dir) / rel_path

            # Create necessary directories.
            os.makedirs(os.path.dirname(output_file_path), exist_ok=True)
            compress_result = self.run_compression_logic( # pylint: disable=unused-variable
                file_path,
                output_file_path,
            )

    def run(self) -> int:
        """Main method to run the image compression process.

        Returns: int. Exit code.
        """
        image_compressibility_dicts = self.find_compressible_images()

        if image_compressibility_dicts:
            space_saved = sum(
                image['original_size'] - image['new_size']
                for image in image_compressibility_dicts
            )

            print(
                f'{len(image_compressibility_dicts)} images '
                'could be compressed further:\n'
            )
            for image in image_compressibility_dicts:
                print('    ', image['path'])

            print(f'\nTotal space saved: {space_saved} bytes\n')

            for _ in range(10):
                self.compress_images(image_compressibility_dicts)

            print(
                '\nCompressed images have been saved '
                'to the compressed_images directory. '
                '\nTo use these compressed images in your PR:\n'
                '1. Click the summary tab at top left.\n'
                '2. Scroll down and look for compressed-images artifact.\n'
                '3. Download the compressed-images file.\n'
                '4. Extract the downloaded zip file.\n'
                '5. Replace the compressed images in their '
                'respective locations in your repository.\n'
            )
            return 1
        else:
            print('No images could be compressed further.')
            return 0


def main() -> int:
    """Main function for compression."""
    images_dir = pathlib.Path('./assets')
    compressor = ImageCompressor(images_dir)

    return compressor.run()


if __name__ == '__main__':  # pragma: no cover
    sys.exit(main())
