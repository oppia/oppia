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

"""Domain objects relating to blogs."""

from __future__ import absolute_import
from __future__ import unicode_literals

import re

from constants import constants
from core.domain import html_cleaner

import python_utils
import utils

# This is same as base_models.ID_Length.
BLOG_POST_ID_LENGTH = 12


class BlogPost(python_utils.OBJECT):
    """Domain object for an Oppia Blog Post."""

    def __init__(
            self, blog_post_id, author_id, title, content, url_fragment, tags,
            thumbnail_filename=None, last_updated=None, published_on=None):
        """Constructs a BlogPost domain object.

        Args:
            blog_post_id: str. The unique ID of the blog post.
            author_id: str. The user ID of the author.
            title: str. The title of the blog post.
            content: str. The html content of the blog post.
            url_fragment: str. The url fragment for the blog post.
            tags: list(str). The list of tags for the blog post.
            thumbnail_filename: str|None. The thumbnail filename of blog post .
            last_updated: datetime.datetime. Date and time when the blog post
                was last updated.
            published_on: datetime.datetime. Date and time when the blog post is
                last published.
        """
        self.id = blog_post_id
        self.author_id = author_id
        self.title = title
        self.content = html_cleaner.clean(content)
        self.url_fragment = url_fragment
        self.tags = tags
        self.thumbnail_filename = thumbnail_filename
        self.last_updated = last_updated
        self.published_on = published_on

    @classmethod
    def require_valid_thumbnail_filename(cls, thumbnail_filename, strict=False):
        """Checks whether the thumbnail filename of the blog post is a valid
        one.

        Args:
            thumbnail_filename: str. The thumbnail filename to validate.
            strict: bool. Enable strict checks on the blog post when the
                blog post is published or is going to be published.

        Raises:
            ValidationError. Provided thumbnail filename is invalid.
        """
        if strict:
            if not isinstance(thumbnail_filename, python_utils.BASESTRING):
                raise utils.ValidationError(
                    'Expected thumbnail filename to be a string, received: %s.'
                    % thumbnail_filename)

        if thumbnail_filename == '':
            raise utils.ValidationError(
                'Thumbnail filename should not be empty.')

        utils.require_valid_image_filename(thumbnail_filename)

    def validate(self, strict=False):
        """Validates various properties of the blog post object.

        Args:
            strict: bool. Enable strict checks on the blog post when the blog
                post is published or is going to be published.

        Raises:
            ValidationError. One or more attributes of blog post are invalid.
        """
        self.require_valid_title(self.title, strict)
        self.require_valid_tags(self.tags, strict)
        self.require_valid_thumbnail_filename(
            self.thumbnail_filename, strict=strict)

        if not isinstance(self.content, python_utils.BASESTRING):
            raise utils.ValidationError(
                'Expected contents to be a string, received: %s' % self.content)

        if strict:
            self.require_valid_url_fragment(self.url_fragment)
            if not self.content:
                raise utils.ValidationError('Content can not be empty')

    @classmethod
    def require_valid_tags(cls, tags, strict):
        """Validates tags for the blog post object.

        Args:
            tags: list(str). The list of tags assigned to a blog post.
            strict: bool. Enable strict checks on the blog post when the blog
                post is published or is going to be published.

        Raises:
            ValidationErrors. One or more tags provided are invalid.
        """
        if not isinstance(tags, list):
            raise utils.ValidationError(
                'Expected \'tags\' to be a list, received: %s' % tags)

        for tag in tags:
            if not isinstance(tag, python_utils.BASESTRING):
                raise utils.ValidationError(
                    'Expected each tag in \'tags\' to be a string, received: '
                    '\'%s\'' % tag)

            if not tag:
                raise utils.ValidationError(
                    'Tag should not be empty.')

            if not re.match(constants.BLOG_POST_TAG_REGEX, tag):
                raise utils.ValidationError(
                    'Tags should only contain alphanumeric characters '
                    'and spaces, received: \'%s\'' % tag)

            if not re.match(r'^[^\s]+(\s+[^\s]+)*$', tag):
                raise utils.ValidationError(
                    'Tags should not start or end with whitespace, received: '
                    '\'%s\'' % tag)

            if re.search(r'\s\s+', tag):
                raise utils.ValidationError(
                    'Adjacent whitespace in tags should be collapsed, '
                    'received: \'%s\'' % tag)

        if strict:
            if not tags:
                raise utils.ValidationError(
                    'Atleast one tag should be selected')

        if len(set(tags)) != len(tags):
            raise utils.ValidationError(
                'Some tags duplicate each other')

    @classmethod
    def require_valid_title(cls, title, strict):
        """Checks whether the blog post title is a valid one.

        Args:
            title: str. The title to validate.
            strict: bool. Enable strict checks on the blog post when the blog
                post is published or is going to be published.

        Raises:
            ValidationErrors. Title provided is invalid.
        """
        if not isinstance(title, python_utils.BASESTRING):
            raise utils.ValidationError('Title should be a string.')

        if len(title) > constants.MAX_CHARS_IN_BLOG_POST_TITLE:
            raise utils.ValidationError(
                'Blog Post title should at most have %d chars, received: %s'
                % (constants.MAX_CHARS_IN_BLOG_POST_TITLE, title))

        if strict:
            if not title:
                raise utils.ValidationError('Title should not be empty')
            if not re.match(constants.VALID_BLOG_POST_TITLE_REGEX, title):
                raise utils.ValidationError(
                    'Title field contains invalid characters. Only words'
                    '(a-zA-Z0-9) separated by spaces are allowed. Received %s'
                    % title)

    @classmethod
    def require_valid_url_fragment(cls, url_fragment):
        """Checks whether the url fragment of the blog post is a valid one.

        Args:
            url_fragment: str. The url fragment to validate.

        Raises:
            ValidationErrors. URL fragment provided is invalid.
        """
        if not isinstance(url_fragment, python_utils.BASESTRING):
            raise utils.ValidationError(
                'Blog Post URL Fragment field must be a string. '
                'Received %s.' % (url_fragment))
        if not url_fragment:
            raise utils.ValidationError(
                'Blog Post URL Fragment field should not be empty.')

        if len(url_fragment) > constants.MAX_CHARS_IN_BLOG_POST_URL_FRAGMENT:
            raise utils.ValidationError(
                'Blog Post URL Fragment field should not exceed %d characters.'
                % (constants.MAX_CHARS_IN_BLOG_POST_URL_FRAGMENT))

        if not re.match(constants.VALID_URL_BLOG_FRAGMENT_REGEX, url_fragment):
            raise utils.ValidationError(
                'Blog Post URL Fragment field contains invalid characters.'
                'Only lowercase words, numbers separated by hyphens are'
                ' allowed. Received %s.' % (url_fragment))

    def to_dict(self):
        """Returns a dict representing this blog post domain object.

        Returns:
            dict. A dict, mapping all fields of blog post instance.
        """
        published_on = utils.convert_naive_datetime_to_string(
            self.published_on) if self.published_on else None
        last_updated = utils.convert_naive_datetime_to_string(
            self.last_updated) if self.last_updated else None
        return {
            'id': self.id,
            'author_id': self.author_id,
            'title': self.title,
            'content': self.content,
            'thumbnail_filename': self.thumbnail_filename,
            'tags': self.tags,
            'url_fragment': self.url_fragment,
            'published_on': published_on,
            'last_updated': last_updated
        }

    @classmethod
    def from_dict(cls, blog_post_dict):
        """Returns a blog post domain object from a dictionary.

        Args:
            blog_post_dict: dict. The dictionary representation of blog post
                object.

        Returns:
            BlogPost. The corresponding blog post domain object.
        """

        last_updated = (
            utils.convert_string_to_naive_datetime_object(
                blog_post_dict['last_updated'])
            if blog_post_dict['last_updated'] else None)
        published_on = (
            utils.convert_string_to_naive_datetime_object(
                blog_post_dict['published_on'])
            if blog_post_dict['published_on'] else None)
        blog_post = cls(
            blog_post_dict['id'], blog_post_dict['author_id'],
            blog_post_dict['title'], blog_post_dict['content'],
            blog_post_dict['url_fragment'], blog_post_dict['tags'],
            blog_post_dict['thumbnail_filename'],
            last_updated,
            published_on)

        return blog_post

    def update_title(self, new_title):
        """Updates the title of a blog post object.

        Args:
            new_title: str. The updated title for the blog post.
        """
        self.require_valid_title(new_title, True)
        self.title = new_title

    def update_url_fragment(self, new_url_fragment):
        """Updates the url_fragment of a blog post object.

        Args:
            new_url_fragment: str. The updated url fragment for the blog post.
        """
        self.require_valid_url_fragment(new_url_fragment)
        self.url_fragment = new_url_fragment

    def update_thumbnail_filename(self, new_thumbnail_filename):
        """Updates the thumbnail filename of a blog post object.

        Args:
            new_thumbnail_filename: str|None. The updated thumbnail filename
                for the blog post.
        """
        self.require_valid_thumbnail_filename(self.thumbnail_filename)
        self.thumbnail_filename = new_thumbnail_filename

    def update_content(self, content):
        """Updates the content of the blog post.

        Args:
            content: str. The new content of the blog post.
        """
        self.content = html_cleaner.clean(content)

    def update_tags(self, tags):
        """Updates the tags list of the blog post.

        Args:
            tags: list(str). New list of tags for the blog post.
        """
        self.require_valid_tags(tags, False)
        self.tags = tags

    @classmethod
    def require_valid_blog_post_id(cls, blog_id):
        """Checks whether the blog id is a valid one.

        Args:
            blog_id: str. The blog post id to validate.
        """
        if not isinstance(blog_id, python_utils.BASESTRING):
            raise utils.ValidationError(
                'Blog Post ID should be a string, received: %s' % blog_id)

        if len(blog_id) != BLOG_POST_ID_LENGTH:
            raise utils.ValidationError('Blog ID %s is invalid' % blog_id)


class BlogPostSummary(python_utils.OBJECT):
    """Domain object for Blog Post Summary."""

    def __init__(
            self, blog_post_id, author_id, title, summary, url_fragment, tags,
            thumbnail_filename=None, last_updated=None, published_on=None):
        """Constructs a Blog Post Summary domain object.

        Args:
            blog_post_id: str. The unique ID of the blog post.
            author_id: str. The user ID of the author.
            title: str. The title of the blog post.
            summary: str. The summary content of the blog post.
            url_fragment: str. The url fragment for the blog post.
            tags: list(str). The list of tags for the blog post.
            thumbnail_filename: str|None. The thumbnail filename of the blog
                post.
            last_updated: datetime.datetime. Date and time when the blog post
                was last updated.
            published_on: datetime.datetime. Date and time when the blog post
                is last published.
        """
        self.id = blog_post_id
        self.author_id = author_id
        self.title = title
        self.summary = summary
        self.tags = tags
        self.url_fragment = url_fragment
        self.thumbnail_filename = thumbnail_filename
        self.last_updated = last_updated
        self.published_on = published_on

    @classmethod
    def require_valid_thumbnail_filename(cls, thumbnail_filename, strict=False):
        """Checks whether the thumbnail filename of the blog post is a valid
        one.

        Args:
            thumbnail_filename: str. The thumbnail filename to validate.
            strict: bool. Enable strict checks on the blog post summary when the
                blog post is published or is going to be published.

        Raises:
            ValidationErrors. Thumbnail filename provided is invalid.
        """
        if strict:
            if not isinstance(thumbnail_filename, python_utils.BASESTRING):
                raise utils.ValidationError(
                    'Expected thumbnail filename to be a string, received: %s.'
                    % thumbnail_filename)

        if thumbnail_filename == '':
            raise utils.ValidationError(
                'Thumbnail filename should not be empty')

        utils.require_valid_image_filename(thumbnail_filename)

    def validate(self, strict=False):
        """Validates various properties of the blog post summary object.

        Args:
            strict: bool. Enable strict checks on the blog post summary when the
                blog post is published or is going to be published.

        Raises:
            ValidationError. One or more attributes of blog post are invalid.
        """
        self.require_valid_title(self.title, strict)
        self.require_valid_tags(self.tags, strict)
        self.require_valid_thumbnail_filename(
            self.thumbnail_filename, strict=strict)

        if not isinstance(self.summary, python_utils.BASESTRING):
            raise utils.ValidationError(
                'Expected summary to be a string, received: %s' % self.summary)

        if strict:
            self.require_valid_url_fragment(self.url_fragment)
            if not self.summary:
                raise utils.ValidationError('Summary can not be empty')

    @classmethod
    def require_valid_url_fragment(cls, url_fragment):
        """Checks whether the url fragment of the blog post is a valid one.

        Args:
            url_fragment: str. The url fragment to validate.

        Raises:
            ValidationErrors. URL fragment provided is invalid.
        """
        if not isinstance(url_fragment, python_utils.BASESTRING):
            raise utils.ValidationError(
                'Blog Post URL Fragment field must be a string. '
                'Received %s.' % (url_fragment))

        if not url_fragment:
            raise utils.ValidationError(
                'Blog Post URL Fragment field should not be empty.')

        if len(url_fragment) > constants.MAX_CHARS_IN_BLOG_POST_URL_FRAGMENT:
            raise utils.ValidationError(
                'Blog Post URL Fragment field should not exceed %d characters.'
                % (constants.MAX_CHARS_IN_BLOG_POST_URL_FRAGMENT))

        if not re.match(constants.VALID_URL_BLOG_FRAGMENT_REGEX, url_fragment):
            raise utils.ValidationError(
                'Blog Post URL Fragment field contains invalid characters.'
                'Only lowercase words, numbers separated by hyphens are'
                ' allowed. Received %s.' % (url_fragment))

    @classmethod
    def require_valid_title(cls, title, strict):
        """Checks whether the blog post title is a valid one.

        Args:
            title: str. The title to validate.
            strict: bool. Enable strict checks on the blog post summary when the
                blog post is published or is going to be published.

        Raises:
            ValidationErrors. Title provided is invalid.
        """
        if not isinstance(title, python_utils.BASESTRING):
            raise utils.ValidationError('Title should be a string.')

        if len(title) > constants.MAX_CHARS_IN_BLOG_POST_TITLE:
            raise utils.ValidationError(
                'blog post title should at most have %d chars, received: %s'
                % (constants.MAX_CHARS_IN_BLOG_POST_TITLE, title))

        if strict:
            if not title:
                raise utils.ValidationError('Title should not be empty')

    @classmethod
    def require_valid_tags(cls, tags, strict):
        """Validates tags for the blog post object.

        Args:
            tags: list(str). The list of tags assigned to a blog post.
            strict: bool. Enable strict checks on the blog post when the blog
                post is published or is going to be published.

        Raises:
            ValidationErrors.One or more tags provided are invalid.
        """
        if not isinstance(tags, list):
            raise utils.ValidationError(
                'Expected \'tags\' to be a list, received: %s' % tags)
        for tag in tags:
            if not isinstance(tag, python_utils.BASESTRING):
                raise utils.ValidationError(
                    'Expected each tag in \'tags\' to be a string, received: '
                    '\'%s\'' % tag)

            if not tag:
                raise utils.ValidationError(
                    'Tag should not be empty.')

            if not re.match(constants.BLOG_POST_TAG_REGEX, tag):
                raise utils.ValidationError(
                    'Tags should only contain alphanumeric characters '
                    'and spaces, received: \'%s\'' % tag)

            if not re.match(r'^[^\s]+(\s+[^\s]+)*$', tag):
                raise utils.ValidationError(
                    'Tags should not start or end with whitespace, received: '
                    '\'%s\'' % tag)

            if re.search(r'\s\s+', tag):
                raise utils.ValidationError(
                    'Adjacent whitespace in tags should be collapsed, '
                    'received: \'%s\'' % tag)

        if strict:
            if not tags:
                raise utils.ValidationError(
                    'Atleast one tag should be selected')

        if len(set(tags)) != len(tags):
            raise utils.ValidationError('Some tags duplicate each other')

    def to_dict(self):
        """Returns a dict representing this blog post summary domain object.

        Returns:
            dict. A dict, mapping all fields of blog post instance.
        """
        published_on = utils.convert_naive_datetime_to_string(
            self.published_on) if self.published_on else None
        last_updated = utils.convert_naive_datetime_to_string(
            self.last_updated) if self.last_updated else None
        return {
            'id': self.id,
            'author_id': self.author_id,
            'title': self.title,
            'summary': self.summary,
            'thumbnail_filename': self.thumbnail_filename,
            'tags': self.tags,
            'url_fragment': self.url_fragment,
            'published_on': published_on,
            'last_updated': last_updated
        }


class BlogPostRights(python_utils.OBJECT):
    """Domain object for Blog Post rights."""

    def __init__(self, blog_post_id, editor_ids, blog_post_is_published=False):
        """Constructs a BlogPostRights domain object.

        Args:
            blog_post_id: str. The id of the blog post.
            editor_ids: list(str). The id of the users who have been assigned
                as editors for the blog post.
            blog_post_is_published: bool. Whether the blog is published or not.
        """
        self.id = blog_post_id
        self.editor_ids = editor_ids
        self.blog_post_is_published = blog_post_is_published

    def to_dict(self):
        """Returns a dict suitable for use by the frontend.

        Returns:
            dict. A dict version of BlogPostRights suitable for use by the
            frontend.
        """
        return {
            'blog_post_id': self.id,
            'editor_ids': self.editor_ids,
            'blog_post_is_published': self.blog_post_is_published
        }

    def is_editor(self, user_id):
        """Checks whether given user is an editor of the blog post.

        Args:
            user_id: str or None. ID of the user.

        Returns:
            bool. Whether user is an editor of the blog post.
        """
        return bool(user_id in self.editor_ids)
