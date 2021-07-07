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
import utils

(base_models, blog_models, user_models) = models.Registry.import_models(
    [models.NAMES.base_model, models.NAMES.blog, models.NAMES.user])


class BlogPostModelTest(test_utils.GenericTestBase):
    """Tests for the BlogPostModel class."""

    NONEXISTENT_USER_ID = 'id_x'
    USER_ID = 'user_1'
    CONTENT = 'Dummy Content'
    TITLE = 'Dummy Title'
    TAGS = ['tag1', 'tag2', 'tag3']
    THUMBNAIL = 'xyzabc'

    def setUp(self):
        """Set up blog post models in datastore for use in testing."""
        super(BlogPostModelTest, self).setUp()

        self.blog_post_model = blog_models.BlogPostModel(
            id='blog_one',
            author_id=self.USER_ID,
            content=self.CONTENT,
            title=self.TITLE,
            published_on=datetime.datetime.utcnow(),
            url_fragment='sample-url-fragment',
            tags=self.TAGS,
            thumbnail_filename=self.THUMBNAIL
        )
        self.blog_post_model.update_timestamps()
        self.blog_post_model.put()

    def test_get_deletion_policy(self):
        self.assertEqual(
            blog_models.BlogPostModel.get_deletion_policy(),
            base_models.DELETION_POLICY.LOCALLY_PSEUDONYMIZE)

    def test_has_reference_to_user_id(self):
        self.assertTrue(
            blog_models.BlogPostModel
            .has_reference_to_user_id(self.USER_ID))
        self.assertFalse(
            blog_models.BlogPostModel
            .has_reference_to_user_id(self.NONEXISTENT_USER_ID))

    def test_raise_exception_by_mocking_collision(self):
        """Tests create and generate_new_blog_post_id methods for raising
        exception.
        """
        blog_post_model_cls = blog_models.BlogPostModel

        # Test create method.
        with self.assertRaisesRegexp(
            Exception, 'A blog post with the given blog post ID exists'
            ' already.'):

            # Swap dependent method get_by_id to simulate collision every time.
            with self.swap(
                blog_post_model_cls, 'get_by_id',
                types.MethodType(
                    lambda x, y: True,
                    blog_post_model_cls)):
                blog_post_model_cls.create(
                    'blog_post_id', self.USER_ID)

        # Test generate_new_blog_post_id method.
        with self.assertRaisesRegexp(
            Exception,
            'New blog post id generator is producing too many collisions.'):
            # Swap dependent method get_by_id to simulate collision every time.
            with self.swap(
                blog_post_model_cls, 'get_by_id',
                types.MethodType(
                    lambda x, y: True,
                    blog_post_model_cls)):
                blog_post_model_cls.generate_new_blog_post_id()

    def test_get_by_url_fragment(self):
        self.assertEqual(
            blog_models.BlogPostModel.get_by_url_fragment(
                'sample-url-fragment'),
            self.blog_post_model
        )

    def test_creating_new_blog_post_model_instance(self):
        blog_post_model_id = (
            blog_models.BlogPostModel.generate_new_blog_post_id())
        blog_post_model_instance = (
            blog_models.BlogPostModel.create(
                blog_post_model_id, self.USER_ID))
        self.assertEqual(blog_post_model_instance.id, blog_post_model_id)
        self.assertEqual(blog_post_model_instance.author_id, self.USER_ID)

    def test_export_data_trivial(self):
        user_data = blog_models.BlogPostModel.export_data(
            self.NONEXISTENT_USER_ID
        )
        test_data = {}
        self.assertEqual(user_data, test_data)

    def test_export_data_nontrivial(self):
        user_data = blog_models.BlogPostModel.export_data(
            self.USER_ID),
        blog_post_id = 'blog_one'
        test_data = (
            {
                blog_post_id: {
                    'content': self.CONTENT,
                    'title': self.TITLE,
                    'published_on': utils.get_time_in_millisecs(
                        self.blog_post_model.published_on),
                    'url_fragment': 'sample-url-fragment',
                    'tags': self.TAGS,
                    'thumbnail_filename': self.THUMBNAIL
                }
            },
        )
        self.assertEqual(user_data, test_data)


class BlogPostSummaryModelTest(test_utils.GenericTestBase):
    """Tests for the BlogPostSummaryModel class."""

    NONEXISTENT_USER_ID = 'id_x'
    USER_ID = 'user_1'
    SUMMARY = 'Dummy Summary'
    TITLE = 'Dummy Title'
    TAGS = ['tag1', 'tag2', 'tag3']
    THUMBNAIL = 'xyzabc'

    def setUp(self):
        """Set up models in datastore for use in testing."""
        super(BlogPostSummaryModelTest, self).setUp()

        self.blog_post_summary_model_old = (
            blog_models.BlogPostSummaryModel(
                id='blog_one',
                author_id=self.USER_ID,
                summary=self.SUMMARY,
                title=self.TITLE,
                published_on=datetime.datetime.utcnow(),
                url_fragment='sample-url-fragment',
                tags=self.TAGS,
                thumbnail_filename=self.THUMBNAIL
            ))
        self.blog_post_summary_model_old.update_timestamps()
        self.blog_post_summary_model_old.put()

        self.blog_post_summary_model_new = (
            blog_models.BlogPostSummaryModel(
                id='blog_two',
                author_id=self.USER_ID,
                summary='sample summary',
                title='Sample Tile',
                published_on=datetime.datetime.utcnow(),
                url_fragment='sample-url-fragment-two',
                tags=self.TAGS,
                thumbnail_filename=self.THUMBNAIL
            ))
        self.blog_post_summary_model_new.update_timestamps()
        self.blog_post_summary_model_new.put()

    def test_get_deletion_policy(self):
        self.assertEqual(
            blog_models.BlogPostSummaryModel.get_deletion_policy(),
            base_models.DELETION_POLICY.LOCALLY_PSEUDONYMIZE)

    def test_has_reference_to_user_id(self):
        self.assertTrue(
            blog_models.BlogPostSummaryModel
            .has_reference_to_user_id(self.USER_ID))
        self.assertFalse(
            blog_models.BlogPostSummaryModel
            .has_reference_to_user_id(self.NONEXISTENT_USER_ID))

    def test_get_blog_post_summary_models(self):
        blog_post_ids = ['blog_two', 'blog_one']
        blog_post_summary_models = (
            blog_models.BlogPostSummaryModel.get_multi(blog_post_ids))
        self.assertEqual(len(blog_post_summary_models), 2)
        self.assertEqual(
            blog_post_summary_models[0], self.blog_post_summary_model_new)
        self.assertEqual(
            blog_post_summary_models[1], self.blog_post_summary_model_old)


class BlogPostRightsModelTest(test_utils.GenericTestBase):
    """Tests for the BlogPostRightsModel class."""

    NONEXISTENT_USER_ID = 'id_x'
    USER_ID = 'user_1'
    USER_ID_NEW = 'user_2'
    USER_ID_OLD = 'user_3'
    BLOG_POST_ID_NEW = 'blog_post_id'
    BLOG_POST_ID_OLD = 'blog_post_old_id'

    def setUp(self):
        super(BlogPostRightsModelTest, self).setUp()
        self.blog_post_rights_model = blog_models.BlogPostRightsModel(
            id=self.BLOG_POST_ID_NEW,
            editor_ids=[self.USER_ID_NEW],
            blog_post_is_published=True,
        )
        self.blog_post_rights_model.update_timestamps()
        self.blog_post_rights_model.put()

        self.blog_post_rights_draft_model = blog_models.BlogPostRightsModel(
            id=self.BLOG_POST_ID_OLD,
            editor_ids=[self.USER_ID_OLD, self.USER_ID_NEW, self.USER_ID],
            blog_post_is_published=False,
        )
        self.blog_post_rights_draft_model.update_timestamps()
        self.blog_post_rights_draft_model.put()

    def test_get_deletion_policy(self):
        self.assertEqual(
            blog_models.BlogPostRightsModel.get_deletion_policy(),
            base_models.DELETION_POLICY.DELETE)

    def test_has_reference_to_user_id(self):
        self.assertTrue(
            blog_models.BlogPostRightsModel
            .has_reference_to_user_id(self.USER_ID))
        self.assertTrue(
            blog_models.BlogPostRightsModel
            .has_reference_to_user_id(self.USER_ID_NEW))
        self.assertFalse(
            blog_models.BlogPostRightsModel
            .has_reference_to_user_id(self.NONEXISTENT_USER_ID))

    def test_get_all_by_user_for_fetching_all_rights_model(self):
        self.assertEqual(
            blog_models.BlogPostRightsModel.get_all_by_user(self.USER_ID_NEW),
            [self.blog_post_rights_model, self.blog_post_rights_draft_model])
        self.assertEqual(
            blog_models.BlogPostRightsModel.get_all_by_user(self.USER_ID),
            [self.blog_post_rights_draft_model])

    def test_get_published_models_by_user_when_limit_is_set(self):
        blog_post_rights_draft_model = blog_models.BlogPostRightsModel(
            id='blog_post_two',
            editor_ids=[self.USER_ID_NEW],
            blog_post_is_published=False,
        )
        blog_post_rights_draft_model.update_timestamps()
        blog_post_rights_draft_model.put()

        blog_post_rights_punlished_model = blog_models.BlogPostRightsModel(
            id='blog_post_one',
            editor_ids=[self.USER_ID_NEW],
            blog_post_is_published=True,
        )
        blog_post_rights_punlished_model.update_timestamps()
        blog_post_rights_punlished_model.put()

        # The latest two published blog post rights models should be fetched.
        self.assertEqual(
            blog_models.BlogPostRightsModel.get_published_models_by_user(
                self.USER_ID_NEW, 2),
            [blog_post_rights_punlished_model, self.blog_post_rights_model])

        # The latest published blog post rights model should be fetched.
        self.assertEqual(
            blog_models.BlogPostRightsModel.get_published_models_by_user(
                self.USER_ID_NEW, 1), [blog_post_rights_punlished_model])

    def test_get_published_models_by_user_when_no_limit(self):
        blog_post_rights_punlished_model = blog_models.BlogPostRightsModel(
            id='blog_post_one',
            editor_ids=[self.USER_ID_NEW],
            blog_post_is_published=True,
        )
        blog_post_rights_punlished_model.update_timestamps()
        blog_post_rights_punlished_model.put()

        self.assertEqual(
            len(
                blog_models.BlogPostRightsModel
                .get_published_models_by_user(self.USER_ID_NEW)), 2)

    def test_get_draft_models_by_user_when_limit_is_set(self):
        blog_post_rights_draft_model = blog_models.BlogPostRightsModel(
            id='blog_post_two',
            editor_ids=[self.USER_ID_NEW],
            blog_post_is_published=False,
        )
        blog_post_rights_draft_model.update_timestamps()
        blog_post_rights_draft_model.put()

        blog_post_rights_published_model = blog_models.BlogPostRightsModel(
            id='blog_post_one',
            editor_ids=[self.USER_ID_NEW],
            blog_post_is_published=True,
        )
        blog_post_rights_published_model.update_timestamps()
        blog_post_rights_published_model.put()

        # The latest two draft blog post rights models should be fetched.
        self.assertEqual(
            blog_models.BlogPostRightsModel.get_draft_models_by_user(
                self.USER_ID_NEW, 2),
            [blog_post_rights_draft_model, self.blog_post_rights_draft_model])

        # The latest draft blog post rights model should be fetched.
        self.assertEqual(
            blog_models.BlogPostRightsModel.get_draft_models_by_user(
                self.USER_ID_NEW, 1), [blog_post_rights_draft_model])

    def test_get_draft_models_by_user_when_no_limit_is_set(self):
        blog_post_rights_draft_model = blog_models.BlogPostRightsModel(
            id='blog_post_two',
            editor_ids=[self.USER_ID_NEW],
            blog_post_is_published=False,
        )
        blog_post_rights_draft_model.update_timestamps()
        blog_post_rights_draft_model.put()

        self.assertEqual(
            len(blog_models.BlogPostRightsModel.get_draft_models_by_user(
                self.USER_ID_NEW)), 2)

    def test_export_data_on_editor(self):
        """Test export data on user who is editor of the blog post."""

        blog_post_ids = (
            blog_models.BlogPostRightsModel.export_data(
                self.USER_ID_NEW))
        expected_blog_post_ids = {
            'editable_blog_post_ids': [
                self.BLOG_POST_ID_NEW,
                self.BLOG_POST_ID_OLD,
                ],
        }
        self.assertEqual(expected_blog_post_ids, blog_post_ids)

    def test_export_data_on_uninvolved_user(self):
        """Test for empty lists when user has no editor rights on
        existing blog posts.
        """

        blog_post_ids = (
            blog_models.BlogPostRightsModel.export_data(
                self.NONEXISTENT_USER_ID))
        expected_blog_post_ids = {
            'editable_blog_post_ids': [],
        }
        self.assertEqual(expected_blog_post_ids, blog_post_ids)

    def test_raise_exception_by_mocking_collision(self):
        """Tests create methods for raising exception."""

        blog_post_rights_model_cls = blog_models.BlogPostRightsModel

        # Test create method.
        with self.assertRaisesRegexp(
            Exception,
            'Blog Post ID conflict on creating new blog post rights model.'):
            #  Swap dependent method get_by_id to simulate collision every time.
            with self.swap(
                blog_post_rights_model_cls, 'get_by_id',
                types.MethodType(
                    lambda x, y: True,
                    blog_post_rights_model_cls)):
                blog_post_rights_model_cls.create(
                    'blog_one', self.USER_ID)

    def test_creating_new_blog_post_rights_model(self):
        blog_post_model_id = (
            blog_models.BlogPostModel.generate_new_blog_post_id())
        blog_post_rights_model_instance = (
            blog_models.BlogPostRightsModel.create(
                blog_post_model_id, self.USER_ID))
        self.assertEqual(
            blog_post_rights_model_instance.id, blog_post_model_id)
        self.assertEqual(
            blog_post_rights_model_instance.editor_ids, [self.USER_ID])

    def test_deassign_user_from_all_blog_posts(self):
        """Tests removing user id from the list of editor ids for blog post
        assigned to a user.
        """

        blog_models.BlogPostRightsModel.deassign_user_from_all_blog_posts(
            self.USER_ID_NEW)
        blog_post_rights_models = blog_models.BlogPostRightsModel.get_all()
        for model in blog_post_rights_models:
            self.assertTrue(self.USER_ID_NEW not in model.editor_ids)
