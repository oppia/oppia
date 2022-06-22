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

from typing import List
from typing_extensions import TypedDict


class LearnerGroupDict(TypedDict):
    """Dictionary for LearnerGroup domain object."""

    group_id: str
    title: str
    description: str
    facilitator_user_ids: List[str]
    student_user_ids: List[str]
    invited_student_user_ids: List[str]
    subtopic_page_ids: List[str]
    story_ids: List[str]


class LearnerGroup:
    """Domain object for learner group."""

    def __init__(
        self,
        group_id: str,
        title: str,
        description: str,
        facilitator_user_ids: List[str],
        student_user_ids: List[str],
        invited_student_user_ids: List[str],
        subtopic_page_ids: List[str],
        story_ids: List[str],

    ) -> None:
        """Constructs a LearnerGroup domain object.

        Attributes:
            group_id: str. The unique ID of the learner group.
            title: str. The title of the learner group.
            description: str. The description of the learner group.
            facilitator_user_ids: List[str]. The list of user ids of
                facilitators of the learner group.
            student_user_ids: List[str]. The list of user ids of students
                of the learner group.
            invited_student_user_ids: List[str]. The list of user ids of the
                users invited to join the learner group as a student.
            subtopic_page_ids: List[str]. The list of subtopic page ids that
                are part of the learner group syllabus. A subtopic page id is
                depicted as topicId:subtopicId string.
            story_ids: List[str]. The list of story ids of the learner group.
        """
        self.group_id = group_id
        self.title = title
        self.description = description
        self.facilitator_user_ids = facilitator_user_ids
        self.student_user_ids = student_user_ids
        self.invited_student_user_ids = invited_student_user_ids
        self.subtopic_page_ids = subtopic_page_ids
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
            'facilitator_user_ids': self.facilitator_user_ids,
            'student_user_ids': self.student_user_ids,
            'invited_student_user_ids': self.invited_student_user_ids,
            'subtopic_page_ids': self.subtopic_page_ids,
            'story_ids': self.story_ids
        }

    def validate(self) -> None:
        """Validates the LearnerGroup domain object.

        Raises:
            ValidationError. One or more attributes of the LearnerGroup
                are invalid.
        """

        if len(self.facilitator_user_ids) < 1:
            raise utils.ValidationError(
                'Expected learner group to have at least one facilitator.')

        invited_student_set = set(self.invited_student_user_ids)
        student_set = set(self.student_user_ids)

        if len(invited_student_set.intersection(student_set)) > 0:
            raise utils.ValidationError(
                'Learner group student cannot be invited to join the group.')

        facilitator_set = set(self.facilitator_user_ids)

        if len(facilitator_set.intersection(student_set)) > 0:
            raise utils.ValidationError(
                'Learner group facilitator cannot be a student of the group.')

        if len(facilitator_set.intersection(invited_student_set)) > 0:
            raise utils.ValidationError(
                'Learner group facilitator cannot be invited to '
                'join the group.')
