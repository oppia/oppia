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
from core.domain import rights_manager
from core.domain import role_services
from core.platform import models
import feconf

current_user_services = models.Registry.import_current_user_services()


def check_activity_accessible(
        user_id, user_actions, activity_type, activity_id):
    """Returns a boolean to signify whether given activity is accessible
    by the user or not.

    Args:
        user_id: str. Id of the given user.
        user_actions: list(str). List of actions given user can perform.
        activity_id: str. Id of the given activity.
        activity_type: str. Signifies whether activity is exploration or
            collection.

    Returns:
        bool. Whether the given activity can be accessed.
    """
    if activity_type == feconf.ACTIVITY_TYPE_EXPLORATION:
        if activity_id in feconf.DISABLED_EXPLORATION_IDS:
            return False

    activity_rights = (
        rights_manager.get_exploration_rights(activity_id, strict=False)
        if activity_type == feconf.ACTIVITY_TYPE_EXPLORATION
        else rights_manager.get_collection_rights(activity_id, strict=False))

    action_play_public = (
        role_services.ACTION_PLAY_ANY_PUBLIC_EXPLORATION
        if activity_type == feconf.ACTIVITY_TYPE_EXPLORATION
        else role_services.ACTION_PLAY_ANY_PUBLIC_COLLECTION)

    action_play_private = (
        role_services.ACTION_PLAY_ANY_PRIVATE_EXPLORATION
        if activity_type == feconf.ACTIVITY_TYPE_EXPLORATION
        else role_services.ACTION_PLAY_ANY_PRIVATE_COLLECTION)

    if activity_rights is None:
        raise base.UserFacingExceptions.PageNotFoundException
    elif activity_rights.is_published():
        return bool(action_play_public in user_actions)
    elif activity_rights.status == rights_manager.ACTIVITY_STATUS_PRIVATE:
        return bool(
            (action_play_private in user_actions) or
            activity_rights.is_viewer(user_id) or
            activity_rights.is_owner(user_id) or
            activity_rights.is_editor(user_id) or
            activity_rights.viewable_if_private)


def check_exploration_editable(user_id, user_actions, exploration_id):
    """Returns a boolean to signify whether given exploration is editable
    by the user or not.

    Args:
        user_id: str. Id of the given user.
        user_actions: list(str). List of actions given user can perform.
        exploration_id: str. Exploration id.

    Returns:
        bool. Whether the given exploration can be accessed.
    """
    exploration_rights = rights_manager.get_exploration_rights(
        exploration_id, strict=False)

    if exploration_rights is None:
        raise base.UserFacingExceptions.PageNotFoundException

    if exploration_rights.community_owned:
        return True

    if role_services.ACTION_EDIT_ANY_EXPLORATION in user_actions:
        return True

    if exploration_rights.is_published():
        if (role_services.ACTION_EDIT_ANY_PUBLIC_EXPLORATION in
                user_actions):
            return True

    if role_services.ACTION_EDIT_OWNED_EXPLORATION in user_actions:
        if (exploration_rights.is_owner(user_id) or
                exploration_rights.is_editor(user_id)):
            return True

    return False


def open_access(handler):
    """Decorator to give access to everyone."""

    def test_can_access(self, **kwargs):
        return handler(self, **kwargs)
    test_can_access.__wrapped__ = True

    return test_can_access


def can_play_exploration(handler):
    """Decorator to check whether user can play given exploration."""

    def test_can_play(self, exploration_id, **kwargs):
        if check_activity_accessible(
                self.user_id, self.actions, feconf.ACTIVITY_TYPE_EXPLORATION,
                exploration_id):
            return handler(self, exploration_id, **kwargs)
        else:
            raise self.PageNotFoundException
    test_can_play.__wrapped__ = True

    return test_can_play


def can_play_collection(handler):
    """Decorator to check whether user can play given collection."""

    def test_can_play(self, collection_id, **kwargs):
        if check_activity_accessible(
                self.user_id, self.actions, feconf.ACTIVITY_TYPE_COLLECTION,
                collection_id):
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
        if check_activity_accessible(
                self.user_id, self.actions, feconf.ACTIVITY_TYPE_EXPLORATION,
                exploration_id):
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
        if check_activity_accessible(
                self.user_id, self.actions, feconf.ACTIVITY_TYPE_EXPLORATION,
                exploration_id):
            return handler(self, exploration_id, **kwargs)
        else:
            raise self.PageNotFoundException
    test_can_view_stats.__wrapped__ = True

    return test_can_view_stats


def can_edit_collection(handler):
    """Decorator to check whether the user can edit collection."""

    def test_can_edit(self, collection_id, **kwargs):
        if not self.user_id:
            raise base.UserFacingExceptions.NotLoggedInException

        collection_rights = rights_manager.get_collection_rights(
            collection_id, strict=False)
        if collection_rights is None:
            raise base.UserFacingExceptions.PageNotFoundException

        if collection_rights.community_owned:
            return handler(self, collection_id, **kwargs)

        if role_services.ACTION_EDIT_ANY_COLLECTION in self.actions:
            return handler(self, collection_id, **kwargs)

        if collection_rights.is_published():
            if (role_services.ACTION_EDIT_ANY_PUBLIC_COLLECTION in
                    self.actions):
                return handler(self, collection_id, **kwargs)

        if (role_services.ACTION_EDIT_OWNED_COLLECTION in
                self.actions):
            if (collection_rights.is_owner(self.user_id) or
                    collection_rights.is_editor(self.user_id)):
                return handler(self, collection_id, **kwargs)

        raise base.UserFacingExceptions.UnauthorizedUserException(
            'You do not have credentials to edit this collection.')
    test_can_edit.__wrapped__ = True

    return test_can_edit


def can_manage_email_dashboard(handler):
    """Decorator to check whether user can access email dashboard."""

    def test_can_manage_emails(self, **kwargs):
        if not self.user_id:
            raise base.UserFacingExceptions.NotLoggedInException

        if role_services.ACTION_MANAGE_EMAIL_DASHBOARD in self.actions:
            return handler(self, **kwargs)

        raise self.UnauthorizedUserException(
            'You do not have credentials to access email dashboard.')
    test_can_manage_emails.__wrapped__ = True

    return test_can_manage_emails


def can_access_moderator_page(handler):
    """Decorator to check whether user can access moderator page."""

    def test_can_access_moderator_page(self, **kwargs):
        if not self.user_id:
            raise base.UserFacingExceptions.NotLoggedInException

        if role_services.ACTION_ACCESS_MODERATOR_PAGE in self.actions:
            return handler(self, **kwargs)

        raise self.UnauthorizedUserException(
            'You do not have credentials to access moderator page.')
    test_can_access_moderator_page.__wrapped__ = True

    return test_can_access_moderator_page


def can_send_moderator_emails(handler):
    """Decorator to check whether user can send moderator emails."""

    def test_can_send_moderator_emails(self, **kwargs):
        if not self.user_id:
            raise base.UserFacingExceptions.NotLoggedInException

        if role_services.ACTION_SEND_MODERATOR_EMAILS in self.actions:
            return handler(self, **kwargs)

        raise self.UnauthorizedUserException(
            'You do not have credentials to send moderator emails.')
    test_can_send_moderator_emails.__wrapped__ = True

    return test_can_send_moderator_emails


def can_manage_own_profile(handler):
    """Decorator to check whether user can manage his profile."""

    def test_can_manage_profile(self, **kwargs):
        if not self.user_id:
            raise self.NotLoggedInException

        if role_services.ACTION_MANAGE_PROFILE in self.actions:
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
                '%s is not a super admin of this application', self.user_id)
        return handler(self, **kwargs)
    test_super_admin.__wrapped__ = True

    return test_super_admin


def can_upload_exploration(handler):
    """Decorator that checks if the current user can upload exploration."""

    def test_can_upload(self, **kwargs):
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
        if self.user_id is None:
            raise self.NotLoggedInException

        if role_services.ACTION_CREATE_EXPLORATION in self.actions:
            return handler(self, **kwargs)
        else:
            raise base.UserFacingExceptions.UnauthorizedUserException(
                'You do not have credentials to create an exploration.')
    test_can_create.__wrapped__ = True

    return test_can_create


def can_create_collection(handler):
    """Decorator to check whether the user can create a collection."""

    def test_can_create(self, **kwargs):
        if self.user_id is None:
            raise self.NotLoggedInException

        if role_services.ACTION_CREATE_COLLECTION in self.actions:
            return handler(self, **kwargs)
        else:
            raise base.UserFacingExceptions.UnauthorizedUserException(
                'You do not have credentials to create a collection.')
    test_can_create.__wrapped__ = True

    return test_can_create


def can_access_creator_dashboard(handler):
    """Decorator to check whether the user can access creator dashboard
    page.
    """

    def test_can_access(self, **kwargs):
        if self.user_id is None:
            raise self.NotLoggedInException

        if role_services.ACTION_ACCESS_CREATOR_DASHBOARD in self.actions:
            return handler(self, **kwargs)
        else:
            raise base.UserFacingExceptions.UnauthorizedUserException(
                'You do not have credentials to access creator dashboard.')
    test_can_access.__wrapped__ = True

    return test_can_access


def can_comment_on_feedback_thread(handler):
    """Decorator to check whether the user can view feedback for a given
    exploration.
    """

    def test_can_access(self, exploration_id, **kwargs):
        if not self.user_id:
            raise base.UserFacingExceptions.NotLoggedInException

        if check_activity_accessible(
                self.user_id, self.actions,
                feconf.ACTIVITY_TYPE_EXPLORATION, exploration_id):
            return handler(self, exploration_id, **kwargs)
        else:
            raise self.UnauthorizedUserException(
                'You do not have credentials to view exploration feedback.')
    test_can_access.__wrapped__ = True

    return test_can_access


def can_rate_exploration(handler):
    """Decorator to check whether the user can give rating to given
    exploration.
    """

    def test_can_rate(self, exploration_id, **kwargs):
        if role_services.ACTION_RATE_EXPLORATION in self.actions:
            return handler(self, exploration_id, **kwargs)
        else:
            raise base.UserFacingExceptions.UnauthorizedUserException(
                'You do not have credentials to give ratings to explorations.')
    test_can_rate.__wrapped__ = True

    return test_can_rate


def can_flag_exploration(handler):
    """Decorator to check whether user can flag given exploration."""

    def test_can_flag(self, exploration_id, **kwargs):
        if role_services.ACTION_FLAG_EXPLORATION in self.actions:
            return handler(self, exploration_id, **kwargs)
        else:
            raise base.UserFacingExceptions.UnauthorizedUserException(
                'You do not have credentials to flag explorations.')
    test_can_flag.__wrapped__ = True

    return test_can_flag


def can_subscribe_to_users(handler):
    """Decorator to check whether user can subscribe/unsubscribe a creator."""

    def test_can_subscribe(self, **kwargs):
        if role_services.ACTION_SUBSCRIBE_TO_USERS in self.actions:
            return handler(self, **kwargs)
        else:
            raise base.UserFacingExceptions.UnauthorizedUserException(
                'You do not have credentials to manage subscriptions.')
    test_can_subscribe.__wrapped__ = True

    return test_can_subscribe


def can_edit_exploration(handler):
    """Decorator to check whether the user can edit given exploration."""

    def test_can_edit(self, exploration_id, **kwargs):
        if not self.user_id:
            raise base.UserFacingExceptions.NotLoggedInException

        if check_exploration_editable(
                self.user_id, self.actions, exploration_id):
            return handler(self, exploration_id, **kwargs)
        else:
            raise base.UserFacingExceptions.UnauthorizedUserException(
                'You do not have credentials to edit this exploration.')
    test_can_edit.__wrapped__ = True

    return test_can_edit


def can_delete_exploration(handler):
    """Decorator to check whether user can delete exploration."""

    def test_can_delete(self, exploration_id, **kwargs):
        if not self.user_id:
            raise base.UserFacingExceptions.NotLoggedInException

        exploration_rights = rights_manager.get_exploration_rights(
            exploration_id, strict=False)

        if ((exploration_rights.status == (
                rights_manager.ACTIVITY_STATUS_PRIVATE)) and
                (role_services.ACTION_DELETE_OWNED_EXPLORATION in (
                    self.actions)) and
                exploration_rights.is_owner(self.user_id)):
            return handler(self, exploration_id, **kwargs)
        elif (exploration_rights.is_published() and
              role_services.ACTION_DELETE_ANY_PUBLIC_EXPLORATION in (
                  self.actions)):
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
        if role_services.ACTION_SUGGEST_CHANGES_TO_EXPLORATION in self.actions:
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
        exploration_rights = rights_manager.get_exploration_rights(
            exploration_id, strict=False)

        if exploration_rights is None:
            raise base.UserFacingExceptions.PageNotFoundException

        if exploration_rights.cloned_from:
            raise base.UserFacingExceptions.UnauthorizedUserException(
                'You do not have credentials to publish this exploration.')

        if role_services.ACTION_PUBLISH_ANY_EXPLORATION in self.actions:
            return handler(self, exploration_id, *args, **kwargs)

        if exploration_rights.status == rights_manager.ACTIVITY_STATUS_PRIVATE:
            if role_services.ACTION_PUBLISH_OWNED_EXPLORATION in self.actions:
                if exploration_rights.is_owner(self.user_id):
                    return handler(self, exploration_id, *args, **kwargs)

        if exploration_rights.status == rights_manager.ACTIVITY_STATUS_PUBLIC:
            if role_services.ACTION_PUBLICIZE_EXPLORATION in self.actions:
                return handler(self, exploration_id, *args, **kwargs)

        raise base.UserFacingExceptions.UnauthorizedUserException(
            'You do not have credentials to publish this exploration.')
    test_can_publish.__wrapped__ = True

    return test_can_publish


def can_manage_collection_publish_status(handler):
    """Decorator to check whether user can publish exploration."""

    def test_can_manage_collection_publish_status(
            self, collection_id, **kwargs):
        collection_rights = rights_manager.get_collection_rights(
            collection_id)

        if collection_rights is None:
            raise base.UserFacingExceptions.PageNotFoundException

        if collection_rights.is_published():
            if role_services.ACTION_UNPUBLISH_PUBLIC_COLLECTION in self.actions:
                return handler(self, collection_id, **kwargs)
            raise self.UnauthorizedUserException(
                'You do not have credentials to unpublish this collection.')

        if collection_rights.status == rights_manager.ACTIVITY_STATUS_PRIVATE:
            if role_services.ACTION_PUBLISH_ANY_COLLECTION in self.actions:
                return handler(self, collection_id, **kwargs)

            if role_services.ACTION_PUBLISH_OWNED_COLLECTION in self.actions:
                if collection_rights.is_owner(self.user_id):
                    return handler(self, collection_id, **kwargs)

            raise self.UnauthorizedUserException(
                'You do not have credentials to publish this collection.')
    test_can_manage_collection_publish_status.__wrapped__ = True

    return test_can_manage_collection_publish_status


def can_modify_exploration_roles(handler):
    """Decorators to check whether user can manage rights related to an
    exploration.
    """

    def test_can_modify(self, exploration_id, **kwargs):
        exploration_rights = rights_manager.get_exploration_rights(
            exploration_id, strict=False)

        if exploration_rights is None:
            raise base.UserFacingExceptions.PageNotFoundException

        if (exploration_rights.community_owned or
                exploration_rights.cloned_from):
            raise base.UserFacingExceptions.UnauthorizedUserException(
                'You do not have credentials to change rights for this '
                'exploration.')

        if (role_services.ACTION_MODIFY_ROLES_FOR_ANY_EXPLORATION in
                self.actions):
            return handler(self, exploration_id, **kwargs)
        if (role_services.ACTION_MODIFY_ROLES_FOR_OWNED_EXPLORATION in
                self.actions):
            if exploration_rights.is_owner(self.user_id):
                return handler(self, exploration_id, **kwargs)

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
        if role_services.ACTION_ACCESS_LEARNER_DASHBOARD in self.actions:
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
