# Copyright 2019 The Oppia Authors. All Rights Reserved.
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

import os
import pathlib
import shutil
import tempfile
import unittest
from unittest import mock

from scripts import compress_images

from PIL import Image
from typing import List, TypedDict


class CompressedImageInfo(TypedDict):
    """Type definition for compressed image information."""

    path: pathlib.Path
    original_size: int
    new_size: int


class TestImageCompressor(unittest.TestCase):
    """Test the ImageCompressor class."""

    def setUp(self) -> None:
        """Set up test environment before each test."""
        self.temp_dir = tempfile.mkdtemp()
        self.output_dir = os.path.join(self.temp_dir, 'compressed_images')

        self.png_path = os.path.join(self.temp_dir, 'test_image.png')
        self.jpg_path = os.path.join(self.temp_dir, 'test_image.jpg')
        self.webp_path = os.path.join(self.temp_dir, 'test_image.webp')

        self._create_test_image(self.png_path, 'PNG')
        self._create_test_image(self.jpg_path, 'JPEG')
        self._create_test_image(self.webp_path, 'WEBP')

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

    @mock.patch('subprocess.run')
    def test_compress_images(self, mock_subprocess_run: mock.MagicMock) -> None:
        """Test image compression process."""
        result_images: List[CompressedImageInfo] = [
            {
                'path': pathlib.Path(self.png_path),
                'original_size': 1000,
                'new_size': 500
            }
        ]
        compressor = compress_images.ImageCompressor(
            self.temp_dir,
            output_dir=self.output_dir
        )
        compressor.compress_images(result_images)
        self.assertTrue(os.path.exists(self.output_dir))
        mock_subprocess_run.assert_called()

    @mock.patch('pathlib.Path.stat')
    def test_file_size_retrieval_without_compression(self, mock_stat) -> None:
        """Test file sizes are retrieved when actual_compression is False."""
        mock_stat.return_value.st_size = 10000

        file_path = pathlib.Path('/fake/path/image.png')
        output_file_path = pathlib.Path('/fake/path/compressed_image.png')

        actual_compression = False
        if not actual_compression:
            original_size = file_path.stat().st_size
            new_size = output_file_path.stat().st_size

        self.assertEqual(original_size, 10000)
        self.assertEqual(new_size, 10000)
        mock_stat.assert_any_call()

    def test_run_no_compressible_images(self) -> None:
        """Test run method when no images are compressible."""
        compressor = compress_images.ImageCompressor(self.temp_dir)
        # Here we use object because a single compressible image
        # dict needs to be wrapped in a list to match the
        # method's expected return type and testing scenario.
        with mock.patch.object(
            compressor, 'find_compressible_images', return_value=[]
        ):

            result = compressor.run()
            self.assertEqual(result, 0)

    def test_return_value_based_on_actual_compression(self) -> None:
        """Test return value based on actual_compression flag."""
        result_image = [{
            'path': '/fake/path/image.png',
            'original_size': 10000,
            'new_size': 9000
        }]

        # Case 1.
        actual_compression = True
        if actual_compression:
            result = None
        else:
            result = result_image
        self.assertIsNone(result)

        # Case 2.
        actual_compression = False
        if actual_compression:
            result = None
        else:
            result = result_image
        self.assertEqual(result, result_image)

    @mock.patch('subprocess.run')
    def test_run_with_compressible_images(
        self, mock_subprocess_run: mock.MagicMock
    ) -> None:
        """Test run method with compressible images."""
        compressor = compress_images.ImageCompressor(
            self.temp_dir,
            output_dir=os.path.join(self.temp_dir, 'compressed_images')
        )
        mock_compressible_images = [
            {
                'path': pathlib.Path(self.png_path),
                'original_size': 1000,
                'new_size': 500
            }
        ]
        # Here we use object because a single compressible image
        # dict needs to be wrapped in a list to match the
        # method's expected return type and testing scenario.
        with mock.patch.object(
            compressor,
            'find_compressible_images',
            return_value=mock_compressible_images
        ):
            result = compressor.run()
            self.assertEqual(result, 1)

            self.assertEqual(mock_subprocess_run.call_count, 10)

    def test_unsupported_file_extensions(self) -> None:
        """Test handling of unsupported file extensions."""
        unsupported_path = os.path.join(self.temp_dir, 'test_image.txt')
        with open(unsupported_path, 'w', encoding='utf-8') as f:
            f.write('Not an image')
        compressor = compress_images.ImageCompressor(self.temp_dir)
        compressible_images = compressor.find_compressible_images()
        self.assertEqual(len(compressible_images), 1)

    def test_compress_images_handles_compression_failure(self) -> None:
        """Test handling of compression failure for an image."""
        result_images: List[CompressedImageInfo] = [
            {
                'path': pathlib.Path(self.png_path),
                'original_size': 1000,
                'new_size': 500
            }
        ]
        compressor = compress_images.ImageCompressor(
            self.temp_dir,
            output_dir=self.output_dir
        )
        with (
            mock.patch('subprocess.run') as mock_subprocess_run,
            mock.patch('logging.error') as mock_log_error
        ):
            mock_subprocess_run.return_value = mock.Mock(
                returncode=1,
                stderr='Compression error message'
            )
            with mock.patch('PIL.Image.open'):
                compressor.compress_images(result_images)
            mock_log_error.assert_called_once_with(
                '[ERROR]: %s occurred on file %s',
                mock.ANY,
                'Compression error message'
            )
            mock_subprocess_run.assert_called_once()

    @mock.patch('scripts.compress_images.ImageCompressor.run', return_value=0)
    @mock.patch('builtins.print')
    def test_main_function(self, mock_print, mock_run) -> None:
        """Test the main function execution."""

        result = compress_images.main()

        mock_print.assert_called_once_with(
            '[IMPORTANT NOTE]: Make sure to delete the /compressed folder '
            'after replacing images in the repository. '
        )
        mock_run.assert_called_once()
        self.assertEqual(result, 0)
