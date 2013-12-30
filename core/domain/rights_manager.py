# coding: utf-8
#
# Copyright 2013 Google Inc. All Rights Reserved.
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

from core.domain import exp_domain
from core.domain import user_services
from core.platform import models
(exp_models,) = models.Registry.import_models([models.NAMES.exploration])


# IMPORTANT: Ensure that all changes to how these cmds are interpreted preserve
# backward-compatibility with previous exploration snapshots in the datastore.
# Do not modify the definitions of CMD keys that already exist.
CMD_CREATE_NEW = 'create_new'
CMD_CHANGE_ROLE = 'change_role'
CMD_CHANGE_EXPLORATION_STATUS = 'change_exploration_status'

EXPLORATION_STATUS_PRIVATE = 'private'
EXPLORATION_STATUS_PUBLIC = 'public'
EXPLORATION_STATUS_PUBLICIZED = 'publicized'

ROLE_OWNER = 'owner'
ROLE_EDITOR = 'editor'
ROLE_VIEWER = 'viewer'
ROLE_NONE = 'none'


class ExplorationRights(object):
    """Domain object for the rights/publication status of an exploration."""

    def __init__(self, exploration_id, owner_ids, editor_ids, viewer_ids,
                 community_owned=False, cloned_from=None,
                 status=EXPLORATION_STATUS_PRIVATE):
        self.id = exploration_id
        self.owner_ids = owner_ids
        self.editor_ids = editor_ids
        self.viewer_ids = viewer_ids
        self.community_owned = community_owned
        self.cloned_from = cloned_from
        self.status = status


def _save_exploration_rights(
        committer_id, exploration_rights, commit_message, commit_cmds):
    """Saves an ExplorationRights domain object to the datastore."""
    if commit_cmds is None:
        commit_cmds = []

    model = exp_models.ExplorationRightsModel(
        id=exploration_rights.id,
        owner_ids=exploration_rights.owner_ids,
        editor_ids=exploration_rights.editor_ids,
        viewer_ids=exploration_rights.viewer_ids,
        community_owned=exploration_rights.community_owned,
        cloned_from=exploration_rights.cloned_from,
        status=exploration_rights.status
    )
    model.save(committer_id, commit_message, commit_cmds)


def create_new_exploration_rights(exploration_id, committer_id, cloned_from):
    exploration_rights = ExplorationRights(
        exploration_id, [committer_id], [], [], cloned_from=cloned_from)
    commit_cmds = [{'cmd': CMD_CREATE_NEW}]
    _save_exploration_rights(
        committer_id, exploration_rights, 'Created new exploration',
        commit_cmds)


def get_exploration_rights(exploration_id):
    """Retrieves the rights for this exploration from the datastore."""
    model = exp_models.ExplorationRightsModel.get_by_id(exploration_id)
    return ExplorationRights(
        model.id, model.owner_ids, model.editor_ids, model.viewer_ids,
        model.community_owned, model.cloned_from, model.status)


def is_exploration_public(exploration_id):
    exploration_rights = get_exploration_rights(exploration_id)
    return exploration_rights.status == EXPLORATION_STATUS_PUBLIC


def is_exploration_cloned(exploration_id):
    exploration_rights = get_exploration_rights(exploration_id)
    return bool(exploration_rights.cloned_from)


def _get_exploration_members(exploration_id):
    exploration_rights = get_exploration_rights(exploration_id)
    if exploration_rights.community_owned:
        return {
            'community_owned': True,
            'owners': [],
            'editors': [],
            'viewers': []
        }
    else:
        return {
            'community_owned': False,
            'owners': exploration_rights.owner_ids,
            'editors': exploration_rights.editor_ids,
            'viewers': exploration_rights.viewer_ids
        }


def get_human_readable_exploration_members(exploration_id):
    """Returns the exploration members, changing user_ids to usernames."""
    exploration_members = _get_exploration_members(exploration_id)
    for member_category in ['owners', 'editors', 'viewers']:
        exploration_members[member_category] = [
            user_services.convert_user_ids_to_username(member_category)
        ]
    return exploration_members


class Actor(object):
    """Domain object for a user with various rights.

    Due to GAE limitations, this class should only ever be invoked with a
    user_id that is equal to the user_id of the current request.
    """

    def __init__(self, user_id):
        # Note that this may be None.
        self.user_id = user_id

    def _is_super_admin(self):
        return user_services.is_current_user_admin(None)

    def _is_admin(self):
        return self._is_super_admin()

    def _is_moderator(self):
        return self._is_admin()

    def _is_owner(self, exploration_id):
        exp_rights = get_exploration_rights(exploration_id)
        if exp_rights.community_owned or self.user_id in exp_rights.owner_ids:
            return True
        return False

    def _is_editor(self, exploration_id):
        exp_rights = get_exploration_rights(exploration_id)
        if exp_rights.community_owned or self.user_id in exp_rights.editor_ids:
            return True
        return False

    def _is_viewer(self, exploration_id):
        exp_rights = get_exploration_rights(exploration_id)
        if exp_rights.community_owned or self.user_id in exp_rights.viewer_ids:
            return True
        return False

    def is_owner(self, exploration_id):
        return self._is_owner(exploration_id)

    def can_view(self, exploration_id):
        exp_rights = get_exploration_rights(exploration_id)
        if exp_rights.status == EXPLORATION_STATUS_PRIVATE:
            return (self._is_viewer(exploration_id) or
                    self._is_editor(exploration_id) or
                    self._is_owner(exploration_id) or self._is_admin())
        else:
            return True

    def can_clone(self, exploration_id):
        return self.user_id and self.can_view(exploration_id)

    def can_edit(self, exploration_id):
        return (self._is_editor(exploration_id) or
                self._is_owner(exploration_id) or self._is_admin())

    def can_accept_submitted_change(self, exploration_id):
        return self.can_edit(exploration_id)

    def can_delete(self, exploration_id):
        if self._is_admin():
            return True

        exp_rights = get_exploration_rights(exploration_id)
        return (exp_rights.status == EXPLORATION_STATUS_PRIVATE and
                self._is_owner(exploration_id))

    def can_publish(self, exploration_id):
        if exp_domain.Exploration.is_demo_exploration_id(exploration_id):
            # Demo explorations are public by default.
            return True

        exp_rights = get_exploration_rights(exploration_id)
        if exp_rights.status != EXPLORATION_STATUS_PRIVATE:
            return False
        if exp_rights.cloned_from:
            return False

        return self._is_owner(exploration_id) or self._is_admin()

    def can_unpublish(self, exploration_id):
        exp_rights = get_exploration_rights(exploration_id)
        if exp_rights.status != EXPLORATION_STATUS_PUBLIC:
            return False
        # TODO(sll): Deny unpublishing of the exploration if an
        # external user has edited or submitted feedback for it since
        # it was published.
        return self._is_owner(exploration_id) or self._is_admin()

    def can_modify_roles(self, exploration_id):
        return self._is_admin() or self._is_owner(exploration_id)

    def can_submit_change_for_review(self, exploration_id):
        exp_rights = get_exploration_rights(exploration_id)
        if exp_rights.status == EXPLORATION_STATUS_PRIVATE:
            return self.can_edit(exploration_id)
        return True

    def can_make_minor_edit(self, exploration_id):
        return self.can_submit_change_for_review(exploration_id)

    def can_send_feedback(self, exploration_id):
        return True

    def can_publicize(self, exploration_id):
        exp_rights = get_exploration_rights(exploration_id)
        if exp_rights.status != EXPLORATION_STATUS_PUBLIC:
            return False
        return self._is_admin()

    def can_unpublicize(self, exploration_id):
        exp_rights = get_exploration_rights(exploration_id)
        if exp_rights.status != EXPLORATION_STATUS_PUBLICIZED:
            return False
        return self._is_admin()


def assign_role(committer_id, exploration_id, assignee_id, new_role):
    """Assign `assignee_id` to the given role.

    Args:
    - committer_id: str. The user_id of the user who is performing the action.
    - exploration_id: str. The exploration id.
    - assignee_id: str. The user_id of the user whose role is being changed.
    - new_role: str. The name of the new role: either 'owner', 'editor' or
        'viewer'.
    """

    if not Actor(committer_id).can_modify_roles(exploration_id):
        logging.error(
            'User %s tried to allow user %s to be a(n) %s of exploration %s '
            'but was refused permission.' % (
                committer_id, assignee_id, new_role, exploration_id))
        raise Exception(
            'UnauthorizedUserException: Could not assign new role.')

    assignee_username = user_services.get_username(assignee_id)
    old_role = ROLE_NONE

    if new_role == ROLE_OWNER:
        if Actor(assignee_id).is_owner(exploration_id):
            raise Exception('This user already owns this exploration.')

        exp_rights = get_exploration_rights(exploration_id)
        exp_rights.owner_ids.append(assignee_id)

        if assignee_id in exp_rights.viewer_ids:
            exp_rights.viewer_ids.remove(assignee_id)
            old_role = ROLE_VIEWER
        if assignee_id in exp_rights.editor_ids:
            exp_rights.editor_ids.remove(assignee_id)
            old_role = ROLE_EDITOR

    elif new_role == ROLE_EDITOR:
        if Actor(assignee_id).can_edit(exploration_id):
            raise Exception('This user already can edit this exploration.')

        exp_rights = get_exploration_rights(exploration_id)
        exp_rights.editor_ids.append(assignee_id)

        if assignee_id in exp_rights.viewer_ids:
            exp_rights.viewer_ids.remove(assignee_id)
            old_role = ROLE_VIEWER

    elif new_role == ROLE_VIEWER:
        if Actor(assignee_id).can_view(exploration_id):
            raise Exception('This user already can view this exploration.')

        exp_rights = get_exploration_rights(exploration_id)
        exp_rights.viewer_ids.append(assignee_id)

    commit_message = 'Changed role of %s from %s to %s' % (
        assignee_username, old_role, new_role)
    commit_cmds = [{
        'cmd': CMD_CHANGE_ROLE,
        'assignee_id': assignee_id,
        'old_role': old_role,
        'new_role': new_role
    }]

    _save_exploration_rights(
        committer_id, exp_rights, commit_message, commit_cmds)


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
        'cmd': 'change_exploration_status',
        'old_status': old_status,
        'new_status': new_status
    }]

    _save_exploration_rights(
        committer_id, exploration_rights, commit_message, commit_cmds)


def publish_exploration(committer_id, exploration_id):
    """Publish an exploration. Commits changes.

    It is the responsibility of the caller to check that the exploration is
    valid prior to publication.
    """
    if not Actor(committer_id).can_publish(exploration_id):
        logging.error(
            'User %s tried to publish exploration %s but was refused '
            'permission.' % (committer_id, exploration_id))
        raise Exception('This exploration cannot be published.')

    _change_exploration_status(
        committer_id, exploration_id, EXPLORATION_STATUS_PUBLIC,
        'Exploration published.')


def unpublish_exploration(committer_id, exploration_id):
    """Unpublishes an exploration. Commits changes."""
    if not Actor(committer_id).can_unpublish(exploration_id):
        logging.error(
            'User %s tried to unpublish exploration %s but was refused '
            'permission.' % (committer_id, exploration_id))
        raise Exception('This exploration cannot be unpublished.')

    _change_exploration_status(
        committer_id, exploration_id, EXPLORATION_STATUS_PRIVATE,
        'Unpublished exploration.')
