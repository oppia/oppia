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

from __future__ import annotations

from core import utils
from core.constants import constants
from core.domain import blog_domain
from core.domain import blog_services
from core.tests import test_utils


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
                thumbnail_filename, strict=False)

    def _assert_strict_valid_thumbnail_filename_for_blog_post(
            self, expected_error_substring, thumbnail_filename):
        """Checks that blog post passes validation for thumbnail filename."""
        with self.assertRaisesRegexp(
            utils.ValidationError, expected_error_substring):
            blog_domain.BlogPost.require_valid_thumbnail_filename(
                thumbnail_filename, strict=True)

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

    def _assert_valid_blog_post_id_for_blog_post(
            self, expected_error_substring, blog_id):
        """Checks that blog post passes validation for id."""
        with self.assertRaisesRegexp(
            utils.ValidationError, expected_error_substring):
            blog_domain.BlogPost.require_valid_blog_post_id(blog_id)

    def test_blog_post_id_validation_for_blog_post(self):
        self._assert_valid_blog_post_id_for_blog_post(
            'Blog Post ID should be a string, received: 10', 10)
        self._assert_valid_blog_post_id_for_blog_post(
            r'Blog Post ID should be a string, received: \[10\]', [10])
        self._assert_valid_blog_post_id_for_blog_post(
            'Blog ID abcdef is invalid', 'abcdef')

    def test_thumbnail_filename_validation_for_blog_post(self):
        self._assert_valid_thumbnail_filename_for_blog_post(
            'Expected image filename to be a string, received 10', 10)
        self._assert_valid_thumbnail_filename_for_blog_post(
            'Image filename should not start with a dot.', '.name')
        self._assert_valid_thumbnail_filename_for_blog_post(
            'Image filename should not include slashes or '
            'consecutive dot characters.', 'file/name')
        self._assert_valid_thumbnail_filename_for_blog_post(
            'Image filename should not include slashes or '
            'consecutive dot characters.', 'file..name')
        self._assert_valid_thumbnail_filename_for_blog_post(
            'Image filename should include an extension.', 'name')
        self._assert_valid_thumbnail_filename_for_blog_post(
            'Thumbnail filename should not be empty', '')

    def test_blog_post_thumbnail_filename_in_strict_mode(self):
        self._assert_strict_valid_thumbnail_filename_for_blog_post(
            'Expected thumbnail filename to be a string, received: None.', None)

    def test_title_without_non_strict_validation(self):
        self._assert_valid_title_for_blog_post('Title should be a string', 50)
        self._assert_valid_title_for_blog_post(
            'Blog Post title should at most have 40 chars, received:'
            ' Very long and therefore an invalid blog post title',
            'Very long and therefore an invalid blog post title')

    def test_title_with_strict_validation(self):
        self._assert_strict_valid_title_for_blog_post(
            'Title should not be empty', '')
        self._assert_strict_valid_title_for_blog_post(
            'Title field contains invalid characters. Only words'
            r'\(a-zA-Z0-9\) separated by spaces are allowed. Received %s'
            % 'ABC12& heloo', 'ABC12& heloo')

    def _assert_strict_valid_tags_for_blog_post(
            self, expected_error_substring, tags):
        """Checks that the blog post tags passes validation."""
        with self.assertRaisesRegexp(
            utils.ValidationError, expected_error_substring):
            blog_domain.BlogPost.require_valid_tags(tags, True)

    def test_tags_validation_in_strict_mode(self):
        self._assert_strict_valid_tags_for_blog_post(
            'Atleast one tag should be selected', [])

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
            'Blog Post URL Fragment field should not exceed %d characters.'
            % (url_fragment_char_limit), url_fragment)
        self._assert_valid_url_fragment_for_blog_post(
            'Blog Post URL Fragment field contains invalid characters.'
            'Only lowercase words, numbers separated by hyphens are allowed. '
            'Received %s.' % ('oppia-in-covid19-#'), 'oppia-in-covid19-#')

        blog_domain.BlogPost.require_valid_url_fragment('oppia-in-covid19')

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
            'Expected each tag in \'tags\' to be a string,' +
            ' received: ''\'%s\'' % 123, ['abc', 123])
        self._assert_valid_tags_for_blog_post(
            'Tags should only contain alphanumeric characters and spaces, '
            'received: \'%s\'' % 'Alpha@', ['Alpha@'])
        self._assert_valid_tags_for_blog_post(
            'Tags should not start or end with whitespace, '
            'received: \'%s\'' % ' a b', [' a b'])
        self._assert_valid_tags_for_blog_post(
            'Tags should not start or end with whitespace, '
            'received: \'%s\'' % 'a b ', ['a b '])
        self._assert_valid_tags_for_blog_post(
            'Adjacent whitespace in tags should be collapsed, '
            'received: \'%s\'' % 'a    b', ['a    b'])
        self._assert_valid_tags_for_blog_post(
            'Some tags duplicate each other', ['abc', 'abc'])
        self._assert_valid_tags_for_blog_post(
            'Tag should not be empty.', ['abc', ''])

    def test_blog_post_passes_validate(self):
        """Tests validation for blog post."""
        self.blog_post.validate(strict=False)
        self.blog_post.content = 123
        self._assert_validation_error(
            'Expected contents to be a string, received: 123')

    def test_blog_post_passes_strict_validation(self):
        """Tests strict validation for blog post."""
        self.blog_post.title = 'Sample Title'
        self.blog_post.thumbnail_filename = 'thumbnail.svg'
        self.blog_post.tags = ['tag']
        self.blog_post.url_fragment = 'sample-title'
        self._assert_strict_validation_error('Content can not be empty')

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
        """Checks conversion of BlogPostRights to dict."""
        expected_dict = {
            'blog_post_id': self.blog_post_id,
            'editor_ids': [self.user_id_a],
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
                thumbnail_filename, strict=False)

    def _assert_strict_valid_thumbnail_filename_for_blog_post(
            self, expected_error_substring, thumbnail_filename):
        """Checks that blog post passes validation for thumbnail filename."""
        with self.assertRaisesRegexp(
            utils.ValidationError, expected_error_substring):
            blog_domain.BlogPostSummary.require_valid_thumbnail_filename(
                thumbnail_filename, strict=True)

    def test_thumbnail_filename_validation_for_blog_post(self):
        self._assert_valid_thumbnail_filename_for_blog_post(
            'Expected image filename to be a string, received 10', 10)
        self._assert_valid_thumbnail_filename_for_blog_post(
            'Image filename should not start with a dot.', '.name')
        self._assert_valid_thumbnail_filename_for_blog_post(
            'Image filename should not include slashes or '
            'consecutive dot characters.', 'file/name')
        self._assert_valid_thumbnail_filename_for_blog_post(
            'Image filename should not include slashes or '
            'consecutive dot characters.', 'file..name')
        self._assert_valid_thumbnail_filename_for_blog_post(
            'Image filename should include an extension.', 'name')
        self._assert_valid_thumbnail_filename_for_blog_post(
            'Thumbnail filename should not be empty', '')

    def test_blog_post_thumbnail_filename_in_strict_mode(self):
        self._assert_strict_valid_thumbnail_filename_for_blog_post(
            'Expected thumbnail filename to be a string, received: None.', None)

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

    def _assert_strict_valid_tags_for_blog_post(
            self, expected_error_substring, tags):
        """Checks that the blog post tags passes validation."""
        with self.assertRaisesRegexp(
            utils.ValidationError, expected_error_substring):
            blog_domain.BlogPostSummary.require_valid_tags(tags, True)

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
            'Blog Post URL Fragment field should not exceed %d characters.'
            % (url_fragment_char_limit), url_fragment)
        self._assert_valid_url_fragment_for_blog_post(
            'Blog Post URL Fragment field contains invalid characters.'
            'Only lowercase words, numbers separated by hyphens are allowed. '
            'Received %s.' % ('oppia-in-covid19-#'), 'oppia-in-covid19-#')

        blog_domain.BlogPostSummary.require_valid_url_fragment('oppia-covid19')

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
        self.blog_post_summary.validate(strict=False)
        self.blog_post_summary.summary = 123
        self._assert_validation_error(
            'Expected summary to be a string, received: 123')

    def test_blog_post_summary_passes_strict_validation(self):
        """Tests blog post summary passes validation in strict mode."""
        self.blog_post_summary.title = 'Sample Title'
        self.blog_post_summary.thumbnail_filename = 'thumbnail.svg'
        self.blog_post_summary.tags = ['tag']
        self.blog_post_summary.summary = ''
        self.blog_post_summary.url_fragment = 'sample-title'
        self._assert_strict_validation_error('Summary can not be empty')

        self.blog_post_summary.summary = 'Hello'
        self.blog_post_summary.validate(strict=True)

    def test_tags_validation_for_blog_post(self):
        """"Tests tags validation for blog post."""

        self._assert_valid_tags_for_blog_post(
            'Expected \'tags\' to be a list, received: this should be a list',
            'this should be a list')
        self._assert_valid_tags_for_blog_post(
            'Expected each tag in \'tags\' to be a string,' +
            ' received: ''\'%s\'' % 123, [123])
        self._assert_valid_tags_for_blog_post(
            'Expected each tag in \'tags\' to be a string,' +
            ' received: ''\'%s\'' % 123, ['abc', 123])
        self._assert_valid_tags_for_blog_post(
            'Tags should only contain alphanumeric characters and spaces, '
            'received: \'%s\'' % 'Alpha@', ['Alpha@'])
        self._assert_valid_tags_for_blog_post(
            'Tags should not start or end with whitespace, '
            'received: \'%s\'' % ' a b', [' a b'])
        self._assert_valid_tags_for_blog_post(
            'Tags should not start or end with whitespace, '
            'received: \'%s\'' % 'a b ', ['a b '])
        self._assert_valid_tags_for_blog_post(
            'Adjacent whitespace in tags should be collapsed, '
            'received: \'%s\'' % 'a    b', ['a    b'])
        self._assert_valid_tags_for_blog_post(
            'Some tags duplicate each other', ['abc', 'abc'])
        self._assert_valid_tags_for_blog_post(
            'Tag should not be empty.', ['abc', ''])

    def test_tags_validation_in_strict_mode(self):
        self._assert_strict_valid_tags_for_blog_post(
            'Atleast one tag should be selected', [])
