# coding: utf-8
#
# Copyright 2018 The Oppia Authors. All Rights Reserved.
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

"""Tests for methods in the ImageFileInfo registry."""

from core.domain import image_file_info_domain
from core.tests import test_utils


class ImageFileInfoDomainUnitTests(test_utils.GenericTestBase):
    """Tests for ImageFileInfo domain class."""

    def setUp(self):
        super(ImageFileInfoDomainUnitTests, self).setUp()
        self.imageFileInfo = image_file_info_domain.ImageFileInfo(
            'image.png', height=120, width=450)

    def test_to_dict(self):
        imageFileInfo_dict = self.imageFileInfo.to_dict()
        self.assertEqual(
            imageFileInfo_dict,
            {
                'filename': 'image.png',
                'height': 120,
                'width': 450
            }
        )
