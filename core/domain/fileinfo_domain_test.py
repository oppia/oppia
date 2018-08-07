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

"""Tests for methods in the Fileinfo object of image."""

from core.domain import fileinfo_domain
from core.tests import test_utils


class FileinfoDomainUnitTests(test_utils.GenericTestBase):
    """Tests for Fileinfo domain class."""

    def setUp(self):
        super(FileinfoDomainUnitTests, self).setUp()
        self.fileinfo = fileinfo_domain.Fileinfo(
            'image.png', height=120, width=450)

    def test_to_dict(self):
        fileinfo_dict = self.fileinfo.to_dict()
        self.assertEqual(
            fileinfo_dict,
            {
                'filename': 'image.png',
                'height': 120,
                'width': 450
            }
        )
