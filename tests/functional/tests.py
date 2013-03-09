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

"""Functional tests for Oppia."""

__author__ = 'Sean Lip'

import actions
from actions import assert_equals


class TestPermissions(actions.TestBase):
    """Test access to various pages."""

    def test_index_page(self):
        """Test access to the index page."""
        response = self.testapp.get('/')
        assert_equals(response.status_int, 200)

    def test_simple_pages(self):
        """Test access to the about and terms pages."""
        response = self.testapp.get('/terms/')
        assert_equals(response.status_int, 200)

        response = self.testapp.get('/about/')
        assert_equals(response.status_int, 200)

    def test_editor_page(self):
        """Test access to editor pages for the sample exploration."""
        response = self.testapp.get('/create/0/')
        assert_equals(response.status_int, 302)
