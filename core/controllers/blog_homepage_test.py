# Copyright 2021 The Oppia Authors. All Rights Reserved.
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

"""Tests for the blog homepage page."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import logging

from core.domain import config_domain
from core.domain import config_services
from core.tests import test_utils
import feconf


class BlogHomepageDataHandlerTest(test_utils.GenericTestBase):
    """Checks the user role handling on the blog admin page."""

    username = 'user'
    user_email = 'user@example.com'

    def setUp(self):
         """Complete the setup process for testing."""
        super(BlogHomepageDataHandlerTest, self).setUp()
        self.signup(
            self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.admin_id = (
            self.get_user_id_from_email(self.ADMIN_EMAIL))
        self.signup(self.user_email, self.username)
        blog_post = blog_services.create_new_blog_post(self.admin_id)
        self.change_dict = {
            'title': 'Sample Title',
            'thumbnail_filename': 'thumbnail.svg',
            'content': '<p>Hello Bloggers<p>',
            'tags': ['Newsletter', 'Learners']
        }
        blog_services.update_blog_post(blog_post.id, self.change_dict)
        blog_services.publish_blog_post(blog_post.id)

    def test_get_homepage_data():
        self.login(self.user_email)
        json_response = self.get_json(
            '%s/data' % (feconf.BLOG_HOMEPAGE_URL),
            )
        default_tags = 
        self.assertEqual(self.BLOG_EDITOR_USERNAME, json_response['list_of_default_tags'])
