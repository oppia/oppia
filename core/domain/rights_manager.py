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

__author__ = 'Sean Lip'


import logging

from core.domain import collection_domain
from core.domain import config_domain
from core.domain import event_services
from core.domain import exp_domain
from core.domain import subscription_services
from core.domain import user_services
from core.platform import models
current_user_services = models.Registry.import_current_user_services()
(collection_models, exp_models,) = models.Registry.import_models([
    models.NAMES.collection, models.NAMES.exploration
])
import utils


# IMPORTANT: Ensure that all changes to how these cmds are interpreted preserve
# backward-compatibility with previous exploration snapshots in the datastore.
# Do not modify the definitions of CMD keys that already exist.
CMD_CREATE_NEW = 'create_new'
CMD_CHANGE_ROLE = 'change_role'
CMD_CHANGE_EXPLORATION_STATUS = 'change_exploration_status'
CMD_CHANGE_COLLECTION_STATUS = 'change_collection_status'
CMD_CHANGE_PRIVATE_VIEWABILITY = 'change_private_viewability'
CMD_RELEASE_OWNERSHIP = 'release_ownership'

ACTIVITY_STATUS_PRIVATE = 'private'
ACTIVITY_STATUS_PUBLIC = 'public'
ACTIVITY_STATUS_PUBLICIZED = 'publicized'

ACTIVITY_TYPE_EXPLORATION = 'exploration'
ACTIVITY_TYPE_COLLECTION = 'collection'

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
                 viewable_if_private=False):
        self.id = exploration_id
        self.owner_ids = owner_ids
        self.editor_ids = editor_ids
        self.viewer_ids = viewer_ids
        self.community_owned = community_owned
        self.cloned_from = cloned_from
        self.status = status
        self.viewable_if_private = viewable_if_private

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
        """Returns a dict suitable for use by the frontend."""
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


def _get_activity_rights_from_model(activity_rights_model, activity_type):
    return ActivityRights(
        activity_rights_model.id,
        activity_rights_model.owner_ids,
        activity_rights_model.editor_ids,
        activity_rights_model.viewer_ids,
        community_owned=activity_rights_model.community_owned,
        cloned_from=(
            activity_rights_model.cloned_from
            if activity_type == ACTIVITY_TYPE_EXPLORATION else None),
        status=activity_rights_model.status,
        viewable_if_private=activity_rights_model.viewable_if_private,
    )


def _save_activity_rights(
        committer_id, activity_rights, activity_type, commit_message,
        commit_cmds):
    """Saves an ExplorationRights or CollectionRights domain object to the
    datastore.
    """
    activity_rights.validate()

    if activity_type == ACTIVITY_TYPE_EXPLORATION:
        model_cls = exp_models.ExplorationRightsModel
    elif activity_type == ACTIVITY_TYPE_COLLECTION:
        model_cls = collection_models.CollectionRightsModel
    model = model_cls.get(activity_rights.id, strict=False)

    model.owner_ids = activity_rights.owner_ids
    model.editor_ids = activity_rights.editor_ids
    model.viewer_ids = activity_rights.viewer_ids
    model.community_owned = activity_rights.community_owned
    model.status = activity_rights.status
    model.viewable_if_private = activity_rights.viewable_if_private

    model.commit(committer_id, commit_message, commit_cmds)


# Update summary of changed activity (note that the activity rights id is the
# same as the activity id).
# TODO(msl): get rid of inline imports by refactoring code
def _update_exploration_summary(activity_rights):
    from core.domain import exp_services
    exp_services.update_exploration_summary(activity_rights.id)


def _update_collection_summary(activity_rights):
    from core.domain import collection_services
    collection_services.update_collection_summary(activity_rights.id)


def _update_activity_summary(activity_type, activity_rights):
    if activity_type == ACTIVITY_TYPE_EXPLORATION:
        _update_exploration_summary(activity_rights)
    elif activity_type == ACTIVITY_TYPE_COLLECTION:
        _update_collection_summary(activity_rights)


def create_new_exploration_rights(exploration_id, committer_id):
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
    ).commit(committer_id, 'Created new exploration', commit_cmds)

    subscription_services.subscribe_to_exploration(
        committer_id, exploration_id)


def get_exploration_rights(exploration_id, strict=True):
    """Retrieves the rights for this exploration from the datastore."""
    model = exp_models.ExplorationRightsModel.get(
        exploration_id, strict=strict)
    if model is None:
        return None
    return _get_activity_rights_from_model(model, ACTIVITY_TYPE_EXPLORATION)


def is_exploration_private(exploration_id):
    exploration_rights = get_exploration_rights(exploration_id)
    return exploration_rights.status == ACTIVITY_STATUS_PRIVATE


def is_exploration_public(exploration_id):
    exploration_rights = get_exploration_rights(exploration_id)
    return exploration_rights.status == ACTIVITY_STATUS_PUBLIC


def is_exploration_cloned(exploration_id):
    exploration_rights = get_exploration_rights(exploration_id)
    return bool(exploration_rights.cloned_from)


def create_new_collection_rights(collection_id, committer_id):
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
    ).commit(committer_id, 'Created new collection', commit_cmds)

    subscription_services.subscribe_to_collection(committer_id, collection_id)


def get_collection_rights(collection_id, strict=True):
    """Retrieves the rights for this collection from the datastore."""
    model = collection_models.CollectionRightsModel.get(
        collection_id, strict=strict)
    if model is None:
        return None
    return _get_activity_rights_from_model(model, ACTIVITY_TYPE_COLLECTION)


def is_collection_private(collection_id):
    collection_rights = get_collection_rights(collection_id)
    return collection_rights.status == ACTIVITY_STATUS_PRIVATE


def is_collection_public(collection_id):
    collection_rights = get_collection_rights(collection_id)
    return collection_rights.status == ACTIVITY_STATUS_PUBLIC


def _get_activity_rights(activity_type, activity_id):
    """This function returns None if this function fails to retrieve the rights
    object for a given activity based on its type. If the activity_type value
    provided is unknown, an Exception is raised.
    """
    if activity_type == ACTIVITY_TYPE_EXPLORATION:
        return get_exploration_rights(activity_id, strict=False)
    elif activity_type == ACTIVITY_TYPE_COLLECTION:
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

    def is_admin(self):
        return self.user_id in config_domain.ADMIN_IDS.value

    def is_moderator(self):
        return (self.is_admin() or
                self.user_id in config_domain.MODERATOR_IDS.value)

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
            self._has_editing_rights(rights_object) or (
                self.is_moderator() and (
                    rights_object.status != ACTIVITY_STATUS_PRIVATE)
            )
        )

    def _can_delete(self, rights_object):
        is_deleting_own_private_object = (
            rights_object.status == ACTIVITY_STATUS_PRIVATE and
            self._is_owner(rights_object)
        )

        is_moderator_deleting_public_object = (
            rights_object.status == ACTIVITY_STATUS_PUBLIC and
            self.is_moderator()
        )

        return (
            is_deleting_own_private_object or
            is_moderator_deleting_public_object)

    def is_owner(self, activity_type, activity_id):
        activity_rights = _get_activity_rights(activity_type, activity_id)
        if activity_rights is None:
            return False
        return self._is_owner(activity_rights)

    def has_editing_rights(self, activity_type, activity_id):
        """Whether this user has editing rights for this activity.

        This is true if the activity is community-owned, or if the user is in
        the owner/editor list for the activity.
        """
        activity_rights = _get_activity_rights(activity_type, activity_id)
        if activity_rights is None:
            return False
        return self._has_editing_rights(activity_rights)

    def has_viewing_rights(self, activity_type, activity_id):
        activity_rights = _get_activity_rights(activity_type, activity_id)
        if activity_rights is None:
            return False
        return self._has_viewing_rights(activity_rights)

    def can_play(self, activity_type, activity_id):
        """Whether the user can play the reader view of this activity."""
        activity_rights = _get_activity_rights(activity_type, activity_id)
        if activity_rights is None:
            return False
        return self._can_play(activity_rights)

    def can_view(self, activity_type, activity_id):
        """Whether the user can view the editor page for this activity."""
        return self.can_play(activity_type, activity_id)

    def can_edit(self, activity_type, activity_id):
        # TODO(sll): Add a check here for whether a user is banned or not,
        # rather than having this check in the controller.
        activity_rights = _get_activity_rights(activity_type, activity_id)
        if activity_rights is None:
            return False
        return self._can_edit(activity_rights)

    def can_delete(self, activity_type, activity_id):
        activity_rights = _get_activity_rights(activity_type, activity_id)
        if activity_rights is None:
            return False
        return self._can_delete(activity_rights)

    def can_change_private_viewability(
            self, activity_type, activity_id):
        """Note that this requires the activity in question to be private."""

        return self.can_publish(activity_type, activity_id)

    def can_publish(self, activity_type, activity_id):
        activity_rights = _get_activity_rights(activity_type, activity_id)
        if activity_rights is None:
            return False

        if activity_rights.status != ACTIVITY_STATUS_PRIVATE:
            return False
        if activity_rights.cloned_from:
            return False

        return self.is_owner(activity_type, activity_id) or self.is_admin()

    def can_unpublish(self, activity_type, activity_id):
        activity_rights = _get_activity_rights(activity_type, activity_id)
        if activity_rights is None:
            return False

        if activity_rights.status != ACTIVITY_STATUS_PUBLIC:
            return False
        if activity_rights.community_owned:
            return False
        return self.is_moderator()

    def can_modify_roles(self, activity_type, activity_id):
        activity_rights = _get_activity_rights(activity_type, activity_id)
        if activity_rights is None:
            return False

        if activity_rights.community_owned or activity_rights.cloned_from:
            return False
        return self.is_admin() or self.is_owner(activity_type, activity_id)

    def can_release_ownership(self, activity_type, activity_id):
        activity_rights = _get_activity_rights(activity_type, activity_id)
        if activity_rights is None:
            return False

        if activity_rights.status == ACTIVITY_STATUS_PRIVATE:
            return False
        return self.can_modify_roles(activity_type, activity_id)

    def can_publicize(self, activity_type, activity_id):
        activity_rights = _get_activity_rights(activity_type, activity_id)
        if activity_rights is None:
            return False

        if activity_rights.status != ACTIVITY_STATUS_PUBLIC:
            return False
        return self.is_moderator()

    def can_unpublicize(self, activity_type, activity_id):
        activity_rights = _get_activity_rights(activity_type, activity_id)
        if activity_rights is None:
            return False

        if activity_rights.status != ACTIVITY_STATUS_PUBLICIZED:
            return False
        return self.is_moderator()


def _assign_role(
        committer_id, assignee_id, new_role, activity_id, activity_type):
    """Args:
    - committer_id: str. The user_id of the user who is performing the action.
    - activity_rights: The storage object for the rights of this activity (
        one of: ExplorationRightsModel or CollectionRightsModel).
    - assignee_id: str. The user_id of the user whose role is being changed.
    - new_role: str. The name of the new role: either 'owner', 'editor' or
        'viewer'.
    - activity_id: str. The ID of the exploration or collection.
    - activity_type: str. One of ACTIVITY_TYPE_EXPLORATION or
        ACTIVITY_TYPE_COLLECTION.
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
        if Actor(assignee_id)._is_owner(activity_rights):
            raise Exception('This user already owns this %s.' % activity_type)

        activity_rights.owner_ids.append(assignee_id)

        if assignee_id in activity_rights.viewer_ids:
            activity_rights.viewer_ids.remove(assignee_id)
            old_role = ROLE_VIEWER
        if assignee_id in activity_rights.editor_ids:
            activity_rights.editor_ids.remove(assignee_id)
            old_role = ROLE_EDITOR

    elif new_role == ROLE_EDITOR:
        if Actor(assignee_id)._has_editing_rights(activity_rights):
            raise Exception(
                'This user already can edit this %s.'  % activity_type)

        if activity_rights.community_owned:
            raise Exception(
                'Community-owned %ss can be edited by anyone.' % activity_type)

        activity_rights.editor_ids.append(assignee_id)

        if assignee_id in activity_rights.viewer_ids:
            activity_rights.viewer_ids.remove(assignee_id)
            old_role = ROLE_VIEWER

    elif new_role == ROLE_VIEWER:
        if Actor(assignee_id)._has_viewing_rights(activity_rights):
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

    _save_activity_rights(
        committer_id, activity_rights, activity_type, commit_message, commit_cmds)
    _update_activity_summary(activity_type, activity_rights)


def _release_ownership_of_activity(committer_id, activity_id, activity_type):
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
    """Change the status of an activity. Commits changes.

    Args:
    - committer_id: str. The id of the user who is performing the update
        action.
    - activity_id: str. The id of the collection or activity.
    - activity_type: str. One of ACTIVITY_TYPE_EXPLORATION or
        ACTIVITY_TYPE_COLLECTION.
    - new_status: str. The new status of the exploration.
    - commit_message: str. The human-written commit message for this change.
    """
    activity_rights = _get_activity_rights(activity_type, activity_id)
    old_status = activity_rights.status
    activity_rights.status = new_status
    if activity_type == ACTIVITY_TYPE_EXPLORATION:
        cmd_type = CMD_CHANGE_EXPLORATION_STATUS
    elif activity_type == ACTIVITY_TYPE_COLLECTION:
        cmd_type = CMD_CHANGE_COLLECTION_STATUS
    commit_cmds = [{
        'cmd': cmd_type,
        'old_status': old_status,
        'new_status': new_status
    }]

    if new_status != ACTIVITY_STATUS_PRIVATE:
        activity_rights.viewer_ids = []

    _save_activity_rights(
        committer_id, activity_rights, activity_type, commit_message,
        commit_cmds)
    _update_activity_summary(activity_type, activity_rights)

    if activity_type == ACTIVITY_TYPE_EXPLORATION:
        event_services.ExplorationStatusChangeEventHandler.record(activity_id)
    elif activity_type == ACTIVITY_TYPE_COLLECTION:
        event_services.CollectionStatusChangeEventHandler.record(activity_id)


def _publish_activity(committer_id, activity_id, activity_type):
    if not Actor(committer_id).can_publish(activity_type, activity_id):
        logging.error(
            'User %s tried to publish %s %s but was refused '
            'permission.' % (committer_id, activity_type, activity_id))
        raise Exception('This %s cannot be published.' % activity_type)

    _change_activity_status(
        committer_id, activity_id, activity_type, ACTIVITY_STATUS_PUBLIC,
        '%s published.' % activity_type)


def _unpublish_activity(committer_id, activity_id, activity_type):
    if not Actor(committer_id).can_unpublish(activity_type, activity_id):
        logging.error(
            'User %s tried to unpublish %s %s but was refused '
            'permission.' % (committer_id, activity_type, activity_id))
        raise Exception('This %s cannot be unpublished.' % activity_type)

    _change_activity_status(
        committer_id, activity_id, activity_type, ACTIVITY_STATUS_PRIVATE,
        '%s unpublished.' % activity_type)


def _publicize_activity(committer_id, activity_id, activity_type):
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
    """Unpublicizes an exploration. Commits changes."""
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
    """Assign `assignee_id` to the given role and subscribes the assignee
    to future exploration updates.

    The caller should ensure that assignee_id corresponds to a valid user in
    the system.

    Args:
    - committer_id: str. The user_id of the user who is performing the action.
    - exploration_id: str. The exploration id.
    - assignee_id: str. The user_id of the user whose role is being changed.
    - new_role: str. The name of the new role: either 'owner', 'editor' or
        'viewer'.
    """
    _assign_role(
        committer_id, assignee_id, new_role, exploration_id,
        ACTIVITY_TYPE_EXPLORATION)
    if new_role in [ROLE_OWNER, ROLE_EDITOR]:
        subscription_services.subscribe_to_exploration(
            assignee_id, exploration_id)


def release_ownership_of_exploration(committer_id, exploration_id):
    """Releases ownership of an exploration to the community.

    Commits changes.
    """
    _release_ownership_of_activity(
        committer_id, exploration_id, ACTIVITY_TYPE_EXPLORATION)


def set_private_viewability_of_exploration(
        committer_id, exploration_id, viewable_if_private):
    """Sets the viewable_if_private attribute for an exploration's rights
    object. If viewable_if_private is True, this allows an private exploration
    to be viewed by anyone with the link.
    """
    if not Actor(committer_id).can_change_private_viewability(
            ACTIVITY_TYPE_EXPLORATION, exploration_id):
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
        committer_id, exploration_rights, ACTIVITY_TYPE_EXPLORATION,
        commit_message, commit_cmds)
    _update_exploration_summary(exploration_rights)


def publish_exploration(committer_id, exploration_id):
    """Publish an exploration. Commits changes.

    It is the responsibility of the caller to check that the exploration is
    valid prior to publication.
    """
    _publish_activity(committer_id, exploration_id, ACTIVITY_TYPE_EXPLORATION)


def unpublish_exploration(committer_id, exploration_id):
    """Unpublishes an exploration. Commits changes."""
    _unpublish_activity(
        committer_id, exploration_id, ACTIVITY_TYPE_EXPLORATION)


def publicize_exploration(committer_id, exploration_id):
    """Publicizes an exploration. Commits changes.

    It is the responsibility of the caller to check that the exploration is
    valid prior to publicizing it.
    """
    _publicize_activity(
        committer_id, exploration_id, ACTIVITY_TYPE_EXPLORATION)


def unpublicize_exploration(committer_id, exploration_id):
    """Unpublicizes an exploration. Commits changes."""
    _unpublicize_activity(
        committer_id, exploration_id, ACTIVITY_TYPE_EXPLORATION)


# Rights functions for collections.
def assign_role_for_collection(
        committer_id, collection_id, assignee_id, new_role):
    """Assign `assignee_id` to the given role and subscribes the assignee
    to future collection updates.

    The caller should ensure that assignee_id corresponds to a valid user in
    the system.

    Args:
    - committer_id: str. The user_id of the user who is performing the action.
    - collection_id: str. The collection id.
    - assignee_id: str. The user_id of the user whose role is being changed.
    - new_role: str. The name of the new role: either 'owner', 'editor' or
        'viewer'.
    """
    _assign_role(
        committer_id, assignee_id, new_role, collection_id,
        ACTIVITY_TYPE_COLLECTION)
    if new_role in [ROLE_OWNER, ROLE_EDITOR]:
        subscription_services.subscribe_to_collection(
            assignee_id, collection_id)


def release_ownership_of_collection(committer_id, collection_id):
    """Releases ownership of an collection to the community.

    Commits changes.
    """
    _release_ownership_of_activity(
        committer_id, collection_id, ACTIVITY_TYPE_COLLECTION)


def publish_collection(committer_id, collection_id):
    """Publish an collection. Commits changes.

    It is the responsibility of the caller to check that the collection is
    valid prior to publication.
    """
    _publish_activity(committer_id, collection_id, ACTIVITY_TYPE_COLLECTION)


def unpublish_collection(committer_id, collection_id):
    """Unpublishes an collection. Commits changes."""
    _unpublish_activity(committer_id, collection_id, ACTIVITY_TYPE_COLLECTION)


def publicize_collection(committer_id, collection_id):
    """Publicizes an collection. Commits changes.

    It is the responsibility of the caller to check that the collection is
    valid prior to publicizing it.
    """
    _publicize_activity(committer_id, collection_id, ACTIVITY_TYPE_COLLECTION)


def unpublicize_collection(committer_id, collection_id):
    """Unpublicizes an collection. Commits changes."""
    _unpublicize_activity(
        committer_id, collection_id, ACTIVITY_TYPE_COLLECTION)
