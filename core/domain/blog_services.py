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

"""Commands for operations on blogs, and related models."""

from __future__ import annotations

import datetime

from core import feconf
from core import utils
from core.constants import constants
from core.domain import blog_domain
from core.domain import html_cleaner
from core.domain import role_services
from core.platform import models

(blog_models,) = models.Registry.import_models([models.Names.BLOG])
datastore_services = models.Registry.import_datastore_services()


def get_blog_post_from_model(blog_post_model):
    """Returns a blog post domain object given a blog post model loaded
    from the datastore.

    Args:
        blog_post_model: BlogPostModel. The blog post model loaded from the
            datastore.

    Returns:
        BlogPost. A blog post domain object corresponding to the given
        blog post model.
    """
    return blog_domain.BlogPost(
        blog_post_model.id,
        blog_post_model.author_id,
        blog_post_model.title,
        blog_post_model.content,
        blog_post_model.url_fragment,
        blog_post_model.tags,
        blog_post_model.thumbnail_filename,
        blog_post_model.last_updated,
        blog_post_model.published_on)


def get_blog_post_by_id(blog_post_id, strict=True):
    """Returns a domain object representing a blog post.

    Args:
        blog_post_id: str. ID of the blog post.
        strict: bool. Fails noisily if the model doesn't exist.

    Returns:
        BlogPost or None. The domain object representing a blog post with the
        given id, or None if it does not exist.
    """
    blog_post_model = blog_models.BlogPostModel.get(blog_post_id, strict=strict)
    if blog_post_model:
        return get_blog_post_from_model(blog_post_model)
    else:
        return None


def get_blog_post_by_url_fragment(url_fragment):
    """Returns a domain object representing a blog post.

    Args:
        url_fragment: str. The url fragment of the blog post.

    Returns:
        BlogPost or None. The domain object representing a blog post with the
        given ID, or None if it does not exist.
    """
    blog_post_model = (
        blog_models.BlogPostModel.get_by_url_fragment(url_fragment))
    if blog_post_model is None:
        return None

    return get_blog_post_from_model(blog_post_model)


def get_blog_post_summary_from_model(blog_post_summary_model):
    """Returns a blog post summary domain object given a blog post summary
    model loaded from the datastore.

    Args:
        blog_post_summary_model: BlogPostSummaryModel. The blog post model
            loaded from the datastore.

    Returns:
        BlogPostSummary. A blog post summary domain object corresponding to the
        given blog post summary model.
    """
    return blog_domain.BlogPostSummary(
        blog_post_summary_model.id,
        blog_post_summary_model.author_id,
        blog_post_summary_model.title,
        blog_post_summary_model.summary,
        blog_post_summary_model.url_fragment,
        blog_post_summary_model.tags,
        blog_post_summary_model.thumbnail_filename,
        blog_post_summary_model.last_updated,
        blog_post_summary_model.published_on)


def get_blog_post_summary_by_id(blog_post_id, strict=False):
    """Returns a domain object representing a blog post summary.

    Args:
        blog_post_id: str. ID of the blog post.
        strict: bool. Fails noisily if the model doesn't exist.

    Returns:
        BlogPostSummary or None. The domain object representing a blog post
        summary with the given ID, or None if it does not exist.
    """
    blog_post_summary_model = blog_models.BlogPostSummaryModel.get(
        blog_post_id, strict=strict)
    if blog_post_summary_model:
        blog_post_summary = get_blog_post_summary_from_model(
            blog_post_summary_model)
        return blog_post_summary
    else:
        return None


def get_blog_post_summary_models_list_by_user_id(
        user_id, blog_post_is_published):
    """Given the user ID and status, it returns the list of blog post summary
    domain object for which user is an editor and the status matches.

    Args:
        user_id: str. The user who is editor of the blog posts.
        blog_post_is_published: bool. Whether the given blog post is
            published or not.

    Returns:
        list(BlogPostSummary). The blog post summaries of the blog posts for
        which the user is an editor corresponding to the status
        (draft/published).
    """
    blog_post_ids = filter_blog_post_ids(user_id, blog_post_is_published)
    blog_post_summary_models = (
        blog_models.BlogPostSummaryModel.get_multi(blog_post_ids))
    blog_post_summaries = []
    blog_post_summaries = [
        get_blog_post_summary_from_model(model) if model is not None else None
        for model in blog_post_summary_models]
    return (
        sorted(blog_post_summaries, key=lambda k: k.last_updated, reverse=True)
            if len(blog_post_summaries) != 0 else [])


def filter_blog_post_ids(user_id, blog_post_is_published):
    """Given the user ID and status, it returns the IDs of all blog post
    according to the status.

    Args:
        user_id: str. The user who is editor of the blog post.
        blog_post_is_published: bool. True if blog post is published.

    Returns:
        list(str). The blog post IDs of the blog posts for which the user is an
        editor corresponding to the status(draft/published).
    """
    if blog_post_is_published:
        blog_post_rights_models = (
            blog_models.BlogPostRightsModel.get_published_models_by_user(
                user_id))
    else:
        blog_post_rights_models = (
            blog_models.BlogPostRightsModel.get_draft_models_by_user(
                user_id))
    model_ids = []
    if blog_post_rights_models:
        for model in blog_post_rights_models:
            model_ids.append(model.id)
    return model_ids


def get_blog_post_summary_by_title(title):
    """Returns a domain object representing a blog post summary model.

    Args:
        title: str. The title of the blog post.

    Returns:
        BlogPostSummary or None. The domain object representing a blog post
        summary with the given title, or None if it does not exist.
    """
    blog_post_summary_model = blog_models.BlogPostSummaryModel.query(
        blog_models.BlogPostSummaryModel.title == title
    ).fetch() # pylint: disable=singleton-comparison

    if len(blog_post_summary_model) == 0:
        return None

    return get_blog_post_summary_from_model(blog_post_summary_model[0])


def get_new_blog_post_id():
    """Returns a new blog post ID.

    Returns:
        str. A new blog post ID.
    """
    return blog_models.BlogPostModel.generate_new_blog_post_id()


def get_blog_post_rights_from_model(blog_post_rights_model):
    """Returns a blog post rights domain object given a blog post rights
    model loaded from the datastore.

    Args:
        blog_post_rights_model: BlogPostRightsModel. The blog post rights model
            loaded from the datastore.

    Returns:
        BlogPostRights. A blog post rights domain object corresponding to the
        given blog post rights model.
    """
    return blog_domain.BlogPostRights(
        blog_post_rights_model.id,
        blog_post_rights_model.editor_ids,
        blog_post_rights_model.blog_post_is_published)


def get_blog_post_rights(blog_post_id, strict=True):
    """Retrieves the rights object for the given blog post.

    Args:
        blog_post_id: str. ID of the blog post.
        strict: bool. Whether to fail noisily if no blog post rights model
            with a given ID exists in the datastore.

    Returns:
        BlogPostRights. The rights object associated with the given blog post.

    Raises:
        EntityNotFoundError. The blog post with ID blog post id was not
            found in the datastore.
    """

    model = blog_models.BlogPostRightsModel.get(blog_post_id, strict=strict)

    if model is None:
        return None

    return get_blog_post_rights_from_model(model)


def get_published_blog_post_summaries_by_user_id(user_id, max_limit):
    """Retrieves the summary objects for given number of published blog posts
    for which the given user is an editor.

    Args:
        user_id: str. ID of the user.
        max_limit: int. The number of models to be fetched.

    Returns:
        list(BlogPostSummary). The summary objects associated with the
        blog posts assigned to given user.
    """
    blog_rights_models = (
        blog_models.BlogPostRightsModel.get_published_models_by_user(
            user_id, max_limit))
    if not blog_rights_models:
        return None
    blog_post_ids = [model.id for model in blog_rights_models]
    blog_summary_models = (
        blog_models.BlogPostSummaryModel.get_multi(blog_post_ids))
    blog_post_summaries = [
        get_blog_post_summary_from_model(model)
        for model in blog_summary_models]
    return blog_post_summaries


def does_blog_post_with_url_fragment_exist(url_fragment):
    """Checks if blog post with provided url fragment exists.

    Args:
        url_fragment: str. The url fragment for the blog post.

    Returns:
        bool. Whether the the url fragment for the blog post exists.

    Raises:
        Exception. Blog Post URL fragment is not a string.
    """
    if not isinstance(url_fragment, str):
        raise utils.ValidationError(
            'Blog Post URL fragment should be a string. Recieved:'
            '%s' % url_fragment)
    existing_blog_post = get_blog_post_by_url_fragment(url_fragment)
    return existing_blog_post is not None


def _save_blog_post(blog_post):
    """Saves a BlogPost domain object to the datastore.

    Args:
        blog_post: BlogPost. The blog post domain object for the given
            blog post.
    """
    model = blog_models.BlogPostModel.get(blog_post.id, strict=True)
    blog_post.validate()

    model.title = blog_post.title
    model.content = blog_post.content
    model.tags = blog_post.tags
    model.published_on = blog_post.published_on
    model.thumbnail_filename = blog_post.thumbnail_filename
    model.url_fragment = blog_post.url_fragment
    model.update_timestamps()
    model.put()


def publish_blog_post(blog_post_id):
    """Marks the given blog post as published.

    Args:
        blog_post_id: str. The ID of the given blog post.

    Raises:
        Exception. The given blog post does not exist.
    """
    blog_post_rights = get_blog_post_rights(blog_post_id, strict=False)
    if blog_post_rights is None:
        raise Exception('The given blog post does not exist')
    blog_post = get_blog_post_by_id(blog_post_id, strict=True)
    blog_post.validate(strict=True)
    blog_post_summary = get_blog_post_summary_by_id(blog_post_id, strict=True)
    blog_post_summary.validate(strict=True)
    blog_post_rights.blog_post_is_published = True

    published_on = datetime.datetime.utcnow()
    blog_post.published_on = published_on
    blog_post_summary.published_on = published_on

    save_blog_post_rights(blog_post_rights)
    _save_blog_post_summary(blog_post_summary)
    _save_blog_post(blog_post)


def unpublish_blog_post(blog_post_id):
    """Marks the given blog post as unpublished or draft.

    Args:
        blog_post_id: str. The ID of the given blog post.

    Raises:
        Exception. The given blog post does not exist.
    """
    blog_post_rights = get_blog_post_rights(blog_post_id, strict=False)
    if blog_post_rights is None:
        raise Exception('The given blog post does not exist')
    blog_post_rights.blog_post_is_published = False
    save_blog_post_rights(blog_post_rights)


def delete_blog_post(blog_post_id):
    """Deletes all the models related to a blog post.

    Args:
        blog_post_id: str. ID of the blog post which is to be
            deleted.
    """
    blog_models.BlogPostModel.get(blog_post_id).delete()
    blog_models.BlogPostSummaryModel.get(blog_post_id).delete()
    blog_models.BlogPostRightsModel.get(blog_post_id).delete()


def _save_blog_post_summary(blog_post_summary):
    """Saves a BlogPostSummary domain object to the datastore.

    Args:
        blog_post_summary: BlogPostSummary. The summary object for the given
            blog post summary.
    """
    model = blog_models.BlogPostSummaryModel.get(
        blog_post_summary.id, strict=False)
    if model:
        model.author_id = blog_post_summary.author_id
        model.title = blog_post_summary.title
        model.summary = blog_post_summary.summary
        model.tags = blog_post_summary.tags
        model.published_on = blog_post_summary.published_on
        model.thumbnail_filename = blog_post_summary.thumbnail_filename
        model.url_fragment = blog_post_summary.url_fragment
    else:
        model = blog_models.BlogPostSummaryModel(
            id=blog_post_summary.id,
            author_id=blog_post_summary.author_id,
            title=blog_post_summary.title,
            summary=blog_post_summary.summary,
            tags=blog_post_summary.tags,
            published_on=blog_post_summary.published_on,
            thumbnail_filename=blog_post_summary.thumbnail_filename,
            url_fragment=blog_post_summary.url_fragment,
        )
    model.update_timestamps()
    model.put()


def save_blog_post_rights(blog_post_rights):
    """Saves a BlogPostRights domain object to the datastore.

    Args:
        blog_post_rights: BlogPostRights. The rights object for the given
            blog post.
    """
    model = blog_models.BlogPostRightsModel.get(
        blog_post_rights.id, strict=True)

    model.editor_ids = blog_post_rights.editor_ids
    model.blog_post_is_published = blog_post_rights.blog_post_is_published
    model.update_timestamps()
    model.put()


def check_can_edit_blog_post(user, blog_post_rights):
    """Checks whether the user can edit the given blog post.

    Args:
        user: UserActionsInfo. Object having user_id, role and actions for
            given user.
        blog_post_rights: BlogPostRights or None. Rights object for the given
            blog post.

    Returns:
        bool. Whether the given user can edit the given blog post.
    """
    if blog_post_rights is None:
        return False
    if role_services.ACTION_EDIT_ANY_BLOG_POST in user.actions:
        return True
    if blog_post_rights.is_editor(user.user_id):
        return True

    return False


def deassign_user_from_all_blog_posts(user_id):
    """Removes the user from the list of editor_ids for all blog posts.

    Args:
        user_id: str. ID to be removed from editor_ids.
    """
    blog_models.BlogPostRightsModel.deassign_user_from_all_blog_posts(
        user_id)


def generate_url_fragment(title, blog_post_id):
    """Generates the url fragment for a blog post from the title of the blog
    post.

    Args:
        title: str. The title of the blog post.
        blog_post_id: str. The unique blog post ID.

    Returns:
        str. The url fragment of the blog post.
    """
    lower_title = title.lower()
    hyphenated_title = lower_title.replace(' ', '-')
    lower_id = blog_post_id.lower()
    return hyphenated_title + '-' + lower_id


def generate_summary_of_blog_post(content):
    """Generates the summary for a blog post from the content of the blog
    post.

    Args:
        content: santized html str. The blog post content to be truncated.

    Returns:
        str. The summary of the blog post.
    """
    raw_text = html_cleaner.strip_html_tags(content)
    max_chars_in_summary = constants.MAX_CHARS_IN_BLOG_POST_SUMMARY - 3
    if len(raw_text) > max_chars_in_summary:
        summary = raw_text[:max_chars_in_summary] + '...'
        return summary
    return raw_text


def compute_summary_of_blog_post(blog_post):
    """Creates BlogPostSummary domain object from BlogPost domain object.

    Args:
        blog_post: BlogPost. The blog post domain object.

    Returns:
        BlogPostSummary. The blog post summary domain object.
    """
    summary = generate_summary_of_blog_post(blog_post.content)

    return blog_domain.BlogPostSummary(
        blog_post.id,
        blog_post.author_id,
        blog_post.title,
        summary,
        blog_post.url_fragment,
        blog_post.tags,
        blog_post.thumbnail_filename,
        blog_post.last_updated,
        blog_post.published_on)


def apply_change_dict(blog_post_id, change_dict):
    """Applies a changelist to blog post and returns the result.

    Args:
        blog_post_id: str. ID of the given blog post.
        change_dict: dict. A dict containing all the changes keyed
            by corresponding field name (title, content,
            thumbnail_filename, tags).

    Returns:
        UpdatedBlogPost. The modified blog post object.
    """
    blog_post = get_blog_post_by_id(blog_post_id)

    if 'title' in change_dict:
        blog_post.update_title(change_dict['title'])
        url_fragment = generate_url_fragment(
            change_dict['title'], blog_post_id)
        blog_post.update_url_fragment(url_fragment)
    if 'thumbnail_filename' in change_dict:
        blog_post.update_thumbnail_filename(change_dict['thumbnail_filename'])
    if 'content' in change_dict:
        blog_post.update_content(change_dict['content'])
    if 'tags' in change_dict:
        blog_post.update_tags(change_dict['tags'])

    return blog_post


def update_blog_post(blog_post_id, change_dict):
    """Updates the blog post and its summary model in the datastore.

    Args:
        blog_post_id: str. The ID of the blog post which is to be updated.
        change_dict: dict. A dict containing all the changes keyed by
            corresponding field name (title, content, thumbnail_filename,
            tags).
    """
    updated_blog_post = apply_change_dict(blog_post_id, change_dict)
    if 'title' in change_dict:
        blog_post_models = blog_models.BlogPostModel.query().filter(
            blog_models.BlogPostModel.title == updated_blog_post.title
            ).filter(blog_models.BlogPostModel.deleted == False).fetch()  # pylint: disable=singleton-comparison
        if len(blog_post_models) > 0:
            if (len(blog_post_models) > 1 or (
                    blog_post_models[0].id != blog_post_id)):
                raise utils.ValidationError(
                    'Blog Post with given title already exists: %s'
                    % updated_blog_post.title)

    _save_blog_post(updated_blog_post)
    updated_blog_post_summary = compute_summary_of_blog_post(updated_blog_post)
    _save_blog_post_summary(updated_blog_post_summary)


def create_new_blog_post(author_id):
    """Creates models for new blog post and returns new BlogPost domain
    object.

    Args:
        author_id: str. The user ID of the author for new blog post.

    Returns:
        BlogPost. A newly created blog post domain object .
    """
    blog_post_id = get_new_blog_post_id()
    new_blog_post_model = blog_models.BlogPostModel.create(
        blog_post_id, author_id
    )
    blog_models.BlogPostRightsModel.create(blog_post_id, author_id)
    new_blog_post = get_blog_post_from_model(new_blog_post_model)
    new_blog_post_summary_model = compute_summary_of_blog_post(new_blog_post)
    _save_blog_post_summary(new_blog_post_summary_model)

    return new_blog_post


def get_published_blog_post_summaries(offset=0):
    """Returns published BlogPostSummaries list.

    Args:
        offset: int. Number of query results to skip from top.

    Returns:
        list(BlogPostSummaries) | None . These are sorted in order of the date
        published. None if no blog post is published.
    """
    max_limit = feconf.MAX_NUM_CARDS_TO_DISPLAY_ON_BLOG_HOMEPAGE
    blog_post_rights_models = blog_models.BlogPostRightsModel.query(
        blog_models.BlogPostRightsModel.blog_post_is_published == True).order( # pylint: disable=singleton-comparison
            -blog_models.BlogPostRightsModel.last_updated).fetch(
                max_limit, offset=offset)
    if len(blog_post_rights_models) == 0:
        return None
    blog_post_ids = [model.id for model in blog_post_rights_models]
    blog_post_summary_models = (
        blog_models.BlogPostSummaryModel.get_multi(blog_post_ids))
    blog_post_summaries = []
    blog_post_summaries = [
        get_blog_post_summary_from_model(model) if model is not None else None
        for model in blog_post_summary_models]
    return blog_post_summaries


def update_blog_models_author_and_published_on_date(
        blog_post_id, author_id, date):
    """Updates blog post model with the author id and published on
    date provided.

    Args:
        blog_post_id: str. The ID of the blog post which has to be updated.
        author_id: str. User ID of the author.
        date: str. The date of publishing the blog post.
    """
    blog_post = get_blog_post_by_id(blog_post_id, True)
    blog_post_rights = get_blog_post_rights(
        blog_post_id, strict=True)

    blog_post.author_id = author_id
    supported_date_string = date + ', 00:00:00:00'
    blog_post.published_on = utils.convert_string_to_naive_datetime_object(
        supported_date_string)
    blog_post.validate(strict=True)

    blog_post_summary = compute_summary_of_blog_post(blog_post)
    _save_blog_post_summary(blog_post_summary)

    blog_post_model = blog_models.BlogPostModel.get(
        blog_post.id, strict=True)
    blog_post_model.author_id = blog_post.author_id
    blog_post_model.published_on = blog_post.published_on
    blog_post_model.update_timestamps()
    blog_post_model.put()

    blog_post_rights.editor_ids.append(blog_post.author_id)
    save_blog_post_rights(blog_post_rights)
