# coding: utf-8
#
# Copyright 2014 The Oppia Authors. All Rights Reserved.
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

"""Domain objects and functions that manage rights for various user actions."""

import logging

from constants import constants
from core.domain import activity_services
from core.domain import config_domain
from core.domain import role_services
from core.domain import subscription_services
from core.domain import user_services
from core.platform import models
import feconf
import utils

current_user_services = models.Registry.import_current_user_services()
(collection_models, exp_models,) = models.Registry.import_models([
    models.NAMES.collection, models.NAMES.exploration
])

# IMPORTANT: Ensure that all changes to how these cmds are interpreted preserve
# backward-compatibility with previous exploration snapshots in the datastore.
# Do not modify the definitions of CMD keys that already exist.
CMD_CREATE_NEW = 'create_new'
CMD_CHANGE_ROLE = 'change_role'
CMD_CHANGE_EXPLORATION_STATUS = 'change_exploration_status'
CMD_CHANGE_COLLECTION_STATUS = 'change_collection_status'
CMD_CHANGE_PRIVATE_VIEWABILITY = 'change_private_viewability'
CMD_RELEASE_OWNERSHIP = 'release_ownership'
CMD_UPDATE_FIRST_PUBLISHED_MSEC = 'update_first_published_msec'

ACTIVITY_STATUS_PRIVATE = feconf.ACTIVITY_STATUS_PRIVATE
ACTIVITY_STATUS_PUBLIC = feconf.ACTIVITY_STATUS_PUBLIC
ACTIVITY_STATUS_PUBLICIZED = feconf.ACTIVITY_STATUS_PUBLICIZED

ROLE_OWNER = 'owner'
ROLE_EDITOR = 'editor'
ROLE_VIEWER = 'viewer'
ROLE_NONE = 'none'

ROLE_ADMIN = 'admin'
ROLE_MODERATOR = 'moderator'


class ActivityRights(object):
    """Domain object for the rights/publication status of an activity (an
    exploration or a collection).
    """

    def __init__(self, exploration_id, owner_ids, editor_ids, viewer_ids,
                 community_owned=False, cloned_from=None,
                 status=ACTIVITY_STATUS_PRIVATE,
                 viewable_if_private=False, first_published_msec=None):
        self.id = exploration_id
        self.owner_ids = owner_ids
        self.editor_ids = editor_ids
        self.viewer_ids = viewer_ids
        self.community_owned = community_owned
        self.cloned_from = cloned_from
        self.status = status
        self.viewable_if_private = viewable_if_private
        self.first_published_msec = first_published_msec

    def validate(self):
        """Validates an ActivityRights object.

        Raises:
          utils.ValidationError: if any of the owners, editors and viewers
          lists overlap, or if a community-owned exploration has owners,
          editors or viewers specified.
        """
        if self.community_owned:
            if self.owner_ids or self.editor_ids or self.viewer_ids:
                raise utils.ValidationError(
                    'Community-owned explorations should have no owners, '
                    'editors or viewers specified.')

        if self.community_owned and self.status == ACTIVITY_STATUS_PRIVATE:
            raise utils.ValidationError(
                'Community-owned explorations cannot be private.')

        if self.status != ACTIVITY_STATUS_PRIVATE and self.viewer_ids:
            raise utils.ValidationError(
                'Public explorations should have no viewers specified.')

        owner_editor = set(self.owner_ids).intersection(set(self.editor_ids))
        owner_viewer = set(self.owner_ids).intersection(set(self.viewer_ids))
        editor_viewer = set(self.editor_ids).intersection(set(self.viewer_ids))
        if owner_editor:
            raise utils.ValidationError(
                'A user cannot be both an owner and an editor: %s' %
                owner_editor)
        if owner_viewer:
            raise utils.ValidationError(
                'A user cannot be both an owner and a viewer: %s' %
                owner_viewer)
        if editor_viewer:
            raise utils.ValidationError(
                'A user cannot be both an owner and an editor: %s' %
                editor_viewer)

    def to_dict(self):
        """Returns a dict suitable for use by the frontend.

        Returns:
            dict. A dict version of ActivityRights suitable for use by the
                frontend.
        """
        if self.community_owned:
            return {
                'cloned_from': self.cloned_from,
                'status': self.status,
                'community_owned': True,
                'owner_names': [],
                'editor_names': [],
                'viewer_names': [],
                'viewable_if_private': self.viewable_if_private,
            }
        else:
            return {
                'cloned_from': self.cloned_from,
                'status': self.status,
                'community_owned': False,
                'owner_names': user_services.get_human_readable_user_ids(
                    self.owner_ids),
                'editor_names': user_services.get_human_readable_user_ids(
                    self.editor_ids),
                'viewer_names': user_services.get_human_readable_user_ids(
                    self.viewer_ids),
                'viewable_if_private': self.viewable_if_private,
            }

    def is_owner(self, user_id):
        """Checks whether given user is owner of activity.

        Args:
            user_id: str or None. Id of the user.

        Returns:
            bool. Whether user is in activity owners.
        """
        return bool(user_id in self.owner_ids)

    def is_editor(self, user_id):
        """Checks whether given user is editor of activity.

        Args:
            user_id: str or None. Id of the user.

        Returns:
            bool. Whether user is in activity editors.
        """
        return bool(user_id in self.editor_ids)

    def is_viewer(self, user_id):
        """Checks whether given user is viewer of activity.

        Args:
            user_id: str or None. Id of the user.

        Returns:
            bool. Whether user is in activity viewers of.
        """
        return bool(user_id in self.viewer_ids)

    def is_published(self):
        """Checks whether activity is published.

        Args:
            activity_rights: object. Activity rights object.

        Returns:
            bool. Whether activity is published.
        """
        if self.status == ACTIVITY_STATUS_PUBLIC:
            return True
        elif self.status == ACTIVITY_STATUS_PUBLICIZED:
            return True
        else:
            return False

    def is_private(self):
        """Checks whether activity is private.

        Returns:
            bool. Whether activity is private.
        """
        return bool(self.status == ACTIVITY_STATUS_PRIVATE)


def _get_activity_rights_from_model(activity_rights_model, activity_type):
    """Constructs an ActivityRights object from the given activity rights model.

    Args:
        activity_rights_model: ActivityRightsModel. Activity rights from the
            datastore.
        activity_type: str. The type of activity. Possible values:
            constants.ACTIVITY_TYPE_EXPLORATION
            constants.ACTIVITY_TYPE_COLLECTION

    Returns:
        ActivityRights. The rights object created from the model.
    """
    return ActivityRights(
        activity_rights_model.id,
        activity_rights_model.owner_ids,
        activity_rights_model.editor_ids,
        activity_rights_model.viewer_ids,
        community_owned=activity_rights_model.community_owned,
        cloned_from=(
            activity_rights_model.cloned_from
            if activity_type == constants.ACTIVITY_TYPE_EXPLORATION else None),
        status=activity_rights_model.status,
        viewable_if_private=activity_rights_model.viewable_if_private,
        first_published_msec=activity_rights_model.first_published_msec
    )


def _save_activity_rights(
        committer_id, activity_rights, activity_type, commit_message,
        commit_cmds):
    """Saves an ExplorationRights or CollectionRights domain object to the
    datastore.

    Args:
        committer_id: str. ID of the committer.
        activity_rights: ActivityRights. The rights object for the given
            activity.
        activity_type: str. The type of activity. Possible values:
            constants.ACTIVITY_TYPE_EXPLORATION
            constants.ACTIVITY_TYPE_COLLECTION
        commit_message: str. Descriptive message for the commit.
        commit_cmds: list(dict). A list of commands describing what kind of
            commit was done.
    """
    activity_rights.validate()

    if activity_type == constants.ACTIVITY_TYPE_EXPLORATION:
        model_cls = exp_models.ExplorationRightsModel
    elif activity_type == constants.ACTIVITY_TYPE_COLLECTION:
        model_cls = collection_models.CollectionRightsModel
    model = model_cls.get(activity_rights.id, strict=False)

    model.owner_ids = activity_rights.owner_ids
    model.editor_ids = activity_rights.editor_ids
    model.viewer_ids = activity_rights.viewer_ids
    model.community_owned = activity_rights.community_owned
    model.status = activity_rights.status
    model.viewable_if_private = activity_rights.viewable_if_private
    model.first_published_msec = activity_rights.first_published_msec

    model.commit(committer_id, commit_message, commit_cmds)


def _update_exploration_summary(activity_rights):
    """Updates the exploration summary for the activity associated with the
    given rights object.

    The ID of rights object is the same as the ID of associated activity.

    Args:
        activity_rights: ActivityRights. The rights object for the given
            activity.
    """
    # TODO(msl): get rid of inline imports by refactoring code.
    from core.domain import exp_services
    exp_services.update_exploration_summary(
        activity_rights.id, None)


def _update_collection_summary(activity_rights):
    """Updates the collection summary for the given activity associated with
    the given rights object.

    The ID of rights object is the same as the ID of associated activity.

    Args:
        activity_rights: ActivityRights. The rights object for the given
            activity.
    """
    from core.domain import collection_services
    collection_services.update_collection_summary(
        activity_rights.id, None)


def _update_activity_summary(activity_type, activity_rights):
    """Updates the activity summary for the given activity associated with
    the given rights object.

    The ID of rights object is the same as the ID of associated activity.

    Args:
        activity_type: str. The type of activity. Possible values:
            constants.ACTIVITY_TYPE_EXPLORATION
            constants.ACTIVITY_TYPE_COLLECTION
        activity_rights: ActivityRights. The rights object for the given
            activity.
    """
    if activity_type == constants.ACTIVITY_TYPE_EXPLORATION:
        _update_exploration_summary(activity_rights)
    elif activity_type == constants.ACTIVITY_TYPE_COLLECTION:
        _update_collection_summary(activity_rights)


def update_activity_first_published_msec(
        activity_type, activity_id, first_published_msec):
    """Updates the first_published_msec field for the given activity.

    The caller is responsible for ensuring that this value is not already
    set before updating it.

    Args:
        activity_type: str. The type of activity. Possible values:
            constants.ACTIVITY_TYPE_EXPLORATION
            constants.ACTIVITY_TYPE_COLLECTION
        activity_id: str. ID of the activity.
        first_published_msec: float. First publication time in milliseconds
            since the Epoch.
    """
    activity_rights = _get_activity_rights(activity_type, activity_id)
    commit_cmds = [{
        'cmd': CMD_UPDATE_FIRST_PUBLISHED_MSEC,
        'old_first_published_msec': activity_rights.first_published_msec,
        'new_first_published_msec': first_published_msec
    }]
    activity_rights.first_published_msec = first_published_msec
    _save_activity_rights(
        feconf.SYSTEM_COMMITTER_ID, activity_rights, activity_type,
        'set first published time in msec', commit_cmds)


def create_new_exploration_rights(exploration_id, committer_id):
    """Creates a new exploration rights object and saves it to the datastore.
    Subscribes the committer to the new exploration.

    Args:
        exploration_id: str. ID of the exploration.
        committer_id: str. ID of the committer.
    """
    exploration_rights = ActivityRights(
        exploration_id, [committer_id], [], [])
    commit_cmds = [{'cmd': CMD_CREATE_NEW}]

    exp_models.ExplorationRightsModel(
        id=exploration_rights.id,
        owner_ids=exploration_rights.owner_ids,
        editor_ids=exploration_rights.editor_ids,
        viewer_ids=exploration_rights.viewer_ids,
        community_owned=exploration_rights.community_owned,
        status=exploration_rights.status,
        viewable_if_private=exploration_rights.viewable_if_private,
        first_published_msec=exploration_rights.first_published_msec,
    ).commit(committer_id, 'Created new exploration', commit_cmds)

    subscription_services.subscribe_to_exploration(
        committer_id, exploration_id)


def get_exploration_rights(exploration_id, strict=True):
    """Retrieves the rights for this exploration from the datastore.

    Args:
        exploration_id: str. ID of the exploration.
        strict: bool. Whether to raise an error if there is no exploration
            matching the given ID.

    Returns:
        ActivityRights. The rights object for the given exploration.

    Raises:
        EntityNotFoundError. The exploration with ID exploration_id was not
            found in the datastore.
    """
    model = exp_models.ExplorationRightsModel.get(
        exploration_id, strict=strict)
    if model is None:
        return None
    return _get_activity_rights_from_model(
        model, constants.ACTIVITY_TYPE_EXPLORATION)


def is_exploration_private(exploration_id):
    """Returns whether exploration is private.

    Args:
        exploration_id: str. ID of the exploration.

    Returns:
        bool. Whether the exploration is private or not.
    """
    exploration_rights = get_exploration_rights(exploration_id)
    return exploration_rights.status == ACTIVITY_STATUS_PRIVATE


def is_exploration_public(exploration_id):
    """Returns whether exploration is public.

    Args:
        exploration_id: str. ID of the exploration.

    Returns:
        bool. Whether the exploration is public.
    """
    exploration_rights = get_exploration_rights(exploration_id)
    return exploration_rights.status == ACTIVITY_STATUS_PUBLIC


def is_exploration_cloned(exploration_id):
    """Returns whether the exploration is a clone of another exploration.

    Args:
        exploration_id: str. ID of the exploration.

    Returns:
        bool. Whether the exploration is a clone of another exploration.
    """
    exploration_rights = get_exploration_rights(exploration_id)
    return bool(exploration_rights.cloned_from)


def create_new_collection_rights(collection_id, committer_id):
    """Creates a new collection rights object and saves it to the datastore.
    Subscribes the committer to the new collection.

    Args:
        collection_id: str. ID of the collection.
        committer_id: str. ID of the committer.
    """
    collection_rights = ActivityRights(collection_id, [committer_id], [], [])
    commit_cmds = [{'cmd': CMD_CREATE_NEW}]

    collection_models.CollectionRightsModel(
        id=collection_rights.id,
        owner_ids=collection_rights.owner_ids,
        editor_ids=collection_rights.editor_ids,
        viewer_ids=collection_rights.viewer_ids,
        community_owned=collection_rights.community_owned,
        status=collection_rights.status,
        viewable_if_private=collection_rights.viewable_if_private,
        first_published_msec=collection_rights.first_published_msec
    ).commit(committer_id, 'Created new collection', commit_cmds)

    subscription_services.subscribe_to_collection(committer_id, collection_id)


def get_collection_rights(collection_id, strict=True):
    """Retrieves the rights for this collection from the datastore.

    Args:
        collection_id: str. ID of the collection.
        strict: bool. Whether to raise an error if ID is not found.

    Returns:
        ActivityRights. The rights object for the collection.

    Raises:
        EntityNotFoundError. The collection with ID collection_id is not found
            in the datastore.
    """
    model = collection_models.CollectionRightsModel.get(
        collection_id, strict=strict)
    if model is None:
        return None
    return _get_activity_rights_from_model(
        model, constants.ACTIVITY_TYPE_COLLECTION)


def get_collection_owner_names(collection_id):
    """Retrieves the owners for this collection from the datastore.

    Args:
        collection_id: str. ID of the collection.

    Returns:
        list(str). Human-readable usernames (or truncated email addresses) of
            owners for this collection.
    """
    collection_rights = get_collection_rights(collection_id)
    return user_services.get_human_readable_user_ids(
        collection_rights.owner_ids)


def is_collection_private(collection_id):
    """Returns whether the collection is private.

    Args:
        collection_id: str. ID of the collection.

    Returns:
        bool. Whether the collection is private.
    """
    collection_rights = get_collection_rights(collection_id)
    return collection_rights.status == ACTIVITY_STATUS_PRIVATE


def is_collection_public(collection_id):
    """Returns whether the collection is public.

    Args:
        collection_id: str. ID of the collection.

    Returns:
        bool. Whether the collection is public.
    """
    collection_rights = get_collection_rights(collection_id)
    return collection_rights.status == ACTIVITY_STATUS_PUBLIC


def _get_activity_rights(activity_type, activity_id):
    """Retrieves the rights object for the given activity
    based on its type.

    Args:
        activity_type: str. The type of activity. Possible values:
            constants.ACTIVITY_TYPE_EXPLORATION
            constants.ACTIVITY_TYPE_COLLECTION
        activity_id: str. ID of the activity.

    Returns:
        ActivityRights. The rights object associated with the given activity.

    Raises:
        Exception. activity_type provided is unknown.
    """
    if activity_type == constants.ACTIVITY_TYPE_EXPLORATION:
        return get_exploration_rights(activity_id, strict=False)
    elif activity_type == constants.ACTIVITY_TYPE_COLLECTION:
        return get_collection_rights(activity_id, strict=False)
    else:
        raise Exception(
            'Cannot get activity rights for unknown activity type: %s' % (
                activity_type))


class Actor(object):
    """Domain object for a user with various rights."""

    def __init__(self, user_id):
        # Note that this may be None.
        self.user_id = user_id
        # Value of None is a placeholder. This property gets initialized
        # when the first call to `is_admin()` is made.
        self._is_admin = None
        # Value of None is a placeholder. This property gets initialized
        # when the first call to `is_moderator()` is made.
        self._is_moderator = None

    def is_admin(self):
        """Returns whether this user is an administrator.

        Returns:
            bool. Whether this user is an administrator.
        """
        if self._is_admin is None:
            self._is_admin = self.user_id in config_domain.ADMIN_IDS.value
        return self._is_admin

    def is_moderator(self):
        """Returns whether this user is a moderator.

        Returns:
            bool. Whether this user is a moderator.
        """
        if self._is_moderator is None:
            self._is_moderator = (
                self.is_admin() or
                self.user_id in config_domain.MODERATOR_IDS.value)
        return self._is_moderator

    def _is_owner(self, rights_object):
        return (
            rights_object.community_owned or
            self.user_id in rights_object.owner_ids)

    def _has_editing_rights(self, rights_object):
        return (rights_object.community_owned or
                self.user_id in rights_object.editor_ids or
                self.user_id in rights_object.owner_ids)

    def _has_viewing_rights(self, rights_object):
        return (rights_object.status != ACTIVITY_STATUS_PRIVATE or
                self.user_id in rights_object.viewer_ids or
                self.user_id in rights_object.editor_ids or
                self.user_id in rights_object.owner_ids)

    def _can_play(self, rights_object):
        if rights_object.status == ACTIVITY_STATUS_PRIVATE:
            return (self._has_viewing_rights(rights_object)
                    or rights_object.viewable_if_private
                    or self.is_moderator())
        else:
            return True

    def _can_edit(self, rights_object):
        return (
            self._has_editing_rights(rights_object) or self.is_admin() or (
                self.is_moderator() and (
                    rights_object.status != ACTIVITY_STATUS_PRIVATE)
            )
        )

    def _can_delete(self, rights_object):
        is_deleting_own_private_object = (
            rights_object.status == ACTIVITY_STATUS_PRIVATE and
            self._is_owner(rights_object))

        is_mod_deleting_public_object = (
            rights_object.status == ACTIVITY_STATUS_PUBLIC and
            self.is_moderator())

        return (
            is_deleting_own_private_object or is_mod_deleting_public_object)

    def is_owner(self, activity_type, activity_id):
        """Returns whether this user is an owner of the given activity.

        Args:
            activity_type: str. The type of activity. Possible values:
                constants.ACTIVITY_TYPE_EXPLORATION
                constants.ACTIVITY_TYPE_COLLECTION
            activity_id: str. ID of the activity.

        Returns:
            bool. Whether the user is an owner of the given activity.
        """
        activity_rights = _get_activity_rights(activity_type, activity_id)
        if activity_rights is None:
            return False
        return self._is_owner(activity_rights)

    def has_editing_rights(self, activity_type, activity_id):
        """Returns whether this user has editing rights for the given activity.

        Args:
            activity_type: str. The type of activity. Possible values:
                constants.ACTIVITY_TYPE_EXPLORATION
                constants.ACTIVITY_TYPE_COLLECTION
            activity_id: str. ID of the activity.

        Returns:
            bool. Whether the user is in the owner/editor list for the given
                activity.
        """
        activity_rights = _get_activity_rights(activity_type, activity_id)
        if activity_rights is None:
            return False
        return self._has_editing_rights(activity_rights)

    def has_viewing_rights(self, activity_type, activity_id):
        """Returns whether this user has viewing rights for the given activity.

        Args:
            activity_type: str. The type of activity. Possible values:
                constants.ACTIVITY_TYPE_EXPLORATION
                constants.ACTIVITY_TYPE_COLLECTION
            activity_id: str. ID of the activity.

        Returns:
            bool. Whether the user has the right to view the given activity.
        """
        activity_rights = _get_activity_rights(activity_type, activity_id)
        if activity_rights is None:
            return False
        return self._has_viewing_rights(activity_rights)

    def can_play(self, activity_type, activity_id):
        """Returns whether this user has rights to play the given activity.

        Args:
            activity_type: str. The type of activity. Possible values:
                constants.ACTIVITY_TYPE_EXPLORATION
                constants.ACTIVITY_TYPE_COLLECTION
            activity_id: str. ID of the activity.

        Returns:
            bool. Whether the user has the right to play the given activity.
        """
        activity_rights = _get_activity_rights(activity_type, activity_id)
        if activity_rights is None:
            return False
        return self._can_play(activity_rights)

    def can_view(self, activity_type, activity_id):
        """Returns whether this user has rights to view the given activity.

        Args:
            activity_type: str. The type of activity. Possible values:
                constants.ACTIVITY_TYPE_EXPLORATION
                constants.ACTIVITY_TYPE_COLLECTION
            activity_id: str. ID of the activity.

        Returns:
            bool. Whether the user has the right to view the given activity.
        """
        return self.can_play(activity_type, activity_id)

    # TODO(sll): Add a check here for whether a user is banned or not,
    # rather than having this check in the controller.
    def can_edit(self, activity_type, activity_id):
        """Returns whether this user has rights to edit the given activity.

        Args:
            activity_type: str. The type of activity. Possible values:
                constants.ACTIVITY_TYPE_EXPLORATION
                constants.ACTIVITY_TYPE_COLLECTION
            activity_id: str. ID of the activity.

        Returns:
            bool. Whether the user has the right to edit the given activity.
        """
        activity_rights = _get_activity_rights(activity_type, activity_id)
        if activity_rights is None:
            return False
        return self._can_edit(activity_rights)

    def can_delete(self, activity_type, activity_id):
        """Returns whether this user has rights to delete the given activity.

        Args:
            activity_type: str. The type of activity. Possible values:
                constants.ACTIVITY_TYPE_EXPLORATION
                constants.ACTIVITY_TYPE_COLLECTION
            activity_id: str. ID of the activity.

        Returns:
            bool. Whether the user has the right to delete the given activity.
        """
        activity_rights = _get_activity_rights(activity_type, activity_id)
        if activity_rights is None:
            return False
        return self._can_delete(activity_rights)

    def can_change_private_viewability(
            self, activity_type, activity_id):
        """Returns whether this user is allowed to change the viewability of
        the given private activity.

        The caller is responsible for ensuring that the given activity is
        private.

        Args:
            activity_type: str. The type of activity. Possible values:
                constants.ACTIVITY_TYPE_EXPLORATION
                constants.ACTIVITY_TYPE_COLLECTION
            activity_id: str. ID of the activity.

        Returns:
            bool. Whether the user is allowed to change the viewability of
                the given private activity.
        """

        return self.can_publish(activity_type, activity_id)

    def can_publish(self, activity_type, activity_id):
        """Returns whether this user is allowed to publish the given activity.

        Args:
            activity_type: str. The type of activity. Possible values:
                constants.ACTIVITY_TYPE_EXPLORATION
                constants.ACTIVITY_TYPE_COLLECTION
            activity_id: str. ID of the activity.

        Returns:
            bool. Whether the user is allowed to publish the given activity.
        """
        activity_rights = _get_activity_rights(activity_type, activity_id)
        if activity_rights is None:
            return False

        if activity_rights.status != ACTIVITY_STATUS_PRIVATE:
            return False
        if activity_rights.cloned_from:
            return False

        return self.is_owner(activity_type, activity_id) or self.is_admin()

    def can_unpublish(self, activity_type, activity_id):
        """Returns whether this user is allowed to unpublish the given
        activity.

        Args:
            activity_type: str. The type of activity. Possible values:
                constants.ACTIVITY_TYPE_EXPLORATION
                constants.ACTIVITY_TYPE_COLLECTION
            activity_id: str. ID of the activity.

        Returns:
            bool. Whether the user is allowed to unpublish the given
                activity.
        """
        activity_rights = _get_activity_rights(activity_type, activity_id)
        if activity_rights is None:
            return False

        if activity_rights.status != ACTIVITY_STATUS_PUBLIC:
            return False
        if activity_rights.community_owned:
            return False

        return self.is_moderator()

    def can_modify_roles(self, activity_type, activity_id):
        """Returns whether this user has the right to modify roles for the given
        activity.

        Args:
            activity_type: str. The type of activity. Possible values:
                constants.ACTIVITY_TYPE_EXPLORATION
                constants.ACTIVITY_TYPE_COLLECTION
            activity_id: str. ID of the activity.

        Returns:
            bool. Whether the user has the right to modify roles for the given
                activity.
        """
        activity_rights = _get_activity_rights(activity_type, activity_id)
        if activity_rights is None:
            return False

        if activity_rights.community_owned or activity_rights.cloned_from:
            return False
        return self.is_admin() or self.is_owner(activity_type, activity_id)

    def can_release_ownership(self, activity_type, activity_id):
        """Returns whether this user is allowed to release ownership of the
        given activity to the community.

        Args:
            activity_type: str. The type of activity. Possible values:
                constants.ACTIVITY_TYPE_EXPLORATION
                constants.ACTIVITY_TYPE_COLLECTION
            activity_id: str. ID of the activity.

        Returns:
            bool. Whether the user is allowed to release ownership of the
                given activity to the community.
        """
        activity_rights = _get_activity_rights(activity_type, activity_id)
        if activity_rights is None:
            return False

        if activity_rights.status == ACTIVITY_STATUS_PRIVATE:
            return False
        return self.can_modify_roles(activity_type, activity_id)

    def can_publicize(self, activity_type, activity_id):
        """Returns whether this user is allowed to publicize the given
        activity.

        Args:
            activity_type: str. The type of activity. Possible values:
                constants.ACTIVITY_TYPE_EXPLORATION
                constants.ACTIVITY_TYPE_COLLECTION
            activity_id: str. ID of the activity.

        Returns:
            bool. Whether the user has a right to publicize the given activity.
        """
        activity_rights = _get_activity_rights(activity_type, activity_id)
        if activity_rights is None:
            return False

        if activity_rights.status != ACTIVITY_STATUS_PUBLIC:
            return False
        return self.is_moderator()

    def can_unpublicize(self, activity_type, activity_id):
        """Returns whether this user is allowed to unpublicize the given
        activity.

        Args:
            activity_type: str. The type of activity. Possible values:
                constants.ACTIVITY_TYPE_EXPLORATION
                constants.ACTIVITY_TYPE_COLLECTION
            activity_id: str. ID of the activity.

        Returns:
            bool. Whether the user has a right to unpublicize the given
                activity.
        """
        activity_rights = _get_activity_rights(activity_type, activity_id)
        if activity_rights is None:
            return False

        if activity_rights.status != ACTIVITY_STATUS_PUBLICIZED:
            return False
        return self.is_moderator()


def _assign_role(
        committer_id, assignee_id, new_role, activity_id, activity_type):
    """Assigns a new role to the user.

    Args:
        committer_id: str. ID of the user who is performing the action.
        activity_rights: ExplorationRightsModel|CollectionRightsModel. The
            storage object for the rights of the given activity.
        assignee_id: str. ID of the user whose role is being changed.
        new_role: str. The name of the new role: One of
            ROLE_OWNER
            ROLE_EDITOR
            ROLE_VIEWER
        activity_id: str. ID of the activity.
        activity_type: str. The type of activity. Possible values:
            constants.ACTIVITY_TYPE_EXPLORATION
            constants.ACTIVITY_TYPE_COLLECTION

    Raises:
        Exception. The committer does not have rights to modify a role.
        Exception. The user already owns the activity.
        Exception. The user can already edit the activity.
        Exception. The activity is already publicly editable.
        Exception. The user can already view the activity.
        Exception. The activity is already publicly viewable.
        Exception. The role is invalid.
    """
    if not Actor(committer_id).can_modify_roles(activity_type, activity_id):
        logging.error(
            'User %s tried to allow user %s to be a(n) %s of activity %s '
            'but was refused permission.' % (
                committer_id, assignee_id, new_role, activity_id))
        raise Exception(
            'UnauthorizedUserException: Could not assign new role.')

    activity_rights = _get_activity_rights(activity_type, activity_id)

    assignee_username = user_services.get_username(assignee_id)
    old_role = ROLE_NONE

    if new_role == ROLE_OWNER:
        if Actor(assignee_id)._is_owner(activity_rights):  # pylint: disable=protected-access
            raise Exception('This user already owns this %s.' % activity_type)

        activity_rights.owner_ids.append(assignee_id)

        if assignee_id in activity_rights.viewer_ids:
            activity_rights.viewer_ids.remove(assignee_id)
            old_role = ROLE_VIEWER
        if assignee_id in activity_rights.editor_ids:
            activity_rights.editor_ids.remove(assignee_id)
            old_role = ROLE_EDITOR

    elif new_role == ROLE_EDITOR:
        if Actor(assignee_id)._has_editing_rights(activity_rights):  # pylint: disable=protected-access
            raise Exception(
                'This user already can edit this %s.' % activity_type)

        if activity_rights.community_owned:
            raise Exception(
                'Community-owned %ss can be edited by anyone.' % activity_type)

        activity_rights.editor_ids.append(assignee_id)

        if assignee_id in activity_rights.viewer_ids:
            activity_rights.viewer_ids.remove(assignee_id)
            old_role = ROLE_VIEWER

    elif new_role == ROLE_VIEWER:
        if Actor(assignee_id)._has_viewing_rights(activity_rights):  # pylint: disable=protected-access
            raise Exception(
                'This user already can view this %s.' % activity_type)

        if activity_rights.status != ACTIVITY_STATUS_PRIVATE:
            raise Exception(
                'Public %ss can be viewed by anyone.' % activity_type)

        activity_rights.viewer_ids.append(assignee_id)

    else:
        raise Exception('Invalid role: %s' % new_role)

    commit_message = 'Changed role of %s from %s to %s' % (
        assignee_username, old_role, new_role)
    commit_cmds = [{
        'cmd': CMD_CHANGE_ROLE,
        'assignee_id': assignee_id,
        'old_role': old_role,
        'new_role': new_role
    }]

    _save_activity_rights(committer_id, activity_rights, activity_type,
                          commit_message, commit_cmds)
    _update_activity_summary(activity_type, activity_rights)


def _release_ownership_of_activity(committer_id, activity_id, activity_type):
    """Releases ownership of the given activity to the community.

    Args:
        committer_id: str. ID of the user who is performing the action.
        activity_id: str. ID of the activity.
        activity_type: str. The type of activity. Possible values:
            constants.ACTIVITY_TYPE_EXPLORATION
            constants.ACTIVITY_TYPE_COLLECTION

    Raise:
        Exception. The committer does not have release rights.
    """
    if not Actor(committer_id).can_release_ownership(
            activity_type, activity_id):
        logging.error(
            'User %s tried to release ownership of %s %s but was '
            'refused permission.' % (committer_id, activity_type, activity_id))
        raise Exception(
            'The ownership of this %s cannot be released.' % activity_type)

    activity_rights = _get_activity_rights(activity_type, activity_id)
    activity_rights.community_owned = True
    activity_rights.owner_ids = []
    activity_rights.editor_ids = []
    activity_rights.viewer_ids = []
    commit_cmds = [{
        'cmd': CMD_RELEASE_OWNERSHIP,
    }]

    _save_activity_rights(
        committer_id, activity_rights, activity_type,
        '%s ownership released to the community.' % activity_type, commit_cmds)
    _update_activity_summary(activity_type, activity_rights)


def _change_activity_status(
        committer_id, activity_id, activity_type, new_status, commit_message):
    """Changes the status of the given activity.

    Args:
        committer_id: str. ID of the user who is performing the update action.
        activity_id: str. ID of the activity.
        activity_type: str. The type of activity. Possible values:
            constants.ACTIVITY_TYPE_EXPLORATION
            constants.ACTIVITY_TYPE_COLLECTION
        new_status: str. The new status of the activity.
        commit_message: str. The human-written commit message for this change.
    """
    activity_rights = _get_activity_rights(activity_type, activity_id)
    old_status = activity_rights.status
    activity_rights.status = new_status
    if activity_type == constants.ACTIVITY_TYPE_EXPLORATION:
        cmd_type = CMD_CHANGE_EXPLORATION_STATUS
    elif activity_type == constants.ACTIVITY_TYPE_COLLECTION:
        cmd_type = CMD_CHANGE_COLLECTION_STATUS
    commit_cmds = [{
        'cmd': cmd_type,
        'old_status': old_status,
        'new_status': new_status
    }]

    if new_status != ACTIVITY_STATUS_PRIVATE:
        activity_rights.viewer_ids = []
        if activity_rights.first_published_msec is None:
            activity_rights.first_published_msec = (
                utils.get_current_time_in_millisecs())

    _save_activity_rights(
        committer_id, activity_rights, activity_type, commit_message,
        commit_cmds)
    _update_activity_summary(activity_type, activity_rights)


def _publish_activity(committer_id, activity_id, activity_type):
    """Publishes the given activity.

    Args:
        committer_id: str. ID of the committer.
        activity_id: str. ID of the activity.
        activity_type: str. The type of activity. Possible values:
            constants.ACTIVITY_TYPE_EXPLORATION
            constants.ACTIVITY_TYPE_COLLECTION

    Raises:
        Exception. The committer does not have rights to publish the
            activity.
    """
    if not Actor(committer_id).can_publish(activity_type, activity_id):
        logging.error(
            'User %s tried to publish %s %s but was refused '
            'permission.' % (committer_id, activity_type, activity_id))
        raise Exception('This %s cannot be published.' % activity_type)

    _change_activity_status(
        committer_id, activity_id, activity_type, ACTIVITY_STATUS_PUBLIC,
        '%s published.' % activity_type)


def _unpublish_activity(committer_id, activity_id, activity_type):
    """Unpublishes the given activity.

    Args:
        committer_id: str. ID of the committer.
        activity_id: str. ID of the activity.
        activity_type: str. The type of activity. Possible values:
            constants.ACTIVITY_TYPE_EXPLORATION
            constants.ACTIVITY_TYPE_COLLECTION

    Raises:
        Exception. The committer does not have rights to unpublish the
            activity.
    """
    if not Actor(committer_id).can_unpublish(activity_type, activity_id):
        logging.error(
            'User %s tried to unpublish %s %s but was refused '
            'permission.' % (committer_id, activity_type, activity_id))
        raise Exception('This %s cannot be unpublished.' % activity_type)

    _change_activity_status(
        committer_id, activity_id, activity_type, ACTIVITY_STATUS_PRIVATE,
        '%s unpublished.' % activity_type)

    activity_services.remove_featured_activity(activity_type, activity_id)


def _publicize_activity(committer_id, activity_id, activity_type):
    """Publicizes the given activity.

    Args:
        committer_id: str. ID of the committer.
        activity_id: str. ID of the activity.
        activity_type: str. The type of activity. Possible values:
            constants.ACTIVITY_TYPE_EXPLORATION
            constants.ACTIVITY_TYPE_COLLECTION

    Raises:
        Exception. The committer does not have rights to publicize the activity.
    """
    if not Actor(committer_id).can_publicize(activity_type, activity_id):
        logging.error(
            'User %s tried to publicize %s %s but was refused '
            'permission.' % (committer_id, activity_type, activity_id))
        raise Exception('This %s cannot be marked as "featured".' % (
            activity_type))

    _change_activity_status(
        committer_id, activity_id, activity_type, ACTIVITY_STATUS_PUBLICIZED,
        '%s publicized.' % activity_type)


def _unpublicize_activity(committer_id, activity_id, activity_type):
    """Unpublicizes the given activity.

    Args:
        committer_id: str. ID of the committer.
        activity_id: str. ID of the activity.
        activity_type: str. The type of activity. Possible values:
            constants.ACTIVITY_TYPE_EXPLORATION
            constants.ACTIVITY_TYPE_COLLECTION

    Raises:
        Exception. The committer does not have rights to unpublicize the
            activity.
    """
    if not Actor(committer_id).can_unpublicize(activity_type, activity_id):
        logging.error(
            'User %s tried to unpublicize exploration %s but was refused '
            'permission.' % (committer_id, activity_id))
        raise Exception('This exploration cannot be unmarked as "featured".')

    _change_activity_status(
        committer_id, activity_id, activity_type, ACTIVITY_STATUS_PUBLIC,
        'Exploration unpublicized.')


# Rights functions for activities.
def assign_role_for_exploration(
        committer_id, exploration_id, assignee_id, new_role):
    """Assigns a user to the given role and subscribes the assignee to future
    exploration updates.

    The caller should ensure that assignee_id corresponds to a valid user in
    the system.

    Args:
        committer_id: str. ID of the committer.
        exploration_id: str. ID of the exploration.
        assignee_id: str. ID of the user whose role is being changed.
        new_role: str. The name of the new role: One of
            ROLE_OWNER
            ROLE_EDITOR

    Raises:
        Exception. This could potentially throw an exception from
            _assign_role.
    """
    _assign_role(
        committer_id, assignee_id, new_role, exploration_id,
        constants.ACTIVITY_TYPE_EXPLORATION)
    if new_role in [ROLE_OWNER, ROLE_EDITOR]:
        subscription_services.subscribe_to_exploration(
            assignee_id, exploration_id)


def release_ownership_of_exploration(committer_id, exploration_id):
    """Releases ownership of the given exploration to the community.

    Args:
        committer_id: str. ID of the committer.
        exploration_id: str. ID of the exploration.

    Raises:
        Exception. This could potentially throw an exception from
            _release_ownership_of_activity.
    """
    _release_ownership_of_activity(
        committer_id, exploration_id, constants.ACTIVITY_TYPE_EXPLORATION)


def set_private_viewability_of_exploration(
        committer_id, exploration_id, viewable_if_private):
    """Sets the viewable_if_private attribute for the given exploration's rights
    object.

    If viewable_if_private is True, this allows a private exploration
    to be viewed by anyone with the link.

    Args:
        committer_id: str. ID of the committer.
        exploration_id: str. ID of the exploration.
        viewable_if_private: bool. Whether the exploration should be made
            viewable (by anyone with the link).

    Raises:
        Exception. The committer does not have the permission to perform change
            action.
        Exception. If the viewable_if_private property is already as desired.
    """
    if not Actor(committer_id).can_change_private_viewability(
            constants.ACTIVITY_TYPE_EXPLORATION, exploration_id):
        logging.error(
            'User %s tried to change private viewability of exploration %s '
            'but was refused permission.' % (committer_id, exploration_id))
        raise Exception(
            'The viewability status of this exploration cannot be changed.')

    exploration_rights = get_exploration_rights(exploration_id)
    old_viewable_if_private = exploration_rights.viewable_if_private
    if old_viewable_if_private == viewable_if_private:
        raise Exception(
            'Trying to change viewability status of this exploration to %s, '
            'but that is already the current value.' % viewable_if_private)

    exploration_rights.viewable_if_private = viewable_if_private
    commit_cmds = [{
        'cmd': CMD_CHANGE_PRIVATE_VIEWABILITY,
        'old_viewable_if_private': old_viewable_if_private,
        'new_viewable_if_private': viewable_if_private,
    }]
    commit_message = (
        'Made exploration viewable to anyone with the link.'
        if viewable_if_private else
        'Made exploration viewable only to invited playtesters.')

    _save_activity_rights(
        committer_id, exploration_rights, constants.ACTIVITY_TYPE_EXPLORATION,
        commit_message, commit_cmds)
    _update_exploration_summary(exploration_rights)


def publish_exploration(committer_id, exploration_id):
    """Publishes the given exploration.

    It is the responsibility of the caller to check that the exploration is
    valid prior to publication.

    Args:
        committer_id: str. ID of the committer.
        exploration_id: str. ID of the exploration.

    Raises:
        Exception. This could potentially throw an exception from
            _publish_activity.
    """
    _publish_activity(
        committer_id, exploration_id, constants.ACTIVITY_TYPE_EXPLORATION)


def unpublish_exploration(committer_id, exploration_id):
    """Unpublishes the given exploration.

    Args:
        committer_id: str. ID of the committer.
        exploration_id: str. ID of the exploration.

    Raises:
        Exception. This could potentially throw an exception from
            _unpublish_activity.
    """
    _unpublish_activity(
        committer_id, exploration_id, constants.ACTIVITY_TYPE_EXPLORATION)


def publicize_exploration(committer_id, exploration_id):
    """Publicizes the given exploration.

    It is the responsibility of the caller to check that the exploration is
    valid prior to publicizing it.

    Args:
        committer_id: str. ID of the committer.
        exploration_id: str. ID of the exploration.

    Raises:
        Exception. This could potentially throw an exception from
            _publicize_activity.
    """
    _publicize_activity(
        committer_id, exploration_id, constants.ACTIVITY_TYPE_EXPLORATION)


def unpublicize_exploration(committer_id, exploration_id):
    """Unpublicizes the given exploration.

    Args:
        committer_id: str. ID of the committer.
        exploration_id: str. ID of the exploration.

    Raises:
        Exception. This could potentially throw an exception from
            _unpublicize_activity.
    """
    _unpublicize_activity(
        committer_id, exploration_id, constants.ACTIVITY_TYPE_EXPLORATION)


# Rights functions for collections.
def assign_role_for_collection(
        committer_id, collection_id, assignee_id, new_role):
    """Assign the given user to the given role and subscribes the assignee
    to future collection updates.

    The caller should ensure that assignee_id corresponds to a valid user in
    the system.

    Args:
        committer_id: str. ID of the committer.
        collection_id: str. ID of the collection.
        assignee_id: str. ID of the user whose role is being changed.
        new_role: str. The name of the new role: One of
            ROLE_OWNER
            ROLE_EDITOR

    Raises:
        Exception. This could potentially throw an exception from
            _assign_role.
    """
    _assign_role(
        committer_id, assignee_id, new_role, collection_id,
        constants.ACTIVITY_TYPE_COLLECTION)
    if new_role in [ROLE_OWNER, ROLE_EDITOR]:
        subscription_services.subscribe_to_collection(
            assignee_id, collection_id)


def release_ownership_of_collection(committer_id, collection_id):
    """Releases ownership of the given collection to the community.

    Args:
        committer_id: str. ID of the committer.
        collection_id: str. ID of the collection.

    Raises:
        Exception. This could potentially throw an exception from
            _release_ownership_of_activity.
    """
    _release_ownership_of_activity(
        committer_id, collection_id, constants.ACTIVITY_TYPE_COLLECTION)


def publish_collection(committer_id, collection_id):
    """Publishes the given collection.

    It is the responsibility of the caller to check that the collection is
    valid prior to publication.

    Args:
        committer_id: str. ID of the committer.
        collection_id: str. ID of the collection.

    Raises:
        Exception. This could potentially throw an exception from
            _publish_activity.
    """
    _publish_activity(
        committer_id, collection_id, constants.ACTIVITY_TYPE_COLLECTION)


def unpublish_collection(committer_id, collection_id):
    """Unpublishes the given collection.

    Args:
        committer_id: str. ID of the committer.
        collection_id: str. ID of the collection.

    Raises:
        Exception. This could potentially throw an exception from
            _unpublish_activity.

    """
    _unpublish_activity(
        committer_id, collection_id, constants.ACTIVITY_TYPE_COLLECTION)


def publicize_collection(committer_id, collection_id):
    """Publicizes the given collection.

    It is the responsibility of the caller to check that the collection is
    valid prior to publicizing it.

    Args:
        committer_id: str. ID of the committer.
        collection_id: str. ID of the collection.

    Raises:
        Exception. This could potentially throw an exception from
            _publicize_activity.
    """
    _publicize_activity(
        committer_id, collection_id, constants.ACTIVITY_TYPE_COLLECTION)


def unpublicize_collection(committer_id, collection_id):
    """Unpublicizes the given collection.

    Args:
        committer_id: str. ID of the committer.
        collection_id: str. ID of the collection.

    Raises:
        Exception. This could potentially throw an exception from
            _unpublicize_activity.
    """
    _unpublicize_activity(
        committer_id, collection_id, constants.ACTIVITY_TYPE_COLLECTION)


def check_can_access_activity(
        user_id, user_actions, activity_type, activity_rights):
    """Checks whether the user can access given activity.

    Args:
        user_id: str or None. Id of the given user.
        user_actions: list(str). List of actions given user can perform.
        activity_type: str. Signifies whether activity is exploration or
            collection.
        activity_rights: rights_object or None. Rights object of the given
            activity.

    Returns:
        bool. Whether the given activity can be accessed.
    """
    action_play_public = (
        role_services.ACTION_PLAY_ANY_PUBLIC_EXPLORATION
        if activity_type == constants.ACTIVITY_TYPE_EXPLORATION
        else role_services.ACTION_PLAY_ANY_PUBLIC_COLLECTION)

    action_play_private = (
        role_services.ACTION_PLAY_ANY_PRIVATE_EXPLORATION
        if activity_type == constants.ACTIVITY_TYPE_EXPLORATION
        else role_services.ACTION_PLAY_ANY_PRIVATE_COLLECTION)

    if activity_rights is None:
        return False
    elif activity_rights.is_published():
        return bool(action_play_public in user_actions)
    elif activity_rights.is_private():
        return bool(
            (action_play_private in user_actions) or
            activity_rights.is_viewer(user_id) or
            activity_rights.is_owner(user_id) or
            activity_rights.is_editor(user_id) or
            activity_rights.viewable_if_private)


def check_can_edit_activity(
        user_id, user_actions, activity_type, activity_rights):
    """Checks whether the user can edit given activity.

    Args:
        user_id: str or None. Id of the given user.
        user_actions: list(str). List of actions the user can perform.
        activity_type: str. Signifies whether activity is exploration or
            collection.
        activity_rights: rights_object or None. Rights object of the given
            activity.

    Returns:
        bool. Whether the given user can edit this activity.
    """
    action_edit_any_activity = (
        role_services.ACTION_EDIT_ANY_EXPLORATION
        if activity_type == constants.ACTIVITY_TYPE_EXPLORATION
        else role_services.ACTION_EDIT_ANY_COLLECTION)
    action_edit_any_public_activity = (
        role_services.ACTION_EDIT_ANY_PUBLIC_EXPLORATION
        if activity_type == constants.ACTIVITY_TYPE_EXPLORATION
        else role_services.ACTION_EDIT_ANY_PUBLIC_COLLECTION)
    action_edit_owned_activity = (
        role_services.ACTION_EDIT_OWNED_EXPLORATION
        if activity_type == constants.ACTIVITY_TYPE_EXPLORATION
        else role_services.ACTION_EDIT_OWNED_COLLECTION)

    if action_edit_owned_activity in user_actions:
        if (activity_rights.is_owner(user_id) or
                activity_rights.is_editor(user_id)):
            return True
    else:
        return False

    if (activity_rights.community_owned or
            (action_edit_any_activity in user_actions)):
        return True

    if (activity_rights.is_published() and
            (action_edit_any_public_activity in user_actions)):
        return True

    return False


def check_can_unpublish_collection(user_actions, collection_rights):
    """Checks whether the user can unpublish given collection.

    Args:
        user_actions: list(str). List of actions the user can perform.
        collection_rights: rights_object or None. Rights object of given
            collection.

    Returns:
        bool. Whether the user can unpublish given collection.
    """
    if collection_rights is None:
        return False

    if (collection_rights.is_published() and
            role_services.ACTION_UNPUBLISH_PUBLIC_COLLECTION in user_actions):
        return True

    return False


def check_can_delete_exploration(user_id, user_actions, exploration_rights):
    """Checks whether the user can delete given exploration.

    Args:
        user_id: str or None. Id of the user.
        user_actions: list(str). List of actions the user can perform.
        exploration_rights: rights_object or None. Rights object of given
            exploration.

    Returns:
        bool. Whether the user can delete given exploration.
    """
    if exploration_rights is None:
        return False

    if (exploration_rights.is_private() and
            (role_services.ACTION_DELETE_OWNED_PRIVATE_EXPLORATION in (
                user_actions)) and
            exploration_rights.is_owner(user_id)):
        return True
    elif (exploration_rights.is_published() and
          role_services.ACTION_DELETE_ANY_PUBLIC_EXPLORATION in (
              user_actions)):
        return True
    return False


def check_can_modify_exploration_roles(
        user_id, user_actions, exploration_rights):
    """Checks whether the user can modify roles for given exploration.

    Args:
        user_id: str or None. Id of the user.
        user_actions: list(str). List of actions the user can perform.
        exploration_rights: rights_object or None. Rights Object of given
            exploration.

    Returns:
        bool. Whether the user can modify roles for given exploration.
    """
    if exploration_rights is None:
        return False

    if (exploration_rights.community_owned or
            exploration_rights.cloned_from):
        return False

    if (role_services.ACTION_MODIFY_ROLES_FOR_ANY_EXPLORATION in
            user_actions):
        return True
    if (role_services.ACTION_MODIFY_ROLES_FOR_OWNED_EXPLORATION in
            user_actions):
        if exploration_rights.is_owner(user_id):
            return True
    return False


def check_can_release_ownership(user_id, user_actions, exploration_rights):
    """Checks whether the user can release ownership for given exploration.

    Args:
        user_id: str or None. Id of the user.
        user_actions: list(str). List of actions the user can perform.
        exploration_rights: rights_object or None. Rights Object of given
            exploration.

    Returns:
        bool. Whether the user can release ownership for given exploration.
    """
    if exploration_rights is None:
        return False

    if exploration_rights.is_private():
        return False

    return check_can_modify_exploration_roles(
        user_id, user_actions, exploration_rights)


def check_can_publish_exploration(user_id, user_actions, exploration_rights):
    """Checks whether the user can publish given exploration.

    Args:
        user_id: str or None. Id of the user.
        user_actions: list(str). List of actions the user can perform.
        exploration_rights: rights_object or None. Rights Object of given
            exploration.

    Returns:
        bool. Whether the user can publish given exploration.
    """
    if exploration_rights is None:
        return False

    if exploration_rights.cloned_from:
        return False

    if role_services.ACTION_PUBLISH_ANY_EXPLORATION in user_actions:
        return True

    if exploration_rights.is_private():
        if role_services.ACTION_PUBLISH_OWNED_EXPLORATION in user_actions:
            if exploration_rights.is_owner(user_id):
                return True

    return False


def check_can_publicize_exploration(user_actions, exploration_rights):
    """Checks whether the user can publicize given exploration.

    Args:
        user_actions: list(str). List of actions the user can perform.
        exploration_rights: rights_object or None. Rights object of given
            exploration.

    Returns:
        bool. Whether the user can publicize given exploration.
    """
    if exploration_rights is None:
        return False

    if exploration_rights.status == ACTIVITY_STATUS_PUBLIC:
        if role_services.ACTION_PUBLICIZE_EXPLORATION in user_actions:
            return True


def check_can_unpublicize_exploration(user_actions, exploration_rights):
    """Checks whether the user can unpublicize given exploration.

    Args:
        user_actions: list(str). List of actions the user can perform.
        exploration_rights: rights_object or None. Rights object of given
            exploration.

    Returns:
        bool. Whether the user can unpublicize given exploration.
    """
    if exploration_rights is None:
        return False

    if exploration_rights.status == ACTIVITY_STATUS_PUBLICIZED:
        if role_services.ACTION_UNPUBLICIZE_EXPLORATION in user_actions:
            return True


def check_can_unpublish_exploration(user_actions, exploration_rights):
    """Checks whether the user can unpublish given exploration.

    Args:
        user_actions: list(str). List of actions the user can perform.
        exploration_rights: rights_object or None. Rights object of given
            exploration.

    Returns:
        bool. Whether the user can unpublish given exploration.
    """
    if exploration_rights is None:
        return False

    if exploration_rights.community_owned:
        return False

    if exploration_rights.status == ACTIVITY_STATUS_PUBLIC:
        if role_services.ACTION_UNPUBLISH_PUBLIC_EXPLORATION in user_actions:
            return True
    return False
