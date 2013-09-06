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


class MainPageTest(test_utils.GenericTestBase):

    TAGS = [test_utils.TestTags.SLOW_TEST]

    def testMainPage(self):
        """Test the main splash page."""
        response = self.testapp.get('/')
        self.assertEqual(response.status_int, 200)
        self.assertIn('Browse more explorations', response)


class NoninteractivePagesTest(test_utils.GenericTestBase):

    def testAboutPage(self):
        """Test the About page."""
        response = self.testapp.get('/about')
        self.assertEqual(response.status_int, 200)
        self.assertEqual(response.content_type, 'text/html')
        self.assertIn('Reinaldo', response)

    def testTermsPage(self):
        """Test the Terms page."""
        response = self.testapp.get('/terms')
        self.assertEqual(response.status_int, 200)
        self.assertEqual(response.content_type, 'text/html')
        self.assertIn('an open source project', response)
