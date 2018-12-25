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

import urllib

from core.controllers import base
from core.domain import feedback_services
from core.domain import question_services
from core.domain import rights_manager
from core.domain import role_services
from core.domain import skill_services
from core.domain import suggestion_services
from core.domain import topic_services
from core.domain import user_services
from core.platform import models
import feconf

current_user_services = models.Registry.import_current_user_services()

(suggestion_models,) = models.Registry.import_models([models.NAMES.suggestion])


def open_access(handler):
    """Decorator to give access to everyone.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that can
            also give access to everyone.
    """

    def test_can_access(self, *args, **kwargs):
        """Gives access to everyone.

        Args:
            *args: *. Arguments.
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.
        """
        return handler(self, *args, **kwargs)
    test_can_access.__wrapped__ = True

    return test_can_access


def can_play_exploration(handler):
    """Decorator to check whether user can play given exploration.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now can check
            if users can play a given exploration.
    """

    def test_can_play(self, exploration_id, **kwargs):
        """Checks if the user can play the exploration.

        Args:
            exploration_id: str. The exploration id.
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            PageNotFoundException: The page is not found.
        """
        if exploration_id in feconf.DISABLED_EXPLORATION_IDS:
            raise self.PageNotFoundException

        exploration_rights = rights_manager.get_exploration_rights(
            exploration_id, strict=False)

        if rights_manager.check_can_access_activity(
                self.user, exploration_rights):
            return handler(self, exploration_id, **kwargs)
        else:
            raise self.PageNotFoundException
    test_can_play.__wrapped__ = True

    return test_can_play


def can_view_skill(handler):
    """Decorator to check whether user can play a given skill.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that can also
            check if the user can play a given skill.
    """

    def test_can_play(self, skill_id, **kwargs):
        """Checks if the user can play the skill.

        Args:
            skill_id: str. The skill id.
            **kwargs: *. Keyword arguments.

        Returns:
            bool. Whether the user can play the given skill.

        Raises:
            PageNotFoundException: The page is not found.
        """
        # This is a temporary check, since a decorator is required for every
        # method. Once skill publishing is done, whether given skill is
        # published should be checked here.
        skill = skill_services.get_skill_by_id(skill_id, strict=False)

        if skill is not None:
            return handler(self, skill_id, **kwargs)
        else:
            raise self.PageNotFoundException
    test_can_play.__wrapped__ = True

    return test_can_play


def can_play_collection(handler):
    """Decorator to check whether user can play given collection.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that can also
            check if a user can play a given collection.
    """

    def test_can_play(self, collection_id, **kwargs):
        """Checks if the user can play the collection.

        Args:
            collection_id: str. The collection id.
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            PageNotFoundException: The page is not found.
        """
        collection_rights = rights_manager.get_collection_rights(
            collection_id, strict=False)

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
        function. The newly decorated function that can also check
            if the user has permission to download a given
            exploration.
    """

    def test_can_download(self, exploration_id, **kwargs):
        """Checks if the user can download the exploration.

        Args:
            exploration_id: str. The exploration id.
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            PageNotFoundException: The page is not found.
        """
        if exploration_id in feconf.DISABLED_EXPLORATION_IDS:
            raise base.UserFacingExceptions.PageNotFoundException

        exploration_rights = rights_manager.get_exploration_rights(
            exploration_id, strict=False)
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
            PageNotFoundException: The page is not found.
        """
        if exploration_id in feconf.DISABLED_EXPLORATION_IDS:
            raise base.UserFacingExceptions.PageNotFoundException

        exploration_rights = rights_manager.get_exploration_rights(
            exploration_id, strict=False)
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
        function. The newly decorated function that checks if
            the user has permission to edit a given collection.
    """

    def test_can_edit(self, collection_id, **kwargs):
        """Checks if the user is logged in and can edit the collection.

        Args:
            collection_id: str. The collection id.
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            PageNotFoundException: The page is not found.
            UnauthorizedUserException: The user does not have
                credentials to edit the collection.
        """
        if not self.user_id:
            raise base.UserFacingExceptions.NotLoggedInException

        collection_rights = rights_manager.get_collection_rights(collection_id)
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
        function. The newly decorated function that now checks
            if the user has permission to access the email
            dashboard.
    """

    def test_can_manage_emails(self, **kwargs):
        """Checks if the user is logged in and can access email dashboard.

        Args:
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            NotLoggedInException: The user is not logged in.
            UnauthorizedUserException: The user does not have
                credentials to access the email dashboard.
        """
        if not self.user_id:
            raise base.UserFacingExceptions.NotLoggedInException

        if role_services.ACTION_MANAGE_EMAIL_DASHBOARD in self.user.actions:
            return handler(self, **kwargs)

        raise self.UnauthorizedUserException(
            'You do not have credentials to access email dashboard.')
    test_can_manage_emails.__wrapped__ = True

    return test_can_manage_emails


def can_access_moderator_page(handler):
    """Decorator to check whether user can access moderator page.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now checks
            if the user has permission to access the moderator
            page.
    """

    def test_can_access_moderator_page(self, **kwargs):
        """Checks if the user is logged in and can access moderator page.

        Args:
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            NotLoggedInException: The user is not logged in.
            UnauthorizedUserException: The user does not have
                credentials to access the moderator page.
        """
        if not self.user_id:
            raise base.UserFacingExceptions.NotLoggedInException

        if role_services.ACTION_ACCESS_MODERATOR_PAGE in self.user.actions:
            return handler(self, **kwargs)

        raise self.UnauthorizedUserException(
            'You do not have credentials to access moderator page.')
    test_can_access_moderator_page.__wrapped__ = True

    return test_can_access_moderator_page


def can_send_moderator_emails(handler):
    """Decorator to check whether user can send moderator emails.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also checks if
            the user has permission to send moderator emails.
    """

    def test_can_send_moderator_emails(self, **kwargs):
        """Checks if the user is logged in and can send moderator emails.

        Args:
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            NotLoggedInException: The user is not logged in.
            UnauthorizedUserException: The user does not have
                credentials to send moderator emails.
        """
        if not self.user_id:
            raise base.UserFacingExceptions.NotLoggedInException

        if role_services.ACTION_SEND_MODERATOR_EMAILS in self.user.actions:
            return handler(self, **kwargs)

        raise self.UnauthorizedUserException(
            'You do not have credentials to send moderator emails.')
    test_can_send_moderator_emails.__wrapped__ = True

    return test_can_send_moderator_emails


def can_manage_own_profile(handler):
    """Decorator to check whether user can manage their profile.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also checks
            if the user has permission to manage their profile.
    """

    def test_can_manage_profile(self, **kwargs):
        """Checks if the user is logged in and can manage their profile.

        Args:
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            NotLoggedInException: The user is not logged in.
            UnauthorizedUserException: The user does not have
                credentials to manage profile or preferences.
        """
        if not self.user_id:
            raise self.NotLoggedInException

        if role_services.ACTION_MANAGE_PROFILE in self.user.actions:
            return handler(self, **kwargs)

        raise self.UnauthorizedUserException(
            'You do not have credentials to manage profile or preferences.')
    test_can_manage_profile.__wrapped__ = True

    return test_can_manage_profile


def can_access_admin_page(handler):
    """Decorator that checks if the current user is a super admin.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also checks if
            the user is a super admin.
    """

    def test_super_admin(self, **kwargs):
        """Checks if the user is logged in and is a super admin.

        Args:
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            NotLoggedInException: The user is not logged in.
            UnauthorizedUserException: The user is not a super admin
                of the application.
        """
        if not self.user_id:
            raise self.NotLoggedInException

        if not current_user_services.is_current_user_super_admin():
            raise self.UnauthorizedUserException(
                '%s is not a super admin of this application' % self.user_id)
        return handler(self, **kwargs)
    test_super_admin.__wrapped__ = True

    return test_super_admin


def can_upload_exploration(handler):
    """Decorator that checks if the current user can upload exploration.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also checks if
            a user has permission to upload an exploration.
    """

    def test_can_upload(self, **kwargs):
        """Checks if the user can upload exploration.

        Args:
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            NotLoggedInException: The user is not logged in.
            UnauthorizedUserException: The user does not have
                credentials to upload an exploration.
        """
        if not self.user_id:
            raise self.NotLoggedInException

        if not current_user_services.is_current_user_super_admin():
            raise self.UnauthorizedUserException(
                'You do not have credentials to upload exploration.')
        return handler(self, **kwargs)
    test_can_upload.__wrapped__ = True

    return test_can_upload


def can_create_exploration(handler):
    """Decorator to check whether the user can create an exploration.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also checks
            if a user has permission to create an exploration.
    """

    def test_can_create(self, **kwargs):
        """Checks if the user can create an exploration.

        Args:
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            NotLoggedInException: The user is not logged in.
            UnauthorizedUserException: The user does not have
                credentials to create an exploration.
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
        function. The newly decorated function that now also checks
            if a user has permission to create a collection.
    """

    def test_can_create(self, **kwargs):
        """Checks if the user can create a collection.

        Args:
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            NotLoggedInException: The user is not logged in.
            UnauthorizedUserException: The user does not have
                credentials to create a collection.
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
            NotLoggedInException: The user is not logged in.
            UnauthorizedUserException: The user does not have
                credentials to access creator dashboard.
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
        function. The newly decorated function that now also checks if
            a user has permission to create a feedback thread.
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
            PageNotFoundException: The page is not found.
            UnauthorizedUserException: The user does not have
                credentials to create an exploration feedback.
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
        function. The newly decorated function that now also checks if
            a user has permission to view a feedback thread.
    """

    def test_can_access(self, thread_id, **kwargs):
        """Checks if the user can view a feedback thread.

        Args:
            thread_id: str. The feedback thread id.
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            InvalidInputException: The thread ID is not valid.
            PageNotFoundException: The page is not found.
            UnauthorizedUserException: The user does not have
                credentials to view an exploration feedback.
        """
        if '.' not in thread_id:
            raise self.InvalidInputException('Thread ID must contain a .')

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
        function. The newly decorated function that now also checks if
            the user has permission to comment on a given feedback
            thread.
    """

    def test_can_access(self, thread_id, **kwargs):
        """Checks if the user can comment on the feedback thread.

        Args:
            thread_id: str. The feedback thread id.
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            NotLoggedInException: The user is not logged in.
            InvalidInputException: The thread ID is not valid.
            PageNotFoundException: The page is not found.
            UnauthorizedUserException: The user does not have
                credentials to comment on an exploration feedback.
        """
        if not self.user_id:
            raise base.UserFacingExceptions.NotLoggedInException

        if '.' not in thread_id:
            raise self.InvalidInputException('Thread ID must contain a .')

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
        function. The newly decorated function that now also checks
            if the user has permission to rate a given exploration.
    """

    def test_can_rate(self, exploration_id, **kwargs):
        """Checks if the user can rate the exploration.

        Args:
            exploration_id: str. The exploration id.
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            UnauthorizedUserException: The user does not have
                credentials to rate an exploration.
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
            UnauthorizedUserException: The user does not have
                credentials to flag an exploration.
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
        function. The newly decorated function that now also checks if
            a user has permission to subscribe/unsubscribe a creator.
    """

    def test_can_subscribe(self, **kwargs):
        """Checks if the user can subscribe/unsubscribe a creator.

        Args:
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            UnauthorizedUserException: The user does not have
                credentials to manage subscriptions.
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
            *args: *. Arguments.
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            NotLoggedInException: The user is not logged in.
            PageNotFoundException: The page is not found.
            UnauthorizedUserException: The user does not have
                credentials to edit an exploration.
        """
        if not self.user_id:
            raise base.UserFacingExceptions.NotLoggedInException

        exploration_rights = rights_manager.get_exploration_rights(
            exploration_id)
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


def can_translate_exploration(handler):
    """Decorator to check whether the user can translate given exploration.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also checks if a
            user has permission to translate a given exploration.
    """

    def test_can_translate(self, exploration_id, **kwargs):
        """Checks if the user can translate the exploration.

        Args:
            exploration_id: str. The exploration id.
            **kwargs: dict(str: *). Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            NotLoggedInException: The user is not logged in.
            PageNotFoundException: The page is not found.
            UnauthorizedUserException: The user does not have
                credentials to translate an exploration.
        """
        if not self.user_id:
            raise base.UserFacingExceptions.NotLoggedInException

        exploration_rights = rights_manager.get_exploration_rights(
            exploration_id)
        if exploration_rights is None:
            raise base.UserFacingExceptions.PageNotFoundException

        if rights_manager.check_can_translate_activity(
                self.user, exploration_rights):
            return handler(self, exploration_id, **kwargs)
        else:
            raise base.UserFacingExceptions.UnauthorizedUserException(
                'You do not have credentials to translate this exploration.')
    test_can_translate.__wrapped__ = True

    return test_can_translate


def can_delete_exploration(handler):
    """Decorator to check whether user can delete exploration.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that checks if
            a user has permission to delete a given
            exploration.
    """

    def test_can_delete(self, exploration_id, **kwargs):
        """Checks if the user can delete the exploration.

        Args:
            exploration_id: str. The exploration id.
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            NotLoggedInException: The user is not logged in.
            UnauthorizedUserException: The user does not have
                permissions to delete an exploration.
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
        function. The newly decorated function that now also checks if
            a user has permission to make suggestions to an
            exploration.
    """

    def test_can_suggest(self, exploration_id, **kwargs):
        """Checks if the user can make suggestions to an exploration.

        Args:
            exploration_id: str. The exploration id.
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            UnauthorizedUserException: The user does not have
                credentials to give suggestions to an exploration.
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
        function. The newly decorated function that now also checks
            if the user has permission to make suggestions.
    """

    def test_can_suggest(self, **kwargs):
        """Checks if the user can make suggestions to an exploration.

        Args:
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            UnauthorizedUserException: The user does not have
                credentials to make suggestions.
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
        """Checks if the use can edit the given suggestion.

        Args:
            suggestion_id: str. The ID of the suggestion.
            **kwargs: *. keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            UnauthorizedUserException: The user does not have
                credentials to edit this suggestion.
        """
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
        function. The newly decorated function that now also
            checks if the user has permission to publish an
            exploration.
    """

    def test_can_publish(self, exploration_id, *args, **kwargs):
        """Checks if the user can publish the exploration.

        Args:
            exploration_id: str. The exploration id.
            *args: arguments.
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            PageNotFoundException: The page is not found.
            UnauthorizedUserException: The user does not have
                credentials to publish an exploration.
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
        function. The newly decorated function that now also checks
            if a user has permission to publish a collection.
    """

    def test_can_publish_collection(self, collection_id, **kwargs):
        """Checks if the user can publish the collection.

        Args:
            collection_id: str. The collection id.
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            PageNotFoundException: The page is not found.
            UnauthorizedUserException: The user does not have
                credentials to publish a collection.
        """
        collection_rights = rights_manager.get_collection_rights(
            collection_id)
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
            PageNotFoundException: The page is not found.
            UnauthorizedUserException: The user does not have
                credentials to unpublish a collection.
        """
        collection_rights = rights_manager.get_collection_rights(
            collection_id)
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
            UnauthorizedUserException: The user does not have
                credentials to change the rights for an exploration.
        """
        exploration_rights = rights_manager.get_exploration_rights(
            exploration_id, strict=False)

        if rights_manager.check_can_modify_activity_roles(
                self.user, exploration_rights):
            return handler(self, exploration_id, **kwargs)
        else:
            raise base.UserFacingExceptions.UnauthorizedUserException(
                'You do not have credentials to change rights for this '
                'exploration.')
    test_can_modify.__wrapped__ = True

    return test_can_modify


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
            UnauthorizedUserException: The user does not have
                credentials to access the page.
        """
        if (self.request.headers.get('X-AppEngine-Cron') is None and
                not self.is_super_admin):
            raise self.UnauthorizedUserException(
                'You do not have the credentials to access this page.')
        else:
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
            NotLoggedInException: The user is not logged in.
        """
        if role_services.ACTION_ACCESS_LEARNER_DASHBOARD in self.user.actions:
            return handler(self, **kwargs)
        else:
            raise self.NotLoggedInException
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
            NotLoggedInException: The user is not logged in.
            UnauthorizedUserException: The user does not have
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


def require_user_id(handler):
    """Decorator that checks if a user_id is associated to the current
    session. If not, NotLoggedInException is raised.
    """

    def test_login(self, **kwargs):
        """Checks if the user for the current session is logged in.
        If not, raises NotLoggedInException.

        Args:
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            NotLoggedInException: The user is not logged in.
        """
        if not self.user_id:
            raise base.UserFacingExceptions.NotLoggedInException
        return handler(self, **kwargs)
    test_login.__wrapped__ = True

    return test_login


def require_user_id_else_redirect_to_homepage(handler):
    """Decorator that checks if a user_id is associated to the current
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

    def test_can_edit(self, topic_id, **kwargs):
        """Checks whether the user can edit a given topic.

        Args:
            topic_id: str. The topic id.
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            NotLoggedInException: The user is not logged in.
            PageNotFoundException: The page is not found.
            UnauthorizedUserException: The user does not have
                credentials to edit a topic.
        """
        if not self.user_id:
            raise base.UserFacingExceptions.NotLoggedInException

        topic_rights = topic_services.get_topic_rights(topic_id)
        if topic_rights is None:
            raise base.UserFacingExceptions.PageNotFoundException

        if topic_services.check_can_edit_topic(self.user, topic_rights):
            return handler(self, topic_id, **kwargs)
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
            NotLoggedInException: The user is not logged in.
            PageNotFoundException: The page is not found.
            UnauthorizedUserException: The user does not have
                credentials to edit a question.
        """
        if not self.user_id:
            raise base.UserFacingExceptions.NotLoggedInException

        question_rights = question_services.get_question_rights(
            question_id, strict=False)

        if question_rights is None:
            raise base.UserFacingExceptions.PageNotFoundException

        if (
                role_services.ACTION_EDIT_ANY_QUESTION in self.user.actions or
                question_rights.is_creator(self.user_id)):
            return handler(self, question_id, **kwargs)
        else:
            raise self.UnauthorizedUserException(
                'You do not have credentials to edit this question.')
    test_can_edit.__wrapped__ = True

    return test_can_edit


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
            NotLoggedInException: The user is not logged in.
            PageNotFoundException: The page is not found.
            UnauthorizedUserException: The user does not have
                enough rights to access the question editor.
        """
        if not self.user_id:
            raise self.NotLoggedInException

        question_rights = question_services.get_question_rights(
            question_id, strict=False)

        if question_rights is None:
            raise base.UserFacingExceptions.PageNotFoundException

        if (
                role_services.ACTION_VISIT_ANY_QUESTION_EDITOR in
                self.user.actions or question_rights.is_creator(self.user_id)):
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
            NotLoggedInException: The user is not logged in.
            UnauthorizedUserException: The user does not have
                enough rights to delete the question.
        """
        if not self.user_id:
            raise self.NotLoggedInException

        user_actions_info = user_services.UserActionsInfo(self.user_id)

        if (role_services.ACTION_DELETE_ANY_QUESTION in
                user_actions_info.actions):
            return handler(self, question_id, **kwargs)
        else:
            raise self.UnauthorizedUserException(
                '%s does not have enough rights to delete the'
                ' question.' % self.user_id)
    test_can_delete_question.__wrapped__ = True

    return test_can_delete_question


def can_edit_subtopic_page(handler):
    """Decorator to check whether the user can edit a subtopic page of a
    topic.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also checks if
            the user has permission to edit a subtopic page of a topic.
    """

    def test_can_edit(self, topic_id, **kwargs):
        """Checks whether the user can edit the subtopic page
        of a given topic.

        Args:
            topic_id: str. The topic id.
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            NotLoggedInException: The user is not logged in.
            UnauthorizedUserException: The user does not have
                credentials to edit the subtopic pages for
                a given topic.
        """
        if not self.user_id:
            raise base.UserFacingExceptions.NotLoggedInException

        if topic_services.check_can_edit_subtopic_page(self.user):
            return handler(self, topic_id, **kwargs)
        else:
            raise self.UnauthorizedUserException(
                'You do not have credentials to edit the subtopic pages for '
                'this topic.')
    test_can_edit.__wrapped__ = True

    return test_can_edit


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
            NotLoggedInException: The user is not logged in.
            PageNotFoundException: The page is not found.
            UnauthorizedUserException: The user does not have
                credentials to add a story to a given topic.
        """
        if not self.user_id:
            raise base.UserFacingExceptions.NotLoggedInException

        topic_rights = topic_services.get_topic_rights(topic_id)
        if topic_rights is None:
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

    def test_can_edit_story(self, topic_id, **kwargs):
        """Checks whether the user can edit a story belonging to
        a given topic.

        Args:
            topic_id: str. The topic id.
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            NotLoggedInException: The user is not logged in.
            PageNotFoundException: The page is not found.
            UnauthorizedUserException: The user does not have
                credentials to edit a story belonging to a
                given topic.
        """
        if not self.user_id:
            raise base.UserFacingExceptions.NotLoggedInException

        topic_rights = topic_services.get_topic_rights(topic_id)
        if topic_rights is None:
            raise base.UserFacingExceptions.PageNotFoundException

        if topic_services.check_can_edit_topic(self.user, topic_rights):
            return handler(self, topic_id, **kwargs)
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
    def can_user_edit_skill(user, skill_rights):
        """Checks whether the user can edit the given skill.

        Args:
            user: UserActionsInfo. Object having user id, role and actions for
                given user.
            skill_rights: SkillRights or None. Rights object for the given
                skill.

        Returns:
            bool. Whether the given user can edit the given skill.
        """

        if skill_rights is None:
            return False
        if role_services.ACTION_EDIT_PUBLIC_SKILLS in user.actions:
            if not skill_rights.is_private():
                return True
            if skill_rights.is_private() and skill_rights.is_creator(
                    user.user_id):
                return True
        return False

    def test_can_edit_skill(self, skill_id, **kwargs):
        """ Test to see if user can edit a given skill by checking if
        logged in and using can_user_edit_skill.

        Args:
            skill_id: str. The skill ID.
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            NotLoggedInException: The user is not logged in.
            PageNotFoundException: The given page cannot be found.
            UnauthorizedUserException: The user does not have the
                credentials to edit the given skill.
        """
        if not self.user_id:
            raise base.UserFacingExceptions.NotLoggedInException

        skill_rights = skill_services.get_skill_rights(skill_id, strict=False)
        if skill_rights is None:
            raise base.UserFacingExceptions.PageNotFoundException

        if can_user_edit_skill(self.user, skill_rights):
            return handler(self, skill_id, **kwargs)
        else:
            raise self.UnauthorizedUserException(
                'You do not have credentials to edit this skill.')

    test_can_edit_skill.__wrapped__ = True
    return test_can_edit_skill


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
            NotLoggedInException: The user is not logged in.
            UnauthorizedUserException: The user does not have
                credentials to delete a skill.
        """
        if not self.user_id:
            raise base.UserFacingExceptions.NotLoggedInException

        user_actions_info = user_services.UserActionsInfo(self.user_id)
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
            NotLoggedInException: The user is not logged in.
            UnauthorizedUserException: The user does not have
                credentials to create a skill.
        """
        if not self.user_id:
            raise base.UserFacingExceptions.NotLoggedInException

        user_actions_info = user_services.UserActionsInfo(self.user_id)
        if role_services.ACTION_CREATE_NEW_SKILL in user_actions_info.actions:
            return handler(self, **kwargs)
        else:
            raise self.UnauthorizedUserException(
                'You do not have credentials to create a skill.')

    test_can_create_skill.__wrapped__ = True
    return test_can_create_skill


def can_publish_skill(handler):
    """Decorator to check whether the user can publish a skill.

    Args:
        handler: function. The function to be decorated.

    Returns:
        function. The newly decorated function that now also
            checks whether the user has permission to publish
            a skill.
    """

    def can_user_publish_skill(user, skill_rights):
        """Checks whether the user can publish the given skill.

        Args:
            user: UserActionsInfo. Object having user id, role and actions
                for given user.
            skill_rights: SkillRights or None. Rights object for the given
                skill.

        Returns:
            bool. Whether the given user can publish the given skill.
        """

        if skill_rights is None:
            return False
        if role_services.ACTION_PUBLISH_OWNED_SKILL not in user.actions:
            return False
        if skill_rights.is_creator(user.user_id):
            return True
        return False

    def test_can_publish_skill(self, skill_id, **kwargs):
        """Tests whether the user can publish a given skill by checking
        if the user is logged in and using can_user_publish_skill.

        Args:
            skill_id: str. The skill ID.
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the desired function.

        Raises:
            NotLoggedInException: The user is not logged in.
            PageNotFoundException: The given page cannot be found.
            UnauthorizedUserException: The given user does not have
                credentials to publish the given skill.
        """
        if not self.user_id:
            raise base.UserFacingExceptions.NotLoggedInException

        skill_rights = skill_services.get_skill_rights(skill_id)
        if skill_rights is None:
            raise base.UserFacingExceptions.PageNotFoundException

        if can_user_publish_skill(self.user, skill_rights):
            return handler(self, skill_id, **kwargs)
        else:
            raise self.UnauthorizedUserException(
                'You do not have credentials to edit this skill.')
    test_can_publish_skill.__wrapped__ = True

    return test_can_publish_skill


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

    def test_can_delete_story(self, topic_id, **kwargs):
        """Checks whether the user can delete a story in
        a given topic.

        Args:
            topic_id: str. The topic id.
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            NotLoggedInException: The user is not logged in.
            PageNotFoundException: The page is not found.
            UnauthorizedUserException: The user does not have
                credentials to delete a story.
        """
        if not self.user_id:
            raise base.UserFacingExceptions.NotLoggedInException

        topic_rights = topic_services.get_topic_rights(topic_id)
        if topic_rights is None:
            raise base.UserFacingExceptions.PageNotFoundException

        if topic_services.check_can_edit_topic(self.user, topic_rights):
            return handler(self, topic_id, **kwargs)
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
            NotLoggedInException: The user is not logged in.
            UnauthorizedUserException: The user does not have
                enough rights to delete a given topic.
        """
        if not self.user_id:
            raise self.NotLoggedInException

        user_actions_info = user_services.UserActionsInfo(self.user_id)

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
            NotLoggedInException: The user is not logged in.
            UnauthorizedUserException: The user does not have
                enough rights to create a topic.
        """
        if not self.user_id:
            raise self.NotLoggedInException

        user_actions_info = user_services.UserActionsInfo(self.user_id)

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
            NotLoggedInException: The user is not logged in.
            UnauthorizedUserException: The user does not have
                enough rights to access the topics and skills
                dashboard.
        """
        if not self.user_id:
            raise self.NotLoggedInException

        user_actions_info = user_services.UserActionsInfo(self.user_id)

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

    def test_can_view_any_topic_editor(self, **kwargs):
        """Checks whether the user can view any topic editor.

        Args:
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            NotLoggedInException: The user is not logged in.
            UnauthorizedUserException: The user does not have
                enough rights to view any topic editor.
        """
        if not self.user_id:
            raise self.NotLoggedInException

        user_actions_info = user_services.UserActionsInfo(self.user_id)

        if (
                role_services.ACTION_VISIT_ANY_TOPIC_EDITOR in
                user_actions_info.actions):
            return handler(self, **kwargs)
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
            NotLoggedInException: The user is not logged in.
            UnauthorizedUserException: The user does not have
                enough rights to assign roles for a given topic.
        """
        if not self.user_id:
            raise self.NotLoggedInException

        user_actions_info = user_services.UserActionsInfo(self.user_id)

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

    def test_can_change_topic_publication_status(self, **kwargs):
        """Checks whether the user can can publish or unpublish a topic.

        Args:
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            NotLoggedInException: The user is not logged in.
            UnauthorizedUserException: The user does not have
                enough rights to publish or unpublish the topic..
        """
        if not self.user_id:
            raise self.NotLoggedInException

        user_actions_info = user_services.UserActionsInfo(self.user_id)

        if (
                role_services.ACTION_CHANGE_TOPIC_STATUS in
                user_actions_info.actions):
            return handler(self, **kwargs)
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

    def test_can_access(self, topic_name, **kwargs):
        """Checks if the user can access topic viewer page.

        Args:
            topic_name: str. The name of the topic.
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            PageNotFoundException: The given page cannot be found.
        """
        topic_name = urllib.unquote_plus(topic_name)
        topic = topic_services.get_topic_by_name(topic_name)

        if topic is None:
            raise self.PageNotFoundException

        topic_id = topic.id
        topic_rights = topic_services.get_topic_rights(
            topic_id, strict=False)

        if topic_rights.topic_is_published:
            return handler(self, topic_name, **kwargs)
        else:
            raise self.PageNotFoundException
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
            function. The newly decorated function that has common
                checks and permissions specified by passed in
                decorator.

        Raises:
            NotLoggedInException: The user is not logged in.
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
                NotLoggedInException: The user is not logged in.
            """
            if not self.user_id:
                raise base.UserFacingExceptions.NotLoggedInException
            user_actions_info = user_services.UserActionsInfo(self.user_id)
            if (
                    role_services.ACTION_ACCEPT_ANY_SUGGESTION in
                    user_actions_info.actions):
                return handler(self, target_id, suggestion_id, **kwargs)

            suggestion = suggestion_services.get_suggestion_by_id(suggestion_id)
            if suggestion_services.check_user_can_review_in_category(
                    self.user_id, suggestion.score_category):
                return handler(self, target_id, suggestion_id, **kwargs)

            return decorator(handler)(self, target_id, suggestion_id, **kwargs)

        test_can_accept_suggestion.__wrapped__ = True
        return test_can_accept_suggestion

    return generate_decorator_for_handler
