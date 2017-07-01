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

from core.domain import rights_manager
from core.domain import role_services
import feconf


def check_activity_accessible(self, activity_id, activity_type):
    """Returns a boolean to signify whether given activity is accessible
    by the user or not.

    Args:
        activity_id: str. Id of the given activity.
        activity_type: str. Signifies whether activity is exploration or
            collection.

    returns:
        bool. True if activity is accessible else False.
    """
    if activity_type == feconf.ACTIVITY_TYPE_EXPLORATION:
        if activity_id in feconf.DISABLED_EXPLORATION_IDS:
            raise self.DisabledExplorationException

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
        return bool(action_play_public in self.actions)
    elif activity_rights.status == rights_manager.ACTIVITY_STATUS_PRIVATE:
        return bool(
            (action_play_private in self.actions) or
            (self.user_id in activity_rights.viewer_ids) or
            (self.user_id in activity_rights.owner_ids) or
            (self.user_id in activity_rights.editor_ids) or
            activity_rights.viewable_if_private)


def can_play_exploration(handler):
    """Decorator to check whether user can play given exploration."""

    def test_can_play(self, exploration_id, **kwargs):
        if check_activity_accessible(
                self, exploration_id, feconf.ACTIVITY_TYPE_EXPLORATION):
            return handler(self, exploration_id, **kwargs)
        else:
            raise self.PageNotFoundException

    return test_can_play


def can_play_collection(handler):
    """Decorator to check whether user can play given collection."""

    def test_can_play(self, collection_id, **kwargs):
        if check_activity_accessible(
                self, collection_id, feconf.ACTIVITY_TYPE_COLLECTION):
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
                self, exploration_id, feconf.ACTIVITY_TYPE_EXPLORATION):
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
                self, exploration_id, feconf.ACTIVITY_TYPE_EXPLORATION):
            return handler(self, exploration_id, **kwargs)
        else:
            raise self.PageNotFoundException

    return test_can_view_stats
