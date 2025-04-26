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

"""Tests for compress_images.py."""

from __future__ import annotations

import logging
import os
import pathlib
import shutil
import subprocess
import tempfile
from unittest import mock
from core.tests import test_utils
from scripts import compress_images

from PIL import Image
from typing import List, TypedDict


class CompressedImageInfo(TypedDict):
    """Type definition for compressed image information."""

    path: pathlib.Path
    original_size: int
    new_size: int


class TestImageCompressor(test_utils.GenericTestBase):
    """Test the ImageCompressor class."""

    def setUp(self) -> None:
        """Set up test environment before each test."""
        self.temp_dir = tempfile.mkdtemp()
        self.output_dir = os.path.join(self.temp_dir, 'compressed_images')

        self.png_path = os.path.join(self.temp_dir, 'test_image.png')
        self.jpg_path = os.path.join(self.temp_dir, 'test_image.jpg')
        self.webp_path = os.path.join(self.temp_dir, 'test_image.webp')
        self.txt_image_path = os.path.join(self.temp_dir, 'test_image.txt')

        self._create_test_image(self.png_path, 'PNG')
        self._create_test_image(self.jpg_path, 'JPEG')
        self._create_test_image(self.webp_path, 'WEBP')
        with open(self.txt_image_path, 'w', encoding='utf-8') as f:
            f.write('This is not a valid image.')

    def tearDown(self) -> None:
        """Clean up test environment after each test."""
        shutil.rmtree(self.temp_dir)

    def _create_test_image(self, path: str, Img_format: str) -> None:
        """Create a test image for compression testing."""
        img = Image.new('RGB', (100, 100), color='red')
        img.save(path, format=Img_format)

    def test_get_compression_type_zip_extension(self) -> None:
        """Test get_compression_type returns 'Zip' for PNG."""
        compressor = compress_images.ImageCompressor(self.temp_dir)
        compression_type = compressor.get_compression_type('.png')
        self.assertEqual(compression_type, 'Zip')

    def test_get_compression_type_lzw_extension(self) -> None:
        """Test get_compression_type returns 'LZW' for JPG."""
        compressor = compress_images.ImageCompressor(self.temp_dir)
        compression_type = compressor.get_compression_type('.jpg')
        self.assertEqual(compression_type, 'LZW')

    def test_find_compressible_images(self) -> None:
        """Test find_compressible_images method."""
        compressor = compress_images.ImageCompressor(
            self.temp_dir,
            output_dir=self.output_dir,
        )
        result_images = (
            compressor.find_compressible_images()
        )

        self.assertGreaterEqual(len(result_images), 1)

        for image in result_images:
            path_extension = image['path'].suffix.lower()
            expected_path = (
                pathlib.Path(self.temp_dir) / f'test_image{path_extension}'
            )
            self.assertEqual(image['path'].resolve(), expected_path)

    def test_compress_images(self) -> None:
        """Test image compression process."""
        compressor = compress_images.ImageCompressor(
            self.temp_dir,
            output_dir=self.output_dir
        )
        result_images = (
            compressor.find_compressible_images()
        )

        self.assertGreaterEqual(len(result_images), 1)
        compressor.compress_images(result_images)
        for image in result_images:
            original_path = image['path']
            original_size = image['original_size']

            rel_path = os.path.relpath(original_path, self.temp_dir)
            output_path = pathlib.Path(self.output_dir) / rel_path

            self.assertTrue(output_path.exists())
            compressed_size = output_path.stat().st_size
            self.assertLess(compressed_size, original_size)

    def test_compress_images_directory_removal_error(self) -> None:
        """Test error handling when removing output directory fails."""
        compressor = compress_images.ImageCompressor(
            self.temp_dir,
            output_dir=self.output_dir
        )
        os.makedirs(self.output_dir, exist_ok=True)
        mock_log_error = mock.MagicMock('log error')
        mock_subprocess_result = mock.Mock(
            returncode=1,
            stderr='Director removal error'
        )
        mock_subprocess_run = mock.Mock(return_value=mock_subprocess_result)

        with self.swap(logging, 'error', mock_log_error):
            with self.swap(subprocess, 'run', mock_subprocess_run):
                result_images: List[CompressedImageInfo] = [
                    {
                        'path': pathlib.Path(self.png_path),
                        'original_size': 1000,
                        'new_size': 500
                    }
                ]
                compressor.compress_images(result_images)

        mock_log_error.assert_called_with(
            '[ERROR]: %s occurred on file %s',
            'Director removal error',
            pathlib.Path(self.png_path)
        )
        args = [
            'gm', 'convert',
            str(self.png_path),
            '-strip',
            '-compress', 'Zip',
            mock.ANY
        ]
        mock_subprocess_run.assert_called_once_with(
            args,
            capture_output=True,
            text=True,
            check=True
        )

    def test_run_no_compressible_images(self) -> None:
        """Test run method when no images are compressible."""
        with tempfile.TemporaryDirectory() as temp_dir:
            txt_image_path = os.path.join(temp_dir, 'test_image.txt')
            with open(txt_image_path, 'w', encoding='utf-8') as f:
                f.write('This is not a valid image.')

            compressor = compress_images.ImageCompressor(temp_dir)
            result = compressor.run()
            self.assertEqual(result, 0)

    def test_run_with_compressible_images(self) -> None:
        """Test run method with compressible images."""

        compressor = compress_images.ImageCompressor(
            self.temp_dir,
            self.output_dir
        )
        result = compressor.run()
        self.assertEqual(result, 1)

    def test_unsupported_file_extensions(self) -> None:
        """Test handling of unsupported file extensions."""
        with open(self.txt_image_path, 'w', encoding='utf-8') as f:
            f.write('Not an image')

        compressor = compress_images.ImageCompressor(self.temp_dir)
        compressible_images = compressor.find_compressible_images()
        self.assertEqual(len(compressible_images), 1)

    def test_compress_images_handles_compression_failure(self) -> None:
        """Test handling of compression failure for an image."""
        compressor = compress_images.ImageCompressor(
            self.temp_dir,
            output_dir=self.output_dir
        )

        mock_subprocess_result = mock.Mock(
            returncode=1,
            stderr='Compression error message'
        )
        mock_subprocess_run = mock.Mock(return_value=mock_subprocess_result)
        mock_log_error = mock.Mock('log error')

        with self.swap(subprocess, 'run', mock_subprocess_run):
            with self.swap(logging, 'error', mock_log_error):
                result_images: List[CompressedImageInfo] = [
                    {
                        'path': pathlib.Path(self.png_path),
                        'original_size': 1000,
                        'new_size': 500
                    }
                ]
                compressor.compress_images(result_images)

        mock_log_error.assert_called_once_with(
            '[ERROR]: %s occurred on file %s',
            'Compression error message',
            pathlib.Path(self.png_path)
        )
        args = [
            'gm', 'convert',
            str(self.png_path),
            '-strip',
            '-compress', 'Zip',
            mock.ANY
        ]
        mock_subprocess_run.assert_called_once_with(
            args,
            capture_output=True,
            text=True,
            check=True
        )

    def test_main_function(self) -> None:
        """Test the main function execution."""
        mock_run = mock.MagicMock(return_value=0)
        mock_compressor = mock.MagicMock(spec_set=['run'])
        mock_compressor.run = mock_run
        mock_constructor = mock.MagicMock(return_value=mock_compressor)

        with self.swap(compress_images, 'ImageCompressor', mock_constructor):
            result = compress_images.main()
            self.assertEqual(result, 0)
            mock_run.assert_called_once()
            mock_constructor.assert_called_once_with(pathlib.Path('./assets'))
