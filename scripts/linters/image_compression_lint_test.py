# coding: utf-8
#
# Copyright 2020 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for scripts/linters/image_compression_lint.py."""

import os
import pathlib
import unittest
from unittest.mock import Mock, mock_open, MagicMock
from PIL import Image
import tempfile
import subprocess

from image_compression_lint import check_compressible_images, CompressibleImageInfo


class TestImageCompressionLint(unittest.TestCase):
    """Test the image compression linting script."""

    def setUp(self):
        self.test_dir = tempfile.mkdtemp()

    def _create_test_image(self, filename, size=(100, 100)):
        """Helper method to create a test image."""
        full_path = os.path.join(self.test_dir, filename)
        test_image = Image.new('RGB', size, color='red')
        test_image.save(full_path)
        return full_path

    def test_check_compressible_images_png(self):
        png_path = self._create_test_image('test.png')
        mock_path = pathlib.Path(png_path)

        with unittest.mock.patch('pathlib.Path.glob', return_value=[mock_path]):
            mock_subprocess = Mock()
            mock_subprocess.returncode = 0
            with unittest.mock.patch('subprocess.run', return_value=mock_subprocess):
                mock_stat1 = Mock(st_size=1000)
                mock_stat2 = Mock(st_size=500)
                
                with unittest.mock.patch('pathlib.Path.stat', side_effect=[mock_stat1, mock_stat2]):
                    with unittest.mock.patch('pathlib.Path.exists', return_value=True):
                        results = check_compressible_images(self.test_dir)

                        self.assertEqual(len(results), 1)
                        self.assertEqual(results[0]['path'], mock_path)
                        self.assertEqual(results[0]['current_size'], 1000)
                        self.assertEqual(results[0]['potential_size'], 500)

    def test_check_compressible_images_jpg(self):
        jpg_path = self._create_test_image('test.jpg')
        mock_path = pathlib.Path(jpg_path)

        with unittest.mock.patch('pathlib.Path.glob', return_value=[mock_path]):
            mock_subprocess = Mock()
            mock_subprocess.returncode = 0
            with unittest.mock.patch('subprocess.run', return_value=mock_subprocess):
                mock_stat1 = Mock(st_size=1000)
                mock_stat2 = Mock(st_size=500)
                
                with unittest.mock.patch('pathlib.Path.stat', side_effect=[mock_stat1, mock_stat2]):
                    with unittest.mock.patch('pathlib.Path.exists', return_value=True):
                        results = check_compressible_images(self.test_dir)
                        self.assertEqual(len(results), 1)
                        self.assertEqual(results[0]['path'], mock_path)

    def test_check_compressible_images_unsupported_extension(self):
        txt_path = os.path.join(self.test_dir, 'test.txt')
        with open(txt_path, 'w') as f:
            f.write('test')

        results = check_compressible_images(self.test_dir)

        self.assertEqual(len(results), 0)

    def test_check_compressible_images_compression_failed(self):
        png_path = self._create_test_image('test.png')
        mock_path = pathlib.Path(png_path)

        with unittest.mock.patch('pathlib.Path.glob', return_value=[mock_path]):
            mock_subprocess = Mock()
            mock_subprocess.returncode = 1
            with unittest.mock.patch('subprocess.run', return_value=mock_subprocess):
                results = check_compressible_images(self.test_dir)
                self.assertEqual(len(results), 0)

    def test_check_compressible_images_image_open_error(self):
        png_path = self._create_test_image('test.png')
        mock_path = pathlib.Path(png_path)

        with unittest.mock.patch('pathlib.Path.glob', return_value=[mock_path]):
            with unittest.mock.patch('PIL.Image.open', side_effect=Exception('Test error')):
                results = check_compressible_images(self.test_dir)
                self.assertEqual(len(results), 0)

if __name__ == '__main__':
    unittest.main()
