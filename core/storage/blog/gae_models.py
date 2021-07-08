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

"""Models for storing data related to blog posts."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.platform import models
import python_utils
import utils

(base_models, user_models) = models.Registry.import_models([
    models.NAMES.base_model, models.NAMES.user])

datastore_services = models.Registry.import_datastore_services()


class BlogPostModel(base_models.BaseModel):
    """Model to store blog post data.

    The id of instances of this class is in the form of random hash of
    12 chars.
    """

    # We use the model id as a key in the Takeout dict.
    ID_IS_USED_AS_TAKEOUT_KEY = True

    # The ID of the user the blog post is authored by.
    author_id = datastore_services.StringProperty(indexed=True, required=True)
    # Title of the blog post.
    title = datastore_services.StringProperty(indexed=True, required=True)
    # Content of the blog post.
    content = datastore_services.TextProperty(indexed=False, required=True)
    # The unique url fragment of the blog post. If the user directly enters the
    # blog post's url in the editor or the homepage, the blogPostModel will be
    # queried using the url fragment to retrieve data for populating the editor
    # dashboard / blog post page.
    url_fragment = (
        datastore_services.StringProperty(indexed=True, required=True))
    # Tags associated with the blog post.
    tags = datastore_services.StringProperty(indexed=True, repeated=True)
    # The thumbnail filename of the blog post. It's value will be None until
    # a thumbnail is added to the blog post. It can be None only when blog
    # post is a draft.
    thumbnail_filename = datastore_services.StringProperty(indexed=True)
    # Time when the blog post model was last published. Value will be None
    # if the blog has never been published.
    published_on = (
        datastore_services.DateTimeProperty(indexed=True))

    @staticmethod
    def get_deletion_policy():
        """Model contains data to pseudonymize corresponding to a user:
        author_id field.
        """
        return base_models.DELETION_POLICY.LOCALLY_PSEUDONYMIZE

    @classmethod
    def has_reference_to_user_id(cls, user_id):
        """Check whether BlogPostModel references user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether any models refer to the given user ID.
        """
        return cls.query(
            cls.author_id == user_id
        ).get(keys_only=True) is not None

    @staticmethod
    def get_model_association_to_user():
        """Model is exported as multiple instances per user since there can
        be multiple blog post models relevant to a user.
        """
        return base_models.MODEL_ASSOCIATION_TO_USER.MULTIPLE_INSTANCES_PER_USER

    @classmethod
    def get_export_policy(cls):
        """Model contains data corresponding to a user to export."""
        return dict(super(BlogPostModel, cls).get_export_policy(), **{
            # We do not export the author_id because we should not
            # export internal user ids.
            'author_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'title': base_models.EXPORT_POLICY.EXPORTED,
            'content': base_models.EXPORT_POLICY.EXPORTED,
            'url_fragment': base_models.EXPORT_POLICY.EXPORTED,
            'tags': base_models.EXPORT_POLICY.EXPORTED,
            'thumbnail_filename': base_models.EXPORT_POLICY.EXPORTED,
            'published_on': base_models.EXPORT_POLICY.EXPORTED,
        })

    @classmethod
    def generate_new_blog_post_id(cls):
        """Generates a new blog post ID which is unique and is in the form of
        random hash of 12 chars.

        Returns:
            str. A blog post ID that is different from the IDs of all
            the existing blog posts.

        Raises:
            Exception. There were too many collisions with existing blog post
                IDs when attempting to generate a new blog post ID.
        """
        for _ in python_utils.RANGE(base_models.MAX_RETRIES):
            blog_post_id = utils.convert_to_hash(
                python_utils.UNICODE(
                    utils.get_random_int(base_models.RAND_RANGE)),
                base_models.ID_LENGTH)
            if not cls.get_by_id(blog_post_id):
                return blog_post_id
        raise Exception(
            'New blog post id generator is producing too many collisions.')

    @classmethod
    def create(cls, blog_post_id, author_id):
        """Creates a new BlogPostModel entry.

        Args:
            blog_post_id: str. Blog Post ID of the newly-created blog post.
            author_id: str. User ID of the author.

        Returns:
            BlogPostModel. The newly created BlogPostModel instance.

        Raises:
            Exception. A blog post with the given blog post ID exists already.
        """
        if cls.get_by_id(blog_post_id):
            raise Exception(
                'A blog post with the given blog post ID exists already.')

        entity = cls(
            id=blog_post_id,
            author_id=author_id,
            content='',
            title='',
            published_on=None,
            url_fragment='',
            tags=[],
            thumbnail_filename=None
        )
        entity.update_timestamps()
        entity.put()

        return entity

    @classmethod
    def get_by_url_fragment(cls, url_fragment):
        """Gets BlogPostModel by url_fragment. Returns None if the blog post
        with the given url_fragment doesn't exist.

        Args:
            url_fragment: str. The url fragment of the blog post.

        Returns:
            BlogPostModel | None. The blog post model of the Blog or None if not
            found.
        """
        return BlogPostModel.query(
            datastore_services.all_of(
                cls.url_fragment == url_fragment, cls.deleted == False) # pylint: disable=singleton-comparison
        ).get()

    @classmethod
    def export_data(cls, user_id):
        """Exports the data from BlogPostModel into dict format for Takeout.

        Args:
            user_id: str. The ID of the user whose data should be exported.

        Returns:
            dict. Dictionary of the data from BlogPostModel.
        """
        user_data = dict()
        blog_post_models = cls.get_all().filter(
            cls.author_id == user_id).fetch()

        for blog_post_model in blog_post_models:
            user_data[blog_post_model.id] = {
                'title': blog_post_model.title,
                'content': blog_post_model.content,
                'url_fragment': blog_post_model.url_fragment,
                'tags': blog_post_model.tags,
                'thumbnail_filename': blog_post_model.thumbnail_filename,
                'published_on': utils.get_time_in_millisecs(
                    blog_post_model.published_on),
            }

        return user_data


class BlogPostSummaryModel(base_models.BaseModel):
    """Summary model for blog posts.

    This should be used whenever the content of the blog post is not
    needed (e.g. in search results, displaying blog post cards etc).

    The key of each instance is the blog post id.
    """

    # The ID of the user the blog post is authored by.
    author_id = datastore_services.StringProperty(indexed=True, required=True)
    # Title of the blog post.
    title = datastore_services.StringProperty(indexed=True, required=True)
    # Autogenerated summary of the blog post.
    summary = datastore_services.StringProperty(required=True, default='')
    # The unique url fragment of the blog post.
    url_fragment = (
        datastore_services.StringProperty(indexed=True, required=True))
    # Tags associated with the blog post.
    tags = datastore_services.StringProperty(indexed=True, repeated=True)
    # The thumbnail filename of the blog post.It's value will be none until
    # a thumbnail is added to the blog post.It can be None only when blog
    # post is a draft.
    thumbnail_filename = datastore_services.StringProperty(indexed=True)
    # Time when the blog post model was last published. Value will be None
    # if the blog post has never been published.
    published_on = (datastore_services.DateTimeProperty(indexed=True))

    @staticmethod
    def get_deletion_policy():
        """Model contains data to pseudonymize corresponding to a user:
        author_id field.
        """
        return base_models.DELETION_POLICY.LOCALLY_PSEUDONYMIZE

    @classmethod
    def has_reference_to_user_id(cls, user_id):
        """Check whether BlogPostSummaryModel exists for user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether any models refer to the given user ID.
        """
        return cls.query(
            cls.author_id == user_id
        ).get(keys_only=True) is not None

    @staticmethod
    def get_model_association_to_user():
        """Model data has already been associated as a part of the
        BlogPostModel to the user and thus does not need a separate user
        association.
        """
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def get_export_policy(cls):
        """Model contains data corresponding to a user (author_id), but this
        isn't exported because noteworthy details that belong to this
        model have already been exported as a part of the BlogPostModel.
        """
        return dict(super(BlogPostSummaryModel, cls).get_export_policy(), **{
            'author_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'title': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'summary': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'url_fragment': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'tags': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'thumbnail_filename': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'published_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
        })


class BlogPostRightsModel(base_models.BaseModel):
    """Storage model for rights related to a blog post.

    The id of each instance is the blog_post_id.
    """

    # The user_ids of the blog editors of this blog post.
    editor_ids = datastore_services.StringProperty(indexed=True, repeated=True)

    # Whether this blog post is published or not.
    # False if blog post is a draft, True if published.
    blog_post_is_published = datastore_services.BooleanProperty(
        indexed=True, required=True, default=False)

    @staticmethod
    def get_deletion_policy():
        """Model contains data to be deleted corresponding to a user: editor_ids
        field. It does not delete the model but removes the user id from the
        list of editor IDs corresponding to a blog post rights model.
        """
        return base_models.DELETION_POLICY.DELETE

    @classmethod
    def deassign_user_from_all_blog_posts(cls, user_id):
        """Removes user_id from the list of editor_ids from all the blog
        post rights models.

        Args:
            user_id: str. The ID of the user to be removed from editor ids.
        """
        blog_post_rights_models = cls.get_all_by_user(user_id)
        if blog_post_rights_models:
            for rights_model in blog_post_rights_models:
                rights_model.editor_ids.remove(user_id)
            cls.update_timestamps_multi(blog_post_rights_models)
            cls.put_multi(blog_post_rights_models)

    @classmethod
    def has_reference_to_user_id(cls, user_id):
        """Check whether BlogPostRightsModel references to the given user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether any models refer to the given user ID.
        """
        return cls.query(
            # NOTE: Even though `editor_ids` is repeated, we can compare it to a
            # single value and it will return models where any of the editor IDs
            # are equal to user_id.
            cls.editor_ids == user_id).get(keys_only=True) is not None

    @classmethod
    def get_published_models_by_user(cls, user_id, limit=None):
        """Retrieves the blog post rights objects for published blog posts for
        which the given user is an editor.

        Args:
            user_id: str. ID of the author of the blog post.
            limit: int|None. The maximum number of BlogPostRightsModels to be
                fetched. If None, all existing published models by user will be
                fetched.

        Returns:
            list(BlogPostRightsModel). The list of BlogPostRightsModel objects
            in which the given user is an editor. The list will be ordered
            according to the time when the model was last updated.
        """
        query = cls.query(
            cls.editor_ids == user_id, cls.blog_post_is_published == True # pylint: disable=singleton-comparison
        ).order(-cls.last_updated)
        return query.fetch(limit) if limit is not None else query.fetch()

    @classmethod
    def get_draft_models_by_user(cls, user_id, limit=None):
        """Retrieves the blog post rights objects for draft blog posts for which
        the given user is an editor.

        Args:
            user_id: str. ID of the author of the blog post.
            limit: int|None. The maximum number of BlogPostRightsModels to be
                fetched. If None, all existing draft models by user will be
                fetched.

        Returns:
            list(BlogPostRightsModel). The list of BlogPostRightsModel objects
            in which the given user is an editor. The list will be ordered
            according to the time when the model was last updated.
        """
        query = cls.query(
            cls.editor_ids == user_id, cls.blog_post_is_published == False # pylint: disable=singleton-comparison
        ).order(-cls.last_updated)
        return query.fetch(limit) if limit is not None else query.fetch()

    @classmethod
    def get_all_by_user(cls, user_id):
        """Retrieves the blog post rights objects for all blog posts for which
        the given user is an editor.

        Args:
            user_id: str. ID of the author of the blog post.

        Returns:
            list(BlogPostRightsModel). The list of BlogPostRightsModel objects
            in which the given user is an editor.
        """
        return cls.query(cls.editor_ids == user_id).fetch()

    @staticmethod
    def get_model_association_to_user():
        """Model is exported as one instance shared across users since multiple
        users can edit the blog post.
        """
        return (
            base_models.MODEL_ASSOCIATION_TO_USER
            .ONE_INSTANCE_SHARED_ACROSS_USERS
        )

    @classmethod
    def get_export_policy(cls):
        """Model contains data to export corresponding to a user."""
        return dict(super(BlogPostRightsModel, cls).get_export_policy(), **{
            'editor_ids': base_models.EXPORT_POLICY.EXPORTED,
            'blog_post_is_published': base_models.EXPORT_POLICY.NOT_APPLICABLE
        })

    @classmethod
    def export_data(cls, user_id):
        """(Takeout) Export user-relevant properties of BlogPostsRightsModel.

        Args:
            user_id: str. The user_id denotes which user's data to extract.

        Returns:
            dict. The user-relevant properties of BlogPostsRightsModel.
            in a python dict format. In this case, we are returning all the
            ids of blog posts for which the user is an editor.
        """
        editable_blog_posts = cls.query(cls.editor_ids == user_id).fetch()
        editable_blog_post_ids = [blog.id for blog in editable_blog_posts]

        return {
            'editable_blog_post_ids': editable_blog_post_ids,
        }

    @classmethod
    def get_field_name_mapping_to_takeout_keys(cls):
        """Defines the mapping of field names to takeout keys since this model
        is exported as one instance shared across users.
        """
        return {
            'editor_ids': 'editable_blog_post_ids',
        }

    @classmethod
    def create(cls, blog_post_id, author_id):
        """Creates a new BlogPostRightsModel entry.

        Args:
            blog_post_id: str. Blog Post ID of the newly-created blog post.
            author_id: str. User ID of the author.

        Returns:
            BlogPostRightsModel. The newly created BlogPostRightsModel
            instance.

        Raises:
            Exception. A blog post rights model with the given blog post ID
                exists already.
        """
        if cls.get_by_id(blog_post_id):
            raise Exception(
                'Blog Post ID conflict on creating new blog post rights model.')

        entity = cls(
            id=blog_post_id,
            editor_ids=[author_id]
        )
        entity.update_timestamps()
        entity.put()

        return entity
