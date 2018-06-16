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

from core.controllers import base
from core.domain import feedback_services
from core.domain import rights_manager
from core.domain import role_services
from core.domain import topic_services
from core.domain import user_services
from core.platform import models
import feconf

current_user_services = models.Registry.import_current_user_services()


def open_access(handler):
    """Decorator to give access to everyone."""

    def test_can_access(self, *args, **kwargs):
        """Gives access to everyone."""
        return handler(self, *args, **kwargs)
    test_can_access.__wrapped__ = True

    return test_can_access


def can_play_exploration(handler):
    """Decorator to check whether user can play given exploration."""

    def test_can_play(self, exploration_id, **kwargs):
        """Checks if the user can play the exploration.

        Args:
            exploration_id: str. The exploration id.
            **kwargs: *. Keyword arguments.

        Returns:
            bool. Whether the user can play the given exploration.
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


def can_play_collection(handler):
    """Decorator to check whether user can play given collection."""

    def test_can_play(self, collection_id, **kwargs):
        """Checks if the user can play the collection.

        Args:
            collection_id: str. The collection id.
            **kwargs: *. Keyword arguments.

        Returns:
            bool. Whether the user can play the given collection.
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
    """

    def test_can_download(self, exploration_id, **kwargs):
        """Checks if the user can download the exploration.

        Args:
            exploration_id: str. The exploration id.
            **kwargs: *. Keyword arguments.

        Returns:
            bool. Whether the user can download the given exploration.
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
    """

    def test_can_view_stats(self, exploration_id, **kwargs):
        """Checks if the user can view the exploration stats.

        Args:
            exploration_id: str. The exploration id.
            **kwargs: *. Keyword arguments.

        Returns:
            bool. Whether the user can view the exploration stats.
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
    """Decorator to check whether the user can edit collection."""

    def test_can_edit(self, collection_id, **kwargs):
        """Checks if the user is logged in and can edit the collection.

        Args:
            collection_id: str. The collection id.
            **kwargs: *. Keyword arguments.

        Returns:
            bool. Whether the user can edit the collection.
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
    """Decorator to check whether user can access email dashboard."""

    def test_can_manage_emails(self, **kwargs):
        """Checks if the user is logged in and can access email dashboard."""
        if not self.user_id:
            raise base.UserFacingExceptions.NotLoggedInException

        if role_services.ACTION_MANAGE_EMAIL_DASHBOARD in self.user.actions:
            return handler(self, **kwargs)

        raise self.UnauthorizedUserException(
            'You do not have credentials to access email dashboard.')
    test_can_manage_emails.__wrapped__ = True

    return test_can_manage_emails


def can_access_moderator_page(handler):
    """Decorator to check whether user can access moderator page."""

    def test_can_access_moderator_page(self, **kwargs):
        """Checks if the user is logged in and can access moderater page."""
        if not self.user_id:
            raise base.UserFacingExceptions.NotLoggedInException

        if role_services.ACTION_ACCESS_MODERATOR_PAGE in self.user.actions:
            return handler(self, **kwargs)

        raise self.UnauthorizedUserException(
            'You do not have credentials to access moderator page.')
    test_can_access_moderator_page.__wrapped__ = True

    return test_can_access_moderator_page


def can_send_moderator_emails(handler):
    """Decorator to check whether user can send moderator emails."""

    def test_can_send_moderator_emails(self, **kwargs):
        """Checks if the user is logged in and can send moderator emails."""
        if not self.user_id:
            raise base.UserFacingExceptions.NotLoggedInException

        if role_services.ACTION_SEND_MODERATOR_EMAILS in self.user.actions:
            return handler(self, **kwargs)

        raise self.UnauthorizedUserException(
            'You do not have credentials to send moderator emails.')
    test_can_send_moderator_emails.__wrapped__ = True

    return test_can_send_moderator_emails


def can_manage_own_profile(handler):
    """Decorator to check whether user can manage his profile."""

    def test_can_manage_profile(self, **kwargs):
        """Checks if the user is logged in and can manage his profile."""
        if not self.user_id:
            raise self.NotLoggedInException

        if role_services.ACTION_MANAGE_PROFILE in self.user.actions:
            return handler(self, **kwargs)

        raise self.UnauthorizedUserException(
            'You do not have credentials to manage profile or preferences.')
    test_can_manage_profile.__wrapped__ = True

    return test_can_manage_profile


def can_access_admin_page(handler):
    """Decorator that checks if the current user is a super admin."""

    def test_super_admin(self, **kwargs):
        """Checks if the user is logged in and is a super admin."""
        if not self.user_id:
            raise self.NotLoggedInException

        if not current_user_services.is_current_user_super_admin():
            raise self.UnauthorizedUserException(
                '%s is not a super admin of this application' % self.user_id)
        return handler(self, **kwargs)
    test_super_admin.__wrapped__ = True

    return test_super_admin


def can_upload_exploration(handler):
    """Decorator that checks if the current user can upload exploration."""

    def test_can_upload(self, **kwargs):
        """Checks if the user can upload exploration."""
        if not self.user_id:
            raise self.NotLoggedInException

        if not current_user_services.is_current_user_super_admin():
            raise self.UnauthorizedUserException(
                'You do not have credentials to upload exploration.')
        return handler(self, **kwargs)
    test_can_upload.__wrapped__ = True

    return test_can_upload


def can_create_exploration(handler):
    """Decorator to check whether the user can create an exploration."""

    def test_can_create(self, **kwargs):
        """Checks if the user can create an exploration."""
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
    """Decorator to check whether the user can create a collection."""

    def test_can_create(self, **kwargs):
        """Checks if the user can create a collection."""
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
    """Decorator to check whether the user can access creator dashboard page."""

    def test_can_access(self, **kwargs):
        """Checks if the user can access the creator dashboard page."""
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
    """

    def test_can_access(self, exploration_id, **kwargs):
        """Checks if the user can create a feedback thread.

        Args:
            exploration_id: str. The ID of the exploration where the thread will
                be created.
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.
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
    """Decorator to check whether the user can view a feedback thread."""

    def test_can_access(self, thread_id, **kwargs):
        """Checks if the user can view a feedback thread.

        Args:
            thread_id: str. The feedback thread id.
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.
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
    """

    def test_can_access(self, thread_id, **kwargs):
        """Checks if the user can comment on the feedback thread.

        Args:
            thread_id: str. The feedback thread id.
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.
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
    """

    def test_can_rate(self, exploration_id, **kwargs):
        """Checks if the user can rate the exploration.

        Args:
            exploration_id: str. The exploration id.
            **kwargs: *. Keyword arguments.

        Returns:
            bool. Whether the user can rate the exploration.
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
    """Decorator to check whether user can flag given exploration."""

    def test_can_flag(self, exploration_id, **kwargs):
        """Checks if the user can flag the exploration.

        Args:
            exploration_id: str. The exploration id.
            **kwargs: *. Keyword arguments.

        Returns:
            bool. Whether the user can flag the exploration.
        """
        if role_services.ACTION_FLAG_EXPLORATION in self.user.actions:
            return handler(self, exploration_id, **kwargs)
        else:
            raise base.UserFacingExceptions.UnauthorizedUserException(
                'You do not have credentials to flag explorations.')
    test_can_flag.__wrapped__ = True

    return test_can_flag


def can_subscribe_to_users(handler):
    """Decorator to check whether user can subscribe/unsubscribe a creator."""

    def test_can_subscribe(self, **kwargs):
        """Checks if the user can subscribe/unsubscribe a creator."""
        if role_services.ACTION_SUBSCRIBE_TO_USERS in self.user.actions:
            return handler(self, **kwargs)
        else:
            raise base.UserFacingExceptions.UnauthorizedUserException(
                'You do not have credentials to manage subscriptions.')
    test_can_subscribe.__wrapped__ = True

    return test_can_subscribe


def can_edit_exploration(handler):
    """Decorator to check whether the user can edit given exploration."""

    def test_can_edit(self, exploration_id, **kwargs):
        """Checks if the user can edit the exploration.

        Args:
            exploration_id: str. The exploration id.
            **kwargs: *. Keyword arguments.

        Returns:
            bool. Whether the user can edit the exploration.
        """
        if not self.user_id:
            raise base.UserFacingExceptions.NotLoggedInException

        exploration_rights = rights_manager.get_exploration_rights(
            exploration_id)
        if exploration_rights is None:
            raise base.UserFacingExceptions.PageNotFoundException

        if rights_manager.check_can_edit_activity(
                self.user, exploration_rights):
            return handler(self, exploration_id, **kwargs)
        else:
            raise base.UserFacingExceptions.UnauthorizedUserException(
                'You do not have credentials to edit this exploration.')
    test_can_edit.__wrapped__ = True

    return test_can_edit


def can_translate_exploration(handler):
    """Decorator to check whether the user can translate given exploration."""

    def test_can_translate(self, exploration_id, **kwargs):
        """Checks if the user can translate the exploration.

        Args:
            exploration_id: str. The exploration id.
            **kwargs: dict(str: *). Keyword arguments.

        Returns:
            Return value of decorated function.
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
    """Decorator to check whether user can delete exploration."""

    def test_can_delete(self, exploration_id, **kwargs):
        """Checks if the user can delete the exploration.

        Args:
            exploration_id: str. The exploration id.
            **kwargs: *. Keyword arguments.

        Returns:
            bool. Whether the user can delete the exploration.
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
    """

    def test_can_suggest(self, exploration_id, **kwargs):
        """Checks if the user can make suggestions to an exploration.

        Args:
            exploration_id: str. The exploration id.
            **kwargs: *. Keyword arguments.

        Returns:
            bool. Whether the user can make suggestions to an
                exploration.
        """
        if (role_services.ACTION_SUGGEST_CHANGES_TO_EXPLORATION in
                self.user.actions):
            return handler(self, exploration_id, **kwargs)
        else:
            raise base.UserFacingExceptions.UnauthorizedUserException(
                'You do not have credentials to give suggestions to this '
                'exploration.')
    test_can_suggest.__wrapped__ = True

    return test_can_suggest


def can_publish_exploration(handler):
    """Decorator to check whether user can publish exploration."""

    def test_can_publish(self, exploration_id, *args, **kwargs):
        """Checks if the user can publish the exploration.

        Args:
            exploration_id: str. The exploration id.
            *args: arguments.
            **kwargs: *. Keyword arguments.

        Returns:
            bool. Whether the user can publish the exploration.
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
    """Decorator to check whether user can publish collection."""

    def test_can_publish_collection(self, collection_id, **kwargs):
        """Checks if the user can publish the collection.

        Args:
            collection_id: str. The collection id.
            **kwargs: *. Keyword arguments.

        Returns:
            bool. Whether the user can publish the collection.
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
    """Decorator to check whether user can unpublish collection."""

    def test_can_unpublish_collection(self, collection_id, **kwargs):
        """Checks if the user can unpublish the collection.

        Args:
            collection_id: str. The collection id.
            **kwargs: *. Keyword arguments.

        Returns:
            bool. Whether the user can unpublish the collection.
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
    """

    def test_can_modify(self, exploration_id, **kwargs):
        """Checks if the user can modify the rights related to an exploration.

        Args:
            exploration_id: str. The exploration id.
            **kwargs: *. Keyword arguments.

        Returns:
            bool. Whether the user can modify the rights related to
                an exploration.
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
    """

    def test_can_perform(self, **kwargs):
        """Checks if the handler is called by cron or by a superadmin of the
        application.
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
    """Decorator to check access to learner dashboard."""

    def test_can_access(self, **kwargs):
        """Checks if the user can access the learner dashboard."""
        if role_services.ACTION_ACCESS_LEARNER_DASHBOARD in self.user.actions:
            return handler(self, **kwargs)
        else:
            raise self.NotLoggedInException
    test_can_access.__wrapped__ = True

    return test_can_access


def require_user_id_else_redirect_to_homepage(handler):
    """Decorator that checks if a user_id is associated to the current
    session. If not, the user is redirected to the main page.
    Note that the user may not yet have registered.
    """

    def test_login(self, **kwargs):
        """Checks if the user for the current session is logged in.
        If not, redirects the user to the home page.
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


def can_edit_subtopic_page(handler):
    """Decorator to check whether the user can edit a subtopic page of a topic.
    """
    def test_can_edit(self, topic_id, **kwargs):
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
    """Decorator to check whether the user can add a story to a given topic."""
    def test_can_add_story(self, topic_id, **kwargs):
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
    """
    def test_can_edit_story(self, topic_id, **kwargs):
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
    """
    def test_can_edit_skill(self, **kwargs):
        if not self.user_id:
            raise base.UserFacingExceptions.NotLoggedInException

        user_actions_info = user_services.UserActionsInfo(self.user_id)
        if role_services.ACTION_EDIT_ANY_SKILL in user_actions_info.actions:
            return handler(self, **kwargs)
        else:
            raise self.UnauthorizedUserException(
                'You do not have credentials to edit this skill.')

    test_can_edit_skill.__wrapped__ = True
    return test_can_edit_skill


def can_delete_skill(handler):
    """Decorator to check whether the user can delete a skill.
    """
    def test_can_delete_skill(self, **kwargs):
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
    """
    def test_can_create_skill(self, **kwargs):
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


def can_delete_story(handler):
    """Decorator to check whether the user can delete a story in a given topic.
    """
    def test_can_delete_story(self, topic_id, **kwargs):
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
    """Decorator to check whether the user can delete a topic."""

    def test_can_delete_topic(self, topic_id, **kwargs):
        if not self.user_id:
            raise self.NotLoggedInException

        user_actions_info = user_services.UserActionsInfo(self.user_id)

        if role_services.ACTION_EDIT_ANY_TOPIC in user_actions_info.actions:
            return handler(self, topic_id, **kwargs)
        else:
            raise self.UnauthorizedUserException(
                '%s does not have enough rights to delete the'
                ' topic.' % self.user_id)
    test_can_delete_topic.__wrapped__ = True

    return test_can_delete_topic


def can_create_topic(handler):
    """Decorator to check whether the user can create a topic."""

    def test_can_create_topic(self, **kwargs):
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
    """

    def test_can_access_topics_and_skills_dashboard(self, **kwargs):
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


def can_visit_any_topic_editor(handler):
    """Decorator to check whether the user can access the topics and skills
    dashboard.
    """

    def test_can_visit_any_topic_editor(self, **kwargs):
        if not self.user_id:
            raise self.NotLoggedInException

        user_actions_info = user_services.UserActionsInfo(self.user_id)

        if (
                role_services.ACTION_VISIT_ANY_TOPIC_EDITOR in
                user_actions_info.actions):
            return handler(self, **kwargs)
        else:
            raise self.UnauthorizedUserException(
                '%s does not have enough rights to access the topics and skills'
                ' dashboard.' % self.user_id)
    test_can_visit_any_topic_editor.__wrapped__ = True

    return test_can_visit_any_topic_editor


def can_manage_rights_for_topic(handler):
    """Decorator to check whether the user can manage a topic's rights."""

    def test_can_manage_topic_rights(self, topic_id, **kwargs):
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
    """Decorator to check whether the user can publish or unpublish a topic."""

    def test_can_change_topic_publication_status(self, **kwargs):
        if not self.user_id:
            raise self.NotLoggedInException

        user_actions_info = user_services.UserActionsInfo(self.user_id)

        if (
                role_services.ACTION_PUBLISH_TOPIC in
                user_actions_info.actions):
            return handler(self, **kwargs)
        else:
            raise self.UnauthorizedUserException(
                '%s does not have enough rights to publish or unpublish the '
                'topic.' % self.user_id)
    test_can_change_topic_publication_status.__wrapped__ = True

    return test_can_change_topic_publication_status
