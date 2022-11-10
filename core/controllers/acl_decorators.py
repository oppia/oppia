# coding: utf-8
#
# Copyright 2017 The Oppia Authors. All Rights Reserved.
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

"""Decorators to provide authorization across the site."""

from __future__ import annotations

import functools
import logging
import re

from core import android_validation_constants
from core import feconf
from core import utils
from core.constants import constants
from core.controllers import base
from core.domain import blog_services
from core.domain import classifier_services
from core.domain import classroom_services
from core.domain import feedback_services
from core.domain import question_services
from core.domain import rights_manager
from core.domain import role_services
from core.domain import skill_domain
from core.domain import skill_fetchers
from core.domain import story_domain
from core.domain import story_fetchers
from core.domain import subtopic_page_services
from core.domain import suggestion_services
from core.domain import topic_domain
from core.domain import topic_fetchers
from core.domain import topic_services
from core.domain import user_services

from typing import Any, Callable, Dict, List, Optional, Type, TypeVar

# Note: '_SelfBaseHandlerType' is a private type variable because it is only
# supposed to denote the 'self' argument of the handler function that the
# decorator is decorating. So, do not make it public type variable in future.
_SelfBaseHandlerType = Type[base.BaseHandler]
# Note: '_GenericHandlerFunctionReturnType' is a private type variable because
# it is only supposed to denote the return type of handler function that the
# decorator is decorating. So, do not make it public type variable in future.
_GenericHandlerFunctionReturnType = TypeVar('_GenericHandlerFunctionReturnType')


def _redirect_based_on_return_type(
    handler: _SelfBaseHandlerType,
    redirection_url: str,
    expected_return_type: str
) -> None:
    """Redirects to the provided URL if the handler type is not JSON.

    Args:
        handler: function. The function to be decorated.
        redirection_url: str. The URL to redirect to.
        expected_return_type: str. The type of the response to be returned
            in case of errors eg. html, json.

    Raises:
        PageNotFoundException. The page is not found.
    """
    if expected_return_type == feconf.HANDLER_TYPE_JSON:
        raise handler.PageNotFoundException

    handler.redirect(redirection_url)


def open_access(
    handler: Callable[..., _GenericHandlerFunctionReturnType]
) -> Callable[..., _GenericHandlerFunctionReturnType]:
    """Decorator to give access to everyone.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that can also give access to
        everyone.
    """

    # Here we use type Any because this method can accept arbitrary number of
    # arguments with different types.
    @functools.wraps(handler)
    def test_can_access(
        self: _SelfBaseHandlerType,
        *args: Any,
        **kwargs: Any
    ) -> _GenericHandlerFunctionReturnType:
        """Gives access to everyone.

        Args:
            *args: list(*). A list of arguments.
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.
        """
        return handler(self, *args, **kwargs)

    return test_can_access


def is_source_mailchimp(
    handler: Callable[..., _GenericHandlerFunctionReturnType]
) -> Callable[..., _GenericHandlerFunctionReturnType]:
    """Decorator to check whether the request was generated from Mailchimp.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function.
    """

    # Here we use type Any because this method can accept arbitrary number of
    # arguments with different types.
    @functools.wraps(handler)
    def test_is_source_mailchimp(
        self: _SelfBaseHandlerType, secret: str, **kwargs: Any
    ) -> _GenericHandlerFunctionReturnType:
        """Checks whether the request was generated from Mailchimp.

        Args:
            secret: str. The key that is used to authenticate that the request
                has originated from Mailchimp.
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.
        """
        if feconf.MAILCHIMP_WEBHOOK_SECRET is None:
            raise self.PageNotFoundException

        if secret != feconf.MAILCHIMP_WEBHOOK_SECRET:
            logging.error(
                'Invalid Mailchimp webhook request received with secret: %s'
                % secret)
            raise self.PageNotFoundException

        return handler(self, secret, **kwargs)

    return test_is_source_mailchimp


def does_classroom_exist(
    handler: Callable[..., _GenericHandlerFunctionReturnType]
) -> Callable[..., _GenericHandlerFunctionReturnType]:
    """Decorator to check whether classroom exists.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function.
    """

    # Here we use type Any because this method can accept arbitrary number of
    # arguments with different types.
    @functools.wraps(handler)
    def test_does_classroom_exist(
        self: _SelfBaseHandlerType,
        classroom_url_fragment: str,
        **kwargs: Any
    ) -> _GenericHandlerFunctionReturnType:
        """Checks if classroom url fragment provided is valid. If so, return
        handler or else redirect to the correct classroom.

        Args:
            classroom_url_fragment: str. The classroom url fragment.
            **kwargs: *. Keyword arguments.

        Returns:
            handler. function. The newly decorated function.

        Raises:
            Exception. This decorator is not expected to be used with other
                handler types.
        """
        classroom = classroom_services.get_classroom_by_url_fragment(
            classroom_url_fragment)

        if not classroom:
            # This decorator should only be used for JSON handlers, since all
            # HTML page handlers are expected to be migrated to the Angular
            # router and access validation for such pages should be done using
            # the access validation handler endpoint.
            if self.GET_HANDLER_ERROR_RETURN_TYPE == feconf.HANDLER_TYPE_JSON:
                raise self.PageNotFoundException

            # As this decorator is not expected to be used with other
            # handler types, raising an error here.
            raise Exception(
                'does_classroom_exist decorator is only expected to '
                'be used with json return type handlers.')

        return handler(self, classroom_url_fragment, **kwargs)

    return test_does_classroom_exist


def can_play_exploration(
    handler: Callable[..., _GenericHandlerFunctionReturnType]
) -> Callable[..., _GenericHandlerFunctionReturnType]:
    """Decorator to check whether user can play given exploration.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now can check if users can
        play a given exploration.
    """

    # Here we use type Any because this method can accept arbitrary number of
    # arguments with different types.
    @functools.wraps(handler)
    def test_can_play(
        self: _SelfBaseHandlerType, exploration_id: str, **kwargs: Any
    ) -> _GenericHandlerFunctionReturnType:
        """Checks if the user can play the exploration.

        Args:
            exploration_id: str. The exploration id.
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            PageNotFoundException. The page is not found.
        """
        if exploration_id in feconf.DISABLED_EXPLORATION_IDS:
            raise self.PageNotFoundException

        exploration_rights = rights_manager.get_exploration_rights(
            exploration_id, strict=False)

        if exploration_rights is None:
            raise self.PageNotFoundException

        if rights_manager.check_can_access_activity(
                self.user, exploration_rights):
            return handler(self, exploration_id, **kwargs)
        else:
            raise self.PageNotFoundException

    return test_can_play


def can_view_skills(
    handler: Callable[..., _GenericHandlerFunctionReturnType]
) -> Callable[..., _GenericHandlerFunctionReturnType]:
    """Decorator to check whether user can view multiple given skills.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that can also check if the user
        can view multiple given skills.
    """

    # Here we use type Any because this method can accept arbitrary number of
    # arguments with different types.
    @functools.wraps(handler)
    def test_can_view(
        self: _SelfBaseHandlerType,
        selected_skill_ids: List[str],
        **kwargs: Any
    ) -> _GenericHandlerFunctionReturnType:
        """Checks if the user can view the skills.

        Args:
            selected_skill_ids: list(str). List of skill ids.
            **kwargs: *. Keyword arguments.

        Returns:
            bool. Whether the user can view the given skills.

        Raises:
            PageNotFoundException. The page is not found.
        """
        # This is a temporary check, since a decorator is required for every
        # method. Once skill publishing is done, whether given skill is
        # published should be checked here.

        try:
            for skill_id in selected_skill_ids:
                skill_domain.Skill.require_valid_skill_id(skill_id)
        except utils.ValidationError as e:
            raise self.InvalidInputException(e)

        try:
            skill_fetchers.get_multi_skills(selected_skill_ids)
        except Exception as e:
            raise self.PageNotFoundException(e)

        return handler(self, selected_skill_ids, **kwargs)

    return test_can_view


def can_play_collection(
    handler: Callable[..., _GenericHandlerFunctionReturnType]
) -> Callable[..., _GenericHandlerFunctionReturnType]:
    """Decorator to check whether user can play given collection.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that can also check if a user can
        play a given collection.
    """

    # Here we use type Any because this method can accept arbitrary number of
    # arguments with different types.
    @functools.wraps(handler)
    def test_can_play(
        self: _SelfBaseHandlerType, collection_id: str, **kwargs: Any
    ) -> _GenericHandlerFunctionReturnType:
        """Checks if the user can play the collection.

        Args:
            collection_id: str. The collection id.
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            PageNotFoundException. The page is not found.
        """
        collection_rights = rights_manager.get_collection_rights(
            collection_id, strict=False)

        if collection_rights is None:
            raise self.PageNotFoundException

        if rights_manager.check_can_access_activity(
                self.user, collection_rights):
            return handler(self, collection_id, **kwargs)
        else:
            raise self.PageNotFoundException

    return test_can_play


def can_download_exploration(
    handler: Callable[..., _GenericHandlerFunctionReturnType]
) -> Callable[..., _GenericHandlerFunctionReturnType]:
    """Decorator to check whether user can download given exploration.
    If a user is authorized to play given exploration, they can download it.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that can also check if the user
        has permission to download a given exploration.
    """

    # Here we use type Any because this method can accept arbitrary number of
    # arguments with different types.
    @functools.wraps(handler)
    def test_can_download(
        self: _SelfBaseHandlerType, exploration_id: str, **kwargs: Any
    ) -> _GenericHandlerFunctionReturnType:
        """Checks if the user can download the exploration.

        Args:
            exploration_id: str. The exploration id.
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            PageNotFoundException. The page is not found.
        """
        if exploration_id in feconf.DISABLED_EXPLORATION_IDS:
            raise base.UserFacingExceptions.PageNotFoundException

        exploration_rights = rights_manager.get_exploration_rights(
            exploration_id, strict=False)

        if exploration_rights is None:
            raise self.PageNotFoundException

        if rights_manager.check_can_access_activity(
                self.user, exploration_rights):
            return handler(self, exploration_id, **kwargs)
        else:
            raise self.PageNotFoundException

    return test_can_download


def can_view_exploration_stats(
    handler: Callable[..., _GenericHandlerFunctionReturnType]
) -> Callable[..., _GenericHandlerFunctionReturnType]:
    """Decorator to check whether user can view exploration stats.
    If a user is authorized to play given exploration, they can view its stats.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that checks if the user
        has permission to view exploration stats.
    """

    # Here we use type Any because this method can accept arbitrary number of
    # arguments with different types.
    @functools.wraps(handler)
    def test_can_view_stats(
        self: _SelfBaseHandlerType, exploration_id: str, **kwargs: Any
    ) -> _GenericHandlerFunctionReturnType:
        """Checks if the user can view the exploration stats.

        Args:
            exploration_id: str. The exploration id.
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            PageNotFoundException. The page is not found.
        """
        if exploration_id in feconf.DISABLED_EXPLORATION_IDS:
            raise base.UserFacingExceptions.PageNotFoundException

        exploration_rights = rights_manager.get_exploration_rights(
            exploration_id, strict=False)

        if exploration_rights is None:
            raise self.PageNotFoundException

        if rights_manager.check_can_access_activity(
                self.user, exploration_rights):
            return handler(self, exploration_id, **kwargs)
        else:
            raise base.UserFacingExceptions.PageNotFoundException

    return test_can_view_stats


def can_edit_collection(
    handler: Callable[..., _GenericHandlerFunctionReturnType]
) -> Callable[..., _GenericHandlerFunctionReturnType]:
    """Decorator to check whether the user can edit collection.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that checks if the user has
        permission to edit a given collection.
    """

    # Here we use type Any because this method can accept arbitrary number of
    # arguments with different types.
    @functools.wraps(handler)
    def test_can_edit(
        self: _SelfBaseHandlerType, collection_id: str, **kwargs: Any
    ) -> _GenericHandlerFunctionReturnType:
        """Checks if the user is logged in and can edit the collection.

        Args:
            collection_id: str. The collection id.
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            PageNotFoundException. The page is not found.
            UnauthorizedUserException. The user does not have
                credentials to edit the collection.
        """
        if not self.user_id:
            raise base.UserFacingExceptions.NotLoggedInException

        collection_rights = rights_manager.get_collection_rights(
            collection_id, strict=False)
        if collection_rights is None:
            raise base.UserFacingExceptions.PageNotFoundException

        if rights_manager.check_can_edit_activity(
                self.user, collection_rights):
            return handler(self, collection_id, **kwargs)
        else:
            raise base.UserFacingExceptions.UnauthorizedUserException(
                'You do not have credentials to edit this collection.')

    return test_can_edit


def can_manage_email_dashboard(
    handler: Callable[..., _GenericHandlerFunctionReturnType]
) -> Callable[..., _GenericHandlerFunctionReturnType]:
    """Decorator to check whether user can access email dashboard.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now checks if the user has
        permission to access the email dashboard.
    """

    # Here we use type Any because this method can accept arbitrary number of
    # arguments with different types.
    @functools.wraps(handler)
    def test_can_manage_emails(
        self: _SelfBaseHandlerType, **kwargs: Any
    ) -> _GenericHandlerFunctionReturnType:
        """Checks if the user is logged in and can access email dashboard.

        Args:
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            NotLoggedInException. The user is not logged in.
            UnauthorizedUserException. The user does not have credentials to
                access the email dashboard.
        """
        if not self.user_id:
            raise base.UserFacingExceptions.NotLoggedInException

        if self.current_user_is_super_admin:
            return handler(self, **kwargs)

        raise self.UnauthorizedUserException(
            'You do not have credentials to access email dashboard.')

    return test_can_manage_emails


def can_access_blog_admin_page(
    handler: Callable[..., _GenericHandlerFunctionReturnType]
) -> Callable[..., _GenericHandlerFunctionReturnType]:
    """Decorator to check whether user can access blog admin page.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now checks if the user has
        permission to access the blog admin page.
    """

    # Here we use type Any because this method can accept arbitrary number of
    # arguments with different types.
    @functools.wraps(handler)
    def test_can_access_blog_admin_page(
        self: _SelfBaseHandlerType, **kwargs: Any
    ) -> _GenericHandlerFunctionReturnType:
        """Checks if the user is logged in and can access blog admin page.

        Args:
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            NotLoggedInException. The user is not logged in.
            UnauthorizedUserException. The user does not have credentials to
                access the blog admin page.
        """
        if not self.user_id:
            raise base.UserFacingExceptions.NotLoggedInException

        if role_services.ACTION_ACCESS_BLOG_ADMIN_PAGE in self.user.actions:
            return handler(self, **kwargs)

        raise self.UnauthorizedUserException(
            'You do not have credentials to access blog admin page.')

    return test_can_access_blog_admin_page


def can_manage_blog_post_editors(
    handler: Callable[..., _GenericHandlerFunctionReturnType]
) -> Callable[..., _GenericHandlerFunctionReturnType]:
    """Decorator to check whether user can add and remove users as blog
    post editors.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now checks if the user has
        permission to manage blog post editors.
    """

    # Here we use type Any because this method can accept arbitrary number of
    # arguments with different types.
    @functools.wraps(handler)
    def test_can_manage_blog_post_editors(
        self: _SelfBaseHandlerType, **kwargs: Any
    ) -> _GenericHandlerFunctionReturnType:
        """Checks if the user is logged in and can add and remove users as blog
        post editors.

        Args:
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            NotLoggedInException. The user is not logged in.
            UnauthorizedUserException. The user does not have credentials to
                manage blog post editors..
        """
        if not self.user_id:
            raise base.UserFacingExceptions.NotLoggedInException

        if role_services.ACTION_MANAGE_BLOG_POST_EDITORS in self.user.actions:
            return handler(self, **kwargs)

        raise self.UnauthorizedUserException(
            'You do not have credentials to add or remove blog post editors.')

    return test_can_manage_blog_post_editors


def can_access_blog_dashboard(
    handler: Callable[..., _GenericHandlerFunctionReturnType]
) -> Callable[..., _GenericHandlerFunctionReturnType]:
    """Decorator to check whether user can access blog dashboard.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now checks if the user has
        permission to access the blog dashboard.
    """

    # Here we use type Any because this method can accept arbitrary number of
    # arguments with different types.
    @functools.wraps(handler)
    def test_can_access_blog_dashboard(
        self: _SelfBaseHandlerType, **kwargs: Any
    ) -> _GenericHandlerFunctionReturnType:
        """Checks if the user is logged in and can access blog dashboard.

        Args:
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            NotLoggedInException. The user is not logged in.
            UnauthorizedUserException. The user does not have credentials to
                access the blog dashboard.
        """
        if not self.user_id:
            raise base.UserFacingExceptions.NotLoggedInException

        if role_services.ACTION_ACCESS_BLOG_DASHBOARD in self.user.actions:
            return handler(self, **kwargs)

        raise self.UnauthorizedUserException(
            'You do not have credentials to access blog dashboard page.')

    return test_can_access_blog_dashboard


def can_delete_blog_post(
    handler: Callable[..., _GenericHandlerFunctionReturnType]
) -> Callable[..., _GenericHandlerFunctionReturnType]:
    """Decorator to check whether user can delete blog post.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that checks if a user has
        permission to delete a given blog post.
    """

    # Here we use type Any because this method can accept arbitrary number of
    # arguments with different types.
    @functools.wraps(handler)
    def test_can_delete(
        self: _SelfBaseHandlerType, blog_post_id: str, **kwargs: Any
    ) -> _GenericHandlerFunctionReturnType:
        """Checks if the user can delete the blog post.

        Args:
            blog_post_id: str. The blog post id.
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            NotLoggedInException. The user is not logged in.
            UnauthorizedUserException. The user does not have permissions to
                delete this blog post.
        """
        if not self.user_id:
            raise base.UserFacingExceptions.NotLoggedInException

        blog_post_rights = blog_services.get_blog_post_rights(
            blog_post_id, strict=False)

        if not blog_post_rights:
            raise self.PageNotFoundException(
                Exception('The given blog post id is invalid.'))

        if role_services.ACTION_DELETE_ANY_BLOG_POST in self.user.actions:
            return handler(self, blog_post_id, **kwargs)
        if self.user_id in blog_post_rights.editor_ids:
            return handler(self, blog_post_id, **kwargs)
        else:
            raise base.UserFacingExceptions.UnauthorizedUserException(
                'User %s does not have permissions to delete blog post %s' %
                (self.user_id, blog_post_id))

    return test_can_delete


def can_edit_blog_post(
    handler: Callable[..., _GenericHandlerFunctionReturnType]
) -> Callable[..., _GenericHandlerFunctionReturnType]:
    """Decorator to check whether user can edit blog post.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that checks if a user has
        permission to edit a given blog post.
    """

    # Here we use type Any because this method can accept arbitrary number of
    # arguments with different types.
    @functools.wraps(handler)
    def test_can_edit(
        self: _SelfBaseHandlerType, blog_post_id: str, **kwargs: Any
    ) -> _GenericHandlerFunctionReturnType:
        """Checks if the user can edit the blog post.

        Args:
            blog_post_id: str. The blog post id.
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            NotLoggedInException. The user is not logged in.
            UnauthorizedUserException. The user does not have permissions to
                edit this blog post.
        """
        if not self.user_id:
            raise base.UserFacingExceptions.NotLoggedInException

        blog_post_rights = blog_services.get_blog_post_rights(
            blog_post_id, strict=False)

        if not blog_post_rights:
            raise self.PageNotFoundException(
                Exception('The given blog post id is invalid.'))

        if role_services.ACTION_EDIT_ANY_BLOG_POST in self.user.actions:
            return handler(self, blog_post_id, **kwargs)
        if self.user_id in blog_post_rights.editor_ids:
            return handler(self, blog_post_id, **kwargs)
        else:
            raise base.UserFacingExceptions.UnauthorizedUserException(
                'User %s does not have permissions to edit blog post %s' %
                (self.user_id, blog_post_id))

    return test_can_edit


def can_access_moderator_page(
    handler: Callable[..., _GenericHandlerFunctionReturnType]
) -> Callable[..., _GenericHandlerFunctionReturnType]:
    """Decorator to check whether user can access moderator page.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now checks if the user has
        permission to access the moderator page.
    """

    # Here we use type Any because this method can accept arbitrary number of
    # arguments with different types.
    @functools.wraps(handler)
    def test_can_access_moderator_page(
        self: _SelfBaseHandlerType, **kwargs: Any
    ) -> _GenericHandlerFunctionReturnType:
        """Checks if the user is logged in and can access moderator page.

        Args:
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            NotLoggedInException. The user is not logged in.
            UnauthorizedUserException. The user does not have credentials to
                access the moderator page.
        """
        if not self.user_id:
            raise base.UserFacingExceptions.NotLoggedInException

        if role_services.ACTION_ACCESS_MODERATOR_PAGE in self.user.actions:
            return handler(self, **kwargs)

        raise self.UnauthorizedUserException(
            'You do not have credentials to access moderator page.')

    return test_can_access_moderator_page


def can_access_release_coordinator_page(
    handler: Callable[..., _GenericHandlerFunctionReturnType]
) -> Callable[..., _GenericHandlerFunctionReturnType]:
    """Decorator to check whether user can access release coordinator page.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now checks if the user has
        permission to access the release coordinator page.
    """

    # Here we use type Any because this method can accept arbitrary number of
    # arguments with different types.
    @functools.wraps(handler)
    def test_can_access_release_coordinator_page(
        self: _SelfBaseHandlerType, **kwargs: Any
    ) -> _GenericHandlerFunctionReturnType:
        """Checks if the user is logged in and can access release coordinator
        page.

        Args:
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            NotLoggedInException. The user is not logged in.
            UnauthorizedUserException. The user does not have credentials to
                access the release coordinator page.
        """
        if not self.user_id:
            raise base.UserFacingExceptions.NotLoggedInException

        if role_services.ACTION_ACCESS_RELEASE_COORDINATOR_PAGE in (
                self.user.actions):
            return handler(self, **kwargs)

        raise self.UnauthorizedUserException(
            'You do not have credentials to access release coordinator page.')

    return test_can_access_release_coordinator_page


def can_manage_memcache(
    handler: Callable[..., _GenericHandlerFunctionReturnType]
) -> Callable[..., _GenericHandlerFunctionReturnType]:
    """Decorator to check whether user can can manage memcache.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now checks if the user has
        permission to manage memcache.
    """

    # Here we use type Any because this method can accept arbitrary number of
    # arguments with different types.
    @functools.wraps(handler)
    def test_can_manage_memcache(
        self: _SelfBaseHandlerType, **kwargs: Any
    ) -> _GenericHandlerFunctionReturnType:
        """Checks if the user is logged in and can manage memcache.

        Args:
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            NotLoggedInException. The user is not logged in.
            UnauthorizedUserException. The user does not have credentials manage
                memcache.
        """
        if not self.user_id:
            raise base.UserFacingExceptions.NotLoggedInException

        if role_services.ACTION_MANAGE_MEMCACHE in self.user.actions:
            return handler(self, **kwargs)

        raise self.UnauthorizedUserException(
            'You do not have credentials to manage memcache.')

    return test_can_manage_memcache


def can_run_any_job(
    handler: Callable[..., _GenericHandlerFunctionReturnType]
) -> Callable[..., _GenericHandlerFunctionReturnType]:
    """Decorator to check whether user can can run any job.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now checks if the user has
        permission to run any job.
    """

    # Here we use type Any because this method can accept arbitrary number of
    # arguments with different types.
    @functools.wraps(handler)
    def test_can_run_any_job(
        self: _SelfBaseHandlerType, *args: Any, **kwargs: Any
    ) -> _GenericHandlerFunctionReturnType:
        """Checks if the user is logged in and can run any job.

        Args:
            *args: list(*). Positional arguments.
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            NotLoggedInException. The user is not logged in.
            UnauthorizedUserException. The user does not have credentials run
                any job.
        """
        if not self.user_id:
            raise base.UserFacingExceptions.NotLoggedInException

        if role_services.ACTION_RUN_ANY_JOB in self.user.actions:
            return handler(self, *args, **kwargs)

        raise self.UnauthorizedUserException(
            'You do not have credentials to run jobs.')

    return test_can_run_any_job


def can_send_moderator_emails(
    handler: Callable[..., _GenericHandlerFunctionReturnType]
) -> Callable[..., _GenericHandlerFunctionReturnType]:
    """Decorator to check whether user can send moderator emails.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also checks if the user
        has permission to send moderator emails.
    """

    # Here we use type Any because this method can accept arbitrary number of
    # arguments with different types.
    @functools.wraps(handler)
    def test_can_send_moderator_emails(
        self: _SelfBaseHandlerType, **kwargs: Any
    ) -> _GenericHandlerFunctionReturnType:
        """Checks if the user is logged in and can send moderator emails.

        Args:
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            NotLoggedInException. The user is not logged in.
            UnauthorizedUserException. The user does not have credentials to
                send moderator emails.
        """
        if not self.user_id:
            raise base.UserFacingExceptions.NotLoggedInException

        if role_services.ACTION_SEND_MODERATOR_EMAILS in self.user.actions:
            return handler(self, **kwargs)

        raise self.UnauthorizedUserException(
            'You do not have credentials to send moderator emails.')

    return test_can_send_moderator_emails


def can_manage_own_account(
    handler: Callable[..., _GenericHandlerFunctionReturnType]
) -> Callable[..., _GenericHandlerFunctionReturnType]:
    """Decorator to check whether user can manage their account.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also checks if the user
        has permission to manage their account.
    """

    # Here we use type Any because this method can accept arbitrary number of
    # arguments with different types.
    @functools.wraps(handler)
    def test_can_manage_account(
        self: _SelfBaseHandlerType, **kwargs: Any
    ) -> _GenericHandlerFunctionReturnType:
        """Checks if the user is logged in and can manage their account.

        Args:
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            NotLoggedInException. The user is not logged in.
            UnauthorizedUserException. The user does not have credentials to
                manage account or preferences.
        """
        if not self.user_id:
            raise self.NotLoggedInException

        if role_services.ACTION_MANAGE_ACCOUNT in self.user.actions:
            return handler(self, **kwargs)

        raise self.UnauthorizedUserException(
            'You do not have credentials to manage account or preferences.')

    return test_can_manage_account


def can_access_admin_page(
    handler: Callable[..., _GenericHandlerFunctionReturnType]
) -> Callable[..., _GenericHandlerFunctionReturnType]:
    """Decorator that checks if the current user is a super admin.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also checks if the user
        is a super admin.
    """

    # Here we use type Any because this method can accept arbitrary number of
    # arguments with different types.
    @functools.wraps(handler)
    def test_super_admin(
        self: _SelfBaseHandlerType, **kwargs: Any
    ) -> _GenericHandlerFunctionReturnType:
        """Checks if the user is logged in and is a super admin.

        Args:
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            NotLoggedInException. The user is not logged in.
            UnauthorizedUserException. The user is not a super admin of the
                application.
        """
        if not self.user_id:
            raise self.NotLoggedInException

        if not self.current_user_is_super_admin:
            raise self.UnauthorizedUserException(
                '%s is not a super admin of this application' % self.user_id)
        return handler(self, **kwargs)

    return test_super_admin


def can_access_contributor_dashboard_admin_page(
    handler: Callable[..., _GenericHandlerFunctionReturnType]
) -> Callable[..., _GenericHandlerFunctionReturnType]:
    """Decorator that checks if the user can access the contributor dashboard
    admin page.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also checks user can
        access the contributor dashboard admin page.
    """

    # Here we use type Any because this method can accept arbitrary number of
    # arguments with different types.
    @functools.wraps(handler)
    def test_can_access_contributor_dashboard_admin_page(
        self: _SelfBaseHandlerType, **kwargs: Any
    ) -> _GenericHandlerFunctionReturnType:
        """Checks if the user can access the contributor dashboard admin page.

        Args:
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            NotLoggedInException. The user is not logged in.
            UnauthorizedUserException. The user cannot access the contributor
                dashboard admin page.
        """
        if not self.user_id:
            raise self.NotLoggedInException

        if role_services.ACTION_ACCESS_CONTRIBUTOR_DASHBOARD_ADMIN_PAGE in (
                self.user.actions):
            return handler(self, **kwargs)

        raise self.UnauthorizedUserException(
            'You do not have credentials to access contributor dashboard '
            'admin page.')

    return test_can_access_contributor_dashboard_admin_page


def can_manage_contributors_role(
    handler: Callable[..., _GenericHandlerFunctionReturnType]
) -> Callable[..., _GenericHandlerFunctionReturnType]:
    """Decorator that checks if the current user can modify contributor's role
    for the contributor dashboard page.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also checks if the user
        can modify contributor's role for the contributor dashboard page.
    """

    # Here we use type Any because this method can accept arbitrary number of
    # arguments with different types.
    @functools.wraps(handler)
    def test_can_manage_contributors_role(
        self: _SelfBaseHandlerType, category: str, **kwargs: Any
    ) -> _GenericHandlerFunctionReturnType:
        """Checks if the user can modify contributor's role for the contributor
        dashboard page.

        Args:
            category: str. The category of contribution.
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            NotLoggedInException. The user is not logged in.
            UnauthorizedUserException. The user cannnot modify contributor's
                role for the contributor dashboard page.
        """
        if not self.user_id:
            raise self.NotLoggedInException

        if category in [
                constants.CONTRIBUTION_RIGHT_CATEGORY_REVIEW_QUESTION,
                constants.CONTRIBUTION_RIGHT_CATEGORY_SUBMIT_QUESTION]:
            if role_services.ACTION_MANAGE_QUESTION_CONTRIBUTOR_ROLES in (
                    self.user.actions):
                return handler(self, category, **kwargs)
        elif category == (
                constants.CONTRIBUTION_RIGHT_CATEGORY_REVIEW_TRANSLATION):
            if role_services.ACTION_MANAGE_TRANSLATION_CONTRIBUTOR_ROLES in (
                    self.user.actions):
                return handler(self, category, **kwargs)
        else:
            raise self.InvalidInputException(
                'Invalid category: %s' % category)

        raise self.UnauthorizedUserException(
            'You do not have credentials to modify contributor\'s role.')

    return test_can_manage_contributors_role


def can_delete_any_user(
    handler: Callable[..., _GenericHandlerFunctionReturnType]
) -> Callable[..., _GenericHandlerFunctionReturnType]:
    """Decorator that checks if the current user can delete any user.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also checks if the user
        can delete any user.
    """

    # Here we use type Any because this method can accept arbitrary number of
    # arguments with different types.
    @functools.wraps(handler)
    def test_primary_admin(
        self: _SelfBaseHandlerType, **kwargs: Any
    ) -> _GenericHandlerFunctionReturnType:
        """Checks if the user is logged in and is a primary admin e.g. user with
        email address equal to feconf.SYSTEM_EMAIL_ADDRESS.

        Args:
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            NotLoggedInException. The user is not logged in.
            UnauthorizedUserException. The user is not a primary admin of the
                application.
        """
        if not self.user_id:
            raise self.NotLoggedInException

        email = user_services.get_email_from_user_id(self.user_id)
        if email != feconf.SYSTEM_EMAIL_ADDRESS:
            raise self.UnauthorizedUserException(
                '%s cannot delete any user.' % self.user_id)

        return handler(self, **kwargs)

    return test_primary_admin


def can_upload_exploration(
    handler: Callable[..., _GenericHandlerFunctionReturnType]
) -> Callable[..., _GenericHandlerFunctionReturnType]:
    """Decorator that checks if the current user can upload exploration.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also checks if a user
        has permission to upload an exploration.
    """

    # Here we use type Any because this method can accept arbitrary number of
    # arguments with different types.
    @functools.wraps(handler)
    def test_can_upload(
        self: _SelfBaseHandlerType, **kwargs: Any
    ) -> _GenericHandlerFunctionReturnType:
        """Checks if the user can upload exploration.

        Args:
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            NotLoggedInException. The user is not logged in.
            UnauthorizedUserException. The user does not have credentials to
                upload an exploration.
        """
        if not self.user_id:
            raise self.NotLoggedInException

        if not self.current_user_is_super_admin:
            raise self.UnauthorizedUserException(
                'You do not have credentials to upload explorations.')
        return handler(self, **kwargs)

    return test_can_upload


def can_create_exploration(
    handler: Callable[..., _GenericHandlerFunctionReturnType]
) -> Callable[..., _GenericHandlerFunctionReturnType]:
    """Decorator to check whether the user can create an exploration.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also checks if a user
        has permission to create an exploration.
    """

    # Here we use type Any because this method can accept arbitrary number of
    # arguments with different types.
    @functools.wraps(handler)
    def test_can_create(
        self: _SelfBaseHandlerType, **kwargs: Any
    ) -> _GenericHandlerFunctionReturnType:
        """Checks if the user can create an exploration.

        Args:
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            NotLoggedInException. The user is not logged in.
            UnauthorizedUserException. The user does not have credentials to
                create an exploration.
        """
        if self.user_id is None:
            raise self.NotLoggedInException

        if role_services.ACTION_CREATE_EXPLORATION in self.user.actions:
            return handler(self, **kwargs)
        else:
            raise base.UserFacingExceptions.UnauthorizedUserException(
                'You do not have credentials to create an exploration.')

    return test_can_create


def can_create_collection(
    handler: Callable[..., _GenericHandlerFunctionReturnType]
) -> Callable[..., _GenericHandlerFunctionReturnType]:
    """Decorator to check whether the user can create a collection.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also checks if a user
        has permission to create a collection.
    """

    # Here we use type Any because this method can accept arbitrary number of
    # arguments with different types.
    @functools.wraps(handler)
    def test_can_create(
        self: _SelfBaseHandlerType, **kwargs: Any
    ) -> _GenericHandlerFunctionReturnType:
        """Checks if the user can create a collection.

        Args:
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            NotLoggedInException. The user is not logged in.
            UnauthorizedUserException. The user does not have credentials to
                create a collection.
        """
        if self.user_id is None:
            raise self.NotLoggedInException

        if role_services.ACTION_CREATE_COLLECTION in self.user.actions:
            return handler(self, **kwargs)
        else:
            raise base.UserFacingExceptions.UnauthorizedUserException(
                'You do not have credentials to create a collection.')

    return test_can_create


def can_access_creator_dashboard(
    handler: Callable[..., _GenericHandlerFunctionReturnType]
) -> Callable[..., _GenericHandlerFunctionReturnType]:
    """Decorator to check whether the user can access creator dashboard page.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also checks if a
        user has permission to access the creator dashboard page.
    """

    # Here we use type Any because this method can accept arbitrary number of
    # arguments with different types.
    @functools.wraps(handler)
    def test_can_access(
        self: _SelfBaseHandlerType, **kwargs: Any
    ) -> _GenericHandlerFunctionReturnType:
        """Checks if the user can access the creator dashboard page.

        Args:
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            NotLoggedInException. The user is not logged in.
            UnauthorizedUserException. The user does not have credentials to
                access creator dashboard.
        """
        if self.user_id is None:
            raise self.NotLoggedInException

        if role_services.ACTION_ACCESS_CREATOR_DASHBOARD in self.user.actions:
            return handler(self, **kwargs)
        else:
            raise base.UserFacingExceptions.UnauthorizedUserException(
                'You do not have credentials to access creator dashboard.')

    return test_can_access


def can_create_feedback_thread(
    handler: Callable[..., _GenericHandlerFunctionReturnType]
) -> Callable[..., _GenericHandlerFunctionReturnType]:
    """Decorator to check whether the user can create a feedback thread.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also checks if a user
        has permission to create a feedback thread.
    """

    # Here we use type Any because this method can accept arbitrary number of
    # arguments with different types.
    @functools.wraps(handler)
    def test_can_access(
        self: _SelfBaseHandlerType, exploration_id: str, **kwargs: Any
    ) -> _GenericHandlerFunctionReturnType:
        """Checks if the user can create a feedback thread.

        Args:
            exploration_id: str. The ID of the exploration where the thread will
                be created.
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            PageNotFoundException. The page is not found.
            UnauthorizedUserException. The user does not have credentials to
                create an exploration feedback.
        """
        if exploration_id in feconf.DISABLED_EXPLORATION_IDS:
            raise base.UserFacingExceptions.PageNotFoundException

        exploration_rights = rights_manager.get_exploration_rights(
            exploration_id, strict=False)
        if rights_manager.check_can_access_activity(
                self.user, exploration_rights):
            return handler(self, exploration_id, **kwargs)
        else:
            raise self.UnauthorizedUserException(
                'You do not have credentials to create exploration feedback.')

    return test_can_access


def can_view_feedback_thread(
    handler: Callable[..., _GenericHandlerFunctionReturnType]
) -> Callable[..., _GenericHandlerFunctionReturnType]:
    """Decorator to check whether the user can view a feedback thread.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also checks if a user
        has permission to view a feedback thread.
    """

    # Here we use type Any because this method can accept arbitrary number of
    # arguments with different types.
    @functools.wraps(handler)
    def test_can_access(
        self: _SelfBaseHandlerType, thread_id: str, **kwargs: Any
    ) -> _GenericHandlerFunctionReturnType:
        """Checks if the user can view a feedback thread.

        Args:
            thread_id: str. The feedback thread id.
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            InvalidInputException. The thread ID is not valid.
            PageNotFoundException. The page is not found.
            UnauthorizedUserException. The user does not have credentials to
                view an exploration feedback.
        """
        # This should already be checked by the controller handler
        # argument schemas, but we are adding it here for additional safety.
        regex_pattern = constants.VALID_THREAD_ID_REGEX
        regex_matched = bool(re.match(regex_pattern, thread_id))
        if not regex_matched:
            raise self.InvalidInputException('Not a valid thread id.')

        entity_type = feedback_services.get_thread(thread_id).entity_type
        entity_types_with_unrestricted_view_suggestion_access = (
            feconf.ENTITY_TYPES_WITH_UNRESTRICTED_VIEW_SUGGESTION_ACCESS)
        if entity_type in entity_types_with_unrestricted_view_suggestion_access:
            return handler(self, thread_id, **kwargs)

        exploration_id = feedback_services.get_exp_id_from_thread_id(thread_id)

        if exploration_id in feconf.DISABLED_EXPLORATION_IDS:
            raise base.UserFacingExceptions.PageNotFoundException

        exploration_rights = rights_manager.get_exploration_rights(
            exploration_id, strict=False)
        if rights_manager.check_can_access_activity(
                self.user, exploration_rights):
            return handler(self, thread_id, **kwargs)
        else:
            raise self.UnauthorizedUserException(
                'You do not have credentials to view exploration feedback.')

    return test_can_access


def can_comment_on_feedback_thread(
    handler: Callable[..., _GenericHandlerFunctionReturnType]
) -> Callable[..., _GenericHandlerFunctionReturnType]:
    """Decorator to check whether the user can comment on feedback thread.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also checks if the user
        has permission to comment on a given feedback thread.
    """

    # Here we use type Any because this method can accept arbitrary number of
    # arguments with different types.
    @functools.wraps(handler)
    def test_can_access(
        self: _SelfBaseHandlerType, thread_id: str, **kwargs: Any
    ) -> _GenericHandlerFunctionReturnType:
        """Checks if the user can comment on the feedback thread.

        Args:
            thread_id: str. The feedback thread id.
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            NotLoggedInException. The user is not logged in.
            InvalidInputException. The thread ID is not valid.
            PageNotFoundException. The page is not found.
            UnauthorizedUserException. The user does not have credentials to
                comment on an exploration feedback.
        """
        if not self.user_id:
            raise base.UserFacingExceptions.NotLoggedInException

        # This should already be checked by the controller handler
        # argument schemas, but we are adding it here for additional safety.
        regex_pattern = constants.VALID_THREAD_ID_REGEX
        regex_matched = bool(re.match(regex_pattern, thread_id))
        if not regex_matched:
            raise self.InvalidInputException('Not a valid thread id.')

        exploration_id = feedback_services.get_exp_id_from_thread_id(thread_id)

        if exploration_id in feconf.DISABLED_EXPLORATION_IDS:
            raise base.UserFacingExceptions.PageNotFoundException

        exploration_rights = rights_manager.get_exploration_rights(
            exploration_id, strict=False)

        if rights_manager.check_can_access_activity(
                self.user, exploration_rights):
            return handler(self, thread_id, **kwargs)
        else:
            raise self.UnauthorizedUserException(
                'You do not have credentials to comment on exploration'
                ' feedback.')

    return test_can_access


def can_rate_exploration(
    handler: Callable[..., _GenericHandlerFunctionReturnType]
) -> Callable[..., _GenericHandlerFunctionReturnType]:
    """Decorator to check whether the user can give rating to given
    exploration.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also checks if the user
        has permission to rate a given exploration.
    """

    # Here we use type Any because this method can accept arbitrary number of
    # arguments with different types.
    @functools.wraps(handler)
    def test_can_rate(
        self: _SelfBaseHandlerType, exploration_id: str, **kwargs: Any
    ) -> _GenericHandlerFunctionReturnType:
        """Checks if the user can rate the exploration.

        Args:
            exploration_id: str. The exploration id.
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            UnauthorizedUserException. The user does not have credentials to
                rate an exploration.
        """
        if (role_services.ACTION_RATE_ANY_PUBLIC_EXPLORATION in
                self.user.actions):
            return handler(self, exploration_id, **kwargs)
        else:
            raise base.UserFacingExceptions.UnauthorizedUserException(
                'You do not have credentials to give ratings to explorations.')

    return test_can_rate


def can_flag_exploration(
    handler: Callable[..., _GenericHandlerFunctionReturnType]
) -> Callable[..., _GenericHandlerFunctionReturnType]:
    """Decorator to check whether user can flag given exploration.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also checks if
        a user can flag a given exploration.
    """

    # Here we use type Any because this method can accept arbitrary number of
    # arguments with different types.
    @functools.wraps(handler)
    def test_can_flag(
        self: _SelfBaseHandlerType, exploration_id: str, **kwargs: Any
    ) -> _GenericHandlerFunctionReturnType:
        """Checks if the user can flag the exploration.

        Args:
            exploration_id: str. The exploration id.
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            UnauthorizedUserException. The user does not have credentials to
                flag an exploration.
        """
        if role_services.ACTION_FLAG_EXPLORATION in self.user.actions:
            return handler(self, exploration_id, **kwargs)
        else:
            raise base.UserFacingExceptions.UnauthorizedUserException(
                'You do not have credentials to flag explorations.')

    return test_can_flag


def can_subscribe_to_users(
    handler: Callable[..., _GenericHandlerFunctionReturnType]
) -> Callable[..., _GenericHandlerFunctionReturnType]:
    """Decorator to check whether user can subscribe/unsubscribe a creator.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also checks if a user
        has permission to subscribe/unsubscribe a creator.
    """

    # Here we use type Any because this method can accept arbitrary number of
    # arguments with different types.
    @functools.wraps(handler)
    def test_can_subscribe(
        self: _SelfBaseHandlerType, **kwargs: Any
    ) -> _GenericHandlerFunctionReturnType:
        """Checks if the user can subscribe/unsubscribe a creator.

        Args:
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            UnauthorizedUserException. The user does not have credentials to
                manage subscriptions.
        """
        if role_services.ACTION_SUBSCRIBE_TO_USERS in self.user.actions:
            return handler(self, **kwargs)
        else:
            raise base.UserFacingExceptions.UnauthorizedUserException(
                'You do not have credentials to manage subscriptions.')

    return test_can_subscribe


def can_edit_exploration(
    handler: Callable[..., _GenericHandlerFunctionReturnType]
) -> Callable[..., _GenericHandlerFunctionReturnType]:
    """Decorator to check whether the user can edit given exploration.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also checks if
        a user has permission to edit a given exploration.
    """

    # Here we use type Any because this method can accept arbitrary number of
    # arguments with different types.
    @functools.wraps(handler)
    def test_can_edit(
        self: _SelfBaseHandlerType,
        exploration_id: str,
        *args: Any,
        **kwargs: Any
    ) -> _GenericHandlerFunctionReturnType:
        """Checks if the user can edit the exploration.

        Args:
            exploration_id: str. The exploration id.
            *args: list(*). A list of arguments.
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            NotLoggedInException. The user is not logged in.
            PageNotFoundException. The page is not found.
            UnauthorizedUserException. The user does not have credentials to
                edit an exploration.
        """
        if not self.user_id:
            raise base.UserFacingExceptions.NotLoggedInException

        exploration_rights = rights_manager.get_exploration_rights(
            exploration_id, strict=False)

        if exploration_rights is None:
            raise base.UserFacingExceptions.PageNotFoundException

        if rights_manager.check_can_edit_activity(
                self.user, exploration_rights):
            return handler(self, exploration_id, *args, **kwargs)
        else:
            raise base.UserFacingExceptions.UnauthorizedUserException(
                'You do not have credentials to edit this exploration.')

    return test_can_edit


def can_voiceover_exploration(
    handler: Callable[..., _GenericHandlerFunctionReturnType]
) -> Callable[..., _GenericHandlerFunctionReturnType]:
    """Decorator to check whether the user can voiceover given exploration.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also checks if a user
        has permission to voiceover a given exploration.
    """

    # Here we use type Any because this method can accept arbitrary number of
    # arguments with different types.
    @functools.wraps(handler)
    def test_can_voiceover(
        self: _SelfBaseHandlerType, exploration_id: str, **kwargs: Any
    ) -> _GenericHandlerFunctionReturnType:
        """Checks if the user can voiceover the exploration.

        Args:
            exploration_id: str. The exploration id.
            **kwargs: dict(str: *). Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            NotLoggedInException. The user is not logged in.
            PageNotFoundException. The page is not found.
            UnauthorizedUserException. The user does not have credentials to
                voiceover an exploration.
        """
        if not self.user_id:
            raise base.UserFacingExceptions.NotLoggedInException

        exploration_rights = rights_manager.get_exploration_rights(
            exploration_id, strict=False)
        if exploration_rights is None:
            raise base.UserFacingExceptions.PageNotFoundException

        if rights_manager.check_can_voiceover_activity(
                self.user, exploration_rights):
            return handler(self, exploration_id, **kwargs)
        else:
            raise base.UserFacingExceptions.UnauthorizedUserException(
                'You do not have credentials to voiceover this exploration.')

    return test_can_voiceover


def can_add_voice_artist(
    handler: Callable[..., _GenericHandlerFunctionReturnType]
) -> Callable[..., _GenericHandlerFunctionReturnType]:
    """Decorator to check whether the user can add voice artist to
    the given activity.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also checks if a user
        has permission to add voice artist.
    """

    # Here we use type Any because this method can accept arbitrary number of
    # arguments with different types.
    @functools.wraps(handler)
    def test_can_add_voice_artist(
        self: _SelfBaseHandlerType,
        entity_type: str,
        entity_id: str,
        **kwargs: Any
    ) -> _GenericHandlerFunctionReturnType:
        """Checks if the user can add a voice artist for the given entity.

        Args:
            entity_type: str. The type of entity.
            entity_id: str. The Id of the entity.
            **kwargs: dict(str: *). Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            NotLoggedInException. The user is not logged in.
            InvalidInputException. The given entity type is not supported.
            PageNotFoundException. The page is not found.
            InvalidInputException. The given exploration is private.
            UnauthorizedUserException. The user does not have the credentials
                to manage voice artist.
        """
        if not self.user_id:
            raise base.UserFacingExceptions.NotLoggedInException

        if entity_type != feconf.ENTITY_TYPE_EXPLORATION:
            raise self.InvalidInputException(
                'Unsupported entity_type: %s' % entity_type)

        exploration_rights = rights_manager.get_exploration_rights(
            entity_id, strict=False)
        if exploration_rights is None:
            raise base.UserFacingExceptions.PageNotFoundException

        if exploration_rights.is_private():
            raise base.UserFacingExceptions.InvalidInputException(
                'Could not assign voice artist to private activity.')
        if rights_manager.check_can_manage_voice_artist_in_activity(
                self.user, exploration_rights):
            return handler(self, entity_type, entity_id, **kwargs)
        else:
            raise base.UserFacingExceptions.UnauthorizedUserException(
                'You do not have credentials to manage voice artists.')

    return test_can_add_voice_artist


def can_remove_voice_artist(
    handler: Callable[..., _GenericHandlerFunctionReturnType]
) -> Callable[..., _GenericHandlerFunctionReturnType]:
    """Decorator to check whether the user can remove voice artist
    from the given activity.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also checks if a user
        has permission to remove voice artist.
    """

    # Here we use type Any because this method can accept arbitrary number of
    # arguments with different types.
    @functools.wraps(handler)
    def test_can_remove_voice_artist(
        self: _SelfBaseHandlerType,
        entity_type: str,
        entity_id: str,
        **kwargs: Any
    ) -> _GenericHandlerFunctionReturnType:
        """Checks if the user can remove a voice artist for the given entity.

        Args:
            entity_type: str. The type of entity.
            entity_id: str. The Id of the entity.
            **kwargs: dict(str: *). Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            NotLoggedInException. The user is not logged in.
            InvalidInputException. The given entity type is not supported.
            PageNotFoundException. The page is not found.
            UnauthorizedUserException. The user does not have the credentials
                to manage voice artist.
        """
        if not self.user_id:
            raise base.UserFacingExceptions.NotLoggedInException

        if entity_type != feconf.ENTITY_TYPE_EXPLORATION:
            raise self.InvalidInputException(
                'Unsupported entity_type: %s' % entity_type)

        exploration_rights = rights_manager.get_exploration_rights(
            entity_id, strict=False)
        if exploration_rights is None:
            raise base.UserFacingExceptions.PageNotFoundException

        if rights_manager.check_can_manage_voice_artist_in_activity(
                self.user, exploration_rights):
            return handler(self, entity_type, entity_id, **kwargs)
        else:
            raise base.UserFacingExceptions.UnauthorizedUserException(
                'You do not have credentials to manage voice artists.')

    return test_can_remove_voice_artist


def can_save_exploration(
    handler: Callable[..., _GenericHandlerFunctionReturnType]
) -> Callable[..., _GenericHandlerFunctionReturnType]:
    """Decorator to check whether user can save exploration.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that checks if
        a user has permission to save a given exploration.
    """

    # Here we use type Any because this method can accept arbitrary number of
    # arguments with different types.
    @functools.wraps(handler)
    def test_can_save(
        self: _SelfBaseHandlerType,
        exploration_id: str,
        **kwargs: Any
    ) -> _GenericHandlerFunctionReturnType:
        """Checks if the user can save the exploration.

        Args:
            exploration_id: str. The exploration id.
            **kwargs: dict(str: *). Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            NotLoggedInException. The user is not logged in.
            PageNotFoundException. The page is not found.
            UnauthorizedUserException. The user does not have credentials to
                save changes to this exploration.
        """

        if not self.user_id:
            raise base.UserFacingExceptions.NotLoggedInException

        exploration_rights = rights_manager.get_exploration_rights(
            exploration_id, strict=False)
        if exploration_rights is None:
            raise base.UserFacingExceptions.PageNotFoundException

        if rights_manager.check_can_save_activity(
                self.user, exploration_rights):
            return handler(self, exploration_id, **kwargs)
        else:
            raise base.UserFacingExceptions.UnauthorizedUserException(
                'You do not have permissions to save this exploration.')

    return test_can_save


def can_delete_exploration(
    handler: Callable[..., _GenericHandlerFunctionReturnType]
) -> Callable[..., _GenericHandlerFunctionReturnType]:
    """Decorator to check whether user can delete exploration.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that checks if a user has
        permission to delete a given exploration.
    """

    # Here we use type Any because this method can accept arbitrary number of
    # arguments with different types.
    @functools.wraps(handler)
    def test_can_delete(
        self: _SelfBaseHandlerType, exploration_id: str, **kwargs: Any
    ) -> _GenericHandlerFunctionReturnType:
        """Checks if the user can delete the exploration.

        Args:
            exploration_id: str. The exploration id.
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            NotLoggedInException. The user is not logged in.
            UnauthorizedUserException. The user does not have permissions to
                delete an exploration.
        """
        if not self.user_id:
            raise base.UserFacingExceptions.NotLoggedInException

        exploration_rights = rights_manager.get_exploration_rights(
            exploration_id, strict=False)

        if rights_manager.check_can_delete_activity(
                self.user, exploration_rights):
            return handler(self, exploration_id, **kwargs)
        else:
            raise base.UserFacingExceptions.UnauthorizedUserException(
                'User %s does not have permissions to delete exploration %s' %
                (self.user_id, exploration_id))

    return test_can_delete


def can_suggest_changes_to_exploration(
    handler: Callable[..., _GenericHandlerFunctionReturnType]
) -> Callable[..., _GenericHandlerFunctionReturnType]:
    """Decorator to check whether a user can make suggestions to an
    exploration.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also checks if a user
        has permission to make suggestions to an exploration.
    """

    # Here we use type Any because this method can accept arbitrary number of
    # arguments with different types.
    @functools.wraps(handler)
    def test_can_suggest(
        self: _SelfBaseHandlerType, exploration_id: str, **kwargs: Any
    ) -> _GenericHandlerFunctionReturnType:
        """Checks if the user can make suggestions to an exploration.

        Args:
            exploration_id: str. The exploration id.
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            UnauthorizedUserException. The user does not have credentials to
                give suggestions to an exploration.
        """
        if role_services.ACTION_SUGGEST_CHANGES in self.user.actions:
            return handler(self, exploration_id, **kwargs)
        else:
            raise base.UserFacingExceptions.UnauthorizedUserException(
                'You do not have credentials to give suggestions to this '
                'exploration.')

    return test_can_suggest


def can_suggest_changes(
    handler: Callable[..., _GenericHandlerFunctionReturnType]
) -> Callable[..., _GenericHandlerFunctionReturnType]:
    """Decorator to check whether a user can make suggestions.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also checks if the user
        has permission to make suggestions.
    """

    # Here we use type Any because this method can accept arbitrary number of
    # arguments with different types.
    @functools.wraps(handler)
    def test_can_suggest(
        self: _SelfBaseHandlerType, **kwargs: Any
    ) -> _GenericHandlerFunctionReturnType:
        """Checks if the user can make suggestions to an exploration.

        Args:
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            UnauthorizedUserException. The user does not have credentials to
                make suggestions.
        """
        if role_services.ACTION_SUGGEST_CHANGES in self.user.actions:
            return handler(self, **kwargs)
        else:
            raise base.UserFacingExceptions.UnauthorizedUserException(
                'You do not have credentials to make suggestions.')

    return test_can_suggest


def can_resubmit_suggestion(
    handler: Callable[..., _GenericHandlerFunctionReturnType]
) -> Callable[..., _GenericHandlerFunctionReturnType]:
    """Decorator to check whether a user can resubmit a suggestion."""

    # Here we use type Any because this method can accept arbitrary number of
    # arguments with different types.
    @functools.wraps(handler)
    def test_can_resubmit_suggestion(
        self: _SelfBaseHandlerType, suggestion_id: str, **kwargs: Any
    ) -> _GenericHandlerFunctionReturnType:
        """Checks if the user can edit the given suggestion.

        Args:
            suggestion_id: str. The ID of the suggestion.
            **kwargs: *. The keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            UnauthorizedUserException. The user does not have credentials to
                edit this suggestion.
        """
        suggestion = suggestion_services.get_suggestion_by_id(
            suggestion_id, strict=False
        )
        if suggestion is None:
            raise self.InvalidInputException(
                'No suggestion found with given suggestion id')

        if self.user_id and suggestion_services.check_can_resubmit_suggestion(
                suggestion_id, self.user_id):
            return handler(self, suggestion_id, **kwargs)
        else:
            raise base.UserFacingExceptions.UnauthorizedUserException(
                'You do not have credentials to resubmit this suggestion.')

    return test_can_resubmit_suggestion


def can_publish_exploration(
    handler: Callable[..., _GenericHandlerFunctionReturnType]
) -> Callable[..., _GenericHandlerFunctionReturnType]:
    """Decorator to check whether user can publish exploration.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also checks if the user
        has permission to publish an exploration.
    """

    # Here we use type Any because this method can accept arbitrary number of
    # arguments with different types.
    @functools.wraps(handler)
    def test_can_publish(
        self: _SelfBaseHandlerType,
        exploration_id: str,
        *args: Any,
        **kwargs: Any
    ) -> _GenericHandlerFunctionReturnType:
        """Checks if the user can publish the exploration.

        Args:
            exploration_id: str. The exploration id.
            *args: list(*). A list of arguments.
            **kwargs: *. Keyword arguments present in kwargs.

        Returns:
            *. The return value of the decorated function.

        Raises:
            PageNotFoundException. The page is not found.
            UnauthorizedUserException. The user does not have credentials to
                publish an exploration.
        """
        exploration_rights = rights_manager.get_exploration_rights(
            exploration_id, strict=False)

        if exploration_rights is None:
            raise base.UserFacingExceptions.PageNotFoundException

        if rights_manager.check_can_publish_activity(
                self.user, exploration_rights):
            return handler(self, exploration_id, *args, **kwargs)

        raise base.UserFacingExceptions.UnauthorizedUserException(
            'You do not have credentials to publish this exploration.')

    return test_can_publish


def can_publish_collection(
    handler: Callable[..., _GenericHandlerFunctionReturnType]
) -> Callable[..., _GenericHandlerFunctionReturnType]:
    """Decorator to check whether user can publish collection.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also checks if a user
        has permission to publish a collection.
    """

    # Here we use type Any because this method can accept arbitrary number of
    # arguments with different types.
    @functools.wraps(handler)
    def test_can_publish_collection(
        self: _SelfBaseHandlerType, collection_id: str, **kwargs: Any
    ) -> _GenericHandlerFunctionReturnType:
        """Checks if the user can publish the collection.

        Args:
            collection_id: str. The collection id.
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            PageNotFoundException. The page is not found.
            UnauthorizedUserException. The user does not have credentials to
                publish a collection.
        """
        collection_rights = rights_manager.get_collection_rights(
            collection_id, strict=False)
        if collection_rights is None:
            raise base.UserFacingExceptions.PageNotFoundException

        if rights_manager.check_can_publish_activity(
                self.user, collection_rights):
            return handler(self, collection_id, **kwargs)

        raise self.UnauthorizedUserException(
            'You do not have credentials to publish this collection.')

    return test_can_publish_collection


def can_unpublish_collection(
    handler: Callable[..., _GenericHandlerFunctionReturnType]
) -> Callable[..., _GenericHandlerFunctionReturnType]:
    """Decorator to check whether user can unpublish a given
    collection.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that also checks if
        the user has permission to unpublish a collection.
    """

    # Here we use type Any because this method can accept arbitrary number of
    # arguments with different types.
    @functools.wraps(handler)
    def test_can_unpublish_collection(
        self: _SelfBaseHandlerType, collection_id: str, **kwargs: Any
    ) -> _GenericHandlerFunctionReturnType:
        """Checks if the user can unpublish the collection.

        Args:
            collection_id: str. The collection id.
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            PageNotFoundException. The page is not found.
            UnauthorizedUserException. The user does not have credentials
                to unpublish a collection.
        """
        collection_rights = rights_manager.get_collection_rights(
            collection_id, strict=False)
        if collection_rights is None:
            raise base.UserFacingExceptions.PageNotFoundException

        if rights_manager.check_can_unpublish_activity(
                self.user, collection_rights):
            return handler(self, collection_id, **kwargs)

        raise self.UnauthorizedUserException(
            'You do not have credentials to unpublish this collection.')

    return test_can_unpublish_collection


def can_modify_exploration_roles(
    handler: Callable[..., _GenericHandlerFunctionReturnType]
) -> Callable[..., _GenericHandlerFunctionReturnType]:
    """Decorators to check whether user can manage rights related to an
    exploration.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also checks if
        the user has permission to manage rights related to an
        exploration.
    """

    # Here we use type Any because this method can accept arbitrary number of
    # arguments with different types.
    @functools.wraps(handler)
    def test_can_modify(
        self: _SelfBaseHandlerType, exploration_id: str, **kwargs: Any
    ) -> _GenericHandlerFunctionReturnType:
        """Checks if the user can modify the rights related to an exploration.

        Args:
            exploration_id: str. The exploration id.
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            UnauthorizedUserException. The user does not have credentials to
                change the rights for an exploration.
        """
        exploration_rights = rights_manager.get_exploration_rights(
            exploration_id, strict=False)

        if rights_manager.check_can_modify_core_activity_roles(
                self.user, exploration_rights):
            return handler(self, exploration_id, **kwargs)
        else:
            raise base.UserFacingExceptions.UnauthorizedUserException(
                'You do not have credentials to change rights for this '
                'exploration.')

    return test_can_modify


def can_perform_tasks_in_taskqueue(
    handler: Callable[..., _GenericHandlerFunctionReturnType]
) -> Callable[..., _GenericHandlerFunctionReturnType]:
    """Decorator to ensure that the handler is being called by task scheduler or
    by a superadmin of the application.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also ensures that
        the handler can only be executed if it is called by task scheduler or by
        a superadmin of the application.
    """

    # Here we use type Any because this method can accept arbitrary number of
    # arguments with different types.
    @functools.wraps(handler)
    def test_can_perform(
        self: _SelfBaseHandlerType, **kwargs: Any
    ) -> _GenericHandlerFunctionReturnType:
        """Checks if the handler is called by task scheduler or by a superadmin
        of the application.

        Args:
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            UnauthorizedUserException. The user does not have
                credentials to access the page.
        """
        # The X-AppEngine-QueueName header is set inside AppEngine and if
        # a request from outside comes with this header AppEngine will get
        # rid of it.
        # https://cloud.google.com/tasks/docs/creating-appengine-handlers#reading_app_engine_task_request_headers
        if (self.request.headers.get('X-AppEngine-QueueName') is None and
                not self.current_user_is_super_admin):
            raise self.UnauthorizedUserException(
                'You do not have the credentials to access this page.')

        return handler(self, **kwargs)

    return test_can_perform


def can_perform_cron_tasks(
    handler: Callable[..., _GenericHandlerFunctionReturnType]
) -> Callable[..., _GenericHandlerFunctionReturnType]:
    """Decorator to ensure that the handler is being called by cron or by a
    superadmin of the application.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also ensures that
        the handler can only be executed if it is called by cron or by
        a superadmin of the application.
    """

    # Here we use type Any because this method can accept arbitrary number of
    # arguments with different types.
    @functools.wraps(handler)
    def test_can_perform(
        self: _SelfBaseHandlerType, **kwargs: Any
    ) -> _GenericHandlerFunctionReturnType:
        """Checks if the handler is called by cron or by a superadmin of the
        application.

        Args:
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            UnauthorizedUserException. The user does not have
                credentials to access the page.
        """
        # The X-AppEngine-Cron header is set inside AppEngine and if a request
        # from outside comes with this header AppEngine will get rid of it.
        # https://cloud.google.com/appengine/docs/flexible/python/scheduling-jobs-with-cron-yaml#validating_cron_requests
        if (self.request.headers.get('X-AppEngine-Cron') is None and
                not self.current_user_is_super_admin):
            raise self.UnauthorizedUserException(
                'You do not have the credentials to access this page.')

        return handler(self, **kwargs)

    return test_can_perform


def can_access_learner_dashboard(
    handler: Callable[..., _GenericHandlerFunctionReturnType]
) -> Callable[..., _GenericHandlerFunctionReturnType]:
    """Decorator to check access to learner dashboard.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also checks if
        one can access the learner dashboard.
    """

    # Here we use type Any because this method can accept arbitrary number of
    # arguments with different types.
    @functools.wraps(handler)
    def test_can_access(
        self: _SelfBaseHandlerType, **kwargs: Any
    ) -> _GenericHandlerFunctionReturnType:
        """Checks if the user can access the learner dashboard.

        Args:
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            NotLoggedInException. The user is not logged in.
            UnauthorizedUserException. The user does not have
                credentials to access the page.
        """
        if not self.user_id:
            raise base.UserFacingExceptions.NotLoggedInException

        if role_services.ACTION_ACCESS_LEARNER_DASHBOARD in self.user.actions:
            return handler(self, **kwargs)
        else:
            raise self.UnauthorizedUserException(
                'You do not have the credentials to access this page.')

    return test_can_access


def can_access_learner_groups(
    handler: Callable[..., _GenericHandlerFunctionReturnType]
) -> Callable[..., _GenericHandlerFunctionReturnType]:
    """Decorator to check access to learner groups.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also checks if
        one can access the learner groups.
    """

    # Here we use type Any because this method can accept arbitrary number of
    # arguments with different types.
    @functools.wraps(handler)
    def test_can_access(
        self: _SelfBaseHandlerType, **kwargs: Any
    ) -> _GenericHandlerFunctionReturnType:
        """Checks if the user can access the learner groups.

        Args:
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            NotLoggedInException. The user is not logged in.
            UnauthorizedUserException. The user does not have
                credentials to access the page.
        """
        if not self.user_id:
            raise base.UserFacingExceptions.NotLoggedInException

        if role_services.ACTION_ACCESS_LEARNER_GROUPS in self.user.actions:
            return handler(self, **kwargs)
        else:
            raise self.UnauthorizedUserException(
                'You do not have the credentials to access this page.')

    return test_can_access


def can_manage_question_skill_status(
    handler: Callable[..., _GenericHandlerFunctionReturnType]
) -> Callable[..., _GenericHandlerFunctionReturnType]:
    """Decorator to check whether the user can publish a question and link it
    to a skill.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also checks if the
        given user has permission to publish a question and link it
        to a skill.
    """

    # Here we use type Any because this method can accept arbitrary number of
    # arguments with different types.
    @functools.wraps(handler)
    def test_can_manage_question_skill_status(
        self: _SelfBaseHandlerType, **kwargs: Any
    ) -> _GenericHandlerFunctionReturnType:
        """Checks if the user can publish a question directly.

        Args:
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            NotLoggedInException. The user is not logged in.
            UnauthorizedUserException. The user does not have
                credentials to publish a question.
        """
        if not self.user_id:
            raise base.UserFacingExceptions.NotLoggedInException

        if (
                role_services.ACTION_MANAGE_QUESTION_SKILL_STATUS in
                self.user.actions):
            return handler(self, **kwargs)
        else:
            raise self.UnauthorizedUserException(
                'You do not have credentials to publish a question.')

    return test_can_manage_question_skill_status


def require_user_id_else_redirect_to_homepage(
    handler: Callable[..., _GenericHandlerFunctionReturnType]
) -> Callable[..., Optional[_GenericHandlerFunctionReturnType]]:
    """Decorator that checks if a user_id is associated with the current
    session. If not, the user is redirected to the main page.
    Note that the user may not yet have registered.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also checks
        if a given user_id is associated with the current
        session.
    """

    # Here we use type Any because this method can accept arbitrary number of
    # arguments with different types.
    @functools.wraps(handler)
    def test_login(
        self: _SelfBaseHandlerType, **kwargs: Any
    ) -> Optional[_GenericHandlerFunctionReturnType]:
        """Checks if the user for the current session is logged in.
        If not, redirects the user to the home page.

        Args:
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.
        """
        if not self.user_id:
            self.redirect('/')
            return None
        return handler(self, **kwargs)

    return test_login


def can_edit_topic(
    handler: Callable[..., _GenericHandlerFunctionReturnType]
) -> Callable[..., _GenericHandlerFunctionReturnType]:
    """Decorator to check whether the user can edit given topic."""

    # Here we use type Any because this method can accept arbitrary number of
    # arguments with different types.
    @functools.wraps(handler)
    def test_can_edit(
        self: _SelfBaseHandlerType, topic_id: str, *args: Any, **kwargs: Any
    ) -> _GenericHandlerFunctionReturnType:
        """Checks whether the user can edit a given topic.

        Args:
            topic_id: str. The topic id.
            *args: list(*). The arguments from the calling function.
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            NotLoggedInException. The user is not logged in.
            PageNotFoundException. The page is not found.
            UnauthorizedUserException. The user does not have
                credentials to edit a topic.
        """
        if not self.user_id:
            raise base.UserFacingExceptions.NotLoggedInException

        try:
            topic_domain.Topic.require_valid_topic_id(topic_id)
        except utils.ValidationError as e:
            raise self.PageNotFoundException(e)

        topic = topic_fetchers.get_topic_by_id(topic_id, strict=False)
        topic_rights = topic_fetchers.get_topic_rights(topic_id, strict=False)
        if topic_rights is None or topic is None:
            raise base.UserFacingExceptions.PageNotFoundException

        if topic_services.check_can_edit_topic(self.user, topic_rights):
            return handler(self, topic_id, *args, **kwargs)
        else:
            raise self.UnauthorizedUserException(
                'You do not have credentials to edit this topic.')

    return test_can_edit


def can_edit_question(
    handler: Callable[..., _GenericHandlerFunctionReturnType]
) -> Callable[..., _GenericHandlerFunctionReturnType]:
    """Decorator to check whether the user can edit given question.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also checks
        whether the user has permission to edit a given question.
    """

    # Here we use type Any because this method can accept arbitrary number of
    # arguments with different types.
    @functools.wraps(handler)
    def test_can_edit(
        self: _SelfBaseHandlerType, question_id: str, **kwargs: Any
    ) -> _GenericHandlerFunctionReturnType:
        """Checks whether the user can edit the given question.

        Args:
            question_id: str. The question id.
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            NotLoggedInException. The user is not logged in.
            PageNotFoundException. The page is not found.
            UnauthorizedUserException. The user does not have
                credentials to edit a question.
        """
        if not self.user_id:
            raise base.UserFacingExceptions.NotLoggedInException

        question = question_services.get_question_by_id(
            question_id, strict=False)
        if question is None:
            raise self.PageNotFoundException
        if role_services.ACTION_EDIT_ANY_QUESTION in self.user.actions:
            return handler(self, question_id, **kwargs)
        else:
            raise self.UnauthorizedUserException(
                'You do not have credentials to edit this question.')

    return test_can_edit


def can_play_question(
    handler: Callable[..., _GenericHandlerFunctionReturnType]
) -> Callable[..., _GenericHandlerFunctionReturnType]:
    """Decorator to check whether the user can play given question.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also checks
        whether the user can play a given question.
    """

    # Here we use type Any because this method can accept arbitrary number of
    # arguments with different types.
    @functools.wraps(handler)
    def test_can_play_question(
        self: _SelfBaseHandlerType, question_id: str, **kwargs: Any
    ) -> _GenericHandlerFunctionReturnType:
        """Checks whether the user can play the given question.

        Args:
            question_id: str. The question id.
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            PageNotFoundException. The page is not found.
        """
        question = question_services.get_question_by_id(
            question_id, strict=False)
        if question is None:
            raise self.PageNotFoundException
        return handler(self, question_id, **kwargs)

    return test_can_play_question


def can_view_question_editor(
    handler: Callable[..., _GenericHandlerFunctionReturnType]
) -> Callable[..., _GenericHandlerFunctionReturnType]:
    """Decorator to check whether the user can view any question editor.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also checks
        if the user has permission to view any question editor.
    """

    # Here we use type Any because this method can accept arbitrary number of
    # arguments with different types.
    @functools.wraps(handler)
    def test_can_view_question_editor(
        self: _SelfBaseHandlerType, question_id: str, **kwargs: Any
    ) -> _GenericHandlerFunctionReturnType:
        """Checks whether the user can view the question editor.

        Args:
            question_id: str. The question id.
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            NotLoggedInException. The user is not logged in.
            PageNotFoundException. The page is not found.
            UnauthorizedUserException. The user does not have
                enough rights to access the question editor.
        """
        if not self.user_id:
            raise self.NotLoggedInException

        question = question_services.get_question_by_id(
            question_id, strict=False)
        if question is None:
            raise self.PageNotFoundException
        if role_services.ACTION_VISIT_ANY_QUESTION_EDITOR_PAGE in (
                self.user.actions):
            return handler(self, question_id, **kwargs)
        else:
            raise self.UnauthorizedUserException(
                '%s does not have enough rights to access the questions editor'
                % self.user_id)

    return test_can_view_question_editor


def can_delete_question(
    handler: Callable[..., _GenericHandlerFunctionReturnType]
) -> Callable[..., _GenericHandlerFunctionReturnType]:
    """Decorator to check whether the user can delete a question.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also checks
        if the user has permission to delete a question.
    """

    # Here we use type Any because this method can accept arbitrary number of
    # arguments with different types.
    @functools.wraps(handler)
    def test_can_delete_question(
        self: _SelfBaseHandlerType, question_id: str, **kwargs: Any
    ) -> _GenericHandlerFunctionReturnType:
        """Checks whether the user can delete a given question.

        Args:
            question_id: str. The question id.
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            NotLoggedInException. The user is not logged in.
            UnauthorizedUserException. The user does not have
                enough rights to delete the question.
        """
        if not self.user_id:
            raise self.NotLoggedInException

        user_actions_info = user_services.get_user_actions_info(self.user_id)

        if (role_services.ACTION_DELETE_ANY_QUESTION in
                user_actions_info.actions):
            return handler(self, question_id, **kwargs)
        else:
            raise self.UnauthorizedUserException(
                '%s does not have enough rights to delete the'
                ' question.' % self.user_id)

    return test_can_delete_question


def can_add_new_story_to_topic(
    handler: Callable[..., _GenericHandlerFunctionReturnType]
) -> Callable[..., _GenericHandlerFunctionReturnType]:
    """Decorator to check whether the user can add a story to a given topic.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also checks
        if the user has permission to add a story to a given topic.
    """

    # Here we use type Any because this method can accept arbitrary number of
    # arguments with different types.
    @functools.wraps(handler)
    def test_can_add_story(
        self: _SelfBaseHandlerType, topic_id: str, **kwargs: Any
    ) -> _GenericHandlerFunctionReturnType:
        """Checks whether the user can add a story to
        a given topic.

        Args:
            topic_id: str. The topic id.
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            NotLoggedInException. The user is not logged in.
            PageNotFoundException. The page is not found.
            UnauthorizedUserException. The user does not have
                credentials to add a story to a given topic.
        """
        if not self.user_id:
            raise base.UserFacingExceptions.NotLoggedInException

        try:
            topic_domain.Topic.require_valid_topic_id(topic_id)
        except utils.ValidationError as e:
            raise self.PageNotFoundException(e)

        topic = topic_fetchers.get_topic_by_id(topic_id, strict=False)
        topic_rights = topic_fetchers.get_topic_rights(topic_id, strict=False)
        if topic_rights is None or topic is None:
            raise base.UserFacingExceptions.PageNotFoundException

        if topic_services.check_can_edit_topic(self.user, topic_rights):
            return handler(self, topic_id, **kwargs)
        else:
            raise self.UnauthorizedUserException(
                'You do not have credentials to add a story to this topic.')

    return test_can_add_story


def can_edit_story(
    handler: Callable[..., _GenericHandlerFunctionReturnType]
) -> Callable[..., _GenericHandlerFunctionReturnType]:
    """Decorator to check whether the user can edit a story belonging to a given
    topic.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also checks if
        a user has permission to edit a story for a given topic.
    """

    # Here we use type Any because this method can accept arbitrary number of
    # arguments with different types.
    @functools.wraps(handler)
    def test_can_edit_story(
        self: _SelfBaseHandlerType, story_id: str, **kwargs: Any
    ) -> _GenericHandlerFunctionReturnType:
        """Checks whether the user can edit a story belonging to
        a given topic.

        Args:
            story_id: str. The story id.
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            NotLoggedInException. The user is not logged in.
            PageNotFoundException. The page is not found.
            UnauthorizedUserException. The user does not have
                credentials to edit a story belonging to a
                given topic.
        """
        if not self.user_id:
            raise base.UserFacingExceptions.NotLoggedInException
        story_domain.Story.require_valid_story_id(story_id)
        story = story_fetchers.get_story_by_id(story_id, strict=False)
        if story is None:
            raise base.UserFacingExceptions.PageNotFoundException

        topic_id = story.corresponding_topic_id
        topic_rights = topic_fetchers.get_topic_rights(topic_id, strict=False)
        topic = topic_fetchers.get_topic_by_id(topic_id, strict=False)
        if topic_rights is None or topic is None:
            raise base.UserFacingExceptions.PageNotFoundException

        canonical_story_ids = topic.get_canonical_story_ids()
        if story_id not in canonical_story_ids:
            raise base.UserFacingExceptions.PageNotFoundException

        if topic_services.check_can_edit_topic(self.user, topic_rights):
            return handler(self, story_id, **kwargs)
        else:
            raise self.UnauthorizedUserException(
                'You do not have credentials to edit this story.')

    return test_can_edit_story


def can_edit_skill(
    handler: Callable[..., _GenericHandlerFunctionReturnType]
) -> Callable[..., _GenericHandlerFunctionReturnType]:
    """Decorator to check whether the user can edit a skill, which can be
    independent or belong to a topic.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also checks if
        the user has permission to edit a skill.
    """

    # Here we use type Any because this method can accept arbitrary number of
    # arguments with different types.
    @functools.wraps(handler)
    def test_can_edit_skill(
        self: _SelfBaseHandlerType, skill_id: str, **kwargs: Any
    ) -> _GenericHandlerFunctionReturnType:
        """Test to see if user can edit a given skill by checking if
        logged in and using can_user_edit_skill.

        Args:
            skill_id: str. The skill ID.
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            NotLoggedInException. The user is not logged in.
            PageNotFoundException. The given page cannot be found.
            UnauthorizedUserException. The user does not have the
                credentials to edit the given skill.
        """
        if not self.user_id:
            raise base.UserFacingExceptions.NotLoggedInException

        if role_services.ACTION_EDIT_SKILL in self.user.actions:
            return handler(self, skill_id, **kwargs)
        else:
            raise self.UnauthorizedUserException(
                'You do not have credentials to edit this skill.')

    return test_can_edit_skill


def can_submit_images_to_questions(
    handler: Callable[..., _GenericHandlerFunctionReturnType]
) -> Callable[..., _GenericHandlerFunctionReturnType]:
    """Decorator to check whether the user can submit images to questions.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also checks if
        the user has permission to submit a question.
    """

    # Here we use type Any because this method can accept arbitrary number of
    # arguments with different types.
    @functools.wraps(handler)
    def test_can_submit_images_to_questions(
        self: _SelfBaseHandlerType, skill_id: str, **kwargs: Any
    ) -> _GenericHandlerFunctionReturnType:
        """Test to see if user can submit images to questions.

        Args:
            skill_id: str. The skill ID.
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            NotLoggedInException. The user is not logged in.
            PageNotFoundException. The given page cannot be found.
            UnauthorizedUserException. The user does not have the
                credentials to edit the given skill.
        """
        if not self.user_id:
            raise base.UserFacingExceptions.NotLoggedInException

        if role_services.ACTION_SUGGEST_CHANGES in self.user.actions:
            return handler(self, skill_id, **kwargs)
        else:
            raise self.UnauthorizedUserException(
                'You do not have credentials to submit images to questions.')

    return test_can_submit_images_to_questions


def can_delete_skill(
    handler: Callable[..., _GenericHandlerFunctionReturnType]
) -> Callable[..., _GenericHandlerFunctionReturnType]:
    """Decorator to check whether the user can delete a skill.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also checks
        if the user can delete a skill.
    """

    # Here we use type Any because this method can accept arbitrary number of
    # arguments with different types.
    @functools.wraps(handler)
    def test_can_delete_skill(
        self: _SelfBaseHandlerType, **kwargs: Any
    ) -> _GenericHandlerFunctionReturnType:
        """Checks whether the user can delete a skill.

        Args:
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            NotLoggedInException. The user is not logged in.
            UnauthorizedUserException. The user does not have
                credentials to delete a skill.
        """
        if not self.user_id:
            raise base.UserFacingExceptions.NotLoggedInException

        user_actions_info = user_services.get_user_actions_info(self.user_id)
        if role_services.ACTION_DELETE_ANY_SKILL in user_actions_info.actions:
            return handler(self, **kwargs)
        else:
            raise self.UnauthorizedUserException(
                'You do not have credentials to delete the skill.')

    return test_can_delete_skill


def can_create_skill(
    handler: Callable[..., _GenericHandlerFunctionReturnType]
) -> Callable[..., _GenericHandlerFunctionReturnType]:
    """Decorator to check whether the user can create a skill, which can be
    independent or added to a topic.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also checks if
        the user has permission to create a skill.
    """

    # Here we use type Any because this method can accept arbitrary number of
    # arguments with different types.
    @functools.wraps(handler)
    def test_can_create_skill(
        self: _SelfBaseHandlerType, **kwargs: Any
    ) -> _GenericHandlerFunctionReturnType:
        """Checks whether the user can create a skill, which can be
        independent or belong to a topic.

        Args:
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            NotLoggedInException. The user is not logged in.
            UnauthorizedUserException. The user does not have
                credentials to create a skill.
        """
        if not self.user_id:
            raise base.UserFacingExceptions.NotLoggedInException

        user_actions_info = user_services.get_user_actions_info(self.user_id)
        if role_services.ACTION_CREATE_NEW_SKILL in user_actions_info.actions:
            return handler(self, **kwargs)
        else:
            raise self.UnauthorizedUserException(
                'You do not have credentials to create a skill.')

    return test_can_create_skill


def can_delete_story(
    handler: Callable[..., _GenericHandlerFunctionReturnType]
) -> Callable[..., _GenericHandlerFunctionReturnType]:
    """Decorator to check whether the user can delete a story in a given
    topic.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also checks
        whether the user has permission to delete a story in a
        given topic.
    """

    # Here we use type Any because this method can accept arbitrary number of
    # arguments with different types.
    @functools.wraps(handler)
    def test_can_delete_story(
        self: _SelfBaseHandlerType, story_id: str, **kwargs: Any
    ) -> _GenericHandlerFunctionReturnType:
        """Checks whether the user can delete a story in
        a given topic.

        Args:
            story_id: str. The story ID.
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            NotLoggedInException. The user is not logged in.
            PageNotFoundException. The page is not found.
            UnauthorizedUserException. The user does not have
                credentials to delete a story.
        """
        if not self.user_id:
            raise base.UserFacingExceptions.NotLoggedInException

        story = story_fetchers.get_story_by_id(story_id, strict=False)
        if story is None:
            raise base.UserFacingExceptions.PageNotFoundException
        topic_id = story.corresponding_topic_id
        topic = topic_fetchers.get_topic_by_id(topic_id, strict=False)
        topic_rights = topic_fetchers.get_topic_rights(topic_id, strict=False)
        if topic_rights is None or topic is None:
            raise base.UserFacingExceptions.PageNotFoundException

        if topic_services.check_can_edit_topic(self.user, topic_rights):
            return handler(self, story_id, **kwargs)
        else:
            raise self.UnauthorizedUserException(
                'You do not have credentials to delete this story.')

    return test_can_delete_story


def can_delete_topic(
    handler: Callable[..., _GenericHandlerFunctionReturnType]
) -> Callable[..., _GenericHandlerFunctionReturnType]:
    """Decorator to check whether the user can delete a topic.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also
        checks if the user can delete a given topic.
    """

    # Here we use type Any because this method can accept arbitrary number of
    # arguments with different types.
    @functools.wraps(handler)
    def test_can_delete_topic(
        self: _SelfBaseHandlerType, topic_id: str, **kwargs: Any
    ) -> _GenericHandlerFunctionReturnType:
        """Checks whether the user can delete a given topic.

        Args:
            topic_id: str. The topic id.
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            NotLoggedInException. The user is not logged in.
            UnauthorizedUserException. The user does not have
                enough rights to delete a given topic.
        """
        if not self.user_id:
            raise self.NotLoggedInException

        try:
            topic_domain.Topic.require_valid_topic_id(topic_id)
        except utils.ValidationError as e:
            raise self.PageNotFoundException(e)

        user_actions_info = user_services.get_user_actions_info(self.user_id)

        if role_services.ACTION_DELETE_TOPIC in user_actions_info.actions:
            return handler(self, topic_id, **kwargs)
        else:
            raise self.UnauthorizedUserException(
                '%s does not have enough rights to delete the'
                ' topic.' % self.user_id)

    return test_can_delete_topic


def can_create_topic(
    handler: Callable[..., _GenericHandlerFunctionReturnType]
) -> Callable[..., _GenericHandlerFunctionReturnType]:
    """Decorator to check whether the user can create a topic.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that also checks
        if the user can create a topic.
    """

    # Here we use type Any because this method can accept arbitrary number of
    # arguments with different types.
    @functools.wraps(handler)
    def test_can_create_topic(
        self: _SelfBaseHandlerType, **kwargs: Any
    ) -> _GenericHandlerFunctionReturnType:
        """Checks whether the user can create a topic.

        Args:
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            NotLoggedInException. The user is not logged in.
            UnauthorizedUserException. The user does not have
                enough rights to create a topic.
        """
        if not self.user_id:
            raise self.NotLoggedInException

        user_actions_info = user_services.get_user_actions_info(self.user_id)

        if role_services.ACTION_CREATE_NEW_TOPIC in user_actions_info.actions:
            return handler(self, **kwargs)
        else:
            raise self.UnauthorizedUserException(
                '%s does not have enough rights to create a'
                ' topic.' % self.user_id)

    return test_can_create_topic


def can_access_topics_and_skills_dashboard(
    handler: Callable[..., _GenericHandlerFunctionReturnType]
) -> Callable[..., _GenericHandlerFunctionReturnType]:
    """Decorator to check whether the user can access the topics and skills
    dashboard.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that also checks if
        the user can access the topics and skills dashboard.
    """

    # Here we use type Any because this method can accept arbitrary number of
    # arguments with different types.
    @functools.wraps(handler)
    def test_can_access_topics_and_skills_dashboard(
        self: _SelfBaseHandlerType, **kwargs: Any
    ) -> _GenericHandlerFunctionReturnType:
        """Checks whether the user can access the topics and skills
        dashboard.

        Args:
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            NotLoggedInException. The user is not logged in.
            UnauthorizedUserException. The user does not have
                enough rights to access the topics and skills
                dashboard.
        """
        if not self.user_id:
            raise self.NotLoggedInException

        user_actions_info = user_services.get_user_actions_info(self.user_id)

        if (
                role_services.ACTION_ACCESS_TOPICS_AND_SKILLS_DASHBOARD in
                user_actions_info.actions):
            return handler(self, **kwargs)
        else:
            raise self.UnauthorizedUserException(
                '%s does not have enough rights to access the topics and skills'
                ' dashboard.' % self.user_id)

    return test_can_access_topics_and_skills_dashboard


def can_view_any_topic_editor(
    handler: Callable[..., _GenericHandlerFunctionReturnType]
) -> Callable[..., _GenericHandlerFunctionReturnType]:
    """Decorator to check whether the user can view any topic editor.

    Args:
        handler: function. The newly decorated function.

    Returns:
        function. The newly decorated function that also checks
        if the user can view any topic editor.
    """

    # Here we use type Any because this method can accept arbitrary number of
    # arguments with different types.
    @functools.wraps(handler)
    def test_can_view_any_topic_editor(
        self: _SelfBaseHandlerType, topic_id: str, **kwargs: Any
    ) -> _GenericHandlerFunctionReturnType:
        """Checks whether the user can view any topic editor.

        Args:
            topic_id: str. The topic id.
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            NotLoggedInException. The user is not logged in.
            UnauthorizedUserException. The user does not have
                enough rights to view any topic editor.
        """
        if not self.user_id:
            raise self.NotLoggedInException
        try:
            topic_domain.Topic.require_valid_topic_id(topic_id)
        except utils.ValidationError as e:
            raise self.PageNotFoundException(e)

        user_actions_info = user_services.get_user_actions_info(self.user_id)

        if (
                role_services.ACTION_VISIT_ANY_TOPIC_EDITOR_PAGE in
                user_actions_info.actions):
            return handler(self, topic_id, **kwargs)
        else:
            raise self.UnauthorizedUserException(
                '%s does not have enough rights to view any topic editor.'
                % self.user_id)

    return test_can_view_any_topic_editor


def can_manage_rights_for_topic(
    handler: Callable[..., _GenericHandlerFunctionReturnType]
) -> Callable[..., _GenericHandlerFunctionReturnType]:
    """Decorator to check whether the user can manage a topic's rights.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that also checks
        if the user can manage a given topic's rights.
    """

    # Here we use type Any because this method can accept arbitrary number of
    # arguments with different types.
    @functools.wraps(handler)
    def test_can_manage_topic_rights(
        self: _SelfBaseHandlerType, topic_id: str, **kwargs: Any
    ) -> _GenericHandlerFunctionReturnType:
        """Checks whether the user can manage a topic's rights.

        Args:
            topic_id: str. The topic id.
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            NotLoggedInException. The user is not logged in.
            UnauthorizedUserException. The user does not have
                enough rights to assign roles for a given topic.
        """
        if not self.user_id:
            raise self.NotLoggedInException

        user_actions_info = user_services.get_user_actions_info(self.user_id)

        if (
                role_services.ACTION_MANAGE_TOPIC_RIGHTS in
                user_actions_info.actions):
            return handler(self, topic_id, **kwargs)
        else:
            raise self.UnauthorizedUserException(
                '%s does not have enough rights to assign roles for the '
                'topic.' % self.user_id)

    return test_can_manage_topic_rights


def can_change_topic_publication_status(
    handler: Callable[..., _GenericHandlerFunctionReturnType]
) -> Callable[..., _GenericHandlerFunctionReturnType]:
    """Decorator to check whether the user can publish or unpublish a topic.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now checks
        if the user can publish or unpublish a topic.
    """

    # Here we use type Any because this method can accept arbitrary number of
    # arguments with different types.
    @functools.wraps(handler)
    def test_can_change_topic_publication_status(
        self: _SelfBaseHandlerType, topic_id: str, **kwargs: Any
    ) -> _GenericHandlerFunctionReturnType:
        """Checks whether the user can can publish or unpublish a topic.

        Args:
            topic_id: str. The topic id.
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            NotLoggedInException. The user is not logged in.
            UnauthorizedUserException. The user does not have
                enough rights to publish or unpublish the topic..
        """
        if not self.user_id:
            raise self.NotLoggedInException

        try:
            topic_domain.Topic.require_valid_topic_id(topic_id)
        except utils.ValidationError as e:
            raise self.PageNotFoundException(e)

        user_actions_info = user_services.get_user_actions_info(self.user_id)

        if (
                role_services.ACTION_CHANGE_TOPIC_STATUS in
                user_actions_info.actions):
            return handler(self, topic_id, **kwargs)
        else:
            raise self.UnauthorizedUserException(
                '%s does not have enough rights to publish or unpublish the '
                'topic.' % self.user_id)

    return test_can_change_topic_publication_status


def can_access_topic_viewer_page(
    handler: Callable[..., _GenericHandlerFunctionReturnType]
) -> Callable[..., Optional[_GenericHandlerFunctionReturnType]]:
    """Decorator to check whether user can access topic viewer page.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now checks
        if the user can access the given topic viewer page.
    """

    # Here we use type Any because this method can accept arbitrary number of
    # arguments with different types.
    @functools.wraps(handler)
    def test_can_access(
        self: _SelfBaseHandlerType,
        classroom_url_fragment: str,
        topic_url_fragment: str,
        **kwargs: Any
    ) -> Optional[_GenericHandlerFunctionReturnType]:
        """Checks if the user can access topic viewer page.

        Args:
            topic_url_fragment: str. The url fragment of the topic.
            classroom_url_fragment: str. The classroom url fragment.
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            PageNotFoundException. The given page cannot be found.
            EntityNotFoundError. The TopicRights with ID topic_id was not
                found in the datastore.
        """
        if topic_url_fragment != topic_url_fragment.lower():
            _redirect_based_on_return_type(
                self, '/learn/%s/%s' % (
                    classroom_url_fragment,
                    topic_url_fragment.lower()),
                self.GET_HANDLER_ERROR_RETURN_TYPE)
            return None

        topic = topic_fetchers.get_topic_by_url_fragment(
            topic_url_fragment)

        if topic is None:
            _redirect_based_on_return_type(
                self, '/learn/%s' % classroom_url_fragment,
                self.GET_HANDLER_ERROR_RETURN_TYPE)
            return None

        verified_classroom_url_fragment = (
            classroom_services.get_classroom_url_fragment_for_topic_id(
                topic.id))
        if classroom_url_fragment != verified_classroom_url_fragment:
            url_substring = topic_url_fragment
            _redirect_based_on_return_type(
                self, '/learn/%s/%s' % (
                    verified_classroom_url_fragment,
                    url_substring),
                self.GET_HANDLER_ERROR_RETURN_TYPE)
            return None

        topic_id = topic.id
        topic_rights = topic_fetchers.get_topic_rights(
            topic_id, strict=True)
        user_actions_info = user_services.get_user_actions_info(self.user_id)

        if (
                topic_rights.topic_is_published or
                role_services.ACTION_VISIT_ANY_TOPIC_EDITOR_PAGE in
                user_actions_info.actions):
            return handler(self, topic.name, **kwargs)
        else:
            raise self.PageNotFoundException

    return test_can_access


def can_access_story_viewer_page(
    handler: Callable[..., _GenericHandlerFunctionReturnType]
) -> Callable[..., Optional[_GenericHandlerFunctionReturnType]]:
    """Decorator to check whether user can access story viewer page.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now checks
        if the user can access the given story viewer page.
    """

    # Here we use type Any because this method can accept arbitrary number of
    # arguments with different types.
    @functools.wraps(handler)
    def test_can_access(
        self: _SelfBaseHandlerType,
        classroom_url_fragment: str,
        topic_url_fragment: str,
        story_url_fragment: str,
        *args: Any,
        **kwargs: Any
    ) -> Optional[_GenericHandlerFunctionReturnType]:
        """Checks if the user can access story viewer page.

        Args:
            classroom_url_fragment: str. The classroom url fragment.
            topic_url_fragment: str. The url fragment of the topic
                associated with the story.
            story_url_fragment: str. The story url fragment.
            *args: list(*). A list of arguments from the calling function.
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            PageNotFoundException. The given page cannot be found.
        """
        if story_url_fragment != story_url_fragment.lower():
            _redirect_based_on_return_type(
                self, '/learn/%s/%s/story/%s' % (
                    classroom_url_fragment,
                    topic_url_fragment,
                    story_url_fragment.lower()),
                self.GET_HANDLER_ERROR_RETURN_TYPE)
            return None

        story = story_fetchers.get_story_by_url_fragment(story_url_fragment)

        if story is None:
            _redirect_based_on_return_type(
                self,
                '/learn/%s/%s/story' %
                (classroom_url_fragment, topic_url_fragment),
                self.GET_HANDLER_ERROR_RETURN_TYPE)
            return None

        story_is_published = False
        topic_is_published = False
        topic_id = story.corresponding_topic_id
        story_id = story.id
        user_actions_info = user_services.get_user_actions_info(self.user_id)
        if topic_id:
            topic = topic_fetchers.get_topic_by_id(topic_id)
            if topic.url_fragment != topic_url_fragment:
                _redirect_based_on_return_type(
                    self,
                    '/learn/%s/%s/story/%s' % (
                        classroom_url_fragment,
                        topic.url_fragment,
                        story_url_fragment),
                    self.GET_HANDLER_ERROR_RETURN_TYPE)
                return None

            verified_classroom_url_fragment = (
                classroom_services.get_classroom_url_fragment_for_topic_id(
                    topic.id))
            if classroom_url_fragment != verified_classroom_url_fragment:
                url_substring = '%s/story/%s' % (
                    topic_url_fragment, story_url_fragment)
                _redirect_based_on_return_type(
                    self, '/learn/%s/%s' % (
                        verified_classroom_url_fragment,
                        url_substring),
                    self.GET_HANDLER_ERROR_RETURN_TYPE)
                return None
            topic_rights = topic_fetchers.get_topic_rights(topic_id)
            topic_is_published = topic_rights.topic_is_published
            all_story_references = topic.get_all_story_references()
            for reference in all_story_references:
                if reference.story_id == story_id:
                    story_is_published = reference.story_is_published

        if (
                (story_is_published and topic_is_published) or
                role_services.ACTION_VISIT_ANY_TOPIC_EDITOR_PAGE in
                user_actions_info.actions):
            return handler(self, story_id, *args, **kwargs)
        else:
            raise self.PageNotFoundException

    return test_can_access


def can_access_subtopic_viewer_page(
    handler: Callable[..., _GenericHandlerFunctionReturnType]
) -> Callable[..., Optional[_GenericHandlerFunctionReturnType]]:
    """Decorator to check whether user can access subtopic page viewer.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now checks
        if the user can access the given subtopic viewer page.
    """

    # Here we use type Any because this method can accept arbitrary number of
    # arguments with different types.
    @functools.wraps(handler)
    def test_can_access(  # pylint: disable=too-many-return-statements
        self: _SelfBaseHandlerType,
        classroom_url_fragment: str,
        topic_url_fragment: str,
        subtopic_url_fragment: str,
        **kwargs: Any
    ) -> Optional[_GenericHandlerFunctionReturnType]:
        """Checks if the user can access subtopic viewer page.

        Args:
            classroom_url_fragment: str. The classroom url fragment.
            topic_url_fragment: str. The url fragment of the topic
                associated with the subtopic.
            subtopic_url_fragment: str. The url fragment of the Subtopic.
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of decorated function.

        Raises:
            PageNotFoundException. The given page cannot be found.
        """
        if subtopic_url_fragment != subtopic_url_fragment.lower():
            _redirect_based_on_return_type(
                self, '/learn/%s/%s/revision/%s' % (
                    classroom_url_fragment,
                    topic_url_fragment,
                    subtopic_url_fragment.lower()),
                self.GET_HANDLER_ERROR_RETURN_TYPE)
            return None

        topic = topic_fetchers.get_topic_by_url_fragment(topic_url_fragment)
        subtopic_id = None

        if topic is None:
            _redirect_based_on_return_type(
                self, '/learn/%s' % classroom_url_fragment,
                self.GET_HANDLER_ERROR_RETURN_TYPE)
            return None

        user_actions_info = user_services.get_user_actions_info(self.user_id)
        topic_rights = topic_fetchers.get_topic_rights(topic.id)

        if (
                (topic_rights is None or not topic_rights.topic_is_published)
                and role_services.ACTION_VISIT_ANY_TOPIC_EDITOR_PAGE not in
                user_actions_info.actions):
            _redirect_based_on_return_type(
                self, '/learn/%s' % classroom_url_fragment,
                self.GET_HANDLER_ERROR_RETURN_TYPE)
            return None

        for subtopic in topic.subtopics:
            if subtopic.url_fragment == subtopic_url_fragment:
                subtopic_id = subtopic.id

        if not subtopic_id:
            _redirect_based_on_return_type(
                self,
                '/learn/%s/%s/revision' %
                (classroom_url_fragment, topic_url_fragment),
                self.GET_HANDLER_ERROR_RETURN_TYPE)
            return None

        verified_classroom_url_fragment = (
            classroom_services.get_classroom_url_fragment_for_topic_id(
                topic.id))
        if classroom_url_fragment != verified_classroom_url_fragment:
            url_substring = '%s/revision/%s' % (
                topic_url_fragment, subtopic_url_fragment)
            _redirect_based_on_return_type(
                self, '/learn/%s/%s' % (
                    verified_classroom_url_fragment,
                    url_substring),
                self.GET_HANDLER_ERROR_RETURN_TYPE)
            return None

        subtopic_page = subtopic_page_services.get_subtopic_page_by_id(
            topic.id, subtopic_id, strict=False)
        if subtopic_page is None:
            _redirect_based_on_return_type(
                self,
                '/learn/%s/%s/revision' % (
                    classroom_url_fragment, topic_url_fragment),
                self.GET_HANDLER_ERROR_RETURN_TYPE)
            return None
        else:
            return handler(self, topic.name, subtopic_id, **kwargs)

    return test_can_access


def get_decorator_for_accepting_suggestion(
    decorator: Callable[..., Callable[..., _GenericHandlerFunctionReturnType]]
) -> Callable[..., Callable[..., _GenericHandlerFunctionReturnType]]:
    """Function that takes a decorator as an argument and then applies some
    common checks and then checks the permissions specified by the passed in
    decorator.

    Args:
        decorator: function. The decorator to be used to verify permissions
            for accepting/rejecting suggestions.

    Returns:
        function. The new decorator which includes all the permission checks for
        accepting/rejecting suggestions. These permissions include:
            - Admins can accept/reject any suggestion.
            - Users with scores above threshold can accept/reject any suggestion
            in that category.
            - Any user with edit permissions to the target entity can
            accept/reject suggestions for that entity.
    """
    def generate_decorator_for_handler(
        handler: Callable[..., _GenericHandlerFunctionReturnType]
    ) -> Callable[..., _GenericHandlerFunctionReturnType]:
        """Function that generates a decorator for a given handler.

        Args:
            handler: function. The function to be decorated.

        Returns:
            function. The newly decorated function that has common checks and
            permissions specified by passed in decorator.

        Raises:
            NotLoggedInException. The user is not logged in.
        """

        # Here we use type Any because this method can accept arbitrary number
        # of arguments with different types.
        @functools.wraps(handler)
        def test_can_accept_suggestion(
            self: _SelfBaseHandlerType,
            target_id: str,
            suggestion_id: str,
            **kwargs: Any
        ) -> _GenericHandlerFunctionReturnType:
            """Returns a (possibly-decorated) handler to test whether a
            suggestion can be accepted based on the user actions and roles.

            Args:
                target_id: str. The target id.
                suggestion_id: str. The suggestion id.
                **kwargs: *. Keyword arguments.

            Returns:
                function. The (possibly-decorated) handler for accepting a
                suggestion.

            Raises:
                NotLoggedInException. The user is not logged in.
            """
            if not self.user_id:
                raise base.UserFacingExceptions.NotLoggedInException
            user_actions = user_services.get_user_actions_info(
                self.user_id
            ).actions
            if role_services.ACTION_ACCEPT_ANY_SUGGESTION in user_actions:
                return handler(self, target_id, suggestion_id, **kwargs)

            if len(suggestion_id.split('.')) != 3:
                raise self.InvalidInputException(
                    'Invalid format for suggestion_id.'
                    ' It must contain 3 parts separated by \'.\'')

            suggestion = suggestion_services.get_suggestion_by_id(
                suggestion_id, strict=False
            )

            if suggestion is None:
                raise self.PageNotFoundException

            # TODO(#6671): Currently, the can_user_review_category is
            # not in use as the suggestion scoring system is not enabled.
            # Remove this check once the new scoring structure gets implemented.
            if suggestion_services.can_user_review_category(
                    self.user_id, suggestion.score_category):
                return handler(self, target_id, suggestion_id, **kwargs)

            if suggestion.suggestion_type == (
                    feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT):
                if user_services.can_review_translation_suggestions(
                        self.user_id,
                        language_code=suggestion.change.language_code):
                    return handler(self, target_id, suggestion_id, **kwargs)
            elif suggestion.suggestion_type == (
                    feconf.SUGGESTION_TYPE_ADD_QUESTION):
                if user_services.can_review_question_suggestions(self.user_id):
                    return handler(self, target_id, suggestion_id, **kwargs)

            return decorator(handler)(self, target_id, suggestion_id, **kwargs)

        return test_can_accept_suggestion

    return generate_decorator_for_handler


def can_view_reviewable_suggestions(
    handler: Callable[..., _GenericHandlerFunctionReturnType]
) -> Callable[..., Optional[_GenericHandlerFunctionReturnType]]:
    """Decorator to check whether user can view the list of suggestions that
    they are allowed to review.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now checks
        if the user can view reviewable suggestions.
    """

    # Here we use type Any because this method can accept arbitrary number of
    # arguments with different types.
    @functools.wraps(handler)
    def test_can_view_reviewable_suggestions(
        self: _SelfBaseHandlerType,
        target_type: str,
        suggestion_type: str,
        **kwargs: Any
    ) -> _GenericHandlerFunctionReturnType:
        """Checks whether the user can view reviewable suggestions.

        Args:
            target_type: str. The entity type of the target of the suggestion.
            suggestion_type: str. The type of the suggestion.
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            PageNotFoundException. The given page cannot be found.
            Exception. User is not allowed to review translation suggestions.
            Exception. User is not allowed to review question suggestions.
        """
        if not self.user_id:
            raise base.UserFacingExceptions.NotLoggedInException
        if suggestion_type == (
                feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT):
            if user_services.can_review_translation_suggestions(self.user_id):
                return handler(self, target_type, suggestion_type, **kwargs)
            else:
                raise Exception(
                    'User with user_id: %s is not allowed to review '
                    'translation suggestions.' % self.user_id
                )
        elif suggestion_type == (
                feconf.SUGGESTION_TYPE_ADD_QUESTION):
            if user_services.can_review_question_suggestions(self.user_id):
                return handler(self, target_type, suggestion_type, **kwargs)
            else:
                raise Exception(
                    'User with user_id: %s is not allowed to review question '
                    'suggestions.' % self.user_id
                )
        else:
            raise self.PageNotFoundException

    return test_can_view_reviewable_suggestions


def can_edit_entity(
    handler: Callable[..., _GenericHandlerFunctionReturnType]
) -> Callable[..., _GenericHandlerFunctionReturnType]:
    """Decorator to check whether user can edit entity.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now checks
        if the user can edit the entity.
    """

    # Here we use type Any because this method can accept arbitrary number of
    # arguments with different types.
    @functools.wraps(handler)
    def test_can_edit_entity(
        self: _SelfBaseHandlerType,
        entity_type: str,
        entity_id: str,
        **kwargs: Any
    ) -> _GenericHandlerFunctionReturnType:
        """Checks if the user can edit entity.

        Args:
            entity_type: str. The type of entity i.e. exploration, question etc.
            entity_id: str. The ID of the entity.
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            PageNotFoundException. The given page cannot be found.
        """
        arg_swapped_handler = lambda x, y, z: handler(y, x, z)
        # This swaps the first two arguments (self and entity_type), so
        # that functools.partial can then be applied to the leftmost one to
        # create a modified handler function that has the correct signature
        # for the corresponding decorators.
        reduced_handler = functools.partial(
            arg_swapped_handler, entity_type)
        functions: (
            Dict[str, Callable[[str], _GenericHandlerFunctionReturnType]]
         ) = {
            feconf.ENTITY_TYPE_EXPLORATION: lambda entity_id: (
                can_edit_exploration(reduced_handler)(
                    self, entity_id, **kwargs)),
            feconf.ENTITY_TYPE_QUESTION: lambda entity_id: (
                can_edit_question(reduced_handler)(
                    self, entity_id, **kwargs)),
            feconf.ENTITY_TYPE_TOPIC: lambda entity_id: (
                can_edit_topic(reduced_handler)(
                    self, entity_id, **kwargs)),
            feconf.ENTITY_TYPE_SKILL: lambda entity_id: (
                can_edit_skill(reduced_handler)(
                    self, entity_id, **kwargs)),
            feconf.IMAGE_CONTEXT_QUESTION_SUGGESTIONS: lambda entity_id: (
                can_submit_images_to_questions(reduced_handler)(
                    self, entity_id, **kwargs)),
            feconf.ENTITY_TYPE_STORY: lambda entity_id: (
                can_edit_story(reduced_handler)(
                    self, entity_id, **kwargs)),
            feconf.ENTITY_TYPE_BLOG_POST: lambda entity_id: (
                can_edit_blog_post(reduced_handler)(
                    self, entity_id, **kwargs))
        }
        if entity_type not in dict.keys(functions):
            raise self.PageNotFoundException
        return functions[entity_type](entity_id)

    return test_can_edit_entity


def can_play_entity(
    handler: Callable[..., _GenericHandlerFunctionReturnType]
) -> Callable[..., _GenericHandlerFunctionReturnType]:
    """Decorator to check whether user can play entity.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now checks
        if the user can play the entity.
    """

    # Here we use type Any because this method can accept arbitrary number of
    # arguments with different types.
    @functools.wraps(handler)
    def test_can_play_entity(
        self: _SelfBaseHandlerType,
        entity_type: str,
        entity_id: str,
        **kwargs: Any
    ) -> _GenericHandlerFunctionReturnType:
        """Checks if the user can play entity.

        Args:
            entity_type: str. The type of entity i.e. exploration, question etc.
            entity_id: str. The ID of the entity.
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            PageNotFoundException. The given page cannot be found.
        """
        arg_swapped_handler = lambda x, y, z: handler(y, x, z)
        if entity_type == feconf.ENTITY_TYPE_EXPLORATION:
            # This swaps the first two arguments (self and entity_type), so
            # that functools.partial can then be applied to the leftmost one to
            # create a modified handler function that has the correct signature
            # for can_edit_question().
            reduced_handler = functools.partial(
                arg_swapped_handler, feconf.ENTITY_TYPE_EXPLORATION)
            # This raises an error if the question checks fail.
            return can_play_exploration(reduced_handler)(
                self, entity_id, **kwargs)
        elif entity_type == feconf.ENTITY_TYPE_QUESTION:
            reduced_handler = functools.partial(
                arg_swapped_handler, feconf.ENTITY_TYPE_QUESTION)
            return can_play_question(reduced_handler)(
                self, entity_id, **kwargs)
        else:
            raise self.PageNotFoundException

    return test_can_play_entity


def is_from_oppia_ml(
    handler: Callable[..., _GenericHandlerFunctionReturnType]
) -> Callable[..., _GenericHandlerFunctionReturnType]:
    """Decorator to check whether the incoming request is from a valid Oppia-ML
    VM instance.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now can check if incoming
        request is from a valid VM instance.
    """

    # Here we use type Any because this method can accept arbitrary number of
    # arguments with different types.
    @functools.wraps(handler)
    def test_request_originates_from_valid_oppia_ml_instance(
        self: base.OppiaMLVMHandler[Dict[str, str], Dict[str, str]],
        **kwargs: Any
    ) -> _GenericHandlerFunctionReturnType:
        """Checks if the incoming request is from a valid Oppia-ML VM
        instance.

        Args:
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            UnauthorizedUserException. If incoming request is not from a valid
                Oppia-ML VM instance.
        """
        oppia_ml_auth_info = (
            self.extract_request_message_vm_id_and_signature())
        if (oppia_ml_auth_info.vm_id == feconf.DEFAULT_VM_ID and
                not constants.DEV_MODE):
            raise self.UnauthorizedUserException
        if not classifier_services.verify_signature(oppia_ml_auth_info):
            raise self.UnauthorizedUserException

        return handler(self, **kwargs)

    return test_request_originates_from_valid_oppia_ml_instance


def can_update_suggestion(
    handler: Callable[..., _GenericHandlerFunctionReturnType]
) -> Callable[..., _GenericHandlerFunctionReturnType]:
    """Decorator to check whether the current user can update suggestions.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now checks
        if the user can update a given suggestion.

    Raises:
        NotLoggedInException. The user is not logged in.
        UnauthorizedUserException. The user does not have credentials to
            edit this suggestion.
        InvalidInputException. The submitted suggestion id is not valid.
        PageNotFoundException. A suggestion is not found with the given
            suggestion id.
    """

    # Here we use type Any because this method can accept arbitrary number of
    # arguments with different types.
    @functools.wraps(handler)
    def test_can_update_suggestion(
        self: _SelfBaseHandlerType,
        suggestion_id: str,
        **kwargs: Any
    ) -> _GenericHandlerFunctionReturnType:
        """Returns a handler to test whether a suggestion can be updated based
        on the user's roles.

        Args:
            suggestion_id: str. The suggestion id.
            **kwargs: *. Keyword arguments.

        Returns:
            function. The handler for updating a suggestion.

        Raises:
            NotLoggedInException. The user is not logged in.
            UnauthorizedUserException. The user does not have credentials to
                edit this suggestion.
            InvalidInputException. The submitted suggestion id is not valid.
            PageNotFoundException. A suggestion is not found with the given
                suggestion id.
        """
        if not self.user_id:
            raise base.UserFacingExceptions.NotLoggedInException
        user_actions = self.user.actions

        if len(suggestion_id.split('.')) != 3:
            raise self.InvalidInputException(
                'Invalid format for suggestion_id.' +
                ' It must contain 3 parts separated by \'.\'')

        suggestion = suggestion_services.get_suggestion_by_id(
            suggestion_id, strict=False
        )

        if suggestion is None:
            raise self.PageNotFoundException

        if role_services.ACTION_ACCEPT_ANY_SUGGESTION in user_actions:
            return handler(self, suggestion_id, **kwargs)

        if suggestion.author_id == self.user_id:
            raise base.UserFacingExceptions.UnauthorizedUserException(
                'The user, %s is not allowed to update self-created'
                'suggestions.' % (user_services.get_username(self.user_id)))

        if suggestion.suggestion_type not in (
                feconf.CONTRIBUTOR_DASHBOARD_SUGGESTION_TYPES):
            raise self.InvalidInputException('Invalid suggestion type.')

        if suggestion.suggestion_type == (
                feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT):
            if user_services.can_review_translation_suggestions(
                    self.user_id,
                    language_code=suggestion.change.language_code):
                return handler(self, suggestion_id, **kwargs)
        elif suggestion.suggestion_type == (
                feconf.SUGGESTION_TYPE_ADD_QUESTION):
            if user_services.can_review_question_suggestions(self.user_id):
                return handler(self, suggestion_id, **kwargs)

        raise base.UserFacingExceptions.UnauthorizedUserException(
            'You are not allowed to update the suggestion.')

    return test_can_update_suggestion


def can_fetch_contributor_dashboard_stats(
    handler: Callable[..., _GenericHandlerFunctionReturnType]
) -> Callable[..., _GenericHandlerFunctionReturnType]:
    """Decorator to check whether the current user can fetch contributor
    dashboard stats.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now checks
        if the user can fetch stats.

    Raises:
        NotLoggedInException. The user is not logged in.
        UnauthorizedUserException. The user does not have credentials to
            fetch stats for the given username.
    """

    # Here we use type Any because this method can accept arbitrary number of
    # arguments with different types.
    @functools.wraps(handler)
    def test_can_fetch_contributor_dashboard_stats(
        self: _SelfBaseHandlerType,
        contribution_type: str,
        contribution_subtype: str,
        username: str,
        **kwargs: Any
    ) -> _GenericHandlerFunctionReturnType:
        """Returns a handler to test whether stats can be fetched based
        on the logged in user.

        Args:
            contribution_type: str. The type of the contribution that the stats
                are requested.
            contribution_subtype: str. The subtype of the contribution that the
                stats are requested.
            username: str. The provided username.
            **kwargs: *. Keyword arguments.

        Returns:
            function. The handler for fetching stats.

        Raises:
            NotLoggedInException. The user is not logged in.
            UnauthorizedUserException. The user does not have credentials to
                fetch stats for the given username.
        """
        if not self.user_id:
            raise base.UserFacingExceptions.NotLoggedInException

        if user_services.get_username(self.user_id) != username:
            raise base.UserFacingExceptions.UnauthorizedUserException(
                'The user %s is not allowed to fetch the stats of other '
                'users.' % (user_services.get_username(self.user_id)))

        return handler(
            self, contribution_type, contribution_subtype, username, **kwargs)

    return test_can_fetch_contributor_dashboard_stats


def can_fetch_all_contributor_dashboard_stats(
    handler: Callable[..., _GenericHandlerFunctionReturnType]
) -> Callable[..., _GenericHandlerFunctionReturnType]:
    """Decorator to check whether the current user can fetch contributor
    dashboard stats.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now checks
        if the user can fetch stats.

    Raises:
        NotLoggedInException. The user is not logged in.
        UnauthorizedUserException. The user does not have credentials to
            fetch stats for the given username.
    """

    # Here we use type Any because this method can accept arbitrary number of
    # arguments with different types.
    @functools.wraps(handler)
    def test_can_fetch_all_contributor_dashboard_stats(
        self: _SelfBaseHandlerType,
        username: str,
        **kwargs: Any
    ) -> _GenericHandlerFunctionReturnType:
        """Returns a handler to test whether stats can be fetched based
        on the logged in user.

        Args:
            username: str. The provided username.
            **kwargs: *. Keyword arguments.

        Returns:
            function. The handler for fetching stats.

        Raises:
            NotLoggedInException. The user is not logged in.
            UnauthorizedUserException. The user does not have credentials to
                fetch stats for the given username.
        """
        if not self.user_id:
            raise base.UserFacingExceptions.NotLoggedInException

        if user_services.get_username(self.user_id) != username:
            raise base.UserFacingExceptions.UnauthorizedUserException(
                'The user %s is not allowed to fetch the stats of other '
                'users.' % (user_services.get_username(self.user_id)))

        return handler(self, username, **kwargs)

    return test_can_fetch_all_contributor_dashboard_stats


def is_from_oppia_android(
    handler: Callable[..., _GenericHandlerFunctionReturnType]
) -> Callable[..., _GenericHandlerFunctionReturnType]:
    """Decorator to check whether the request was sent from Oppia Android.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function.
    """

    # Here we use type Any because this method can accept arbitrary number of
    # arguments with different types.
    @functools.wraps(handler)
    def test_is_from_oppia_android(
        self: _SelfBaseHandlerType, **kwargs: Any
    ) -> _GenericHandlerFunctionReturnType:
        """Checks whether the request was sent from Oppia Android.

        Args:
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            UnauthorizedUserException. If incoming request is not from a valid
                Oppia Android request.
        """
        headers = self.request.headers
        api_key = headers['api_key']
        app_package_name = headers['app_package_name']
        app_version_name = headers['app_version_name']
        app_version_code = headers['app_version_code']

        version_name_matches = (
            android_validation_constants.APP_VERSION_WITH_HASH_REGEXP.match(
                app_version_name))
        version_code_is_positive_int = app_version_code.isdigit() and (
            int(app_version_code) > 0)
        if (
                api_key != android_validation_constants.ANDROID_API_KEY or
                app_package_name != (
                    android_validation_constants.ANDROID_APP_PACKAGE_NAME) or
                not version_name_matches or
                not version_code_is_positive_int):
            raise self.UnauthorizedUserException(
                'The incoming request is not a valid Oppia Android request.')
        return handler(self, **kwargs)

    return test_is_from_oppia_android
