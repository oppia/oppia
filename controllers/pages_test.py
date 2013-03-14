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


class PagesTest(test_utils.AppEngineTestBase):

    def testTermsPage(self):
        response = self.testapp.get('/terms')
        self.assertEqual(response.status_int, 200)
        self.assertEqual(response.content_type, 'text/html')
        self.assertIn('an open source project', response)

    def testAboutPage(self):
        response = self.testapp.get('/about')
        self.assertEqual(response.status_int, 200)
        self.assertEqual(response.content_type, 'text/html')
        self.assertIn('Reinaldo', response)

    def testMainPage(self):
        """Test access to the main splash page."""
        response = self.testapp.get('/')
        self.assertEqual(response.status_int, 200)
