# coding: utf-8
#
# Copyright 2022 The Oppia Authors. All Rights Reserved.
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

"""Domain objects for Learner Groups."""

from __future__ import annotations

from core import utils

from typing import List, TypedDict


class LearnerGroupDict(TypedDict):
    """Dictionary for LearnerGroup domain object."""
    
    group_id: str
    title: str
    description: str
    facilitators: List[str]
    members: List[str]
    invitations: List[str]
    subtopic_ids: List[str]
    story_ids: List[str]

class LearnerGroup:
    """Domain object for learner group."""

    def __init__(
        self,
        group_id: str,
        title: str,
        description: str,
        facilitators: List[str],
        members: List[str],
        invitations: List[str],
        subtopic_ids: List[str],
        story_ids: List[str],

    ) -> None:
        """Constructs a LearnerGroup domain object.

        Attributes:
            group_id: str. The unique ID of the learner group.
            title: str. The title of the learner group.
            description: str. The description of the learner group.
            facilitators: List[str]. The list of facilitators of the learner
                group.
            members: List[str]. The list of members of the learner group.
            invitations: List[str]. The list of invited users to the learner
                group.
            subtopic_ids: List[str]. The list of subtopic ids of the learner
                group. A subtopic id is depicted as topicId:subtopicId string.
            story_ids: List[str]. The list of story ids of the learner group.
        """
        self.group_id = group_id
        self.title = title
        self.description = description
        self.facilitators = facilitators
        self.members = members
        self.invitations = invitations
        self.subtopic_ids = subtopic_ids
        self.story_ids = story_ids

    def to_dict(self) -> LearnerGroupDict:
        """Convert the LearnerGroup domain instance into a dictionary
        form with its keys as the attributes of this class.

        Returns:
            dict. A dictionary containing the LearnerGroup class
            information in a dictionary form.
        """

        return {
            'group_id': self.group_id,
            'title': self.title,
            'description': self.description,
            'facilitators': self.facilitators,
            'members': self.members,
            'invitations': self.invitations,
            'subtopic_ids': self.subtopic_ids,
            'story_ids': self.story_ids
        }

    def validate(self) -> None:
        """Validates the LearnerGroup domain object.

        Raises:
            ValidationError. One or more attributes of the LearnerGroup
                are invalid.
        """

        if len(self.facilitators) < 1:
            raise utils.ValidationError(
                'Expected learner group to have at least one facilitator.')

        invitations_set = set(self.invitations)
        members_set = set(self.members)

        if len(invitations_set.intersection(members_set)) > 0:
            raise utils.ValidationError(
                'Learner group member and be invited to join the group.')

        facilitator_set = set(self.facilitators)

        if len(facilitator_set.intersection(members_set)) > 0:
            raise utils.ValidationError(
                'Learner group facilitator cannot be a member of the group.')

        if len(facilitator_set.intersection(invitations_set)) > 0:
            raise utils.ValidationError(
                'Learner group facilitator cannot be invited to '
                'join the group.')
