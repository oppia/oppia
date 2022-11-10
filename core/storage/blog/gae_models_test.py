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

from __future__ import annotations

import datetime
import types

from core import feconf
from core import utils
from core.platform import models
from core.tests import test_utils

from typing import Dict, Final, List

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import base_models
    from mypy_imports import blog_models

(base_models, blog_models, user_models) = models.Registry.import_models([
    models.Names.BASE_MODEL, models.Names.BLOG, models.Names.USER
])


class BlogPostModelTest(test_utils.GenericTestBase):
    """Tests for the BlogPostModel class."""

    NONEXISTENT_USER_ID: Final = 'id_x'
    USER_ID: Final = 'user_1'
    CONTENT: Final = 'Dummy Content'
    TITLE: Final = 'Dummy Title'
    TAGS: Final = ['tag1', 'tag2', 'tag3']
    THUMBNAIL: Final = 'xyzabc'

    def setUp(self) -> None:
        """Set up blog post models in datastore for use in testing."""
        super().setUp()

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

    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            blog_models.BlogPostModel.
                get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.MULTIPLE_INSTANCES_PER_USER)

    def test_get_export_policy(self) -> None:
        expected_export_policy_dict = {
            'author_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'title': base_models.EXPORT_POLICY.EXPORTED,
            'content': base_models.EXPORT_POLICY.EXPORTED,
            'url_fragment': base_models.EXPORT_POLICY.EXPORTED,
            'tags': base_models.EXPORT_POLICY.EXPORTED,
            'thumbnail_filename': base_models.EXPORT_POLICY.EXPORTED,
            'published_on': base_models.EXPORT_POLICY.EXPORTED,
            'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE
        }
        self.assertEqual(
            blog_models.BlogPostModel.get_export_policy(),
            expected_export_policy_dict)

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            blog_models.BlogPostModel.get_deletion_policy(),
            base_models.DELETION_POLICY.LOCALLY_PSEUDONYMIZE)

    def test_has_reference_to_user_id(self) -> None:
        self.assertTrue(
            blog_models.BlogPostModel
            .has_reference_to_user_id(self.USER_ID))
        self.assertFalse(
            blog_models.BlogPostModel
            .has_reference_to_user_id(self.NONEXISTENT_USER_ID))

    def test_raise_exception_by_mocking_collision(self) -> None:
        """Tests create and generate_new_blog_post_id methods for raising
        exception.
        """
        blog_post_model_cls = blog_models.BlogPostModel

        # Test create method.
        with self.assertRaisesRegex(
            Exception,
            'A blog post with the given blog post ID exists already.'):

            # Swap dependent method get_by_id to simulate collision every time.
            with self.swap(
                blog_post_model_cls, 'get_by_id',
                types.MethodType(
                    lambda x, y: True,
                    blog_post_model_cls)):
                blog_post_model_cls.create(
                    'blog_post_id', self.USER_ID)

        # Test generate_new_blog_post_id method.
        with self.assertRaisesRegex(
            Exception,
            'New blog post id generator is producing too many collisions.'):
            # Swap dependent method get_by_id to simulate collision every time.
            with self.swap(
                blog_post_model_cls, 'get_by_id',
                types.MethodType(
                    lambda x, y: True,
                    blog_post_model_cls)):
                blog_post_model_cls.generate_new_blog_post_id()

    def test_get_by_url_fragment(self) -> None:
        self.assertEqual(
            blog_models.BlogPostModel.get_by_url_fragment(
                'sample-url-fragment'),
            self.blog_post_model
        )

    def test_creating_new_blog_post_model_instance(self) -> None:
        blog_post_model_id = (
            blog_models.BlogPostModel.generate_new_blog_post_id())
        blog_post_model_instance = (
            blog_models.BlogPostModel.create(
                blog_post_model_id, self.USER_ID))
        self.assertEqual(blog_post_model_instance.id, blog_post_model_id)
        self.assertEqual(blog_post_model_instance.author_id, self.USER_ID)

    def test_export_data_trivial(self) -> None:
        user_data = blog_models.BlogPostModel.export_data(
            self.NONEXISTENT_USER_ID
        )
        test_data: Dict[str, blog_models.BlogPostModelDataDict] = {}
        self.assertEqual(user_data, test_data)

    def test_export_data_nontrivial(self) -> None:
        user_data = blog_models.BlogPostModel.export_data(self.USER_ID)
        blog_post_id = 'blog_one'
        test_data = {
            blog_post_id: {
                'title': self.TITLE,
                'content': self.CONTENT,
                'url_fragment': 'sample-url-fragment',
                'tags': self.TAGS,
                'thumbnail_filename': self.THUMBNAIL,
                'published_on': utils.get_time_in_millisecs(
                    self.blog_post_model.published_on)
            }
        }
        self.assertEqual(user_data, test_data)


class BlogPostSummaryModelTest(test_utils.GenericTestBase):
    """Tests for the BlogPostSummaryModel class."""

    NONEXISTENT_USER_ID: Final = 'id_x'
    USER_ID: Final = 'user_1'
    SUMMARY: Final = 'Dummy Summary'
    TITLE: Final = 'Dummy Title'
    TAGS: Final = ['tag1', 'tag2', 'tag3']
    THUMBNAIL: Final = 'xyzabc'

    def setUp(self) -> None:
        """Set up models in datastore for use in testing."""
        super().setUp()

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

    def test_get_export_policy(self) -> None:
        expected_export_policy_dict = {
            'author_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'title': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'summary': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'url_fragment': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'tags': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'thumbnail_filename': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'published_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE
        }
        self.assertEqual(
            blog_models.BlogPostSummaryModel.get_export_policy(),
            expected_export_policy_dict)

    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            blog_models.BlogPostSummaryModel.
                get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER)

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            blog_models.BlogPostSummaryModel.get_deletion_policy(),
            base_models.DELETION_POLICY.LOCALLY_PSEUDONYMIZE)

    def test_has_reference_to_user_id(self) -> None:
        self.assertTrue(
            blog_models.BlogPostSummaryModel
            .has_reference_to_user_id(self.USER_ID))
        self.assertFalse(
            blog_models.BlogPostSummaryModel
            .has_reference_to_user_id(self.NONEXISTENT_USER_ID))

    def test_get_blog_post_summary_models(self) -> None:
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

    NONEXISTENT_USER_ID: Final = 'id_x'
    USER_ID: Final = 'user_1'
    USER_ID_NEW: Final = 'user_2'
    USER_ID_OLD: Final = 'user_3'
    BLOG_POST_ID_NEW: Final = 'blog_post_id'
    BLOG_POST_ID_OLD: Final = 'blog_post_old_id'

    def setUp(self) -> None:
        super().setUp()
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

    def test_get_export_policy(self) -> None:
        expected_export_policy_dict = {
            'editor_ids': base_models.EXPORT_POLICY.EXPORTED,
            'blog_post_is_published': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE
        }
        self.assertEqual(
            blog_models.BlogPostRightsModel.get_export_policy(),
            expected_export_policy_dict)

    def test_get_field_name_mapping_to_takeout_keys(self) -> None:
        self.assertEqual(
            blog_models.BlogPostRightsModel.
            get_field_name_mapping_to_takeout_keys(),
            {
                'editor_ids': 'editable_blog_post_ids'
            })

    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            blog_models.BlogPostRightsModel.
                get_model_association_to_user(),
            base_models.
                MODEL_ASSOCIATION_TO_USER.ONE_INSTANCE_SHARED_ACROSS_USERS)

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            blog_models.BlogPostRightsModel.get_deletion_policy(),
            base_models.DELETION_POLICY.DELETE)

    def test_has_reference_to_user_id(self) -> None:
        self.assertTrue(
            blog_models.BlogPostRightsModel
            .has_reference_to_user_id(self.USER_ID))
        self.assertTrue(
            blog_models.BlogPostRightsModel
            .has_reference_to_user_id(self.USER_ID_NEW))
        self.assertFalse(
            blog_models.BlogPostRightsModel
            .has_reference_to_user_id(self.NONEXISTENT_USER_ID))

    def test_get_all_by_user_for_fetching_all_rights_model(self) -> None:
        self.assertEqual(
            blog_models.BlogPostRightsModel.get_all_by_user(self.USER_ID_NEW),
            [self.blog_post_rights_model, self.blog_post_rights_draft_model])
        self.assertEqual(
            blog_models.BlogPostRightsModel.get_all_by_user(self.USER_ID),
            [self.blog_post_rights_draft_model])

    def test_get_published_models_by_user_when_limit_is_set(self) -> None:
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

        # The latest two published blog post rights models should be fetched.
        self.assertEqual(
            blog_models.BlogPostRightsModel.get_published_models_by_user(
                self.USER_ID_NEW, 0, 2),
            [blog_post_rights_published_model, self.blog_post_rights_model])

        # The latest published blog post rights model should be fetched.
        self.assertEqual(
            blog_models.BlogPostRightsModel.get_published_models_by_user(
                self.USER_ID_NEW, 0, 1), [blog_post_rights_published_model])

        # The second latest published blog post rights model should be fetched.
        self.assertEqual(
            blog_models.BlogPostRightsModel.get_published_models_by_user(
                self.USER_ID_NEW, 1, 1), [self.blog_post_rights_model])

    def test_get_published_models_by_user_when_no_limit(self) -> None:
        blog_post_rights_published_model = blog_models.BlogPostRightsModel(
            id='blog_post_one',
            editor_ids=[self.USER_ID_NEW],
            blog_post_is_published=True,
        )
        blog_post_rights_published_model.update_timestamps()
        blog_post_rights_published_model.put()

        self.assertEqual(
            len(
                blog_models.BlogPostRightsModel
                .get_published_models_by_user(self.USER_ID_NEW)), 2)

    def test_get_draft_models_by_user_when_limit_is_set(self) -> None:
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

    def test_get_draft_models_by_user_when_no_limit_is_set(self) -> None:
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

    def test_export_data_on_editor(self) -> None:
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

    def test_export_data_on_uninvolved_user(self) -> None:
        """Test for empty lists when user has no editor rights on
        existing blog posts.
        """

        blog_post_ids = (
            blog_models.BlogPostRightsModel.export_data(
                self.NONEXISTENT_USER_ID))
        expected_blog_post_ids: Dict[str, List[str]] = {
            'editable_blog_post_ids': [],
        }
        self.assertEqual(expected_blog_post_ids, blog_post_ids)

    def test_raise_exception_by_mocking_collision(self) -> None:
        """Tests create methods for raising exception."""

        blog_post_rights_model_cls = blog_models.BlogPostRightsModel

        # Test create method.
        with self.assertRaisesRegex(
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

    def test_creating_new_blog_post_rights_model(self) -> None:
        blog_post_model_id = (
            blog_models.BlogPostModel.generate_new_blog_post_id())
        blog_post_rights_model_instance = (
            blog_models.BlogPostRightsModel.create(
                blog_post_model_id, self.USER_ID))
        self.assertEqual(
            blog_post_rights_model_instance.id, blog_post_model_id)
        self.assertEqual(
            blog_post_rights_model_instance.editor_ids, [self.USER_ID])

    def test_deassign_user_from_all_blog_posts(self) -> None:
        """Tests removing user id from the list of editor ids for blog post
        assigned to a user.
        """

        blog_models.BlogPostRightsModel.deassign_user_from_all_blog_posts(
            self.USER_ID_NEW)
        blog_post_rights_models = blog_models.BlogPostRightsModel.get_all()
        for model in blog_post_rights_models:
            self.assertTrue(self.USER_ID_NEW not in model.editor_ids)

    def test_deassign_user_from_blog_post_handles_invalid_user_id(self) -> None:
        # If the user is not in the editor list of any blog post, the
        # method 'BlogPostRightsModel.deassign_user_from_all_blog_posts()'
        # should do nothing and exit.
        blog_models.BlogPostRightsModel.deassign_user_from_all_blog_posts(
            self.NONEXISTENT_USER_ID)
        blog_post_rights_models = blog_models.BlogPostRightsModel.get_all()
        for model in blog_post_rights_models:
            self.assertTrue(self.NONEXISTENT_USER_ID not in model.editor_ids)


class BlogAuthorDetailsModelTest(test_utils.GenericTestBase):
    """Tests for BlogAuthorDetailsModel class."""

    NONEXISTENT_USER_ID: Final = 'id_x'
    USER_1_ID: Final = 'user_id'
    USER_1_ROLE: Final = feconf.ROLE_ID_BLOG_ADMIN
    USER_1_NAME: Final = 'user'
    USER_2_ID: Final = 'user_two_id'
    USER_2_ROLE: Final = feconf.ROLE_ID_BLOG_POST_EDITOR
    USER_2_NAME: Final = 'user two'
    GENERIC_DATE: Final = datetime.datetime(2019, 5, 20)
    GENERIC_EPOCH: Final = utils.get_time_in_millisecs(
        datetime.datetime(2019, 5, 20)
    )
    GENERIC_IMAGE_URL: Final = 'www.example.com/example.png'
    GENERIC_USER_BIO: Final = 'I am a user of Oppia!'

    def setUp(self) -> None:
        """Set up author details models in datastore for use in testing."""
        super().setUp()
        author_model_one = blog_models.BlogAuthorDetailsModel(
            id='author_model',
            author_id=self.USER_1_ID,
            displayed_author_name=self.USER_1_NAME,
            author_bio=self.GENERIC_USER_BIO
        )
        author_model_one.update_timestamps()
        author_model_one.put()

    def test_raise_exception_by_mocking_collision(self) -> None:
        """Tests create and generate_new_instance_id methods for raising
        exception.
        """
        blog_author_details_model_cls = blog_models.BlogAuthorDetailsModel

        # Test create method.
        with self.assertRaisesRegex(
            Exception,
            'A blog author details model for given user already exists.'):

            # Swap dependent method get_by_author to simulate collision every
            # time.
            with self.swap(
                blog_author_details_model_cls, 'get_by_author',
                types.MethodType(
                    lambda x, y: True,
                    blog_author_details_model_cls)):
                blog_author_details_model_cls.create(
                    self.USER_1_ID, 'displayed_author_name', '')

        # Test generate_new_blog_post_id method.
        with self.assertRaisesRegex(
            Exception,
            'New instance id generator is producing too many collisions.'):
            # Swap dependent method get_by_id to simulate collision every time.
            with self.swap(
                blog_author_details_model_cls, 'get_by_id',
                types.MethodType(
                    lambda x, y: True,
                    blog_author_details_model_cls)):
                blog_author_details_model_cls.generate_new_instance_id()

    def test_get_deletion_policy_is_delete(self) -> None:
        self.assertEqual(
            blog_models.BlogAuthorDetailsModel.get_deletion_policy(),
            base_models.DELETION_POLICY.LOCALLY_PSEUDONYMIZE)

    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            blog_models.BlogAuthorDetailsModel.get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.ONE_INSTANCE_PER_USER)

    def test_get_export_policy(self) -> None:
        self.assertEqual(
            blog_models.BlogAuthorDetailsModel.get_export_policy(), {
                'author_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'displayed_author_name': base_models.EXPORT_POLICY.EXPORTED,
                'author_bio': base_models.EXPORT_POLICY.EXPORTED,
                'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            }
        )

    def test_export_data_on_nonexistent_author(self) -> None:
        """Test if export_data returns None when user's author detail model is
        not in datastore.
        """
        self.assertEqual(
            blog_models.BlogAuthorDetailsModel.export_data(
                self.NONEXISTENT_USER_ID
            ), {}
        )

    def test_export_data_on_existent_author(self) -> None:
        """Test if export_data works as intended on a user's author detail model
         in datastore.
        """
        user_data = (
            blog_models.BlogAuthorDetailsModel.export_data(self.USER_1_ID))
        expected_data = {
            'displayed_author_name': self.USER_1_NAME,
            'author_bio': self.GENERIC_USER_BIO
        }
        self.assertEqual(expected_data, user_data)

    def test_has_reference_to_user_id(self) -> None:
        # Case for blog post author.
        self.assertTrue(
            blog_models.BlogAuthorDetailsModel.has_reference_to_user_id(
                self.USER_1_ID)
        )

        # Case for a non existing user.
        self.assertFalse(
            blog_models.BlogAuthorDetailsModel.has_reference_to_user_id(
                self.NONEXISTENT_USER_ID)
        )

    def test_creating_new_author_detail_model_instance(self) -> None:
        blog_models.BlogAuthorDetailsModel.create(
            self.USER_2_ID, self.USER_2_NAME, self.GENERIC_USER_BIO)
        model_instance = blog_models.BlogAuthorDetailsModel.get_by_author(
            self.USER_2_ID)
        # Ruling out the possibility of None for mypy type checking.
        assert model_instance is not None
        self.assertEqual(model_instance.author_id, self.USER_2_ID)
        self.assertEqual(model_instance.displayed_author_name, self.USER_2_NAME)
        self.assertEqual(model_instance.author_bio, self.GENERIC_USER_BIO)
