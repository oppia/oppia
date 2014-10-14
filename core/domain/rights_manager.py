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
from core.domain import event_services
from core.domain import exp_domain
from core.domain import subscription_services
from core.domain import user_services
from core.platform import models
current_user_services = models.Registry.import_current_user_services()
(exp_models,) = models.Registry.import_models([models.NAMES.exploration])
import feconf
import utils


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

ROLE_ADMIN = 'admin'
ROLE_MODERATOR = 'moderator'


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
                'viewer_names': []
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
            }


def _get_exploration_rights_from_model(exploration_rights_model):
    return ExplorationRights(
        exploration_rights_model.id,
        exploration_rights_model.owner_ids,
        exploration_rights_model.editor_ids,
        exploration_rights_model.viewer_ids,
        community_owned=exploration_rights_model.community_owned,
        cloned_from=exploration_rights_model.cloned_from,
        status=exploration_rights_model.status
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
        status=exploration_rights.status
    ).commit(committer_id, 'Created new exploration', commit_cmds)

    subscription_services.subscribe_to_activity(
        committer_id, exploration_id)


def get_exploration_rights(exploration_id):
    """Retrieves the rights for this exploration from the datastore."""
    model = exp_models.ExplorationRightsModel.get(exploration_id)
    if model is None:
        raise Exception('This exploration does not exist.')
    return _get_exploration_rights_from_model(model)


def get_public_exploration_rights():
    """Returns a list of rights domain objects for public explorations."""
    return [_get_exploration_rights_from_model(model) for model in
            exp_models.ExplorationRightsModel.get_public()]


def get_publicized_exploration_rights():
    """Returns a list of rights domain objects for publicized explorations."""
    return [_get_exploration_rights_from_model(model) for model in
            exp_models.ExplorationRightsModel.get_publicized()]


def get_non_private_exploration_rights():
    """Returns a list of rights domain objects for non-private explorations."""
    return [_get_exploration_rights_from_model(model) for model in
            exp_models.ExplorationRightsModel.get_non_private()]


def get_page_of_non_private_exploration_rights(
        page_size=feconf.DEFAULT_PAGE_SIZE, cursor=None):
    """Returns a page of rights domain objects non-private explorations."""
    results, cursor, more = exp_models.ExplorationRightsModel.get_page_of_non_private_exploration_rights(
        page_size=page_size, cursor=cursor
    )
    return [_get_exploration_rights_from_model(result) for result in results], cursor, more


def get_community_owned_exploration_rights():
    """Returns a list of rights objects for community-owned explorations."""
    return [_get_exploration_rights_from_model(model) for model in
            exp_models.ExplorationRightsModel.get_community_owned()]


def get_at_least_editable_exploration_rights(user_id):
    """Returns rights objects for all explorations that this user edits or
    owns."""
    return [_get_exploration_rights_from_model(model) for model in
            exp_models.ExplorationRightsModel.get_at_least_editable(user_id)]


def get_private_at_least_viewable_exploration_rights(user_id):
    """Returns rights objects for all private explorations that this user can
    view, edit or own."""
    return [_get_exploration_rights_from_model(model) for model in
            exp_models.ExplorationRightsModel.get_private_at_least_viewable(
                user_id)]


def get_viewable_exploration_rights(user_id):
    """Returns rights objects for some explorations viewable by this user.

    These explorations have the user explicitly listed in the viewer_ids field.
    This means that the user can view this exploration, but is not an owner of
    it, and cannot edit it.

    There may be other explorations that this user can view -- namely, those
    that he/she owns or is allowed to edit -- that are not returned by this
    query.
    """
    return [_get_exploration_rights_from_model(model) for model in
            exp_models.ExplorationRightsModel.get_viewable(user_id)]


def is_exploration_private(exploration_id):
    exploration_rights = get_exploration_rights(exploration_id)
    return exploration_rights.status == EXPLORATION_STATUS_PRIVATE


def is_exploration_public(exploration_id):
    exploration_rights = get_exploration_rights(exploration_id)
    return exploration_rights.status == EXPLORATION_STATUS_PUBLIC


def is_exploration_cloned(exploration_id):
    exploration_rights = get_exploration_rights(exploration_id)
    return bool(exploration_rights.cloned_from)


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

    def is_owner(self, exploration_id):
        try:
            exp_rights = get_exploration_rights(exploration_id)
        except Exception:
            return False

        return (
            exp_rights.community_owned or self.user_id in exp_rights.owner_ids)

    def has_explicit_editing_rights(self, exploration_id):
        """Whether this user has editing rights for this exploration.

        This is true if the exploration is community-owned, or if the user is
        in the owner/editor list for the exploration.
        """
        try:
            exp_rights = get_exploration_rights(exploration_id)
        except Exception:
            return False

        return (exp_rights.community_owned or
                self.user_id in exp_rights.editor_ids or
                self.user_id in exp_rights.owner_ids)

    def has_explicit_viewing_rights(self, exploration_id):
        try:
            exp_rights = get_exploration_rights(exploration_id)
        except Exception:
            return False

        return (exp_rights.status != EXPLORATION_STATUS_PRIVATE or
                self.user_id in exp_rights.viewer_ids or
                self.user_id in exp_rights.editor_ids or
                self.user_id in exp_rights.owner_ids)

    def can_play(self, exploration_id):
        """Whether the user can play the reader view of this exploration."""
        try:
            exp_rights = get_exploration_rights(exploration_id)
        except Exception:
            return False

        if exp_rights.status == EXPLORATION_STATUS_PRIVATE:
            return (self.has_explicit_viewing_rights(exploration_id)
                    or self.is_moderator())
        else:
            return True

    def can_view(self, exploration_id):
        """Whether the user can view the editor page for this exploration."""
        return self.can_play(exploration_id)

    def can_edit(self, exploration_id):
        # TODO(sll): Add a check here for whether a user is banned or not,
        # rather than having this check in the controller.
        exp_rights = get_exploration_rights(exploration_id)
        return (
            self.has_explicit_editing_rights(exploration_id) or (
                self.is_moderator() and
                exp_rights.status != EXPLORATION_STATUS_PRIVATE
            )
        )

    def can_accept_submitted_change(self, exploration_id):
        return self.can_edit(exploration_id)

    def can_delete(self, exploration_id):
        try:
            exp_rights = get_exploration_rights(exploration_id)
        except Exception:
            return False

        is_deleting_own_private_exploration = (
            exp_rights.status == EXPLORATION_STATUS_PRIVATE and
            self.is_owner(exploration_id)
        )

        is_moderator_deleting_public_exploration = (
            exp_rights.status == EXPLORATION_STATUS_PUBLIC and
            self.is_moderator()
        )

        return (
            is_deleting_own_private_exploration or
            is_moderator_deleting_public_exploration)

    def can_publish(self, exploration_id):
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

        return self.is_owner(exploration_id) or self.is_admin()

    def can_unpublish(self, exploration_id):
        try:
            exp_rights = get_exploration_rights(exploration_id)
        except Exception:
            return False

        if exp_rights.status != EXPLORATION_STATUS_PUBLIC:
            return False
        if exp_rights.community_owned:
            return False
        return self.is_moderator()

    def can_modify_roles(self, exploration_id):
        try:
            exp_rights = get_exploration_rights(exploration_id)
        except Exception:
            return False

        if exp_rights.community_owned or exp_rights.cloned_from:
            return False
        return self.is_admin() or self.is_owner(exploration_id)

    def can_release_ownership(self, exploration_id):
        try:
            exp_rights = get_exploration_rights(exploration_id)
        except Exception:
            return False

        if exp_rights.status == EXPLORATION_STATUS_PRIVATE:
            return False
        return self.can_modify_roles(exploration_id)

    def can_submit_change_for_review(self, exploration_id):
        try:
            exp_rights = get_exploration_rights(exploration_id)
        except Exception:
            return False

        if exp_rights.status == EXPLORATION_STATUS_PRIVATE:
            return self.can_edit(exploration_id)
        return True

    def can_make_minor_edit(self, exploration_id):
        return self.can_submit_change_for_review(exploration_id)

    def can_send_feedback(self, exploration_id):
        return True

    def can_publicize(self, exploration_id):
        try:
            exp_rights = get_exploration_rights(exploration_id)
        except Exception:
            return False

        if exp_rights.status != EXPLORATION_STATUS_PUBLIC:
            return False
        return self.is_moderator()

    def can_unpublicize(self, exploration_id):
        try:
            exp_rights = get_exploration_rights(exploration_id)
        except Exception:
            return False

        if exp_rights.status != EXPLORATION_STATUS_PUBLICIZED:
            return False
        return self.is_moderator()


def assign_role(committer_id, exploration_id, assignee_id, new_role):
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
        if Actor(assignee_id).has_explicit_editing_rights(exploration_id):
            raise Exception('This user already can edit this exploration.')

        exp_rights = get_exploration_rights(exploration_id)
        if exp_rights.community_owned:
            raise Exception(
                'Community-owned explorations can be edited by anyone.')

        exp_rights.editor_ids.append(assignee_id)

        if assignee_id in exp_rights.viewer_ids:
            exp_rights.viewer_ids.remove(assignee_id)
            old_role = ROLE_VIEWER

    elif new_role == ROLE_VIEWER:
        if Actor(assignee_id).has_explicit_viewing_rights(exploration_id):
            raise Exception('This user already can view this exploration.')

        exp_rights = get_exploration_rights(exploration_id)
        if exp_rights.status != EXPLORATION_STATUS_PRIVATE:
            raise Exception(
                'Public explorations can be viewed by anyone.')

        exp_rights.viewer_ids.append(assignee_id)

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

    _save_exploration_rights(
        committer_id, exp_rights, commit_message, commit_cmds)

    if new_role in [ROLE_OWNER, ROLE_EDITOR]:
        subscription_services.subscribe_to_activity(
            assignee_id, exploration_id)


def release_ownership(committer_id, exploration_id):
    """Releases ownership of an exploration to the community.

    Commits changes.
    """
    if not Actor(committer_id).can_release_ownership(exploration_id):
        logging.error(
            'User %s tried to release ownership ofexploration %s but was '
            'refused permission.' % (committer_id, exploration_id))
        raise Exception(
            'The ownership of this exploration cannot be released.')

    exploration_rights = get_exploration_rights(exploration_id)
    exploration_rights.community_owned = True
    exploration_rights.owner_ids = []
    exploration_rights.editor_ids = []
    exploration_rights.viewer_ids = []
    commit_cmds = [{
        'cmd': 'release_ownership',
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
        'cmd': 'change_exploration_status',
        'old_status': old_status,
        'new_status': new_status
    }]

    if new_status != EXPLORATION_STATUS_PRIVATE:
        exploration_rights.viewer_ids = []

    _save_exploration_rights(
        committer_id, exploration_rights, commit_message, commit_cmds)
    event_services.ExplorationStatusChangeEventHandler.record(exploration_id)


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
        'Exploration unpublished.')


def publicize_exploration(committer_id, exploration_id):
    """Publicizes an exploration. Commits changes.

    It is the responsibility of the caller to check that the exploration is
    valid prior to publicizing it.
    """
    if not Actor(committer_id).can_publicize(exploration_id):
        logging.error(
            'User %s tried to publicize exploration %s but was refused '
            'permission.' % (committer_id, exploration_id))
        raise Exception('This exploration cannot be moved out of beta.')

    _change_exploration_status(
        committer_id, exploration_id, EXPLORATION_STATUS_PUBLICIZED,
        'Exploration publicized.')


def unpublicize_exploration(committer_id, exploration_id):
    """Unpublicizes an exploration. Commits changes."""
    if not Actor(committer_id).can_unpublicize(exploration_id):
        logging.error(
            'User %s tried to unpublicize exploration %s but was refused '
            'permission.' % (committer_id, exploration_id))
        raise Exception('This exploration cannot be moved back into beta.')

    _change_exploration_status(
        committer_id, exploration_id, EXPLORATION_STATUS_PUBLIC,
        'Exploration unpublicized.')



