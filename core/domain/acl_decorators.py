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
    elif activity_rights.status == rights_manager.ACTIVITY_STATUS_PUBLIC:
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

    if exploration_rights.status == rights_manager.ACTIVITY_STATUS_PUBLIC:
        if (role_services.ACTION_EDIT_ANY_PUBLIC_EXPLORATION in
                user_actions):
            return True

    if role_services.ACTION_EDIT_OWNED_EXPLORATION in user_actions:
        if (exploration_rights.is_owner(user_id) or
                exploration_rights.is_editor(user_id)):
            return True

    return False


def can_play_exploration(handler):
    """Decorator to check whether user can play given exploration."""

    def test_can_play(self, exploration_id, **kwargs):
        if check_activity_accessible(
                self.user_id, self.actions, feconf.ACTIVITY_TYPE_EXPLORATION,
                exploration_id):
            return handler(self, exploration_id, **kwargs)
        else:
            raise self.PageNotFoundException

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

    return test_can_view_stats


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

    return test_can_access


def can_view_exploration_feedback(handler):
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

    return test_can_rate


def can_flag_exploration(handler):
    """Decorator to check whether user can flag given exploration."""

    def test_can_flag(self, exploration_id, **kwargs):
        if role_services.ACTION_FLAG_EXPLORATION in self.actions:
            return handler(self, exploration_id, **kwargs)
        else:
            raise base.UserFacingExceptions.UnauthorizedUserException(
                'You do not have credentials to flag explorations.')

    return test_can_flag


def can_subscribe_to_users(handler):
    """Decorator to check whether user can subscribe/unsubscribe a creator."""

    def test_can_subscribe(self, **kwargs):
        if role_services.ACTION_SUBSCRIBE_TO_USERS in self.actions:
            return handler(self, **kwargs)
        else:
            raise base.UserFacingExceptions.UnauthorizedUserException(
                'You do not have credentials to manage subscriptions.')

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
        elif (exploration_rights.status == (
                rights_manager.ACTIVITY_STATUS_PUBLIC) and
              role_services.ACTION_DELETE_ANY_PUBLIC_EXPLORATION in (
                  self.actions)):
            return handler(self, exploration_id, **kwargs)
        else:
            raise base.UserFacingExceptions.UnauthorizedUserException(
                'User %s does not have permissions to delete exploration %s' %
                (self.user_id, exploration_id))

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

    return test_can_publish


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

    return test_can_modify
