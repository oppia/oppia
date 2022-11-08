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
from core.platform import models
from core.tests import test_utils

from typing import List

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import blog_models
(blog_models,) = models.Registry.import_models([models.Names.BLOG])


class BlogPostDomainUnitTests(test_utils.GenericTestBase):
    """Tests for blog post domain objects."""

    def setUp(self) -> None:
        super().setUp()
        self.signup('a@example.com', 'A')
        self.user_id_a = self.get_user_id_from_email('a@example.com')

        self.blog_post = blog_services.create_new_blog_post(self.user_id_a)

    def _assert_strict_validation_error(
        self, expected_error_substring: str
    ) -> None:
        """Checks that the blog post passes strict validation."""
        with self.assertRaisesRegex(
            utils.ValidationError, expected_error_substring):
            self.blog_post.validate(strict=True)

    # Here we use MyPy ignore because the signature of this method
    # doesn't match with TestBase._assert_validation_error().
    def _assert_validation_error( # type: ignore[override]
        self, expected_error_substring: str
    ) -> None:
        """Checks that the blog post passes validation."""
        with self.assertRaisesRegex(
            utils.ValidationError, expected_error_substring):
            self.blog_post.validate()

    def _assert_valid_tags_for_blog_post(
        self,
        expected_error_substring: str,
        tags: List[str]
    ) -> None:
        """Checks that the blog post tags passes validation."""
        with self.assertRaisesRegex(
            utils.ValidationError, expected_error_substring):
            blog_domain.BlogPost.require_valid_tags(tags, False)

    def _assert_valid_thumbnail_filename_for_blog_post(
        self,
        expected_error_substring: str,
        thumbnail_filename: str
    ) -> None:
        """Checks that blog post passes validation for thumbnail filename."""
        with self.assertRaisesRegex(
            utils.ValidationError, expected_error_substring):
            blog_domain.BlogPost.require_valid_thumbnail_filename(
                thumbnail_filename, strict=False)

    def _assert_strict_valid_thumbnail_filename_for_blog_post(
        self, expected_error_substring: str
    ) -> None:
        """Checks that blog post passes validation for thumbnail filename."""
        with self.assertRaisesRegex(
            utils.ValidationError, expected_error_substring):
            # Ruling out the possibility of None for mypy type checking.
            assert self.blog_post.thumbnail_filename is not None
            blog_domain.BlogPost.require_valid_thumbnail_filename(
                self.blog_post.thumbnail_filename, strict=True)

    def _assert_valid_url_fragment(
        self, expected_error_substring: str
    ) -> None:
        """Checks that blog post passes strict validation for url."""
        with self.assertRaisesRegex(
            utils.ValidationError, expected_error_substring):
            blog_domain.BlogPost.require_valid_url_fragment(
                self.blog_post.url_fragment)

    def _assert_strict_valid_title_for_blog_post(
        self, expected_error_substring: str, title: str
    ) -> None:
        """Checks that blog post passes strict validation for title."""
        with self.assertRaisesRegex(
            utils.ValidationError, expected_error_substring):
            blog_domain.BlogPost.require_valid_title(title, True)

    def _assert_valid_title_for_blog_post(
        self, expected_error_substring: str, title: str
    ) -> None:
        """Checks that blog post passes validation for title."""
        with self.assertRaisesRegex(
            utils.ValidationError, expected_error_substring):
            blog_domain.BlogPost.require_valid_title(title, False)

    def _assert_valid_url_fragment_for_blog_post(
        self, expected_error_substring: str, url: str
    ) -> None:
        """Checks that blog post passes validation for url."""
        with self.assertRaisesRegex(
            utils.ValidationError, expected_error_substring):
            blog_domain.BlogPost.require_valid_url_fragment(url)

    def _assert_valid_blog_post_id_for_blog_post(
        self, expected_error_substring: str, blog_id: str
    ) -> None:
        """Checks that blog post passes validation for id."""
        with self.assertRaisesRegex(
            utils.ValidationError, expected_error_substring):
            blog_domain.BlogPost.require_valid_blog_post_id(blog_id)

    def _assert_valid_thumbnail_update(
        self, expected_error_substring: str
    ) -> None:
        """Checks that blog post passes validation for thumbnail update."""
        with self.assertRaisesRegex(
            utils.ValidationError, expected_error_substring):
            self.blog_post.update_thumbnail_filename(
                self.blog_post.thumbnail_filename
            )

    def test_blog_post_id_validation_for_blog_post(self) -> None:
        self._assert_valid_blog_post_id_for_blog_post(
            'Blog ID abcdef is invalid', 'abcdef')

    def test_thumbnail_filename_validation_for_blog_post(self) -> None:
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

    def test_title_without_non_strict_validation(self) -> None:
        self._assert_valid_title_for_blog_post(
            'Blog Post title should at most have 65 chars, received: '
            'Very long title with more than sixty five chars and therefore an'
            ' invalid blog post title',
            'Very long title with more than sixty five chars and therefore an'
            ' invalid blog post title')

    def test_title_with_strict_validation(self) -> None:
        self._assert_strict_valid_title_for_blog_post(
            'Title should not be empty', '')
        self._assert_strict_valid_title_for_blog_post(
            'Title field contains invalid characters. Only words'
            r'\(a-zA-Z0-9\) separated by spaces, hyphens\(-\) and colon\(:\)'
            ' are allowed. Received %s' % 'ABC12& heloo', 'ABC12& heloo'
        )

    def _assert_strict_valid_tags_for_blog_post(
        self, expected_error_substring: str, tags: List[str]
    ) -> None:
        """Checks that the blog post tags passes validation."""
        with self.assertRaisesRegex(
            utils.ValidationError, expected_error_substring):
            blog_domain.BlogPost.require_valid_tags(tags, True)

    def test_tags_validation_in_strict_mode(self) -> None:
        self._assert_strict_valid_tags_for_blog_post(
            'Atleast one tag should be selected', [])

    def test_url_fragment_validation(self) -> None:
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

    def test_update_title(self) -> None:
        self.assertEqual(self.blog_post.title, '')
        self.blog_post.update_title('Blog Post Title')
        self.assertEqual(self.blog_post.title, 'Blog Post Title')

    def test_update_thumbnail(self) -> None:
        self.assertEqual(self.blog_post.thumbnail_filename, None)
        self.blog_post.update_thumbnail_filename('Thumbnail.svg')
        self.assertEqual(self.blog_post.thumbnail_filename, 'Thumbnail.svg')

    def test_update_url_fragment(self) -> None:
        current_url_fragment = ''
        self.assertEqual(self.blog_post.url_fragment, current_url_fragment)
        self.blog_post.update_url_fragment('url-fragment')
        self.assertEqual(self.blog_post.url_fragment, 'url-fragment')

    def test_update_tags(self) -> None:
        self.assertEqual(self.blog_post.tags, [])
        self.blog_post.update_tags(['tag'])
        self.assertEqual(self.blog_post.tags, ['tag'])

    def test_blog_post_contents_export_import(self) -> None:
        """Test that to_dict and from_dict preserve all data within a
        blog post contents object.
        """
        blog_post_contents_dict = self.blog_post.to_dict()
        blog_post_contents_from_dict = blog_domain.BlogPost.from_dict(
            blog_post_contents_dict)
        self.assertEqual(
            blog_post_contents_from_dict.to_dict(), blog_post_contents_dict)

    def test_update_content(self) -> None:
        self.assertEqual(self.blog_post.content, '')
        self.blog_post.update_content('<p>Hello</p>')
        self.assertEqual(self.blog_post.content, '<p>Hello</p>')

    def test_tags_validation_for_blog_post(self) -> None:
        """"Tests tags validation for blog post."""

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

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally
    # test wrong inputs that we can normally catch by typing.
    def test_blog_post_passes_validate(self) -> None:
        """Tests validation for blog post."""
        self.blog_post.validate(strict=False)
        self.blog_post.content = 123  # type: ignore[assignment]
        self._assert_validation_error(
            'Expected contents to be a string, received: 123')

    def test_blog_post_passes_strict_validation(self) -> None:
        """Tests strict validation for blog post."""
        self.blog_post.title = 'Sample Title'
        self.blog_post.thumbnail_filename = 'thumbnail.svg'
        self.blog_post.tags = ['tag']
        self.blog_post.url_fragment = 'sample-title'
        self._assert_strict_validation_error('Content can not be empty')

        self.blog_post.content = '<p>Hello</p>'
        self.blog_post.validate(strict=True)

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally
    # test wrong inputs that we can normally catch by typing.
    def test_thumbnail_passes_string_validation(self) -> None:
        self.blog_post.title = 'Sample Title'
        self.blog_post.thumbnail_filename = 123  # type: ignore[assignment]
        self.blog_post.tags = ['tag']
        self.blog_post.url_fragment = 'sample-title'
        self.blog_post.content = '<p>Hello</p>'
        self._assert_strict_validation_error(
            'Expected Thumbnail filename should be a string,'
            ' received 123')

        self.blog_post.thumbnail_filename = 'thumbnail.svg'
        self.blog_post.validate(strict=True)

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally
    # test wrong inputs that we can normally catch by typing.
    def test_thumbnail_filename_strict_validation_for_blog_post(self) -> None:
        self.blog_post.title = 'Sample Title'
        self.blog_post.thumbnail_filename = 123  # type: ignore[assignment]
        self.blog_post.tags = ['tag']
        self.blog_post.url_fragment = 'sample-url-fragment'
        self.blog_post.content = 'Sample content'
        self._assert_strict_valid_thumbnail_filename_for_blog_post(
            'Expected thumbnail filename to be a string, received: 123'
        )

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally
    # test wrong inputs that we can normally catch by typing.
    def test_blog_post_url_passes_strict_validation(self) -> None:
        self.blog_post.title = 'Sample Title'
        self.blog_post.thumbnail_filename = 'sample-thumbnail.png'
        self.blog_post.tags = ['tag']
        self.blog_post.url_fragment = 123  # type: ignore[assignment]
        self.blog_post.content = '<p>Hello</p>'
        self._assert_valid_url_fragment(
            'Blog Post URL Fragment field must be a string. '
            'Received 123.'
        )

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally
    # test wrong inputs that we can normally catch by typing.
    def test_valid_thumbnail_update(self) -> None:
        self.blog_post.title = 'Sample Title'
        self.blog_post.thumbnail_filename = 123  # type: ignore[assignment]
        self.blog_post.tags = ['tag']
        # TODO(#13059): Here we use MyPy ignore because after we fully type
        # the codebase we plan to get rid of the tests that intentionally
        # test wrong inputs that we can normally catch by typing.
        self.blog_post.url_fragment = 123  # type: ignore[assignment]
        self.blog_post.content = '<p>Hello</p>'
        self._assert_valid_thumbnail_update(
            'Expected image filename to be a string, received 123'
        )


class BlogPostRightsDomainUnitTests(test_utils.GenericTestBase):

    def setUp(self) -> None:
        super().setUp()
        self.signup('a@example.com', 'A')
        self.signup('b@example.com', 'B')

        self.user_id_a = self.get_user_id_from_email('a@example.com')
        self.user_id_b = self.get_user_id_from_email('b@example.com')

        blog_post = blog_services.create_new_blog_post(self.user_id_a)
        self.blog_post_id = blog_post.id
        self.blog_post_rights = (
            blog_services.get_blog_post_rights(self.blog_post_id))

    def test_is_editor(self) -> None:
        self.assertTrue(self.blog_post_rights.is_editor(self.user_id_a))
        self.assertFalse(self.blog_post_rights.is_editor(self.user_id_b))

    def test_to_human_readable_dict(self) -> None:
        """Checks conversion of BlogPostRights to dict."""
        expected_dict = {
            'blog_post_id': self.blog_post_id,
            'editor_ids': [self.user_id_a],
            'blog_post_is_published': False
        }
        self.assertEqual(self.blog_post_rights.to_dict(), expected_dict)


class BlogPostSummaryUnitTests(test_utils.GenericTestBase):

    def setUp(self) -> None:
        super().setUp()
        self.signup('a@example.com', 'A')
        self.user_id_a = self.get_user_id_from_email('a@example.com')
        blog_post = blog_services.create_new_blog_post(self.user_id_a)
        self.blog_post_id = blog_post.id
        self.blog_post_summary = (
            blog_services.get_blog_post_summary_by_id(self.blog_post_id))

    def _assert_valid_thumbnail_filename_for_blog_post(
        self,
        expected_error_substring: str,
        thumbnail_filename: str
    ) -> None:
        """Checks that blog post passes validation for thumbnail filename."""
        with self.assertRaisesRegex(
            utils.ValidationError, expected_error_substring):
            blog_domain.BlogPostSummary.require_valid_thumbnail_filename(
                thumbnail_filename, strict=False)

    def _assert_strict_valid_thumbnail_filename_for_blog_post(
        self, expected_error_substring: str
    ) -> None:
        """Checks that blog post passes validation for thumbnail filename."""
        with self.assertRaisesRegex(
            utils.ValidationError, expected_error_substring):
            # Ruling out the possibility of None for mypy type checking.
            assert self.blog_post_summary.thumbnail_filename is not None
            blog_domain.BlogPostSummary.require_valid_thumbnail_filename(
                self.blog_post_summary.thumbnail_filename, strict=True)

    def test_thumbnail_filename_validation_for_blog_post(self) -> None:
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

    def _assert_strict_valid_title_for_blog_post(
        self, expected_error_substring: str, title: str
    ) -> None:
        """Checks that blog post passes strict validation for title."""
        with self.assertRaisesRegex(
            utils.ValidationError, expected_error_substring):
            blog_domain.BlogPostSummary.require_valid_title(title, True)

    def _assert_valid_title_for_blog_post(
        self, expected_error_substring: str, title: str
    ) -> None:
        """Checks that blog post passes validation for title."""
        with self.assertRaisesRegex(
            utils.ValidationError, expected_error_substring):
            blog_domain.BlogPostSummary.require_valid_title(title, False)

    def _assert_valid_url_fragment_for_blog_post(
        self, expected_error_substring: str, url: str
    ) -> None:
        """Checks that blog post passes validation for url."""
        with self.assertRaisesRegex(
            utils.ValidationError, expected_error_substring):
            blog_domain.BlogPostSummary.require_valid_url_fragment(url)

    def _assert_url_fragment_passes_valid_url_fragment(
        self, expected_error_substring: str
    ) -> None:
        """Checks that blog post passes validation for url."""
        with self.assertRaisesRegex(
            utils.ValidationError, expected_error_substring):
            blog_domain.BlogPostSummary.require_valid_url_fragment(
                self.blog_post_summary.url_fragment)

    def _assert_title_passes_valid_title(
        self, expected_error_substring: str
    ) -> None:
        """Checks that blog post passes validation for title."""
        with self.assertRaisesRegex(
            utils.ValidationError, expected_error_substring):
            blog_domain.BlogPostSummary.require_valid_title(
                self.blog_post_summary.title, False)

    def _assert_valid_tag_elements(
        self, expected_error_substring: str
    ) -> None:
        """Checks that blog post passes validation for tags."""
        with self.assertRaisesRegex(
            utils.ValidationError, expected_error_substring):
            blog_domain.BlogPostSummary.require_valid_tags(
                self.blog_post_summary.tags, False)

    def _assert_valid_tags_for_blog_post(
        self, expected_error_substring: str, tags: List[str]
    ) -> None:
        """Checks that the blog post tags passes validation."""
        with self.assertRaisesRegex(
            utils.ValidationError, expected_error_substring):
            blog_domain.BlogPostSummary.require_valid_tags(tags, False)

    def _assert_strict_valid_tags_for_blog_post(
        self, expected_error_substring: str, tags: List[str]
    ) -> None:
        """Checks that the blog post tags passes validation."""
        with self.assertRaisesRegex(
            utils.ValidationError, expected_error_substring):
            blog_domain.BlogPostSummary.require_valid_tags(tags, True)

    def test_title_validation(self) -> None:
        self._assert_valid_title_for_blog_post(
            'blog post title should at most have 65 chars, received: '
            'Very long title with more than sixty five chars and therefore an'
            ' invalid blog post title',
            'Very long title with more than sixty five chars and therefore an'
            ' invalid blog post title')
        self._assert_strict_valid_title_for_blog_post(
            'Title should not be empty', '')

    def test_url_fragment_validation(self) -> None:
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

    def _assert_strict_validation_error(
        self, expected_error_substring: str
    ) -> None:
        """Checks that the blog post passes strict validation."""
        with self.assertRaisesRegex(
            utils.ValidationError, expected_error_substring):
            self.blog_post_summary.validate(strict=True)

    # Here we use MyPy ignore because the signature of this method
    # doesn't match with TestBase._assert_validation_error().
    def _assert_validation_error( # type: ignore[override]
        self, expected_error_substring: str
    ) -> None:
        """Checks that the blog post passes validation."""
        with self.assertRaisesRegex(
            utils.ValidationError, expected_error_substring):
            self.blog_post_summary.validate()

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally
    # test wrong inputs that we can normally catch by typing.
    def test_blog_post_url_fragment_passes_strict_validation(self) -> None:
        self.blog_post_summary.title = 'Sample Title'
        self.blog_post_summary.thumbnail_filename = 'sample-thumbnail.png'
        self.blog_post_summary.tags = ['tag']
        self.blog_post_summary.url_fragment = 123  # type: ignore[assignment]
        self.blog_post_summary.summary = 'Sample Summary'
        self._assert_strict_validation_error(
            'Expected url fragment to be a string, received: 123')

        self.blog_post_summary.url_fragment = 'sample-url-fragment'
        self.blog_post_summary.validate(strict=True)

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally
    # test wrong inputs that we can normally catch by typing.
    def test_blog_post_thumbnail_passes_strict_validation(self) -> None:
        self.blog_post_summary.title = 'Sample Title'
        self.blog_post_summary.thumbnail_filename = 123  # type: ignore[assignment]
        self.blog_post_summary.tags = ['tag']
        self.blog_post_summary.url_fragment = 'sample-url-fragment'
        self.blog_post_summary.summary = 'Sample Summary'
        self._assert_strict_validation_error(
            'Expected thumbnail filename to be a string, received: 123')

        self.blog_post_summary.thumbnail_filename = 'sample-thumbnail.png'
        self.blog_post_summary.validate(strict=True)

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally
    # test wrong inputs that we can normally catch by typing.
    def test_blog_post_summary_passes_validate(self) -> None:
        """Tests validation for blog post summary."""
        self.blog_post_summary.validate(strict=False)
        self.blog_post_summary.summary = 123  # type: ignore[assignment]
        self._assert_validation_error(
            'Expected summary to be a string, received: 123')

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally
    # test wrong inputs that we can normally catch by typing.
    def test_blog_post_passes_valid_thumbnail_filename(self) -> None:
        """Tests validation for blog post thumbnail."""
        self.blog_post_summary.thumbnail_filename = 123  # type: ignore[assignment]
        self._assert_strict_valid_thumbnail_filename_for_blog_post(
            'Expected thumbnail filename to be a string, received: 123')

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally
    # test wrong inputs that we can normally catch by typing.
    def test_blog_post_passes_valid_url_fragment(self) -> None:
        self.blog_post_summary.url_fragment = 123  # type: ignore[assignment]
        self._assert_url_fragment_passes_valid_url_fragment(
            'Blog Post URL Fragment field must be a string. '
            'Received 123')

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally
    # test wrong inputs that we can normally catch by typing.
    def test_blog_post_passes_valid_title(self) -> None:
        self.blog_post_summary.title = 123  # type: ignore[assignment]
        self._assert_title_passes_valid_title(
            'Expected title to be a string, received: 123.')

    def test_blog_post_summary_passes_strict_validation(self) -> None:
        """Tests blog post summary passes validation in strict mode."""
        self.blog_post_summary.title = 'Sample Title'
        self.blog_post_summary.thumbnail_filename = 'thumbnail.svg'
        self.blog_post_summary.tags = ['tag']
        self.blog_post_summary.summary = ''
        self.blog_post_summary.url_fragment = 'sample-title'
        self._assert_strict_validation_error('Summary can not be empty')

        self.blog_post_summary.summary = 'Hello'
        self.blog_post_summary.validate(strict=True)

    def test_tags_validation_for_blog_post(self) -> None:
        """"Tests tags validation for blog post."""
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

    def test_tags_validation_in_strict_mode(self) -> None:
        self._assert_strict_valid_tags_for_blog_post(
            'Atleast one tag should be selected', [])

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally
    # test wrong inputs that we can normally catch by typing.
    def test_blog_post_tags_passes_validation(self) -> None:
        self.blog_post_summary.tags = ['tag', 123]  # type: ignore[list-item]
        self._assert_valid_tag_elements(
            'Expected each tag in \'tags\' to be a string, received: '
            '\'123\'')


class BlogAuthorDetailsTests(test_utils.GenericTestBase):
    """Tests for blog author details domain objects."""

    def setUp(self) -> None:
        super().setUp()
        self.signup('a@example.com', 'A')
        self.user_id_a = self.get_user_id_from_email('a@example.com')

        blog_models.BlogAuthorDetailsModel.create(
            self.user_id_a, 'author', 'general bio')
        self.author_details = blog_services.get_blog_author_details(
            self.user_id_a)

    def _assert_valid_displayed_author_name(
        self, expected_error_substring: str, author_name: str
    ) -> None:
        """Checks that author name passes validation."""
        with self.assertRaisesRegex(
            utils.ValidationError, expected_error_substring):
            blog_domain.BlogAuthorDetails.require_valid_displayed_author_name(
                author_name
            )

    def test_author_username_validation_for_author_details(self) -> None:
        self._assert_valid_displayed_author_name(
            'Empty author name supplied.', '')
        self._assert_valid_displayed_author_name(
            'A author name can have at most 35 characters.', 'user' * 10)
        self._assert_valid_displayed_author_name(
            'Author name can only have alphanumeric characters and spaces.',
            'name..name'
        )
        self._assert_valid_displayed_author_name(
            'Author name can only have alphanumeric characters and spaces.',
            'ABC12&heloo'
        )
        self._assert_valid_displayed_author_name(
            'This name contains reserved username. Please use some ' +
            'other name', 'name admin')

        blog_domain.BlogAuthorDetails.require_valid_displayed_author_name(
            'test username')

    def test_to_human_readable_dict(self) -> None:
        """Checks conversion of BlogAuthorDetails to dict."""
        assert self.author_details is not None
        expected_dict = {
            'displayed_author_name': self.author_details.displayed_author_name,
            'author_bio': self.author_details.author_bio,
            'last_updated': utils.convert_naive_datetime_to_string(
                self.author_details.last_updated)
        }
        self.assertEqual(self.author_details.to_dict(), expected_dict)

    def test_author_details_model_passes_validation(self) -> None:
        """Tests validation for author details model."""
        assert self.author_details is not None
        self.author_details.displayed_author_name = 'Sample Name'
        self.author_details.author_bio = ''

        self.author_details.validate()

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally
    # test wrong inputs that we can normally catch by typing.
    def test_author_details_model_raises_error_for_invalid_bio(self) -> None:
        """Tests validation for author details model."""
        assert self.author_details is not None
        self.author_details.displayed_author_name = 'Sample Name'
        self.author_details.author_bio = 123 # type: ignore[assignment]
        with self.assertRaisesRegex(
            utils.ValidationError, 'Expected Author Bio to be a string,'
            ' received %s' % self.author_details.author_bio):
            self.author_details.validate()
