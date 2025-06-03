# coding: utf-8
#
# Copyright 2025 The Oppia Authors. All Rights Reserved.
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

"""Domain objects for an exploration rights.

Domain objects capture domain-specific logic and are agnostic of how the
objects they represent are stored. All methods and properties in this file
should therefore be independent of the specific storage models used.
"""

from __future__ import annotations

from core import feconf
from core import utils
from core.constants import constants
from core.domain import rights_domain

from typing import List, Optional

from core.platform import models  # pylint: disable=invalid-import-from # isort:skip

# TODO(#14537): Refactor this file and remove imports marked
# with 'invalid-import-from'.

(exp_models,) = models.Registry.import_models([models.Names.EXPLORATION])

ACTIVITY_STATUS_PRIVATE: str = constants.ACTIVITY_STATUS_PRIVATE
ACTIVITY_STATUS_PUBLIC: str = constants.ACTIVITY_STATUS_PUBLIC

ROLE_OWNER = feconf.ROLE_OWNER
ROLE_EDITOR = feconf.ROLE_EDITOR
ROLE_VOICE_ARTIST = feconf.ROLE_VOICE_ARTIST
ROLE_VIEWER = feconf.ROLE_VIEWER
ROLE_NONE = feconf.ROLE_NONE


class ExplorationRights(rights_domain.ActivityRights):
    """Domain object for an Oppia exploration rights."""

    def __init__(
        self,
        exploration_id: str,
        owner_ids: List[str],
        editor_ids: List[str],
        voice_artist_ids: List[str],
        viewer_ids: List[str],
        community_owned: bool = False,
        cloned_from: Optional[str] = None,
        viewable_if_private: bool = False,
        first_published_msec: Optional[float] = None,
        status: str = ACTIVITY_STATUS_PRIVATE,
        deleted: bool = False
    ) -> None:
        """Initializes a ExplorationRights domain object.

        Args:
            exploration_id: str. The exploration id.
            owner_ids: list(str). List of the users ids who are the owners of
                this exploration.
            editor_ids: list(str). List of the users ids who have access to
                edit this exploration.
            voice_artist_ids: list(str). List of the users ids who have access
                to voiceover this exploration.
            viewer_ids: list(str). List of the users ids who have access to
                view this exploration.
            community_owned: bool. Whether the exploration is community-owned.
            cloned_from: Optional[str]. The exploration id which this
                exploration was cloned from. If None, this exploration was
                created from scratch.
            viewable_if_private: bool. For private explorations, whether this
                exploration can be viewed by anyone who has the URL. If the
                exploration is not private, this setting is ignored.
            first_published_msec: float|None. Time in milliseconds since the
                Epoch, when the exploration was first published, or None if
                Exploration is not published yet.
            status: Literal['private', 'public']. The publication status
                of this exploration.
            deleted: bool. Whether the exploration is marked as deleted.
        """
        super().__init__(
            exploration_id,
            owner_ids,
            editor_ids,
            voice_artist_ids,
            viewer_ids,
            community_owned,
            cloned_from,
            status,
            viewable_if_private,
            first_published_msec
        )
        self.deleted = deleted

    def validate(self) -> None:
        """Validates various properties of the ExplorationRights.

        Raises:
            ValidationError. One or more attributes of the ExplorationRights
                are invalid. If any of the owners, editors, voice artists
                and viewers lists overlap, or if a community-owned exploration
                has owners, editors, voice artists or viewers specified.
        """
        if not isinstance(self.community_owned, bool):
            raise utils.ValidationError(
                'Expected community_owned to be bool, received %s' % (
                    self.community_owned))

        if not isinstance(self.owner_ids, list):
            raise utils.ValidationError(
                'Expected owner_ids to be list, received %s' % self.owner_ids)
        for owner_id in self.owner_ids:
            if not isinstance(owner_id, str):
                raise utils.ValidationError(
                    'Expected each id in owner_ids to '
                    'be string, received %s' % owner_id)

        if not isinstance(self.editor_ids, list):
            raise utils.ValidationError(
                'Expected editor_ids to be list, '
                'received %s' % self.editor_ids)
        for editor_id in self.editor_ids:
            if not isinstance(editor_id, str):
                raise utils.ValidationError(
                    'Expected each id in editor_ids to '
                    'be string, received %s' % editor_id)

        if not isinstance(self.voice_artist_ids, list):
            raise utils.ValidationError(
                'Expected voice_artist_ids to be list, received %s' % (
                    self.voice_artist_ids))
        for voice_artist_id in self.voice_artist_ids:
            if not isinstance(voice_artist_id, str):
                raise utils.ValidationError(
                    'Expected each id in voice_artist_ids to '
                    'be string, received %s' % voice_artist_id)

        if not isinstance(self.viewer_ids, list):
            raise utils.ValidationError(
                'Expected viewer_ids to be list, '
                'received %s' % self.viewer_ids)
        for viewer_id in self.viewer_ids:
            if not isinstance(viewer_id, str):
                raise utils.ValidationError(
                    'Expected each id in viewer_ids to '
                    'be string, received %s' % viewer_id)

        if not isinstance(self.viewable_if_private, bool):
            raise utils.ValidationError(
                'Expected viewable_if_private to '
                'be boolean, received %s' % self.viewable_if_private)

        if self.status not in (
            ACTIVITY_STATUS_PRIVATE, ACTIVITY_STATUS_PUBLIC):
            raise utils.ValidationError(
                'Expected status to be either "%s" or "%s", received "%s"' %
                (ACTIVITY_STATUS_PRIVATE, ACTIVITY_STATUS_PUBLIC, self.status)
            )

        if self.first_published_msec is not None:
            if not isinstance(self.first_published_msec, float):
                raise utils.ValidationError(
                    f'Expected first_published_msec to be a float, '
                    f'received {self.first_published_msec}'
                )
            if self.first_published_msec < 0:
                raise utils.ValidationError(
                    f'Expected first_published_msec to be non-negative, '
                    f'received {self.first_published_msec}'
                )

        super().validate()
