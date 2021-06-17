# coding: utf-8
#
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

"""Tests for blog post domain objects."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime

from constants import constants
from core.domain import blog_domain
from core.domain import blog_services
from core.domain import user_services
from core.tests import test_utils
import feconf
import utils

class BlogPostDomainUnitTests(test_utils.GenericTestBase):
    """Tests for blog post domain objects."""

    def setUp(self):
        super(BlogPostDomainUnitTests, self).setUp()
        self.signup('a@example.com', 'A')
        self.user_id_a = self.get_user_id_from_email('a@example.com')

        self.blog_post = blog_services.create_new_blog_post(self.user_id_a)

    def _assert_strict_validation_error(self, expected_error_substring):
        """Checks that the blog post passes strict validation."""
        with self.assertRaisesRegexp(
            utils.ValidationError, expected_error_substring):
            self.blog_post.validate(strict=True)

    def _assert_validation_error(self, expected_error_substring):
        """Checks that the blog post passes validation."""
        with self.assertRaisesRegexp(
            utils.ValidationError, expected_error_substring):
            self.blog_post.validate()

    def _assert_valid_blog_post_id(self, expected_error_substring, blog_post_id):
        """Checks that the blog post ID passes validation."""
        with self.assertRaisesRegexp(
            utils.ValidationError, expected_error_substring):
            blog_domain.BlogPost.require_valid_blog_post_id(blog_post_id)

    def _assert_valid_tags_for_blog_post(self, expected_error_substring, tags):
        """Checks that the blog post tags passes validation."""
        with self.assertRaisesRegexp(
            utils.ValidationError, expected_error_substring):
            blog_domain.BlogPost.require_valid_tags(tags, False)

    def _assert_valid_thumbnail_filename_for_blog_post(
            self, expected_error_substring, thumbnail_filename):
        """Checks that blog post passes validation for thumbnail filename."""
        with self.assertRaisesRegexp(
            utils.ValidationError, expected_error_substring):
            blog_domain.BlogPost.require_valid_thumbnail_filename(
                thumbnail_filename)

    def _assert_strict_valid_thumbnail_filename_for_blog_post(
            self, expected_error_substring, thumbnail_filename):
        """Checks that blog post passes validation for thumbnail filename."""
        with self.assertRaisesRegexp(
            utils.ValidationError, expected_error_substring):
            blog_domain.BlogPost.require_valid_thumbnail_filename(
                thumbnail_filename, True)

    def _assert_strict_valid_title_for_blog_post(
            self, expected_error_substring, title):
        """Checks that blog post passes strict validation for title."""
        with self.assertRaisesRegexp(
            utils.ValidationError, expected_error_substring):
            blog_domain.BlogPost.require_valid_title(title, True)

    def _assert_valid_title_for_blog_post(
            self, expected_error_substring, title):
        """Checks that blog post passes validation for title."""
        with self.assertRaisesRegexp(
            utils.ValidationError, expected_error_substring):
            blog_domain.BlogPost.require_valid_title(title, False)

    def _assert_valid_url_fragment_for_blog_post(
            self, expected_error_substring, url):
        """Checks that blog post passes validation for url."""
        with self.assertRaisesRegexp(
            utils.ValidationError, expected_error_substring):
            blog_domain.BlogPost.require_valid_url_fragment(url)

    def test_valid_blog_post_id(self):
        self._assert_valid_blog_post_id(
            'blog post id should be a string, received: 10', 10)
        self._assert_valid_blog_post_id('Invalid blog post id.', 'abc')

    def test_thumbnail_filename_validation_for_blog_post(self):
        self._assert_valid_thumbnail_filename_for_blog_post(
            'Expected thumbnail filename to be a string, received 10', 10)
        self._assert_valid_thumbnail_filename_for_blog_post(
            'Thumbnail filename should not start with a dot.', '.name')
        self._assert_valid_thumbnail_filename_for_blog_post(
            'Thumbnail filename should not include slashes or '
            'consecutive dot characters.', 'file/name')
        self._assert_valid_thumbnail_filename_for_blog_post(
            'Thumbnail filename should not include slashes or '
            'consecutive dot characters.', 'file..name')
        self._assert_valid_thumbnail_filename_for_blog_post(
            'Thumbnail filename should include an extension.', 'name')
        self._assert_valid_thumbnail_filename_for_blog_post(
            'Expected a filename ending in svg, received name.jpg', 'name.jpg')
        self._assert_valid_thumbnail_filename_for_blog_post(
            'Thumbnail filename should not be empty', '')

    def test_blog_post_thumbnail_filename_in_strict_mode(self):
        self._assert_strict_valid_thumbnail_filename_for_blog_post(
        'Expected thumbnail filename to be a string, received: None.', None)

    def test_title_validation(self):
        self._assert_valid_title_for_blog_post('Title should be a string', 50)
        self._assert_valid_title_for_blog_post(
            'Blog Post title should at most have 40 chars, received:'
            ' Very long and therefore an invalid blog post title',
            'Very long and therefore an invalid blog post title')
        self._assert_strict_valid_title_for_blog_post(
            'Title should not be empty', '')

    def test_url_fragment_validation(self):
        self._assert_valid_url_fragment_for_blog_post(
            'Blog Post URL Fragment field must be a string. Received 0.', 0)
        self._assert_valid_url_fragment_for_blog_post(
            'Blog Post URL Fragment field should not be empty.', '')
        self._assert_valid_url_fragment_for_blog_post(
            'Blog Post URL Fragment field should not be empty.', '')
        url_fragment= 'very-very-long' * 30
        url_fragment_char_limit = constants.MAX_CHARS_IN_BLOG_POST_URL_FRAGMENT
        self._assert_valid_url_fragment_for_blog_post(
            'Blog Post URL Fragment field should not exceed %d characters, '
            'received %s.' % (
                url_fragment_char_limit, url_fragment), url_fragment)

    def test_serialize_and_deserialize_returns_unchanged_blog_post(self):
        """Checks that serializing and then deserializing a blog post works as intended
        by leaving the blog post unchanged.
        """
        self.assertEqual(
            self.blog_post.to_dict(),
            blog_domain.BlogPost.deserialize(self.blog_post.serialize()).to_dict())

    def test_update_title(self):
        self.assertEqual(self.blog_post.title, '')
        self.blog_post.update_title('Blog Post Title')
        self.assertEqual(self.blog_post.title, 'Blog Post Title')

    def test_update_thumbnail(self):
        self.assertEqual(self.blog_post.thumbnail_filename, None)
        self.blog_post.update_thumbnail_filename('Thumbnail.svg')
        self.assertEqual(self.blog_post.thumbnail_filename, 'Thumbnail.svg')

    def test_update_url_fragment(self):
        current_url_fragment = ''
        self.assertEqual(self.blog_post.url_fragment, current_url_fragment)
        self.blog_post.update_url_fragment('url-fragment')
        self.assertEqual(self.blog_post.url_fragment, 'url-fragment')

    def test_update_tags(self):
        self.assertEqual(self.blog_post.tags, [])
        self.blog_post.update_tags(['tag'])
        self.assertEqual(self.blog_post.tags, ['tag'])

    def test_blog_post_contents_export_import(self):
        """Test that to_dict and from_dict preserve all data within a
        blog post contents object.
        """
        blog_post_contents_dict = self.blog_post.to_dict()
        blog_post_contents_from_dict = blog_domain.BlogPost.from_dict(
            blog_post_contents_dict)
        self.assertEqual(
            blog_post_contents_from_dict.to_dict(), blog_post_contents_dict)

    def test_update_content(self):
        self.assertEqual(self.blog_post.content, '')
        self.blog_post.update_content('<p>Hello</p>')
        self.assertEqual(self.blog_post.content, '<p>Hello</p>')

    def test_tags_validation_for_blog_post(self):
        """"Tests tags validation for blog post."""

        self._assert_valid_tags_for_blog_post(
            'Expected \'tags\' to be a list, received: this should be a list',
            'this should be a list')
        self._assert_valid_tags_for_blog_post(
            'Expected each tag in \'tags\' to be a string,' +
            ' received: ''\'%s\'' % 123, [123])
        self._assert_valid_tags_for_blog_post(
            'Expected each tag in \'tags\' to be a string,'+
            ' received: ''\'%s\'' % 123, ['abc', 123])
        self._assert_valid_tags_for_blog_post(
            'Tags should only contain lowercase letters and spaces, '
                'received: \'%s\''% 'ABC', ['ABC'])
        self._assert_valid_tags_for_blog_post(
            'Tags should not start or end with whitespace, '
                'received: \'%s\''% ' a b', [' a b'])
        self._assert_valid_tags_for_blog_post(
            'Tags should not start or end with whitespace, '
                'received: \'%s\''% 'a b ', ['a b '])
        self._assert_valid_tags_for_blog_post(
            'Adjacent whitespace in tags should be collapsed, '
                'received: \'%s\''% 'a    b', ['a    b'])
        self._assert_valid_tags_for_blog_post(
            'Some tags duplicate each other', ['abc', 'abc'])

    def test_blog_post_passes_validate(self):
        """Tests validation for blog post."""
        self.blog_post.title = 'Sample Title'
        self.blog_post.thumbnail_filename = 'thumbnail.svg'
        self.blog_post.tags = ['tag']
        self.blog_post.url_fragment = 'sample-title'
        self._assert_strict_validation_error('Content can not be empty')
        self.blog_post.content = 123
        self._assert_validation_error(
            'Expected contents to be a string, received: 123')
        self.blog_post.content = '<p>Hello</p>'
        self.blog_post.validate(strict=True)


class BlogPostRightsDomainUnitTests(test_utils.GenericTestBase):

    def setUp(self):
        super(BlogPostRightsDomainUnitTests, self).setUp()
        self.signup('a@example.com', 'A')
        self.signup('b@example.com', 'B')

        self.user_id_a = self.get_user_id_from_email('a@example.com')
        self.user_id_b = self.get_user_id_from_email('b@example.com')

        blog_post = blog_services.create_new_blog_post(self.user_id_a)
        self.blog_post_id = blog_post.id
        self.blog_post_rights = (
            blog_services.get_blog_post_rights(self.blog_post_id))

    def test_is_editor(self):
        self.assertTrue(self.blog_post_rights.is_editor(self.user_id_a))
        self.assertFalse(self.blog_post_rights.is_editor(self.user_id_b))

    def test_to_human_readable_dict(self):
        """Checks conversion of BlogPostRights to human readable dict"""
        expected_dict = {
            'blog_post_id': self.blog_post_id,
            'editor_names': ['A'],
            'blog_post_is_published': False
        }
        self.assertEqual(self.blog_post_rights.to_dict(), expected_dict)


class BlogPostSummaryUnitTests(test_utils.GenericTestBase):

    def setUp(self):
        super(BlogPostSummaryUnitTests, self).setUp()
        self.signup('a@example.com', 'A')
        self.user_id_a = self.get_user_id_from_email('a@example.com')
        blog_post = blog_services.create_new_blog_post(self.user_id_a)
        self.blog_post_id = blog_post.id
        self.blog_post_summary = (
            blog_services.get_blog_post_summary_by_id(self.blog_post_id))

    def _assert_valid_thumbnail_filename_for_blog_post(
            self, expected_error_substring, thumbnail_filename):
        """Checks that blog post passes validation for thumbnail filename."""
        with self.assertRaisesRegexp(
            utils.ValidationError, expected_error_substring):
            blog_domain.BlogPostSummary.require_valid_thumbnail_filename(
                thumbnail_filename)

    def _assert_strict_valid_thumbnail_filename_for_blog_post(
            self, expected_error_substring, thumbnail_filename):
        """Checks that blog post passes validation for thumbnail filename."""
        with self.assertRaisesRegexp(
            utils.ValidationError, expected_error_substring):
            blog_domain.BlogPostSummary.require_valid_thumbnail_filename(
                thumbnail_filename, True)

    def test_thumbnail_filename_validation_for_blog_post(self):
        self._assert_valid_thumbnail_filename_for_blog_post(
            'Expected thumbnail filename to be a string, received 10', 10)
        self._assert_valid_thumbnail_filename_for_blog_post(
            'Thumbnail filename should not start with a dot.', '.name')
        self._assert_valid_thumbnail_filename_for_blog_post(
            'Thumbnail filename should not include slashes or '
            'consecutive dot characters.', 'file/name')
        self._assert_valid_thumbnail_filename_for_blog_post(
            'Thumbnail filename should not include slashes or '
            'consecutive dot characters.', 'file..name')
        self._assert_valid_thumbnail_filename_for_blog_post(
            'Thumbnail filename should include an extension.', 'name')
        self._assert_valid_thumbnail_filename_for_blog_post(
            'Expected a filename ending in svg, received name.jpg', 'name.jpg')
        self._assert_valid_thumbnail_filename_for_blog_post(
            'Thumbnail filename should not be empty', '')

    def test_blog_post_thumbnail_filename_in_strict_mode(self):
        self._assert_strict_valid_thumbnail_filename_for_blog_post(
        'Expected thumbnail filename to be a string, received: None.', None)

    def _assert_valid_blog_post_id(self, expected_error_substring, blog_post_id):
        """Checks that the blog post ID passes validation."""
        with self.assertRaisesRegexp(
            utils.ValidationError, expected_error_substring):
            blog_domain.BlogPostSummary.require_valid_blog_post_id(blog_post_id)

    def test_valid_blog_post_id(self):
        self._assert_valid_blog_post_id(
            'blog post id should be a string, received: 10', 10)
        self._assert_valid_blog_post_id('Invalid blog post id.', 'abc')

    def _assert_strict_valid_title_for_blog_post(
            self, expected_error_substring, title):
        """Checks that blog post passes strict validation for title."""
        with self.assertRaisesRegexp(
            utils.ValidationError, expected_error_substring):
            blog_domain.BlogPostSummary.require_valid_title(title, True)

    def _assert_valid_title_for_blog_post(
            self, expected_error_substring, title):
        """Checks that blog post passes validation for title."""
        with self.assertRaisesRegexp(
            utils.ValidationError, expected_error_substring):
            blog_domain.BlogPostSummary.require_valid_title(title, False)

    def _assert_valid_url_fragment_for_blog_post(
            self, expected_error_substring, url):
        """Checks that blog post passes validation for url."""
        with self.assertRaisesRegexp(
            utils.ValidationError, expected_error_substring):
            blog_domain.BlogPostSummary.require_valid_url_fragment(url)

    def _assert_valid_tags_for_blog_post(self, expected_error_substring, tags):
        """Checks that the blog post tags passes validation."""
        with self.assertRaisesRegexp(
            utils.ValidationError, expected_error_substring):
            blog_domain.BlogPostSummary.require_valid_tags(tags, False)

    def test_title_validation(self):
        self._assert_valid_title_for_blog_post('Title should be a string', 50)
        self._assert_valid_title_for_blog_post(
            'blog post title should at most have 40 chars, received:'
            ' Very long and therefore an invalid blog post title',
            'Very long and therefore an invalid blog post title')
        self._assert_strict_valid_title_for_blog_post(
            'Title should not be empty', '')

    def test_url_fragment_validation(self):
        self._assert_valid_url_fragment_for_blog_post(
            'Blog Post URL Fragment field must be a string. Received 0.', 0)
        self._assert_valid_url_fragment_for_blog_post(
            'Blog Post URL Fragment field should not be empty.', '')
        self._assert_valid_url_fragment_for_blog_post(
            'Blog Post URL Fragment field should not be empty.', '')
        url_fragment = 'very-very-long' * 30
        url_fragment_char_limit = constants.MAX_CHARS_IN_BLOG_POST_URL_FRAGMENT
        self._assert_valid_url_fragment_for_blog_post(
            'Blog Post URL Fragment field should not exceed %d characters, '
            'received %s.' % (
                url_fragment_char_limit, url_fragment), url_fragment)

    def _assert_strict_validation_error(self, expected_error_substring):
        """Checks that the blog post passes strict validation."""
        with self.assertRaisesRegexp(
            utils.ValidationError, expected_error_substring):
            self.blog_post_summary.validate(strict=True)

    def _assert_validation_error(self, expected_error_substring):
        """Checks that the blog post passes validation."""
        with self.assertRaisesRegexp(
            utils.ValidationError, expected_error_substring):
            self.blog_post_summary.validate()

    def test_blog_post_summary_passes_validate(self):
        """Tests validation for blog post summary."""
        self.blog_post_summary.title = 'Sample Title'
        self.blog_post_summary.thumbnail_filename = 'thumbnail.svg'
        self.blog_post_summary.tags = ['tag']
        self.blog_post_summary.summary = ''
        self.blog_post_summary.url_fragment = 'sample-title'
        self._assert_strict_validation_error('Summary can not be empty')
        self.blog_post_summary.summary = 123
        self._assert_validation_error(
            'Expected summary to be a string, received: 123')
        self.blog_post_summary.summary= 'Hello'
        self.blog_post_summary.validate(strict=True)

