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

"""Tests for methods defined in learner group fetchers."""

from __future__ import annotations

from core.domain import learner_group_fetchers
from core.domain import learner_group_services

from core.tests import test_utils


class LearnerGroupFetchersUnitTests(test_utils.GenericTestBase):
    """Tests for skill fetchers."""

    FACILITATOR_ID = 'facilitator_user_1'
    LEARNER_ID_1 = 'learner_user_1'
    LEARNER_ID_2 = 'learner_user_2'

    def setUp(self) -> None:
        super().setUp()

        self.LEARNER_GROUP_ID = (
            learner_group_fetchers.get_new_learner_group_id()
        )

        self.learner_group = learner_group_services.create_learner_group(
            self.LEARNER_GROUP_ID, 'Learner Group Name', 'Description',
            [self.FACILITATOR_ID], [self.LEARNER_ID_1, self.LEARNER_ID_2],
            ['subtopic_id_1'], ['story_id_1'])

    def test_get_new_learner_group_id(self) -> None:
        self.assertIsNotNone(learner_group_fetchers.get_new_learner_group_id())

    def test_get_learner_group_by_id(self) -> None:
        fake_learner_group_id = 'fake_learner_group_id'
        fake_learner_group = learner_group_fetchers.get_learner_group_by_id(
            fake_learner_group_id)
        self.assertIsNone(fake_learner_group)

        learner_group = learner_group_fetchers.get_learner_group_by_id(
            self.LEARNER_GROUP_ID
        )
        # Ruling out the possibility of None for mypy type checking.
        assert learner_group is not None
        self.assertIsNotNone(learner_group)
        self.assertEqual(learner_group.group_id, self.LEARNER_GROUP_ID)

    def test_raises_error_if_learner_group_model_is_fetched_with_strict_and_invalid_id(  # pylint: disable=line-too-long
        self
    ) -> None:
        with self.assertRaisesRegex(
            Exception,
            'No LearnerGroupsUserModel exists for the user_id: invalid_id'
        ):
            learner_group_fetchers.get_learner_group_models_by_ids(
                ['invalid_id'], strict=True
            )

    def test_get_learner_groups_of_facilitator(self) -> None:
        fake_facilitator_id = 'fake_facilitator_id'
        fake_learner_groups = (
            learner_group_fetchers.get_learner_groups_of_facilitator(
                fake_facilitator_id
            )
        )
        self.assertEqual(len(fake_learner_groups), 0)

        learner_groups = (
            learner_group_fetchers.get_learner_groups_of_facilitator(
                self.FACILITATOR_ID
            )
        )
        self.assertEqual(len(learner_groups), 1)
        self.assertEqual(learner_groups[0].group_id, self.LEARNER_GROUP_ID)

    def test_can_multi_learners_share_progress(self) -> None:
        learner_group_services.add_learner_to_learner_group(
            self.LEARNER_GROUP_ID, self.LEARNER_ID_1, True)

        learner_group_services.add_learner_to_learner_group(
            self.LEARNER_GROUP_ID, self.LEARNER_ID_2, False)

        self.assertEqual(
            learner_group_fetchers.can_multi_learners_share_progress(
                [self.LEARNER_ID_1, self.LEARNER_ID_2], self.LEARNER_GROUP_ID
            ), [True, False])

    def test_get_invited_learner_groups_of_learner(self) -> None:
        fake_learner_id = 'fake_learner_id'
        learner_groups = (
            learner_group_fetchers.get_invited_learner_groups_of_learner(
                fake_learner_id
            )
        )
        self.assertEqual(len(learner_groups), 0)

        learner_groups = (
            learner_group_fetchers.get_invited_learner_groups_of_learner(
                self.LEARNER_ID_1
            )
        )
        self.assertEqual(len(learner_groups), 1)
        self.assertEqual(learner_groups[0].group_id, self.LEARNER_GROUP_ID)

    def test_get_learner_groups_joined_by_learner(self) -> None:
        learner_groups = (
            learner_group_fetchers.get_learner_groups_joined_by_learner(
                self.LEARNER_ID_1
            )
        )
        self.assertEqual(len(learner_groups), 0)

        learner_group_services.add_learner_to_learner_group(
            self.LEARNER_GROUP_ID, self.LEARNER_ID_1, True)
        learner_groups = (
            learner_group_fetchers.get_learner_groups_joined_by_learner(
                self.LEARNER_ID_1
            )
        )
        self.assertEqual(len(learner_groups), 1)
        self.assertEqual(learner_groups[0].group_id, self.LEARNER_GROUP_ID)
