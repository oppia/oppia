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

from typing import Any, Callable # isort: skip


def _redirect_based_on_return_type(
        handler, redirection_url, expected_return_type):
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


def open_access(handler):
    """Decorator to give access to everyone.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that can also give access to
        everyone.
    """

    def test_can_access(self, *args, **kwargs):
        """Gives access to everyone.

        Args:
            *args: list(*). A list of arguments.
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.
        """
        return handler(self, *args, **kwargs)
    test_can_access.__wrapped__ = True

    return test_can_access


def is_source_mailchimp(handler):
    """Decorator to check whether the request was generated from Mailchimp.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function.
    """

    def test_is_source_mailchimp(self, secret, **kwargs):
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
    test_is_source_mailchimp.__wrapped__ = True

    return test_is_source_mailchimp


def does_classroom_exist(handler):
    """Decorator to check whether classroom exists.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function.
    """

    def test_does_classroom_exist(self, classroom_url_fragment, **kwargs):
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
    test_does_classroom_exist.__wrapped__ = True

    return test_does_classroom_exist


def can_play_exploration(handler):
    """Decorator to check whether user can play given exploration.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now can check if users can
        play a given exploration.
    """

    def test_can_play(self, exploration_id, **kwargs):
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
    test_can_play.__wrapped__ = True

    return test_can_play


def can_view_skills(handler):
    """Decorator to check whether user can view multiple given skills.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that can also check if the user
        can view multiple given skills.
    """

    def test_can_view(self, selected_skill_ids, **kwargs):
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
    test_can_view.__wrapped__ = True

    return test_can_view


def can_play_collection(handler):
    """Decorator to check whether user can play given collection.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that can also check if a user can
        play a given collection.
    """

    def test_can_play(self, collection_id, **kwargs):
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
    test_can_play.__wrapped__ = True

    return test_can_play


def can_download_exploration(handler):
    """Decorator to check whether user can download given exploration.
    If a user is authorized to play given exploration, they can download it.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that can also check if the user
        has permission to download a given exploration.
    """

    def test_can_download(self, exploration_id, **kwargs):
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
    test_can_download.__wrapped__ = True

    return test_can_download


def can_view_exploration_stats(handler):
    """Decorator to check whether user can view exploration stats.
    If a user is authorized to play given exploration, they can view its stats.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that checks if the user
        has permission to view exploration stats.
    """

    def test_can_view_stats(self, exploration_id, **kwargs):
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
    test_can_view_stats.__wrapped__ = True

    return test_can_view_stats


def can_edit_collection(handler):
    """Decorator to check whether the user can edit collection.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that checks if the user has
        permission to edit a given collection.
    """

    def test_can_edit(self, collection_id, **kwargs):
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
    test_can_edit.__wrapped__ = True

    return test_can_edit


def can_manage_email_dashboard(handler):
    """Decorator to check whether user can access email dashboard.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now checks if the user has
        permission to access the email dashboard.
    """

    def test_can_manage_emails(self, **kwargs):
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
    test_can_manage_emails.__wrapped__ = True

    return test_can_manage_emails


def can_access_blog_admin_page(handler):
    """Decorator to check whether user can access blog admin page.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now checks if the user has
        permission to access the blog admin page.
    """

    def test_can_access_blog_admin_page(self, **kwargs):
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
    test_can_access_blog_admin_page.__wrapped__ = True

    return test_can_access_blog_admin_page


def can_manage_blog_post_editors(handler):
    """Decorator to check whether user can add and remove users as blog
    post editors.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now checks if the user has
        permission to manage blog post editors.
    """

    def test_can_manage_blog_post_editors(self, **kwargs):
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
    test_can_manage_blog_post_editors.__wrapped__ = True

    return test_can_manage_blog_post_editors


def can_access_blog_dashboard(handler):
    """Decorator to check whether user can access blog dashboard.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now checks if the user has
        permission to access the blog dashboard.
    """
    def test_can_access_blog_dashboard(self, **kwargs):
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
    test_can_access_blog_dashboard.__wrapped__ = True

    return test_can_access_blog_dashboard


def can_delete_blog_post(handler):
    """Decorator to check whether user can delete blog post.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that checks if a user has
        permission to delete a given blog post.
    """
    def test_can_delete(self, blog_post_id, **kwargs):
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
    test_can_delete.__wrapped__ = True

    return test_can_delete


def can_edit_blog_post(handler):
    """Decorator to check whether user can edit blog post.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that checks if a user has
        permission to edit a given blog post.
    """
    def test_can_edit(self, blog_post_id, **kwargs):
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
    test_can_edit.__wrapped__ = True

    return test_can_edit


def can_access_moderator_page(handler):
    """Decorator to check whether user can access moderator page.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now checks if the user has
        permission to access the moderator page.
    """

    def test_can_access_moderator_page(self, **kwargs):
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
    test_can_access_moderator_page.__wrapped__ = True

    return test_can_access_moderator_page


def can_access_release_coordinator_page(handler):
    """Decorator to check whether user can access release coordinator page.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now checks if the user has
        permission to access the release coordinator page.
    """

    def test_can_access_release_coordinator_page(self, **kwargs):
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
    test_can_access_release_coordinator_page.__wrapped__ = True

    return test_can_access_release_coordinator_page


def can_manage_memcache(handler):
    """Decorator to check whether user can can manage memcache.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now checks if the user has
        permission to manage memcache.
    """

    def test_can_manage_memcache(self, **kwargs):
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
    test_can_manage_memcache.__wrapped__ = True

    return test_can_manage_memcache


def can_run_any_job(handler: Callable[..., None]) -> Callable[..., None]:
    """Decorator to check whether user can can run any job.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now checks if the user has
        permission to run any job.
    """

    def test_can_run_any_job(
        self: base.BaseHandler, *args: Any, **kwargs: Any
    ) -> None:
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
    setattr(test_can_run_any_job, '__wrapped__', True)

    return test_can_run_any_job


def can_send_moderator_emails(handler):
    """Decorator to check whether user can send moderator emails.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also checks if the user
        has permission to send moderator emails.
    """

    def test_can_send_moderator_emails(self, **kwargs):
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
    test_can_send_moderator_emails.__wrapped__ = True

    return test_can_send_moderator_emails


def can_manage_own_account(handler):
    """Decorator to check whether user can manage their account.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also checks if the user
        has permission to manage their account.
    """

    def test_can_manage_account(self, **kwargs):
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
    test_can_manage_account.__wrapped__ = True

    return test_can_manage_account


def can_access_admin_page(handler):
    """Decorator that checks if the current user is a super admin.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also checks if the user
        is a super admin.
    """

    def test_super_admin(self, **kwargs):
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
    test_super_admin.__wrapped__ = True

    return test_super_admin


def can_access_contributor_dashboard_admin_page(handler):
    """Decorator that checks if the user can access the contributor dashboard
    admin page.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also checks user can
        access the contributor dashboard admin page.
    """

    def test_can_access_contributor_dashboard_admin_page(self, **kwargs):
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

    test_can_access_contributor_dashboard_admin_page.__wrapped__ = True

    return test_can_access_contributor_dashboard_admin_page


def can_manage_contributors_role(handler):
    """Decorator that checks if the current user can modify contributor's role
    for the contributor dashboard page.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also checks if the user
        can modify contributor's role for the contributor dashboard page.
    """

    def test_can_manage_contributors_role(self, category, **kwargs):
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
    test_can_manage_contributors_role.__wrapped__ = True

    return test_can_manage_contributors_role


def can_delete_any_user(handler):
    """Decorator that checks if the current user can delete any user.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also checks if the user
        can delete any user.
    """

    def test_primary_admin(self, **kwargs):
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
    test_primary_admin.__wrapped__ = True

    return test_primary_admin


def can_upload_exploration(handler):
    """Decorator that checks if the current user can upload exploration.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also checks if a user
        has permission to upload an exploration.
    """

    def test_can_upload(self, **kwargs):
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
    test_can_upload.__wrapped__ = True

    return test_can_upload


def can_create_exploration(handler):
    """Decorator to check whether the user can create an exploration.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also checks if a user
        has permission to create an exploration.
    """

    def test_can_create(self, **kwargs):
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
    test_can_create.__wrapped__ = True

    return test_can_create


def can_create_collection(handler):
    """Decorator to check whether the user can create a collection.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also checks if a user
        has permission to create a collection.
    """

    def test_can_create(self, **kwargs):
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
    test_can_create.__wrapped__ = True

    return test_can_create


def can_access_creator_dashboard(handler):
    """Decorator to check whether the user can access creator dashboard page.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also checks if a
        user has permission to access the creator dashboard page.
    """

    def test_can_access(self, **kwargs):
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
    test_can_access.__wrapped__ = True

    return test_can_access


def can_create_feedback_thread(handler):
    """Decorator to check whether the user can create a feedback thread.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also checks if a user
        has permission to create a feedback thread.
    """

    def test_can_access(self, exploration_id, **kwargs):
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
    test_can_access.__wrapped__ = True

    return test_can_access


def can_view_feedback_thread(handler):
    """Decorator to check whether the user can view a feedback thread.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also checks if a user
        has permission to view a feedback thread.
    """

    def test_can_access(self, thread_id, **kwargs):
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
    test_can_access.__wrapped__ = True

    return test_can_access


def can_comment_on_feedback_thread(handler):
    """Decorator to check whether the user can comment on feedback thread.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also checks if the user
        has permission to comment on a given feedback thread.
    """

    def test_can_access(self, thread_id, **kwargs):
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
    test_can_access.__wrapped__ = True

    return test_can_access


def can_rate_exploration(handler):
    """Decorator to check whether the user can give rating to given
    exploration.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also checks if the user
        has permission to rate a given exploration.
    """

    def test_can_rate(self, exploration_id, **kwargs):
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
    test_can_rate.__wrapped__ = True

    return test_can_rate


def can_flag_exploration(handler):
    """Decorator to check whether user can flag given exploration.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also checks if
        a user can flag a given exploration.
    """

    def test_can_flag(self, exploration_id, **kwargs):
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
    test_can_flag.__wrapped__ = True

    return test_can_flag


def can_subscribe_to_users(handler):
    """Decorator to check whether user can subscribe/unsubscribe a creator.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also checks if a user
        has permission to subscribe/unsubscribe a creator.
    """

    def test_can_subscribe(self, **kwargs):
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
    test_can_subscribe.__wrapped__ = True

    return test_can_subscribe


def can_edit_exploration(handler):
    """Decorator to check whether the user can edit given exploration.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also checks if
        a user has permission to edit a given exploration.
    """

    def test_can_edit(self, exploration_id, *args, **kwargs):
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
    test_can_edit.__wrapped__ = True

    return test_can_edit


def can_voiceover_exploration(handler):
    """Decorator to check whether the user can voiceover given exploration.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also checks if a user
        has permission to voiceover a given exploration.
    """

    def test_can_voiceover(self, exploration_id, **kwargs):
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
    test_can_voiceover.__wrapped__ = True

    return test_can_voiceover


def can_add_voice_artist(handler):
    """Decorator to check whether the user can add voice artist to
    the given activity.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also checks if a user
        has permission to add voice artist.
    """

    def test_can_add_voice_artist(self, entity_type, entity_id, **kwargs):
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
    test_can_add_voice_artist.__wrapped__ = True

    return test_can_add_voice_artist


def can_remove_voice_artist(handler):
    """Decorator to check whether the user can remove voice artist
    from the given activity.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also checks if a user
        has permission to remove voice artist.
    """

    def test_can_remove_voice_artist(self, entity_type, entity_id, **kwargs):
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
    test_can_remove_voice_artist.__wrapped__ = True

    return test_can_remove_voice_artist


def can_save_exploration(handler):
    """Decorator to check whether user can save exploration.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that checks if
        a user has permission to save a given exploration.
    """

    def test_can_save(self, exploration_id, **kwargs):
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

    test_can_save.__wrapped__ = True

    return test_can_save


def can_delete_exploration(handler):
    """Decorator to check whether user can delete exploration.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that checks if a user has
        permission to delete a given exploration.
    """

    def test_can_delete(self, exploration_id, **kwargs):
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
    test_can_delete.__wrapped__ = True

    return test_can_delete


def can_suggest_changes_to_exploration(handler):
    """Decorator to check whether a user can make suggestions to an
    exploration.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also checks if a user
        has permission to make suggestions to an exploration.
    """

    def test_can_suggest(self, exploration_id, **kwargs):
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
    test_can_suggest.__wrapped__ = True

    return test_can_suggest


def can_suggest_changes(handler):
    """Decorator to check whether a user can make suggestions.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also checks if the user
        has permission to make suggestions.
    """

    def test_can_suggest(self, **kwargs):
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
    test_can_suggest.__wrapped__ = True

    return test_can_suggest


def can_resubmit_suggestion(handler):
    """Decorator to check whether a user can resubmit a suggestion."""

    def test_can_resubmit_suggestion(self, suggestion_id, **kwargs):
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
        suggestion = suggestion_services.get_suggestion_by_id(suggestion_id)
        if not suggestion:
            raise self.InvalidInputException(
                'No suggestion found with given suggestion id')

        if suggestion_services.check_can_resubmit_suggestion(
                suggestion_id, self.user_id):
            return handler(self, suggestion_id, **kwargs)
        else:
            raise base.UserFacingExceptions.UnauthorizedUserException(
                'You do not have credentials to resubmit this suggestion.')
    test_can_resubmit_suggestion.__wrapped__ = True

    return test_can_resubmit_suggestion


def can_publish_exploration(handler):
    """Decorator to check whether user can publish exploration.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also checks if the user
        has permission to publish an exploration.
    """

    def test_can_publish(self, exploration_id, *args, **kwargs):
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
    test_can_publish.__wrapped__ = True

    return test_can_publish


def can_publish_collection(handler):
    """Decorator to check whether user can publish collection.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also checks if a user
        has permission to publish a collection.
    """

    def test_can_publish_collection(self, collection_id, **kwargs):
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
    test_can_publish_collection.__wrapped__ = True

    return test_can_publish_collection


def can_unpublish_collection(handler):
    """Decorator to check whether user can unpublish a given
    collection.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that also checks if
        the user has permission to unpublish a collection.
    """

    def test_can_unpublish_collection(self, collection_id, **kwargs):
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
    test_can_unpublish_collection.__wrapped__ = True

    return test_can_unpublish_collection


def can_modify_exploration_roles(handler):
    """Decorators to check whether user can manage rights related to an
    exploration.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also checks if
        the user has permission to manage rights related to an
        exploration.
    """

    def test_can_modify(self, exploration_id, **kwargs):
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
    test_can_modify.__wrapped__ = True

    return test_can_modify


def can_perform_tasks_in_taskqueue(handler):
    """Decorator to ensure that the handler is being called by task scheduler or
    by a superadmin of the application.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also ensures that
        the handler can only be executed if it is called by task scheduler or by
        a superadmin of the application.
    """

    def test_can_perform(self, **kwargs):
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
    test_can_perform.__wrapped__ = True

    return test_can_perform


def can_perform_cron_tasks(handler):
    """Decorator to ensure that the handler is being called by cron or by a
    superadmin of the application.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also ensures that
        the handler can only be executed if it is called by cron or by
        a superadmin of the application.
    """

    def test_can_perform(self, **kwargs):
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
    test_can_perform.__wrapped__ = True

    return test_can_perform


def can_access_learner_dashboard(handler):
    """Decorator to check access to learner dashboard.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also checks if
        one can access the learner dashboard.
    """

    def test_can_access(self, **kwargs):
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
    test_can_access.__wrapped__ = True

    return test_can_access


def can_access_learner_groups(handler):
    """Decorator to check access to learner groups.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also checks if
        one can access the learner groups.
    """

    def test_can_access(self, **kwargs):
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
    test_can_access.__wrapped__ = True

    return test_can_access


def can_manage_question_skill_status(handler):
    """Decorator to check whether the user can publish a question and link it
    to a skill.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also checks if the
        given user has permission to publish a question and link it
        to a skill.
    """

    def test_can_manage_question_skill_status(self, **kwargs):
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
    test_can_manage_question_skill_status.__wrapped__ = True

    return test_can_manage_question_skill_status


def require_user_id_else_redirect_to_homepage(handler):
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

    def test_login(self, **kwargs):
        """Checks if the user for the current session is logged in.
        If not, redirects the user to the home page.

        Args:
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.
        """
        if not self.user_id:
            self.redirect('/')
            return
        return handler(self, **kwargs)
    test_login.__wrapped__ = True

    return test_login


def can_edit_topic(handler):
    """Decorator to check whether the user can edit given topic."""

    def test_can_edit(self, topic_id, *args, **kwargs):
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
    test_can_edit.__wrapped__ = True

    return test_can_edit


def can_edit_question(handler):
    """Decorator to check whether the user can edit given question.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also checks
        whether the user has permission to edit a given question.
    """

    def test_can_edit(self, question_id, **kwargs):
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
    test_can_edit.__wrapped__ = True

    return test_can_edit


def can_play_question(handler):
    """Decorator to check whether the user can play given question.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also checks
        whether the user can play a given question.
    """
    def test_can_play_question(self, question_id, **kwargs):
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
    test_can_play_question.__wrapped__ = True
    return test_can_play_question


def can_view_question_editor(handler):
    """Decorator to check whether the user can view any question editor.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also checks
        if the user has permission to view any question editor.
    """

    def test_can_view_question_editor(self, question_id, **kwargs):
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
    test_can_view_question_editor.__wrapped__ = True

    return test_can_view_question_editor


def can_delete_question(handler):
    """Decorator to check whether the user can delete a question.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also checks
        if the user has permission to delete a question.
    """

    def test_can_delete_question(self, question_id, **kwargs):
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
    test_can_delete_question.__wrapped__ = True

    return test_can_delete_question


def can_add_new_story_to_topic(handler):
    """Decorator to check whether the user can add a story to a given topic.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also checks
        if the user has permission to add a story to a given topic.
    """

    def test_can_add_story(self, topic_id, **kwargs):
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
    test_can_add_story.__wrapped__ = True

    return test_can_add_story


def can_edit_story(handler):
    """Decorator to check whether the user can edit a story belonging to a given
    topic.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also checks if
        a user has permission to edit a story for a given topic.
    """

    def test_can_edit_story(self, story_id, **kwargs):
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
    test_can_edit_story.__wrapped__ = True

    return test_can_edit_story


def can_edit_skill(handler):
    """Decorator to check whether the user can edit a skill, which can be
    independent or belong to a topic.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also checks if
        the user has permission to edit a skill.
    """
    def test_can_edit_skill(self, skill_id, **kwargs):
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

    test_can_edit_skill.__wrapped__ = True
    return test_can_edit_skill


def can_submit_images_to_questions(handler):
    """Decorator to check whether the user can submit images to questions.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also checks if
        the user has permission to submit a question.
    """
    def test_can_submit_images_to_questions(self, skill_id, **kwargs):
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

    test_can_submit_images_to_questions.__wrapped__ = True
    return test_can_submit_images_to_questions


def can_delete_skill(handler):
    """Decorator to check whether the user can delete a skill.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also checks
        if the user can delete a skill.
    """

    def test_can_delete_skill(self, **kwargs):
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

    test_can_delete_skill.__wrapped__ = True
    return test_can_delete_skill


def can_create_skill(handler):
    """Decorator to check whether the user can create a skill, which can be
    independent or added to a topic.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also checks if
        the user has permission to create a skill.
    """
    def test_can_create_skill(self, **kwargs):
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

    test_can_create_skill.__wrapped__ = True
    return test_can_create_skill


def can_delete_story(handler):
    """Decorator to check whether the user can delete a story in a given
    topic.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also checks
        whether the user has permission to delete a story in a
        given topic.
    """

    def test_can_delete_story(self, story_id, **kwargs):
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
    test_can_delete_story.__wrapped__ = True

    return test_can_delete_story


def can_delete_topic(handler):
    """Decorator to check whether the user can delete a topic.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also
        checks if the user can delete a given topic.
    """

    def test_can_delete_topic(self, topic_id, **kwargs):
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
    test_can_delete_topic.__wrapped__ = True

    return test_can_delete_topic


def can_create_topic(handler):
    """Decorator to check whether the user can create a topic.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that also checks
        if the user can create a topic.
    """

    def test_can_create_topic(self, **kwargs):
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
    test_can_create_topic.__wrapped__ = True

    return test_can_create_topic


def can_access_topics_and_skills_dashboard(handler):
    """Decorator to check whether the user can access the topics and skills
    dashboard.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that also checks if
        the user can access the topics and skills dashboard.
    """

    def test_can_access_topics_and_skills_dashboard(self, **kwargs):
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
    test_can_access_topics_and_skills_dashboard.__wrapped__ = True

    return test_can_access_topics_and_skills_dashboard


def can_view_any_topic_editor(handler):
    """Decorator to check whether the user can view any topic editor.

    Args:
        handler: function. The newly decorated function.

    Returns:
        function. The newly decorated function that also checks
        if the user can view any topic editor.
    """

    def test_can_view_any_topic_editor(self, topic_id, **kwargs):
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
    test_can_view_any_topic_editor.__wrapped__ = True

    return test_can_view_any_topic_editor


def can_manage_rights_for_topic(handler):
    """Decorator to check whether the user can manage a topic's rights.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that also checks
        if the user can manage a given topic's rights.
    """

    def test_can_manage_topic_rights(self, topic_id, **kwargs):
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
    test_can_manage_topic_rights.__wrapped__ = True

    return test_can_manage_topic_rights


def can_change_topic_publication_status(handler):
    """Decorator to check whether the user can publish or unpublish a topic.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now checks
        if the user can publish or unpublish a topic.
    """

    def test_can_change_topic_publication_status(self, topic_id, **kwargs):
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
    test_can_change_topic_publication_status.__wrapped__ = True

    return test_can_change_topic_publication_status


def can_access_topic_viewer_page(handler):
    """Decorator to check whether user can access topic viewer page.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now checks
        if the user can access the given topic viewer page.
    """

    def test_can_access(
            self, classroom_url_fragment, topic_url_fragment, **kwargs):
        """Checks if the user can access topic viewer page.

        Args:
            topic_url_fragment: str. The url fragment of the topic.
            classroom_url_fragment: str. The classroom url fragment.
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            PageNotFoundException. The given page cannot be found.
        """
        if topic_url_fragment != topic_url_fragment.lower():
            _redirect_based_on_return_type(
                self, '/learn/%s/%s' % (
                    classroom_url_fragment,
                    topic_url_fragment.lower()),
                self.GET_HANDLER_ERROR_RETURN_TYPE)
            return

        topic = topic_fetchers.get_topic_by_url_fragment(
            topic_url_fragment)

        if topic is None:
            _redirect_based_on_return_type(
                self, '/learn/%s' % classroom_url_fragment,
                self.GET_HANDLER_ERROR_RETURN_TYPE)
            return

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
            return

        topic_id = topic.id
        topic_rights = topic_fetchers.get_topic_rights(
            topic_id, strict=False)
        user_actions_info = user_services.get_user_actions_info(self.user_id)

        if (
                topic_rights.topic_is_published or
                role_services.ACTION_VISIT_ANY_TOPIC_EDITOR_PAGE in
                user_actions_info.actions):
            return handler(self, topic.name, **kwargs)
        else:
            raise self.PageNotFoundException
    test_can_access.__wrapped__ = True

    return test_can_access


def can_access_story_viewer_page(handler):
    """Decorator to check whether user can access story viewer page.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now checks
        if the user can access the given story viewer page.
    """

    def test_can_access(
            self, classroom_url_fragment, topic_url_fragment,
            story_url_fragment, *args, **kwargs):
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
            return

        story = story_fetchers.get_story_by_url_fragment(story_url_fragment)

        if story is None:
            _redirect_based_on_return_type(
                self,
                '/learn/%s/%s/story' %
                (classroom_url_fragment, topic_url_fragment),
                self.GET_HANDLER_ERROR_RETURN_TYPE)
            return

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
                return

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
                return
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
    test_can_access.__wrapped__ = True

    return test_can_access


def can_access_subtopic_viewer_page(handler):
    """Decorator to check whether user can access subtopic page viewer.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now checks
        if the user can access the given subtopic viewer page.
    """

    def test_can_access(
            self, classroom_url_fragment, topic_url_fragment,
            subtopic_url_fragment, **kwargs):
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
            return

        topic = topic_fetchers.get_topic_by_url_fragment(topic_url_fragment)
        subtopic_id = None

        if topic is None:
            _redirect_based_on_return_type(
                self, '/learn/%s' % classroom_url_fragment,
                self.GET_HANDLER_ERROR_RETURN_TYPE)
            return

        user_actions_info = user_services.get_user_actions_info(self.user_id)
        topic_rights = topic_fetchers.get_topic_rights(topic.id)

        if (
                (topic_rights is None or not topic_rights.topic_is_published)
                and role_services.ACTION_VISIT_ANY_TOPIC_EDITOR_PAGE not in
                user_actions_info.actions):
            _redirect_based_on_return_type(
                self, '/learn/%s' % classroom_url_fragment,
                self.GET_HANDLER_ERROR_RETURN_TYPE)
            return

        for subtopic in topic.subtopics:
            if subtopic.url_fragment == subtopic_url_fragment:
                subtopic_id = subtopic.id

        if not subtopic_id:
            _redirect_based_on_return_type(
                self,
                '/learn/%s/%s/revision' %
                (classroom_url_fragment, topic_url_fragment),
                self.GET_HANDLER_ERROR_RETURN_TYPE)
            return

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
            return

        subtopic_page = subtopic_page_services.get_subtopic_page_by_id(
            topic.id, subtopic_id, strict=False)
        if subtopic_page is None:
            _redirect_based_on_return_type(
                self,
                '/learn/%s/%s/revision' % (
                    classroom_url_fragment, topic_url_fragment),
                self.GET_HANDLER_ERROR_RETURN_TYPE)
        else:
            return handler(self, topic.name, subtopic_id, **kwargs)
    test_can_access.__wrapped__ = True

    return test_can_access


def get_decorator_for_accepting_suggestion(decorator):
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
    def generate_decorator_for_handler(handler):
        """Function that generates a decorator for a given handler.

        Args:
            handler: function. The function to be decorated.

        Returns:
            function. The newly decorated function that has common checks and
            permissions specified by passed in decorator.

        Raises:
            NotLoggedInException. The user is not logged in.
        """
        def test_can_accept_suggestion(
                self, target_id, suggestion_id, **kwargs):
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

            suggestion = suggestion_services.get_suggestion_by_id(suggestion_id)

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

        test_can_accept_suggestion.__wrapped__ = True
        return test_can_accept_suggestion

    return generate_decorator_for_handler


def can_view_reviewable_suggestions(handler):
    """Decorator to check whether user can view the list of suggestions that
    they are allowed to review.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now checks
        if the user can view reviewable suggestions.
    """
    def test_can_view_reviewable_suggestions(
            self, target_type, suggestion_type, **kwargs):
        """Checks whether the user can view reviewable suggestions.

        Args:
            target_type: str. The entity type of the target of the suggestion.
            suggestion_type: str. The type of the suggestion.
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            PageNotFoundException. The given page cannot be found.
        """
        if not self.user_id:
            raise base.UserFacingExceptions.NotLoggedInException
        if suggestion_type == (
                feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT):
            if user_services.can_review_translation_suggestions(self.user_id):
                return handler(self, target_type, suggestion_type, **kwargs)
        elif suggestion_type == (
                feconf.SUGGESTION_TYPE_ADD_QUESTION):
            if user_services.can_review_question_suggestions(self.user_id):
                return handler(self, target_type, suggestion_type, **kwargs)
        else:
            raise self.PageNotFoundException

    test_can_view_reviewable_suggestions.__wrapped__ = True

    return test_can_view_reviewable_suggestions


def can_edit_entity(handler):
    """Decorator to check whether user can edit entity.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now checks
        if the user can edit the entity.
    """
    def test_can_edit_entity(self, entity_type, entity_id, **kwargs):
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
        functions = {
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

    test_can_edit_entity.__wrapped__ = True

    return test_can_edit_entity


def can_play_entity(handler):
    """Decorator to check whether user can play entity.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now checks
        if the user can play the entity.
    """
    def test_can_play_entity(self, entity_type, entity_id, **kwargs):
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

    test_can_play_entity.__wrapped__ = True

    return test_can_play_entity


def is_from_oppia_ml(handler):
    """Decorator to check whether the incoming request is from a valid Oppia-ML
    VM instance.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now can check if incoming
        request is from a valid VM instance.
    """
    def test_request_originates_from_valid_oppia_ml_instance(self, **kwargs):
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

    test_request_originates_from_valid_oppia_ml_instance.__wrapped__ = True

    return test_request_originates_from_valid_oppia_ml_instance


def can_update_suggestion(handler):
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
    def test_can_update_suggestion(
            self, suggestion_id, **kwargs):
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

        suggestion = suggestion_services.get_suggestion_by_id(suggestion_id)

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

    test_can_update_suggestion.__wrapped__ = True
    return test_can_update_suggestion


def is_from_oppia_android(handler):
    """Decorator to check whether the request was sent from Oppia Android.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function.
    """

    def test_is_from_oppia_android(self, **kwargs):
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

    test_is_from_oppia_android.__wrapped__ = True

    return test_is_from_oppia_android
