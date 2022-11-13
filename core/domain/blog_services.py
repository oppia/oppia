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
import html
import logging
import re

from core import feconf
from core import utils
from core.constants import constants
from core.domain import blog_domain
from core.domain import html_cleaner
from core.domain import role_services
from core.domain import search_services
from core.domain import user_domain
from core.domain import user_services
from core.platform import models

from typing import (
    Callable, List, Literal, Optional, Sequence, Tuple, TypedDict, overload)

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import blog_models

(blog_models,) = models.Registry.import_models([models.Names.BLOG])

# The maximum number of iterations allowed for populating the results of a
# search query.
MAX_ITERATIONS = 10

# Name for the blog post search index.
SEARCH_INDEX_BLOG_POSTS = search_services.SEARCH_INDEX_BLOG_POSTS


class BlogPostChangeDict(TypedDict):
    """Dictionary representing the change_dict for BlogPost domain object."""

    title: str
    content: str
    tags: List[str]
    thumbnail_filename: str


def get_blog_post_from_model(
    blog_post_model: blog_models.BlogPostModel
) -> blog_domain.BlogPost:
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


@overload
def get_blog_post_by_id(
    blog_post_id: str
) -> blog_domain.BlogPost: ...


@overload
def get_blog_post_by_id(
    blog_post_id: str, *, strict: Literal[True]
) -> blog_domain.BlogPost: ...


@overload
def get_blog_post_by_id(
    blog_post_id: str, *, strict: Literal[False]
) -> Optional[blog_domain.BlogPost]: ...


def get_blog_post_by_id(
    blog_post_id: str, strict: bool = True
) -> Optional[blog_domain.BlogPost]:
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


def get_blog_post_by_url_fragment(
    url_fragment: str
) -> Optional[blog_domain.BlogPost]:
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


def get_blog_post_summary_from_model(
    blog_post_summary_model: blog_models.BlogPostSummaryModel
) -> blog_domain.BlogPostSummary:
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
        blog_post_summary_model.published_on,
        blog_post_summary_model.deleted)


@overload
def get_blog_post_summary_by_id(
    blog_post_id: str
) -> blog_domain.BlogPostSummary: ...


@overload
def get_blog_post_summary_by_id(
    blog_post_id: str, *, strict: Literal[True]
) -> blog_domain.BlogPostSummary: ...


@overload
def get_blog_post_summary_by_id(
    blog_post_id: str, *, strict: Literal[False]
) -> Optional[blog_domain.BlogPostSummary]: ...


def get_blog_post_summary_by_id(
    blog_post_id: str, strict: bool = True
) -> Optional[blog_domain.BlogPostSummary]:
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


def get_blog_post_summary_models_by_ids(
    blog_post_ids: List[str]
) -> List[blog_domain.BlogPostSummary]:
    """Given the list of blog post IDs, it returns the list of blog post summary
    domain object.

    Args:
        blog_post_ids: List[str]. The list of blog post IDs for which blog post
            summaries are to be fetched.

    Returns:
        List[BlogPostSummary]. The list of blog post summary domain object
        corresponding to the given list of blog post IDs.
    """
    blog_post_summary_models = blog_models.BlogPostSummaryModel.get_multi(
        blog_post_ids)
    return [
        get_blog_post_summary_from_model(model)
        for model in blog_post_summary_models if model is not None
    ]


def get_blog_post_summary_models_list_by_user_id(
    user_id: str, blog_post_is_published: bool
) -> List[blog_domain.BlogPostSummary]:
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
        get_blog_post_summary_from_model(model)
        for model in blog_post_summary_models if model is not None
    ]
    sort_blog_post_summaries: Callable[[blog_domain.BlogPostSummary], float] = (
        lambda k: k.last_updated.timestamp() if k.last_updated else 0
    )
    return (
        sorted(
            blog_post_summaries,
            key=sort_blog_post_summaries,
            reverse=True
        )
        if len(blog_post_summaries) != 0 else []
    )


def filter_blog_post_ids(
    user_id: str,
    blog_post_is_published: bool
) -> List[str]:
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


def get_blog_post_summary_by_title(
    title: str
) -> Optional[blog_domain.BlogPostSummary]:
    """Returns a domain object representing a blog post summary model.

    Args:
        title: str. The title of the blog post.

    Returns:
        BlogPostSummary or None. The domain object representing a blog post
        summary with the given title, or None if it does not exist.
    """
    blog_post_summary_model: Sequence[blog_models.BlogPostSummaryModel] = (
        blog_models.BlogPostSummaryModel.query(
            blog_models.BlogPostSummaryModel.title == title  # pylint: disable=singleton-comparison
        ).fetch()
    )

    if len(blog_post_summary_model) == 0:
        return None

    return get_blog_post_summary_from_model(blog_post_summary_model[0])


def get_new_blog_post_id() -> str:
    """Returns a new blog post ID.

    Returns:
        str. A new blog post ID.
    """
    return blog_models.BlogPostModel.generate_new_blog_post_id()


def get_blog_post_rights_from_model(
    blog_post_rights_model: blog_models.BlogPostRightsModel
) -> blog_domain.BlogPostRights:
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


@overload
def get_blog_post_rights(
    blog_post_id: str
) -> blog_domain.BlogPostRights: ...


@overload
def get_blog_post_rights(
    blog_post_id: str, *, strict: Literal[True]
) -> blog_domain.BlogPostRights: ...


@overload
def get_blog_post_rights(
    blog_post_id: str, *, strict: Literal[False]
) -> Optional[blog_domain.BlogPostRights]: ...


def get_blog_post_rights(
    blog_post_id: str, strict: bool = True
) -> Optional[blog_domain.BlogPostRights]:
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


def get_published_blog_post_summaries_by_user_id(
    user_id: str, max_limit: int, offset: int=0
) -> List[blog_domain.BlogPostSummary]:
    """Retrieves the summary objects for given number of published blog posts
    for which the given user is an editor.

    Args:
        user_id: str. ID of the user.
        max_limit: int. The number of models to be fetched.
        offset: int. Number of query results to skip from top.

    Returns:
        list(BlogPostSummary). The summary objects associated with the
        blog posts assigned to given user.
    """
    blog_rights_models = (
        blog_models.BlogPostRightsModel.get_published_models_by_user(
            user_id, offset, max_limit
        )
    )
    if not blog_rights_models:
        return []
    blog_post_ids = [model.id for model in blog_rights_models]
    blog_summary_models = (
        blog_models.BlogPostSummaryModel.get_multi(blog_post_ids))
    blog_post_summaries = [
        get_blog_post_summary_from_model(model)
        for model in blog_summary_models if model is not None]
    return blog_post_summaries


def does_blog_post_with_url_fragment_exist(url_fragment: str) -> bool:
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


def _save_blog_post(blog_post: blog_domain.BlogPost) -> None:
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


def publish_blog_post(blog_post_id: str) -> None:
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

    index_blog_post_summaries_given_ids([blog_post_id])


def unpublish_blog_post(blog_post_id: str) -> None:
    """Marks the given blog post as unpublished or draft.

    Args:
        blog_post_id: str. The ID of the given blog post.

    Raises:
        Exception. The given blog post does not exist.
    """
    blog_post_rights = get_blog_post_rights(blog_post_id, strict=False)
    if blog_post_rights is None:
        raise Exception('The given blog post does not exist')

    blog_post = get_blog_post_by_id(blog_post_id, strict=True)
    blog_post.published_on = None
    _save_blog_post(blog_post)

    blog_post_summary = get_blog_post_summary_by_id(blog_post_id, strict=True)
    blog_post_summary.published_on = None
    _save_blog_post_summary(blog_post_summary)

    blog_post_rights.blog_post_is_published = False
    save_blog_post_rights(blog_post_rights)

    search_services.delete_blog_post_summary_from_search_index(
        blog_post_id)


def delete_blog_post(blog_post_id: str) -> None:
    """Deletes all the models related to a blog post.

    Args:
        blog_post_id: str. ID of the blog post which is to be
            deleted.
    """
    blog_models.BlogPostModel.get(blog_post_id).delete()
    blog_models.BlogPostSummaryModel.get(blog_post_id).delete()
    blog_models.BlogPostRightsModel.get(blog_post_id).delete()

    search_services.delete_blog_post_summary_from_search_index(
        blog_post_id)


def _save_blog_post_summary(
    blog_post_summary: blog_domain.BlogPostSummary
) -> None:
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


def save_blog_post_rights(blog_post_rights: blog_domain.BlogPostRights) -> None:
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


def check_can_edit_blog_post(
    user: user_domain.UserActionsInfo,
    blog_post_rights: Optional[blog_domain.BlogPostRights]
) -> bool:
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


def deassign_user_from_all_blog_posts(user_id: str) -> None:
    """Removes the user from the list of editor_ids for all blog posts.

    Args:
        user_id: str. ID to be removed from editor_ids.
    """
    blog_models.BlogPostRightsModel.deassign_user_from_all_blog_posts(
        user_id)


def generate_url_fragment(title: str, blog_post_id: str) -> str:
    """Generates the url fragment for a blog post from the title of the blog
    post.

    Args:
        title: str. The title of the blog post.
        blog_post_id: str. The unique blog post ID.

    Returns:
        str. The url fragment of the blog post.
    """
    lower_title = title.lower().replace(':', '')
    hyphenated_title = lower_title.replace('  ', ' ').replace(' ', '-')
    lower_id = blog_post_id.lower()
    return hyphenated_title + '-' + lower_id


def generate_summary_of_blog_post(content: str) -> str:
    """Generates the summary for a blog post from the content of the blog
    post.

    Args:
        content: santized html str. The blog post content to be truncated.

    Returns:
        str. The summary of the blog post.
    """
    # Stripping away headings and content within bold tags.
    raw_html = re.sub(
        '<strong>?(.*?)</strong>',
        '',
        re.sub('<h1>?(.*?)</h1>', '', content, flags=re.DOTALL),
        flags=re.DOTALL
    )
    raw_text = html_cleaner.strip_html_tags(raw_html)
    max_chars_in_summary = constants.MAX_CHARS_IN_BLOG_POST_SUMMARY - 3
    if len(raw_text) > max_chars_in_summary:
        summary = html.unescape(raw_text)[:max_chars_in_summary] + '...'
        return summary.strip()
    return html.unescape(raw_text)


def compute_summary_of_blog_post(
    blog_post: blog_domain.BlogPost
) -> blog_domain.BlogPostSummary:
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


def apply_change_dict(
    blog_post_id: str, change_dict: BlogPostChangeDict
) -> blog_domain.BlogPost:
    """Applies a changelist to blog post and returns the result.

    Args:
        blog_post_id: str. ID of the given blog post.
        change_dict: dict. A dict containing all the changes keyed
            by corresponding field name (title, content,
            thumbnail_filename, tags).

    Returns:
        UpdatedBlogPost. The modified blog post object.
    """
    blog_post = get_blog_post_by_id(blog_post_id, strict=True)

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


def update_blog_post(
    blog_post_id: str, change_dict: BlogPostChangeDict
) -> None:
    """Updates the blog post and its summary model in the datastore.

    Args:
        blog_post_id: str. The ID of the blog post which is to be updated.
        change_dict: dict. A dict containing all the changes keyed by
            corresponding field name (title, content, thumbnail_filename,
            tags).
    """
    updated_blog_post = apply_change_dict(blog_post_id, change_dict)
    if 'title' in change_dict:
        blog_post_models: Sequence[blog_models.BlogPostModel] = (
            blog_models.BlogPostModel.query().filter(
                blog_models.BlogPostModel.title == updated_blog_post.title
            ).filter(
                blog_models.BlogPostModel.deleted == False  # pylint: disable=singleton-comparison
            ).fetch()
        )
        if len(blog_post_models) > 0:
            if (len(blog_post_models) > 1 or (
                    blog_post_models[0].id != blog_post_id)):
                raise utils.ValidationError(
                    'Blog Post with given title already exists: %s'
                    % updated_blog_post.title)

    _save_blog_post(updated_blog_post)
    updated_blog_post_summary = compute_summary_of_blog_post(updated_blog_post)
    _save_blog_post_summary(updated_blog_post_summary)


def create_new_blog_post(author_id: str) -> blog_domain.BlogPost:
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


def get_published_blog_post_summaries(
    offset: int=0, size: Optional[int]=None
) -> List[blog_domain.BlogPostSummary]:
    """Returns published BlogPostSummaries list.

    Args:
        offset: int. Number of query results to skip from top.
        size: int or None. Number of blog post summaries to return if there are
            at least that many, otherwise it contains all remaining results. If
            None, maximum number of blog post summaries to display on blog
            homepage will be returned if there are at least that many.

    Returns:
        list(BlogPostSummaries). These are sorted in order of the
        date published.
    """
    if size:
        max_limit = size
    else:
        max_limit = feconf.MAX_NUM_CARDS_TO_DISPLAY_ON_BLOG_HOMEPAGE
    blog_post_rights_models: Sequence[blog_models.BlogPostRightsModel] = (
        blog_models.BlogPostRightsModel.query(
            blog_models.BlogPostRightsModel.blog_post_is_published == True  # pylint: disable=singleton-comparison
        ).order(
            -blog_models.BlogPostRightsModel.last_updated
        ).fetch(
            max_limit, offset=offset
        )
    )
    if len(blog_post_rights_models) == 0:
        return []
    blog_post_ids = [model.id for model in blog_post_rights_models]
    blog_post_summary_models = (
        blog_models.BlogPostSummaryModel.get_multi(blog_post_ids))
    blog_post_summaries = []
    blog_post_summaries = [
        get_blog_post_summary_from_model(model)
        for model in blog_post_summary_models if model is not None
    ]
    return blog_post_summaries


def get_total_number_of_published_blog_post_summaries() -> int:
    """Returns total number of published BlogPostSummaries.

    Returns:
        int. Total number of published BlogPostSummaries.
    """
    return blog_models.BlogPostRightsModel.query(
        blog_models.BlogPostRightsModel.blog_post_is_published == True  # pylint: disable=singleton-comparison
    ).count()


def get_total_number_of_published_blog_post_summaries_by_author(
    author_id: str
) -> int:
    """Returns total number of published BlogPostSummaries by author.

    Returns:
        int. Total number of published BlogPostSummaries by author.
    """
    return len(blog_models.BlogPostRightsModel.get_published_models_by_user(
        author_id))


def update_blog_models_author_and_published_on_date(
    blog_post_id: str,
    author_id: str,
    date: str
) -> None:
    """Updates blog post model with the author id and published on
    date provided.

    Args:
        blog_post_id: str. The ID of the blog post which has to be updated.
        author_id: str. User ID of the author.
        date: str. The date of publishing the blog post.
    """
    blog_post = get_blog_post_by_id(blog_post_id, strict=True)
    blog_post_rights = get_blog_post_rights(blog_post_id, strict=True)

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


def index_blog_post_summaries_given_ids(blog_post_ids: List[str]) -> None:
    """Indexes the blog post summaries corresponding to the given blog post ids.

    Args:
        blog_post_ids: list(str). List of ids of the blog post summaries to be
            indexed.
    """
    blog_post_summaries = get_blog_post_summary_models_by_ids(blog_post_ids)
    if len(blog_post_summaries) > 0:
        search_services.index_blog_post_summaries([
            blog_post_summary for blog_post_summary in blog_post_summaries
            if blog_post_summary is not None
        ])


def get_blog_post_ids_matching_query(
    query_string: str, tags: List[str], size: int, offset: Optional[int]=None
) -> Tuple[List[str], Optional[int]]:
    """Returns a list with all blog post ids matching the given search query
    string, as well as a search offset for future fetches.

    This method returns exactly
    feconf.MAX_NUM_CARDS_TO_DISPLAY_ON_BLOG_SEARCH_RESULTS_PAGE results if
    there are at least that many, otherwise it returns all remaining results.
    (If this behaviour does not occur, an error will be logged.) The method
    also returns a search offset.

    Args:
        query_string: str. A search query string.
        tags: list(str). The list of tags to query for. If it is empty, no tags
            filter is applied to the results. If it is not empty, then a result
            is considered valid if it matches at least one of these tags.
        size: int. The maximum number of blog post summary domain objects to
            be returned if there are at least that many, otherwise it contains
            all results.
        offset: int or None. Optional offset from which to start the search
            query. If no offset is supplied, the first N results matching
            the query are returned.

    Returns:
        2-tuple of (valid_blog_post_ids, search_offset). Where:
            valid_blog_post_ids : list(str). A list with all
                blog post ids matching the given search query string,
                as well as a search offset for future fetches.
                The list contains exactly 'size' number of results if there are
                at least that many, otherwise it contains all remaining results.
                (If this behaviour does not occur, an error will be logged.)
            search_offset: int. Search offset for future fetches.
    """
    valid_blog_post_ids: List[str] = []
    search_offset: Optional[int] = offset

    for _ in range(MAX_ITERATIONS):
        remaining_to_fetch = size - len(valid_blog_post_ids)

        blog_post_ids, search_offset = (
            search_services.search_blog_post_summaries(
                query_string,
                tags,
                remaining_to_fetch,
                offset=search_offset
            )
        )

        invalid_blog_post_ids = []
        for ind, model in enumerate(
                blog_models.BlogPostSummaryModel.get_multi(blog_post_ids)):
            if model is not None:
                valid_blog_post_ids.append(blog_post_ids[ind])
            else:
                invalid_blog_post_ids.append(blog_post_ids[ind])

        if (
            (
                len(valid_blog_post_ids) ==
                feconf.MAX_NUM_CARDS_TO_DISPLAY_ON_BLOG_SEARCH_RESULTS_PAGE
            ) or search_offset is None
        ):
            break

        if len(invalid_blog_post_ids) > 0:
            logging.error(
                'Search index contains stale blog post ids: %s' %
                ', '.join(invalid_blog_post_ids))

    if (
        (
            len(valid_blog_post_ids) <
            feconf.MAX_NUM_CARDS_TO_DISPLAY_ON_BLOG_SEARCH_RESULTS_PAGE
        ) and search_offset is not None
    ):
        logging.error(
            'Could not fulfill search request for query string %s; at least '
            '%s retries were needed.' % (query_string, MAX_ITERATIONS))
    return (valid_blog_post_ids, search_offset)


def create_blog_author_details_model(user_id: str) -> None:
    """Creates a new blog author details model.

    Args:
        user_id: str. The user ID of the blog author.
    """
    user_settings = user_services.get_user_settings(user_id, strict=True)
    # Adding an if statement for mypy type checks to pass.
    if user_settings.username:
        blog_models.BlogAuthorDetailsModel.create(
            user_id,
            user_settings.username,
            user_settings.user_bio
        )


def get_blog_author_details(user_id: str) -> blog_domain.BlogAuthorDetails:
    """Returns the blog author details for the given user id. If
    blogAuthorDetailsModel is not present, a new model with default values is
    created.

    Args:
        user_id: str. The user id of the blog author.

    Returns:
        BlogAuthorDetails. The blog author details for the given user ID.

    Raises:
        Exception. Unable to fetch blog author details for the given user ID.
    """
    author_model = blog_models.BlogAuthorDetailsModel.get_by_author(user_id)

    if author_model is None:
        create_blog_author_details_model(user_id)
        author_model = blog_models.BlogAuthorDetailsModel.get_by_author(user_id)

    if author_model is None:
        raise Exception('Unable to fetch author details for the given user.')

    return blog_domain.BlogAuthorDetails(
        author_model.id,
        author_model.author_id,
        author_model.displayed_author_name,
        author_model.author_bio,
        author_model.last_updated
        )


def update_blog_author_details(
    user_id: str, displayed_author_name: str, author_bio: str
) -> None:
    """Updates the author name and bio for the given user id.

    Args:
        user_id: str. The user id of the blog author.
        displayed_author_name: str. The publicly viewable name of the author.
        author_bio: str. The bio of the blog author.
    """
    blog_author_model = blog_models.BlogAuthorDetailsModel.get_by_author(
        user_id)
    blog_domain.BlogAuthorDetails.require_valid_displayed_author_name(
        displayed_author_name)

    # Adding an if statement for mypy type checks to pass.
    if blog_author_model:
        blog_author_model.displayed_author_name = displayed_author_name
        blog_author_model.author_bio = author_bio
        blog_author_model.update_timestamps()
        blog_author_model.put()
