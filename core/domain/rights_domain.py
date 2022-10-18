# Copyright 2020 The Oppia Authors. All Rights Reserved.
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

"""Domain objects for rights for various user actions."""

from __future__ import annotations

from core import feconf
from core import utils
from core.constants import constants
from core.domain import change_domain

from typing import List, Optional, TypedDict

from core.domain import user_services  # pylint: disable=invalid-import-from # isort:skip

# TODO(#14537): Refactor this file and remove imports marked
# with 'invalid-import-from'.

# IMPORTANT: Ensure that all changes to how these cmds are interpreted preserve
# backward-compatibility with previous exploration snapshots in the datastore.
# Do not modify the definitions of CMD keys that already exist.
CMD_CREATE_NEW = feconf.CMD_CREATE_NEW
CMD_CHANGE_ROLE = feconf.CMD_CHANGE_ROLE
CMD_REMOVE_ROLE = feconf.CMD_REMOVE_ROLE
CMD_CHANGE_EXPLORATION_STATUS = feconf.CMD_CHANGE_EXPLORATION_STATUS
CMD_CHANGE_COLLECTION_STATUS = feconf.CMD_CHANGE_COLLECTION_STATUS
CMD_CHANGE_PRIVATE_VIEWABILITY = feconf.CMD_CHANGE_PRIVATE_VIEWABILITY
CMD_RELEASE_OWNERSHIP = feconf.CMD_RELEASE_OWNERSHIP
CMD_UPDATE_FIRST_PUBLISHED_MSEC = feconf.CMD_UPDATE_FIRST_PUBLISHED_MSEC

ACTIVITY_STATUS_PRIVATE: str = constants.ACTIVITY_STATUS_PRIVATE
ACTIVITY_STATUS_PUBLIC: str = constants.ACTIVITY_STATUS_PUBLIC

ROLE_OWNER = feconf.ROLE_OWNER
ROLE_EDITOR = feconf.ROLE_EDITOR
ROLE_VOICE_ARTIST = feconf.ROLE_VOICE_ARTIST
ROLE_VIEWER = feconf.ROLE_VIEWER
ROLE_NONE = feconf.ROLE_NONE

ASSIGN_ROLE_COMMIT_MESSAGE_TEMPLATE = 'Changed role of %s from %s to %s'
ASSIGN_ROLE_COMMIT_MESSAGE_REGEX = '^Changed role of (.*) from (.*) to (.*)$'
DEASSIGN_ROLE_COMMIT_MESSAGE_TEMPLATE = 'Remove %s from role %s'
DEASSIGN_ROLE_COMMIT_MESSAGE_REGEX = '^Remove (.*) from role (.*)$'


class ActivityRightsDict(TypedDict):
    """A dict version of ActivityRights suitable for use by the frontend."""

    cloned_from: Optional[str]
    status: str
    community_owned: bool
    owner_names: List[str]
    editor_names: List[str]
    voice_artist_names: List[str]
    viewer_names: List[str]
    viewable_if_private: bool


class ActivityRights:
    """Domain object for the rights/publication status of an activity (an
    exploration or a collection).
    """

    def __init__(
        self,
        exploration_id: str,
        owner_ids: List[str],
        editor_ids: List[str],
        voice_artist_ids: List[str],
        viewer_ids: List[str],
        community_owned: bool = False,
        cloned_from: Optional[str] = None,
        status: str = ACTIVITY_STATUS_PRIVATE,
        viewable_if_private: bool = False,
        first_published_msec: Optional[float] = None
    ) -> None:
        self.id = exploration_id
        self.owner_ids = owner_ids
        self.editor_ids = editor_ids
        self.voice_artist_ids = voice_artist_ids
        self.viewer_ids = viewer_ids
        self.community_owned = community_owned
        self.cloned_from = cloned_from
        self.status = status
        self.viewable_if_private = viewable_if_private
        self.first_published_msec = first_published_msec

    def validate(self) -> None:
        """Validates an ActivityRights object.

        Raises:
            utils.ValidationError. If any of the owners, editors, voice artists
                and viewers lists overlap, or if a community-owned exploration
                has owners, editors, voice artists or viewers specified.
        """
        if self.community_owned:
            if (self.owner_ids or self.editor_ids or self.voice_artist_ids or
                    self.viewer_ids):
                raise utils.ValidationError(
                    'Community-owned explorations should have no owners, '
                    'editors, voice artists or viewers specified.')

        if self.community_owned and self.status == ACTIVITY_STATUS_PRIVATE:
            raise utils.ValidationError(
                'Community-owned explorations cannot be private.')

        if self.status != ACTIVITY_STATUS_PRIVATE and self.viewer_ids:
            raise utils.ValidationError(
                'Public explorations should have no viewers specified.')

        owner_editor = set(self.owner_ids) & set(self.editor_ids)
        owner_voice_artist = set(self.owner_ids) & set(self.voice_artist_ids)
        owner_viewer = set(self.owner_ids) & set(self.viewer_ids)
        editor_voice_artist = set(self.editor_ids) & set(self.voice_artist_ids)
        editor_viewer = set(self.editor_ids) & set(self.viewer_ids)
        voice_artist_viewer = set(self.voice_artist_ids) & set(self.viewer_ids)
        if owner_editor:
            raise utils.ValidationError(
                'A user cannot be both an owner and an editor: %s' %
                owner_editor)
        if owner_voice_artist:
            raise utils.ValidationError(
                'A user cannot be both an owner and a voice artist: %s' %
                owner_voice_artist)
        if owner_viewer:
            raise utils.ValidationError(
                'A user cannot be both an owner and a viewer: %s' %
                owner_viewer)
        if editor_voice_artist:
            raise utils.ValidationError(
                'A user cannot be both an editor and a voice artist: %s' %
                editor_voice_artist)
        if editor_viewer:
            raise utils.ValidationError(
                'A user cannot be both an editor and a viewer: %s' %
                editor_viewer)
        if voice_artist_viewer:
            raise utils.ValidationError(
                'A user cannot be both a voice artist and a viewer: %s' %
                voice_artist_viewer)

        if not self.community_owned and len(self.owner_ids) == 0:
            raise utils.ValidationError(
                'Activity should have atleast one owner.')

    def to_dict(self) -> ActivityRightsDict:
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
                'voice_artist_names': [],
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
                'voice_artist_names': user_services.get_human_readable_user_ids(
                    self.voice_artist_ids),
                'viewer_names': user_services.get_human_readable_user_ids(
                    self.viewer_ids),
                'viewable_if_private': self.viewable_if_private,
            }

    def is_owner(self, user_id: str) -> bool:
        """Checks whether given user is owner of activity.

        Args:
            user_id: str or None. Id of the user.

        Returns:
            bool. Whether user is an activity owner.
        """
        return bool(user_id in self.owner_ids)

    def is_editor(self, user_id: str) -> bool:
        """Checks whether given user is editor of activity.

        Args:
            user_id: str or None. Id of the user.

        Returns:
            bool. Whether user is an activity editor.
        """
        return bool(user_id in self.editor_ids)

    def is_voice_artist(self, user_id: str) -> bool:
        """Checks whether given user is voice artist of activity.

        Args:
            user_id: str or None. Id of the user.

        Returns:
            bool. Whether user is an activity voice artist.
        """
        return bool(user_id in self.voice_artist_ids)

    def is_viewer(self, user_id: str) -> bool:
        """Checks whether given user is viewer of activity.

        Args:
            user_id: str or None. Id of the user.

        Returns:
            bool. Whether user is an activity viewer.
        """
        return bool(user_id in self.viewer_ids)

    def is_published(self) -> bool:
        """Checks whether activity is published.

        Returns:
            bool. Whether activity is published.
        """
        return self.status == ACTIVITY_STATUS_PUBLIC

    def is_private(self) -> bool:
        """Checks whether activity is private.

        Returns:
            bool. Whether activity is private.
        """
        return self.status == ACTIVITY_STATUS_PRIVATE

    def is_solely_owned_by_user(self, user_id: str) -> bool:
        """Checks whether the activity is solely owned by the user.

        Args:
            user_id: str. The id of the user.

        Returns:
            bool. Whether the activity is solely owned by the user.
        """
        return user_id in self.owner_ids and len(self.owner_ids) == 1

    def assign_new_role(self, user_id: str, new_role: str) -> str:
        """Assigns new role to user and removes previous role if present.

        Args:
            user_id: str. The ID of the user.
            new_role: str. The role of the user.

        Returns:
            str. The previous role of the user.

        Raises:
            Exception. If previous role is assigned again.
        """
        old_role = ROLE_NONE
        if new_role == ROLE_VIEWER:
            if self.status != ACTIVITY_STATUS_PRIVATE:
                raise Exception(
                    'Public explorations can be viewed by anyone.')

        for role, user_ids in zip(
                [ROLE_OWNER, ROLE_EDITOR, ROLE_VIEWER, ROLE_VOICE_ARTIST],
                [self.owner_ids, self.editor_ids, self.viewer_ids,
                 self.voice_artist_ids]):
            if user_id in user_ids:
                user_ids.remove(user_id)
                old_role = role

            if new_role == role and old_role != new_role:
                user_ids.append(user_id)

        if old_role == new_role:
            if old_role == ROLE_OWNER:
                raise Exception(
                    'This user already owns this exploration.')

            if old_role == ROLE_EDITOR:
                raise Exception(
                    'This user already can edit this exploration.')

            if old_role == ROLE_VOICE_ARTIST:
                raise Exception(
                    'This user already can voiceover this exploration.')

            if old_role == ROLE_VIEWER:
                raise Exception(
                    'This user already can view this exploration.')

        return old_role


class ExplorationRightsChange(change_domain.BaseChange):
    """Domain object class for an exploration rights change.

    The allowed commands, together with the attributes:
        - 'create_new'
        - 'change_role' (with assignee_id, old_role, new_role)
        - 'change_exploration_status' (with old_status, new_status)
        - 'change_private_viewability' (with
            old_viewable_if_private, new_viewable_if_private)
        - 'release_ownership'
        - 'update_first_published_msec' (with
            old_first_published_msec, new_first_published_msec)
    A role must be one of the ALLOWED_ROLES.
    A status must be one of the ALLOWED_STATUS.
    """

    ALLOWED_COMMANDS = feconf.EXPLORATION_RIGHTS_CHANGE_ALLOWED_COMMANDS


class CreateNewExplorationRightsCmd(ExplorationRightsChange):
    """Class representing the ExplorationRightsChange's
    CMD_CREATE_NEW command.
    """

    pass


class ChangeRoleExplorationRightsCmd(ExplorationRightsChange):
    """Class representing the ExplorationRightsChange's
    CMD_CHANGE_ROLE command.
    """

    assignee_id: str
    old_role: str
    new_role: str


class RemoveRoleExplorationRightsCmd(ExplorationRightsChange):
    """Class representing the ExplorationRightsChange's
    CMD_REMOVE_ROLE command.
    """

    removed_user_id: str
    old_role: str


class ChangePrivateViewabilityExplorationRightsCmd(ExplorationRightsChange):
    """Class representing the ExplorationRightsChange's
    CMD_CHANGE_PRIVATE_VIEWABILITY command.
    """

    old_viewable_if_private: bool
    new_viewable_if_private: bool


class ReleaseOwnershipExplorationRightsCmd(ExplorationRightsChange):
    """Class representing the ExplorationRightsChange's
    CMD_RELEASE_OWNERSHIP command.
    """

    pass


class UpdateFirstPublishedMsecExplorationRightsCmd(ExplorationRightsChange):
    """Class representing the ExplorationRightsChange's
    CMD_UPDATE_FIRST_PUBLISHED_MSEC command.
    """

    old_first_published_msec: float
    new_first_published_msec: float


class DeleteCommitExplorationRightsCmd(ExplorationRightsChange):
    """Class representing the ExplorationRightsChange's
    CMD_DELETE_COMMIT command.
    """

    pass


class ChangeExplorationStatus(ExplorationRightsChange):
    """Class representing the ExplorationRightsChange's
    CMD_CHANGE_EXPLORATION_STATUS command.
    """

    old_status: str
    new_Status: str


class CollectionRightsChange(change_domain.BaseChange):
    """Domain object class for an collection rights change.

    The allowed commands, together with the attributes:
        - 'create_new'
        - 'change_role' (with assignee_id, old_role, new_role)
        - 'change_collection_status' (with old_status, new_status)
        - 'change_private_viewability' (with
            old_viewable_if_private, new_viewable_if_private)
        - 'release_ownership'
        - 'update_first_published_msec' (with
            old_first_published_msec, new_first_published_msec)
    A role must be one of the ALLOWED_ROLES.
    A status must be one of the ALLOWED_STATUS.
    """

    ALLOWED_COMMANDS = feconf.COLLECTION_RIGHTS_CHANGE_ALLOWED_COMMANDS


class CreateNewCollectionRightsCmd(CollectionRightsChange):
    """Class representing the CollectionRightsChange's
    CMD_CREATE_NEW command.
    """

    pass


class ChangeRoleCollectionRightsCmd(CollectionRightsChange):
    """Class representing the CollectionRightsChange's
    CMD_CHANGE_ROLE command.
    """

    assignee_id: str
    old_role: str
    new_role: str


class RemoveRoleCollectionRightsCmd(CollectionRightsChange):
    """Class representing the CollectionRightsChange's
    CMD_REMOVE_ROLE command.
    """

    removed_user_id: str
    old_role: str


class ChangePrivateViewabilityCollectionRightsCmd(CollectionRightsChange):
    """Class representing the CollectionRightsChange's
    CMD_CHANGE_PRIVATE_VIEWABILITY command.
    """

    old_viewable_if_private: str
    new_viewable_if_private: str


class ReleaseOwnershipCollectionRightsCmd(CollectionRightsChange):
    """Class representing the CollectionRightsChange's
    CMD_RELEASE_OWNERSHIP command.
    """

    pass


class UpdateFirstPublishedMsecCollectionRightsCmd(CollectionRightsChange):
    """Class representing the CollectionRightsChange's
    CMD_UPDATE_FIRST_PUBLISHED_MSEC command.
    """

    old_first_published_msec: float
    new_first_published_msec: float


class DeleteCommitCollectionRightsCmd(CollectionRightsChange):
    """Class representing the CollectionRightsChange's
    CMD_DELETE_COMMIT command.
    """

    pass


class ChangeCollectionStatus(CollectionRightsChange):
    """Class representing the CollectionRightsChange's
    CMD_CHANGE_EXPLORATION_STATUS command.
    """

    old_status: str
    new_Status: str
