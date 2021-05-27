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

"""Tests for Blog Post models."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime
import types

from core.platform import models
from core.tests import test_utils

(base_models, blog_post_models, user_models) = models.Registry.import_models(
    [models.NAMES.base_model, models.NAMES.blog, models.NAMES.user])


class BlogPostModelTest(test_utils.GenericTestBase):
    """Tests for the BlogPostModel class."""

    NONEXISTENT_USER_ID = 'id_x'
    USER_ID = 'user_1'
    CONTENT = 'Dummy Content'
    TITLE = 'Dummy Title'
    TAGS = 'tag1 tag2 tag3'
    THUMBNAIL = 'xyzabc'

    def setUp(self):
        """Set up user models in datastore for use in testing."""
        super(BlogPostModelTest, self).setUp()

        self.blog_post_model = blog_post_models.BlogPostModel(
            id='%s.%s' % (self.USER_ID, 'random'),
            author_id=self.USER_ID,
            content=self.CONTENT,
            title=self.TITLE,
            last_updated=datetime.datetime.utcnow(),
            published_on=datetime.datetime.utcnow(),
            url_fragment='sample-url-fragment',
            tags=self.TAGS,
            thumbnail_filename=self.THUMBNAIL
        )
        self.blog_post_model.update_timestamps()
        self.blog_post_model.put()

    def test_get_deletion_policy(self):
        self.assertEqual(
            blog_post_models.BlogPostModel.get_deletion_policy(),
            base_models.DELETION_POLICY.LOCALLY_PSEUDONYMIZE)

    def test_has_reference_to_user_id(self):
        self.assertTrue(
            blog_post_models.BlogPostModel
            .has_reference_to_user_id(self.USER_ID))
        self.assertFalse(
            blog_post_models.BlogPostModel
            .has_reference_to_user_id(self.NONEXISTENT_USER_ID))

    def test_raise_exception_by_mocking_collision(self):
        blog_post_model_cls = blog_post_models.BlogPostModel

        # Test create method.
        with self.assertRaisesRegexp(
            Exception, 'A blog with the given blog ID exists already.'):
            # Swap dependent method get_by_id to simulate collision every time.
            with self.swap(
                blog_post_model_cls, 'get_by_id',
                types.MethodType(
                    lambda x, y: True,
                    blog_post_model_cls)):
                blog_post_model_cls.create(
                    'author_id.blog_id')

        # Test generate_new_thread_id method.
        with self.assertRaisesRegexp(
            Exception,
            'New blog id generator is producing too many collisions.'):
            # Swap dependent method get_by_id to simulate collision every time.
            with self.swap(
                blog_post_model_cls, 'get_by_id',
                types.MethodType(
                    lambda x, y: True,
                    blog_post_model_cls)):
                blog_post_model_cls.generate_new_blog_id(
                    self.USER_ID)

    def test_get_by_url_fragment(self):
        self.assertEqual(
            blog_post_models.BlogPostModel.get_by_url_fragment(
                'sample-url-fragment'),
            self.blog_post_model
        )


class BlogPostSummaryModelTest(test_utils.GenericTestBase):
    """Tests for the BlogPostSummaryModel class."""

    NONEXISTENT_USER_ID = 'id_x'
    USER_ID = 'user_1'
    SUMMARY = 'Dummy Summary'
    TITLE = 'Dummy Title'
    TAGS = 'tag1 tag2 tag3'
    THUMBNAIL = 'xyzabc'

    def setUp(self):
        """Set up models in datastore for use in testing."""
        super(BlogPostSummaryModelTest, self).setUp()

        self.blog_post_summary_model = blog_post_models.BlogPostSummaryModel(
            id='%s.%s' % (self.USER_ID, 'random'),
            author_id=self.USER_ID,
            summary=self.SUMMARY,
            title=self.TITLE,
            last_updated=datetime.datetime.utcnow(),
            published_on=datetime.datetime.utcnow(),
            url_fragment='sample-url-fragment',
            tags=self.TAGS,
            thumbnail_filename=self.THUMBNAIL
        )
        self.blog_post_summary_model.update_timestamps()
        self.blog_post_summary_model.put()

    def test_get_deletion_policy(self):
        self.assertEqual(
            blog_post_models.BlogPostSummaryModel.get_deletion_policy(),
            base_models.DELETION_POLICY.LOCALLY_PSEUDONYMIZE)

    def test_has_reference_to_user_id(self):
        self.assertTrue(
            blog_post_models.BlogPostSummaryModel
            .has_reference_to_user_id(self.USER_ID))
        self.assertFalse(
            blog_post_models.BlogPostSummaryModel
            .has_reference_to_user_id(self.NONEXISTENT_USER_ID))

    def test_raise_exception_by_mocking_collision(self):
        blog_post_summary_model_cls = blog_post_models.BlogPostSummaryModel

        # Test create method.
        with self.assertRaisesRegexp(
            Exception, 'Blog ID conflict on creating new blog summary model.'):
            # Swap dependent method get_by_id to simulate collision every time.
            with self.swap(
                blog_post_summary_model_cls, 'get_by_id',
                types.MethodType(
                    lambda x, y: True,
                    blog_post_summary_model_cls)):
                blog_post_summary_model_cls.create(
                    'author_id.blog_id')


class BlogPostRightsModelTest(test_utils.GenericTestBase):
    """Tests for the BlogPostRightsModel class."""

    NONEXISTENT_USER_ID = 'id_x'
    USER_ID = 'user_1'
    USER_ID_NEW = 'user_2'
    USER_ID_OLD = 'user_3'
    BLOG_ID_NEW = 'blog_id'
    BLOG_ID_OLD = 'blog_old_id'

    def setUp(self):
        super(BlogPostRightsModelTest, self).setUp()
        self.blog_post_rights_model = blog_post_models.BlogPostRightsModel(
            id=self.BLOG_ID_NEW,
            editor_ids=[self.USER_ID_NEW],
            blog_is_published=True,
        )
        self.blog_post_rights_model.update_timestamps()
        self.blog_post_rights_model.put()

        self.blog_post_rights_model_new = blog_post_models.BlogPostRightsModel(
            id=self.BLOG_ID_OLD,
            editor_ids=[self.USER_ID_OLD, self.USER_ID_NEW, self.USER_ID],
            blog_is_published=False,
        )
        self.blog_post_rights_model_new.update_timestamps()
        self.blog_post_rights_model_new.put()

    def test_get_deletion_policy(self):
        self.assertEqual(
            blog_post_models.BlogPostRightsModel.get_deletion_policy(),
            base_models.DELETION_POLICY.LOCALLY_PSEUDONYMIZE)

    def test_has_reference_to_user_id(self):
        self.assertTrue(
            blog_post_models.BlogPostRightsModel
            .has_reference_to_user_id(self.USER_ID))
        self.assertTrue(
            blog_post_models.BlogPostRightsModel
            .has_reference_to_user_id(self.USER_ID_NEW))
        self.assertFalse(
            blog_post_models.BlogPostRightsModel
            .has_reference_to_user_id(self.NONEXISTENT_USER_ID))

    def test_get_by_user(self):
        self.assertEqual(
            blog_post_models.BlogPostRightsModel.get_by_user(self.USER_ID_NEW),
            [self.blog_post_rights_model, self.blog_post_rights_model_new])
        self.assertEqual(
            blog_post_models.BlogPostRightsModel.get_by_user(self.USER_ID),
            [self.blog_post_rights_model_new])
