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

"""Tests for learner group domain objects."""

from __future__ import annotations

from core.domain import learner_group_domain
from core.tests import test_utils


class LearnerGroupTest(test_utils.GenericTestBase):
    """Tests for LearnerGroup domain object."""

    def test_initialization(self) -> None:
        learner_group = learner_group_domain.LearnerGroup(
            '3232', 'title', 'description',
            ['user_1'],
            ['user_2', 'user_3', 'user_4'],
            ['user_5', 'user_6'],
            ['subtopic_1', 'subtopic_2'],
            ['story_1', 'story_2'])

        expected_learner_group_dict = {
            'group_id': '3232',
            'title': 'title',
            'description': 'description',
            'facilitator_user_ids': ['user_1'],
            'student_user_ids': ['user_2', 'user_3', 'user_4'],
            'invited_student_user_ids': ['user_5', 'user_6'],
            'subtopic_page_ids': ['subtopic_1', 'subtopic_2'],
            'story_ids': ['story_1', 'story_2']
        }

        self.assertEqual(learner_group.group_id, '3232')
        self.assertEqual(learner_group.title, 'title')
        self.assertEqual(learner_group.description, 'description')
        self.assertEqual(learner_group.facilitator_user_ids, ['user_1'])
        self.assertEqual(
            learner_group.student_user_ids, ['user_2', 'user_3', 'user_4'])
        self.assertEqual(
            learner_group.invited_student_user_ids, ['user_5', 'user_6'])
        self.assertEqual(
            learner_group.subtopic_page_ids,
            ['subtopic_1', 'subtopic_2'])
        self.assertEqual(learner_group.story_ids, ['story_1', 'story_2'])

        self.assertEqual(
            learner_group.to_dict(),
            expected_learner_group_dict)

    def test_to_dict(self) -> None:
        learner_group = learner_group_domain.LearnerGroup(
            '3232', 'title', 'description',
            ['user_1'],
            ['user_2', 'user_3', 'user_4'],
            ['user_5', 'user_6'],
            ['subtopic_1', 'subtopic_2'],
            ['story_1', 'story_2'])

        expected_learner_group_dict = {
            'group_id': '3232',
            'title': 'title',
            'description': 'description',
            'facilitator_user_ids': ['user_1'],
            'student_user_ids': ['user_2', 'user_3', 'user_4'],
            'invited_student_user_ids': ['user_5', 'user_6'],
            'subtopic_page_ids': ['subtopic_1', 'subtopic_2'],
            'story_ids': ['story_1', 'story_2']
        }

        self.assertEqual(
            learner_group.to_dict(),
            expected_learner_group_dict)

    def test_validation(self) -> None:
        self._assert_validation_error( # type: ignore[no-untyped-call]
            learner_group_domain.LearnerGroup(
                '3232', 'title', 'description',
                [],
                ['user_2', 'user_3', 'user_4'],
                ['user_5', 'user_6'],
                ['subtopic_1', 'subtopic_2'],
                ['story_1', 'story_2']),
            'Expected learner group to have at least one facilitator.')

        self._assert_validation_error( # type: ignore[no-untyped-call]
            learner_group_domain.LearnerGroup(
                '3232', 'title', 'description',
                ['user_1'],
                ['user_2', 'user_3', 'user_5'],
                ['user_5', 'user_6'],
                ['subtopic_1', 'subtopic_2'],
                ['story_1', 'story_2']),
            'Learner group student cannot be invited to join the group.')

        self._assert_validation_error( # type: ignore[no-untyped-call]
            learner_group_domain.LearnerGroup(
                '3232', 'title', 'description',
                ['user_1'],
                ['user_1', 'user_3', 'user_4'],
                ['user_5', 'user_6'],
                ['subtopic_1', 'subtopic_2'],
                ['story_1', 'story_2']),
            'Learner group facilitator cannot be a student of the group.')

        self._assert_validation_error( # type: ignore[no-untyped-call]
            learner_group_domain.LearnerGroup(
                '3232', 'title', 'description',
                ['user_1'],
                ['user_2', 'user_3', 'user_4'],
                ['user_1', 'user_6'],
                ['subtopic_1', 'subtopic_2'],
                ['story_1', 'story_2']),
            'Learner group facilitator cannot be invited to join the group.')
