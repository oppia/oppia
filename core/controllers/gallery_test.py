# Copyright 2012 Google Inc. All Rights Reserved.
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

__author__ = 'Sean Lip'

import test_utils


class GalleryTest(test_utils.AppEngineTestBase):

    def test_gallery_page(self):
        """Test access to gallery page."""
        response = self.testapp.get('/gallery')
        self.assertEqual(response.status_int, 200)
        self.assertSubstring('Gallery', response.body)
