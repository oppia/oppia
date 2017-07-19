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
import feconf


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
        return False
    elif activity_rights.status == rights_manager.ACTIVITY_STATUS_PUBLIC:
        return bool(action_play_public in user_actions)
    elif activity_rights.status == rights_manager.ACTIVITY_STATUS_PRIVATE:
        return bool(
            (action_play_private in user_actions) or
            (user_id in activity_rights.viewer_ids) or
            (user_id in activity_rights.owner_ids) or
            (user_id in activity_rights.editor_ids) or
            activity_rights.viewable_if_private)


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

        if collection_rights.status == rights_manager.ACTIVITY_STATUS_PUBLIC:
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

    return test_can_manage_emails


def can_access_moderator_page(handler):
    """Decorator to check whether user can access moderator page."""

    def test_can_access_moderator_page(self, **kwargs):
        if not self.user_id:
            raise base.UserFacingExceptions.NotLoggedInException

        if role_services.ACTION_MANAGE_FEATURED_ACTIVITIES in self.actions:
            return handler(self, **kwargs)

        raise self.UnauthorizedUserException(
            'You do not have credentials to access moderator page.')

    return test_can_access_moderator_page


def can_send_moderator_emails(handler):
    """Decorator to check whether user can send moderator emails."""

    def test_can_send_moderator_emails(self, **kwargs):
        if not self.user_id:
            raise base.UserFacingExceptions.NotLoggedInException

        if role_services.ACTION_MANAGE_FEATURED_ACTIVITIES in self.actions:
            return handler(self, **kwargs)

        raise self.UnauthorizedUserException(
            'You do not have credentials to send moderator emails.')

    return test_can_send_moderator_emails
