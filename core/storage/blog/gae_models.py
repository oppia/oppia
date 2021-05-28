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

"""Models for storing the blog data models."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.platform import models
import python_utils
import utils
(base_models, user_models) = models.Registry.import_models([
    models.NAMES.base_model, models.NAMES.user])

datastore_services = models.Registry.import_datastore_services()

# Constants used for generating new ids.
_MAX_RETRIES = 10
_RAND_RANGE = 127 * 127


class BlogPostModel(base_models.BaseModel):
    """Model to store blog content

    The id of instances of this class has the form
        [author_id].[generated_string]
    """

    # The ID of the user the blog is authored by.
    author_id = datastore_services.StringProperty(required=True)
    # Title of the blog.
    title = datastore_services.StringProperty(indexed=True, required=True)
    # Content of the blog.
    content = datastore_services.TextProperty(indexed=False, required=True)
    # The unique url fragment of the blog post.
    url_fragment = (
        datastore_services.StringProperty(indexed=True, required=True))
    # Tags associated with the blog.
    tags = datastore_services.StringProperty(indexed=True, required=True)
    # The thumbnail filename of the blog.
    thumbnail_filename = datastore_services.StringProperty(required=True)
    # Time when the blog post model was published.
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
        """Check whether BlogPostRightsModel references user.

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
        """Model is exported as one instance per user."""
        return base_models.MODEL_ASSOCIATION_TO_USER.ONE_INSTANCE_PER_USER

    @classmethod
    def get_export_policy(cls):
        """Model contains data corresponding to a user to export: author_id."""
        return dict(super(BlogPostModel, cls).get_export_policy(), **{
            'author_id': base_models.EXPORT_POLICY.EXPORTED,
            'title': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'content': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'url_fragment': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'tags': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'thumbnail_filename': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'published_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
        })

    @classmethod
    def generate_new_blog_id(cls, author_id):
        """Generates a new blog ID which is unique.

        Args:
            author_id: str. The ID of the author.

        Returns:
            str. A blog ID that is different from the IDs of all
            the existing blogs.

        Raises:
            Exception. There were too many collisions with existing blog IDs
                when attempting to generate a new blog ID.
        """
        for _ in python_utils.RANGE(_MAX_RETRIES):
            blog_id = (
                author_id + '.' +
                utils.base64_from_int(utils.get_current_time_in_millisecs()) +
                utils.base64_from_int(utils.get_random_int(_RAND_RANGE)))
            if not cls.get_by_id(blog_id):
                return blog_id
        raise Exception(
            'New blog id generator is producing too many collisions.')

    @classmethod
    def create(cls, blog_id):
        """Creates a new BlogDataModel entry.

        Args:
            blog_id: str. Blog ID of the newly-created blog.

        Returns:
            BlogDataModel. The newly created BlogDataModel
            instance.

        Raises:
            Exception. A blog with the given blog ID exists already.
        """
        if cls.get_by_id(blog_id):
            raise Exception('A blog with the given blog ID exists already.')
        return cls(id=blog_id)

    # If the user directly enters the blog post's url in the editor or the
    # homepage, the blogPostModel will be queried using the url fragment to
    # retrieve data for populating the editor dashboard / blog post page.
    @classmethod
    def get_by_url_fragment(cls, url_fragment):
        """Gets BlogModel by url_fragment. Returns None if the blog with
        the given url_fragment doesn't exist.

        Args:
            url_fragment: str. The url fragment of the blog.

        Returns:
            BlogModel | None. The blog post model of the Blog or None if not
            found.
        """
        return BlogPostModel.query().filter(
            cls.url_fragment == url_fragment).filter(
                cls.deleted == False).get() # pylint: disable=singleton-comparison

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
                'last_updated': utils.get_time_in_millisecs(
                    blog_post_model.last_updated)
            }

        return user_data


class BlogPostSummaryModel(base_models.BaseModel):
    """Summary model for blog Posts.

    This should be used whenever the content of the blog is not
    needed (e.g. in search results, displaying cards etc).

    The key of each instance is the blog id.
    """

    # The ID of the user the blog is authored by.
    author_id = datastore_services.StringProperty(indexed=True, required=True)
    # Title of the blog.
    title = datastore_services.StringProperty(indexed=True, required=True)
    # Autogenerated summary of the blog.
    summary = datastore_services.StringProperty(required=True, default='')
    # The unique url fragment of the blog post.
    url_fragment = (
        datastore_services.StringProperty(indexed=True, required=True))
    # Tags associated with the blog.
    tags = datastore_services.StringProperty(indexed=True, required=True)
    # The thumbnail filename of the blog.
    thumbnail_filename = datastore_services.StringProperty(required=True)
    # Time when the blog model was published.
    published_on = (
        datastore_services.DateTimeProperty(indexed=True, required=True))

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
        return cls.query(datastore_services.any_of(
            cls.author_id == user_id,
        )).get(keys_only=True) is not None

    @staticmethod
    def get_model_association_to_user():
        """Model data has already been exported as a part of the
        BlogModel and thus does not need a separate export.
        """
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def get_export_policy(cls):
        """Model contains data corresponding to a user (author_id), but this
        isn't exported because because noteworthy details that belong to this
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

    @classmethod
    def create(cls, blog_id):
        """Creates a new BlogPostSummaryModel entry.

        Args:
            blog_id: str. Blog ID of the newly-created blog.

        Returns:
            BlogPostSummaryModel. The newly created BlogPostSummaryModel
            instance.

        Raises:
            Exception. A blog summary model with the given blog ID exists
                already.
        """
        if cls.get_by_id(blog_id):
            raise Exception(
                'Blog ID conflict on creating new blog summary model.')
        return cls(id=blog_id)

    @classmethod
    def get_blog_post_summary_models(cls, blog_ids):
        """Returns a list of BlogPostSummaryModels for blogs created by the
        user.

        Args:
            blog_ids: list(str). Contains blog ids for which the blog post
                summary models are to be fetched.

        Returns:
            list(BlogPostSummaryModel). The list of BlogPostSummaryModel
            created by the given user.
        """
        return cls.get_multi(blog_ids)

    @classmethod
    def export_data(cls, user_id):
        """Exports the data from BlogPostSummaryModel into dict format for
        Takeout.

        Args:
            user_id: str. The ID of the user whose data should be exported.

        Returns:
            dict. Dictionary of the data from BlogPostModel.
        """

        user_data = dict()
        blog_post_summary_models = cls.get_all().filter(
            cls.author_id == user_id).fetch()

        for blog_post_summary_model in blog_post_summary_models:
            user_data[blog_post_summary_model.id] = {
                'summary': blog_post_summary_model.summary,
            }

        return user_data


class BlogPostRightsModel(base_models.BaseModel):
    """Storage model for rights related to a blog.

    The id of each instance is the blog_id.
    """

    # The user_id of the blog editors of this blog.
    editor_ids = datastore_services.StringProperty(indexed=True, repeated=True)

    # Whether this blog is published or not.
    # False if blog is a draft, True if published.
    blog_is_published = datastore_services.BooleanProperty(
        indexed=True, required=True, default=False)

    @staticmethod
    def get_deletion_policy():
        """Model contains data to pseudonymize or delete corresponding
        to a user: editor_ids field.
        """
        return base_models.DELETION_POLICY.LOCALLY_PSEUDONYMIZE

    @classmethod
    def has_reference_to_user_id(cls, user_id):
        """Check whether BlogPostRightsModel references user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether any models refer to the given user ID.
        """
        return cls.query(
            # This checks if any of the editor IDs is equal to the user_id.
            cls.editor_ids == user_id
        ).get(keys_only=True) is not None

    @classmethod
    def get_by_user(cls, user_id):
        """Retrieves the rights object for all blogs assigned to given user

        Args:
            user_id: str. ID of user.

        Returns:
            list(BlogPostRightsModel). The list of BlogPostRightsModel objects
            in which the given user is a editor.
        """

        return cls.query(cls.editor_ids == user_id).fetch()

    @staticmethod
    def get_model_association_to_user():
        """Model is exported as one instance shared across users since multiple
        users can edit the blog.
        """
        return (
            base_models
            .MODEL_ASSOCIATION_TO_USER
            .ONE_INSTANCE_SHARED_ACROSS_USERS)

    @classmethod
    def get_export_policy(cls):
        """Model contains data to export corresponding to a user."""
        return dict(super(BlogPostRightsModel, cls).get_export_policy(), **{
            'editor_ids': base_models.EXPORT_POLICY.EXPORTED,
            'blog_is_published': base_models.EXPORT_POLICY.NOT_APPLICABLE
        })

    @classmethod
    def export_data(cls, user_id):
        """(Takeout) Export user-relevant properties of BlogPostsRightsModel.

        Args:
            user_id: str. The user_id denotes which user's data to extract.

        Returns:
            dict. The user-relevant properties of BlogPostsRightsModel.
            in a python dict format. In this case, we are returning all the
            ids of blog posts for which the user is editor of.
        """
        editable_blog_posts = cls.get_all().filter(cls.editor_ids == user_id)

        editable_blog_post_ids = [blog.key.id() for blog in editable_blog_posts]

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
