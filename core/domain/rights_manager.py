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

from core.platform import models
current_user_services = models.Registry.import_current_user_services()
(exp_models,) = models.Registry.import_models([models.NAMES.exploration])


EXPLORATION_STATUS_PRIVATE = 'private'
EXPLORATION_STATUS_TENTATIVELY_PUBLIC = 'tentatively_public'
EXPLORATION_STATUS_PUBLIC = 'public'
EXPLORATION_STATUS_PUBLICIZED = 'publicized'

ROLE_OWNER = 'owner'
ROLE_EDITOR = 'editor'
ROLE_VIEWER = 'viewer'


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


def get_exploration_rights(exploration_id):
    """Retrieves the rights for this exploration from the datastore."""
    model = exp_models.ExplorationRightsModel.get_by_id(exploration_id)
    return ExplorationRights(
        model.id, model.owner_ids, model.editor_ids, model.viewer_ids,
        model.community_owned, model.cloned_from, model.status)


def save_exploration_rights(exploration_rights):
    """Saves an ExplorationRights domain object to the datastore."""
    model = exp_models.ExplorationRightsModel(
        id=exploration_rights.id,
        owner_ids=exploration_rights.owner_ids,
        editor_ids=exploration_rights.editor_ids,
        viewer_ids=exploration_rights.viewer_ids,
        community_owned=exploration_rights.community_owned,
        cloned_from=exploration_rights.cloned_from,
        status=exploration_rights.status
    )
    model.put()


def is_exploration_public(exploration_id):
    exploration_rights = get_exploration_rights(exploration_id)
    return exploration_rights.status in [
        EXPLORATION_STATUS_PUBLIC, EXPLORATION_STATUS_TENTATIVELY_PUBLIC]


def get_exploration_members(exploration_id):
    exploration_rights = get_exploration_rights(exploration_id)
    return {
        'owners': exploration_rights.owner_ids,
        'editors': exploration_rights.editor_ids,
        'viewers': exploration_rights.viewer_ids
    }


class Actor(object):
    """Domain object for a user with various rights.

    Due to GAE limitations, this class should only ever be invoked with a
    user_id that is equal to the user_id of the current request.
    """

    def __init__(self, user_id):
        self.user_id = user_id

    def _is_super_admin(self):
        return current_user_services.is_current_user_admin(None)

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
        return self.can_view(exploration_id)

    def can_edit(self, exploration_id):
        return (self._is_editor(exploration_id) or
                self._is_owner(exploration_id) or self._is_admin())

    def can_accept_submitted_change(self, exploration_id):
        return self._is_editor(exploration_id)

    def can_delete(self, exploration_id):
        if self._is_admin():
            return True

        exp_rights = get_exploration_rights(exploration_id)
        return (exp_rights.status == EXPLORATION_STATUS_PRIVATE and
                self._is_owner(exploration_id))

    def can_publish(self, exploration_id):
        if self._is_admin():
            return True

        exp_rights = get_exploration_rights(exploration_id)
        if exp_rights.cloned_from:
            return False
        return (exp_rights.status == EXPLORATION_STATUS_PRIVATE and
                self._is_owner(exploration_id))

    def can_unpublish(self, exploration_id):
        if self._is_admin():
            return True

        exp_rights = get_exploration_rights(exploration_id)
        return (exp_rights.status == EXPLORATION_STATUS_TENTATIVELY_PUBLIC and
                self._is_owner(exploration_id))

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
        if (exp_rights.status == EXPLORATION_STATUS_PRIVATE or
                exp_rights.status == EXPLORATION_STATUS_PUBLICIZED):
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
        raise Exception(
            'UnauthorizedUserException: Could not assign new role.')

    logging.info(
        'User %s tried to allow user %s to be a(n) %s of exploration %s' % (
            committer_id, assignee_id, new_role, exploration_id))

    if new_role == ROLE_OWNER:
        if Actor(assignee_id).is_owner(exploration_id):
            raise Exception('This user already owns this exploration.')

        exp_rights = get_exploration_rights(exploration_id)
        exp_rights.owner_ids.append(assignee_id)

        if assignee_id in exp_rights.viewer_ids:
            exp_rights.viewer_ids.remove(assignee_id)
        if assignee_id in exp_rights.editor_ids:
            exp_rights.editor_ids.remove(assignee_id)

        save_exploration_rights(exp_rights)

    elif new_role == ROLE_EDITOR:
        if Actor(assignee_id).can_edit(exploration_id):
            raise Exception('This user already can edit this exploration.')

        exp_rights = get_exploration_rights(exploration_id)
        exp_rights.editor_ids.append(assignee_id)

        if assignee_id in exp_rights.viewer_ids:
            exp_rights.viewer_ids.remove(assignee_id)

        save_exploration_rights(exp_rights)

    elif new_role == ROLE_VIEWER:
        if Actor(assignee_id).can_view(exploration_id):
            raise Exception('This user already can view this exploration.')

        exp_rights = get_exploration_rights(exploration_id)
        exp_rights.viewer_ids.append(assignee_id)
        save_exploration_rights(exp_rights)

    logging.info(
        'User %s successfully made user %s into a(n) %s of exploration %s' % (
            committer_id, assignee_id, new_role, exploration_id))

    # TODO(sll): Add a version log here so that the rights history of an
    # exploration can be viewed.


def publish_exploration(committer_id, exploration_id):
    """Publish an exploration. Commits changes.

    Args:
    - committer_id: str. The id of the user who is performing the update
        action.
    - exploration_id: str. The exploration id.
    """
    if not Actor(committer_id).can_publish(exploration_id):
        raise Exception('Could not publish exploration.')

    exp_rights = get_exploration_rights(exploration_id)
    exp_rights.status = EXPLORATION_STATUS_TENTATIVELY_PUBLIC
    save_exploration_rights(exp_rights)

    logging.info(
        'User %s published exploration %s' % (committer_id, exploration_id))


def unpublish_exploration(committer_id, exploration_id):
    """Unpublishes an exploration. Commits changes.

    Args:
    - committer_id: str. The id of the user who is performing the update
        action.
    - exploration_id: str. The exploration id.
    """
    if not Actor(committer_id).can_unpublish(exploration_id):
        raise Exception('Could not unpublish exploration.')

    exp_rights = get_exploration_rights(exploration_id)
    exp_rights.status = EXPLORATION_STATUS_PRIVATE
    save_exploration_rights(exp_rights)

    logging.info(
        'User %s unpublished exploration %s' % (committer_id, exploration_id))
