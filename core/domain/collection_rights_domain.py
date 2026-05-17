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

"""Domain objects for collection rights.

Domain objects capture domain-specific logic and are agnostic of how the
objects they represent are stored. All methods and properties in this file
should therefore be independent of the specific storage models used.
"""

from __future__ import annotations

from core import utils
from core.constants import constants
from core.domain import rights_domain

from typing import List, Optional


ACTIVITY_STATUS_PRIVATE: str = constants.ACTIVITY_STATUS_PRIVATE
ACTIVITY_STATUS_PUBLIC: str = constants.ACTIVITY_STATUS_PUBLIC


class CollectionRights(rights_domain.ActivityRights):
    """Domain object for collection rights."""

    def __init__(
        self,
        collection_id: str,
        owner_ids: List[str],
        editor_ids: List[str],
        voice_artist_ids: List[str],
        viewer_ids: List[str],
        community_owned: bool = False,
        cloned_from: Optional[str] = None,
        viewable_if_private: bool = False,
        first_published_msec: Optional[float] = None,
        status: str = ACTIVITY_STATUS_PRIVATE,
    ) -> None:
        """Initializes a CollectionRights domain object.

        Args:
            collection_id: str. The collection id.
            owner_ids: list(str). User ids of collection owners.
            editor_ids: list(str). User ids of collection editors.
            voice_artist_ids: list(str). User ids of collection voice artists.
            viewer_ids: list(str). User ids of collection viewers.
            community_owned: bool. Whether the collection is community owned.
            cloned_from: Optional[str]. Source collection id if cloned.
            viewable_if_private: bool. Whether private collection is viewable
                by URL.
            first_published_msec: float|None. First publish timestamp in msec.
            status: str. Publication status of the collection.
        """
        super().__init__(
            collection_id,
            owner_ids,
            editor_ids,
            voice_artist_ids,
            viewer_ids,
            community_owned,
            cloned_from,
            status,
            viewable_if_private,
            first_published_msec,
        )

    def validate(self) -> None:
        """Validates various properties of CollectionRights.

        Raises:
            ValidationError. One or more attributes are invalid.
        """

        if not isinstance(self.community_owned, bool):
            raise utils.ValidationError(
                'Expected community_owned to be bool, received %s'
                % self.community_owned
            )

        if not isinstance(self.owner_ids, list):
            raise utils.ValidationError(
                'Expected owner_ids to be list, received %s'
                % self.owner_ids
            )

        for owner_id in self.owner_ids:
            if not isinstance(owner_id, str):
                raise utils.ValidationError(
                    'Expected each id in owner_ids to be string, '
                    'received %s' % owner_id
                )

        if not isinstance(self.editor_ids, list):
            raise utils.ValidationError(
                'Expected editor_ids to be list, received %s'
                % self.editor_ids
            )

        for editor_id in self.editor_ids:
            if not isinstance(editor_id, str):
                raise utils.ValidationError(
                    'Expected each id in editor_ids to be string, '
                    'received %s' % editor_id
                )

        if not isinstance(self.voice_artist_ids, list):
            raise utils.ValidationError(
                'Expected voice_artist_ids to be list, received %s'
                % self.voice_artist_ids
            )

        for voice_artist_id in self.voice_artist_ids:
            if not isinstance(voice_artist_id, str):
                raise utils.ValidationError(
                    'Expected each id in voice_artist_ids to be string, '
                    'received %s' % voice_artist_id
                )

        if not isinstance(self.viewer_ids, list):
            raise utils.ValidationError(
                'Expected viewer_ids to be list, received %s'
                % self.viewer_ids
            )

        for viewer_id in self.viewer_ids:
            if not isinstance(viewer_id, str):
                raise utils.ValidationError(
                    'Expected each id in viewer_ids to be string, '
                    'received %s' % viewer_id
                )

        if not isinstance(self.viewable_if_private, bool):
            raise utils.ValidationError(
                'Expected viewable_if_private to be boolean, '
                'received %s' % self.viewable_if_private
            )

        if self.status not in (
            ACTIVITY_STATUS_PRIVATE,
            ACTIVITY_STATUS_PUBLIC,
        ):
            raise utils.ValidationError(
                'Expected status to be either "%s" or "%s", '
                'received "%s"' % (
                    ACTIVITY_STATUS_PRIVATE,
                    ACTIVITY_STATUS_PUBLIC,
                    self.status,
                )
            )

        if self.first_published_msec is not None:
            if not isinstance(self.first_published_msec, float):
                raise utils.ValidationError(
                    'Expected first_published_msec to be a float, '
                    'received %s' % self.first_published_msec
                )

            if self.first_published_msec < 0:
                raise utils.ValidationError(
                    'Expected first_published_msec to be non-negative, '
                    'received %s' % self.first_published_msec
                )

        super().validate()