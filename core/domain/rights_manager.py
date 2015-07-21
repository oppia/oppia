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

from core.domain import config_domain
from core.domain import collection_domain
from core.domain import event_services
from core.domain import exp_domain
from core.domain import subscription_services
from core.domain import user_services
from core.platform import models
current_user_services = models.Registry.import_current_user_services()
(exp_models,collection_models) = models.Registry.import_models([
    models.NAMES.exploration, models.NAMES.collection
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

EXPLORATION_STATUS_PRIVATE = 'private'
EXPLORATION_STATUS_PUBLIC = 'public'
EXPLORATION_STATUS_PUBLICIZED = 'publicized'

COLLECTION_STATUS_PRIVATE = 'private'
COLLECTION_STATUS_PUBLIC = 'public'
COLLECTION_STATUS_PUBLICIZED = 'publicized'

ROLE_OWNER = 'owner'
ROLE_EDITOR = 'editor'
ROLE_VIEWER = 'viewer'
ROLE_NONE = 'none'

ROLE_ADMIN = 'admin'
ROLE_MODERATOR = 'moderator'


class ExplorationRights(object):
    """Domain object for the rights/publication status of an exploration."""

    def __init__(self, exploration_id, owner_ids, editor_ids, viewer_ids,
                 community_owned=False, cloned_from=None,
                 status=EXPLORATION_STATUS_PRIVATE,
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
        """Validates an ExplorationRights object.

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

        if self.community_owned and self.status == EXPLORATION_STATUS_PRIVATE:
            raise utils.ValidationError(
                'Community-owned explorations cannot be private.')

        if self.status != EXPLORATION_STATUS_PRIVATE and self.viewer_ids:
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


class CollectionRights(object):
    """Domain object for the rights/publication status of an collection."""

    def __init__(self, collection_id, owner_ids, editor_ids, viewer_ids,
                 community_owned=False, status=COLLECTION_STATUS_PRIVATE,
                 viewable_if_private=False):
        self.id = collection_id
        self.owner_ids = owner_ids
        self.editor_ids = editor_ids
        self.viewer_ids = viewer_ids
        self.community_owned = community_owned
        self.status = status
        self.viewable_if_private = viewable_if_private

    def validate(self):
        """Validates an CollectionRights object.

        Raises:
          utils.ValidationError: if any of the owners, editors and viewers
          lists overlap, or if a community-owned collection has owners,
          editors or viewers specified.
        """
        if self.community_owned:
            if self.owner_ids or self.editor_ids or self.viewer_ids:
                raise utils.ValidationError(
                    'Community-owned collections should have no owners, '
                    'editors or viewers specified.')

        if self.community_owned and self.status == COLLECTION_STATUS_PRIVATE:
            raise utils.ValidationError(
                'Community-owned collections cannot be private.')

        if self.status != COLLECTION_STATUS_PRIVATE and self.viewer_ids:
            raise utils.ValidationError(
                'Public collections should have no viewers specified.')

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
                'status': self.status,
                'community_owned': True,
                'owner_names': [],
                'editor_names': [],
                'viewer_names': [],
                'viewable_if_private': self.viewable_if_private,
            }
        else:
            return {
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


def _get_exploration_rights_from_model(exploration_rights_model):
    return ExplorationRights(
        exploration_rights_model.id,
        exploration_rights_model.owner_ids,
        exploration_rights_model.editor_ids,
        exploration_rights_model.viewer_ids,
        community_owned=exploration_rights_model.community_owned,
        cloned_from=exploration_rights_model.cloned_from,
        status=exploration_rights_model.status,
        viewable_if_private=exploration_rights_model.viewable_if_private,
    )


def _save_exploration_rights(
        committer_id, exploration_rights, commit_message, commit_cmds):
    """Saves an ExplorationRights domain object to the datastore."""
    exploration_rights.validate()

    model = exp_models.ExplorationRightsModel.get(
        exploration_rights.id, strict=False)

    model.owner_ids = exploration_rights.owner_ids
    model.editor_ids = exploration_rights.editor_ids
    model.viewer_ids = exploration_rights.viewer_ids
    model.community_owned = exploration_rights.community_owned
    model.cloned_from = exploration_rights.cloned_from
    model.status = exploration_rights.status
    model.viewable_if_private = exploration_rights.viewable_if_private

    model.commit(committer_id, commit_message, commit_cmds)

    # update summary of changed exploration (note that exploration rights id
    # is the same as exploration id)
    # TODO(msl): get rid of inline import by refactoring code
    from core.domain import exp_services
    exp_services.update_exploration_summary(exploration_rights.id)


def create_new_exploration_rights(exploration_id, committer_id):
    exploration_rights = ExplorationRights(
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

    subscription_services.subscribe_to_activity(committer_id, exploration_id)


def get_exploration_rights(exploration_id):
    """Retrieves the rights for this exploration from the datastore."""
    model = exp_models.ExplorationRightsModel.get(exploration_id)
    if model is None:
        raise Exception('This exploration does not exist.')
    return _get_exploration_rights_from_model(model)


def is_exploration_private(exploration_id):
    exploration_rights = get_exploration_rights(exploration_id)
    return exploration_rights.status == EXPLORATION_STATUS_PRIVATE


def is_exploration_public(exploration_id):
    exploration_rights = get_exploration_rights(exploration_id)
    return exploration_rights.status == EXPLORATION_STATUS_PUBLIC


def is_exploration_cloned(exploration_id):
    exploration_rights = get_exploration_rights(exploration_id)
    return bool(exploration_rights.cloned_from)


def _get_collection_rights_from_model(collection_rights_model):
    return CollectionRights(
        collection_rights_model.id,
        collection_rights_model.owner_ids,
        collection_rights_model.editor_ids,
        collection_rights_model.viewer_ids,
        community_owned=collection_rights_model.community_owned,
        status=collection_rights_model.status,
        viewable_if_private=collection_rights_model.viewable_if_private,
    )


def _save_collection_rights(
        committer_id, collection_rights, commit_message, commit_cmds):
    """Saves a CollectionRights domain object to the datastore."""
    collection_rights.validate()

    model = collection_models.CollectionRightsModel.get(
        collection_rights.id, strict=False)

    model.owner_ids = collection_rights.owner_ids
    model.editor_ids = collection_rights.editor_ids
    model.viewer_ids = collection_rights.viewer_ids
    model.community_owned = collection_rights.community_owned
    model.status = collection_rights.status
    model.viewable_if_private = collection_rights.viewable_if_private

    model.commit(committer_id, commit_message, commit_cmds)

    # Update the summary of the changed collection (note that the collection
    # rights id is the same as collection id).
    # TODO(msl): get rid of inline import by refactoring code
    from core.domain import collection_services
    collection_services.update_collection_summary(collection_rights.id)


def create_new_collection_rights(collection_id, committer_id):
    collection_rights = CollectionRights(collection_id, [committer_id], [], [])
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


def get_collection_rights(collection_id):
    """Retrieves the rights for this collection from the datastore."""
    model = collection_models.CollectionRightsModel.get(collection_id)
    if model is None:
        raise Exception('This collection does not exist.')
    return _get_collection_rights_from_model(model)


def is_collection_private(collection_id):
    collection_rights = get_collection_rights(collection_id)
    return collection_rights.status == COLLECTION_STATUS_PRIVATE


def is_collection_public(collection_id):
    collection_rights = get_collection_rights(collection_id)
    return collection_rights.status == COLLECTION_STATUS_PUBLIC


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

    def _has_viewing_rights(self, rights_object, private_status):
        return (rights_object.status != private_status or
                self.user_id in rights_object.viewer_ids or
                self.user_id in rights_object.editor_ids or
                self.user_id in rights_object.owner_ids)

    def _can_play(self, rights_object, private_status):
        if rights_object.status == private_status:
            return (self._has_viewing_rights(rights_object, private_status)
                    or rights_object.viewable_if_private
                    or self.is_moderator())
        else:
            return True

    def _can_edit(self, rights_object, private_status):
        return (
            self._has_editing_rights(rights_object) or (
                self.is_moderator() and rights_object.status != private_status
            )
        )

    def _can_delete(self, rights_object, private_status, public_status):
        is_deleting_own_private_object = (
            rights_object.status == private_status and
            self._is_owner(rights_object)
        )

        is_moderator_deleting_public_object = (
            rights_object.status == public_status and
            self.is_moderator()
        )

        return (
            is_deleting_own_private_object or
            is_moderator_deleting_public_object)

    def is_owner_of_exploration(self, exploration_id):
        try:
            exp_rights = get_exploration_rights(exploration_id)
        except Exception:
            return False
        return self._is_owner(exp_rights)

    def has_exploration_editing_rights(self, exploration_id):
        """Whether this user has editing rights for this exploration.

        This is true if the exploration is community-owned, or if the user is
        in the owner/editor list for the exploration.
        """
        try:
            exp_rights = get_exploration_rights(exploration_id)
        except Exception:
            return False
        return self._has_editing_rights(exp_rights)

    def has_exploration_viewing_rights(self, exploration_id):
        try:
            exp_rights = get_exploration_rights(exploration_id)
        except Exception:
            return False
        return self._has_viewing_rights(exp_rights, EXPLORATION_STATUS_PRIVATE)

    def can_play_exploration(self, exploration_id):
        """Whether the user can play the reader view of this exploration."""
        try:
            exp_rights = get_exploration_rights(exploration_id)
        except Exception:
            return False
        return self._can_play(exp_rights, EXPLORATION_STATUS_PRIVATE)

    def can_view_exploration(self, exploration_id):
        """Whether the user can view the editor page for this exploration."""
        return self.can_play_exploration(exploration_id)

    def can_edit_exploration(self, exploration_id):
        # TODO(sll): Add a check here for whether a user is banned or not,
        # rather than having this check in the controller.
        exp_rights = get_exploration_rights(exploration_id)
        return self._can_edit(exp_rights, EXPLORATION_STATUS_PRIVATE)

    def can_delete_exploration(self, exploration_id):
        try:
            exp_rights = get_exploration_rights(exploration_id)
        except Exception:
            return False
        return self._can_delete(
            exp_rights, EXPLORATION_STATUS_PRIVATE, EXPLORATION_STATUS_PUBLIC)

    def can_change_private_exploration_viewability(self, exploration_id):
        """Note that this requires the exploration in question
        to be private.
        """
        return self.can_publish_exploration(exploration_id)

    def can_publish_exploration(self, exploration_id):
        if exp_domain.Exploration.is_demo_exploration_id(exploration_id):
            # Demo explorations are public by default.
            return True

        try:
            exp_rights = get_exploration_rights(exploration_id)
        except Exception:
            return False

        if exp_rights.status != EXPLORATION_STATUS_PRIVATE:
            return False
        if exp_rights.cloned_from:
            return False

        return self.is_owner_of_exploration(exploration_id) or self.is_admin()

    def can_unpublish_exploration(self, exploration_id):
        try:
            exp_rights = get_exploration_rights(exploration_id)
        except Exception:
            return False

        if exp_rights.status != EXPLORATION_STATUS_PUBLIC:
            return False
        if exp_rights.community_owned:
            return False
        return self.is_moderator()

    def can_modify_exploration_roles(self, exploration_id):
        try:
            exp_rights = get_exploration_rights(exploration_id)
        except Exception:
            return False

        if exp_rights.community_owned or exp_rights.cloned_from:
            return False
        return self.is_admin() or self.is_owner_of_exploration(exploration_id)

    def can_release_ownership_of_exploration(self, exploration_id):
        try:
            exp_rights = get_exploration_rights(exploration_id)
        except Exception:
            return False

        if exp_rights.status == EXPLORATION_STATUS_PRIVATE:
            return False
        return self.can_modify_exploration_roles(exploration_id)

    def can_publicize_exploration(self, exploration_id):
        try:
            exp_rights = get_exploration_rights(exploration_id)
        except Exception:
            return False

        if exp_rights.status != EXPLORATION_STATUS_PUBLIC:
            return False
        return self.is_moderator()

    def can_unpublicize_exploration(self, exploration_id):
        try:
            exp_rights = get_exploration_rights(exploration_id)
        except Exception:
            return False

        if exp_rights.status != EXPLORATION_STATUS_PUBLICIZED:
            return False
        return self.is_moderator()

    def is_owner_of_collection(self, collection_id):
        try:
            collection_rights = get_collection_rights(collection_id)
        except Exception:
            return False
        return self._is_owner(collection_rights)

    def has_collection_editing_rights(self, collection_id):
        """Whether this user has editing rights for this collection.

        This is true if the collection is community-owned, or if the user is
        in the owner/editor list for the collection.
        """
        try:
            collection_rights = get_collection_rights(collection_id)
        except Exception:
            return False
        return self._has_editing_rights(collection_rights)

    def has_collection_viewing_rights(self, collection_id):
        try:
            collection_rights = get_collection_rights(collection_id)
        except Exception:
            return False
        return self._has_viewing_rights(
            collection_rights, COLLECTION_STATUS_PRIVATE)

    def can_play_collection(self, collection_id):
        """Whether the user can play the reader view of this collection."""
        try:
            collection_rights = get_collection_rights(collection_id)
        except Exception:
            return False
        return self._can_play(collection_rights, COLLECTION_STATUS_PRIVATE)

    def can_view_collection(self, collection_id):
        """Whether the user can view the editor page for this collection."""
        return self.can_play_collection(collection_id)

    def can_edit_collection(self, collection_id):
        # TODO(sll): Add a check here for whether a user is banned or not,
        # rather than having this check in the controller.
        collection_rights = get_collection_rights(collection_id)
        return self._can_edit(collection_rights, COLLECTION_STATUS_PRIVATE)

    def can_delete_collection(self, collection_id):
        try:
            collection_rights = get_collection_rights(collection_id)
        except Exception:
            return False
        return self._can_delete(
            collection_rights, COLLECTION_STATUS_PRIVATE,
            COLLECTION_STATUS_PUBLIC)

    def can_change_private_collection_viewability(self, collection_id):
        """Note that this requires the collection in question
        to be private.
        """
        return self.can_publish_collection(collection_id)

    def can_publish_collection(self, collection_id):
        if collection_domain.Collection.is_demo_collection_id(collection_id):
            # Demo collections are public by default.
            return True

        try:
            collection_rights = get_collection_rights(collection_id)
        except Exception:
            return False

        if collection_rights.status != COLLECTION_STATUS_PRIVATE:
            return False

        return self.is_owner_of_collection(collection_id) or self.is_admin()

    def can_unpublish_collection(self, collection_id):
        try:
            collection_rights = get_collection_rights(collection_id)
        except Exception:
            return False

        if collection_rights.status != COLLECTION_STATUS_PUBLIC:
            return False
        if collection_rights.community_owned:
            return False
        return self.is_moderator()

    def can_modify_collection_roles(self, collection_id):
        try:
            collection_rights = get_collection_rights(collection_id)
        except Exception:
            return False

        if collection_rights.community_owned:
            return False
        return self.is_admin() or self.is_owner_of_collection(collection_id)

    def can_release_ownership_of_collection(self, collection_id):
        try:
            collection_rights = get_collection_rights(collection_id)
        except Exception:
            return False

        if collection_rights.status == COLLECTION_STATUS_PRIVATE:
            return False
        return self.can_modify_collection_roles(collection_id)

    def can_publicize_collection(self, collection_id):
        try:
            collection_rights = get_collection_rights(collection_id)
        except Exception:
            return False

        if collection_rights.status != COLLECTION_STATUS_PUBLIC:
            return False
        return self.is_moderator()

    def can_unpublicize_collection(self, collection_id):
        try:
            collection_rights = get_collection_rights(collection_id)
        except Exception:
            return False

        if collection_rights.status != COLLECTION_STATUS_PUBLICIZED:
            return False
        return self.is_moderator()


def _assign_role(
        committer_id, object_rights, assignee_id, new_role, object_name,
        private_status):
    assignee_username = user_services.get_username(assignee_id)
    old_role = ROLE_NONE

    if new_role == ROLE_OWNER:
        if Actor(assignee_id)._is_owner(object_rights):
            raise Exception('This user already owns this %s.' % object_name)

        object_rights.owner_ids.append(assignee_id)

        if assignee_id in object_rights.viewer_ids:
            object_rights.viewer_ids.remove(assignee_id)
            old_role = ROLE_VIEWER
        if assignee_id in object_rights.editor_ids:
            object_rights.editor_ids.remove(assignee_id)
            old_role = ROLE_EDITOR

    elif new_role == ROLE_EDITOR:
        if Actor(assignee_id)._has_editing_rights(object_rights):
            raise Exception(
                'This user already can edit this %s.'  % object_name)

        if object_rights.community_owned:
            raise Exception(
                'Community-owned %ss can be edited by anyone.' % object_name)

        object_rights.editor_ids.append(assignee_id)

        if assignee_id in object_rights.viewer_ids:
            object_rights.viewer_ids.remove(assignee_id)
            old_role = ROLE_VIEWER

    elif new_role == ROLE_VIEWER:
        if Actor(assignee_id)._has_viewing_rights(
                object_rights, private_status):
            raise Exception(
                'This user already can view this %s.' % object_name)

        if object_rights.status != private_status:
            raise Exception(
                'Public %ss can be viewed by anyone.' % object_name)

        object_rights.viewer_ids.append(assignee_id)

    else:
        raise Exception('Invalid role: %s' % new_role)

    return {
        'commit_message': 'Changed role of %s from %s to %s' % (
            assignee_username, old_role, new_role),
        'commit_cmds': [{
            'cmd': CMD_CHANGE_ROLE,
            'assignee_id': assignee_id,
            'old_role': old_role,
            'new_role': new_role
        }]
    }


def _release_ownership(commiter_id, rights_object):
    rights_object.community_owned = True
    rights_object.owner_ids = []
    rights_object.editor_ids = []
    rights_object.viewer_ids = []


# Rights functions for explorations.
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
    if not Actor(committer_id).can_modify_exploration_roles(exploration_id):
        logging.error(
            'User %s tried to allow user %s to be a(n) %s of exploration %s '
            'but was refused permission.' % (
                committer_id, assignee_id, new_role, exploration_id))
        raise Exception(
            'UnauthorizedUserException: Could not assign new role.')

    exp_rights = get_exploration_rights(exploration_id)
    results = _assign_role(
        committer_id, exp_rights, assignee_id, new_role, 'Exploration',
        EXPLORATION_STATUS_PRIVATE)
    commit_message = results['commit_message']
    commit_cmds = results['commit_cmds']

    _save_exploration_rights(
        committer_id, exp_rights, commit_message, commit_cmds)

    if new_role in [ROLE_OWNER, ROLE_EDITOR]:
        subscription_services.subscribe_to_activity(
            assignee_id, exploration_id)


def release_ownership_of_exploration(committer_id, exploration_id):
    """Releases ownership of an exploration to the community.

    Commits changes.
    """
    if not Actor(committer_id).can_release_ownership_of_exploration(
            exploration_id):
        logging.error(
            'User %s tried to release ownership of exploration %s but was '
            'refused permission.' % (committer_id, exploration_id))
        raise Exception(
            'The ownership of this exploration cannot be released.')

    exploration_rights = get_exploration_rights(exploration_id)
    _release_ownership(committer_id, exploration_rights)
    commit_cmds = [{
        'cmd': CMD_RELEASE_OWNERSHIP,
    }]

    _save_exploration_rights(
        committer_id, exploration_rights,
        'Exploration ownership released to the community.', commit_cmds)


def _change_exploration_status(
        committer_id, exploration_id, new_status, commit_message):
    """Change the status of an exploration. Commits changes.

    Args:
    - committer_id: str. The id of the user who is performing the update
        action.
    - exploration_id: str. The exploration id.
    - new_status: str. The new status of the exploration.
    - commit_message: str. The human-written commit message for this change.
    """
    exploration_rights = get_exploration_rights(exploration_id)
    old_status = exploration_rights.status
    exploration_rights.status = new_status
    commit_cmds = [{
        'cmd': CMD_CHANGE_EXPLORATION_STATUS,
        'old_status': old_status,
        'new_status': new_status
    }]

    if new_status != EXPLORATION_STATUS_PRIVATE:
        exploration_rights.viewer_ids = []

    _save_exploration_rights(
        committer_id, exploration_rights, commit_message, commit_cmds)
    event_services.ExplorationStatusChangeEventHandler.record(exploration_id)


def set_private_viewability(committer_id, exploration_id, viewable_if_private):
    """Sets the viewable_if_private attribute for an exploration's rights
    object. If viewable_if_private is True, this allows an private exploration
    to be viewed by anyone with the link.
    """
    if not Actor(committer_id).can_change_private_exploration_viewability(
            exploration_id):
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

    _save_exploration_rights(
        committer_id, exploration_rights, commit_message, commit_cmds)


def publish_exploration(committer_id, exploration_id):
    """Publish an exploration. Commits changes.

    It is the responsibility of the caller to check that the exploration is
    valid prior to publication.
    """
    if not Actor(committer_id).can_publish_exploration(exploration_id):
        logging.error(
            'User %s tried to publish exploration %s but was refused '
            'permission.' % (committer_id, exploration_id))
        raise Exception('This exploration cannot be published.')

    _change_exploration_status(
        committer_id, exploration_id, EXPLORATION_STATUS_PUBLIC,
        'Exploration published.')


def unpublish_exploration(committer_id, exploration_id):
    """Unpublishes an exploration. Commits changes."""
    if not Actor(committer_id).can_unpublish_exploration(exploration_id):
        logging.error(
            'User %s tried to unpublish exploration %s but was refused '
            'permission.' % (committer_id, exploration_id))
        raise Exception('This exploration cannot be unpublished.')

    _change_exploration_status(
        committer_id, exploration_id, EXPLORATION_STATUS_PRIVATE,
        'Exploration unpublished.')


def publicize_exploration(committer_id, exploration_id):
    """Publicizes an exploration. Commits changes.

    It is the responsibility of the caller to check that the exploration is
    valid prior to publicizing it.
    """
    if not Actor(committer_id).can_publicize_exploration(exploration_id):
        logging.error(
            'User %s tried to publicize exploration %s but was refused '
            'permission.' % (committer_id, exploration_id))
        raise Exception('This exploration cannot be marked as "featured".')

    _change_exploration_status(
        committer_id, exploration_id, EXPLORATION_STATUS_PUBLICIZED,
        'Exploration publicized.')


def unpublicize_exploration(committer_id, exploration_id):
    """Unpublicizes an exploration. Commits changes."""
    if not Actor(committer_id).can_unpublicize_exploration(exploration_id):
        logging.error(
            'User %s tried to unpublicize exploration %s but was refused '
            'permission.' % (committer_id, exploration_id))
        raise Exception('This exploration cannot be unmarked as "featured".')

    _change_exploration_status(
        committer_id, exploration_id, EXPLORATION_STATUS_PUBLIC,
        'Exploration unpublicized.')


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
    if not Actor(committer_id).can_modify_collection_roles(collection_id):
        logging.error(
            'User %s tried to allow user %s to be a(n) %s of collection %s '
            'but was refused permission.' % (
                committer_id, assignee_id, new_role, collection_id))
        raise Exception(
            'UnauthorizedUserException: Could not assign new role.')

    collection_rights = get_collection_rights(collection_id)
    results = _assign_role(
        committer_id, collection_rights, assignee_id, new_role, 'Collection',
        COLLECTION_STATUS_PRIVATE)
    commit_message = results['commit_message']
    commit_cmds = results['commit_cmds']

    _save_collection_rights(
        committer_id, collection_rights, commit_message, commit_cmds)

    if new_role in [ROLE_OWNER, ROLE_EDITOR]:
        subscription_services.subscribe_to_collection(
            assignee_id, collection_id)

def release_ownership_of_collection(committer_id, collection_id):
    """Releases ownership of an collection to the community.

    Commits changes.
    """
    if not Actor(committer_id).can_release_ownership_of_collection(
            collection_id):
        logging.error(
            'User %s tried to release ownership of collection %s but was '
            'refused permission.' % (committer_id, collection_id))
        raise Exception(
            'The ownership of this collection cannot be released.')

    collection_rights = get_collection_rights(collection_id)
    _release_ownership(committer_id, collection_rights)
    commit_cmds = [{
        'cmd': CMD_RELEASE_OWNERSHIP,
    }]

    _save_collection_rights(
        committer_id, collection_rights,
        'Collection ownership released to the community.', commit_cmds)


def _change_collection_status(
        committer_id, collection_id, new_status, commit_message):
    """Change the status of an collection. Commits changes.

    Args:
    - committer_id: str. The id of the user who is performing the update
        action.
    - collection_id: str. The collection id.
    - new_status: str. The new status of the collection.
    - commit_message: str. The human-written commit message for this change.
    """
    collection_rights = get_collection_rights(collection_id)
    old_status = collection_rights.status
    collection_rights.status = new_status
    commit_cmds = [{
        'cmd': CMD_CHANGE_COLLECTION_STATUS,
        'old_status': old_status,
        'new_status': new_status
    }]

    if new_status != COLLECTION_STATUS_PRIVATE:
        collection_rights.viewer_ids = []

    _save_collection_rights(
        committer_id, collection_rights, commit_message, commit_cmds)
    event_services.CollectionStatusChangeEventHandler.record(collection_id)


def publish_collection(committer_id, collection_id):
    """Publish an collection. Commits changes.

    It is the responsibility of the caller to check that the collection is
    valid prior to publication.
    """
    if not Actor(committer_id).can_publish_collection(collection_id):
        logging.error(
            'User %s tried to publish collection %s but was refused '
            'permission.' % (committer_id, collection_id))
        raise Exception('This collection cannot be published.')

    _change_collection_status(
        committer_id, collection_id, COLLECTION_STATUS_PUBLIC,
        'Collection published.')


def unpublish_collection(committer_id, collection_id):
    """Unpublishes an collection. Commits changes."""
    if not Actor(committer_id).can_unpublish_collection(collection_id):
        logging.error(
            'User %s tried to unpublish collection %s but was refused '
            'permission.' % (committer_id, collection_id))
        raise Exception('This collection cannot be unpublished.')

    _change_collection_status(
        committer_id, collection_id, COLLECTION_STATUS_PRIVATE,
        'Collection unpublished.')


def publicize_collection(committer_id, collection_id):
    """Publicizes an collection. Commits changes.

    It is the responsibility of the caller to check that the collection is
    valid prior to publicizing it.
    """
    if not Actor(committer_id).can_publicize_collection(collection_id):
        logging.error(
            'User %s tried to publicize collection %s but was refused '
            'permission.' % (committer_id, collection_id))
        raise Exception('This collection cannot be marked as "featured".')

    _change_collection_status(
        committer_id, collection_id, COLLECTION_STATUS_PUBLICIZED,
        'Collection publicized.')


def unpublicize_collection(committer_id, collection_id):
    """Unpublicizes an collection. Commits changes."""
    if not Actor(committer_id).can_unpublicize_collection(collection_id):
        logging.error(
            'User %s tried to unpublicize collection %s but was refused '
            'permission.' % (committer_id, collection_id))
        raise Exception('This collection cannot be unmarked as "featured".')

    _change_collection_status(
        committer_id, collection_id, COLLECTION_STATUS_PUBLIC,
        'Collection unpublicized.')
